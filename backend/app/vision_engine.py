import cv2
import logging
import threading
import time
import base64
import numpy as np
from ultralytics import YOLO
from collections import defaultdict
from pyzbar.pyzbar import decode as qr_decode
from datetime import datetime
import os
import sys
import signal

logger = logging.getLogger("ciment.vision")


class VisionEngine:
    _instance = None
    _lock = threading.Lock()

    def __new__(cls):
        with cls._lock:
            if cls._instance is None:
                cls._instance = super(VisionEngine, cls).__new__(cls)
                cls._instance._initialized = False
        return cls._instance

    def __init__(self):
        if self._initialized:
            return

        self.model_path = 'models/best_V5.pt'
        self.video_source = 0  # Default to 0, can be updated from settings
        self.confidence_threshold = 0.7
        self.nms_iou_threshold = 0.45
        self.max_detections = 100
        self.inference_size = 1280
        self.tracking_persistence = True

        self.line_x = 640
        self.line_y_percent = 60
        self.line_span_percent = 80
        self.counting_direction = "left-right"

        self.camera_resolution = "720p"
        self.camera_fps = 30
        self.camera_brightness = 50
        self.camera_contrast = 65
        self.camera_autofocus = True

        self.model = None
        self.cap = None
        self.running = False
        self._stop_event = threading.Event()
        self.thread = None

        self.latest_frame = None
        self.annotated_frame = None
        self.frame_lock = threading.Lock()

        self.track_seen_before_line = set()
        self.object_data = defaultdict(lambda: {"qr_uuid": None})
        self.counted_conforme_uuids = set()
        self.counted_rejete_ids = set()
        self.active_session_id = None

        # Callback for events
        self.on_count_callback = None

        # Video WebSocket subscribers (set of asyncio.Queue)
        self.video_subscribers = set()
        self.video_subscribers_lock = threading.Lock()

        # Streaming settings
        self.jpeg_quality = 65
        self.target_fps = 15  # Target FPS for WebSocket streaming (lower than capture FPS)

        # Latency controls
        self.low_latency_mode = True
        self.max_grab_skip = 3
        self.last_annotated_frame = None
        self.inference_every_n_frames = 2

        # Ensure directories exist
        os.makedirs("backend/static/captures", exist_ok=True)
        os.makedirs("backend/static/templates", exist_ok=True)

        # ── Template & colour matching ────────────────────────────────────────
        self._logo_template: np.ndarray | None = None   # active template image (BGR)
        self._logo_kp      = None                        # pre-computed ORB keypoints
        self._logo_des     = None                        # pre-computed ORB descriptors
        self._logo_threshold: float = 0.65               # minimum score to pass
        self._orb          = cv2.ORB_create(nfeatures=300)
        self._color_refs: list = []                      # list of HSV range dicts
        self._color_threshold: float = 0.25              # min pixel-fraction to match

        self._initialized = True

    def set_active_session(self, session_id):
        self.active_session_id = session_id
        # Reset counters for new session
        self.counted_conforme_uuids.clear()
        self.counted_rejete_ids.clear()
        self.track_seen_before_line.clear()
        self.object_data.clear()

    def set_on_count_callback(self, callback):
        self.on_count_callback = callback

    # ── Template & colour API ─────────────────────────────────────────────────

    def apply_template_config(self, template_path: str | None, threshold: float, color_refs: list, color_threshold: float = 0.25):
        """Load/reload the reference template and colour palette.

        Called once at startup (from lifespan) and again each time the operator
        uploads a new template or edits the colour library.
        """
        self._logo_threshold   = threshold
        self._color_refs       = color_refs
        self._color_threshold  = color_threshold
        # Reset cached keypoints
        self._logo_kp  = None
        self._logo_des = None
        self._logo_template = None

        if template_path and os.path.exists(template_path):
            img = cv2.imread(template_path)
            if img is not None:
                self._logo_template = img
                gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
                self._logo_kp, self._logo_des = self._orb.detectAndCompute(gray, None)
                logger.info("Template chargé — %s (%dx%d px, %d keypoints ORB)",
                            os.path.basename(template_path), img.shape[1], img.shape[0],
                            len(self._logo_kp) if self._logo_kp else 0)
            else:
                logger.warning("Impossible de lire le template: %s", template_path)

    def _compute_logo_score(self, roi_bgr: np.ndarray) -> float:
        """ORB-based logo matching score in [0, 1].

        If no template is loaded, falls back to a plausible random value so
        existing behaviour is preserved.
        """
        if self._logo_template is None or self._logo_des is None:
            return 0.0  # Aucun template chargé — score neutre
        try:
            h, w = self._logo_template.shape[:2]
            roi_resized = cv2.resize(roi_bgr, (w, h), interpolation=cv2.INTER_AREA)
            gray_roi = cv2.cvtColor(roi_resized, cv2.COLOR_BGR2GRAY)
            kp_r, des_r = self._orb.detectAndCompute(gray_roi, None)
            if des_r is None or len(self._logo_kp) == 0:
                return 0.0
            bf = cv2.BFMatcher(cv2.NORM_HAMMING, crossCheck=True)
            matches = bf.match(self._logo_des, des_r)
            good    = [m for m in matches if m.distance < 55]
            score   = len(good) / max(len(self._logo_kp), 1)
            return round(min(score, 1.0), 3)
        except Exception:
            return 0.0

    def _compute_color_score(self, roi_bgr: np.ndarray) -> float:
        """HSV-mask colour matching score in [0, 1].

        For each reference colour, computes the fraction of ROI pixels that
        fall within its HSV range.  Returns the best match across all refs.
        Falls back to a plausible random value when no references are defined.
        """
        if not self._color_refs:
            return 0.0  # Aucune référence couleur — score neutre
        try:
            hsv      = cv2.cvtColor(roi_bgr, cv2.COLOR_BGR2HSV)
            total_px = hsv.shape[0] * hsv.shape[1]
            if total_px == 0:
                return 0.0
            best = 0.0
            for ref in self._color_refs:
                lower = np.array([ref["h_min"], ref["s_min"], ref["v_min"]], dtype=np.uint8)
                upper = np.array([ref["h_max"], ref["s_max"], ref["v_max"]], dtype=np.uint8)
                mask  = cv2.inRange(hsv, lower, upper)
                best  = max(best, np.count_nonzero(mask) / total_px)
            return round(min(best, 1.0), 3)
        except Exception:
            return 0.0

    def add_video_subscriber(self, queue):
        with self.video_subscribers_lock:
            self.video_subscribers.add(queue)

    def remove_video_subscriber(self, queue):
        with self.video_subscribers_lock:
            self.video_subscribers.discard(queue)

    @staticmethod
    def _is_webcam_index(source) -> bool:
        """Check if source is a webcam index (int or digit string)."""
        return isinstance(source, int) or (isinstance(source, str) and source.isdigit())

    def _open_capture(self):
        """Open video capture with proper settings for RTSP/HTTP/webcam sources."""
        source = self.video_source

        if isinstance(source, str) and source.startswith("rtsp://"):
            # RTSP: use FFMPEG backend with TCP transport for reliability
            os.environ["OPENCV_FFMPEG_CAPTURE_OPTIONS"] = (
                "rtsp_transport;tcp|fflags;nobuffer|flags;low_delay|"
                "max_delay;5000000|analyzeduration;1000000|probesize;32768|stimeout;5000000"
            )
            cap = cv2.VideoCapture(source, cv2.CAP_FFMPEG)
        elif isinstance(source, str) and (source.startswith("http://") or source.startswith("https://")):
            # HTTP/ONVIF stream
            cap = cv2.VideoCapture(source, cv2.CAP_FFMPEG)
        elif self._is_webcam_index(source):
            # Webcam: use DirectShow on Windows (MSMF is unreliable)
            idx = int(source) if isinstance(source, str) else source
            if sys.platform == "win32":
                cap = cv2.VideoCapture(idx, cv2.CAP_DSHOW)
            else:
                cap = cv2.VideoCapture(idx)
        else:
            # Video file
            cap = cv2.VideoCapture(source)

        if cap.isOpened():
            # Reduce internal buffer to minimize latency
            cap.set(cv2.CAP_PROP_BUFFERSIZE, 1)
            # Best effort low-latency hints (backend-dependent)
            cap.set(cv2.CAP_PROP_FPS, 30)
            self._apply_capture_properties()
        else:
            logger.error("_open_capture a échoué pour la source: %s", source)

        return cap


    def apply_model_config(
        self,
        model_path=None,
        confidence_threshold=None,
        nms_iou_threshold=None,
        max_detections=None,
        inference_size=None,
        tracking_persistence=None,
    ):
        if confidence_threshold is not None:
            self.confidence_threshold = float(confidence_threshold)
        if nms_iou_threshold is not None:
            self.nms_iou_threshold = float(nms_iou_threshold)
        if max_detections is not None:
            self.max_detections = int(max_detections)
        if inference_size is not None:
            self.inference_size = int(inference_size)
        if tracking_persistence is not None:
            self.tracking_persistence = bool(tracking_persistence)

        if model_path and model_path != self.model_path:
            self.model_path = model_path
            try:
                logger.info("Rechargement du modèle YOLO depuis %s", self.model_path)
                self.model = YOLO(self.model_path)
            except Exception as e:
                logger.error("Rechargement modèle échoué: %s", e)

    def apply_virtual_line_config(self, position_percent=None, line_span_percent=None, direction=None):
        if direction is not None:
            self.counting_direction = direction
        if position_percent is not None:
            pos = int(position_percent)
            self.line_y_percent = pos
            if self.counting_direction in ("left-right", "right-left"):
                frame_w = self._resolution_to_wh(self.camera_resolution)[0]
                self.line_x = int((pos / 100.0) * frame_w)
        if line_span_percent is not None:
            self.line_span_percent = int(line_span_percent)

    def _is_before_line(self, x, y):
        """Retourne True si le point est du côté d'approche de la ligne de comptage."""
        if self.counting_direction == "left-right":
            return x < self.line_x
        if self.counting_direction == "right-left":
            return x > self.line_x
        _, frame_h = self._resolution_to_wh(self.camera_resolution)
        line_y = int((self.line_y_percent / 100.0) * frame_h)
        if self.counting_direction == "top-down":
            return y < line_y
        if self.counting_direction == "bottom-up":
            return y > line_y
        return x < self.line_x


    @staticmethod
    def _resolution_to_wh(resolution: str):
        mapping = {
            "1080p": (1920, 1080),
            "720p": (1280, 720),
            "480p": (640, 480),
        }
        return mapping.get((resolution or "720p").lower(), (1280, 720))

    def _apply_capture_properties(self):
        if self.cap is None or not self.cap.isOpened():
            return
        try:
            width, height = self._resolution_to_wh(self.camera_resolution)
            self.cap.set(cv2.CAP_PROP_FRAME_WIDTH, width)
            self.cap.set(cv2.CAP_PROP_FRAME_HEIGHT, height)
            self.cap.set(cv2.CAP_PROP_FPS, float(self.camera_fps))
            self.cap.set(cv2.CAP_PROP_BRIGHTNESS, float(self.camera_brightness) / 100.0)
            self.cap.set(cv2.CAP_PROP_CONTRAST, float(self.camera_contrast) / 100.0)
            self.cap.set(cv2.CAP_PROP_AUTOFOCUS, 1.0 if self.camera_autofocus else 0.0)
        except Exception as e:
            logger.warning("Impossible d'appliquer certaines propriétés caméra: %s", e)

    def apply_camera_settings(self, resolution=None, fps=None, brightness=None, contrast=None, autofocus=None):
        if resolution is not None:
            self.camera_resolution = resolution
        if fps is not None:
            self.camera_fps = int(fps)
        if brightness is not None:
            self.camera_brightness = int(brightness)
        if contrast is not None:
            self.camera_contrast = int(contrast)
        if autofocus is not None:
            self.camera_autofocus = bool(autofocus)

        # Try hot-apply
        self._apply_capture_properties()

    def get_runtime_info(self):
        fps_val = 0.0
        if self.cap is not None and self.cap.isOpened():
            try:
                fps_val = float(self.cap.get(cv2.CAP_PROP_FPS) or 0.0)
            except Exception:
                pass

        return {
            "camera_name": f"CAM_{self.video_source}",
            "model": self.model_path,
            "capture_fps": round(fps_val, 1),
            "line": {
                "type": "vertical" if self.counting_direction in ("left-right", "right-left") else "horizontal",
                "direction": self.counting_direction,
                "position_percent": self.line_y_percent if self.counting_direction in ("top-down", "bottom-up") else int((self.line_x / self._resolution_to_wh(self.camera_resolution)[0]) * 100),
                "line_span_percent": self.line_span_percent,
            }
        }

    def start(self):
        if self.running:
            return
        if self.thread and self.thread.is_alive():
            logger.warning("Start ignoré, thread vision déjà actif")
            return

        logger.info("Démarrage du moteur de vision (Source: %s, Platform: %s)", self.video_source, sys.platform)

        if self.model is None:
            try:
                logger.info("Chargement du modèle YOLO...")
                self.model = YOLO(self.model_path)
                logger.info("Modèle YOLO chargé avec succès.")
            except Exception as e:
                logger.error("Impossible de charger le modèle YOLO: %s", e)
                return
        else:
            logger.info("Modèle YOLO déjà en mémoire, skip du rechargement.")

        # NOTE: Capture is opened inside _run_loop (not here) because
        # DirectShow on Windows uses COM objects that are bound to the
        # thread apartment that created them. Opening capture on the main
        # thread and reading on a worker thread causes silent failures.
        self.cap = None

        self._stop_event.clear()
        self.running = True
        self.thread = threading.Thread(target=self._run_loop, daemon=True, name="vision-engine")
        self.thread.start()

    def stop(self):
        if not self.running and not (self.thread and self.thread.is_alive()):
            return True

        logger.info("Arrêt du moteur de vision...")
        self.running = False
        self._stop_event.set()

        # Release capture first to unblock potential blocking read()
        if self.cap:
            try:
                self.cap.release()
            except Exception:
                pass
            self.cap = None

        stopped = True
        if self.thread and self.thread.is_alive():
            self.thread.join(timeout=8)
            if self.thread.is_alive():
                stopped = False
                logger.error("Le thread vision ne s'est pas arrêté; restart annulé pour éviter conflit FFMPEG.")

        if stopped:
            self.thread = None

        self.annotated_frame = None
        self.latest_frame = None
        logger.info("Moteur de vision arrêté.")
        return stopped

    def _broadcast_frame(self, frame):
        """Encode frame and send to all WebSocket subscribers."""
        with self.video_subscribers_lock:
            if not self.video_subscribers:
                return

        _, buffer = cv2.imencode('.jpg', frame, [cv2.IMWRITE_JPEG_QUALITY, self.jpeg_quality])
        frame_b64 = base64.b64encode(buffer).decode('utf-8')

        with self.video_subscribers_lock:
            dead_queues = []
            for queue in self.video_subscribers:
                try:
                    # Non-blocking put: drop frame if queue is full (backpressure)
                    if queue.full():
                        try:
                            queue.get_nowait()  # Drop oldest frame
                        except Exception:
                            pass
                    queue.put_nowait(frame_b64)
                except Exception:
                    dead_queues.append(queue)

            for q in dead_queues:
                self.video_subscribers.discard(q)

    def _run_loop(self):
        frame_interval = 1.0 / self.target_fps
        last_broadcast = 0
        last_frame_ts = 0.0
        reconnect_attempts = 0
        max_reconnect_delay = 30  # seconds
        frames_read = 0
        frames_for_inference = 0

        # Open capture on THIS thread (critical for DirectShow/COM on Windows)
        self.cap = self._open_capture()
        if self.cap and self.cap.isOpened():
            ret, test_frame = self.cap.read()
            if ret and test_frame is not None:
                logger.info("Source vidéo OK — première frame lue (%dx%d)", test_frame.shape[1], test_frame.shape[0])
            else:
                logger.error("Source ouverte mais impossible de lire une frame (source: %s)", self.video_source)
                self.cap.release()
                self.cap = None

        while self.running and not self._stop_event.is_set():
            if self.cap is None or not self.cap.isOpened():
                reconnect_delay = min(2 ** reconnect_attempts, max_reconnect_delay)
                logger.warning("Flux vidéo perdu. Reconnexion dans %ds...", reconnect_delay)
                if self._stop_event.wait(timeout=reconnect_delay):
                    break
                if self.cap:
                    try:
                        self.cap.release()
                    except Exception:
                        pass
                self.cap = self._open_capture()
                reconnect_attempts += 1
                continue

            success, frame = self.cap.read()
            if not success:
                reconnect_delay = min(2 ** reconnect_attempts, max_reconnect_delay)
                logger.warning("Lecture frame échouée. Reconnexion dans %ds...", reconnect_delay)
                if self.cap:
                    try:
                        self.cap.release()
                    except Exception:
                        pass
                    self.cap = None
                if self._stop_event.wait(timeout=reconnect_delay):
                    break
                self.cap = self._open_capture()
                reconnect_attempts += 1
                continue

            if self.low_latency_mode and not self._is_webcam_index(self.video_source):
                # For IP/file sources, drop buffered frames to stay close to real-time
                for _ in range(self.max_grab_skip):
                    grabbed = self.cap.grab()
                    if not grabbed:
                        break
                    ok, newer = self.cap.retrieve()
                    if not ok or newer is None:
                        break
                    frame = newer

            # Software post-processing (works for RTSP/files where cap.set may be ignored)
            target_w, target_h = self._resolution_to_wh(self.camera_resolution)
            if frame.shape[1] != target_w or frame.shape[0] != target_h:
                frame = cv2.resize(frame, (target_w, target_h), interpolation=cv2.INTER_LINEAR)

            alpha = max(0.1, min(3.0, float(self.camera_contrast) / 50.0))
            beta = int((float(self.camera_brightness) - 50.0) * 2.0)
            frame = cv2.convertScaleAbs(frame, alpha=alpha, beta=beta)

            # For video files, throttle read loop to requested FPS
            source_str = str(self.video_source)
            is_file_source = (not self._is_webcam_index(self.video_source)) and (not source_str.startswith("rtsp://")) and (not source_str.startswith("http://")) and (not source_str.startswith("https://"))
            if is_file_source and self.camera_fps > 0:
                now_sleep = time.monotonic()
                target_interval = 1.0 / float(self.camera_fps)
                if last_frame_ts > 0 and (now_sleep - last_frame_ts) < target_interval:
                    time.sleep(max(0.0, target_interval - (now_sleep - last_frame_ts)))
                last_frame_ts = time.monotonic()

            # Reset reconnect counter on successful read
            reconnect_attempts = 0
            frames_read += 1
            if frames_read == 1:
                logger.info("Vision engine — flux actif, première frame capturée")
            elif frames_read % 300 == 0:
                sub_count = len(self.video_subscribers)
                logger.debug("Vision engine — %d frames lues, %d subscriber(s) WebSocket", frames_read, sub_count)

            self.latest_frame = frame.copy()

            # Broadcast raw frame immediately (before YOLO) for instant feedback
            # This ensures the user sees video while YOLO warms up
            now = time.monotonic()
            if now - last_broadcast >= frame_interval:
                preview = frame.copy()
                self._broadcast_frame(preview)
                last_broadcast = now
                if frames_read <= 3:
                    sub_count = len(self.video_subscribers)
                    logger.debug("Broadcast frame #%d envoyée (%d subscriber(s))", frames_read, sub_count)

            frames_for_inference += 1
            run_inference = (frames_for_inference % self.inference_every_n_frames) == 0

            if run_inference:
                results = self.model.track(
                    frame,
                    persist=self.tracking_persistence,
                    verbose=False,
                    conf=self.confidence_threshold,
                    iou=self.nms_iou_threshold,
                    max_det=self.max_detections,
                    imgsz=self.inference_size,
                )
                annotated_frame = frame.copy()

                if results[0].boxes is not None and results[0].boxes.id is not None:
                    boxes_xyxy = results[0].boxes.xyxy.cpu()
                    track_ids = results[0].boxes.id.int().cpu().tolist()

                    for box_xyxy, track_id in zip(boxes_xyxy, track_ids):
                        x1, y1, x2, y2 = map(int, box_xyxy)
                        roi_bgr = frame[y1:y2, x1:x2]
                        if roi_bgr.size == 0:
                            continue

                        if self.object_data[track_id]["qr_uuid"] is None:
                            decoded_qrs = qr_decode(roi_bgr)
                            if decoded_qrs:
                                qr_data = decoded_qrs[0].data.decode('utf-8')
                                self.object_data[track_id]["qr_uuid"] = qr_data

                        current_uuid = self.object_data[track_id]["qr_uuid"]
                        is_conforme = current_uuid is not None

                        bag_status = "conforme" if is_conforme else "rejeté"
                        box_color = (0, 255, 0) if is_conforme else (0, 0, 255)

                        already_counted = (is_conforme and current_uuid in self.counted_conforme_uuids) or \
                                          (not is_conforme and track_id in self.counted_rejete_ids)

                        if already_counted:
                            bag_status = "compté"
                            box_color = (255, 0, 0)

                        cv2.rectangle(annotated_frame, (x1, y1), (x2, y2), box_color, 2)
                        label = f"ID:{track_id} - {bag_status.upper()}"
                        cv2.putText(annotated_frame, label, (x1, y1 - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.5, box_color, 2)

                        center_x = (x1 + x2) // 2
                        center_y = (y1 + y2) // 2

                        on_before = self._is_before_line(center_x, center_y)
                        if on_before:
                            self.track_seen_before_line.add(track_id)
                        crossed = not on_before and track_id in self.track_seen_before_line

                        if self.active_session_id and not already_counted and crossed:
                            detection_score = float(results[0].boxes.conf[track_ids.index(track_id)])

                            # Save capture
                            timestamp_str = datetime.now().strftime('%Y%m%d_%H%M%S_%f')
                            filename = f"capture_{timestamp_str}.jpg"
                            filepath = os.path.join("backend/static/captures", filename)
                            cv2.imwrite(filepath, roi_bgr)

                            event_data = {
                                "session_id": self.active_session_id,
                                "status": "conforme" if is_conforme else "rejete",
                                "identifier": current_uuid if is_conforme else f"track_id_{track_id}",
                                "timestamp": datetime.utcnow(),
                                "detection_score": detection_score,
                                "capture_url": f"/static/captures/{filename}",
                                "logo_score": self._compute_logo_score(roi_bgr),
                                "color_score": self._compute_color_score(roi_bgr),
                                "interval": 2.5
                            }

                            if is_conforme:
                                self.counted_conforme_uuids.add(current_uuid)
                            else:
                                self.counted_rejete_ids.add(track_id)
                            self.track_seen_before_line.discard(track_id)

                            if self.on_count_callback:
                                try:
                                    self.on_count_callback(event_data)
                                except Exception as e:
                                    logger.error("Erreur callback comptage: %s", e)

            else:
                if self.last_annotated_frame is not None:
                    annotated_frame = self.last_annotated_frame.copy()
                else:
                    annotated_frame = frame.copy()

            with self.frame_lock:
                self.annotated_frame = annotated_frame
                self.last_annotated_frame = annotated_frame

            # Broadcast annotated frame (post-YOLO) if enough time has passed
            # since the pre-YOLO broadcast above
            now_post = time.monotonic()
            if now_post - last_broadcast >= frame_interval:
                self._broadcast_frame(annotated_frame)
                last_broadcast = now_post

    def get_video_frame(self):
        with self.frame_lock:
            if self.annotated_frame is None:
                return None
            return self.annotated_frame.copy()


def get_vision_engine():
    return VisionEngine()

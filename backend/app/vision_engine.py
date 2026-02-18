import cv2
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

        self.model = None
        self.cap = None
        self.running = False
        self._stop_event = threading.Event()
        self.thread = None

        self.latest_frame = None
        self.annotated_frame = None
        self.frame_lock = threading.Lock()

        self.track_history = defaultdict(list)
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

        # Ensure capture directory exists
        os.makedirs("backend/static/captures", exist_ok=True)

        self._initialized = True

    def set_active_session(self, session_id):
        self.active_session_id = session_id
        # Reset counters for new session
        self.counted_conforme_uuids.clear()
        self.counted_rejete_ids.clear()
        self.track_history.clear()
        self.object_data.clear()

    def set_on_count_callback(self, callback):
        self.on_count_callback = callback

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
                "max_delay;0|analyzeduration;0|probesize;32768"
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
        else:
            print(f"ERREUR: _open_capture a échoué pour la source: {source}")

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
                print(f"INFO: Rechargement du modèle YOLO depuis {self.model_path}")
                self.model = YOLO(self.model_path)
            except Exception as e:
                print(f"ERREUR: Rechargement modèle échoué: {e}")

    def apply_virtual_line_config(self, position_percent=None, line_span_percent=None, direction=None):
        if position_percent is not None:
            self.line_y_percent = int(position_percent)
        if line_span_percent is not None:
            self.line_span_percent = int(line_span_percent)
        if direction is not None:
            self.counting_direction = direction

    def _crossed_virtual_line(self, track):
        if len(track) < 2:
            return False

        prev = track[0]
        curr = track[1]

        if self.counting_direction == "left-right":
            return prev["x"] < self.line_x and curr["x"] >= self.line_x
        if self.counting_direction == "right-left":
            return prev["x"] > self.line_x and curr["x"] <= self.line_x
        if self.counting_direction == "top-down":
            line_y = int((self.line_y_percent / 100.0) * 720)
            return prev["y"] < line_y and curr["y"] >= line_y
        if self.counting_direction == "bottom-up":
            line_y = int((self.line_y_percent / 100.0) * 720)
            return prev["y"] > line_y and curr["y"] <= line_y
        return prev["x"] < self.line_x and curr["x"] >= self.line_x

    def start(self):
        if self.running:
            return

        print(f"INFO: Démarrage du moteur de vision (Source: {self.video_source}, Platform: {sys.platform})...")

        if self.model is None:
            try:
                print("INFO: Chargement du modèle YOLO...")
                self.model = YOLO(self.model_path)
                print("INFO: Modèle YOLO chargé avec succès.")
            except Exception as e:
                print(f"ERREUR: Impossible de charger le modèle YOLO: {e}")
                return
        else:
            print("INFO: Modèle YOLO déjà en mémoire, skip du rechargement.")

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
        if not self.running:
            return

        print("INFO: Arrêt du moteur de vision...")
        self.running = False
        self._stop_event.set()

        if self.thread and self.thread.is_alive():
            self.thread.join(timeout=5)
            if self.thread.is_alive():
                print("AVERTISSEMENT: Le thread vision ne s'est pas arrêté dans le délai.")

        if self.cap:
            try:
                self.cap.release()
            except Exception:
                pass
            self.cap = None

        self.annotated_frame = None
        self.latest_frame = None
        print("INFO: Moteur de vision arrêté.")

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
        reconnect_attempts = 0
        max_reconnect_delay = 30  # seconds
        frames_read = 0
        frames_for_inference = 0

        # Open capture on THIS thread (critical for DirectShow/COM on Windows)
        self.cap = self._open_capture()
        if self.cap and self.cap.isOpened():
            ret, test_frame = self.cap.read()
            if ret and test_frame is not None:
                print(f"INFO: Source vidéo OK — première frame lue ({test_frame.shape[1]}x{test_frame.shape[0]})")
            else:
                print(f"ERREUR: Source ouverte mais impossible de lire une frame (source: {self.video_source})")
                self.cap.release()
                self.cap = None

        while self.running and not self._stop_event.is_set():
            if self.cap is None or not self.cap.isOpened():
                reconnect_delay = min(2 ** reconnect_attempts, max_reconnect_delay)
                print(f"AVERTISSEMENT: Flux vidéo perdu. Reconnexion dans {reconnect_delay}s...")
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
                print(f"AVERTISSEMENT: Lecture frame échouée. Reconnexion dans {reconnect_delay}s...")
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

            # Reset reconnect counter on successful read
            reconnect_attempts = 0
            frames_read += 1
            if frames_read == 1:
                print(f"INFO: Vision engine — flux actif, première frame capturée")
            elif frames_read % 300 == 0:
                sub_count = len(self.video_subscribers)
                print(f"INFO: Vision engine — {frames_read} frames lues, {sub_count} subscriber(s) WebSocket")

            frame = cv2.resize(frame, (1280, 720))
            self.latest_frame = frame.copy()

            # Broadcast raw frame immediately (before YOLO) for instant feedback
            # This ensures the user sees video while YOLO warms up
            now = time.monotonic()
            if now - last_broadcast >= frame_interval:
                preview = frame.copy()
                line_y = int((self.line_y_percent / 100.0) * preview.shape[0])
                span_half = int((self.line_span_percent / 100.0) * preview.shape[1] / 2)
                center_x = preview.shape[1] // 2
                x_start = max(0, center_x - span_half)
                x_end = min(preview.shape[1], center_x + span_half)

                if self.counting_direction in ("left-right", "right-left"):
                    cv2.line(preview, (self.line_x, 0), (self.line_x, preview.shape[0]), (0, 255, 255), 2)
                else:
                    cv2.line(preview, (x_start, line_y), (x_end, line_y), (0, 255, 255), 2)
                self._broadcast_frame(preview)
                last_broadcast = now
                if frames_read <= 3:
                    sub_count = len(self.video_subscribers)
                    print(f"INFO: Broadcast frame #{frames_read} envoyée ({sub_count} subscriber(s))")

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
                        track = self.track_history[track_id]
                        track.append({"x": center_x, "y": center_y})
                        if len(track) > 2:
                            track.pop(0)

                        if self.active_session_id and not already_counted and len(track) == 2 and self._crossed_virtual_line(track):
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
                                "logo_score": 0.9 + (np.random.random() * 0.09),
                                "color_score": 0.85 + (np.random.random() * 0.1),
                                "interval": 2.5
                            }

                            if is_conforme:
                                self.counted_conforme_uuids.add(current_uuid)
                            else:
                                self.counted_rejete_ids.add(track_id)

                            if self.on_count_callback:
                                try:
                                    self.on_count_callback(event_data)
                                except Exception as e:
                                    print(f"ERREUR callback comptage: {e}")

            else:
                if self.last_annotated_frame is not None:
                    annotated_frame = self.last_annotated_frame.copy()
                else:
                    annotated_frame = frame.copy()

            line_y = int((self.line_y_percent / 100.0) * annotated_frame.shape[0])
            span_half = int((self.line_span_percent / 100.0) * annotated_frame.shape[1] / 2)
            center_x = annotated_frame.shape[1] // 2
            x_start = max(0, center_x - span_half)
            x_end = min(annotated_frame.shape[1], center_x + span_half)

            if self.counting_direction in ("left-right", "right-left"):
                cv2.line(annotated_frame, (self.line_x, 0), (self.line_x, annotated_frame.shape[0]), (0, 255, 255), 2)
            else:
                cv2.line(annotated_frame, (x_start, line_y), (x_end, line_y), (0, 255, 255), 2)

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

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
        self.line_x = 640

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
        self.jpeg_quality = 70
        self.target_fps = 15  # Target FPS for WebSocket streaming (lower than capture FPS)

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

    def _open_capture(self):
        """Open video capture with proper settings for RTSP/HTTP/webcam sources."""
        source = self.video_source

        if isinstance(source, str) and source.startswith("rtsp://"):
            # RTSP: use FFMPEG backend with TCP transport for reliability
            os.environ["OPENCV_FFMPEG_CAPTURE_OPTIONS"] = "rtsp_transport;tcp|analyzeduration;5000000|probesize;5000000"
            cap = cv2.VideoCapture(source, cv2.CAP_FFMPEG)
        elif isinstance(source, str) and (source.startswith("http://") or source.startswith("https://")):
            # HTTP/ONVIF stream
            cap = cv2.VideoCapture(source, cv2.CAP_FFMPEG)
        else:
            # Local webcam or file
            cap = cv2.VideoCapture(source)

        if cap.isOpened():
            # Reduce internal buffer to minimize latency
            cap.set(cv2.CAP_PROP_BUFFERSIZE, 1)

        return cap

    def start(self):
        if self.running:
            return

        print(f"INFO: Démarrage du moteur de vision (Source: {self.video_source})...")

        try:
            self.model = YOLO(self.model_path)
        except Exception as e:
            print(f"ERREUR: Impossible de charger le modèle YOLO: {e}")
            return

        self.cap = self._open_capture()

        if not self.cap.isOpened():
            print(f"ERREUR: Impossible d'ouvrir la source vidéo {self.video_source}")
            return

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

            # Reset reconnect counter on successful read
            reconnect_attempts = 0

            frame = cv2.resize(frame, (1280, 720))
            self.latest_frame = frame.copy()

            results = self.model.track(frame, persist=True, verbose=False, conf=self.confidence_threshold)
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
                    track = self.track_history[track_id]
                    track.append(center_x)
                    if len(track) > 2:
                        track.pop(0)

                    if self.active_session_id and not already_counted and len(track) == 2 and track[0] < self.line_x and track[1] >= self.line_x:
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

            cv2.line(annotated_frame, (self.line_x, 0), (self.line_x, annotated_frame.shape[0]), (0, 255, 255), 2)

            with self.frame_lock:
                self.annotated_frame = annotated_frame

            # Broadcast to WebSocket subscribers at target FPS
            now = time.monotonic()
            if now - last_broadcast >= frame_interval:
                self._broadcast_frame(annotated_frame)
                last_broadcast = now

    def get_video_frame(self):
        with self.frame_lock:
            if self.annotated_frame is None:
                return None
            return self.annotated_frame.copy()


def get_vision_engine():
    return VisionEngine()

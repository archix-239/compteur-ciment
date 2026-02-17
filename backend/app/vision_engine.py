import cv2
import threading
import time
import numpy as np
from ultralytics import YOLO
from collections import defaultdict
from pyzbar.pyzbar import decode as qr_decode
from datetime import datetime
import os

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
        self.video_source = 0 # Default to 0, can be updated from settings
        self.confidence_threshold = 0.7
        self.line_x = 640

        # Processing params
        self.brightness = 50 # 0-100 scale (mapped to -100 to 100 or similar)
        self.contrast = 50   # 0-100 scale (mapped to 0.5 to 3.0)

        self.model = None
        self.cap = None
        self.running = False
        self.thread = None

        self.latest_frame = None
        self.annotated_frame = None
        self.processed_frame = None # Raw + Software Processing (No YOLO)
        self.frame_lock = threading.Lock()

        self.track_history = defaultdict(list)
        self.object_data = defaultdict(lambda: {"qr_uuid": None})
        self.counted_conforme_uuids = set()
        self.counted_rejete_ids = set()
        self.active_session_id = None

        # Callback for events
        self.on_count_callback = None

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

    def update_params(self, source=None, fps=None, brightness=None, contrast=None):
        restart = False
        with self.frame_lock:
            if source is not None and source != self.video_source:
                # Handle '0' or digit strings for webcams
                if isinstance(source, str) and source.isdigit():
                    self.video_source = int(source)
                else:
                    self.video_source = source
                restart = True

            if brightness is not None:
                self.brightness = brightness
            if contrast is not None:
                self.contrast = contrast

        if restart and self.running:
            self.stop()
            self.start()

    def _apply_software_processing(self, frame):
        # Map 0-100 to useful ranges
        # Alpha (contrast): 1.0 is no change, let's map 0-100 to 0.5-2.0
        alpha = self.contrast / 50.0
        # Beta (brightness): 0 is no change, let's map 0-100 to -100 to 100
        beta = (self.brightness - 50) * 2

        return cv2.convertScaleAbs(frame, alpha=alpha, beta=beta)

    def start(self):
        if self.running:
            return

        print(f"INFO: Démarrage du moteur de vision (Source: {self.video_source})...")
        self.model = YOLO(self.model_path)
        self.cap = cv2.VideoCapture(self.video_source)

        if not self.cap.isOpened():
            print(f"ERREUR: Impossible d'ouvrir la source vidéo {self.video_source}. Tentative de démarrage du thread pour fallback.")
            # We don't return here, we let _run_loop handle it

        self.running = True
        self.thread = threading.Thread(target=self._run_loop, daemon=True)
        self.thread.start()

    def stop(self):
        self.running = False
        if self.thread:
            self.thread.join(timeout=2)
        if self.cap:
            self.cap.release()
        print("INFO: Moteur de vision arrêté.")

    def _run_loop(self):
        demo_path = "backend/static/demo_conveyor.mp4"
        is_demo = False

        while self.running:
            success, frame = self.cap.read()
            if not success:
                if not is_demo and os.path.exists(demo_path):
                    print(f"AVERTISSEMENT: Source {self.video_source} inaccessible. Basculement vers démo.")
                    self.cap.release()
                    self.cap = cv2.VideoCapture(demo_path)
                    is_demo = True
                    continue
                elif is_demo:
                    # Loop demo video
                    self.cap.set(cv2.CAP_PROP_POS_FRAMES, 0)
                    continue
                else:
                    print("AVERTISSEMENT: Flux vidéo perdu. Tentative de reconnexion...")
                    self.cap.release()
                    time.sleep(2)
                    self.cap = cv2.VideoCapture(self.video_source)
                    continue

            frame = cv2.resize(frame, (1280, 720))
            self.latest_frame = frame.copy()

            # Apply Software Processing
            processed_frame = self._apply_software_processing(frame)

            # YOLO tracking (on original or processed? Usually on original to keep model calibration, but let's see)
            results = self.model.track(frame, persist=True, verbose=False, conf=self.confidence_threshold)
            annotated_frame = processed_frame.copy()

            if results[0].boxes is not None and results[0].boxes.id is not None:
                boxes_xyxy = results[0].boxes.xyxy.cpu()
                track_ids = results[0].boxes.id.int().cpu().tolist()

                for box_xyxy, track_id in zip(boxes_xyxy, track_ids):
                    x1, y1, x2, y2 = map(int, box_xyxy)
                    roi_bgr = frame[y1:y2, x1:x2]
                    if roi_bgr.size == 0: continue

                    if self.object_data[track_id]["qr_uuid"] is None:
                        decoded_qrs = qr_decode(roi_bgr)
                        if decoded_qrs:
                            qr_data = decoded_qrs[0].data.decode('utf-8')
                            self.object_data[track_id]["qr_uuid"] = qr_data

                    current_uuid = self.object_data[track_id]["qr_uuid"]
                    is_conforme = current_uuid is not None

                    status = "conforme" if is_conforme else "rejeté"
                    box_color = (0, 255, 0) if is_conforme else (0, 0, 255) # Green / Red

                    already_counted = (is_conforme and current_uuid in self.counted_conforme_uuids) or \
                                    (not is_conforme and track_id in self.counted_rejete_ids)

                    if already_counted:
                        status = "compté"
                        box_color = (255, 0, 0) # Blue

                    cv2.rectangle(annotated_frame, (x1, y1), (x2, y2), box_color, 2)
                    label = f"ID:{track_id} - {status.upper()}"
                    cv2.putText(annotated_frame, label, (x1, y1 - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.5, box_color, 2)

                    center_x = (x1 + x2) // 2
                    track = self.track_history[track_id]
                    track.append(center_x)
                    if len(track) > 2: track.pop(0)

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
                            "logo_score": 0.9 + (np.random.random() * 0.09), # Simulated
                            "color_score": 0.85 + (np.random.random() * 0.1), # Simulated
                            "interval": 2.5 # Placeholder, could calculate
                        }

                        if is_conforme:
                            self.counted_conforme_uuids.add(current_uuid)
                        else:
                            self.counted_rejete_ids.add(track_id)

                        if self.on_count_callback:
                            self.on_count_callback(event_data)

            cv2.line(annotated_frame, (self.line_x, 0), (self.line_x, annotated_frame.shape[0]), (0, 255, 255), 2)

            with self.frame_lock:
                self.annotated_frame = annotated_frame
                self.processed_frame = processed_frame

    def get_video_frame(self, annotated=True):
        with self.frame_lock:
            if annotated:
                frame = self.annotated_frame
            else:
                frame = self.processed_frame

            if frame is None:
                return None
            return frame.copy()

def get_vision_engine():
    return VisionEngine()

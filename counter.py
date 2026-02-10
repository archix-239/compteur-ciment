"""Moteur de comptage simplifie pour sacs de ciment.

Pipeline: Detection YOLO -> Tracking -> Scan QR -> Franchissement ligne -> Comptage
"""

import cv2
import threading
from collections import defaultdict
from ultralytics import YOLO
from pyzbar.pyzbar import decode as qr_decode


class CementCounter:
    def __init__(self, config, on_count=None):
        """
        Args:
            config: objet Config avec les parametres
            on_count: callback(status, identifier) appele a chaque comptage
        """
        self.config = config
        self.on_count = on_count

        self.model = YOLO(config.MODEL_PATH)

        # Etat du compteur
        self._track_history = defaultdict(list)
        self._object_data = defaultdict(lambda: {"qr_uuid": None})
        self._counted_conforme = set()
        self._counted_rejete = set()
        self._line_x = int(config.FRAME_WIDTH * config.LINE_POSITION / 100)

        # Video
        self._cap = None
        self.running = False
        self._current_frame = None
        self._lock = threading.Lock()

    @property
    def stats(self) -> dict:
        c = len(self._counted_conforme)
        r = len(self._counted_rejete)
        total = c + r
        return {
            "conforme": c,
            "rejete": r,
            "total": total,
            "taux": round(c / max(1, total) * 100, 1),
        }

    @property
    def line_x(self) -> int:
        return self._line_x

    @line_x.setter
    def line_x(self, value: int):
        self._line_x = value

    def start(self, video_source):
        source = int(video_source) if str(video_source).isdigit() else video_source
        self._cap = cv2.VideoCapture(source)
        if not self._cap.isOpened():
            raise RuntimeError(f"Impossible d'ouvrir la source video: {video_source}")
        self.running = True
        self.reset()

    def stop(self):
        self.running = False
        if self._cap:
            self._cap.release()
            self._cap = None

    def reset(self):
        self._track_history.clear()
        self._object_data.clear()
        self._counted_conforme.clear()
        self._counted_rejete.clear()

    def process_frame(self):
        """Traite une frame. Retourne la frame annotee ou None."""
        if not self._cap or not self.running:
            return None

        ok, frame = self._cap.read()
        if not ok:
            self._reconnect()
            return None

        w, h = self.config.FRAME_WIDTH, self.config.FRAME_HEIGHT
        frame = cv2.resize(frame, (w, h))

        results = self.model.track(
            frame, persist=True, verbose=False, conf=self.config.CONFIDENCE_THRESHOLD
        )
        annotated = frame.copy()

        if results[0].boxes is not None and results[0].boxes.id is not None:
            boxes = results[0].boxes.xyxy.cpu()
            ids = results[0].boxes.id.int().cpu().tolist()

            for box, tid in zip(boxes, ids):
                self._process_detection(frame, annotated, box, tid)

        # Ligne de comptage
        cv2.line(
            annotated,
            (self._line_x, 0),
            (self._line_x, h),
            self.config.COLOR_LINE,
            2,
        )

        # Overlay stats
        s = self.stats
        cv2.putText(
            annotated,
            f"Conformes: {s['conforme']}",
            (50, 50),
            cv2.FONT_HERSHEY_SIMPLEX,
            1,
            self.config.COLOR_CONFORME,
            2,
        )
        cv2.putText(
            annotated,
            f"Rejetes: {s['rejete']}",
            (50, 100),
            cv2.FONT_HERSHEY_SIMPLEX,
            1,
            self.config.COLOR_REJETE,
            2,
        )

        with self._lock:
            self._current_frame = annotated

        return annotated

    def get_frame_bytes(self) -> bytes | None:
        with self._lock:
            if self._current_frame is None:
                return None
            _, buf = cv2.imencode(".jpg", self._current_frame)
            return buf.tobytes()

    # --- Logique interne ---

    def _process_detection(self, frame, annotated, box, tid):
        x1, y1, x2, y2 = map(int, box)
        roi = frame[y1:y2, x1:x2]
        if roi.size == 0:
            return

        # Scan QR une seule fois par objet
        if self._object_data[tid]["qr_uuid"] is None:
            qrs = qr_decode(roi)
            if qrs:
                self._object_data[tid]["qr_uuid"] = qrs[0].data.decode("utf-8")

        uid = self._object_data[tid]["qr_uuid"]
        is_conforme = uid is not None

        # Statut
        already_counted = (is_conforme and uid in self._counted_conforme) or (
            not is_conforme and tid in self._counted_rejete
        )

        if already_counted:
            status, color = "COMPTE", self.config.COLOR_COUNTED
        elif is_conforme:
            status, color = "CONFORME", self.config.COLOR_CONFORME
        else:
            status, color = "REJETE", self.config.COLOR_REJETE

        # Dessin
        cv2.rectangle(annotated, (x1, y1), (x2, y2), color, 2)
        label = f"ID:{tid} {status}"
        if uid:
            label += f" ...{uid[-6:]}"
        cv2.putText(
            annotated,
            label,
            (x1, y1 - 10),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.5,
            color,
            2,
        )

        # Trajectoire
        cx = (x1 + x2) // 2
        track = self._track_history[tid]
        track.append(cx)
        if len(track) > 2:
            track.pop(0)

        # Detection de franchissement
        if (
            not already_counted
            and len(track) == 2
            and track[0] < self._line_x <= track[1]
        ):
            if is_conforme:
                self._counted_conforme.add(uid)
                if self.on_count:
                    self.on_count("conforme", uid)
            else:
                self._counted_rejete.add(tid)
                if self.on_count:
                    self.on_count("rejete", f"track_{tid}")

    def _reconnect(self):
        if self._cap:
            self._cap.release()
        source = self.config.VIDEO_SOURCE
        source = int(source) if str(source).isdigit() else source
        self._cap = cv2.VideoCapture(source)

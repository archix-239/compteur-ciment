import cv2
import numpy as np
from ultralytics import YOLO
from collections import defaultdict
import os
import threading
import requests
from pyzbar.pyzbar import decode as qr_decode
from flask import Flask, Response
from datetime import datetime
from flask_cors import CORS

# --- CONFIGURATION ---
MODEL_PATH = 'models/best_V5.pt'
VIDEO_SOURCE = "http://192.168.137.186:8080/video"
CONFIDENCE_THRESHOLD = 0.7
LINE_X = 640
BACKEND_API_URL = "http://127.0.0.1:8000/api/internal/count-event"
STREAM_HOST = "0.0.0.0"
STREAM_PORT = 8081
SHOW_LOCAL_WINDOW = False

# --- CONSTANTES "EXPERT EDITION" (Inchangées) ---
VERIFICATION_FRAMES_REQUIRED = 3
MIN_ROI_SIZE = 20
MIN_ROI_VARIANCE = 50
MAX_REFERENCE_HISTS = 5

# --- COULEURS POUR LA VISUALISATION (Inchangées) ---
COLOR_REJECTED = (0, 0, 255)
COLOR_VERIFIED = (0, 255, 0)
COLOR_COUNTED = (255, 0, 0)
COLOR_LINE = (0, 255, 255)
COLOR_TEXT = (255, 255, 255)

# --- CONFIGURATION DE LA VÉRIFICATION VISUELLE (Conservée comme support) ---
LOGO_TEMPLATE = None
TEMPLATE_H, TEMPLATE_W = 0, 0
try:
    temp_logo = cv2.imread('templates/cement_logo.png')
    if temp_logo is None: raise FileNotFoundError
    if len(temp_logo.shape) == 3: LOGO_TEMPLATE = cv2.cvtColor(temp_logo, cv2.COLOR_BGR2GRAY)
    else: LOGO_TEMPLATE = temp_logo
    TEMPLATE_H, TEMPLATE_W = LOGO_TEMPLATE.shape
    print("INFO: Template de logo chargé avec succès.")
except FileNotFoundError:
    print("AVERTISSEMENT: Le fichier 'templates/cement_logo.png' est introuvable.")
    LOGO_TEMPLATE = None

# --- COMMUNICATION ET STREAMING ---
app = Flask(__name__)
CORS(app)
output_frame = None
lock = threading.Lock()

def send_count_event(status: str, identifier: str):
    try:
        payload = {"status": status, "identifier": identifier}
        requests.post(BACKEND_API_URL, json=payload, timeout=0.5)
        print(f"INFO: Événement envoyé au backend : {status} - {identifier}")
    except requests.exceptions.RequestException as e:
        print(f"ERREUR: Impossible de contacter le backend FastAPI : {e}")

def stream_generator():
    global output_frame, lock
    while True:
        with lock:
            if output_frame is None: continue
            (flag, encodedImage) = cv2.imencode(".jpg", output_frame)
            if not flag: continue
        yield(b'--frame\r\n' b'Content-Type: image/jpeg\r\n\r\n' + bytearray(encodedImage) + b'\r\n')

@app.route("/video_feed")
def video_feed():
    return Response(stream_generator(), mimetype="multipart/x-mixed-replace; boundary=frame")

def start_streaming_server():
    from werkzeug.serving import make_server
    server = make_server(STREAM_HOST, STREAM_PORT, app)
    server.serve_forever()

# --- INITIALISATION ---
model = YOLO(MODEL_PATH)
cap = cv2.VideoCapture(VIDEO_SOURCE)
if not cap.isOpened():
    print(f"ERREUR CRITIQUE: Impossible de se connecter au flux vidéo : {VIDEO_SOURCE}")
    exit()

streaming_thread = threading.Thread(target=start_streaming_server)
streaming_thread.daemon = True
streaming_thread.start()
print(f"INFO: Serveur de streaming démarré. Accédez au flux via http://VOTRE_IP_LOCALE:{STREAM_PORT}/video_feed")

track_history = defaultdict(list)
object_data = defaultdict(lambda: {"qr_uuid": None})

# --- NOUVELLE LOGIQUE : Sets pour garantir l'unicité du comptage ---
counted_conforme_uuids = set()
counted_rejete_ids = set()

print("INFO: Compteur démarré.")

# --- BOUCLE PRINCIPALE ---
while True:
    try:
        success, frame = cap.read()
        if not success:
            print("AVERTISSEMENT: Flux vidéo perdu. Tentative de reconnexion...")
            cap.release()
            cap = cv2.VideoCapture(VIDEO_SOURCE)
            continue

        frame = cv2.resize(frame, (1280, 720))
        results = model.track(frame, persist=True, verbose=False, conf=CONFIDENCE_THRESHOLD)
        annotated_frame = frame.copy()

        if results[0].boxes is not None and results[0].boxes.id is not None:
            boxes_xyxy = results[0].boxes.xyxy.cpu()
            track_ids = results[0].boxes.id.int().cpu().tolist()

            for box_xyxy, track_id in zip(boxes_xyxy, track_ids):
                x1, y1, x2, y2 = map(int, box_xyxy)
                roi_bgr = frame[y1:y2, x1:x2]
                if roi_bgr.size == 0: continue
                
                if object_data[track_id]["qr_uuid"] is None:
                    decoded_qrs = qr_decode(roi_bgr)
                    if decoded_qrs:
                        qr_data = decoded_qrs[0].data.decode('utf-8')
                        object_data[track_id]["qr_uuid"] = qr_data
                
                current_uuid = object_data[track_id]["qr_uuid"]
                is_conforme = current_uuid is not None
                
                status = "conforme" if is_conforme else "rejeté"
                box_color = COLOR_VERIFIED if is_conforme else COLOR_REJECTED
                
                already_counted = (is_conforme and current_uuid in counted_conforme_uuids) or \
                                (not is_conforme and track_id in counted_rejete_ids)

                if already_counted:
                    status = "compté"
                    box_color = COLOR_COUNTED

                cv2.rectangle(annotated_frame, (x1, y1), (x2, y2), box_color, 2)
                label = f"ID:{track_id} - {status.upper()}"
                if is_conforme:
                    label += f" - ...{current_uuid[-6:]}"
                cv2.putText(annotated_frame, label, (x1, y1 - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.5, box_color, 2)

                center_x = (x1 + x2) // 2
                track = track_history[track_id]
                track.append(center_x)
                if len(track) > 2: track.pop(0)

                if not already_counted and len(track) == 2 and track[0] < LINE_X and track[1] >= LINE_X:
                    if is_conforme:
                        counted_conforme_uuids.add(current_uuid)
                        send_count_event("conforme", current_uuid)
                    else:
                        counted_rejete_ids.add(track_id)
                        send_count_event("rejete", f"track_id_{track_id}")

        cv2.line(annotated_frame, (LINE_X, 0), (LINE_X, annotated_frame.shape[0]), COLOR_LINE, 2)
        total_conforme = len(counted_conforme_uuids)
        total_rejete = len(counted_rejete_ids)
        cv2.putText(annotated_frame, f"Conformes: {total_conforme}", (50, 50), cv2.FONT_HERSHEY_SIMPLEX, 1, COLOR_VERIFIED, 2)
        cv2.putText(annotated_frame, f"Rejetes: {total_rejete}", (50, 100), cv2.FONT_HERSHEY_SIMPLEX, 1, COLOR_REJECTED, 2)
        
        with lock:
            output_frame = annotated_frame.copy()

        if SHOW_LOCAL_WINDOW:
            display_frame = cv2.resize(annotated_frame, (960, 540))
            cv2.imshow("Compteur Ciment - Service de Vision", display_frame)

            key = cv2.waitKey(1) & 0xFF
            if key == ord('q'):
                break
            if key == ord("r"):
                track_history.clear()
                object_data.clear()
                counted_conforme_uuids.clear()
                counted_rejete_ids.clear()
                print("\n>>>> SYSTEME DE SUIVI ET DE COMPTAGE REINITIALISE.\n")
            if key == ord("s"):
                capture_filename = f"capture_{datetime.now().strftime('%Y%m%d_%H%M%S')}.png"
                cv2.imwrite(capture_filename, frame)
                print(f"INFO: Image capturée et sauvegardée sous {capture_filename}")
    
    except KeyboardInterrupt:
        # Permet de quitter proprement avec Ctrl+C dans le terminal
        break

# --- Nettoyage ---
cap.release()
if SHOW_LOCAL_WINDOW:
    cv2.destroyAllWindows()
print("INFO: Application de comptage terminée.")
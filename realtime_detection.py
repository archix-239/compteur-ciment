import cv2
from ultralytics import YOLO

# --- CONFIGURATION ---
# Charger notre modèle entraîné
# Le chemin doit pointer vers votre fichier best.pt dans le dossier models
MODEL_PATH = 'models/best_V1.pt'

# Index de la webcam (0 est généralement la webcam par défaut)
WEBCAM_INDEX = 0

# --- INITIALISATION ---
# Charger le modèle YOLOv8
try:
    model = YOLO(MODEL_PATH)
except Exception as e:
    print(f"Erreur lors du chargement du modèle : {e}")
    exit()

# Initialiser la capture vidéo
cap = cv2.VideoCapture(WEBCAM_INDEX)
if not cap.isOpened():
    print(f"Erreur : Impossible d'ouvrir la webcam avec l'index {WEBCAM_INDEX}.")
    exit()

print("Détection en temps réel démarrée. Appuyez sur 'q' pour quitter.")

# --- BOUCLE PRINCIPALE ---
# --- BOUCLE PRINCIPALE ---
CONFIDENCE_THRESHOLD = 0.6 # Essayez des valeurs entre 0.4 et 0.8

while True:
    success, frame = cap.read()
    if success:
        # Lancer l'inférence
        results = model(frame, verbose=False)

        # Boucler sur les détections et appliquer notre filtre de confiance
        for result in results:
            for box in result.boxes:
                # Obtenir le score de confiance
                confidence = box.conf[0]
                
                # Si la confiance est supérieure à notre seuil
                if confidence > CONFIDENCE_THRESHOLD:
                    # Obtenir les coordonnées de la boîte
                    x1, y1, x2, y2 = map(int, box.xyxy[0])
                    
                    # Obtenir le nom de la classe
                    cls_id = int(box.cls[0])
                    class_name = model.names[cls_id]
                    
                    # Dessiner la boîte sur l'image
                    cv2.rectangle(frame, (x1, y1), (x2, y2), (0, 255, 0), 2)
                    
                    # Mettre le label (nom de la classe + confiance)
                    label = f"{class_name} {confidence:.2f}"
                    cv2.putText(frame, label, (x1, y1 - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 0), 2)

        # Afficher la frame (maintenant avec uniquement les détections filtrées)
        cv2.imshow("Real-time Cement Bag Detection", frame)

        if cv2.waitKey(1) & 0xFF == ord("q"):
            break
    else:
        print("Erreur de lecture de la webcam.")
        break

# --- NETTOYAGE ---
# Libérer la capture vidéo et détruire les fenêtres
cap.release()
cv2.destroyAllWindows()
print("Application terminée.")
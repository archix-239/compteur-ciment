import cv2

# L'index 0 correspond généralement à la webcam par défaut.
# Si vous en avez plusieurs, essayez 1, 2, etc.
cap = cv2.VideoCapture(0)

if not cap.isOpened():
    print("Erreur : Impossible d'ouvrir la caméra.")
    exit()

print("Caméra détectée. Appuyez sur 'q' pour quitter.")

while True:
    # Lire une image depuis la caméra
    ret, frame = cap.read()

    # Si l'image n'a pas pu être lue, on sort de la boucle
    if not ret:
        print("Erreur : Impossible de recevoir l'image. Fin du flux.")
        break

    # Afficher l'image dans une fenêtre
    cv2.imshow('Test Camera', frame)

    # Attendre 1ms et vérifier si la touche 'q' a été pressée
    if cv2.waitKey(1) == ord('q'):
        break

# Libérer la caméra et détruire les fenêtres
cap.release()
cv2.destroyAllWindows()
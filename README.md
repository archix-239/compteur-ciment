README
Compteur Automatique de Sacs de Ciment
Version 1.0
27 août 2025
README- Compteur Automatique de Sacs de Ciment
1 Compteur Automatique de Sacs de Ciment
Ce projet est une application de vision par ordinateur en temps réel conçue pour
détecter, suivre et compter les sacs de ciment à partir d’un flux vidéo, en utilisant un
modèle YOLOv8 et une pipeline de vérification visuelle avancée.
2 Fonctionnalités Clés
— Détection d’Objets : Utilise un modèle YOLOv8 customisé pour une détection
rapide et précise.
— Suivi Robuste : Attribue un ID unique à chaque objet pour un suivi persistant.
— Vérification Multi-Critères : Valide chaque détection via une double analyse (logo
+ couleur) pour éliminer les faux positifs.
— Adaptabilité : Utilise des seuils dynamiques et une bibliothèque de références de
couleur évolutive pour s’adapter aux changements d’éclairage.
— Robustesse:Intègre des pré-traitements d’image (anti-bruit, anti-flou, CLAHE) pour
fonctionner avec des caméras de faible qualité.
— Comptage Fiable : Compte les objets une seule fois lors du franchissement d’une
ligne virtuelle.
— Data Logging : Enregistre chaque comptage dans un fichier CSV et les décisions
dans un fichier de log.
3 Prérequis
Avant de commencer, assurez-vous d’avoir installé :
1. Python 3.8+.
2. L’installateur de paquets pip (généralement inclus avec Python).
3. Tesseract OCR Engine (optionnel, recommandé pour tester des versions antérieures
basées sur l’OCR).
4 Installation
1. Cloner le dépôt (ou décompresser les fichiers dans un dossier) :
git clone [URL_DU_DEPOT]
cd compteur-ciment
2. Créer un environnement virtuel :
python-m venv venv
3. Activer l’environnement virtuel :
— Sur Windows :
.\venv\Scripts\activate
— Sur macOS/Linux :
source venv/bin/activate

README- Compteur Automatique de Sacs de Ciment
4. Installer les dépendances Python :
pip install-r requirements.txt
5 Fichier requirements.txt
Créer un fichier requirements.txt avec le contenu suivant :
ultralytics
opencv-python
numpy
6 Configuration
Avant de lancer l’application, configurer :
1. Le Modèle Entraîné : Placer best_V5.pt dans le sous-dossier models/.
2. Le Template du Logo : Placer cement_logo.png (bien recadrée) dans le sous
dossier templates/.
3. La Source Vidéo:Dansrealtime_counter.py,modifierlavariable VIDEO_SOURCE :
VIDEO_SOURCE = "http://VOTRE.IP.ICI:8080/video"
7 Utilisation
1. Assurer que l’environnement virtuel est activé.
2. Lancer le script principal :
python realtime_counter.py
3. Une fenêtre affichant le flux vidéo annoté apparaîtra.
7.1 Raccourcis Clavier
— q:Quitter l’application.
— r:Réinitialiser complètement le système (compteur, références de couleur, etc.).
— s : Sauvegarder l’image actuelle sous capture_telephone.png (utile pour créer de
nouveaux templates).
8 Sorties
L’application génère deux fichiers à la racine du projet :
— comptage.csv : Historique horodaté de chaque sac compté.
— counter_log.txt : Logs détaillés des décisions de vérification.


Architecture du Système
Compteur Automatique de Sacs de Ciment
Version 1.0
27 août 2025
Architecture du Système- Compteur Automatique de Sacs de Ciment
1 Flux de Données
L’application suit un flux de traitement séquentiel pour chaque image reçue de la
source vidéo.
1.1 Source Vidéo (Entrée)
— Connexion au flux vidéo de la caméra IP.
— Lecture de l’image brute.
— Redimensionnement à une taille standard (1280x720) pour la consistance.
1.2 Module de Détection et Suivi (YOLOv8)
— Lemodèle YOLOv8 (model.track()) analyse l’image.
— Sortie :
— Liste d’objets détectés avec :
— Boîtes englobantes (coordonnées).
— Score de confiance initial.
— Identifiant de suivi unique et persistant (track_id).
1.3 Pipeline de Vérification par Objet
Pour chaque objet détecté :
1. Découpe de la ROI : Extraction de l’image de l’objet (Region of Interest).
2. Pré-Validation : Vérification de la taille et de la netteté (non flou). Si invalide,
l’objet est rejeté.
3. Pré-traitement de la ROI : Application de filtres (anti-bruit, CLAHE) pour
améliorer la qualité.
4. Double Vérification Visuelle :
— Logo Matching : Comparaison avec le template du logo.
— Analyse Couleur : Comparaison de l’histogramme HSV avec la bibliothèque
de références.
5. Stabilisation Temporelle : Lissage du résultat sur plusieurs frames via un buffer
pour confirmer le statut.
1.4 Module de Comptage et Logique Métier
— Si un objet est final_verified, sa trajectoire est suivie.
— Si son centre traverse la ligne de comptage virtuelle (LINE_X) :
— Vérification que son track_id n’a pas déjà été compté.
— Si non, incrémentation du compteur et ajout de l’ID à la liste des “comptés”.
— Ajout d’une nouvelle entrée dans comptage.csv.

Architecture du Système- Compteur Automatique de Sacs de Ciment
1.5 Module de Sortie
— Flux Vidéo Annoté : L’image originale est annotée avec :
— Boîtes de couleur indiquant le statut (Rejeté, Vérifié, Compté).
— Labels avec l’ID et les scores de vérification.
— Ligne de comptage et total.
— Fichier de Données : Mise à jour de comptage.csv.
— Fichier de Log : Mise à jour de counter_log.txt avec les détails de chaque décision.


Guide de l’Interface Visuelle
Compteur Automatique de Sacs de Ciment
Version 1.0
27 août 2025
Guide de l’Interface Visuelle- Compteur Automatique de Sacs de Ciment
1 Description de l’Écran
L’interface principale est une fenêtre vidéo affichant le flux de la caméra, enrichi d’in
formations superposées pour comprendre les décisions du système en temps réel.
2 Boîtes de Détection (Bounding Boxes)
Chaque objet suivi est entouré d’une boîte de couleur. La couleur indique le statut
actuel :
— Rouge (Rejected) : L’objet est suivi, mais n’a pas passé les tests de vérification
(logo, couleur, netteté). Il ne sera pas compté.
— Vert(Verified) : L’objet a passé tous les tests de vérification. Il est considéré comme
un vrai sac de ciment et est éligible pour être compté.
— Bleu (Counted) : L’objet a été vérifié (vert) et a franchi la ligne de comptage. Il a
été ajouté au total et ne sera plus compté.
3 Étiquettes d’Information
Au-dessus de chaque boîte, une étiquette fournit :
— ID:[num] : Identifiant de suivi unique de l’objet.
— [Status] : Statut actuel (Rejected, Verified, Counted).
— L:[score] : Score de correspondance du logo (entre 0.0 et 1.0).
— C:[score] : Score de similarité de la couleur (entre 0.0 et 1.0).
4 Éléments de l’Interface
— Ligne de Comptage (Jaune) : Ligne verticale jaune. Lorsqu’un objet Verified la
traverse de gauche à droite, il est compté et sa boîte devient Counted (bleue).
— Compteur Total (Bleu) : En haut à gauche, le texte Sacs Comptes: [nombre]
affiche le nombre total de sacs ayant franchi la ligne.

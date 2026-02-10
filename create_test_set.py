import os
import shutil
import random

# Définir les chemins relatifs vers vos dossiers
base_path = os.path.join('datasets', 'C-bag-test-M-TH-v1') # Assurez-vous que ce nom correspond bien au dossier dézippé
valid_dir = os.path.join(base_path, 'valid')
test_dir = os.path.join(base_path, 'test')

# Chemins des images et des labels
valid_images_path = os.path.join(valid_dir, 'images')
valid_labels_path = os.path.join(valid_dir, 'labels')
test_images_path = os.path.join(test_dir, 'images')
test_labels_path = os.path.join(test_dir, 'labels')

# S'assurer que les dossiers de destination existent
os.makedirs(test_images_path, exist_ok=True)
os.makedirs(test_labels_path, exist_ok=True)

# Obtenir la liste de toutes les images dans le dossier de validation
images = [f for f in os.listdir(valid_images_path) if f.endswith(('.jpg', '.jpeg', '.png'))]
random.shuffle(images) # Mélanger la liste pour une sélection aléatoire

# Calculer le nombre de fichiers à déplacer (50% du set de validation)
num_to_move = len(images) // 3

# Sélectionner les fichiers à déplacer
files_to_move = images[:num_to_move]

print(f"Total d'images dans 'valid': {len(images)}")
print(f"Déplacement de {len(files_to_move)} images (et leurs labels) vers 'test'...")

# Boucle pour déplacer chaque image et son label correspondant
for image_file in files_to_move:
    # Construire le nom du fichier label
    label_file = os.path.splitext(image_file)[0] + '.txt'

    # Construire les chemins source et destination
    src_image_path = os.path.join(valid_images_path, image_file)
    dst_image_path = os.path.join(test_images_path, image_file)
    
    src_label_path = os.path.join(valid_labels_path, label_file)
    dst_label_path = os.path.join(test_labels_path, label_file)

    # Vérifier si le fichier label existe avant de le déplacer
    if os.path.exists(src_label_path):
        # Déplacer les fichiers
        shutil.move(src_image_path, dst_image_path)
        shutil.move(src_label_path, dst_label_path)
        # print(f"Déplacé : {image_file}") # Décommenter pour voir chaque fichier
    else:
        print(f"Attention : Label non trouvé pour {image_file}, image non déplacée.")

print(f"\nOpération terminée.")
print(f"Images restantes dans 'valid': {len(os.listdir(valid_images_path))}")
print(f"Images maintenant dans 'test': {len(os.listdir(test_images_path))}")
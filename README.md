# Compteur Automatique de Sacs de Ciment - Industrial Edition

Ce projet est une solution complète de vision par ordinateur industrielle pour le comptage automatique de sacs de ciment. Il intègre un moteur de détection YOLOv8, un backend FastAPI robuste et un dashboard React moderne suivant les standards "Industrial Dark Mode".

## 🚀 Fonctionnalités Clés

- **Vision IA en Direct** : Détection et suivi en temps réel via YOLOv8 avec overlay de détection.
- **Tableau de Bord Industriel** : Interface React 19 hautement performante avec monitoring OEE et métriques de production.
- **Gestion des Sessions** : Pilotage manuel des sessions de production (Démarrer/Arrêter).
- **Journal de Production** : Historique détaillé de chaque sac avec capture d'image associée.
- **Qualité & Anomalies** : Détection des non-conformités et interface de vérification manuelle.
- **Communication Temps Réel** : Intégration WebSockets pour une réactivité instantanée entre la vision et l'interface.
- **Persistance des Données** : Base de données SQLite avec ORM SQLAlchemy.

## 🏗️ Architecture du Projet

- **Frontend** : React 19, TypeScript, Vite, Tailwind CSS 4, Radix UI, Recharts.
- **Backend** : FastAPI (Python), SQLAlchemy, WebSockets, MJPEG Streaming.
- **Vision** : OpenCV, YOLOv8 (Ultralytics), Pyzbar (QR Code).
- **Base de Données** : SQLite (migrable vers PostgreSQL).

---

## 🛠️ Installation et Configuration Locale

### 1. Prérequis
- Python 3.10+
- Node.js 18+ & pnpm (ou npm)
- Caméra USB ou flux RTSP (par défaut, utilise la webcam index 0)

### 2. Installation du Backend (Python)
```bash
# Se placer à la racine du projet
# Installer les dépendances
pip install -r requirements.txt
pip install fastapi uvicorn sqlalchemy python-multipart "python-jose[cryptography]" "passlib[bcrypt]" psutil ultralytics opencv-python pyzbar

# Initialiser la base de données (Crée cement_counter.db)
export PYTHONPATH=$PYTHONPATH:$(pwd)/backend
python3 -m app.init_db
```

### 3. Installation du Frontend (React)
```bash
cd dashboard
npm install --legacy-peer-deps
```

---

## 🚦 Procédure de Test

### 1. Lancer le Backend
Depuis la racine du projet :
```bash
export PYTHONPATH=$PYTHONPATH:$(pwd)/backend
uvicorn app.main:app --host 0.0.0.0 --port 8000
```
*Le backend sera accessible sur http://localhost:8000 et le flux vidéo sur http://localhost:8000/api/vision/video_feed.*

### 2. Lancer le Frontend
Dans un nouveau terminal, depuis le dossier `dashboard` :
```bash
npm run dev
```
*L'interface sera accessible par défaut sur http://localhost:3000.*

### 3. Identifiants par défaut
- **Utilisateur** : `admin`
- **Mot de passe** : `admin123`

---

## 📝 Guide d'Utilisation pour le Test
1. **Connexion** : Connectez-vous avec les identifiants admin.
2. **Démarrage** : Allez dans "Gestion des Sessions" et cliquez sur **"Nouvelle Session"**. Le moteur de vision commencera à enregistrer les détections.
3. **Flux Direct** : Allez dans "Flux en Direct" pour voir le retour caméra avec les boîtes de détection IA.
4. **Comptage** : Faites passer un sac (ou un objet simulé) devant la caméra. Il doit franchir la ligne verticale jaune pour être compté.
5. **Vérification** : Consultez le "Journal de Production" pour voir l'entrée créée et cliquez sur l'icône "œil" pour voir la capture d'image enregistrée.
6. **Arrêt** : Retournez dans "Gestion des Sessions" pour arrêter la session et figer les statistiques.

## 📁 Structure du Dépôt
- `backend/app/` : Code source de l'API FastAPI et du moteur Vision.
- `dashboard/frontend/src/` : Code source de l'interface React.
- `models/` : Contient le modèle YOLO `best_V5.pt`.
- `backend/static/captures/` : Dossier de stockage des snapshots de production.

## 📈 État d'Avancement de l'Intégration

### 1. Configuration
- [x] Paramètres Caméra (Connecté)
- [ ] Templates (Mocks)
- [ ] Configuration Modèle (Mocks)
- [ ] Ligne Virtuelle (Mocks)

### 2. Production
- [x] Journal de Production (Connecté)
- [x] Gestion des Sessions (Connecté)
- [ ] Chronologie (Mocks)

### 3. Monitoring
- [x] Tableau de Bord (Connecté)
- [x] Flux en Direct (Connecté)

### 4. Qualité
- [x] Qualité de Détection (Connecté)
- [x] Détection des Anomalies (Connecté)
- [x] Vérification Manuelle (Connecté)

### 5. Administration
- [x] Gestion des Utilisateurs (Connecté)
- [ ] Paramètres Système (Mocks)
- [ ] Gestion du Matériel (Mocks)
- [ ] Gestion de l'API (Mocks)

### 6. Autres
- [x] Santé Système (Connecté)
- [ ] Alertes (Mocks)
- [x] Rapports (Partiellement Connecté)

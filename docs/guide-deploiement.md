# Guide de Déploiement — Compteur Automatique de Sacs de Ciment

**Version** : 1.0 — Mars 2026
**Projet** : `compteur_ciment`
**Public cible** : Développeurs et administrateurs système

---

## Objectif

Ce guide explique comment déployer l'application **Compteur Automatique de Sacs de Ciment** dans quatre environnements distincts :

| Section | Environnement |
|---------|--------------|
| [A](#section-a--déploiement-local--windows) | Développement local — Windows |
| [B](#section-b--déploiement-local--linux-ubuntudebian) | Développement local — Linux (Ubuntu/Debian) |
| [C](#section-c--déploiement-production--windows) | Production — Windows (Docker Desktop) |
| [D](#section-d--déploiement-production--linux-ubuntu-server) | Production — Linux (Ubuntu Server) |

La mise à jour, le rollback et le dépannage sont traités à la fin du document.

---

## Architecture de l'application

```
Internet / LAN
      │
      ▼ (port 80)
  ┌──────────────────────────────────────┐
  │         Nginx (reverse proxy)        │
  │                                      │
  │  /api/*  ──────►  Backend FastAPI    │
  │                    (port 8000)       │
  │                                      │
  │  /       ──────►  Frontend React     │
  │                    (fichiers static) │
  └──────────────────────────────────────┘

Backend
  ├── FastAPI + Uvicorn
  ├── SQLAlchemy → SQLite (data/cement_counter.db)
  ├── Moteur YOLOv8 (thread de fond)
  └── WebSocket broadcast (comptage temps réel)

Frontend
  ├── React 19 + TypeScript
  ├── Vite + pnpm
  └── Tailwind CSS
```

---

## Prérequis matériels

| Composant | Minimum | Recommandé |
|-----------|---------|-----------|
| CPU | 4 cores @ 2.5 GHz | 8 cores @ 3.0 GHz |
| RAM | 4 Go | 8 Go |
| Disque | 50 Go | 100 Go+ |
| GPU | — | NVIDIA CUDA (inférence : 80-150 ms CPU vs 15-25 ms GPU) |
| Caméra | Webcam USB | Caméra IP (RTSP/HTTP) |
| OS | Windows 10/11 | Ubuntu 20.04+ / Debian 11+ |

> **Note GPU** : Sans GPU, YOLOv8 fonctionne sur CPU mais la latence est plus élevée. En production industrielle, une carte NVIDIA est fortement conseillée.

---

## Variables d'environnement — Référence complète

Le fichier `.env` à la racine du projet contient toutes les variables de configuration.

```dotenv
# ============================================================
# SECURITE — NE PAS POUSSER CE FICHIER SUR GIT
# ============================================================

# OBLIGATOIRE : clé secrète JWT (32+ caractères hexadécimaux)
# Générer avec : python -c "import secrets; print(secrets.token_hex(32))"
JWT_SECRET_KEY=<votre_cle_aleatoire_ici>

# OBLIGATOIRE : mot de passe du compte admin créé au démarrage
DEFAULT_ADMIN_PASSWORD=<mot_de_passe_fort>

# Base de données SQLite (chemin absolu dans le conteneur)
DATABASE_URL=sqlite:////data/cement_counter.db

# Origines CORS autorisées (séparer par des virgules)
# En production : remplacer localhost par l'IP/domaine réel
ALLOWED_ORIGINS=http://localhost,http://your-server-ip

# Moteur de vision
VISION_ENABLED=true
CAMERA_INDEX=0          # Index webcam USB (0 = première caméra)

# JWT
JWT_ALGORITHM=HS256
JWT_ACCESS_TOKEN_EXPIRE_MINUTES=60

# Logging
LOG_LEVEL=INFO          # DEBUG | INFO | WARNING | ERROR

# Rate limiting
RATELIMIT_ENABLED=true
```

> **AVERTISSEMENT DE SECURITE** : Ne jamais commiter le fichier `.env`. Le dépôt inclut un `.gitignore` qui l'exclut. Vérifier avec `git status` avant chaque commit.

---

## Section A — Déploiement Local : Windows

### Objectif de la section

Faire tourner le backend FastAPI et le frontend React en mode développement sur un poste Windows, sans Docker.

### Prérequis logiciels

- Windows 10 ou Windows 11 (64 bits)
- Accès Internet pour télécharger les dépendances
- Droits administrateur local

---

### Étape A.1 — Installer Python 3.11

1. Télécharger l'installateur depuis [python.org/downloads](https://www.python.org/downloads/release/python-3110/)
2. Lancer l'installateur et **cocher** `Add Python to PATH` avant de cliquer sur "Install Now"
3. Vérifier l'installation dans un terminal PowerShell ou CMD :

```powershell
python --version
# Attendu : Python 3.11.x

pip --version
# Attendu : pip 23.x.x from ... (python 3.11)
```

---

### Étape A.2 — Installer Node.js 20 LTS

1. Télécharger Node.js 20 LTS depuis [nodejs.org](https://nodejs.org/en/download)
2. Lancer l'installateur (option "Automatic" pour les outils compilateurs)
3. Vérifier :

```powershell
node --version
# Attendu : v20.x.x

npm --version
# Attendu : 10.x.x
```

---

### Étape A.3 — Installer pnpm

pnpm est le gestionnaire de paquets utilisé par le frontend.

```powershell
npm install -g pnpm

pnpm --version
# Attendu : 9.x.x ou supérieur
```

---

### Étape A.4 — Cloner le dépôt

```powershell
git clone https://github.com/<organisation>/compteur_ciment.git
cd compteur_ciment
```

Structure obtenue :

```
compteur_ciment/
├── backend/
│   ├── app/
│   │   ├── main.py
│   │   ├── models.py
│   │   ├── auth.py
│   │   ├── schemas.py
│   │   ├── database.py
│   │   └── vision_engine.py
│   ├── models/
│   ├── static/
│   ├── tests/
│   ├── requirements.txt
│   └── Dockerfile
├── dashboard/
│   ├── src/
│   ├── package.json
│   └── Dockerfile
├── docker-compose.yml
└── docs/
```

---

### Étape A.5 — Générer la clé JWT et créer le fichier .env

Générer une clé secrète robuste :

```powershell
python -c "import secrets; print(secrets.token_hex(32))"
# Exemple de sortie : a3f8e2c1d9b4... (64 caractères hexadécimaux)
```

Copier le fichier exemple et l'éditer :

```powershell
copy .env.example .env
notepad .env
```

Si `.env.example` n'existe pas, créer `.env` manuellement avec le contenu suivant (remplacer les valeurs entre `<>`) :

```dotenv
JWT_SECRET_KEY=a3f8e2c1d9b4057e6f3a8c2d1e9b4057e6f3a8c2d1e9b4057e6f3a8c2d1e9b4
DEFAULT_ADMIN_PASSWORD=MonMotDePasseForte2026!
DATABASE_URL=sqlite:///./data/cement_counter.db
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:8000
VISION_ENABLED=true
CAMERA_INDEX=0
JWT_ALGORITHM=HS256
JWT_ACCESS_TOKEN_EXPIRE_MINUTES=60
LOG_LEVEL=DEBUG
RATELIMIT_ENABLED=false
```

> **Note développement** : `LOG_LEVEL=DEBUG` et `RATELIMIT_ENABLED=false` facilitent le débogage local.

---

### Étape A.6 — Préparer le backend

Ouvrir un terminal PowerShell dans le répertoire `backend/` :

```powershell
cd backend

# Créer l'environnement virtuel Python
python -m venv venv

# Activer l'environnement virtuel
.\venv\Scripts\Activate.ps1

# Si une erreur de politique d'exécution apparaît :
# Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser

# Vérifier que le bon Python est utilisé
python --version
# Attendu : Python 3.11.x

# Installer les dépendances
pip install -r requirements.txt
```

L'installation de `ultralytics` (YOLOv8) et `opencv-python` peut prendre quelques minutes selon la connexion Internet.

Vérifier que les dépendances critiques sont installées :

```powershell
pip show fastapi uvicorn sqlalchemy ultralytics opencv-python
```

---

### Étape A.7 — Lancer le backend

Depuis `backend/` avec le venv activé :

```powershell
# Créer le répertoire de données s'il n'existe pas
mkdir ..\data 2>$null

uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Sortie attendue au démarrage :

```
INFO:     Will watch for changes in these directories: ['...\\backend']
INFO:     Uvicorn running on http://0.0.0.0:8000 (Press CTRL+C to quit)
INFO:     Started reloader process [...]
INFO:     Started server process [...]
INFO:     Application startup complete.
```

Vérifier que l'API répond :

```powershell
# Dans un autre terminal PowerShell
curl http://localhost:8000/api/health
# Attendu : {"status":"ok","version":"..."}
```

La documentation interactive Swagger est disponible à : http://localhost:8000/docs

---

### Étape A.8 — Lancer le frontend

Ouvrir un **nouveau** terminal PowerShell dans le répertoire `dashboard/` :

```powershell
cd dashboard

# Installer les dépendances Node.js
pnpm install

# Lancer le serveur de développement
pnpm dev
```

Sortie attendue :

```
  VITE v5.x.x  ready in 1234 ms

  ➜  Local:   http://localhost:3000/
  ➜  Network: http://192.168.x.x:3000/
```

---

### Étape A.9 — Premier accès et connexion

Ouvrir un navigateur et aller sur : **http://localhost:3000**

Credentials par défaut :
- **Utilisateur** : `admin`
- **Mot de passe** : valeur de `DEFAULT_ADMIN_PASSWORD` dans le fichier `.env`

> **SECURITE** : Changer le mot de passe admin immédiatement après la première connexion via l'interface utilisateur (Paramètres → Compte).

---

### Étape A.10 — (Optionnel) Placer le modèle YOLO

Pour activer la détection de sacs, placer le fichier modèle `.pt` dans le répertoire `models/` :

```powershell
# Exemple : copier le modèle entraîné
copy C:\path\to\cement_detector.pt .\models\

# Ou utiliser le modèle YOLOv8 de base (téléchargement automatique au premier lancement)
# best.pt sera téléchargé automatiquement par ultralytics si absent
```

Redémarrer le backend pour que le moteur de vision charge le modèle.

---

### Résumé des URLs en développement Windows

| Service | URL |
|---------|-----|
| Frontend React | http://localhost:3000 |
| Backend FastAPI | http://localhost:8000 |
| Swagger UI | http://localhost:8000/docs |
| ReDoc | http://localhost:8000/redoc |

---

## Section B — Déploiement Local : Linux (Ubuntu/Debian)

### Objectif de la section

Faire tourner le backend FastAPI et le frontend React en mode développement sur Ubuntu 22.04 LTS.

---

### Étape B.1 — Mettre à jour le système et installer les dépendances système

```bash
sudo apt update && sudo apt upgrade -y

# Dépendances système pour OpenCV, YOLOv8 et les outils de build
sudo apt install -y \
    build-essential \
    git \
    curl \
    wget \
    python3.11 \
    python3.11-venv \
    python3.11-dev \
    python3-pip \
    libopencv-dev \
    libzbar0 \
    tesseract-ocr \
    libtesseract-dev \
    libgl1-mesa-glx \
    libglib2.0-0 \
    libsm6 \
    libxrender1 \
    libxext6 \
    ffmpeg
```

Vérifier Python 3.11 :

```bash
python3.11 --version
# Attendu : Python 3.11.x
```

---

### Étape B.2 — Installer Node.js 20 LTS via NodeSource

```bash
# Ajouter le dépôt NodeSource pour Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -

# Installer Node.js
sudo apt install -y nodejs

node --version
# Attendu : v20.x.x

npm --version
# Attendu : 10.x.x
```

---

### Étape B.3 — Installer pnpm

```bash
npm install -g pnpm

pnpm --version
# Attendu : 9.x.x
```

---

### Étape B.4 — Cloner le dépôt

```bash
cd /opt   # Ou tout autre répertoire de travail
sudo mkdir compteur_ciment
sudo chown $USER:$USER compteur_ciment

git clone https://github.com/<organisation>/compteur_ciment.git
cd compteur_ciment
```

---

### Étape B.5 — Créer le fichier .env

```bash
# Générer la clé JWT
python3.11 -c "import secrets; print(secrets.token_hex(32))"
# Copier la sortie pour l'utiliser ci-dessous

# Créer le fichier .env
cat > .env << 'EOF'
JWT_SECRET_KEY=REMPLACER_PAR_LA_CLE_GENEREE_CI_DESSUS
DEFAULT_ADMIN_PASSWORD=MonMotDePasseForte2026!
DATABASE_URL=sqlite:///./data/cement_counter.db
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:8000
VISION_ENABLED=true
CAMERA_INDEX=0
JWT_ALGORITHM=HS256
JWT_ACCESS_TOKEN_EXPIRE_MINUTES=60
LOG_LEVEL=DEBUG
RATELIMIT_ENABLED=false
EOF

# Restreindre les permissions du fichier .env
chmod 600 .env
```

---

### Étape B.6 — Préparer le backend

```bash
cd backend

# Créer l'environnement virtuel avec Python 3.11
python3.11 -m venv venv

# Activer l'environnement
source venv/bin/activate

# Vérifier
python --version
# Attendu : Python 3.11.x

# Installer les dépendances
pip install --upgrade pip
pip install -r requirements.txt
```

> **Note** : Sur Ubuntu, le paquet `opencv-python` installé via pip peut nécessiter `libGL` :
> ```bash
> sudo apt install -y libgl1-mesa-glx
> ```

---

### Étape B.7 — Lancer le backend

```bash
# Depuis backend/ avec le venv activé
mkdir -p ../data

uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Tester dans un second terminal :

```bash
curl http://localhost:8000/api/health
# Attendu : {"status":"ok","version":"..."}
```

---

### Étape B.8 — Lancer le frontend

```bash
cd /opt/compteur_ciment/dashboard

pnpm install
pnpm dev
```

L'application est accessible sur : **http://localhost:3000**

---

### Étape B.9 — (Optionnel) Accès caméra USB

Sur Linux, l'utilisateur courant doit appartenir au groupe `video` :

```bash
sudo usermod -aG video $USER

# Vérifier les caméras disponibles
ls /dev/video*
# Exemple : /dev/video0  /dev/video1

# Tester la caméra (nécessite ffplay ou vlc)
ffplay /dev/video0
```

Après modification du groupe, se déconnecter et se reconnecter pour que le changement prenne effet.

---

### Résumé des URLs en développement Linux

| Service | URL |
|---------|-----|
| Frontend React | http://localhost:3000 |
| Backend FastAPI | http://localhost:8000 |
| Swagger UI | http://localhost:8000/docs |

---

## Section C — Déploiement Production : Windows

### Objectif de la section

Déployer l'application en production sur Windows avec Docker Desktop, derrière Nginx, en utilisant `docker-compose`.

---

### Prérequis

- Windows 10 Pro / Windows 11 Pro (WSL2 activé)
- Docker Desktop 4.x ou supérieur
- 8 Go de RAM recommandés
- Droits administrateur

---

### Étape C.1 — Installer Docker Desktop

1. Télécharger depuis [docker.com/products/docker-desktop](https://www.docker.com/products/docker-desktop/)
2. Lancer l'installateur et **cocher** "Use WSL 2 instead of Hyper-V"
3. Redémarrer le système après l'installation
4. Démarrer Docker Desktop depuis le menu Démarrer
5. Vérifier :

```powershell
docker --version
# Attendu : Docker version 26.x.x

docker compose version
# Attendu : Docker Compose version v2.x.x
```

---

### Étape C.2 — Cloner le dépôt

```powershell
git clone https://github.com/<organisation>/compteur_ciment.git
cd compteur_ciment
```

---

### Étape C.3 — Créer le fichier .env de production

> **AVERTISSEMENT** : En production, utiliser des mots de passe forts et une clé JWT robuste. Ne jamais utiliser "admin" comme mot de passe.

```powershell
# Générer une clé JWT de 64 caractères hexadécimaux
python -c "import secrets; print(secrets.token_hex(32))"
```

Créer le fichier `.env` :

```powershell
notepad .env
```

Contenu du fichier `.env` de production (adapter les valeurs) :

```dotenv
# ============================================================
# PRODUCTION — GARDER CE FICHIER CONFIDENTIEL
# ============================================================

# Clé JWT — OBLIGATOIRE — Générer avec python -c "import secrets; print(secrets.token_hex(32))"
JWT_SECRET_KEY=a3f8e2c1d9b4057e6f3a8c2d1e9b4057e6f3a8c2d1e9b4057e6f3a8c2d1e9b4

# Mot de passe admin — OBLIGATOIRE — Utiliser un mot de passe fort
DEFAULT_ADMIN_PASSWORD=Cim3nt@Prod2026!

# Base de données (chemin absolu dans le conteneur Docker)
DATABASE_URL=sqlite:////data/cement_counter.db

# Origines CORS — Remplacer par l'IP ou le domaine réel du serveur
ALLOWED_ORIGINS=http://localhost,http://192.168.1.100

# Vision
VISION_ENABLED=true
CAMERA_INDEX=0

# JWT
JWT_ALGORITHM=HS256
JWT_ACCESS_TOKEN_EXPIRE_MINUTES=60

# Logs
LOG_LEVEL=INFO

# Rate limiting — ACTIVER en production
RATELIMIT_ENABLED=true
```

---

### Étape C.4 — Placer le modèle YOLO

```powershell
# Copier le modèle entraîné dans le répertoire models/
copy C:\chemin\vers\cement_detector.pt .\models\best.pt

# Vérifier
dir models\
```

---

### Étape C.5 — Lancer avec Docker Compose

```powershell
# Construire les images et démarrer les conteneurs en arrière-plan
docker compose up -d --build
```

Sortie attendue :

```
[+] Building 45.3s (18/18) FINISHED
 ✔ Container ciment_backend   Started
 ✔ Container ciment_frontend  Started
```

---

### Étape C.6 — Vérifier le déploiement

```powershell
# Vérifier que les deux conteneurs tournent
docker compose ps
```

Sortie attendue :

```
NAME                IMAGE                  COMMAND       SERVICE     STATUS
ciment_backend      compteur_ciment-back   "uvicorn..."  backend     running (healthy)
ciment_frontend     compteur_ciment-front  "/docker..."  frontend    running
```

```powershell
# Vérifier le health check du backend
curl http://localhost:8000/api/health
# Attendu : {"status":"ok"}

# Vérifier que Nginx sert le frontend
curl -I http://localhost
# Attendu : HTTP/1.1 200 OK

# Consulter les logs en temps réel
docker compose logs -f
```

L'application est accessible sur : **http://localhost**

---

### Étape C.7 — Sécurisation post-déploiement

1. **Changer le mot de passe admin** : Se connecter sur http://localhost, aller dans Paramètres → Compte, changer le mot de passe.

2. **Restreindre ALLOWED_ORIGINS** : Dans `.env`, remplacer `http://localhost` par l'IP ou domaine exact du serveur :
   ```dotenv
   ALLOWED_ORIGINS=http://192.168.1.100
   ```
   Puis redémarrer : `docker compose restart backend`

3. **Configurer le pare-feu Windows** : Restreindre le port 80 aux machines du réseau local uniquement.

---

### Étape C.8 — Procédure de sauvegarde (Windows)

La base de données SQLite est stockée dans un volume Docker nommé `db_data`.

```powershell
# Créer un répertoire de sauvegarde
mkdir C:\backups\ciment

# Sauvegarder la base de données
$DATE = Get-Date -Format "yyyy-MM-dd"
docker run --rm `
    -v compteur_ciment_db_data:/data `
    -v C:\backups\ciment:/backup `
    alpine sh -c "cp /data/cement_counter.db /backup/cement_counter_$DATE.db"

# Vérifier la sauvegarde
dir C:\backups\ciment\
```

Automatiser avec le Planificateur de tâches Windows pour une sauvegarde quotidienne.

---

## Section D — Déploiement Production : Linux (Ubuntu Server)

### Objectif de la section

Déployer l'application en production sur Ubuntu Server 22.04 LTS avec Docker Compose, avec des options pour systemd, HTTPS (Let's Encrypt) et la supervision.

---

### Étape D.1 — Préparer le serveur Ubuntu 22.04

```bash
# Mettre à jour le système
sudo apt update && sudo apt upgrade -y

# Installer les outils de base
sudo apt install -y \
    curl \
    wget \
    git \
    htop \
    unzip \
    ca-certificates \
    gnupg \
    lsb-release
```

---

### Étape D.2 — Installer Docker et Docker Compose

```bash
# Ajouter la clé GPG officielle de Docker
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | \
    sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg

# Ajouter le dépôt Docker
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] \
  https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Installer Docker Engine et Docker Compose plugin
sudo apt update
sudo apt install -y \
    docker-ce \
    docker-ce-cli \
    containerd.io \
    docker-buildx-plugin \
    docker-compose-plugin

# Ajouter l'utilisateur courant au groupe docker (évite sudo pour chaque commande)
sudo usermod -aG docker $USER
newgrp docker

# Vérifier
docker --version
# Attendu : Docker version 26.x.x

docker compose version
# Attendu : Docker Compose version v2.x.x
```

---

### Étape D.3 — Cloner le dépôt et préparer les répertoires

```bash
# Cloner dans /opt pour un déploiement système
sudo git clone https://github.com/<organisation>/compteur_ciment.git /opt/compteur_ciment

# Donner les droits à l'utilisateur courant
sudo chown -R $USER:$USER /opt/compteur_ciment
cd /opt/compteur_ciment
```

---

### Étape D.4 — Créer le fichier .env de production

```bash
# Générer une clé JWT robuste
python3 -c "import secrets; print(secrets.token_hex(32))"
# Copier la sortie — ex : a3f8e2c1...

# Créer le fichier .env
cat > /opt/compteur_ciment/.env << 'ENVEOF'
# ============================================================
# PRODUCTION — FICHIER CONFIDENTIEL
# ============================================================
JWT_SECRET_KEY=REMPLACER_PAR_LA_CLE_GENEREE
DEFAULT_ADMIN_PASSWORD=Cim3nt@Prod2026!
DATABASE_URL=sqlite:////data/cement_counter.db
ALLOWED_ORIGINS=http://votre-serveur.domaine.com,http://192.168.1.100
VISION_ENABLED=true
CAMERA_INDEX=0
JWT_ALGORITHM=HS256
JWT_ACCESS_TOKEN_EXPIRE_MINUTES=60
LOG_LEVEL=INFO
RATELIMIT_ENABLED=true
ENVEOF

# Restreindre les permissions
chmod 600 /opt/compteur_ciment/.env
```

Éditer le fichier pour remplacer les valeurs :

```bash
nano /opt/compteur_ciment/.env
```

---

### Étape D.5 — Placer le modèle YOLO

```bash
# Copier le modèle depuis la machine locale via scp
# (exécuter depuis la machine locale, pas le serveur)
scp /chemin/local/cement_detector.pt user@serveur:/opt/compteur_ciment/models/best.pt

# Ou, si déjà connecté au serveur :
ls /opt/compteur_ciment/models/
# Vérifier que best.pt est présent
```

---

### Étape D.6 — Lancer avec Docker Compose

```bash
cd /opt/compteur_ciment

# Construire et démarrer
docker compose up -d --build

# Suivre les logs de démarrage
docker compose logs -f --tail=50
```

---

### Étape D.7 — Vérifier le déploiement

```bash
# Statut des conteneurs
docker compose ps

# Attendu :
# NAME                STATUS
# ciment_backend      running (healthy)
# ciment_frontend     running

# Health check API
curl http://localhost:8000/api/health
# Attendu : {"status":"ok"}

# Frontend via Nginx
curl -I http://localhost
# Attendu : HTTP/1.1 200 OK

# Tester depuis l'extérieur (remplacer par l'IP réelle)
curl http://192.168.1.100/api/health
```

---

### Étape D.8 — (Optionnel) Service systemd

Pour que l'application démarre automatiquement au boot du serveur :

```bash
# Créer le fichier de service systemd
sudo tee /etc/systemd/system/compteur-ciment.service << 'EOF'
[Unit]
Description=Compteur Automatique de Sacs de Ciment
Requires=docker.service
After=docker.service network-online.target
Wants=network-online.target

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=/opt/compteur_ciment
ExecStart=/usr/bin/docker compose up -d
ExecStop=/usr/bin/docker compose down
TimeoutStartSec=300
Restart=on-failure
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

# Activer et démarrer le service
sudo systemctl daemon-reload
sudo systemctl enable compteur-ciment.service
sudo systemctl start compteur-ciment.service

# Vérifier le statut
sudo systemctl status compteur-ciment.service
```

---

### Étape D.9 — (Optionnel) HTTPS avec Nginx + Let's Encrypt

Cette étape nécessite un nom de domaine pointant sur le serveur et le port 80/443 ouvert.

```bash
# Installer Certbot
sudo apt install -y certbot python3-certbot-nginx

# Arrêter le conteneur frontend (il occupe le port 80)
cd /opt/compteur_ciment
docker compose stop frontend

# Obtenir le certificat SSL
sudo certbot certonly --standalone -d votre-domaine.com

# Créer la configuration Nginx avec SSL sur l'hôte
# (remplacer l'usage du Nginx conteneurisé par un Nginx système)
sudo apt install -y nginx

sudo tee /etc/nginx/sites-available/compteur_ciment << 'NGINXEOF'
server {
    listen 80;
    server_name votre-domaine.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name votre-domaine.com;

    ssl_certificate     /etc/letsencrypt/live/votre-domaine.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/votre-domaine.com/privkey.pem;
    ssl_protocols       TLSv1.2 TLSv1.3;
    ssl_ciphers         HIGH:!aNULL:!MD5;

    # Frontend — fichiers statiques servis directement
    location / {
        root /opt/compteur_ciment/dashboard/dist;
        try_files $uri $uri/ /index.html;
    }

    # Backend API
    location /api/ {
        proxy_pass         http://localhost:8000;
        proxy_http_version 1.1;
        proxy_set_header   Upgrade $http_upgrade;
        proxy_set_header   Connection "upgrade";
        proxy_set_header   Host $host;
        proxy_set_header   X-Real-IP $remote_addr;
        proxy_set_header   X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Proto $scheme;
    }

    # WebSocket
    location /ws/ {
        proxy_pass         http://localhost:8000;
        proxy_http_version 1.1;
        proxy_set_header   Upgrade $http_upgrade;
        proxy_set_header   Connection "upgrade";
    }
}
NGINXEOF

sudo ln -s /etc/nginx/sites-available/compteur_ciment /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx

# Renouvellement automatique du certificat
sudo systemctl enable certbot.timer
```

Mettre à jour `ALLOWED_ORIGINS` dans `.env` :

```dotenv
ALLOWED_ORIGINS=https://votre-domaine.com
```

---

### Étape D.10 — Stratégie de sauvegarde (Linux)

```bash
# Créer le répertoire de sauvegarde
sudo mkdir -p /var/backups/compteur_ciment
sudo chown $USER:$USER /var/backups/compteur_ciment

# Script de sauvegarde
cat > /opt/compteur_ciment/scripts/backup.sh << 'EOF'
#!/bin/bash
set -e

BACKUP_DIR="/var/backups/compteur_ciment"
DATE=$(date +%Y-%m-%d_%H-%M-%S)
BACKUP_FILE="$BACKUP_DIR/cement_counter_$DATE.db"

# Copier la base de données depuis le volume Docker
docker run --rm \
    -v compteur_ciment_db_data:/data \
    -v "$BACKUP_DIR":/backup \
    alpine sh -c "cp /data/cement_counter.db /backup/cement_counter_$DATE.db"

echo "[$(date)] Sauvegarde créée : $BACKUP_FILE"

# Supprimer les sauvegardes de plus de 30 jours
find "$BACKUP_DIR" -name "*.db" -mtime +30 -delete
echo "[$(date)] Nettoyage : sauvegardes de plus de 30 jours supprimées."
EOF

chmod +x /opt/compteur_ciment/scripts/backup.sh

# Automatiser avec cron (sauvegarde quotidienne à 2h00)
(crontab -l 2>/dev/null; echo "0 2 * * * /opt/compteur_ciment/scripts/backup.sh >> /var/log/ciment_backup.log 2>&1") | crontab -

# Vérifier
crontab -l
```

---

### Étape D.11 — Supervision

```bash
# Voir l'utilisation des ressources des conteneurs en temps réel
docker stats ciment_backend ciment_frontend

# Exemple de sortie :
# NAME                CPU %     MEM USAGE / LIMIT     MEM %
# ciment_backend      12.5%     312MiB / 7.77GiB     3.92%
# ciment_frontend     0.1%      8MiB / 7.77GiB       0.10%

# Logs en temps réel avec horodatage
docker compose -f /opt/compteur_ciment/docker-compose.yml logs -f --timestamps

# Santé du conteneur backend
docker inspect --format='{{.State.Health.Status}}' ciment_backend
# Attendu : healthy
```

---

## Mise à jour de l'application

### Procédure standard (tous environnements)

```bash
cd /opt/compteur_ciment   # Ou le répertoire d'installation

# 1. Récupérer les dernières modifications
git pull origin main

# 2. Reconstruire et redémarrer les conteneurs
docker compose up -d --build

# 3. Vérifier que les conteneurs sont sains
docker compose ps

# 4. Consulter les logs pour détecter des erreurs au démarrage
docker compose logs --tail=100
```

### Mise à jour du modèle YOLO uniquement

```bash
# Remplacer le fichier modèle sans reconstruire l'image
cp /chemin/vers/nouveau_modele.pt /opt/compteur_ciment/models/best.pt

# Redémarrer uniquement le backend
docker compose restart backend

# Vérifier
docker compose logs backend --tail=20
```

---

## Rollback

### Rollback vers le commit précédent

```bash
cd /opt/compteur_ciment

# Lister les commits récents
git log --oneline -10

# Exemple de sortie :
# 5c70331 fix: tests CI
# f26e9b5 fix: chemins statiques absolus
# 7408c6e fix: CI — zéro erreur ruff

# Revenir au commit précédent (remplacer par le hash souhaité)
git checkout f26e9b5

# Reconstruire avec l'ancienne version
docker compose up -d --build
```

### Rollback de la base de données

```bash
# Arrêter le backend
docker compose stop backend

# Restaurer une sauvegarde
docker run --rm \
    -v compteur_ciment_db_data:/data \
    -v /var/backups/compteur_ciment:/backup \
    alpine sh -c "cp /backup/cement_counter_2026-03-26_02-00-00.db /data/cement_counter.db"

# Redémarrer
docker compose start backend

# Vérifier
curl http://localhost:8000/api/health
```

---

## Dépannage

### Problème : Le backend ne démarre pas — "JWT_SECRET_KEY not set"

**Symptôme** :
```
ERROR: JWT_SECRET_KEY environment variable is required
```

**Cause** : Le fichier `.env` est absent ou `JWT_SECRET_KEY` n'est pas défini.

**Solution** :
```bash
# Vérifier que .env existe
ls -la /opt/compteur_ciment/.env

# Vérifier que la variable est bien définie (sans afficher la valeur)
grep -c "JWT_SECRET_KEY=" /opt/compteur_ciment/.env
# Attendu : 1

# Régénérer si nécessaire
python3 -c "import secrets; print(secrets.token_hex(32))"
# Mettre à jour .env, puis :
docker compose restart backend
```

---

### Problème : Conteneur backend en état "unhealthy"

**Symptôme** :
```bash
docker compose ps
# ciment_backend   unhealthy
```

**Diagnostic** :
```bash
# Voir les logs du conteneur
docker compose logs backend --tail=50

# Tester manuellement le health check
docker exec ciment_backend curl -f http://localhost:8000/api/health
```

**Causes fréquentes** :
- Port 8000 déjà utilisé par un autre processus
- Erreur dans le fichier `.env` (variable mal formatée)
- La base de données est corrompue

```bash
# Vérifier si le port 8000 est déjà utilisé
sudo ss -tlnp | grep 8000

# Recréer les conteneurs depuis zéro
docker compose down
docker compose up -d --build
```

---

### Problème : Erreur CORS — "Access-Control-Allow-Origin"

**Symptôme** : Le frontend affiche des erreurs CORS dans la console du navigateur.

**Cause** : L'URL d'accès n'est pas dans `ALLOWED_ORIGINS`.

**Solution** :
```bash
# Éditer .env
nano /opt/compteur_ciment/.env

# Ajouter l'URL manquante
ALLOWED_ORIGINS=http://localhost,http://192.168.1.100,http://votre-domaine.com

# Redémarrer le backend
docker compose restart backend
```

---

### Problème : La caméra n'est pas détectée

**Symptôme** :
```
ERROR: Cannot open camera with index 0
```

**Diagnostic sur Linux** :
```bash
# Lister les périphériques vidéo
ls /dev/video*

# Vérifier les permissions
ls -la /dev/video0
```

**Solution** : Le conteneur Docker doit avoir accès au périphérique `/dev/video0`. Ajouter au service `backend` dans `docker-compose.yml` :

```yaml
services:
  backend:
    # ...
    devices:
      - /dev/video0:/dev/video0
    group_add:
      - video
```

Puis redémarrer :
```bash
docker compose up -d
```

---

### Problème : Performances lentes de la détection YOLO

**Symptôme** : Latence d'inférence > 200 ms par image.

**Cause** : YOLOv8 s'exécute sur CPU au lieu du GPU.

**Diagnostic** :
```bash
docker exec ciment_backend python3 -c "import torch; print(torch.cuda.is_available())"
# False = pas de GPU détecté
```

**Solution avec GPU NVIDIA** :
1. Installer les pilotes NVIDIA et NVIDIA Container Toolkit :
```bash
distribution=$(. /etc/os-release;echo $ID$VERSION_ID)
curl -s -L https://nvidia.github.io/nvidia-docker/gpgkey | sudo apt-key add -
curl -s -L https://nvidia.github.io/nvidia-docker/$distribution/nvidia-docker.list | \
    sudo tee /etc/apt/sources.list.d/nvidia-docker.list
sudo apt update && sudo apt install -y nvidia-container-toolkit
sudo systemctl restart docker
```

2. Ajouter au service `backend` dans `docker-compose.yml` :
```yaml
services:
  backend:
    # ...
    deploy:
      resources:
        reservations:
          devices:
            - driver: nvidia
              count: 1
              capabilities: [gpu]
```

---

### Problème : "No space left on device" (volumes Docker)

**Diagnostic** :
```bash
# Vérifier l'espace disque
df -h

# Voir la taille des volumes Docker
docker system df

# Nettoyer les images, conteneurs et volumes inutilisés
docker system prune -af --volumes
```

> **ATTENTION** : `docker system prune --volumes` supprime TOUS les volumes non utilisés. Sauvegarder la base de données avant.

---

### Problème : Impossible de se connecter après changement de mot de passe

**Solution** : Réinitialiser le compte admin en modifiant `DEFAULT_ADMIN_PASSWORD` dans `.env` et en recréant la base de données.

```bash
# ATTENTION : ceci supprime TOUTES les données
docker compose down -v
docker compose up -d --build
```

Alternativement, utiliser l'API pour réinitialiser le mot de passe via un compte admin fonctionnel :

```bash
curl -X POST http://localhost:8000/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"username":"admin","password":"<ancien_mot_de_passe>"}'
# Récupérer le token et l'utiliser pour changer le mot de passe via /api/users/me
```

---

## Récapitulatif des commandes essentielles

```bash
# Démarrer l'application
docker compose up -d

# Arrêter l'application
docker compose down

# Voir les logs en temps réel
docker compose logs -f

# Redémarrer uniquement le backend
docker compose restart backend

# Vérifier la santé des conteneurs
docker compose ps

# Accéder au shell du conteneur backend
docker exec -it ciment_backend bash

# Mettre à jour l'application
git pull origin main && docker compose up -d --build

# Sauvegarder la base de données
docker run --rm \
    -v compteur_ciment_db_data:/data \
    -v $(pwd)/backups:/backup \
    alpine sh -c "cp /data/cement_counter.db /backup/cement_counter_$(date +%Y%m%d).db"
```

---

*Guide rédigé en mars 2026 — Version 1.0*

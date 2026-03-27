# Compteur Automatique de Sacs de Ciment

[![CI — Backend Tests](https://github.com/archix-239/compteur-ciment/actions/workflows/ci.yml/badge.svg)](https://github.com/archix-239/compteur-ciment/actions/workflows/ci.yml)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?logo=docker&logoColor=white)](https://hub.docker.com/)
[![Python](https://img.shields.io/badge/Python-3.11-3776AB?logo=python&logoColor=white)](https://www.python.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![YOLOv8](https://img.shields.io/badge/YOLOv8-Ultralytics-FF6B35)](https://ultralytics.com/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.11x-009688?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![Licence MIT](https://img.shields.io/badge/Licence-MIT-green)](./LICENSE)

---

> **1 100 sacs par heure. Zéro erreur de comptage. Un seul écran.**
>
> Sur une ligne de production cimentière, chaque sac compte — au sens propre comme au sens financier. Une erreur de comptage de 1 % sur un poste de 8 heures représente 88 sacs non tracés. Ce projet met fin à ce problème en remplaçant le comptage humain par un moteur de vision artificielle YOLOv8, un backend industriel FastAPI et un dashboard React temps réel, le tout déployable en 5 minutes avec Docker.

---

## Table des matières

1. [Fonctionnalités](#1-fonctionnalités)
2. [Architecture](#2-architecture)
3. [Prérequis](#3-prérequis)
4. [Installation rapide — Docker (5 min)](#4-installation-rapide--docker-5-min)
5. [Installation développement](#5-installation-développement)
6. [Configuration (.env)](#6-configuration-env)
7. [Utilisation](#7-utilisation)
8. [Structure du projet](#8-structure-du-projet)
9. [Tests](#9-tests)
10. [CI/CD](#10-cicd)
11. [Documentation](#11-documentation)
12. [Contribution](#12-contribution)
13. [Licence](#13-licence)

---

## 1. Fonctionnalités

### Vision et comptage

| Fonctionnalité | Détail |
|---|---|
| Détection temps réel | YOLOv8 analyse chaque frame de la caméra |
| Ligne virtuelle de comptage | Franchissement configurable par drag-and-drop |
| Contrôle qualité automatique | Vérification logo, couleur et score de confiance |
| Multi-caméras | USB, RTSP (IP cam), HTTP (flux MJPEG) |
| Flux vidéo live | Streaming MJPEG + overlay de détection |

### Production et qualité

- **Sessions de production** — démarrage, pause et clôture depuis le dashboard
- **Journal par sac** — chaque détection horodatée avec capture d'image associée
- **Alertes configurables** — cadence anormale, taux de rejet, perte de signal caméra
- **Rapports et exports** — CSV, Excel, PDF, JSON à la demande ou planifiés

### Plateforme

- **Dashboard WebSocket** — métriques OEE rafraîchies sans rechargement de page
- **RBAC complet** — Admin, Opérateur, Viewer + rôles personnalisés
- **API REST documentée** — 121 routes, authentification JWT et clés API
- **Intégrations** — SMTP, Slack, MS Teams, webhooks génériques
- **Backup / archive** — sauvegarde planifiable de la base de données SQLite

---

## 2. Architecture

```
                    ┌─────────────────────────────────────────────┐
                    │              Docker Compose                  │
                    │                                             │
  Navigateur  ───▶  │  Nginx  :80                                 │
                    │    ├── /api/*  ──────▶  FastAPI  :8000      │
                    │    └── /       ──────▶  React (static)      │
                    │                                             │
                    │  FastAPI  :8000                             │
                    │    ├── SQLite  (/data/*.db)                  │
                    │    ├── YOLOv8 Engine  (thread dédié)        │
                    │    └── WebSocket broadcast                   │
                    └─────────────────────────────────────────────┘
                                        │
                    ┌───────────────────▼──────────────────────┐
                    │            Caméra source                  │
                    │   USB  /  RTSP (IP)  /  HTTP (MJPEG)     │
                    └──────────────────────────────────────────┘
```

**Flux de données résumé :**

```
Caméra ──▶ OpenCV capture ──▶ YOLOv8 inférence
    ──▶ Franchissement ligne virtuelle
    ──▶ SQLite (bag_detections)
    ──▶ WebSocket ──▶ React Dashboard (mise à jour instantanée)
```

### Pile technologique

| Couche | Technologies |
|---|---|
| Frontend | React 19, TypeScript, Vite, Tailwind CSS 4, Radix UI, Recharts, Wouter |
| Backend | Python 3.11, FastAPI, SQLAlchemy, Pydantic, slowapi, bcrypt, JWT |
| Vision | OpenCV, YOLOv8 (ultralytics), ORB matching, analyse colorimétrique, pyzbar, pytesseract |
| Base de données | SQLite (migrable PostgreSQL), 11 tables |
| Déploiement | Docker, Docker Compose, Nginx |
| Tests | pytest (52 tests backend), TypeScript tsc + Vite build (frontend) |
| CI/CD | GitHub Actions |

---

## 3. Prérequis

### Matériel minimum

| Ressource | Minimum | Recommandé |
|---|---|---|
| CPU | 4 cœurs | 6 cœurs |
| RAM | 4 Go | 8 Go |
| GPU | — | NVIDIA (CUDA) |
| Stockage | 10 Go | 50 Go |
| Caméra | USB, RTSP ou HTTP | — |

### Logiciels

**Déploiement via Docker (recommandé) :**

- [Docker Engine](https://docs.docker.com/engine/install/) 24+
- [Docker Compose](https://docs.docker.com/compose/) v2+

**Développement local (optionnel) :**

- Python 3.11
- Node.js 20 + pnpm
- Tesseract OCR (pour pytesseract)

### Systèmes d'exploitation supportés

- Windows 10 / 11
- Ubuntu 20.04 LTS ou supérieur
- Tout système Linux avec Docker installé

---

## 4. Installation rapide — Docker (5 min)

```bash
# 1. Cloner le dépôt
git clone https://github.com/archix-239/compteur-ciment.git
cd compteur-ciment

# 2. Créer le fichier de configuration
cp .env.example .env
# Ouvrir .env et renseigner JWT_SECRET_KEY et DEFAULT_ADMIN_PASSWORD

# 3. Démarrer les services
docker-compose up -d

# 4. Vérifier que tout est actif
docker-compose ps
```

L'interface est accessible sur **http://localhost** (ou l'IP du serveur).

**Identifiants par défaut :**

| Champ | Valeur |
|---|---|
| Utilisateur | `admin` |
| Mot de passe | valeur de `DEFAULT_ADMIN_PASSWORD` dans `.env` |

> **Arrêt des services :**
> ```bash
> docker-compose down
> ```
> Les données sont persistées dans le volume Docker `/data`.

---

## 5. Installation développement

### 5.1 Backend (FastAPI)

```bash
cd backend

# Créer l'environnement virtuel
python -m venv venv
source venv/bin/activate        # Linux / macOS
# venv\Scripts\activate         # Windows

# Installer les dépendances
pip install -r requirements.txt

# Lancer le serveur en mode rechargement automatique
JWT_SECRET_KEY=dev-key DEFAULT_ADMIN_PASSWORD=Admin1234! \
  uvicorn app.main:app --reload --port 8000
```

La documentation interactive de l'API est disponible sur **http://localhost:8000/docs** (Swagger UI).

### 5.2 Frontend (React)

```bash
cd dashboard

# Installer les dépendances (pnpm requis)
pnpm install

# Lancer le serveur de développement
pnpm dev
```

Le dashboard est accessible sur **http://localhost:3000** et se connecte au backend sur le port 8000.

### 5.3 Exécution simultanée (développement complet)

Ouvrir deux terminaux distincts : le premier pour le backend (section 5.1), le second pour le frontend (section 5.2). Le proxy Vite redirige automatiquement les appels `/api/*` vers FastAPI.

---

## 6. Configuration (.env)

Copier `.env.example` et renseigner les variables suivantes :

```dotenv
# --- Sécurité (obligatoire) ---
# Générer avec : python -c "import secrets; print(secrets.token_hex(32))"
JWT_SECRET_KEY=<clé-hex-64-caractères>

# Mot de passe du compte admin créé au premier démarrage (min. 8 caractères)
DEFAULT_ADMIN_PASSWORD=<mot-de-passe-fort>

# --- Base de données ---
DATABASE_URL=sqlite:////data/cement_counter.db

# --- CORS ---
# Lister les origines autorisées (séparées par des virgules)
ALLOWED_ORIGINS=http://localhost,http://192.168.1.100

# --- Vision ---
VISION_ENABLED=true
# Index de la caméra USB (0 = première caméra détectée)
CAMERA_INDEX=0
# Ou flux IP : CAMERA_URL=rtsp://user:pass@192.168.1.50:554/stream
```

> **Ne jamais versionner le fichier `.env` contenant des secrets.** Le fichier `.gitignore` exclut déjà `.env` par défaut.

### Générer JWT_SECRET_KEY

```bash
python -c "import secrets; print(secrets.token_hex(32))"
# Exemple de sortie : a3f2c8e1d4b7...
```

---

## 7. Utilisation

### 7.1 Rôles et accès

| Rôle | Public cible | Accès |
|---|---|---|
| **Admin** | Responsable IT / superviseur | Tout : configuration, utilisateurs, rôles, caméras, backup |
| **Opérateur** | Agent de ligne | Sessions, qualité, alertes, rapports |
| **Viewer** | Direction / audit | Dashboard, logs, rapports (lecture seule) |

Les rôles personnalisés peuvent être créés et affinés depuis l'interface d'administration.

### 7.2 Démarrer une session de production

1. Se connecter avec un compte **Opérateur** ou **Admin**.
2. Naviguer vers **Production > Sessions**.
3. Cliquer sur **Nouvelle session** et renseigner le nom du poste.
4. Cliquer sur **Démarrer** — le moteur de vision s'active et le comptage commence.
5. En fin de poste, cliquer sur **Clôturer la session** pour figer le rapport.

### 7.3 Exporter un rapport

Depuis **Rapports**, sélectionner la plage de dates et le format souhaité :

```
CSV  →  import direct Excel / Google Sheets
Excel →  classeur formaté avec graphiques
PDF   →  rapport signé prêt à archiver
JSON  →  intégration ERP ou API tierce
```

### 7.4 Accès à l'API

Chaque endpoint est documenté sur `/docs`. L'authentification s'effectue par :

- **JWT** : `Authorization: Bearer <token>` (obtenu via `POST /api/auth/login`)
- **Clé API** : `X-API-Key: <clé>` (générée depuis le panneau Admin)

Exemple d'appel :

```bash
# Obtenir le token
TOKEN=$(curl -s -X POST http://localhost/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"Admin1234!"}' \
  | python -c "import sys,json; print(json.load(sys.stdin)['access_token'])")

# Récupérer le résumé de la session en cours
curl -H "Authorization: Bearer $TOKEN" http://localhost/api/sessions/current/summary
```

---

## 8. Structure du projet

```
compteur_ciment/
├── .github/
│   └── workflows/
│       ├── ci.yml             # Tests et build (push / PR)
│       └── cd.yml             # Build Docker + release (tags semver)
│
├── backend/
│   ├── app/
│   │   ├── main.py            # FastAPI app (~4 900 lignes, 121 routes)
│   │   ├── models.py          # Modèles SQLAlchemy (11 tables)
│   │   ├── auth.py            # JWT + bcrypt
│   │   ├── schemas.py         # Schémas Pydantic (validation)
│   │   ├── database.py        # Connexion SQLite / PostgreSQL
│   │   └── vision_engine.py   # YOLOv8 + ORB + analyse colorimétrique
│   ├── models/                # Fichiers .pt (poids YOLO)
│   ├── static/                # Captures d'images des détections
│   ├── tests/                 # Suite pytest (52 tests)
│   ├── requirements.txt
│   └── Dockerfile
│
├── dashboard/                 # Frontend React + TypeScript
│   ├── src/
│   │   ├── pages/             # ~25 pages (Dashboard, Sessions, Rapports…)
│   │   ├── components/        # Composants réutilisables (charts, tables…)
│   │   └── contexts/          # AuthContext, ThemeContext
│   ├── package.json           # pnpm workspaces
│   └── Dockerfile
│
├── docs/                      # Documentation détaillée
│   ├── guide-administrateur.md
│   ├── guide-operateur.md
│   ├── guide-deploiement.md
│   └── guide-continuite-activites.md
│
├── docker-compose.yml
├── .env.example
└── README.md                  # Ce fichier
```

---

## 9. Tests

### Backend (pytest)

```bash
cd backend

# Activer l'environnement virtuel si ce n'est pas déjà fait
source venv/bin/activate

# Lancer la suite complète (52 tests)
JWT_SECRET_KEY=test DEFAULT_ADMIN_PASSWORD=Ciment_Test_2024! \
  python -m pytest tests/ -v
```

Exemple de sortie attendue :

```
tests/test_auth.py::test_login_success          PASSED
tests/test_sessions.py::test_create_session     PASSED
tests/test_vision.py::test_line_crossing        PASSED
...
52 passed in 8.41s
```

### Frontend (TypeScript + build Vite)

```bash
cd dashboard

# Vérification des types
pnpm tsc --noEmit

# Build de production (valide également le bundle)
pnpm build
```

---

## 10. CI/CD

Le pipeline GitHub Actions se compose de deux workflows :

### `ci.yml` — Tests et lint (push + PR)

```
push / pull_request
    │
    ├── ruff (linting Python)
    ├── pytest (52 tests backend)
    └── tsc + vite build (frontend)
```

### `cd.yml` — Build Docker + release (tags semver)

```
push tag v*.*.*
    │
    ├── docker build backend
    ├── docker build frontend
    ├── docker push → registry
    └── GitHub Release (artefacts)
```

Les images Docker sont taguées avec la version semver (`v1.2.3`) et `latest`.

---

## 11. Documentation

| Document | Contenu |
|---|---|
| [Guide Administrateur](./docs/guide-administrateur.md) | Configuration système, gestion des utilisateurs et des rôles, intégrations (SMTP, Slack, Teams), sauvegarde |
| [Guide Opérateur](./docs/guide-operateur.md) | Démarrage des sessions, contrôle qualité, alertes, exports |
| [Guide de Déploiement](./docs/guide-deploiement.md) | Installation Docker, configuration Nginx, HTTPS, variables d'environnement |
| [Guide de Continuité](./docs/guide-continuite-activites.md) | Procédures de reprise après incident, backup, monitoring |

La documentation interactive de l'API REST est générée automatiquement par FastAPI et accessible à l'adresse `/docs` (Swagger UI) ou `/redoc` (ReDoc).

---

## 12. Contribution

Les contributions sont les bienvenues. Pour proposer une amélioration :

1. **Forker** le dépôt et créer une branche depuis `main` :
   ```bash
   git checkout -b feature/nom-de-la-fonctionnalite
   ```

2. **Développer** en respectant les conventions du projet :
   - Python : formatage `ruff`, typage strict
   - TypeScript : `strict: true`, composants fonctionnels React

3. **Tester** localement avant de soumettre :
   ```bash
   # Backend
   python -m pytest tests/ -v

   # Frontend
   pnpm tsc --noEmit && pnpm build
   ```

4. **Ouvrir une Pull Request** vers `main` avec une description claire du problème résolu et de la solution apportée.

5. Le CI doit passer entièrement (lint + tests + build) avant toute fusion.

Pour signaler un bug ou proposer une idée, ouvrir une [issue GitHub](https://github.com/archix-239/compteur-ciment/issues).

---

## 13. Licence

Ce projet est distribué sous licence **MIT**.

```
MIT License

Copyright (c) 2024-2026 Enix

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
```

---

<p align="center">
  Fait avec rigueur pour l'industrie — <strong>Enix</strong>
</p>

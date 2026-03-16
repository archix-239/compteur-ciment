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

---

## État d'Avancement — Intégration Backend ↔ Frontend

Suivi de l'intégration réelle (remplacement des données fictives par des appels API) pour chaque interface du dashboard.

| # | Interface | Statut | Détails |
|---|-----------|--------|---------|
| 0 | **Tableau de Bord** | Fait | `GET /api/dashboard/summary` retourne toutes les métriques calculées depuis la BDD : totalBags, productionRate (5 min glissantes), avgInterval, consistency (1−CV), stddev, firstHalfInterval, secondHalfInterval, slowdownPercent, intervalData (14 buckets/min), heatmapData (6×5s), productionGaps (écarts > 2×moy). Bouton Actualiser connecté. Données temps réel via WebSocket `COUNT_EVENT`. |
| 1 | **Configuration — Paramètres Caméra** | Fait | GET/PUT `/api/config/camera`, POST `/api/config/camera/test` (test réel OpenCV). Formulaire connecté, sauvegarde en BDD, test de connexion caméra fonctionnel. Preview WebSocket vidéo. |
| 2 | **Configuration — Modèle IA** | Fait | GET/PUT `/api/config/model` connecté au frontend. Paramètres (modèle, seuil confiance, NMS, max det, imgsz, tracking persist) persistés en BDD et appliqués à chaud au moteur vision. Upload `.pt` via `POST /api/models/upload`, activation via `POST /api/models/activate`, suppression via `DELETE /api/models/{filename}`. |
| 3 | **Configuration — Ligne Virtuelle** | Fait | GET/PUT `/api/config/virtual-line` connecté. Position, largeur et direction persistées et appliquées en temps réel à la logique de franchissement de ligne. |
| 4 | **Configuration — Templates & Couleurs** | Fait | **Scoring temps réel remplaçant les valeurs aléatoires.** `vision_engine.py` : `apply_template_config()` charge le template PNG/JPEG, pré-calcule les keypoints ORB ; `_compute_logo_score()` = ratio de good-matches ORB (Hamming < 55) / keypoints template [0-1] ; `_compute_color_score()` = meilleure fraction de pixels dans la plage HSV parmi les références [0-1]. `GET /api/config/template` : config active (URL, dims, seuils) + historique fichiers disque. `POST /api/config/template/upload` : upload image (multipart) → sauvegardé dans `backend/static/templates/`, activé et appliqué à chaud. `POST /api/config/template/activate/{filename}` : bascule template actif. `DELETE /api/config/template/history/{filename}` : supprime (interdit sur actif). `PUT /api/config/template/settings` : met à jour seuil logo + seuil couleur. `GET /api/config/colors` : liste JSON des références couleurs (hex, tolérance, plages HSV). `POST /api/config/colors` : ajoute couleur (hex → HSV range calculé via `colorsys`). `PUT /api/config/colors/{idx}` : modifie nom/hex/tolérance. `DELETE /api/config/colors/{idx}` : supprime. Paramètres stockés dans `SystemSettings`. Chargement automatique au démarrage (lifespan). Preview image cliquable. Historique grille. Sliders seuils logo/couleur. Swatch + plages HSV par couleur. Flash banner. |
| 5 | **Monitoring — Flux en Direct** | Fait | Streaming vidéo via WebSocket `/ws/video` (base64 JPEG). Hook `useVideoStream` réutilisable. FPS en temps réel. Reconnexion automatique. Support RTSP/HTTP/Webcam. |
| 6 | **Production — Gestion des Sessions** | Fait | Sessions réelles connectées via API: démarrage/arrêt, session active, stats live et historique paginé (`GET /sessions/`, `POST /sessions/start`, `POST /sessions/stop/{id}`). |
| 7 | **Production — Journal de Production** | Fait | Tableau branché sur `GET /api/logs/` avec pagination backend + filtres (statut, recherche identifiant), miniatures et ouverture capture. |
| 8 | **Production — Chronologie** | Fait | `GET /api/timeline/hourly?hours=N` : buckets horaires réels (sacs comptés, intervalle moyen, rejetés). Graphique combiné Bar+Line. Analyse des pics (max/min horaire). Boutons de sélection rapide : 6H / 24H / 3 jours. État vide et chargement gérés. |
| 9 | **Qualité — Tableau de Bord** | Fait | Dashboard qualité branché sur `/api/quality/summary` avec distributions de confiance/logo calculées depuis les logs réels. |
| 10 | **Qualité — Vérification Manuelle** | Fait | File de revue connectée (`GET /api/quality/manual-verification`) + action opérateur via `PATCH /api/logs/{id}` (Valider/Rejeter) + historique (`GET /api/quality/reviews`). |
| 11 | **Qualité — Détection d'Anomalies** | Fait | Liste d'anomalies réelles depuis `/api/quality/anomalies` (rejets + scores faibles) avec miniatures snapshots backend. |
| 12 | **Alertes — Gestion des Alertes** | Fait | `GET /api/alerts/history` : historique réel depuis la BDD. `GET\|PUT /api/alerts/settings` : paramètres persistés (son, email, Slack, téléphone). `PATCH /api/alerts/history/{id}/read`, `POST /api/alerts/history/read-all`, `DELETE /api/alerts/history[/{id}]` : gestion lecture/suppression. `PUT /api/alerts/rules/{id}` : édition seuils + activation règles. `POST /api/alerts/history` : alerte manuelle opérateur. `POST /api/alerts/evaluate` : évaluation immédiate des règles vs métriques réelles. Badge unread count en temps réel sur le Sidebar (toutes les 30s). Tooltips `?` sur chaque section. |
| 13 | **Rapports — Production** | Fait | `GET /api/reports/production?period=day\|week\|month` : métriques réelles (totalBags, avgInterval, detectionRate, sessionHours, availability, OEE) + deltas vs période précédente. Graphique comparaison actuelle vs précédente (buckets horaires/journaliers/hebdo). Décomposition OEE bar chart (Disponibilité, Performance, Qualité). Analyses clés dynamiques (pic de production, consistance). Export CSV direct `GET /api/reports/export/csv`. Icônes `?` tooltip sur chaque indicateur. |
| 14 | **Rapports — Export de Données** | Fait | Exports manuels **CSV / XLSX / PDF / JSON** sur 4 sources (comptages bruts, sessions, anomalies, qualité) × 5 périodes (aujourd'hui, hier, 7j, 30j, personnalisé). XLSX avec mise en forme industrielle (`openpyxl`). PDF A4 paysage mis en forme (`fpdf2`, max 2 000 lignes). Prévisualisation en temps réel (lignes + taille). Planification automatique : fréquence quotidienne/hebdo/mensuelle, heure UTC, source, format, période — sauvegardé en BDD. Déclenchement manuel immédiat. Historique des exports automatiques avec lien de téléchargement. Historique des 20 derniers exports manuels. Tooltips `?` partout. |
| 15 | Rapports — Piste d'Audit | En attente | — |
| 16 | **Administration — Utilisateurs** | Fait | Nouveau modèle BDD `user_activities` + colonnes `last_login`/`login_count` sur `users` (migration automatique). `GET /api/users/` : liste complète avec last_login + login_count. `POST /api/users/` : création (bcrypt, min 6 car.). `PUT /api/users/{id}` : modification nom/rôle/is_active. `PATCH /api/users/{id}/password` : changement mot de passe (bcrypt). `DELETE /api/users/{id}` : suppression + enregistrement audit. `GET /api/users/activity?limit=N` : journal d'activité (connexions, échecs, créations, suppressions, changements mdp). `POST /token` enrichi : enregistre `UserActivity` (login / failed_login) avec IP + User-Agent, met à jour `last_login` et `login_count`. KPI strip (total/actifs/admins). Recherche temps réel. Modal ajout/édition. Modal changement mdp (toggle visibilité). Toggle actif/inactif. Dialog suppression. Onglet Historique scrollable (50 entrées). Onglet Rôles & Permissions avec compteur live par rôle. Note sécurité bcrypt/JWT. Flash banner résultat. |
| 17 | **Administration — Paramètres Système** | Partiel | `GET/PUT /api/system/general-settings` : identité site, fuseau, langue, préférences notifications, niveau log, rétention. Onglet **Alertes** connecté : canaux (son, email, Slack, téléphone superviseur) via `GET/PUT /api/alerts/settings` + aperçu des règles avec toggle via `PUT /api/alerts/rules/{id}`. Tooltips `?` sur chaque paramètre. *(Sécurité et Backup restent UI statique.)* |
| 18 | **Administration — Appareils** | Fait | Nouveau modèle BDD `cameras` (multi-caméra). `GET /api/devices/cameras` : liste toutes les caméras (nom, type, URL, résolution, FPS, statut dernier test, latence). `POST /api/devices/cameras` : ajout caméra. `PUT /api/devices/cameras/{id}` : modification. `DELETE /api/devices/cameras/{id}` : suppression (interdit sur caméra active). `POST /api/devices/cameras/{id}/test` : connexion OpenCV réelle (met à jour `last_status`, `last_latency_ms`, `last_tested_at`). `POST /api/devices/cameras/{id}/activate` : bascule le moteur de vision vers cette caméra sans redémarrage (met à jour les SystemSettings legacy). `GET /api/devices/system` : CPU/RAM/disque réels (psutil), température CPU. `GET /api/devices/services` : statut 4 services (YOLO thread, SQLite, FastAPI, MJPEG). Seed automatique depuis SystemSettings au 1er démarrage. Modal ajout/édition. Dialog de confirmation suppression. Flash banner résultat. |
| 19 | Administration — API | En attente | — |
| 20 | **Analytique — Performance (OEE)** | Fait | `GET /api/analytics/oee?hours=N` : OEE/TRS calculé depuis la BDD (disponibilité sessions, performance vs cible 1 100 sacs/h, qualité conformes/total). Sélecteur de période 6H / 24H / 7J / 30J. Graphique production réel + forecast (moyenne mobile 3 buckets) + cible. Camembert répartition du temps (production/micro-arrêts/pannes/inactivité). Recommandations IA dynamiques. Icônes `?` avec tooltip explicatif sur chaque indicateur. |
| 21 | **Maintenance — Santé Système** | Fait | `GET /api/system/health` enrichi : CPU/RAM/disque réels (psutil), uptime OS réel, I/O réseau Rx/Tx (Mbps, delta entre appels), température CPU (Linux/Mac via psutil — N/A sur Windows), statut réel des 4 services (moteur YOLOv8 thread alive, FastAPI, SQLite, flux MJPEG), métriques BDD réelles (taille fichier, nb logs/sessions/alertes, temps requête mesuré), 10 derniers événements depuis AlertHistory + Sessions. Barres colorées (vert/jaune/rouge). Tooltips `?`. Actualisation auto toutes les 5s. |
| 22 | **Maintenance — Base de Données** | Fait | `GET /api/database/stats` : taille BDD, fragmentation (PRAGMA freelist/page_count), intégrité (quick_check), stats par table (rows, taille via dbstat, query_ms, dernier enregistrement), usage disque psutil. `POST /api/database/optimize` : VACUUM (sqlite3 raw, hors transaction) + ANALYZE + espace récupéré. `POST /api/database/reindex` : REINDEX complet + temps elapsed. `GET /api/database/backup` : téléchargement direct du fichier `.db`. `POST /api/database/archive` : suppression sessions terminées + logs antérieurs à la rétention configurée. `POST /api/database/purge` : suppression définitive logs + captures + quality_reviews (subquery). Dialog de confirmation avant actions destructives. Badge fragmentation coloré. Card statut santé dynamique (vert si saine, jaune si fragmentée). |
| 23 | **Maintenance — Diagnostics** | Fait | `GET /api/diagnostics/metrics` : FPS (moteur ou delta 60s), inference_ms (attribut engine ou proxy intervalle), précision (conformes/total), CPU/RAM psutil. `GET /api/diagnostics/logs` : flux structuré AlertHistory + Sessions (INFO/WARN/ERROR/SUCCESS). `GET /api/diagnostics/logs/download` : export .txt horodaté. `POST /api/diagnostics/run-tests` : **5 tests réels** — (1) **YOLO** `v_eng.running + thread.is_alive()` ; (2) **SQLite** écriture+suppression SystemSetting mesurée en ms ; (3) **Disque** écriture 1 MB fichier temp, calcul MB/s ; (4) **API** latence d'un COUNT SQL ; (5) **Caméra** connexion OpenCV réelle via `_test_camera_sync` (lit `camera_source_type`/`camera_url` depuis SystemSettings, retourne résolution, FPS détecté, latence). `POST /api/diagnostics/benchmark` : 20 inférences YOLOv11 sur frame 640×640 vierge — avg/min/max ms + FPS équivalent. Console avec filtre type + effacement local. Badge résultat tests sur l'onglet. Historique benchmark (5 derniers). Auto-refresh 10s ON/OFF. |
| 24 | Intégration — Tiers | En attente | — |

### API & WebSocket — Référence rapide

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| `GET` | `/api/dashboard/summary` | KPI dashboard complets : comptages, taux de production, intervalles, consistance, graphiques intervalles/heatmap, production gaps — tout calculé depuis la BDD |
| `GET` | `/api/models/list` | Liste les fichiers `.pt` dans `models/` avec tailles et modèle actif |
| `POST` | `/api/models/activate` | Active un modèle par chemin, persistance BDD + hot-apply moteur |
| `POST` | `/api/models/upload` | Upload d'un fichier `.pt` (multipart) vers `models/` |
| `DELETE` | `/api/models/{filename}` | Supprime un `.pt` (refuse si modèle actif) |
| `GET` | `/api/timeline/hourly` | Distribution horaire sur N dernières heures (`?hours=6\|24\|72`) : count, interval moyen, rejets par bucket + analyse des pics |
| `GET` | `/api/alerts/history` | Historique des alertes (`?limit=100&unread_only=false`) : id, title, message, alert_type, is_read, timestamp |
| `POST` | `/api/alerts/history` | Crée une alerte manuelle (title, message, alert_type) |
| `PATCH` | `/api/alerts/history/{id}/read` | Marque une alerte comme lue |
| `POST` | `/api/alerts/history/read-all` | Marque toutes les alertes comme lues |
| `DELETE` | `/api/alerts/history/{id}` | Supprime une alerte |
| `DELETE` | `/api/alerts/history` | Efface tout l'historique |
| `GET` | `/api/alerts/rules` | Liste les règles d'alerte (id, name, type, threshold, is_active) |
| `PUT` | `/api/alerts/rules/{id}` | Modifie une règle (name, threshold, is_active) |
| `GET` | `/api/alerts/settings` | Paramètres de notification (son, email, Slack, téléphone) |
| `PUT` | `/api/alerts/settings` | Sauvegarde les paramètres de notification |
| `GET` | `/api/alerts/unread-count` | Nombre d'alertes non lues (pour badge Sidebar) |
| `POST` | `/api/alerts/evaluate` | Évalue les règles actives vs métriques récentes, crée des alertes si déclenchées |
| `POST` | `/api/alerts/rules` | Crée une nouvelle règle d'alerte (name, type, threshold, is_active) |
| `DELETE` | `/api/alerts/rules/{id}` | Supprime une règle d'alerte |
| `GET` | `/api/system/general-settings` | Paramètres généraux du site (nom, localisation, fuseau, langue, notifications, logs) |
| `PUT` | `/api/system/general-settings` | Sauvegarde les paramètres généraux |
| `GET` | `/api/analytics/oee` | OEE complet (`?hours=6\|24\|168\|720`) : oee, oeeDelta, availability, performance, quality, hourlyData (buckets adaptatifs), downtimeData (pie répartition), recommendations IA dynamiques |
| `GET` | `/api/reports/production` | Rapport de production (`?period=day\|week\|month`) : KPI + deltas vs période précédente, trendData comparaison, oeeData (Disponibilité/Performance/Qualité), peak bucket, consistance |
| `GET` | `/api/reports/export/preview` | Estimation rows + taille fichier pour period+source donnés (`?period=today\|yesterday\|last-7-days\|last-30-days\|custom&source=counts\|sessions\|anomalies\|quality`) |
| `GET` | `/api/reports/export/data` | Export réel CSV / XLSX / PDF / JSON (`?period=…&source=…&fmt=csv\|xlsx\|pdf\|json&date_from=&date_to=`) — 4 sources, déclenche téléchargement |
| `GET` | `/api/reports/export/history` | Historique des 20 derniers exports manuels générés (in-memory, reset au redémarrage) |
| `GET` | `/api/reports/export/schedule` | Config de planification automatique (enabled, frequency, time, source, format, period, email) |
| `PUT` | `/api/reports/export/schedule` | Sauvegarde la config de planification en BDD (SystemSettings keys `export_sched_*`) |
| `POST` | `/api/reports/export/schedule/run` | Déclenche immédiatement un export planifié et sauvegarde le fichier dans `backend/static/exports/` |
| `GET` | `/api/reports/export/scheduled` | Historique des 10 derniers exports automatiques avec URL de téléchargement |
| `GET` | `/api/reports/export/csv` | Alias legacy — redirige vers `/api/reports/export/data` (compatibilité ascendante) |
| `GET` | `/api/database/stats` | Stats BDD : taille fichier, fragmentation, intégrité, usage disque, rows+taille+query_ms par table |
| `POST` | `/api/database/optimize` | VACUUM (sqlite3 raw) + ANALYZE — retourne espace récupéré en KB |
| `POST` | `/api/database/reindex` | REINDEX complet de tous les index SQLite |
| `GET` | `/api/database/backup` | Téléchargement direct du fichier `.db` (FileResponse) |
| `POST` | `/api/database/archive` | Supprime sessions terminées + logs antérieurs à `days` (défaut : retention_days) |
| `POST` | `/api/database/purge` | Suppression définitive logs + captures + quality_reviews antérieurs à `days` |
| `GET` | `/api/diagnostics/metrics` | KPIs temps réel : fps, inference_ms, accuracy_pct, cpu_pct, ram_pct, engine_alive |
| `GET` | `/api/diagnostics/logs` | Flux d'événements structuré (AlertHistory + Sessions) — `?limit=N` |
| `GET` | `/api/diagnostics/logs/download` | Téléchargement des logs en .txt horodaté |
| `POST` | `/api/diagnostics/run-tests` | Tests composants : **(1)** yolo `thread.is_alive()` **(2)** db écriture+suppression ms **(3)** disk write 1 MB MB/s **(4)** api COUNT latency ms **(5)** camera OpenCV réel (résolution+FPS) — body `{"test":"key"}` pour test unitaire |
| `POST` | `/api/diagnostics/benchmark` | Benchmark IA : 20 inférences YOLOv11 640×640 — retourne avg/min/max ms + fps_equiv |
| `GET` | `/api/users/` | Liste tous les utilisateurs (username, full_name, role, is_active, last_login, login_count) |
| `POST` | `/api/users/` | Crée un utilisateur (username, full_name, role, password — bcrypt) |
| `PUT` | `/api/users/{id}` | Modifie full_name, role et/ou is_active |
| `PATCH` | `/api/users/{id}/password` | Change le mot de passe (bcrypt, min 6 car.) |
| `DELETE` | `/api/users/{id}` | Supprime un utilisateur + enregistre l'action dans UserActivity |
| `GET` | `/api/users/activity` | Journal d'activité : connexions, échecs, créations, suppressions, changements mdp — `?limit=N` |
| `GET` | `/api/devices/cameras` | Liste toutes les caméras configurées (nom, type, URL, statut, latence) |
| `POST` | `/api/devices/cameras` | Crée une nouvelle caméra (name, source_type, url, resolution, fps, notes) |
| `PUT` | `/api/devices/cameras/{id}` | Modifie les paramètres d'une caméra |
| `DELETE` | `/api/devices/cameras/{id}` | Supprime une caméra (interdit si `is_active=true`) |
| `POST` | `/api/devices/cameras/{id}/test` | Teste la connexion OpenCV réelle — met à jour last_status/last_latency_ms |
| `POST` | `/api/devices/cameras/{id}/activate` | Active cette caméra : bascule le moteur de vision + synchro SystemSettings |
| `GET` | `/api/devices/system` | Métriques serveur temps réel : cpu_pct, ram_used_gb, disk_pct, cpu_temp_c (psutil) |
| `GET` | `/api/devices/services` | Statut des 4 services : YOLO (thread alive), SQLite (ping), FastAPI, MJPEG/WebSocket |
| `GET` | `/api/config/template` | Config template active + historique fichiers + couleurs + seuils |
| `POST` | `/api/config/template/upload` | Upload image de référence (JPEG/PNG) — activée immédiatement |
| `POST` | `/api/config/template/activate/{filename}` | Active un template de l'historique |
| `DELETE` | `/api/config/template/history/{filename}` | Supprime un template (interdit si actif) |
| `PUT` | `/api/config/template/settings` | Met à jour seuil logo_score et seuil color_score |
| `GET` | `/api/config/colors` | Liste les références couleurs (hex, tolérance, plages HSV H/S/V) |
| `POST` | `/api/config/colors` | Ajoute une couleur (hex → plage HSV calculée automatiquement) |
| `PUT` | `/api/config/colors/{idx}` | Modifie nom/hex/tolérance d'une référence |
| `DELETE` | `/api/config/colors/{idx}` | Supprime une référence couleur |
| `GET` | `/api/config/camera` | Récupère la configuration caméra actuelle |
| `PUT` | `/api/config/camera` | Sauvegarde la configuration caméra |
| `POST` | `/api/config/camera/test` | Teste la connexion à la source vidéo (vérification réelle via OpenCV) |
| `GET` | `/api/config/model` | Récupère la configuration IA active (modèle + seuils inférence) |
| `PUT` | `/api/config/model` | Sauvegarde et applique à chaud la configuration IA |
| `GET` | `/api/config/virtual-line` | Récupère la configuration de la ligne virtuelle |
| `PUT` | `/api/config/virtual-line` | Sauvegarde et applique la ligne virtuelle (position, largeur, direction) |
| `GET` | `/sessions/` | Liste paginée des sessions + session active courante |
| `GET` | `/sessions/active` | Retourne la session active (ou `null`) |
| `POST` | `/sessions/start` | Démarre une session de production (idempotent si déjà active) |
| `POST` | `/sessions/stop/{session_id}` | Arrête une session active |
| `GET` | `/api/logs/` | Journal de production paginé (filtres `status`, `search`, `session_id`) |
| `PATCH` | `/api/logs/{id}` | Met à jour la décision qualité d'un sac (validation/rejet/correction) et journalise la revue |
| `GET` | `/api/quality/manual-verification` | File des sacs à vérifier manuellement (pagination + recherche) |
| `GET` | `/api/quality/reviews` | Historique des actions de revue humaine |
| `GET` | `/api/quality/anomalies` | Anomalies qualité générées depuis les logs (rejets/faible confiance) |
| `GET` | `/api/quality/summary` | KPI et distributions qualité réelles pour les graphiques |
| `WS` | `/ws/video` | Stream vidéo temps réel (frames JPEG en base64 via WebSocket) |
| `WS` | `/ws` | Événements temps réel (COUNT_EVENT, etc.) |
| `GET` | `/api/vision/video_feed` | Stream MJPEG (fallback, conservé pour compatibilité) |

### Architecture du streaming vidéo

```
Caméra (RTSP/HTTP/USB) → OpenCV → VisionEngine (thread dédié)
    ↓ YOLO detection + annotation
    ↓ encode JPEG + base64
    ↓ broadcast via queue (backpressure: drop oldest frame)
WebSocket /ws/video → Frontend (useVideoStream hook) → <img> element
```

**Protocoles caméra supportés :**
- **RTSP** : `rtsp://user:pass@192.168.1.x:554/stream` (transport TCP forcé pour fiabilité)
- **HTTP/ONVIF** : `http://192.168.1.x:8080/video`
- **Webcam locale** : Index entier (0, 1, 2...)
- **Fichier vidéo** : Chemin absolu vers .mp4, .avi, etc.


## Correctifs Post-Test (Feedback Opérationnel)

### Correctif 1 — Application réelle des paramètres caméra
- Le backend applique les propriétés OpenCV matérielles (`FRAME_WIDTH/HEIGHT`, `FPS`, `BRIGHTNESS`, `CONTRAST`, `AUTOFOCUS`) **et** un post-processing logiciel garanti dans la boucle vision (`resize` + `convertScaleAbs`).
- Pour les fichiers vidéo, le FPS demandé est respecté via régulation temporelle (`sleep`) côté boucle de lecture.
- Lors d'une sauvegarde caméra, le flux est redémarré proprement pour les sources qui ne supportent pas le hot-apply.
- Stabilisation RTSP Windows: arrêt/redémarrage protégé (pas de second thread si stop incomplet), restart caméra uniquement quand la source change, et test caméra sans pause forcée du moteur pour les flux RTSP afin d'éviter les timeouts/assertions FFMPEG.

### Correctif 2 — Ligne virtuelle directionnelle + visualisation réelle
- Nouveaux endpoints `GET/PUT /api/config/line` avec `type` (`horizontal`/`vertical`) et `direction` (`top-down`, `bottom-up`, `left-right`, `right-left`) + cohérence forcée type/direction.
- La page **Configuration > Ligne Virtuelle** conserve le design validé et affiche le flux réel WebSocket avec overlay React de la ligne (source visuelle unique).

### Correctif 3 — Live Stream & Sessions
- Suppression du doublon d'overlay: le backend envoie une image sans ligne, et React dessine l'overlay (source de vérité unique).
- Le design Industrial Dark Mode de **Flux en Direct** et **Gestion des Sessions** est restauré; seules les valeurs backend ont été reconnectées (sans refonte structurelle).
- Les badges Live Stream (FPS, nom caméra, modèle actif) sont branchés sur des données runtime via `GET /api/config/runtime`.
- Endpoints de suppression sessions conservés côté backend: `DELETE /api/sessions/{id}` et `DELETE /api/sessions/batch`.

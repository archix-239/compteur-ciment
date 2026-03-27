# Guide Administrateur — Compteur Automatique de Sacs de Ciment

> **Version :** 1.0 — Mars 2026
> **Audience :** Administrateurs système
> **Niveau requis :** Intermédiaire (familiarité avec les interfaces web d'administration)

---

## Avant-propos

Bienvenue dans le guide de l'administrateur du **Compteur Automatique de Sacs de Ciment**.

Ce système ne dort jamais. À raison de **1 100 sacs par heure**, la chaîne de production tourne en continu, et chaque sac compte — littéralement. C'est là qu'entre en jeu l'intelligence artificielle : le modèle YOLOv8 embarqué analyse le flux vidéo en temps réel, détecte chaque sac qui franchit la ligne virtuelle, et alimente les tableaux de bord, les rapports et les alertes sans intervention humaine.

En tant qu'administrateur, vous êtes le gardien de ce système. Vous contrôlez qui peut y accéder, comment il est configuré, et vous êtes le premier à intervenir quand quelque chose ne va pas.

**À la fin de ce guide, vous serez capable de :**

- Créer et gérer des comptes utilisateurs avec les bons niveaux d'accès
- Configurer les caméras, le modèle de détection et la ligne virtuelle
- Mettre en place des alertes intelligentes sur la cadence et le taux de rejet
- Connecter le système à vos outils existants (email, Slack, Teams)
- Maintenir la base de données en bonne santé
- Résoudre les problèmes courants sans passer des heures à chercher

Prenez le temps de lire les sections dans l'ordre lors de votre première prise en main. Pour les consultations ultérieures, chaque section est autonome.

---

## 1. Vue d'ensemble du rôle Administrateur

Le rôle **admin** est le seul à disposer de l'intégralité des **23 permissions** du système. Contrairement aux opérateurs (qui gèrent la production) et aux viewers (qui consultent), l'administrateur configure, supervise et maintient l'ensemble de la plateforme.

```
┌─────────────────────────────────────────────────┐
│                 HIÉRARCHIE DES RÔLES             │
│                                                   │
│   ┌──────────┐                                   │
│   │  ADMIN   │ ← Vous êtes ici (23 permissions)  │
│   └────┬─────┘                                   │
│        │ délègue                                  │
│   ┌────┴─────┐    ┌──────────┐                   │
│   │OPÉRATEUR │    │  VIEWER  │                   │
│   │(13 perms)│    │ (7 perms)│                   │
│   └──────────┘    └──────────┘                   │
└─────────────────────────────────────────────────┘
```

### Ce que l'administrateur peut faire (et que personne d'autre ne peut)

| Domaine                  | Permissions exclusives admin                                  |
|--------------------------|---------------------------------------------------------------|
| Utilisateurs             | `users_manage` — créer, modifier, désactiver, supprimer       |
| Système                  | `system_settings` — paramètres globaux, sécurité, export/import config |
| Appareils                | `devices_manage` — gérer les caméras et périphériques         |
| Base de données          | `database_manage` — backup, optimisation, purge               |
| Configuration détection  | `config_camera`, `config_model`, `config_templates`, `config_line` |

---

## 2. Connexion et premier démarrage

### Compte administrateur par défaut

Au premier démarrage, si aucun administrateur n'existe en base, le système crée automatiquement un compte admin :

- **Nom d'utilisateur :** `admin`
- **Mot de passe :** défini par la variable d'environnement `DEFAULT_ADMIN_PASSWORD`

> ⚠️ **Important :** Si `DEFAULT_ADMIN_PASSWORD` n'est pas définie au démarrage, le compte admin ne sera pas créé automatiquement. Vérifiez votre fichier `.env` ou la configuration de votre déploiement avant le premier lancement.

### Procédure de première connexion

1. Ouvrez votre navigateur et accédez à l'URL de l'application (ex. `http://192.168.1.100:8000`)
2. Saisissez `admin` comme nom d'utilisateur
3. Saisissez le mot de passe défini dans `DEFAULT_ADMIN_PASSWORD`
4. Cliquez sur **Se connecter**

> ✅ **Conseil :** Changez le mot de passe par défaut immédiatement après la première connexion. Rendez-vous dans `/admin/users`, sélectionnez le compte `admin`, puis **Changer le mot de passe**.

### Ce que vous devriez faire lors du premier démarrage

Voici une liste de contrôle pour mettre le système en production :

- [ ] Changer le mot de passe admin par défaut
- [ ] Configurer le fuseau horaire dans `/admin/system`
- [ ] Configurer la source vidéo dans `/config/camera`
- [ ] Vérifier la détection dans `/config/model`
- [ ] Positionner la ligne virtuelle dans `/config/line`
- [ ] Créer les comptes utilisateurs pour les opérateurs
- [ ] Configurer les alertes de cadence dans `/alerts/management`
- [ ] Tester l'envoi d'email ou de webhook dans `/integration/third-party`

---

## 3. Tableau de bord et navigation

### Vue d'ensemble des routes disponibles

L'interface est organisée en modules accessibles via le menu latéral. En tant qu'administrateur, vous avez accès à toutes les routes :

```
┌─────────────────────────────────────────────────────────────┐
│  MENU DE NAVIGATION — ADMINISTRATEUR                         │
├──────────────────────────┬──────────────────────────────────┤
│  MODULE                  │  ROUTE                           │
├──────────────────────────┼──────────────────────────────────┤
│  Tableau de bord         │  /                               │
│  Flux en direct          │  /monitoring/live                │
├──────────────────────────┼──────────────────────────────────┤
│  PRODUCTION                                                  │
│  Logs                    │  /production/log                 │
│  Sessions                │  /production/sessions            │
│  Chronologie             │  /production/timeline            │
├──────────────────────────┼──────────────────────────────────┤
│  CONFIGURATION                                               │
│  Caméra                  │  /config/camera                  │
│  Modèle YOLO             │  /config/model                   │
│  Templates & couleurs    │  /config/templates               │
│  Ligne virtuelle         │  /config/line                    │
├──────────────────────────┼──────────────────────────────────┤
│  QUALITÉ                                                     │
│  Tableau de bord qualité │  /quality/dashboard              │
│  Anomalies               │  /quality/anomalies              │
├──────────────────────────┼──────────────────────────────────┤
│  ALERTES                 │  /alerts/management              │
├──────────────────────────┼──────────────────────────────────┤
│  RAPPORTS                                                    │
│  Production              │  /reports/production             │
│  Export                  │  /reports/export                 │
│  Journal d'audit         │  /reports/audit                  │
├──────────────────────────┼──────────────────────────────────┤
│  ADMINISTRATION                                              │
│  Utilisateurs            │  /admin/users                    │
│  Paramètres système      │  /admin/system                   │
│  Appareils               │  /admin/devices                  │
│  Clés API                │  /admin/api                      │
├──────────────────────────┼──────────────────────────────────┤
│  ANALYTIQUES             │  /analytics/performance          │
├──────────────────────────┼──────────────────────────────────┤
│  MAINTENANCE                                                 │
│  Santé système           │  /maintenance/health             │
│  Base de données         │  /maintenance/database           │
│  Diagnostics             │  /maintenance/diagnostics        │
├──────────────────────────┼──────────────────────────────────┤
│  INTÉGRATIONS            │  /integration/third-party        │
└──────────────────────────┴──────────────────────────────────┘
```

### Le tableau de bord principal (`/`)

Le tableau de bord affiche en temps réel :
- Le compteur de sacs en cours de session
- La cadence actuelle (sacs/minute)
- Les alertes actives
- L'état de la caméra et du modèle de détection

---

## 4. Gestion des utilisateurs

La gestion des utilisateurs se trouve dans `/admin/users`. C'est ici que vous créez les comptes pour les opérateurs de ligne et les responsables qui consultent les rapports.

### Créer un utilisateur

**Via l'interface :** cliquez sur **Nouvel utilisateur**, remplissez le formulaire, puis validez.

**Via l'API (exemple curl) :**

```bash
curl -X POST http://localhost:8000/api/users/ \
  -H "Authorization: Bearer <votre_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "marie.dupont",
    "password": "MotDePasse2026!",
    "full_name": "Marie Dupont",
    "role": "operateur"
  }'
```

> ⚠️ **Règle de mot de passe :** Le mot de passe doit comporter **au minimum 8 caractères**. Appliquez une politique plus stricte (majuscules, chiffres, caractères spéciaux) dans `/admin/system` > Sécurité.

### Modifier ou désactiver un utilisateur

Pour désactiver un compte sans le supprimer (bonne pratique lors d'un départ) :

```bash
curl -X PUT http://localhost:8000/api/users/42 \
  -H "Authorization: Bearer <votre_token>" \
  -H "Content-Type: application/json" \
  -d '{"is_active": false}'
```

Un compte désactivé ne peut plus se connecter, mais ses données historiques (sessions, logs) sont conservées.

### Changer le mot de passe d'un utilisateur

```bash
curl -X PATCH http://localhost:8000/api/users/42/password \
  -H "Authorization: Bearer <votre_token>" \
  -H "Content-Type: application/json" \
  -d '{"new_password": "NouveauMotDePasse2026!"}'
```

### Supprimer un utilisateur

```bash
curl -X DELETE http://localhost:8000/api/users/42 \
  -H "Authorization: Bearer <votre_token>"
```

> ⚠️ **Restriction :** Vous ne pouvez pas supprimer votre propre compte. Si vous devez transférer le rôle admin, créez d'abord un autre compte admin, puis connectez-vous avec ce nouveau compte pour supprimer l'ancien.

### Tableau de synthèse des opérations utilisateurs

| Action                  | Méthode HTTP              | Route                          |
|-------------------------|---------------------------|--------------------------------|
| Créer                   | `POST`                    | `/api/users/`                  |
| Lister                  | `GET`                     | `/api/users/`                  |
| Modifier                | `PUT`                     | `/api/users/{id}`              |
| Désactiver              | `PUT` (`is_active: false`) | `/api/users/{id}`              |
| Changer mot de passe    | `PATCH`                   | `/api/users/{id}/password`     |
| Supprimer               | `DELETE`                  | `/api/users/{id}`              |

---

## 5. Gestion des rôles et permissions

### Les 23 permissions du système

| Permission            | Description                                           | admin | operateur | viewer |
|-----------------------|-------------------------------------------------------|:-----:|:---------:|:------:|
| `dashboard_view`      | Voir le tableau de bord principal                     | ✓     | ✓         | ✓      |
| `livestream_view`     | Accéder au flux vidéo en direct                       | ✓     | ✓         | ✓      |
| `sessions_manage`     | Créer/arrêter des sessions de comptage                | ✓     | ✓         |        |
| `logs_view`           | Consulter les logs de production                      | ✓     | ✓         | ✓      |
| `timeline_view`       | Voir la chronologie                                   | ✓     | ✓         | ✓      |
| `config_camera`       | Configurer les caméras                                | ✓     |           |        |
| `config_model`        | Configurer le modèle YOLO                             | ✓     |           |        |
| `config_templates`    | Gérer les templates et couleurs                       | ✓     |           |        |
| `config_line`         | Configurer la ligne virtuelle                         | ✓     |           |        |
| `quality_view`        | Accéder au tableau de bord qualité                    | ✓     | ✓         | ✓      |
| `anomalies_view`      | Voir les anomalies détectées                          | ✓     | ✓         |        |
| `alerts_view`         | Voir les alertes                                      | ✓     | ✓         |        |
| `alerts_manage`       | Créer/modifier/supprimer des règles d'alerte          | ✓     | ✓         |        |
| `reports_view`        | Consulter les rapports                                | ✓     | ✓         | ✓      |
| `reports_export`      | Exporter les données                                  | ✓     | ✓         |        |
| `analytics_view`      | Accéder aux analyses de performance                   | ✓     | ✓         | ✓      |
| `maintenance_view`    | Voir l'état de santé du système                       | ✓     | ✓         |        |
| `users_manage`        | Gérer les comptes utilisateurs                        | ✓     |           |        |
| `system_settings`     | Modifier les paramètres système                       | ✓     |           |        |
| `devices_manage`      | Gérer les appareils connectés                         | ✓     |           |        |
| `database_manage`     | Backup, optimisation, purge de la base de données     | ✓     |           |        |
| `api_keys_manage`     | Créer et révoquer des clés API                        | ✓     |           |        |
| `integrations_manage` | Configurer les intégrations tierces                   | ✓     |           |        |

### Rôles personnalisés

Le système permet de créer des rôles sur mesure, par exemple un rôle `superviseur` avec plus de droits qu'un viewer mais moins qu'un opérateur. La création de rôles personnalisés se fait via l'interface `/admin/users` > onglet **Rôles**.

> ✅ **Conseil :** Appliquez le principe du moindre privilège — donnez à chaque utilisateur uniquement les permissions dont il a besoin. Un opérateur de ligne n'a pas besoin d'accéder à la configuration du modèle YOLO.

---

## 6. Configuration du système de détection

### 6.1 Configuration de la caméra (`/config/camera`)

La caméra est l'œil du système. Une mauvaise configuration ici se répercute directement sur la qualité de la détection.

#### Types de sources supportées

| Type     | Format                          | Exemple                                      |
|----------|---------------------------------|----------------------------------------------|
| `webcam` | Index entier                    | `0` (première webcam USB)                    |
| `rtsp`   | URL RTSP                        | `rtsp://192.168.1.50:554/stream1`            |
| `http`   | URL HTTP/MJPEG                  | `http://192.168.1.50:8080/video`            |
| `file`   | Chemin vers un fichier vidéo    | `/data/videos/test_production.mp4`          |

#### Paramètres de configuration

| Paramètre    | Valeurs possibles        | Recommandation production              |
|--------------|--------------------------|----------------------------------------|
| Résolution   | `480p`, `720p`, `1080p`  | `1080p` pour une meilleure détection   |
| FPS          | `1` à `60`               | `25` à `30` pour une fluidité optimale |
| Luminosité   | `0` à `100`              | Ajuster selon l'éclairage de la ligne  |
| Contraste    | `0` à `100`              | `50` par défaut                        |
| Autofocus    | `true` / `false`         | `false` si la caméra est fixe          |

> ✅ **Conseil :** Utilisez toujours le bouton **Tester la connexion** avant de sauvegarder. Cela évite de couper le flux vidéo en production pour une URL incorrecte.

> ⚠️ **Attention :** Sur une ligne à 1 100 sacs/heure, chaque sac passe devant la caméra en environ 3 secondes. Un FPS trop bas (< 10) risque de manquer des sacs si plusieurs arrivent en rafale.

### 6.2 Configuration du modèle YOLO (`/config/model`)

Le modèle `best_V5.pt` est le cerveau de la détection. Ces paramètres contrôlent la précision et la sensibilité de l'IA.

#### Paramètres et valeurs par défaut

| Paramètre               | Valeur par défaut | Plage         | Rôle                                              |
|-------------------------|:-----------------:|:-------------:|---------------------------------------------------|
| `confidence_threshold`  | `0.70`            | `0.1` – `1.0` | Seuil de confiance minimum pour valider une détection |
| `nms_iou_threshold`     | `0.45`            | `0.1` – `1.0` | Suppression des détections qui se chevauchent     |
| `max_detections`        | `100`             | `1` – `300`   | Nombre maximum de détections par image            |
| `inference_size`        | `1280`            | `320` – `1920`| Résolution d'inférence (pixels)                   |
| `tracking_persistence`  | `true`            | `true/false`  | Maintien du tracking entre les frames             |

#### Comment interpréter le seuil de confiance

```
confidence_threshold = 0.70 signifie :
  - Le modèle est sûr à 70%+ → la détection est validée  ✓
  - Le modèle est sûr à 69%  → la détection est ignorée  ✗

Trop bas (ex: 0.30) → Faux positifs (comptage de choses qui ne sont pas des sacs)
Trop haut (ex: 0.95) → Faux négatifs (sacs manqués)
```

> ⚠️ **Ne modifiez pas ces valeurs sans avoir consulté l'équipe IA.** Le modèle `best_V5.pt` a été entraîné et validé avec les paramètres par défaut. Tout ajustement devrait être accompagné de tests sur des vidéos de référence.

### 6.3 Configuration de la ligne virtuelle (`/config/line`)

La ligne virtuelle est le seuil que chaque sac doit franchir pour être comptabilisé.

```
┌─────────────────────────────────────────────────────┐
│  VUE DE LA CAMÉRA (100% de hauteur)                  │
│                                                       │
│  0% ─────────────────────────────────────────────   │
│                                                       │
│  20%                  ← Sacs arrivent                │
│                        ↓                             │
│  60% ──────────────────────────────── ← LIGNE ICI   │
│       │←─────── 80% de la largeur ──────────────→│  │
│                        ↓                             │
│  80%                  ← Sacs comptabilisés           │
│                                                       │
│  100% ────────────────────────────────────────────  │
└─────────────────────────────────────────────────────┘
```

| Paramètre             | Valeur par défaut | Description                                      |
|-----------------------|:-----------------:|--------------------------------------------------|
| `position_percent`    | `60`              | Position verticale de la ligne (% depuis le haut)|
| `line_span_percent`   | `80`              | Largeur de la ligne (% de la largeur de l'image) |
| `direction`           | `left-right`      | Sens de déplacement des sacs pour le comptage    |

> ✅ **Conseil :** Positionnez la ligne dans la zone la plus nette de l'image (évitez les bords où la distorsion peut être plus forte). Une position à 60% du haut est généralement optimale pour les convoyeurs.

### 6.4 Templates et couleurs (`/config/templates`)

Cette section permet de personnaliser l'apparence des overlays vidéo (couleur des boîtes de détection, du texte, de la ligne virtuelle). Ces réglages sont purement visuels et n'impactent pas la détection.

---

## 7. Gestion des alertes

Les alertes permettent d'être notifié automatiquement quand la production dévie des seuils normaux. La configuration se trouve dans `/alerts/management`.

### Règles d'alerte par défaut

Le système est livré avec deux règles préconfigurées :

| Nom de la règle        | Type              | Seuil par défaut | Déclenchement                            |
|------------------------|-------------------|:----------------:|------------------------------------------|
| Cadence Faible         | `production_rate` | 15 sacs/min      | Si la cadence descend sous 15 sacs/min   |
| Taux de Rejet Élevé    | `error_rate`      | 10%              | Si le taux d'anomalies dépasse 10%       |

### Types d'alertes disponibles

| Type               | Mesure surveillée                                         |
|--------------------|-----------------------------------------------------------|
| `production_rate`  | Nombre de sacs comptés par minute                        |
| `error_rate`       | Pourcentage de détections rejetées / anomalies            |
| `consistency`      | Régularité du flux (détection de ruptures ou de pics)    |

### Créer une règle d'alerte personnalisée

Exemple : alerte si la cadence dépasse 25 sacs/minute (surcharge de ligne)

1. Allez dans `/alerts/management`
2. Cliquez sur **Nouvelle règle**
3. Remplissez :
   - **Nom :** `Cadence Excessive`
   - **Type :** `production_rate`
   - **Condition :** `supérieur à`
   - **Seuil :** `25`
4. Cochez les canaux de notification souhaités (son, email, Slack)
5. Cliquez sur **Enregistrer**

### Canaux de notification

| Canal        | Configuration requise                        | Section                         |
|--------------|----------------------------------------------|---------------------------------|
| Son          | Volume (0–100), activation                   | `/alerts/management`            |
| Email        | Configuration SMTP (voir section 11)         | `/integration/third-party`      |
| Slack        | URL de webhook Slack                         | `/integration/third-party`      |
| MS Teams     | URL de webhook Teams                         | `/integration/third-party`      |

---

## 8. Rapports et exports

### Rapports de production (`/reports/production`)

Cette section agrège les données de comptage par session, par heure, par jour ou par semaine. Les rapports sont générés à la volée depuis la base de données.

### Export des données (`/reports/export`)

Les données peuvent être exportées pour être traitées dans des outils externes (Excel, ERP, etc.).

> ✅ **Conseil :** Planifiez des exports automatiques via les intégrations webhook si votre ERP supporte la réception de données en JSON.

### Journal d'audit (`/reports/audit`)

Le journal d'audit enregistre toutes les actions administratives : connexions, modifications de configuration, créations/suppressions d'utilisateurs, changements de paramètres. C'est votre trace de responsabilité.

> ⚠️ **Le journal d'audit ne peut pas être modifié ou effacé par les utilisateurs.** Il est en écriture seule. Consultez-le régulièrement, notamment après tout incident.

Exemples d'entrées typiques :

```
2026-03-15 08:32:11 | admin         | LOGIN          | Connexion réussie depuis 192.168.1.10
2026-03-15 09:15:44 | admin         | CONFIG_CHANGE  | confidence_threshold: 0.70 → 0.65
2026-03-15 14:22:03 | marie.dupont  | SESSION_START  | Démarrage session #1042
2026-03-15 18:05:17 | admin         | USER_CREATED   | Nouvel utilisateur: jean.martin (viewer)
```

---

## 9. Administration système

### 9.1 Paramètres système (`/admin/system`)

#### Paramètres généraux

| Paramètre          | Description                                          |
|--------------------|------------------------------------------------------|
| Nom du site        | Affiché dans l'interface et les notifications        |
| Fuseau horaire     | Utilisé pour les logs, rapports et alertes           |
| Langue             | Langue de l'interface                                |

#### Paramètres de sécurité

| Paramètre                  | Description                                        |
|----------------------------|----------------------------------------------------|
| Délai d'expiration session | Déconnexion automatique après inactivité (minutes) |
| Politique de mot de passe  | Longueur minimale, complexité requise              |

#### Sauvegarde et restauration de la configuration

Vous pouvez exporter l'intégralité de la configuration système en JSON :

```bash
# Via l'interface : /admin/system → "Exporter la configuration"
# Le fichier téléchargé ressemble à :
{
  "site_name": "Cimenterie Nord",
  "timezone": "Europe/Paris",
  "session_timeout": 60,
  "password_min_length": 10,
  "camera": { ... },
  "model": { ... },
  "alerts": [ ... ]
}
```

Pour restaurer, utilisez **Importer la configuration** et sélectionnez le fichier JSON.

> ✅ **Conseil :** Exportez la configuration après chaque modification importante. Stockez les sauvegardes dans un emplacement sécurisé, hors du serveur applicatif.

### 9.2 Base de données (`/maintenance/database`)

La base de données stocke toutes les sessions de comptage, les logs, les configurations. Une maintenance régulière est nécessaire pour garantir les performances.

#### Opérations disponibles

| Opération             | Endpoint API                       | Fréquence recommandée | Description                                  |
|-----------------------|------------------------------------|-----------------------|----------------------------------------------|
| Statistiques          | `GET /api/database/stats`          | À la demande           | Taille, nombre d'entrées, index              |
| Optimiser (VACUUM)    | `POST /api/database/optimize`      | Hebdomadaire           | Compacte la base et libère l'espace disque   |
| Réindexer             | `POST /api/database/reindex`       | Mensuelle              | Reconstruit les index pour les requêtes      |
| Sauvegarde            | `GET /api/database/backup`         | Quotidienne            | Télécharge un fichier de sauvegarde complet  |
| Archiver              | `POST /api/database/archive`       | Mensuelle              | Déplace les anciennes sessions en archive    |
| Purger                | `POST /api/database/purge`         | Trimestrielle          | Supprime définitivement les données anciennes|

**Exemple — Lancer un VACUUM via API :**

```bash
curl -X POST http://localhost:8000/api/database/optimize \
  -H "Authorization: Bearer <votre_token>"
```

**Exemple — Télécharger une sauvegarde :**

```bash
curl -X GET http://localhost:8000/api/database/backup \
  -H "Authorization: Bearer <votre_token>" \
  -o backup_$(date +%Y%m%d).db
```

> ⚠️ **Purger supprime définitivement les données.** Assurez-vous d'avoir effectué une sauvegarde avant toute opération de purge. Les données purgées ne peuvent pas être récupérées.

### 9.3 Santé système (`/maintenance/health`)

Cette page affiche en temps réel l'état des composants critiques :

```
┌─────────────────────────────────────────────────────┐
│  ÉTAT DE SANTÉ DU SYSTÈME                            │
├────────────────────────┬─────────────────────────────┤
│  Composant             │  État                        │
├────────────────────────┼─────────────────────────────┤
│  API Backend           │  ✓ Opérationnel              │
│  Caméra                │  ✓ Flux actif                │
│  Modèle YOLO           │  ✓ Chargé en mémoire         │
│  Base de données       │  ✓ Connectée                 │
│  File d'alertes        │  ✓ Active                    │
└────────────────────────┴─────────────────────────────┘
```

### 9.4 Diagnostics (`/maintenance/diagnostics`)

Les diagnostics vous donnent accès aux métriques système détaillées et aux outils de dépannage.

#### Métriques disponibles

| Métrique       | Description                                   | Seuil d'alerte suggéré |
|----------------|-----------------------------------------------|------------------------|
| CPU            | Utilisation du processeur (%)                 | > 80% pendant > 5 min  |
| RAM            | Utilisation de la mémoire vive (%)            | > 85%                  |
| Disque         | Espace utilisé (%)                            | > 90%                  |
| Réseau         | Débit entrant/sortant                         | Selon infrastructure    |

**Actions disponibles :**

- **Télécharger les logs système** — Utile pour le support technique
- **Lancer un health check** — Vérifie tous les composants en séquence
- **Benchmark de performance** — Mesure le temps d'inférence du modèle YOLO

---

## 10. Gestion des appareils (`/admin/devices`)

Cette section centralise la gestion des caméras et périphériques connectés au système. Contrairement à `/config/camera` qui configure les paramètres d'une source vidéo, `/admin/devices` gère l'inventaire des appareils physiques.

> ✅ **Conseil :** Donnez des noms explicites à vos appareils, par exemple `Camera-Ligne-1-Nord` plutôt que `Camera 1`. Cela facilite le diagnostic quand plusieurs lignes tournent en parallèle.

---

## 11. Intégrations tierces (`/integration/third-party`)

Les intégrations permettent au système de communiquer avec votre infrastructure existante pour les alertes et les notifications.

### Configuration SMTP (email)

```
Serveur SMTP  : smtp.votre-entreprise.com
Port          : 587 (TLS) ou 465 (SSL)
Utilisateur   : alertes@votre-entreprise.com
Mot de passe  : [mot de passe SMTP]
Destinataires : chef-ligne@entreprise.com, maintenance@entreprise.com
```

Après configuration, cliquez sur **Envoyer un email de test** pour valider.

### Configuration Slack

1. Créez une application Slack sur `api.slack.com/apps`
2. Activez les **Incoming Webhooks**
3. Ajoutez un webhook pour le canal souhaité (ex: `#alertes-production`)
4. Copiez l'URL du webhook (format : `https://hooks.slack.com/services/T.../B.../...`)
5. Collez-la dans le champ **Slack Webhook URL**
6. Cliquez sur **Tester** pour envoyer un message de test

### Configuration Microsoft Teams

1. Dans Teams, cliquez sur `...` à côté du canal cible
2. Sélectionnez **Connecteurs** > **Incoming Webhook**
3. Donnez un nom (ex: "Alertes Ciment") et cliquez sur **Créer**
4. Copiez l'URL générée
5. Collez-la dans le champ **MS Teams Webhook URL**
6. Cliquez sur **Tester**

### Configuration Webhook générique

Un webhook générique permet d'envoyer des événements à n'importe quel système (ERP, supervision industrielle, etc.) :

```json
// Exemple de payload envoyé par le système
{
  "event": "alert_triggered",
  "timestamp": "2026-03-27T14:30:00Z",
  "alert_name": "Cadence Faible",
  "current_value": 12.3,
  "threshold": 15,
  "unit": "sacs/min"
}
```

---

## 12. Gestion des clés API (`/admin/api`)

Les clés API permettent à des systèmes externes d'interroger le compteur sans passer par l'interface web.

### Scopes disponibles

| Scope   | Droits accordés                                             |
|---------|-------------------------------------------------------------|
| `read`  | Lecture des données (stats, sessions, logs)                 |
| `write` | Écriture (démarrer/arrêter des sessions, envoyer des données)|
| `admin` | Accès complet à l'API (équivalent admin via token)          |

### Créer une clé API

1. Rendez-vous dans `/admin/api`
2. Cliquez sur **Nouvelle clé API**
3. Donnez un nom descriptif (ex: `ERP-SAP-Integration`)
4. Sélectionnez le scope approprié (préférez `read` si possible)
5. Cliquez sur **Créer**

> ⚠️ **La clé API est affichée une seule fois, immédiatement après la création.** Elle commence par le préfixe `cmt_`. Copiez-la et stockez-la dans un gestionnaire de secrets (Vault, coffre d'équipe, etc.). Il est impossible de la récupérer après fermeture de la fenêtre — seule la révocation et la recréation est possible.

**Exemple d'utilisation d'une clé API :**

```bash
curl -X GET http://localhost:8000/api/production/stats \
  -H "X-API-Key: cmt_AbCdEfGhIjKlMnOpQrStUv"
```

### Révoquer une clé API

Cliquez sur l'icône **Supprimer** (corbeille) à côté de la clé concernée. La révocation est immédiate et irréversible.

> ✅ **Conseil :** Créez une clé API par système externe (une pour l'ERP, une pour le tableau de bord Grafana, etc.). Cela vous permet de révoquer l'accès d'un seul système sans impacter les autres.

---

## 13. Bonnes pratiques et sécurité

### Gestion des accès

- **Principe du moindre privilège :** N'attribuez que les permissions strictement nécessaires.
- **Comptes nominatifs :** Évitez les comptes partagés. Chaque utilisateur doit avoir son propre compte pour garantir la traçabilité dans le journal d'audit.
- **Désactivation plutôt que suppression :** Quand un employé quitte, désactivez son compte (`is_active: false`) plutôt que de le supprimer. Cela préserve l'historique des actions dans le journal d'audit.
- **Revue régulière des accès :** Auditez la liste des utilisateurs actifs mensuellement.

### Sécurité des clés API

- Ne committez jamais une clé API dans un dépôt Git.
- Utilisez des variables d'environnement ou un gestionnaire de secrets pour stocker les clés.
- Révoquez immédiatement toute clé suspecte ou compromise.
- Préférez les scopes `read` ou `write` au scope `admin` pour les intégrations.

### Sauvegardes

```
┌─────────────────────────────────────────────────────────┐
│  STRATÉGIE DE SAUVEGARDE RECOMMANDÉE                     │
├────────────────────┬────────────────────────────────────┤
│  Quoi              │  Fréquence                          │
├────────────────────┼────────────────────────────────────┤
│  Base de données   │  Quotidienne (via /api/database/backup) │
│  Configuration     │  Après chaque modification importante   │
│  Logs système      │  Hebdomadaire (via /maintenance/diagnostics) │
└────────────────────┴────────────────────────────────────┘
```

> ✅ **Conseil :** Testez régulièrement vos restaurations. Une sauvegarde non testée est une fausse promesse.

### Mises à jour du modèle YOLO

Si un nouveau modèle est mis à disposition (`best_V6.pt`, par exemple) :

1. Testez le nouveau modèle sur des vidéos de référence **avant** de le déployer en production
2. Sauvegardez la configuration actuelle via `/admin/system`
3. Déposez le nouveau fichier dans le répertoire `models/`
4. Mettez à jour le chemin dans `/config/model`
5. Surveillez les métriques de détection pendant les premières heures

---

## 14. Résolution de problèmes courants

### Problème : La caméra ne répond plus

**Symptômes :** Le flux vidéo affiche une erreur ou un écran noir dans `/monitoring/live`.

**Étapes de résolution :**

1. Vérifiez la connectivité réseau vers la caméra (ping de l'adresse IP)
2. Accédez à `/config/camera` et cliquez sur **Tester la connexion**
3. Vérifiez que l'URL RTSP ou HTTP est correcte et que les credentials n'ont pas changé
4. Consultez les logs système dans `/maintenance/diagnostics`
5. Redémarrez la caméra physiquement si nécessaire

---

### Problème : Le comptage semble inexact (trop bas ou trop haut)

**Symptômes :** Le nombre de sacs comptés s'écarte significativement du comptage manuel.

| Cause possible                  | Solution                                                      |
|---------------------------------|---------------------------------------------------------------|
| Seuil de confiance trop bas     | Augmentez `confidence_threshold` dans `/config/model`         |
| Seuil de confiance trop haut    | Diminuez légèrement `confidence_threshold`                    |
| Ligne virtuelle mal positionnée | Ajustez `position_percent` dans `/config/line`                |
| FPS insuffisant                 | Augmentez le FPS dans `/config/camera`                        |
| Éclairage insuffisant           | Ajustez luminosité/contraste, ou améliorez l'éclairage physique |

---

### Problème : Aucune alerte ne se déclenche malgré une cadence faible

**Étapes de résolution :**

1. Vérifiez que les règles d'alerte sont bien **activées** dans `/alerts/management`
2. Vérifiez que les seuils correspondent à la réalité (le seuil est-il trop bas ?)
3. Si vous utilisez les notifications email, vérifiez la configuration SMTP dans `/integration/third-party`
4. Testez manuellement le canal de notification (bouton **Tester**)
5. Consultez le journal d'audit pour voir si des alertes ont été déclenchées mais non reçues

---

### Problème : L'interface répond lentement

**Étapes de résolution :**

1. Consultez `/maintenance/diagnostics` — vérifiez CPU, RAM et disque
2. Si le disque est plein (> 90%), purgez ou archivez les anciennes données depuis `/maintenance/database`
3. Lancez un VACUUM via `POST /api/database/optimize`
4. Si le CPU est constamment élevé, vérifiez qu'un seul flux vidéo est actif à la fois
5. Réduisez la résolution d'inférence (`inference_size`) dans `/config/model` si les ressources CPU/GPU sont limitées

---

### Problème : Un utilisateur ne peut plus se connecter

**Étapes de résolution :**

1. Allez dans `/admin/users` et vérifiez que le compte est **actif** (`is_active: true`)
2. Vérifiez que le rôle est bien assigné
3. Réinitialisez le mot de passe via `PATCH /api/users/{id}/password`
4. Vérifiez le journal d'audit pour des tentatives de connexion échouées répétées (compte potentiellement bloqué par la politique de sécurité)

---

### Tableau de récapitulatif — Où trouver quoi

| Je veux...                           | Je vais dans...                    |
|--------------------------------------|------------------------------------|
| Voir le comptage en direct           | `/monitoring/live`                 |
| Créer un utilisateur                 | `/admin/users`                     |
| Changer la source vidéo              | `/config/camera`                   |
| Régler la sensibilité de détection   | `/config/model`                    |
| Déplacer la ligne de comptage        | `/config/line`                     |
| Configurer les notifications         | `/integration/third-party`         |
| Voir qui a fait quoi                 | `/reports/audit`                   |
| Sauvegarder la base de données       | `/maintenance/database`            |
| Créer une clé API                    | `/admin/api`                       |
| Vérifier la santé du serveur         | `/maintenance/health`              |
| Exporter des données de production   | `/reports/export`                  |

---

*Guide rédigé pour la version 1.0 du Compteur Automatique de Sacs de Ciment — Mars 2026*
*Pour toute question technique non couverte par ce guide, consultez les logs dans `/maintenance/diagnostics` ou contactez l'équipe de support.*

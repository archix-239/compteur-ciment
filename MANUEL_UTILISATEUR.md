# Manuel d'Utilisation — Compteur Automatique de Sacs de Ciment

> **Objectif de ce manuel :** À la fin de cette lecture, chaque utilisateur sait démarrer une session de production, surveiller la qualité des sacs en temps réel, générer un rapport et, pour les administrateurs, configurer et maintenir le système en toute autonomie.

---

## Table des Matières

1. [Vue d'ensemble — Ce que fait le système](#1-vue-densemble)
2. [Configuration matérielle et logicielle requise](#2-configuration-requise)
3. [Connexion et navigation](#3-connexion-et-navigation)
4. [Rôles et droits d'accès](#4-rôles-et-droits-daccès)
5. [Workflow Opérateur — La production au quotidien](#5-workflow-opérateur)
6. [Workflow Superviseur — Piloter et analyser](#6-workflow-superviseur)
7. [Workflow Administrateur — Configurer et maintenir](#7-workflow-administrateur)
8. [Gestion des alertes](#8-gestion-des-alertes)
9. [Rapports et exports](#9-rapports-et-exports)
10. [Maintenance et santé du système](#10-maintenance-et-santé-du-système)
11. [Résolution des problèmes courants](#11-résolution-des-problèmes-courants)
12. [Glossaire](#12-glossaire)

---

## 1. Vue d'Ensemble

Imaginez une chaîne de production où 1 100 sacs de ciment passent chaque heure devant une caméra. Compter ces sacs à la main est impossible — et les erreurs coûtent cher. Ce système le fait automatiquement, 24h/24, sans fatigue.

```
  Caméra                Moteur IA              Dashboard
  ┌──────┐    vidéo    ┌─────────┐   résultats  ┌────────────┐
  │ 📷   │ ──────────► │ YOLOv8  │ ───────────► │  Interface │
  │ RTSP │             │ Détecte │              │  Web       │
  │ USB  │             │ Compte  │◄─────────────│  Pilotage  │
  └──────┘             │ Qualifie│   commandes  └────────────┘
                       └─────────┘
                            │
                       ┌────▼─────┐
                       │  Base de │
                       │ données  │
                       └──────────┘
```

**Ce que le système fait concrètement :**

| Fonction | Description |
|----------|-------------|
| **Comptage automatique** | Chaque sac franchissant la ligne virtuelle est détecté et enregistré avec horodatage et capture d'image |
| **Contrôle qualité** | Comparaison visuelle avec un template de référence ; les sacs non conformes sont signalés |
| **Sessions de production** | Chaque poste de travail est encadré par une session avec ses propres statistiques |
| **Alertes en temps réel** | Notification immédiate si la cadence chute, si des anomalies s'accumulent ou si un seuil est dépassé |
| **Rapports** | Export CSV, Excel, PDF et JSON pour la direction ou les audits |

---

## 2. Configuration Requise

Avant d'installer ou d'utiliser le système, vérifiez que votre matériel et vos logiciels respectent les seuils définis ci-dessous. Une configuration insuffisante entraîne des ralentissements du flux vidéo, des détections manquées ou des crashs du moteur IA.

---

### 2.1 Serveur (machine qui fait tourner l'application)

C'est la machine centrale. Elle héberge le moteur IA, l'API et la base de données. Ses performances impactent directement la précision du comptage.

#### Processeur (CPU)

Le modèle YOLOv8 effectue des dizaines d'inférences par seconde. Sans GPU, tout le calcul repose sur le CPU.

| Configuration | CPU recommandé | Cadence supportée |
|--------------|---------------|-------------------|
| Minimale | 4 cœurs / 8 threads @ 2.5 GHz | Jusqu'à ~600 sacs/h |
| Recommandée | 8 cœurs / 16 threads @ 3.0 GHz | Jusqu'à ~1 100 sacs/h |
| Optimale | 8+ cœurs + GPU NVIDIA (CUDA) | 1 500+ sacs/h |

> **Exemple concret :** Un Intel Core i5-10400 (6 cœurs) traite confortablement 25 images/seconde sur une chaîne à 1 100 sacs/h. Un Intel Core i3 de première génération (2 cœurs) atteint ses limites dès 400 sacs/h et commence à sauter des détections.

#### Mémoire RAM

| Composant | Consommation typique |
|-----------|---------------------|
| Modèle YOLOv8 (chargement) | ~800 Mo |
| Traitement flux vidéo 720p | ~300 Mo |
| Base de données SQLite + API | ~200 Mo |
| Système d'exploitation | ~1–2 Go |
| **Total minimum** | **4 Go** |
| **Total recommandé** | **8 Go** |

#### Carte graphique (GPU) — optionnelle mais fortement recommandée

| GPU | Gain de performance |
|-----|-------------------|
| Sans GPU (CPU seul) | Inference ~80–150 ms/image |
| NVIDIA GTX 1650 (4 Go VRAM) | Inference ~15–25 ms/image |
| NVIDIA RTX 3060 (12 Go VRAM) | Inference ~5–10 ms/image |

Pour activer l'accélération GPU, installez les drivers NVIDIA et CUDA 11.8+ avant de démarrer l'application.

#### Espace disque

Chaque sac détecté génère une capture JPEG (~50–150 Ko). Estimez vos besoins :

```
Espace captures = (sacs/jour) × (taille moyenne capture) × (jours rétention)

Exemple : 8 800 sacs/jour × 100 Ko × 90 jours = ~79 Go
```

| Configuration | Espace disque requis |
|--------------|---------------------|
| Minimale | 20 Go libres |
| Recommandée | 100 Go (SSD de préférence) |
| Production intense (> 6 mois rétention) | 500 Go+ |

> **Conseil :** Utilisez un SSD plutôt qu'un disque dur mécanique (HDD). La lecture/écriture des captures en temps réel sur un HDD peut créer des goulots d'étranglement au-delà de 500 sacs/h.

#### Réseau

| Cas d'usage | Bande passante minimale |
|-------------|------------------------|
| Caméra USB locale (pas de réseau) | Non applicable |
| Caméra IP RTSP sur le réseau local | 10 Mbps dédié à la caméra |
| Plusieurs utilisateurs simultanés (flux vidéo) | 50 Mbps réseau local |
| Accès depuis Internet (hors réseau local) | 20 Mbps montant |

#### Système d'exploitation

| OS | Statut | Notes |
|----|--------|-------|
| Ubuntu 20.04 LTS | ✅ Recommandé | Meilleure compatibilité OpenCV + CUDA |
| Ubuntu 22.04 LTS | ✅ Supporté | |
| Debian 11/12 | ✅ Supporté | |
| Windows Server 2019/2022 | ✅ Supporté | Moins stable pour les flux RTSP longs |
| Windows 10/11 (développement) | ✅ Supporté | Déconseillé pour la production 24/7 |
| macOS 12+ | ⚠️ Partiel | Pas de support CUDA, webcam uniquement |

#### Récapitulatif serveur

```
┌────────────────────────────────────────────────────────┐
│               CONFIGURATION SERVEUR                    │
├──────────────┬──────────────────┬─────────────────────┤
│ Composant    │ Minimum          │ Recommandé           │
├──────────────┼──────────────────┼─────────────────────┤
│ CPU          │ 4 cœurs @ 2.5GHz │ 8 cœurs @ 3.0GHz    │
│ RAM          │ 4 Go             │ 8 Go                 │
│ GPU          │ Non requis       │ NVIDIA 4 Go VRAM     │
│ Disque       │ 20 Go libres     │ 100 Go SSD           │
│ Réseau       │ 10 Mbps          │ 100 Mbps (Ethernet)  │
│ OS           │ Ubuntu 20.04     │ Ubuntu 22.04 LTS     │
│ Python       │ 3.10             │ 3.11                 │
│ Docker       │ 24.0             │ Dernière version     │
└──────────────┴──────────────────┴─────────────────────┘
```

---

### 2.2 Caméra

La caméra est le point d'entrée de tout le système. Une caméra de mauvaise qualité ou mal positionnée est la première cause de détections manquées.

#### Types de caméras supportées

| Type | Protocole | Exemple | Avantages |
|------|-----------|---------|-----------|
| **Webcam USB** | USB 2.0 / 3.0 | Logitech C920 | Simple, pas de configuration réseau |
| **Caméra IP réseau** | RTSP / H.264 | Hikvision DS-2CD | Distance flexible, qualité industrielle |
| **Caméra HTTP / ONVIF** | HTTP MJPEG | Dahua IPC | Compatible avec la plupart des NVR |
| **Fichier vidéo** | Disque local | .mp4, .avi | Pour les tests et simulations |

#### Caractéristiques minimales de la caméra

| Paramètre | Minimum | Recommandé | Pourquoi |
|-----------|---------|-----------|----------|
| Résolution | 640 × 480 (VGA) | 1280 × 720 (HD) | En dessous, les logos et détails du sac sont illisibles |
| FPS | 15 images/s | 25–30 images/s | Sous 15 FPS, les sacs rapides peuvent passer entre deux frames |
| Latence | < 500 ms | < 100 ms | Une latence élevée décale la capture par rapport au franchissement |
| Éclairage scène | 200 lux | 500–800 lux | L'IA perd en précision sous 200 lux (équivalent couloir sombre) |
| Encodage vidéo | MJPEG ou H.264 | H.264 | H.265 non supporté en RTSP natif |

> **Exemple de mauvaise configuration :** Une caméra 640×480 à 10 FPS sur une chaîne à 1 100 sacs/h laisse passer en moyenne 1 sac sur 3. À cette cadence, un sac franchit la ligne en moins de 3 secondes, soit 0,3 seconde d'exposition par frame à 10 FPS.

#### Positionnement optimal de la caméra

```
Vue de dessus (chaîne horizontale)
                 ┌──────────────────────────┐
  Caméra         │   Zone de passage sacs   │
     📷           │                          │
      \           │   [ sac ]  →  ════════  │ ← Ligne de comptage
       \          │                          │
        \         └──────────────────────────┘
         ↓ Angle recommandé : 0° (perpendiculaire)
         → Hauteur recommandée : 1.5× la largeur du sac
```

| Paramètre de positionnement | Valeur recommandée |
|----------------------------|-------------------|
| Angle par rapport à la verticale | 0° à 15° (le plus droit possible) |
| Hauteur au-dessus de la chaîne | 60 cm à 150 cm |
| Distance latérale | Centré sur la zone de passage |
| Couverture de la zone | 100% de la largeur de la chaîne dans le champ |

---

### 2.3 Poste utilisateur (navigateur web)

Les opérateurs, superviseurs et administrateurs accèdent au système depuis n'importe quel poste équipé d'un navigateur moderne. Aucune installation logicielle n'est nécessaire côté client.

#### Navigateurs supportés

| Navigateur | Version minimale | Statut |
|-----------|-----------------|--------|
| Google Chrome | 90+ | ✅ Recommandé |
| Microsoft Edge | 90+ | ✅ Recommandé |
| Mozilla Firefox | 88+ | ✅ Supporté |
| Safari | 15+ (macOS / iOS) | ⚠️ Supporté (WebSocket parfois limité) |
| Internet Explorer | Toute version | ❌ Non supporté |

> **Pourquoi pas Internet Explorer ?** Le flux vidéo en temps réel utilise le protocole WebSocket et l'API Web moderne (`fetch`, `localStorage`), non disponibles dans IE. Si votre organisation impose IE, contactez votre administrateur pour configurer Edge en mode de compatibilité.

#### Configuration matérielle minimale du poste

| Composant | Minimum | Recommandé |
|-----------|---------|-----------|
| RAM | 4 Go | 8 Go |
| CPU | Dual-core 1.6 GHz | Quad-core 2.4 GHz |
| Résolution écran | 1 280 × 720 | 1 920 × 1 080 |
| Réseau | 5 Mbps | 20 Mbps |
| Système d'exploitation | Windows 10, Ubuntu 18.04, macOS 11 | — |

> **Cas particulier du flux vidéo :** La page "Flux en Direct" décode un flux JPEG en continu. Sur un poste avec moins de 4 Go de RAM ou un CPU très ancien (Pentium, Celeron première génération), le navigateur peut ralentir ou figer. Dans ce cas, fermez les autres onglets ouverts pendant la surveillance vidéo.

#### Bande passante réseau par usage

| Page / Fonctionnalité | Consommation réseau |
|----------------------|-------------------|
| Tableau de bord (métriques) | < 10 Ko/s |
| Journal de production (pagination) | < 50 Ko/s |
| **Flux vidéo en direct (720p, 25 FPS)** | **800 Ko/s à 2 Mo/s** |
| Export de rapport PDF (1 000 lignes) | ~500 Ko (ponctuel) |
| WebSocket événements de comptage | < 1 Ko/s |

> **Exemple pratique :** Sur un réseau Wi-Fi 2.4 GHz encombré (café, open space), le flux vidéo peut se figer. Préférez une connexion filaire (Ethernet) pour les postes dédiés à la surveillance en temps réel.

#### Récapitulatif poste utilisateur

```
┌────────────────────────────────────────────────────────┐
│             CONFIGURATION POSTE UTILISATEUR            │
├──────────────┬──────────────────┬─────────────────────┤
│ Composant    │ Minimum          │ Recommandé           │
├──────────────┼──────────────────┼─────────────────────┤
│ RAM          │ 4 Go             │ 8 Go                 │
│ CPU          │ Dual-core 1.6GHz │ Quad-core 2.4GHz    │
│ Écran        │ 1 280 × 720      │ 1 920 × 1 080        │
│ Réseau       │ 5 Mbps           │ 20 Mbps (filaire)    │
│ Navigateur   │ Chrome/Edge 90+  │ Chrome dernière ver. │
│ Plugin requis│ Aucun            │ Aucun                │
└──────────────┴──────────────────┴─────────────────────┘
```

---

### 2.4 Résumé visuel — Architecture minimale recommandée

```
  Chaîne de production
  ┌─────────────────────────────────────────────────┐
  │  [sac] [sac] [sac] →→→→→→→→→→→→→→→→→→→→→→→    │
  └─────────────────────────────────────────────────┘
                     ↑
              📷 Caméra IP HD
              1280×720 / 25FPS
              RTSP H.264
                     │ Réseau local (câble)
                     ↓
  ┌──────────────────────────────────────┐
  │   SERVEUR (Ubuntu 22.04)             │
  │   CPU : 8 cœurs  RAM : 8 Go         │
  │   SSD : 100 Go   GPU : GTX1650 (opt)│
  │                                      │
  │   Docker : Backend FastAPI + YOLOv8  │
  │   Docker : Frontend React + Nginx    │
  └────────────────┬─────────────────────┘
                   │ Réseau local 100 Mbps
         ┌─────────┼─────────┐
         ↓         ↓         ↓
    💻 Opérateur  💻 Superviseur  💻 Admin
    Chrome 90+   Chrome 90+    Chrome 90+
    4 Go RAM     4 Go RAM      4 Go RAM
```

---

## 3. Connexion et Navigation

### 2.1 Se connecter

Ouvrez votre navigateur (Chrome, Edge ou Firefox) et saisissez l'adresse fournie par votre administrateur.

```
Exemple réseau local : http://192.168.1.45
Exemple développement : http://localhost:3000
```

La page de connexion s'affiche :

```
┌─────────────────────────────────┐
│   COMPTEUR CIMENT — Connexion   │
│                                 │
│  Identifiant : [____________]   │
│  Mot de passe : [____________]  │
│                                 │
│         [ Se connecter ]        │
└─────────────────────────────────┘
```

Saisissez votre nom d'utilisateur et votre mot de passe, puis cliquez sur **Se connecter**.

> **Compte administrateur par défaut (premier démarrage uniquement) :**
> - Identifiant : `admin`
> - Mot de passe : `admin1234`
>
> **Changez ce mot de passe immédiatement** après la première connexion.

### 2.2 La barre de navigation latérale

Une fois connecté, le menu latéral gauche affiche les sections accessibles **selon votre rôle**. Les sections auxquelles vous n'avez pas accès ne sont pas visibles.

```
┌──────────────────┐
│ ● Tableau de bord│  ← Vue principale
│                  │
│ PRODUCTION       │
│   Sessions       │
│   Journal        │
│   Chronologie    │
│                  │
│ QUALITÉ          │
│   Dashboard      │
│   Vérification   │
│   Anomalies      │
│                  │
│ MONITORING       │
│   Flux en direct │
│   ...            │
│                  │
│ [Prénom Nom]     │  ← Votre compte
│ [Déconnexion]    │
└──────────────────┘
```

### 2.3 Se déconnecter

Cliquez sur **Déconnexion** en bas du menu latéral, ou accédez à votre **Profil** (clic sur votre nom) et cliquez sur le bouton rouge **Se déconnecter**.

---

## 4. Rôles et Droits d'Accès

Le système distingue quatre rôles. Chaque rôle donne accès à un sous-ensemble de fonctionnalités.

| Rôle | Profil type | Peut faire |
|------|-------------|-----------|
| **Opérateur** | Agent de ligne | Démarrer/arrêter les sessions, voir le flux, consulter le journal |
| **Superviseur** | Chef d'équipe | Tout l'opérateur + rapports, alertes, qualité, analytique |
| **Administrateur** | Responsable IT / production | Accès complet : configuration, utilisateurs, paramètres système |
| **Viewer** | Direction / auditeur | Consultation uniquement, aucune modification |

> **Exemple concret :** Un opérateur peut démarrer sa session de 8h, voir les sacs défiler sur le flux vidéo et consulter le journal. Mais c'est le superviseur qui vérifie les anomalies qualité en fin de poste et décide d'escalader ou non.

---

## 5. Workflow Opérateur — La Production au Quotidien

Voici la séquence exacte à suivre chaque poste de travail.

### Étape 1 — Vérifier que la caméra est en ligne

Avant de démarrer, confirmez que la caméra fonctionne.

**Navigation :** Menu → `Monitoring` → `Flux en Direct`

```
┌─────────────────────────────────────────┐
│  FLUX EN DIRECT          [●LIVE] 24 FPS │
│                                         │
│  ┌───────────────────────────────────┐  │
│  │                                   │  │
│  │   [Image de la chaîne de prod]    │  │
│  │         ════════════              │  │
│  │       ← Ligne virtuelle           │  │
│  │                                   │  │
│  └───────────────────────────────────┘  │
│  Caméra: Chaîne A  │  Modèle: best_V5   │
└─────────────────────────────────────────┘
```

- Le badge **LIVE** en rouge indique que le flux est actif.
- La ligne jaune horizontale ou verticale est la **ligne de comptage** : tout sac qui la franchit est enregistré.
- Si l'image est noire ou affiche "Connexion…", contactez votre administrateur.

### Étape 2 — Démarrer une session de production

**Navigation :** Menu → `Production` → `Gestion des Sessions`

Cliquez sur **Nouvelle Session**. Le système crée automatiquement une session avec l'heure de démarrage.

```
┌──────────────────────────────────────────┐
│  Session active                          │
│  ─────────────────────────────────────   │
│  Démarrage : 08:02:14                    │
│  Sacs comptés : 247          [En cours]  │
│  Taux actuel : 1 043 sacs/h              │
│                                          │
│              [ Arrêter la session ]      │
└──────────────────────────────────────────┘
```

> **Important :** Une seule session peut être active à la fois. Si une session est déjà en cours quand vous arrivez, vérifiez auprès de l'opérateur précédent si elle doit être clôturée avant d'en démarrer une nouvelle.

### Étape 3 — Surveiller la production en cours

**Navigation :** Menu → `Tableau de Bord`

Le tableau de bord central affiche en temps réel :

```
┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐
│  1 247      │  │  1 043/h    │  │  98.2 %     │  │  3.1 s      │
│  Sacs total │  │  Cadence    │  │  Consistance│  │  Intervalle │
└─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘
```

- **Sacs total** : cumul depuis le démarrage de la session.
- **Cadence** : nombre de sacs par heure calculé sur les 5 dernières minutes.
- **Consistance** : indique si les sacs arrivent de façon régulière (100% = parfaitement régulier, < 85% = flux irrégulier).
- **Intervalle moyen** : durée moyenne entre deux sacs consécutifs.

Le graphique de tendance sous les KPI montre l'évolution minute par minute. Un pic vers le bas signifie un ralentissement de la chaîne.

### Étape 4 — Consulter le journal de production

**Navigation :** Menu → `Production` → `Journal de Production`

Chaque sac détecté apparaît dans ce tableau avec :
- son identifiant horodaté
- son statut (`Conforme`, `À vérifier`, `Rejeté`)
- une miniature de la capture d'image

Cliquez sur l'icône **œil** d'une ligne pour agrandir la capture et voir les détails de détection.

Pour retrouver un sac précis, utilisez la barre de recherche ou le filtre par statut en haut du tableau.

### Étape 5 — Arrêter la session en fin de poste

**Navigation :** Menu → `Production` → `Gestion des Sessions`

Cliquez sur **Arrêter la session**. Le système enregistre l'heure de fin, le total de sacs et les statistiques finales. La session apparaît ensuite dans l'historique.

> **Règle d'or :** Ne jamais fermer son navigateur sans arrêter la session. La session resterait active et comptabiliserait d'éventuelles détections parasites.

---

## 6. Workflow Superviseur — Piloter et Analyser

Le superviseur surveille plusieurs opérateurs et garantit la qualité globale de la production.

### 5.1 Vérification qualité manuelle

Certains sacs sont marqués **À vérifier** automatiquement par le système quand leur score de conformité est bas. Le superviseur les examine et prend une décision.

**Navigation :** Menu → `Qualité` → `Vérification Manuelle`

```
┌──────────────────────────────────────────────────────┐
│  File de vérification (8 éléments)                   │
│  ──────────────────────────────────────────────────  │
│  [Photo du sac]  Sac #2024-001247                    │
│                  Score logo  : 62 % ← en dessous seuil│
│                  Score couleur: 88 %                  │
│                  Session : Poste matin                │
│                                                       │
│           [ Valider ✓ ]   [ Rejeter ✗ ]              │
└──────────────────────────────────────────────────────┘
```

- **Valider** : le sac est conforme malgré le score bas (faux positif du système).
- **Rejeter** : le sac présente bien un défaut. La décision est enregistrée dans l'historique des revues.

### 5.2 Tableau de bord qualité

**Navigation :** Menu → `Qualité` → `Dashboard Qualité`

Ce tableau de bord affiche :
- Le taux de conformité global sur la période courante
- La distribution des scores de confiance IA (histogramme)
- La distribution des scores logo (comparaison au template de référence)
- Les tendances de rejet par heure

> **Exemple d'interprétation :** Si le taux de conformité passe de 97% à 91% entre 10h et 11h, cela peut indiquer un changement de lot de ciment, un problème d'éclairage, ou une usure du conditionnement. Le superviseur doit investiguer.

### 5.3 Chronologie de production

**Navigation :** Menu → `Production` → `Chronologie`

Visualisez la production heure par heure sur les 6 dernières heures, 24 heures ou 3 jours. Le graphique combiné montre :
- Les barres bleues : nombre de sacs par heure
- La courbe orange : intervalle moyen (une montée = ralentissement)

Utilisez les boutons **6H / 24H / 3 jours** pour changer la période.

### 5.4 Rapport de production

**Navigation :** Menu → `Rapports` → `Rapport de Production`

Sélectionnez la période (Aujourd'hui / Cette semaine / Ce mois) et consultez :

| Indicateur | Description |
|-----------|-------------|
| **Total sacs** | Comptage cumulé sur la période |
| **OEE** | Taux de rendement synthétique (Disponibilité × Performance × Qualité) |
| **Disponibilité** | Temps réel de production vs temps planifié |
| **Performance** | Cadence réelle vs cadence cible (1 100 sacs/h) |
| **Qualité** | Ratio de sacs conformes |

> **Pour exporter ce rapport en CSV**, cliquez sur le bouton **Exporter CSV** en haut à droite de la page.

### 5.5 Gestion des alertes

**Navigation :** Menu → `Alertes` → `Gestion des Alertes`

Le badge rouge sur l'icône d'alerte dans le menu indique le nombre d'alertes non lues. Cliquez dessus pour voir le détail.

Chaque alerte indique :
- Le type (chute de cadence, anomalie qualité, erreur système)
- L'heure de déclenchement
- Le message explicatif

Cliquez sur **Marquer comme lu** pour archiver une alerte. Utilisez **Tout marquer comme lu** pour vider la liste en une fois.

---

## 7. Workflow Administrateur — Configurer et Maintenir

L'administrateur configure le système une fois pour toutes et gère les utilisateurs.

### 6.1 Configuration de la caméra

**Navigation :** Menu → `Configuration` → `Paramètres Caméra`

```
┌─────────────────────────────────────────────┐
│  Configuration Caméra                        │
│                                             │
│  Type de source : [● Webcam  ○ RTSP  ○ HTTP]│
│  URL / Index    : [0                      ] │
│  Résolution     : [1280 x 720             ] │
│  FPS cible      : [30                     ] │
│                                             │
│  [ Tester la connexion ]  [ Sauvegarder ]   │
└─────────────────────────────────────────────┘
```

**Types de source :**
- **Webcam locale** : entrez simplement `0` (première webcam), `1` (deuxième), etc.
- **RTSP** : entrez l'URL complète. Exemple : `rtsp://admin:password@192.168.1.50:554/stream`
- **HTTP** : entrez l'URL du flux. Exemple : `http://192.168.1.50:8080/video`

Cliquez toujours sur **Tester la connexion** avant de sauvegarder pour valider que la caméra répond.

### 6.2 Configuration de la ligne virtuelle

La ligne virtuelle est le seuil invisible que le sac doit franchir pour être comptabilisé.

**Navigation :** Menu → `Configuration` → `Ligne Virtuelle`

```
  Vue en temps réel
  ┌────────────────────────────────┐
  │                                │
  │   [Sac]  →  ════════════      │ ← Ligne verticale
  │                ↑               │
  │         Franchissement         │
  │         = +1 compté            │
  └────────────────────────────────┘
```

- **Position** : déplacez le curseur pour positionner la ligne (0% = gauche/haut, 100% = droite/bas).
- **Largeur/Épaisseur** : zone de tolérance de détection.
- **Direction** : définit quel sens de traversée est compté (gauche→droite, droite→gauche, etc.).

> **Règle de positionnement :** Placez la ligne dans la zone où les sacs passent le plus lentement et de façon la plus nette. Évitez les zones où la caméra vibre ou où l'éclairage change.

### 6.3 Configuration du modèle IA

**Navigation :** Menu → `Configuration` → `Modèle IA`

```
┌──────────────────────────────────────────┐
│  Modèle actif : best_V5.pt               │
│                                          │
│  Seuil de confiance : [──●──────] 0.45   │
│  Seuil NMS          : [───●─────] 0.50   │
│  Détections max     : [50              ] │
│                                          │
│  Modèles disponibles :                   │
│  ├─ best_V5.pt (actif)    [Supprimer]    │
│  └─ best_V6.pt (nouveau)  [Activer]      │
│                                          │
│  [+ Uploader un nouveau modèle .pt]      │
└──────────────────────────────────────────┘
```

**Paramètres clés :**
- **Seuil de confiance** : en dessous de ce score, une détection est ignorée. Valeur recommandée : 0.40–0.55. Trop bas → faux positifs ; trop haut → détections manquées.
- **Seuil NMS** : supprime les détections en double sur le même sac. Gardez la valeur par défaut (0.50) sauf cas particulier.

Pour déployer un nouveau modèle, cliquez sur **Uploader un nouveau modèle .pt**, sélectionnez le fichier, puis cliquez **Activer** une fois l'upload terminé. Le moteur bascule sur le nouveau modèle sans redémarrage.

### 6.4 Template de référence et couleurs

Avant de démarrer la première session de production, vous devez calibrer deux éléments : le **template logo** et les **références couleur**. Ces deux éléments travaillent ensemble pour décider si un sac est conforme ou à rejeter.

**Navigation :** Menu → `Configuration` → `Templates & Couleurs`

---

#### Comment le système décide qu'un sac est conforme

Quand un sac franchit la ligne virtuelle, le moteur calcule deux scores en temps réel :

```
Sac franchit la ligne
        │
   ┌────┴────┐
   ▼         ▼
Score     Score
 Logo    Couleur
  │         │
  └────┬────┘
       ▼
  CONFORME ou REJETÉ
```

| Configuration active | Décision |
|---------------------|----------|
| Aucune (logo ni couleur) | Tous les sacs comptés comme **conformes** |
| Logo uniquement | Conforme si `score_logo ≥ seuil_logo` |
| Couleur uniquement | Conforme si `score_couleur ≥ seuil_couleur` |
| Logo **et** couleur | Conforme si les **deux** seuils sont atteints |

> **Conseil :** Utiliser les deux ensemble offre la meilleure fiabilité. Un sac d'une autre marque de même couleur passe le filtre couleur mais échoue au logo. Un sac Mira-Co très sale passe le filtre logo mais échoue à la couleur.

---

#### Étape 1 — Uploader un template logo

Le template est une photo du logo Mira-Co que le moteur utilise comme référence visuelle. Il compare les formes et textures du logo sur chaque sac à cette image.

**Ce qu'il faut faire :**

1. Cliquez sur **Uploader un template**.
2. Sélectionnez une photo nette du logo Mira-Co — JPEG ou PNG, prise dans les mêmes conditions que la caméra de production (même angle, même éclairage).
3. Le template est activé immédiatement.

**Ce qui fait une bonne photo de référence :**

| ✅ Bonne référence | ❌ Mauvaise référence |
|-------------------|----------------------|
| Logo centré et bien lisible | Logo flou ou partiellement coupé |
| Éclairage uniforme | Ombres sur le logo |
| Même angle que la caméra | Vue de face alors que la caméra filme de haut |
| Fond neutre (convoyeur) | Fond surchargé ou très contrasté |

---

#### Étape 2 — Régler le seuil logo

Le seuil logo définit le score minimum de ressemblance entre le sac et votre template. Il varie de **0.0** (accepte tout) à **1.0** (correspondance parfaite exigée).

**Procédure de calibration :**

1. Démarrez une session test avec quelques sacs Mira-Co conformes et, si possible, un ou deux sacs d'une autre marque.
2. Consultez le **Journal de Production** — colonne **Logo** — et notez les scores obtenus.
3. Placez le seuil entre le score le plus bas d'un sac conforme et le score le plus haut d'un sac non conforme.

Exemple concret :

```
Sac Mira-Co bien éclairé  →  score logo = 0.87
Sac Mira-Co dans l'ombre  →  score logo = 0.61
Sac autre marque          →  score logo = 0.21
Sac Mira-Co abîmé         →  score logo = 0.44

                  ← Sacs rejetés →      ← Sacs conformes →
score :    0.21         0.44    │ 0.55 │  0.61        0.87
                                └──────┘
                            Seuil idéal : 0.55
```

| Conditions de production | Seuil logo recommandé |
|-------------------------|----------------------|
| Éclairage stable, logo impeccable | 0.60 – 0.75 |
| Éclairage variable ou sacs parfois sales | 0.45 – 0.60 |
| Conditions difficiles (poussière, contre-jour) | 0.30 – 0.45 |

---

#### Étape 3 — Ajouter une référence couleur

La référence couleur permet de reconnaître les sacs Mira-Co par leur teinte caractéristique. Le moteur calcule la fraction de pixels du sac qui correspondent à cette couleur.

**Trouver la bonne couleur hex :**

1. Ouvrez une capture d'un sac Mira-Co depuis le **Journal de Production** (cliquez sur l'icône œil).
2. Ouvrez l'image dans un outil comme Paint ou GIMP.
3. Utilisez la pipette sur la zone la plus représentative du sac — **pas le logo, pas l'ombre, le fond uni**.
4. Copiez le code hexadécimal obtenu (ex : `#B8A890`).

**Ajouter la référence dans l'interface :**

1. Cliquez sur **Ajouter une couleur**.
2. Collez le code hex et donnez un nom (ex : "Beige Mira-Co standard").
3. Réglez la **tolérance** — voir section suivante.

---

#### Étape 4 — Régler la tolérance HSV et le seuil couleur

La tolérance et le seuil sont deux réglages distincts qui agissent en série :

```
Couleur hex  →  Tolérance  →  Plage HSV acceptée
                    │
                    ▼
            % de pixels dans cette plage  =  score_couleur
                    │
              Seuil couleur
                    │
            ┌───────┴────────┐
            ▼                ▼
        CONFORME           REJETÉ
```

**La tolérance** élargit ou resserre la plage de teintes acceptables autour de votre couleur de référence.

| Tolérance | Effet | Quand l'utiliser |
|-----------|-------|-----------------|
| 5 – 10 | Très stricte — seule la couleur exacte passe | Éclairage LED constant, couleur très distinctive |
| 15 – 25 | Équilibrée | Conditions industrielles normales |
| 30 – 40 | Large — accepte les variations de teinte | Éclairage naturel variable, sacs de différents lots |

**Le seuil couleur** définit la fraction minimale de pixels du sac devant correspondre à la plage.

> Pourquoi ne pas viser 100 % ? Un sac réel a un logo, du texte, des ombres et des reflets — même un sac parfaitement conforme n'est jamais entièrement d'une seule couleur. Un seuil entre **0.20 et 0.35** est réaliste pour la plupart des sacs de ciment.

**Procédure pratique :**

1. Commencez avec **tolérance = 30** et **seuil = 0.15**.
2. Lancez une session test et notez les scores couleur dans le journal.
3. Ajustez selon ce que vous observez :

| Problème observé | Action |
|-----------------|--------|
| Des sacs Mira-Co corrects sont rejetés (score trop bas) | Augmenter la tolérance OU baisser le seuil |
| Des sacs d'une autre marque passent (score trop haut) | Diminuer la tolérance OU augmenter le seuil |
| Les scores varient beaucoup selon l'heure | Augmenter la tolérance (problème d'éclairage) |
| Les scores sont stables mais trop bas | Re-picker la couleur hex depuis une capture récente |

**Exemple de calibration pour un sac beige Mira-Co :**

```
Couleur hex     : #B8A890
Tolérance       : 25
Plage HSV générée (automatique) :
   Teinte H  : 23 → 47   (beige à sable)
   Saturation S : 45 → 145 (peu à moyennement saturé)
   Valeur V  : 130 → 230  (ni trop sombre ni surexposé)

Seuil couleur   : 0.25
→ 25 % des pixels du sac doivent tomber dans cette plage
→ Réaliste : le reste est occupé par le logo, les textes, les ombres
```

---

#### Résumé visuel — Où regarder les scores après calibration

Ouvrez le **Journal de Production** après une session test et consultez les colonnes **Logo** et **Couleur** :

```
┌────────┬─────────┬────────┬────────┬──────────┐
│ ID Sac │  Logo   │Couleur │ Statut │  Action  │
├────────┼─────────┼────────┼────────┼──────────┤
│ B-501  │  0.82   │  0.71  │ VÉRIFIÉ│   👁     │  ← conforme, scores OK
│ B-502  │  0.23   │  0.68  │ REJETÉ │   👁     │  ← logo insuffisant
│ B-503  │  0.79   │  0.11  │ REJETÉ │   👁     │  ← couleur insuffisante
│ B-504  │  0.18   │  0.09  │ REJETÉ │   👁     │  ← les deux insuffisants
└────────┴─────────┴────────┴────────┴──────────┘
```

Si B-501 est un sac Mira-Co conforme et B-504 est clairement un sac étranger, votre calibration est bonne. Si B-502 est aussi un sac Mira-Co correct, baissez le seuil logo ou prenez un meilleur template.

### 6.5 Gestion des utilisateurs

**Navigation :** Menu → `Administration` → `Utilisateurs`

**Créer un utilisateur :**
1. Cliquez sur **Nouvel utilisateur**.
2. Renseignez le nom complet, l'identifiant, le rôle et le mot de passe initial (6 caractères minimum).
3. Cliquez sur **Créer**.

**Modifier un utilisateur :**
- Cliquez sur l'icône crayon à droite d'une ligne.
- Modifiez le nom, le rôle ou le statut actif/inactif.
- Pour changer le mot de passe, cliquez sur l'icône clé.

**Désactiver un compte :**
- Cliquez sur le toggle **Actif/Inactif** sur la ligne de l'utilisateur. Le compte est suspendu sans être supprimé.

> **Bonne pratique :** Ne supprimez jamais un compte d'un ancien employé — désactivez-le. Cela préserve l'historique des actions liées à ce compte dans le journal d'audit.

### 6.6 Paramètres système

**Navigation :** Menu → `Administration` → `Paramètres Système`

Ce panneau est organisé en 5 onglets :

**Onglet Général**
- Nom du site, localisation, fuseau horaire, langue
- Rétention des données (nombre de jours avant archivage automatique)
- Niveau de journalisation (INFO, DEBUG, ERROR)

**Onglet Alertes**
- Canaux de notification : son navigateur, email, Slack, téléphone superviseur
- Vue d'ensemble des règles d'alerte actives

**Onglet Performance**
- Paramètres de cache et de nettoyage automatique

**Onglet Sécurité**
- Durée de validité du jeton JWT (minutes de session)
- Nombre maximal de tentatives de connexion
- Délai d'expiration de session inactive
- Activation du HTTPS forcé

**Onglet Archivage**
- **Exporter la configuration** : télécharge un fichier JSON avec tous les paramètres système (utile pour sauvegarder la config avant une migration).
- **Importer une configuration** : restaure les paramètres depuis un fichier JSON.
- **Télécharger la base de données** : télécharge le fichier `.db` SQLite complet (sauvegarde complète des données).

### 6.7 Gestion des appareils caméra

Si plusieurs caméras sont connectées à l'installation :

**Navigation :** Menu → `Administration` → `Appareils`

L'onglet **Caméras** liste toutes les caméras configurées. Pour chacune :
- **Tester** : vérifie la connectivité en temps réel (affiche la latence en ms).
- **Activer** : bascule le moteur de vision sur cette caméra sans redémarrage.
- **Modifier** : change l'URL, la résolution ou les notes.

L'onglet **Système** affiche l'état du serveur : CPU, RAM, disque et température.

L'onglet **Services** montre les 4 services critiques : moteur YOLO, base de données, API et flux MJPEG.

### 6.8 Clés API

Les clés API permettent à des systèmes tiers (ERP, logiciels de supervision) d'accéder aux données sans passer par l'interface web.

**Navigation :** Menu → `Administration` → `Gestion API`

**Créer une clé :**
1. Cliquez sur **Nouvelle clé API**.
2. Donnez-lui un nom descriptif (ex : "ERP SAP Production").
3. Choisissez le scope :
   - `read` : consultation uniquement
   - `write` : consultation + modification
   - `admin` : accès complet
4. Cliquez sur **Générer**.

La clé complète s'affiche **une seule fois** — copiez-la immédiatement dans votre système cible. Si elle est perdue, révoquez-la et créez-en une nouvelle.

**Utilisation de la clé dans une requête HTTP :**
```
Authorization: Bearer cmt_votreclé...
```

### 6.9 Intégration avec des services tiers

**Navigation :** Menu → `Intégration` → `Services Tiers`

**Onglet Webhook**
Configurez une URL de webhook pour recevoir des notifications automatiques (ex : une nouvelle alerte déclenche un appel HTTP vers votre système de supervision).

Exemple d'URL : `https://votre-erp.com/api/webhook/ciment`

Cliquez sur **Tester le webhook** pour envoyer un message de test et vérifier la réception.

**Onglet Email SMTP**
Configurez un serveur mail pour les notifications par email.

```
Serveur SMTP : smtp.gmail.com
Port         : 587
Utilisateur  : votre@gmail.com
Mot de passe : [mot de passe d'application]
Expéditeur   : Compteur Ciment <votre@gmail.com>
```

**Onglet Slack / Teams**
Entrez l'URL du webhook Slack ou Teams pour recevoir des alertes directement dans un canal d'équipe.

---

## 8. Gestion des Alertes

### 7.1 Comprendre les types d'alertes

| Type | Icône | Signification |
|------|-------|---------------|
| `production_gap` | ⚠️ jaune | Arrêt de production détecté (aucun sac pendant N secondes) |
| `low_rate` | 🔴 rouge | La cadence est tombée sous le seuil configuré |
| `high_anomaly` | 🔴 rouge | Trop d'anomalies qualité sur la période |
| `system` | 🔵 bleu | Événement technique (démarrage, erreur, reconnexion) |
| `manual` | ⚪ gris | Alerte créée manuellement par un opérateur |

### 7.2 Configurer les règles d'alerte

**Navigation :** Menu → `Alertes` → `Gestion des Alertes` → onglet **Règles**

Chaque règle a :
- un **nom** descriptif
- un **type** (cadence, anomalies, etc.)
- un **seuil** déclencheur (ex : cadence < 800 sacs/h)
- un toggle **actif/inactif**

Pour modifier une règle, cliquez sur l'icône crayon, ajustez le seuil, et sauvegardez.

### 7.3 Créer une alerte manuelle

Si vous observez un problème physique (bande transporteuse glissante, problème d'alimentation) qui ne déclenche pas d'alerte automatique :

1. Allez dans `Alertes` → `Gestion des Alertes`.
2. Cliquez sur **Créer une alerte**.
3. Entrez un titre et un message descriptif.
4. Sélectionnez le type (`manual`) et cliquez sur **Créer**.

L'alerte apparaît dans l'historique avec votre horodatage.

---

## 9. Rapports et Exports

### 8.1 Rapport de production périodique

**Navigation :** Menu → `Rapports` → `Rapport de Production`

Choisissez la période parmi :
- **Aujourd'hui** : depuis minuit
- **Cette semaine** : du lundi à aujourd'hui
- **Ce mois** : depuis le 1er du mois

Le rapport affiche les KPIs clés, les comparaisons avec la période précédente (flèches vertes/rouges) et l'OEE décomposé.

### 8.2 Export de données avancé

**Navigation :** Menu → `Rapports` → `Export de Données`

Configurez votre export en 3 étapes :

**Étape 1 — Choisir la source**

| Source | Contient |
|--------|----------|
| `Comptages bruts` | Chaque sac détecté avec horodatage, session, scores |
| `Sessions` | Résumé de chaque session (durée, total, OEE) |
| `Anomalies` | Sacs rejetés ou à score bas |
| `Qualité` | Toutes les décisions de revue manuelle |

**Étape 2 — Choisir la période**
Aujourd'hui, hier, 7 jours, 30 jours, ou une plage personnalisée (date début → date fin).

**Étape 3 — Choisir le format**

| Format | Usage recommandé |
|--------|-----------------|
| **CSV** | Tableur léger, import universel |
| **XLSX** | Excel avec mise en forme industrielle |
| **PDF** | Rapport formel pour impression |
| **JSON** | Intégration technique avec un autre système |

Cliquez sur **Exporter** et le fichier se télécharge automatiquement.

### 8.3 Planification automatique

Pour recevoir un rapport tous les matins sans intervention :

1. Dans `Export de Données`, faites défiler jusqu'à **Planification Automatique**.
2. Activez la planification.
3. Choisissez : fréquence (quotidien/hebdo/mensuel), heure UTC, source et format.
4. Optionnellement, entrez un email de réception.
5. Cliquez sur **Sauvegarder la planification**.

L'historique des exports automatiques est consultable en bas de page.

### 8.4 Piste d'audit

**Navigation :** Menu → `Rapports` → `Piste d'Audit`

La piste d'audit enregistre toutes les actions sensibles du système :

| Action | Signification |
|--------|--------------|
| `login` | Connexion réussie |
| `failed_login` | Tentative de connexion échouée |
| `created` | Création d'un utilisateur ou d'une ressource |
| `updated` | Modification d'un paramètre |
| `deleted` | Suppression |
| `password_changed` | Changement de mot de passe |

Utilisez la recherche par nom d'utilisateur et le filtre par type d'action pour retrouver un événement précis. Exportez en CSV pour un audit externe.

---

## 10. Maintenance et Santé du Système

### 9.1 Surveillance en temps réel

**Navigation :** Menu → `Maintenance` → `Santé Système`

Cette page se rafraîchit toutes les 5 secondes et affiche :

```
┌──────────────────────────────────────────────┐
│  CPU        [████████░░]  78 %               │
│  Mémoire    [█████░░░░░]  52 %               │
│  Disque     [███░░░░░░░]  31 %               │
│                                              │
│  Services                                    │
│  ✅ Moteur YOLO    ✅ FastAPI                 │
│  ✅ Base de données  ✅ Flux MJPEG            │
└──────────────────────────────────────────────┘
```

Les barres passent au jaune à partir de 75% et au rouge à partir de 90%.

### 9.2 Maintenance de la base de données

**Navigation :** Menu → `Maintenance` → `Base de Données`

Effectuez ces opérations régulièrement (recommandation mensuelle) :

| Action | Quand l'utiliser | Durée |
|--------|-----------------|-------|
| **Optimiser (VACUUM)** | Fragmentation > 15% | 10–60 secondes |
| **Réindexer** | Après une large suppression | 5–30 secondes |
| **Archiver** | Supprimer les sessions et logs anciens | Quelques secondes |
| **Sauvegarder** | Avant toute opération risquée | Immédiat (téléchargement) |

> **Attention :** L'action **Purger** supprime définitivement les logs, captures et revues. Cette opération est irréversible. Faites toujours une sauvegarde avant.

### 9.3 Diagnostics avancés

**Navigation :** Menu → `Maintenance` → `Diagnostics`

L'onglet **Tests composants** lance 5 vérifications automatiques :
1. Moteur YOLO (thread actif)
2. Base de données (lecture/écriture test)
3. Disque (vitesse d'écriture)
4. API (latence interne)
5. Caméra (connexion réelle OpenCV)

Un badge vert/rouge indique le résultat global. Cliquez sur chaque test pour voir le détail (latence en ms, résolution détectée, etc.).

L'onglet **Benchmark IA** lance 20 inférences de test et retourne les temps moyen, minimum et maximum. Utile pour évaluer les performances après un changement de modèle ou de matériel.

---

## 11. Résolution des Problèmes Courants

### Le flux vidéo ne s'affiche pas

| Symptôme | Cause probable | Solution |
|----------|---------------|----------|
| Écran noir | Caméra déconnectée | Vérifier le câble USB ou l'URL RTSP dans Configuration > Caméra |
| "Connexion en cours…" en boucle | Service YOLO arrêté | Aller dans Maintenance > Santé Système et vérifier le service YOLO |
| Image figée | Connexion réseau instable | La reconnexion est automatique (environ 5 secondes) |

### Les sacs ne sont pas comptés

| Symptôme | Cause probable | Solution |
|----------|---------------|----------|
| Compteur reste à 0 | Aucune session active | Démarrer une session dans Production > Gestion des Sessions |
| Sacs visibles mais non comptés | Ligne virtuelle mal positionnée | Ajuster la position dans Configuration > Ligne Virtuelle |
| Sacs non comptés avec score < 40% | Seuil de confiance trop élevé | Baisser le seuil dans Configuration > Modèle IA |

### "Session expirée" s'affiche de façon inattendue

La session JWT a expiré. Cliquez sur **Connexion** pour vous reconnecter. Pour augmenter la durée de session, l'administrateur peut modifier `jwt_expire_minutes` dans `Administration > Paramètres Système > Sécurité`.

### Impossible de se connecter (mot de passe refusé)

- Vérifiez que la touche Verr.Maj n'est pas activée.
- Si vous avez oublié votre mot de passe, contactez l'administrateur.
- Si le compte admin est bloqué, l'administrateur système peut réinitialiser le mot de passe directement en base de données.

### L'export XLSX échoue avec une erreur 500

Ce problème survient si `openpyxl` n'est pas installé ou est en version incompatible. L'administrateur doit vérifier :
```bash
pip install openpyxl --upgrade
```

### Le badge d'alertes affiche un nombre anormalement élevé

Allez dans `Alertes > Gestion des Alertes` et cliquez sur **Tout marquer comme lu** pour réinitialiser le compteur.

---

## 12. Glossaire

| Terme | Définition |
|-------|-----------|
| **OEE / TRS** | Taux de Rendement Synthétique. Produit de la Disponibilité × Performance × Qualité. Un OEE de 85% est considéré comme excellent en industrie. |
| **Session** | Période de production encadrée par un démarrage et un arrêt manuels. Chaque session génère ses propres statistiques. |
| **Ligne virtuelle** | Frontière invisible dans l'image vidéo. Tout sac qui la traverse dans la direction configurée est compté. |
| **Template** | Image de référence d'un sac conforme. Utilisée pour calculer le score de similarité logo. |
| **Score de confiance** | Probabilité (0–1) estimée par le modèle IA qu'un objet détecté est bien un sac de ciment. |
| **Score logo** | Similarité entre le logo du sac détecté et le template de référence (0 = aucune ressemblance, 1 = identique). |
| **Score couleur** | Correspondance entre la couleur du sac et les références couleur configurées. |
| **RTSP** | Real Time Streaming Protocol. Protocole standard pour les caméras IP réseau. |
| **JWT** | JSON Web Token. Jeton d'authentification signé stocké dans le navigateur, valide pendant la durée configurée. |
| **Scope API** | Niveau d'autorisation d'une clé API : `read` (lecture), `write` (écriture), `admin` (complet). |
| **VACUUM** | Opération SQLite qui réorganise physiquement le fichier base de données pour récupérer l'espace fragmenté. |
| **WebSocket** | Protocole de communication bidirectionnelle en temps réel entre le serveur et le navigateur, utilisé pour le flux vidéo et les événements de comptage. |

---

*Document rédigé pour la version 1.0 — Compteur Automatique de Sacs de Ciment*
*Pour toute question, contactez l'administrateur système de votre installation.*

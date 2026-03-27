# Guide de Continuité des Activités
## Compteur Automatique de Sacs de Ciment

**Version :** 1.0
**Date :** Mars 2026
**Statut :** Document de référence opérationnelle

---

## Avant-propos

### Pourquoi ce document existe

La chaîne de production tourne à **~1 100 sacs de ciment par heure**. Chaque sac compte — littéralement. Le système Compteur Automatique remplace le comptage manuel, réduisant les erreurs humaines et libérant les opérateurs pour des tâches à plus haute valeur ajoutée.

Mais voilà le problème : tout système informatique tombe en panne, tôt ou tard. La question n'est pas *si* le système va avoir un problème, c'est *quand* — et surtout, **combien de temps la production restera aveugle** pendant qu'on cherche fébrilement comment le relancer.

Ce guide existe pour que cette durée soit mesurée en **minutes**, pas en heures.

### Ce que ce document n'est pas

Ce guide n'est pas un manuel technique à lire de A à Z un dimanche pluvieux. C'est un **outil opérationnel** : on l'ouvre quand quelque chose va mal, on trouve le bon scénario, on suit les étapes numérotées.

### Ce qu'on fait après avoir lu ce document

1. Identifier les personnes responsables et remplir la section [Contacts et escalade](#10-contacts-et-escalade).
2. Réaliser une première sauvegarde manuelle dès aujourd'hui (section [4. Stratégie de sauvegarde](#4-stratégie-de-sauvegarde)).
3. Planifier un test de reprise dans les 30 prochains jours (section [9. Tests du plan de continuité](#9-tests-du-plan-de-continuité)).
4. Afficher ou partager ce document avec tous les membres de l'équipe technique.

> **Règle d'or :** Un plan de reprise non testé est un plan non fiable. Testez avant que la crise arrive.

---

## Table des matières

1. [Avant-propos](#avant-propos)
2. [Analyse des risques](#2-analyse-des-risques)
3. [Architecture et dépendances](#3-architecture-et-dépendances)
4. [Stratégie de sauvegarde](#4-stratégie-de-sauvegarde)
5. [Procédures de reprise](#5-procédures-de-reprise)
6. [Procédures de maintenance préventive](#6-procédures-de-maintenance-préventive)
7. [Surveillance et alertes](#7-surveillance-et-alertes)
8. [Plan de reprise après sinistre (DRP)](#8-plan-de-reprise-après-sinistre-drp)
9. [Tests du plan de continuité](#9-tests-du-plan-de-continuité)
10. [Contacts et escalade](#10-contacts-et-escalade)
11. [Glossaire](#11-glossaire)

---

## 2. Analyse des risques

### 2.1 Méthode d'évaluation

Chaque risque est évalué selon deux axes :

- **Probabilité** : quelle est la chance que cela arrive dans les 12 prochains mois ?
- **Impact** : quel est l'effet sur la production si cela arrive ?

**Échelle :**

| Niveau | Probabilité | Signification |
|--------|-------------|---------------|
| 1 | Très faible | Moins d'une fois tous les 2 ans |
| 2 | Faible | Environ une fois par an |
| 3 | Modérée | Plusieurs fois par an |
| 4 | Élevée | Mensuelle ou plus fréquente |
| 5 | Très élevée | Hebdomadaire ou quasi-certaine |

| Niveau | Impact | Signification |
|--------|--------|---------------|
| 1 | Négligeable | Aucun arrêt, correction transparente |
| 2 | Mineur | Dégradation de l'interface, comptage intact |
| 3 | Modéré | Comptage ralenti ou partiel |
| 4 | Majeur | Arrêt du comptage automatique, retour manuel |
| 5 | Critique | Perte de données + arrêt complet |

**Score de risque = Probabilité × Impact** (max 25)

### 2.2 Matrice des risques

| Composant | Probabilité | Impact | Score | Niveau | Mitigation principale |
|-----------|-------------|--------|-------|--------|-----------------------|
| Panne caméra (câble, alimentation) | 3 | 4 | **12** | ÉLEVÉ | Caméra de rechange, câbles testés |
| Corruption base de données | 2 | 5 | **10** | ÉLEVÉ | Sauvegardes quotidiennes automatiques |
| Backend FastAPI planté | 3 | 4 | **12** | ÉLEVÉ | Restart automatique Docker, health checks |
| Perte du modèle YOLO | 2 | 4 | **8** | MOYEN | Copie du modèle sur support externe |
| Panne serveur matériel | 1 | 5 | **5** | MOYEN | Procédure de restauration complète |
| Interface frontend inaccessible | 3 | 2 | **6** | MOYEN | Backend indépendant du frontend |
| Saturation disque | 2 | 4 | **8** | MOYEN | Monitoring espace disque + archivage |
| Panne réseau (Docker) | 2 | 3 | **6** | MOYEN | Redémarrage réseau Docker |
| Crash en cours de session | 3 | 3 | **9** | ÉLEVÉ | Reprise de session, sauvegarde fréquente |
| Mise à jour système défaillante | 2 | 4 | **8** | MOYEN | Tests avant déploiement, rollback |

### 2.3 Visualisation de la matrice

```
IMPACT
  5 |              |              | [BDD]        | [BDD]        | [Serveur]
    |              |              |              |              |
  4 |              |              | [YOLO][Disk] | [Cam][Back]  |
    |              |              |              |              |
  3 |              |              |              | [Session]    | [Réseau]
    |              |              |              |              |
  2 |              |              |              | [Frontend]   |
    |              |              |              |              |
  1 |______________|______________|______________|______________|
         1              2              3              4              5
                                                        PROBABILITÉ
    [  FAIBLE  ]  [ MODÉRÉ  ]   [  ÉLEVÉ   ]   [  CRITIQUE ]
```

### 2.4 Objectifs RTO et RPO par scénario

**RTO** = Return to Operations (durée maximale acceptable avant reprise)
**RPO** = Recovery Point Objective (perte de données maximale acceptable)

| Scénario | RTO cible | RPO cible | Justification |
|----------|-----------|-----------|---------------|
| Backend inaccessible | **5 min** | 0 (pas de perte) | Restart simple, aucune donnée perdue |
| Perte base de données | **30 min** | **24h max** | Restauration backup J-1 |
| Panne caméra | **15 min** | 0 | Remplacement matériel, données intactes |
| Modèle YOLO manquant | **10 min** | 0 | Copie du fichier .pt de secours |
| Serveur entier HS | **4h** | **24h max** | Restauration complète sur nouveau matériel |
| Perte session en cours | **5 min** | Session actuelle | Reprise ou recréation de session |

---

## 3. Architecture et dépendances

### 3.1 Vue d'ensemble des composants

```
                    PRODUCTION LINE
                         |
                      [CAMERA]
                         |
                    flux vidéo
                         |
                  [VISION ENGINE]
                  (YOLOv8 / best_V5.pt)
                         |
                   détections JSON
                         |
               [BACKEND FastAPI :8000]
               /                    \
         [DATABASE]            [STATIC FILES]
     (SQLite .db)            (captures .jpg)
               \
        [FRONTEND React]
          (Nginx :80)
               |
          [OPÉRATEUR]
```

### 3.2 Dépendances entre composants

| Composant | Dépend de | Est requis par | Si tombe en panne |
|-----------|-----------|----------------|-------------------|
| Caméra | Alimentation, câble | Vision Engine | Détection impossible |
| Vision Engine (YOLO) | Caméra + modèle .pt | Backend | Pas de détection, app continue |
| Modèle best_V5.pt | Fichier présent dans ./models/ | Vision Engine | Détection refuse de démarrer |
| Backend (FastAPI) | Base de données | Frontend, YOLO | Comptage arrêté |
| Base de données (SQLite) | Espace disque | Backend | Données perdues, backend plante |
| Frontend (React/Nginx) | Backend (API) | Opérateur | Interface absente, comptage continue |

### 3.3 Points de défaillance uniques (Single Points of Failure)

Un **point de défaillance unique** (SPOF) est un composant dont la panne arrête tout le système, sans redondance disponible.

```
SPOF identifiés :
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  1. CAMÉRA PHYSIQUE — une seule caméra, pas de redondance  │
│     Mitigation : tenir une caméra de rechange en stock     │
│                                                             │
│  2. BASE DE DONNÉES SQLITE — fichier unique sur disque     │
│     Mitigation : sauvegardes régulières sur support ext.   │
│                                                             │
│  3. MODÈLE YOLO (best_V5.pt) — fichier unique              │
│     Mitigation : copie sur clé USB / NAS / cloud           │
│                                                             │
│  4. SERVEUR HÔTE — machine unique                          │
│     Mitigation : procédure de restauration complète        │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 3.4 Chemins des fichiers critiques

| Fichier / Répertoire | Chemin (Docker) | Chemin (Local) | Criticité |
|----------------------|-----------------|----------------|-----------|
| Base de données | `/data/cement_counter.db` (volume `db_data`) | `./data/cement_counter.db` | CRITIQUE |
| Modèle YOLO | `./models/best_V5.pt` | `./models/best_V5.pt` | ÉLEVÉE |
| Configuration env | `./.env` | `./.env` | ÉLEVÉE |
| Captures statiques | `./backend/static/captures/` | `./backend/static/captures/` | MODÉRÉE |
| Logs (API) | Via `/api/diagnostics/logs` | Via `/api/diagnostics/logs` | FAIBLE |

---

## 4. Stratégie de sauvegarde

> **Principe fondamental :** Une sauvegarde non testée n'est pas une sauvegarde. Testez la restauration au moins une fois par trimestre.

### 4.1 Sauvegarde manuelle

#### Via l'interface d'administration (recommandée pour les non-techniciens)

1. Ouvrir l'interface web du système (ex. `http://[IP_SERVEUR]/`)
2. Accéder au menu **Administration** > **Base de données**
3. Cliquer sur **Télécharger la sauvegarde**
4. Enregistrer le fichier `.bak` sur un support externe (clé USB, NAS, dossier réseau)
5. Nommer le fichier avec la date : `cement_counter_AAAA-MM-JJ.bak`

#### Via l'API (pour les techniciens, scriptable)

```bash
# Télécharger une sauvegarde de la base de données
curl -o "cement_counter_$(date +%Y-%m-%d).bak" \
     http://[IP_SERVEUR]:8000/api/database/backup

# Vérifier que le fichier n'est pas vide
ls -lh cement_counter_*.bak

# Exporter la configuration système
curl -o "config_$(date +%Y-%m-%d).json" \
     http://[IP_SERVEUR]:8000/api/system/export-config
```

**Exemple concret :** Le 15 mars à 18h00, avant la fin de poste, l'opérateur Karim clique sur "Télécharger la sauvegarde". Il obtient le fichier `cement_counter_2026-03-15.bak` (environ 200 MB après 4 millions de sacs détectés). Il copie ce fichier sur la clé USB dédiée aux sauvegardes et note l'opération dans le registre papier.

### 4.2 Sauvegarde automatique (recommandations)

Pour éviter de dépendre de la discipline humaine, mettre en place une sauvegarde automatique nocturne.

#### Option A : Cron Linux (déploiement direct)

```bash
# Éditer la crontab du serveur
crontab -e

# Ajouter cette ligne : sauvegarde tous les jours à 02h00
0 2 * * * curl -s -o /backup/cement_counter_$(date +\%Y-\%m-\%d).bak http://localhost:8000/api/database/backup

# Nettoyage automatique : garder seulement les 30 derniers jours
0 3 * * * find /backup -name "cement_counter_*.bak" -mtime +30 -delete
```

#### Option B : Script PowerShell (serveur Windows)

```powershell
# Script : C:\backup\backup-cement.ps1
$date = Get-Date -Format "yyyy-MM-dd"
$dest = "C:\backup\cement_counter_$date.bak"
Invoke-WebRequest -Uri "http://localhost:8000/api/database/backup" -OutFile $dest
Write-Host "Sauvegarde créée : $dest ($($(Get-Item $dest).Length / 1MB) MB)"

# Nettoyer les sauvegardes de plus de 30 jours
Get-ChildItem "C:\backup\cement_counter_*.bak" |
  Where-Object { $_.LastWriteTime -lt (Get-Date).AddDays(-30) } |
  Remove-Item
```

#### Planification recommandée

| Fréquence | Heure | Rétention | Support |
|-----------|-------|-----------|---------|
| Quotidienne | 02h00 | 30 jours | Disque local du serveur |
| Hebdomadaire (lundi) | 03h00 | 3 mois | NAS ou dossier réseau |
| Mensuelle (1er du mois) | 04h00 | 1 an | Support externe ou cloud |

### 4.3 Sauvegarde de la configuration

Le fichier `.env` contient les paramètres critiques du système (seuils d'alerte, chemins, credentials). Il doit être sauvegardé séparément de la base de données.

```bash
# Sauvegarder la configuration (ATTENTION : peut contenir des mots de passe)
cp .env /backup/env_$(date +%Y-%m-%d).env

# Alternative via API (export JSON, sans données sensibles)
curl -o /backup/config_$(date +%Y-%m-%d).json \
     http://localhost:8000/api/system/export-config
```

> **Avertissement sécurité :** Le fichier `.env` peut contenir des mots de passe. Stocker les sauvegardes de configuration dans un endroit à accès restreint, distinct des sauvegardes de données.

### 4.4 Conservation du modèle YOLO

Le fichier `best_V5.pt` est le fruit d'un entraînement potentiellement long et coûteux. Sa perte obligerait à réentraîner le modèle (plusieurs heures à plusieurs jours).

**Stratégie de protection :**

```
Modèle original : ./models/best_V5.pt
     |
     +---> Copie 1 : Clé USB dédiée (stockée hors serveur)
     |
     +---> Copie 2 : NAS de l'entreprise ou dossier réseau partagé
     |
     +---> Copie 3 : Cloud (si politique de sécurité le permet)
```

```bash
# Vérifier l'intégrité du modèle (empreinte MD5)
md5sum ./models/best_V5.pt > ./models/best_V5.pt.md5
# Sauvegarder l'empreinte avec le modèle pour vérification future

# Vérifier une copie de sauvegarde
md5sum /backup/best_V5.pt
# Le hash doit être identique à celui de ./models/best_V5.pt.md5
```

**Taille indicative du modèle :** Les modèles YOLOv8 varient entre 6 MB (nano) et 130 MB (extra-large). Prévoir au minimum 200 MB d'espace pour le modèle + les métadonnées.

---

## 5. Procédures de reprise

> **Comment utiliser cette section :** Identifier le scénario qui correspond à la panne observée. Suivre les étapes dans l'ordre indiqué. Ne pas sauter d'étapes.

### Scénario 1 : Backend inaccessible

**Symptômes :** L'interface ne répond plus, les API renvoient des erreurs 502/503, la détection semble arrêtée.

**RTO cible : 5 minutes | RPO : 0 (aucune perte de données)**

#### Arbre de décision

```
Backend inaccessible
        |
        v
  [Tester /api/health]
        |
   +----+----+
   |         |
 200 OK    Erreur/Timeout
   |         |
   |    [Conteneur Docker actif ?]
   |         |
   |    +----+----+
   |    |         |
   |  Actif    Inactif
   |    |         |
   |  [Logs ?]  [Restart]
   |    |
   |  [Crash récent ?]
   |    |
   |  Réparer cause racine
   |
  Problème réseau/proxy
```

#### Procédure de reprise

**Étape 1 — Diagnostiquer**
```bash
# Vérifier que le backend répond
curl http://localhost:8000/api/health
# Réponse attendue : {"status": "ok", ...}

# En déploiement Docker
docker-compose ps
docker-compose logs backend --tail=50
```

**Étape 2 — Redémarrer le backend**
```bash
# Déploiement Docker Compose
docker-compose restart backend

# Déploiement direct (Linux avec systemctl)
sudo systemctl restart cement-counter-backend

# Attendre 10 secondes, puis vérifier
sleep 10 && curl http://localhost:8000/api/health
```

**Étape 3 — Vérifier la reprise**
```bash
# Le endpoint /api/health doit répondre 200
curl -s http://localhost:8000/api/health | python3 -m json.tool

# Vérifier que la détection fonctionne
curl -s http://localhost:8000/api/status
```

**Étape 4 — Si le redémarrage échoue**
```bash
# Inspecter les logs détaillés
docker-compose logs backend --tail=200

# Problèmes courants :
# - "database is locked" → base de données verrouillée (voir Scénario 2)
# - "model not found" → fichier YOLO manquant (voir Scénario 4)
# - "port already in use" → conflit de port, tuer le processus
lsof -i :8000  # Linux
```

**Étape 5 — Informer les opérateurs**
Pendant la réparation, les opérateurs doivent passer en **comptage manuel** (voir section [Plan de reprise après sinistre](#8-plan-de-reprise-après-sinistre-drp) pour les procédures de repli).

---

### Scénario 2 : Perte de la base de données

**Symptômes :** Le backend démarre mais plante immédiatement, messages d'erreur "database corrupted" ou "no such table", données de sessions disparues.

**RTO cible : 30 minutes | RPO : jusqu'à 24h (dernière sauvegarde)**

> **Attention :** Ce scénario implique une perte de données. L'objectif est de minimiser cette perte et de rétablir le service le plus rapidement possible. **Arrêter le backend avant toute opération sur la base de données.**

#### Procédure de reprise

**Étape 1 — Arrêter le backend immédiatement**
```bash
# IMPORTANT : arrêter avant toute manipulation de la base
docker-compose stop backend

# Vérification : aucun processus ne doit accéder à la BDD
docker-compose ps
```

**Étape 2 — Sauvegarder la base corrompue (pour investigation ultérieure)**
```bash
# Déploiement Docker (volume db_data)
docker run --rm \
  -v db_data:/data \
  -v $(pwd)/backup_urgence:/backup \
  alpine cp /data/cement_counter.db /backup/cement_counter_CORROMPU_$(date +%Y%m%d_%H%M).db

# Déploiement local
cp ./data/cement_counter.db ./data/cement_counter_CORROMPU_$(date +%Y%m%d_%H%M).db
```

**Étape 3 — Localiser la dernière sauvegarde valide**
```bash
# Lister les sauvegardes disponibles (du plus récent au plus ancien)
ls -lt /backup/cement_counter_*.bak

# Vérifier que la sauvegarde n'est pas vide
ls -lh /backup/cement_counter_2026-03-26.bak
# Taille attendue : plusieurs dizaines à centaines de MB pour un usage normal
```

**Étape 4 — Restaurer la sauvegarde**
```bash
# Déploiement Docker (volume db_data)
docker run --rm \
  -v db_data:/data \
  -v /backup:/backup \
  alpine sh -c "cp /backup/cement_counter_2026-03-26.bak /data/cement_counter.db && ls -lh /data/"

# Déploiement local
cp /backup/cement_counter_2026-03-26.bak ./data/cement_counter.db

# Vérifier que le fichier est en place
ls -lh ./data/cement_counter.db
```

**Étape 5 — Vérifier l'intégrité de la base restaurée**
```bash
# Vérification SQLite (déploiement local)
sqlite3 ./data/cement_counter.db "PRAGMA integrity_check;"
# Réponse attendue : "ok"

sqlite3 ./data/cement_counter.db "SELECT COUNT(*) FROM sessions;"
# Doit retourner un nombre cohérent avec l'historique connu
```

**Étape 6 — Redémarrer le backend**
```bash
docker-compose start backend
sleep 15
curl http://localhost:8000/api/health
```

**Étape 7 — Documenter la perte de données**
Consigner dans le registre d'incidents :
- Date et heure de la panne
- Cause probable (si identifiable)
- Plage de données perdues (ex. "Sessions du 26/03 16h00 au 27/03 09h00")
- Nombre estimé de sacs non comptés
- Actions correctives prises

---

### Scénario 3 : Défaillance de la caméra

**Symptômes :** Le flux vidéo s'arrête, l'interface affiche "Caméra non disponible", le comptage tombe à zéro mais le backend est accessible.

**RTO cible : 15 minutes | RPO : 0 (pas de perte de données)**

#### Arbre de décision

```
Flux caméra absent
        |
        v
  [Voyants caméra ?]
        |
   +----+----+
   |         |
Allumés    Éteints
   |         |
   |    [Vérifier alimentation]
   |         |
   |    +----+----+
   |    |         |
   |  OK        KO
   |    |         |
   |    |    Câble/Fusible
   |  [Câble USB/IP OK ?]
   |         |
   |    +----+----+
   |    |         |
   |   OK        KO
   |    |         |
   |  Rebouter  Remplacer câble
   |  la caméra
   |
  [Changer caméra de rechange]
```

#### Procédure de reprise

**Étape 1 — Vérifier les éléments physiques**
- [ ] La caméra est-elle alimentée ? (voyant LED allumé)
- [ ] Le câble USB ou Ethernet est-il branché des deux côtés ?
- [ ] Le câble n'est-il pas endommagé (plié, coupé) ?
- [ ] L'objectif est-il propre et non obturé ?

**Étape 2 — Vérifier la détection par le système**
```bash
# Vérifier le statut de la caméra via l'API
curl http://localhost:8000/api/camera/status

# Consulter les logs récents
curl http://localhost:8000/api/diagnostics/logs | \
  python3 -c "import sys,json; logs=json.load(sys.stdin); [print(l) for l in logs[-20:]]"
```

**Étape 3 — Rebrancher ou rebooter la caméra**
- Débrancher physiquement le câble USB de la caméra, attendre 10 secondes, rebrancher.
- Pour les caméras IP : redémarrer via l'interface web de la caméra.

**Étape 4 — Redémarrer le service vision**
```bash
# Redémarrer uniquement le service qui gère la caméra
docker-compose restart backend
# (le backend recharge le flux vidéo au démarrage)
```

**Étape 5 — Remplacer par la caméra de rechange (si toujours HS)**
- Débrancher la caméra défaillante
- Connecter la caméra de rechange (même modèle, même port)
- Vérifier que la résolution et l'angle de vue sont identiques
- Redémarrer le backend pour réinitialiser le flux

**Étape 6 — Signaler le matériel défaillant**
La caméra défaillante doit être signalée pour réparation ou remplacement. Ne pas attendre que la caméra de rechange tombe aussi en panne — commander immédiatement une nouvelle unité de remplacement.

---

### Scénario 4 : Modèle YOLO corrompu ou manquant

**Symptômes :** Le backend démarre mais signale une erreur de chargement du modèle ("model not found", "failed to load weights"), aucune détection n'a lieu bien que la caméra soit active.

**RTO cible : 10 minutes | RPO : 0 (pas de perte de données)**

#### Procédure de reprise

**Étape 1 — Confirmer le problème**
```bash
# Vérifier la présence du fichier modèle
ls -lh ./models/best_V5.pt

# Vérifier l'intégrité (si on a conservé le hash MD5)
md5sum ./models/best_V5.pt
cat ./models/best_V5.pt.md5
# Les deux valeurs doivent être identiques
```

**Étape 2 — Localiser la copie de sauvegarde**
```bash
# Sur clé USB
ls /media/USB_BACKUP/models/

# Sur NAS ou dossier réseau
ls //NAS_SERVEUR/backups/models/

# Vérifier l'intégrité de la copie
md5sum /media/USB_BACKUP/models/best_V5.pt
```

**Étape 3 — Restaurer le modèle**
```bash
# Copier depuis la sauvegarde
cp /media/USB_BACKUP/models/best_V5.pt ./models/best_V5.pt

# Vérifier les permissions
chmod 644 ./models/best_V5.pt

# Confirmer la présence
ls -lh ./models/best_V5.pt
```

**Étape 4 — Redémarrer le backend**
```bash
docker-compose restart backend
sleep 15

# Vérifier que le modèle est bien chargé
curl http://localhost:8000/api/health
# Chercher dans la réponse : "model_loaded": true
```

**Étape 5 — Tester la détection**
Passer un objet devant la caméra (ou utiliser une vidéo de test) et vérifier que des détections apparaissent dans l'interface.

> **Si aucune copie de sauvegarde n'est disponible :** Contacter l'équipe technique qui a entraîné le modèle. Un réentraînement complet peut prendre plusieurs heures à plusieurs jours. En attendant, le système ne peut pas fonctionner en mode automatique.

---

### Scénario 5 : Serveur entier hors service (Disaster Recovery)

**Symptômes :** Le serveur hôte ne répond plus du tout (coupure électrique prolongée, panne matérielle grave, incident physique). Aucune récupération possible sur la machine existante.

**RTO cible : 4 heures | RPO : jusqu'à 24h (dernière sauvegarde)**

#### Vue d'ensemble du processus de restauration complète

```
SINISTRE CONFIRMÉ
       |
       v
  [1. Activer le comptage manuel]
       |
       v
  [2. Récupérer les sauvegardes]
    - Dernière .bak de la BDD
    - Fichier best_V5.pt
    - Fichier .env
       |
       v
  [3. Préparer le nouveau serveur]
    - Installer Docker + Docker Compose
    - Cloner ou copier le code source
       |
       v
  [4. Restaurer les données]
    - Copier la BDD sauvegardée
    - Copier le modèle YOLO
    - Reconfigurer .env
       |
       v
  [5. Démarrer le système]
    docker-compose up -d
       |
       v
  [6. Vérifier et valider]
    - Health check
    - Test de détection
    - Vérification des données
       |
       v
  [7. Basculer les opérations]
    - Informer les opérateurs
    - Arrêter le comptage manuel
    - Saisir les données manquantes
```

#### Procédure détaillée

**Étape 1 — Activer le comptage manuel**
Informer immédiatement les opérateurs de passer en mode manuel. Voir la fiche de repli disponible dans la salle de contrôle. Enregistrer l'heure de début du comptage manuel.

**Étape 2 — Récupérer les sauvegardes**
```bash
# Sur le support de sauvegarde externe
ls -lt /media/USB_BACKUP/  # ou NAS, cloud

# Fichiers nécessaires :
# - cement_counter_[DATE].bak  (base de données)
# - best_V5.pt                 (modèle YOLO)
# - env_[DATE].env             (configuration)
# - config_[DATE].json         (config exportée)
```

**Étape 3 — Préparer le nouveau serveur**
```bash
# Installer Docker (Ubuntu/Debian)
sudo apt-get update
sudo apt-get install -y docker.io docker-compose-plugin

# Cloner le dépôt du projet
git clone [URL_DU_DEPOT] /opt/cement-counter
cd /opt/cement-counter

# OU copier les fichiers depuis une archive
tar xzf cement-counter-source.tar.gz -C /opt/cement-counter
```

**Étape 4 — Restaurer les données**
```bash
# Créer les répertoires nécessaires
mkdir -p /opt/cement-counter/data
mkdir -p /opt/cement-counter/models

# Restaurer la base de données
cp /media/USB_BACKUP/cement_counter_2026-03-26.bak \
   /opt/cement-counter/data/cement_counter.db

# Restaurer le modèle YOLO
cp /media/USB_BACKUP/best_V5.pt \
   /opt/cement-counter/models/best_V5.pt

# Restaurer la configuration
cp /media/USB_BACKUP/env_2026-03-26.env \
   /opt/cement-counter/.env
```

**Étape 5 — Démarrer le système**
```bash
cd /opt/cement-counter
docker-compose up -d

# Suivre les logs de démarrage
docker-compose logs -f --tail=50
```

**Étape 6 — Vérifier le bon fonctionnement**
```bash
# Attendre 30 secondes pour le démarrage complet
sleep 30

# Vérifier tous les services
docker-compose ps
curl http://localhost:8000/api/health

# Vérifier que les données historiques sont présentes
curl http://localhost:8000/api/sessions | python3 -m json.tool
```

**Étape 7 — Saisir les données manquantes**
Les sacs comptés manuellement pendant l'interruption doivent être réconciliés avec le système. Créer une session manuelle dans l'interface d'administration pour la période couverte par le comptage manuel.

---

### Scénario 6 : Perte de session en cours

**Symptômes :** Une session active est perdue à cause d'un crash soudain. Les données de comptage de la session en cours ne sont pas sauvegardées.

**RTO cible : 5 minutes | RPO : session actuelle (partielle)**

#### Procédure de reprise

**Étape 1 — Redémarrer le backend**
```bash
docker-compose restart backend
sleep 15
curl http://localhost:8000/api/health
```

**Étape 2 — Vérifier la reprise de session**
Certains systèmes peuvent récupérer automatiquement la session interrompue. Vérifier dans l'interface si la session précédente est visible avec des données partielles.

**Étape 3 — Évaluer les données récupérées**
```bash
# Consulter la dernière session en base
curl http://localhost:8000/api/sessions | \
  python3 -c "import sys,json; sessions=json.load(sys.stdin); print(json.dumps(sessions[-1], indent=2))"
```

**Étape 4 — Reconcilier si nécessaire**
Si des données de la session sont définitivement perdues :
- Estimer le nombre de sacs manquants (ex. durée × cadence moyenne)
- Créer une correction manuelle dans le système
- Documenter la correction avec la raison et l'heure

**Étape 5 — Mesures préventives immédiates**
Pour éviter une répétition, vérifier :
- L'espace disque disponible (saturation peut causer des crashes)
- La stabilité de l'alimentation électrique
- Les ressources système (CPU/RAM)

```bash
# Vérifier l'espace disque
df -h

# Vérifier les ressources
docker stats --no-stream

# Archiver les anciennes sessions pour libérer de l'espace
curl -X POST http://localhost:8000/api/database/archive

# Optimiser la base de données
curl -X POST http://localhost:8000/api/database/optimize
```

---

## 6. Procédures de maintenance préventive

> **Philosophie :** La meilleure gestion de crise est celle qu'on n'a jamais à gérer. Une maintenance régulière réduit drastiquement la probabilité de pannes.

### 6.1 Routine quotidienne (5-10 minutes)

A réaliser chaque matin en début de poste :

```
CHECKLIST QUOTIDIENNE
[ ] 1. Vérifier le health check : curl http://[SERVEUR]:8000/api/health
         → Réponse attendue : {"status": "ok"}

[ ] 2. Vérifier les alertes actives dans l'interface
         → Taux de production > 15 sacs/min ?
         → Taux de rejet < 10% ?

[ ] 3. Vérifier que la caméra transmet (image visible dans l'interface)

[ ] 4. Vérifier l'espace disque disponible
         → Alerte si < 10 GB disponibles
         → Commande : df -h (Linux) ou vérification via interface

[ ] 5. Confirmer que la session du jour est démarrée correctement
```

### 6.2 Routine hebdomadaire (30 minutes)

A réaliser chaque lundi matin ou en début de semaine :

```
CHECKLIST HEBDOMADAIRE
[ ] 1. Effectuer une sauvegarde manuelle de la base de données
         curl -o backup/cement_$(date +%Y%m%d).bak \
              http://localhost:8000/api/database/backup

[ ] 2. Vérifier l'espace disque
         df -h
         du -sh ./backend/static/captures/
         → Si captures > 10 GB : archiver ou supprimer les plus anciennes

[ ] 3. Consulter les logs d'anomalies
         curl http://localhost:8000/api/diagnostics/logs
         → Chercher : erreurs répétées, timeouts, crashs

[ ] 4. Vérifier la cohérence des données
         → Comparer les totaux du système avec les fiches de production papier
         → Signaler toute divergence > 2%

[ ] 5. Tester la sauvegarde précédente (ouvrir le fichier .bak, vérifier la taille)

[ ] 6. Vérifier que les sauvegardes automatiques ont bien fonctionné
         ls -lt /backup/cement_counter_*.bak | head -7
```

### 6.3 Routine mensuelle (1-2 heures)

A réaliser le premier lundi de chaque mois :

```
CHECKLIST MENSUELLE
[ ] 1. Optimiser la base de données (récupère l'espace fragmenté)
         curl -X POST http://localhost:8000/api/database/optimize

[ ] 2. Archiver les sessions de plus de 3 mois
         curl -X POST http://localhost:8000/api/database/archive

[ ] 3. Analyser les logs complets du mois écoulé
         → Identifier les patterns de pannes récurrentes
         → Ajuster les seuils d'alerte si nécessaire

[ ] 4. Vérifier et nettoyer les captures d'images anciennes
         ls -lh ./backend/static/captures/ | tail -20
         # Supprimer captures de plus de 90 jours si non nécessaires

[ ] 5. Mettre à jour le tableau de bord des performances
         → CPU moyen (cible : 40-70%)
         → RAM moyenne (cible : 2-3 GB)
         → Taux de détection (comparer avec comptage physique)

[ ] 6. Vérifier que toutes les copies de sauvegarde du modèle YOLO sont intactes
         md5sum ./models/best_V5.pt
         md5sum /backup/models/best_V5.pt  # doit être identique

[ ] 7. Exporter la configuration système
         curl -o backup/config_$(date +%Y%m).json \
              http://localhost:8000/api/system/export-config
```

### 6.4 Routine trimestrielle (demi-journée)

A réaliser tous les 3 mois (janvier, avril, juillet, octobre) :

```
CHECKLIST TRIMESTRIELLE
[ ] 1. TEST DE REPRISE — simuler une panne et valider la procédure
         → Choisir un scénario (Scénario 1 ou 4 de préférence, moins risqués)
         → Suivre la procédure et mesurer le temps de reprise
         → Valider les critères d'acceptation (voir section 9)

[ ] 2. Réviser et mettre à jour ce document de continuité
         → Les procédures sont-elles toujours à jour ?
         → Les contacts sont-ils corrects ?
         → Y a-t-il de nouveaux risques à identifier ?

[ ] 3. Vérifier le matériel de rechange
         → La caméra de remplacement fonctionne-t-elle ?
         → Les câbles de rechange sont-ils disponibles ?

[ ] 4. Évaluer la performance du modèle YOLO
         → Comparer les comptages automatiques et manuels sur le trimestre
         → Si divergence > 3% : envisager un réentraînement

[ ] 5. Réviser les seuils d'alerte
         → Taux de production attendu (sacs/min)
         → Taux de rejet acceptable
         → Adapter si la production a changé

[ ] 6. Former les nouveaux membres de l'équipe
         → Présenter ce guide
         → Faire pratiquer les procédures simples (backup, health check)
```

---

## 7. Surveillance et alertes

### 7.1 Endpoint de santé (Health Check)

Le endpoint principal de surveillance est :

```
GET http://[SERVEUR]:8000/api/health
```

**Réponse en fonctionnement normal :**
```json
{
  "status": "ok",
  "timestamp": "2026-03-27T09:15:42Z",
  "version": "1.x.x",
  "database": "connected",
  "model_loaded": true,
  "camera": "active",
  "uptime_seconds": 86400
}
```

**Interprétation des réponses :**

| Réponse | Signification | Action |
|---------|---------------|--------|
| `{"status": "ok"}` | Tout fonctionne | Aucune |
| Timeout (pas de réponse) | Backend planté | Scénario 1 |
| `{"database": "error"}` | Problème BDD | Scénario 2 |
| `{"model_loaded": false}` | Modèle YOLO absent | Scénario 4 |
| `{"camera": "inactive"}` | Caméra HS | Scénario 3 |

### 7.2 Métriques clés à surveiller

| Métrique | Valeur normale | Seuil d'alerte | Seuil critique |
|----------|----------------|----------------|----------------|
| Taux de production | > 15 sacs/min | 15 sacs/min | 0 sacs/min |
| Taux de rejet | < 10% | 10% | > 20% |
| CPU | 40-70% | > 85% | > 95% |
| RAM | 2-3 GB | > 4 GB | > 6 GB |
| Espace disque libre | > 20 GB | < 10 GB | < 2 GB |
| Latence de détection (CPU) | 80-150 ms | > 300 ms | > 1000 ms |
| Latence de détection (GPU) | 15-25 ms | > 50 ms | > 200 ms |
| Croissance BDD | ~1 MB/min actif | > 5 MB/min | > 20 MB/min |

### 7.3 Estimation de la croissance de la base de données

La base de données grossit d'environ **50 MB par million de sacs détectés**.

**Exemple de calcul :**
- Production : 1 100 sacs/heure
- Shift de 8 heures : 8 800 sacs/jour
- Croissance quotidienne : 8 800 / 1 000 000 × 50 MB ≈ **0,44 MB/jour**
- Croissance annuelle : ≈ **160 MB/an**

Avec les sessions archivées régulièrement, la base ne devrait pas dépasser quelques GB.

**Alerte disque :** Si la croissance dépasse 5 MB/min, c'est un signe que quelque chose est anormal (boucle d'écriture, captures non compressées, etc.).

### 7.4 Mise en place d'un monitoring automatique

#### Script de health check automatisé (Linux, toutes les 5 minutes)

```bash
# Créer le script de monitoring
cat > /opt/scripts/check-cement.sh << 'EOF'
#!/bin/bash
HEALTH_URL="http://localhost:8000/api/health"
LOG_FILE="/var/log/cement-counter-health.log"
CONTACT_EMAIL="[EMAIL_RESPONSABLE]"

response=$(curl -s --max-time 10 "$HEALTH_URL")
status=$?

timestamp=$(date '+%Y-%m-%d %H:%M:%S')

if [ $status -ne 0 ] || [ -z "$response" ]; then
  echo "$timestamp ALERTE: Backend inaccessible" >> "$LOG_FILE"
  echo "ALERTE CEMENT COUNTER: Backend inaccessible à $timestamp" | \
    mail -s "ALERTE Production" "$CONTACT_EMAIL"
else
  echo "$timestamp OK: $response" >> "$LOG_FILE"
fi

# Vérifier l'espace disque
disk_usage=$(df /data | awk 'NR==2 {print $5}' | sed 's/%//')
if [ "$disk_usage" -gt 85 ]; then
  echo "$timestamp ALERTE: Espace disque à ${disk_usage}%" >> "$LOG_FILE"
fi
EOF

chmod +x /opt/scripts/check-cement.sh

# Planifier toutes les 5 minutes avec cron
echo "*/5 * * * * /opt/scripts/check-cement.sh" | crontab -
```

---

## 8. Plan de reprise après sinistre (DRP)

### 8.1 Définition du sinistre

Un **sinistre** (au sens de ce DRP) est un événement qui rend le système **totalement inaccessible** pendant plus de **30 minutes**, avec impact sur la production.

Exemples : panne serveur matérielle, incendie, inondation, attaque informatique, corruption totale du système d'exploitation.

### 8.2 Étapes ordonnées du DRP

```
PHASE 1 — DÉTECTION ET DÉCLARATION (0-15 min)
══════════════════════════════════════════════
  1. Confirmer que le sinistre est réel (pas une fausse alarme)
  2. Déclarer le sinistre au responsable technique
  3. Activer le comptage manuel sur la ligne de production
  4. Notifier la direction (si sinistre majeur)
  5. Ouvrir le registre d'incidents

PHASE 2 — ÉVALUATION (15-30 min)
══════════════════════════════════
  6. Évaluer l'étendue des dégâts (matériel, données, durée estimée)
  7. Identifier la dernière sauvegarde utilisable
  8. Estimer le RTO (temps avant reprise)
  9. Décider : réparation sur site ou restauration sur nouveau matériel

PHASE 3 — RESTAURATION (30 min - 4h)
══════════════════════════════════════
 10. Préparer le nouveau matériel (si nécessaire)
 11. Installer le système d'exploitation et Docker
 12. Récupérer les fichiers sources du projet
 13. Restaurer la base de données depuis la sauvegarde
 14. Restaurer le modèle YOLO
 15. Restaurer la configuration (.env)
 16. Démarrer le système : docker-compose up -d

PHASE 4 — VALIDATION (30 min)
══════════════════════════════
 17. Vérifier le health check
 18. Vérifier que les données historiques sont accessibles
 19. Tester la détection en direct
 20. Vérifier les seuils d'alerte et la configuration

PHASE 5 — REPRISE OPÉRATIONNELLE
══════════════════════════════════
 21. Informer les opérateurs : retour au mode automatique
 22. Réconcilier les données de comptage manuel
 23. Clôturer le registre d'incidents
 24. Planifier le post-mortem (dans les 48h)

PHASE 6 — POST-MORTEM (J+2 à J+7)
═══════════════════════════════════
 25. Analyser la cause racine de l'incident
 26. Identifier les mesures préventives
 27. Mettre à jour ce document si nécessaire
 28. Communiquer les enseignements à toute l'équipe
```

### 8.3 Ressources nécessaires pour le DRP

| Ressource | Localisation | Responsable |
|-----------|--------------|-------------|
| Sauvegardes DB (J-1) | [EMPLACEMENT À COMPLÉTER] | [NOM] |
| Clé USB avec modèle YOLO | [EMPLACEMENT À COMPLÉTER] | [NOM] |
| Accès au dépôt de code source | [URL À COMPLÉTER] | [NOM] |
| Matériel de rechange (serveur) | [EMPLACEMENT À COMPLÉTER] | [NOM] |
| Accès réseau et firewall | [PROCÉDURE À COMPLÉTER] | [NOM] |

---

## 9. Tests du plan de continuité

> **Pourquoi tester ?** Un plan non testé contient des erreurs que l'on ne découvrira qu'en situation de crise — exactement au moment où l'on ne peut pas se permettre de chercher la solution.

### 9.1 Types de tests

| Type | Description | Fréquence | Durée |
|------|-------------|-----------|-------|
| Test de bureau | Revue du plan par l'équipe, simulation orale | Mensuelle | 1h |
| Test de composant | Tester une procédure spécifique (ex. restauration BDD) | Trimestrielle | 2-4h |
| Test complet | Simuler un sinistre complet et restaurer tout le système | Semestrielle | 4-8h |

### 9.2 Scénarios de test recommandés

**Test 1 : Restart du backend (mensuel, faible risque)**
```
Objectif : Valider que le backend redémarre correctement
Procédure : Arrêter le backend manuellement, chronométrer le redémarrage
Critère d'acceptation : RTO < 5 minutes
Commandes :
  docker-compose stop backend
  # Attendre 30 secondes
  docker-compose start backend
  curl http://localhost:8000/api/health
```

**Test 2 : Restauration depuis sauvegarde (trimestriel)**
```
Objectif : Valider que la procédure de restauration de BDD fonctionne
Procédure :
  1. Faire une sauvegarde fresh
  2. Créer une base "test" vide
  3. Restaurer depuis la sauvegarde dans la base test
  4. Vérifier l'intégrité
Critère d'acceptation : RTO < 30 minutes, toutes les données présentes
ATTENTION : Effectuer sur un serveur de test, jamais en production
```

**Test 3 : Remplacement du modèle YOLO (trimestriel)**
```
Objectif : Valider la procédure de restauration du modèle
Procédure :
  1. Renommer best_V5.pt en best_V5.pt.bak
  2. Chronométrer le temps pour restaurer depuis la sauvegarde
  3. Vérifier que la détection reprend correctement
Critère d'acceptation : RTO < 10 minutes
```

**Test 4 : DRP complet (semestriel, sur environnement de test)**
```
Objectif : Valider la procédure de restauration complète
Environnement : Machine de test (jamais en production)
Procédure : Suivre intégralement le Scénario 5
Critère d'acceptation : RTO < 4 heures, RPO = dernière sauvegarde J-1
```

### 9.3 Fiche de résultat de test

```
FICHE DE TEST DE CONTINUITÉ
═══════════════════════════════════════════════════
Date du test : ___/___/______
Type de test : ___________________________________
Scénario testé : _________________________________
Testeur(s) : _____________________________________

Étapes réalisées (cocher) :
[ ] Étape 1 — _____________ : OK / KO (_____ min)
[ ] Étape 2 — _____________ : OK / KO (_____ min)
[ ] Étape 3 — _____________ : OK / KO (_____ min)
[ ] ...

Temps total de reprise mesuré : _______ minutes
RTO cible : _______ minutes
Résultat : RÉUSSI / ÉCHOUÉ / PARTIELLEMENT RÉUSSI

Problèmes rencontrés :
_________________________________________________
_________________________________________________

Actions correctives identifiées :
_________________________________________________
_________________________________________________

Validé par : _____________________ Date : _______
═══════════════════════════════════════════════════
```

---

## 10. Contacts et escalade

> Compléter ce tableau avec les informations réelles. Vérifier et mettre à jour tous les trimestres.

### 10.1 Matrice de responsabilité

| Rôle | Nom | Téléphone | Email | Disponibilité |
|------|-----|-----------|-------|---------------|
| Opérateur principal (poste 1) | [À COMPLÉTER] | [À COMPLÉTER] | [À COMPLÉTER] | Horaires prod. |
| Opérateur principal (poste 2) | [À COMPLÉTER] | [À COMPLÉTER] | [À COMPLÉTER] | Horaires prod. |
| Responsable technique système | [À COMPLÉTER] | [À COMPLÉTER] | [À COMPLÉTER] | Astreinte |
| Responsable informatique | [À COMPLÉTER] | [À COMPLÉTER] | [À COMPLÉTER] | Heures bureau |
| Responsable production | [À COMPLÉTER] | [À COMPLÉTER] | [À COMPLÉTER] | Horaires prod. |
| Direction (sinistre majeur) | [À COMPLÉTER] | [À COMPLÉTER] | [À COMPLÉTER] | Urgences uniquement |
| Support fournisseur matériel | [À COMPLÉTER] | [À COMPLÉTER] | [À COMPLÉTER] | Heures bureau |

### 10.2 Procédure d'escalade

```
INCIDENT DÉTECTÉ
       |
       v
  [Niveau 1 : Opérateur]
  - Tente un redémarrage simple
  - Consulte ce guide (section 5)
  - Durée max : 15 minutes
       |
  Pas résolu après 15 min
       |
       v
  [Niveau 2 : Responsable Technique]
  - Diagnostic approfondi
  - Procédures complexes (BDD, YOLO, DRP)
  - Durée max : 1 heure
       |
  Pas résolu après 1 heure OU sinistre majeur
       |
       v
  [Niveau 3 : Responsable Informatique + Direction]
  - Décision de restauration complète
  - Activation du DRP
  - Communication externe si nécessaire
```

### 10.3 Contacts fournisseurs

| Service | Fournisseur | Contact | Contrat/Référence |
|---------|-------------|---------|-------------------|
| Matériel serveur | [À COMPLÉTER] | [À COMPLÉTER] | [À COMPLÉTER] |
| Caméra industrielle | [À COMPLÉTER] | [À COMPLÉTER] | [À COMPLÉTER] |
| Support réseau | [À COMPLÉTER] | [À COMPLÉTER] | [À COMPLÉTER] |

### 10.4 Registre d'incidents

Tout incident doit être consigné dans le registre d'incidents (papier ou numérique) avec :

| Champ | Description |
|-------|-------------|
| Date/Heure début | Moment de détection de l'incident |
| Date/Heure fin | Moment de reprise complète |
| Durée totale | RTO mesuré |
| Composant(s) affecté(s) | Quels composants sont tombés |
| Cause identifiée | Cause racine si connue |
| Données perdues | Nombre de sacs / sessions non enregistrées |
| Actions correctives | Mesures prises pour éviter la récurrence |
| Validé par | Signature du responsable |

---

## 11. Glossaire

| Terme | Définition |
|-------|------------|
| **API** | Application Programming Interface — interface permettant à deux systèmes de communiquer. Le backend expose une API que le frontend et les scripts de monitoring interrogent. |
| **Backend** | Service logiciel (FastAPI) qui traite les données, gère la base de données et expose les endpoints. C'est le "cerveau" du système. |
| **BDD / Base de données** | Fichier SQLite (`cement_counter.db`) qui stocke toutes les sessions, comptages et configurations. |
| **Docker Compose** | Outil qui orchestre le démarrage et la communication entre les différents conteneurs du système (backend, frontend). |
| **DRP** | Disaster Recovery Plan — plan de reprise après sinistre. Procédure de restauration complète du système sur un nouveau matériel. |
| **Frontend** | Interface web (React, servie par Nginx) que les opérateurs utilisent pour visualiser les comptages. |
| **Health Check** | Vérification automatique de l'état de santé d'un service via le endpoint `/api/health`. |
| **RPO** | Recovery Point Objective — perte de données maximale acceptable. Si le RPO est "24h", cela signifie qu'on accepte de perdre au maximum 24h de données. |
| **RTO** | Return to Operations — durée maximale acceptable avant reprise du service. Si le RTO est "30 min", le service doit être rétabli en moins de 30 minutes. |
| **SPOF** | Single Point of Failure — composant dont la panne entraîne l'arrêt complet du système, sans redondance. |
| **SQLite** | Moteur de base de données léger, stocké dans un seul fichier sur le disque. Simple à sauvegarder mais vulnérable si le fichier est corrompu. |
| **VACUUM** | Opération SQLite de réorganisation et compactage de la base de données. Équivalent à une défragmentation, réduit la taille du fichier et améliore les performances. |
| **Volume Docker** | Espace de stockage persistant géré par Docker (ici : `db_data`). Les données survivent au redémarrage ou à la recréation des conteneurs. |
| **YOLO** | You Only Look Once — algorithme de détection d'objets en temps réel. Le modèle `best_V5.pt` est l'IA entraînée spécifiquement pour reconnaître les sacs de ciment. |
| **YOLOv8** | Version 8 de l'algorithme YOLO, utilisée par ce système pour la détection des sacs sur le flux vidéo. |

---

## Annexe A — Résumé des commandes essentielles

```bash
# HEALTH CHECK
curl http://localhost:8000/api/health

# SAUVEGARDE MANUELLE
curl -o backup_$(date +%Y%m%d).bak http://localhost:8000/api/database/backup

# EXPORT CONFIG
curl -o config_$(date +%Y%m%d).json http://localhost:8000/api/system/export-config

# ARCHIVER LES ANCIENNES SESSIONS
curl -X POST http://localhost:8000/api/database/archive

# OPTIMISER LA BASE
curl -X POST http://localhost:8000/api/database/optimize

# REDÉMARRER LE BACKEND
docker-compose restart backend

# REDÉMARRER TOUT LE SYSTÈME
docker-compose down && docker-compose up -d

# VOIR LES LOGS EN TEMPS RÉEL
docker-compose logs -f backend

# VÉRIFIER L'ESPACE DISQUE
df -h

# VÉRIFIER LES RESSOURCES DES CONTENEURS
docker stats --no-stream

# INTÉGRITÉ DE LA BASE SQLITE
sqlite3 ./data/cement_counter.db "PRAGMA integrity_check;"
```

---

## Annexe B — Fiche de repli manuel

> Imprimer cette page et l'afficher dans la salle de contrôle.

```
╔══════════════════════════════════════════════════════════════╗
║         FICHE DE REPLI — COMPTAGE MANUEL D'URGENCE          ║
╠══════════════════════════════════════════════════════════════╣
║                                                              ║
║  QUAND UTILISER CETTE FICHE :                                ║
║  → Le système automatique est inaccessible                   ║
║  → En attente de l'intervention technique                    ║
║                                                              ║
║  PROCÉDURE :                                                 ║
║  1. Noter l'heure de début du comptage manuel               ║
║  2. Utiliser un compteur manuel ou une feuille de suivi     ║
║  3. Enregistrer par lots de 100 sacs                        ║
║  4. Transmettre les données au technicien pour saisie       ║
║     dans le système une fois rétabli                         ║
║                                                              ║
║  CONTACTER EN PRIORITÉ :                                     ║
║  Responsable technique : _____________________________      ║
║  Téléphone : ________________________________________       ║
║                                                              ║
║  Heure de début comptage manuel : ____:____                 ║
║  Heure de fin comptage manuel   : ____:____                 ║
║  Nombre de sacs comptés         : _______________           ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
```

---

*Document établi en mars 2026. Prochaine révision : juin 2026.*
*Ce document doit être accessible à toute l'équipe technique et opérationnelle.*

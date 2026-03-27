# Guide Opérateur — Compteur Automatique de Sacs de Ciment

**Version :** 1.0 — Mars 2026
**Destinataire :** Opérateur de ligne de production
**Prérequis :** Accès au réseau local de l'usine, identifiants fournis par l'administrateur

---

## Avant-propos

Ce guide a un seul objectif : vous rendre autonome sur le **Compteur Automatique de Sacs de Ciment** dès la première journée d'utilisation.

Le système surveille votre ligne de production en continu. Une caméra industrielle filme le convoyeur. Un moteur d'intelligence artificielle (YOLOv8) analyse chaque image en temps réel, détecte les sacs, vérifie leur conformité visuelle et incrémente les compteurs — à un rythme pouvant atteindre **1 100 sacs par heure**.

En tant qu'opérateur, votre rôle couvre trois grandes responsabilités :

1. **Piloter les sessions de production** — démarrer, surveiller, arrêter.
2. **Contrôler la qualité** — interpréter les scores de conformité, gérer les anomalies, répondre aux alertes.
3. **Produire les rapports** — exporter les données pour la traçabilité et l'amélioration continue.

Ce que vous ne faites pas : gérer les utilisateurs, modifier la configuration caméra ou modèle IA, accéder directement à la base de données. Ces actions appartiennent à l'administrateur système.

Après lecture de ce guide, vous serez capable de :
- Ouvrir une session de production et la clore proprement.
- Lire un flux vidéo avec superposition de détection.
- Interpréter un score qualité et résoudre une anomalie.
- Acquitter une alerte et savoir quand escalader.
- Générer un rapport journalier et l'exporter en PDF ou Excel.

---

## 1. Vue d'ensemble d'une journée type

Avant d'entrer dans le détail de chaque fonction, voici l'enchaînement logique d'une journée de travail.

```
  MATIN                      EN COURS DE PRODUCTION           FIN DE POSTE
  ──────                     ──────────────────────           ────────────
  [1] Connexion              [5] Surveillance flux vidéo      [8] Arrêt session
       │                          │                                │
  [2] Tableau de bord        [6] Lecture des KPIs             [9] Contrôle qualité
       │                          │                                │
  [3] Vérifier santé système [7] Acquitter les alertes       [10] Anomalies
       │                                                           │
  [4] Démarrer session                                       [11] Rapport + Export
```

Chaque étape numérotée correspond à une section de ce guide.

---

## 2. Connexion et tableau de bord

### 2.1 Se connecter

1. Ouvrez votre navigateur et accédez à l'adresse de l'application (exemple : `http://192.168.1.100:8000`).
2. Saisissez votre **nom d'utilisateur** et votre **mot de passe** fournis par l'administrateur.
3. Cliquez sur **Connexion**.

> ✅ Si l'administrateur vous a remis un mot de passe temporaire, changez-le immédiatement via `/profile` (voir section 11).

> ⚠️ Après plusieurs tentatives échouées, le compte peut être verrouillé. Contactez l'administrateur dans ce cas.

### 2.2 Le tableau de bord (`/`)

Le tableau de bord est votre point d'entrée chaque matin. Il concentre l'état général du système.

```
┌──────────────────────────────────────────────────────────┐
│  COMPTEUR AUTOMATIQUE — TABLEAU DE BORD                  │
├─────────────────┬────────────────────┬───────────────────┤
│  Sacs aujourd'hui│  Taux de conformité│  Moteur IA        │
│     12 480       │      97,3 %        │   ● EN LIGNE      │
├─────────────────┴────────────────────┴───────────────────┤
│  Session active : S-20260327-060000  │  Durée : 02:14:05 │
├──────────────────────────────────────────────────────────┤
│  [Alertes non lues : 2]  [Voir les alertes →]            │
└──────────────────────────────────────────────────────────┘
```

**Ce qu'il faut vérifier chaque matin :**

| Indicateur | État nominal | Action si anormal |
|---|---|---|
| Moteur IA | ● EN LIGNE (vert) | Contacter l'administrateur |
| Caméra | ● CONNECTÉE (vert) | Vérifier câble, contacter admin |
| Session active | Aucune (début de poste) | Vérifier si un collègue a oublié de clore |
| Alertes non lues | 0 | Traiter avant de démarrer (section 8) |

---

## 3. Navigation dans l'interface

Voici la liste complète des pages accessibles en tant qu'opérateur :

| Page | URL | Usage |
|---|---|---|
| Tableau de bord | `/` | Vue synthétique quotidienne |
| Flux vidéo en direct | `/monitoring/live` | Surveillance temps réel |
| Logs de détection | `/production/log` | Historique événement par événement |
| Gestion des sessions | `/production/sessions` | Démarrer, arrêter, consulter |
| Chronologie horaire | `/production/timeline` | Analyse heure par heure |
| Dashboard qualité | `/quality/dashboard` | Scores de conformité |
| Anomalies | `/quality/anomalies` | Gestion des écarts détectés |
| Alertes | `/alerts/management` | Alertes actives et historique |
| Rapports production | `/reports/production` | Statistiques par session |
| Export de données | `/reports/export` | CSV, Excel, PDF, JSON |
| Analytics OEE | `/analytics/performance` | Performance globale ligne |
| Santé système | `/maintenance/health` | Lecture seule — CPU, RAM, disque |
| Profil | `/profile` | Modifier son mot de passe |

---

## 4. Démarrer et gérer une session de production

### 4.1 Pourquoi les sessions existent

Une **session de production** est l'unité de base de la traçabilité. Elle regroupe tous les comptages, scores qualité et événements survenus entre le démarrage et l'arrêt de la ligne. Chaque session reçoit un identifiant unique.

**Format d'identifiant :** `S-YYYYMMDD-HHMMSS`

Exemple : `S-20260327-060000` correspond à une session démarrée le 27 mars 2026 à 06 h 00 min 00 s.

### 4.2 Démarrer une session

1. Accédez à `/production/sessions`.
2. Cliquez sur **"Démarrer une session"**.
3. Le système crée la session, attribue l'identifiant et active le moteur de comptage.
4. Confirmez que le statut passe à **"Active"** et notez l'identifiant affiché.

> ✅ Le moteur IA commence à détecter dès que la session est active. Les premiers comptages apparaissent en quelques secondes si des sacs passent devant la caméra.

> ⚠️ **Une seule session active à la fois.** Si une session est déjà en cours (démarrée par un collègue ou un test), le bouton reste grisé. Clôturez la session existante avant d'en ouvrir une nouvelle.

### 4.3 Surveiller une session en cours

Depuis `/production/sessions`, la ligne de la session active affiche :

| Champ | Description | Exemple |
|---|---|---|
| ID | Identifiant unique | S-20260327-060000 |
| Statut | active / terminée | active |
| Total compté | Sacs détectés depuis le démarrage | 4 832 |
| Rejets | Sacs non conformes | 131 |
| Durée | Temps écoulé | 04:23:11 |

### 4.4 Arrêter une session

1. Accédez à `/production/sessions`.
2. Localisez la session active.
3. Cliquez sur **"Arrêter la session"**.
4. Confirmez l'action dans la boîte de dialogue.
5. Le système enregistre les compteurs finaux et passe le statut à **"Terminée"**.

> ⚠️ **Ne fermez pas le navigateur pour "arrêter" une session.** La session continuerait de tourner en arrière-plan. Utilisez toujours le bouton d'arrêt.

> ⚠️ **Impossible de supprimer une session active.** Si vous avez besoin d'annuler une session démarrée par erreur, arrêtez-la d'abord, puis signalez-la à l'administrateur pour traitement.

### 4.5 Consulter les sessions passées

La liste complète des sessions (actives et terminées) est disponible sur `/production/sessions`. Cliquez sur l'identifiant d'une session pour afficher son détail complet.

---

## 5. Surveillance en temps réel

### 5.1 Le flux vidéo (`/monitoring/live`)

La page de surveillance diffuse le flux MJPEG de la caméra avec une **superposition graphique** générée par le moteur IA.

```
┌────────────────────────────────────────────────────────────────┐
│  FLUX EN DIRECT — Caméra 01                        ● ACTIF     │
│ ┌──────────────────────────────────────────────────────────┐   │
│ │                                                          │   │
│ │   ┌─────────────┐        ┌──────────────┐               │   │
│ │   │  ID: 0042   │        │  ID: 0043    │               │   │
│ │   │  ✓ CONFORME │        │  ✗ REJETÉ    │               │   │
│ │   │  score:0.91 │        │  score:0.58  │               │   │
│ │   └─────────────┘        └──────────────┘               │   │
│ │                                                          │   │
│ │   ══════════════════════[LIGNE VIRTUELLE]═══════════════ │   │
│ │                                                          │   │
│ └──────────────────────────────────────────────────────────┘   │
│  Compteur session : 4 832  │  Rejets : 131  │  Taux : 97,3 %   │
└────────────────────────────────────────────────────────────────┘
```

**Éléments de l'overlay :**

| Élément visuel | Signification |
|---|---|
| Rectangle vert | Sac détecté conforme |
| Rectangle rouge | Sac détecté non conforme (rejeté) |
| Numéro d'identification (ID) | Identifiant de suivi unique du sac dans la séquence vidéo |
| Score affiché | Score de qualité combiné (0 à 1) |
| Ligne horizontale en surbrillance | Ligne virtuelle de comptage — le sac est comptabilisé quand il la franchit |

### 5.2 Les événements WebSocket (COUNT_EVENT)

Le compteur en temps réel est alimenté par des messages WebSocket (`ws://host/ws`). Chaque fois qu'un sac franchit la ligne virtuelle, un événement `COUNT_EVENT` est émis. L'interface met à jour le compteur sans rechargement de page.

En pratique : si le compteur à l'écran n'augmente plus alors que des sacs passent à la caméra, c'est un signe d'alerte — reportez-vous à la section 12 (Procédures en cas de problème).

### 5.3 Les KPIs en temps réel

| KPI | Formule | Seuil d'alerte typique |
|---|---|---|
| Total session | Cumul des COUNT_EVENT | — |
| Taux de conformité | (Total − Rejets) / Total × 100 | < 95 % |
| Cadence (sacs/min) | Sacs comptés sur la dernière minute glissante | < 15 ou > 22 |

---

## 6. Comprendre les logs de détection (`/production/log`)

Les logs de détection sont la trace événementielle brute : chaque ligne correspond à un sac détecté.

**Exemple de log :**

```
[2026-03-27 08:14:32]  ID:0042  statut:conforme   det:0.93  logo:0.88  couleur:0.76  session:S-20260327-060000
[2026-03-27 08:14:34]  ID:0043  statut:rejete     det:0.71  logo:0.42  couleur:0.30  session:S-20260327-060000
```

**Signification des colonnes :**

| Colonne | Description | Seuil de conformité |
|---|---|---|
| `det` | Score de détection du sac (confiance IA) | ≥ 0,70 |
| `logo` | Score de reconnaissance du logo | ≥ 0,65 |
| `couleur` | Score de correspondance couleur | ≥ 0,25 |
| `statut` | `conforme` si les 3 seuils sont atteints, `rejete` sinon | — |

**Exemple de lecture :**

- ID:0042 — `det:0.93`, `logo:0.88`, `couleur:0.76` → tous les seuils dépassés → **conforme**.
- ID:0043 — `det:0.71`, `logo:0.42`, `couleur:0.30` → le score logo est en dessous de 0,65 → **rejeté**.

> ✅ Les logs sont filtrables par session, par statut (conforme/rejeté) et par plage horaire. Utilisez les filtres pour isoler rapidement les séquences problématiques.

> ⚠️ Les logs sont en lecture seule depuis cette page. Pour corriger un statut, allez dans `/quality/anomalies` (section 7).

---

## 7. Contrôle qualité et gestion des anomalies

### 7.1 Le dashboard qualité (`/quality/dashboard`)

Ce tableau de bord affiche les indicateurs de qualité agrégés de la session ou de la période sélectionnée :

- Distribution des scores (histogramme de `quality_score`)
- Taux de conformité par heure
- Top des causes de rejet (logo, couleur, détection)

Le **quality_score** est le score combiné : il synthétise les trois composantes (détection, logo, couleur) en une note unique entre 0 et 1. Un sac avec `quality_score ≥ 0,70` est généralement conforme, mais c'est le respect des **trois seuils individuels** qui détermine le statut final.

### 7.2 Gérer les anomalies (`/quality/anomalies`)

Une anomalie est un sac dont le statut mérite une vérification humaine. Le système peut en générer automatiquement (score limite, incohérence de comptage), ou vous pouvez en signaler manuellement.

**Actions disponibles sur une anomalie :**

| Action | Quand l'utiliser |
|---|---|
| **Valider** | Vous confirmez visuellement que le sac est conforme |
| **Rejeter** | Vous confirmez que le sac est non conforme |
| **Ignorer** | L'anomalie n'est pas pertinente (faux positif du système) |
| **Corriger** | Vous modifiez manuellement le statut détecté |
| **Ajout manuel** | Un sac conforme n'a pas été détecté — vous l'ajoutez |

**Procédure de résolution d'une anomalie :**

1. Accédez à `/quality/anomalies`.
2. La liste affiche les anomalies non résolues en haut.
3. Cliquez sur une anomalie pour voir le détail (image du sac, scores, timestamp).
4. Choisissez l'action appropriée parmi les cinq listées ci-dessus.
5. Ajoutez un commentaire si nécessaire (recommandé pour les actions "Corriger" et "Ajout manuel").
6. Cliquez sur **"Confirmer"**.

> ✅ Pour traiter plusieurs anomalies similaires d'un coup, utilisez la **résolution par lot** : cochez les cases correspondantes, puis cliquez sur **"Résoudre la sélection"**.

> ⚠️ Toute action sur une anomalie est tracée avec votre identifiant et l'heure. Ces traces sont visibles dans les rapports d'audit de l'administrateur.

---

## 8. Gestion des alertes (`/alerts/management`)

### 8.1 Comprendre les règles d'alerte

Le système surveille en permanence trois types de règles :

| Type de règle | Ce qui est surveillé | Exemple de déclenchement |
|---|---|---|
| `production_rate` | Cadence (sacs/min) | Cadence tombe sous 10 sacs/min pendant 2 min |
| `error_rate` | Taux de rejet (%) | Taux dépasse 8 % sur 5 min glissantes |
| `consistency` | Cohérence du flux de détection | Aucune détection pendant 30 s alors que la session est active |

### 8.2 Quand une alerte se déclenche

Une notification apparaît dans le panneau d'alertes (icône en haut à droite de l'interface). La page `/alerts/management` affiche l'alerte avec :

- Le type de règle
- L'horodatage
- La valeur mesurée vs la valeur seuil
- Le statut (non lue / lue / résolue)

**Procédure à suivre :**

```
Alerte reçue
     │
     ▼
Identifier le type (production_rate ? error_rate ? consistency ?)
     │
     ├── production_rate ──► Vérifier le convoyeur physiquement
     │                       Contacter le responsable de ligne si arrêt
     │
     ├── error_rate ──────► Inspecter les sacs visuellement
     │                       Vérifier l'alignement de la caméra
     │
     └── consistency ─────► Vérifier le flux vidéo (/monitoring/live)
                             Si flux figé → section 12 (procédures)
```

### 8.3 Acquitter une alerte

- **Marquer comme lue** (une alerte) : cliquez sur l'icône "Lu" en regard de l'alerte.
- **Tout marquer comme lu** : bouton "Tout marquer comme lu" en haut de la liste.

> ⚠️ Marquer une alerte comme lue **ne résout pas** le problème sous-jacent. C'est un accusé de réception visuel. Si le problème persiste, il déclenchera une nouvelle alerte.

### 8.4 Créer une alerte manuelle

Si vous observez un problème que le système n'a pas détecté (ex. : sacs déformés manuellement remis sur la ligne) :

1. Sur `/alerts/management`, cliquez sur **"Créer une alerte manuelle"**.
2. Sélectionnez le type, renseignez la description et la session concernée.
3. Validez. L'alerte sera visible par l'administrateur et dans les rapports.

---

## 9. Rapports et exports de données

### 9.1 Rapports de production (`/reports/production`)

Les rapports de production synthétisent les statistiques par session.

**Données disponibles par session :**

| Champ | Description | Exemple |
|---|---|---|
| ID session | Identifiant unique | S-20260327-060000 |
| Durée | Durée totale de la session | 08:12:34 |
| Total compté | Sacs détectés et franchissant la ligne | 8 947 |
| Rejets | Sacs non conformes | 214 |
| Taux de conformité | (Total − Rejets) / Total × 100 | 97,6 % |
| Cadence moyenne | Sacs par minute (moyenne session) | 18,2 |

**Pour afficher un rapport :**

1. Accédez à `/reports/production`.
2. Utilisez les filtres de date pour sélectionner la période souhaitée.
3. Le tableau se met à jour avec les sessions correspondantes.
4. Cliquez sur une session pour le détail complet.

### 9.2 Exporter les données (`/reports/export`)

**Formats disponibles :**

| Format | Extension | Usage recommandé |
|---|---|---|
| CSV | `.csv` | Import dans Excel, analyse personnalisée |
| Excel | `.xlsx` | Rapport formaté, graphiques intégrés |
| PDF | `.pdf` | Archivage, impression, transmission officielle |
| JSON | `.json` | Intégration avec d'autres systèmes |

**Procédure d'export :**

1. Accédez à `/reports/export`.
2. Sélectionnez la **plage de dates** (ex. : 01/03/2026 → 27/03/2026).
3. Choisissez le **format de sortie**.
4. Cliquez sur **"Exporter"**.
5. Le fichier est téléchargé dans votre dossier de téléchargements habituel.

> ✅ Pour le rapport de fin de mois, exportez en Excel sur la plage du mois entier. Le fichier contiendra un onglet par session et un onglet récapitulatif.

> ⚠️ Les exports peuvent prendre quelques secondes sur des plages longues (plusieurs semaines). Ne cliquez pas deux fois sur le bouton — cela doublerait le téléchargement.

---

## 10. Analyse des performances (`/analytics/performance` et `/production/timeline`)

### 10.1 La chronologie horaire (`/production/timeline`)

La timeline décompose la production heure par heure. Elle répond à la question : "À quelle heure a-t-on produit le plus, et avec quel taux de qualité ?"

```
  Sacs/h
  ┤
1200┤              ████
1100┤         ████ ████ ████
1000┤    ████ ████ ████ ████ ████
 900┤    ████ ████ ████ ████ ████ ████
    └────┬────┬────┬────┬────┬────┬────
        06h  07h  08h  09h  10h  11h  12h
```

Survolez une barre pour obtenir le détail : sacs comptés, rejetés, alertes déclenchées dans ce créneau.

### 10.2 Les analytics OEE (`/analytics/performance`)

L'OEE (**Overall Equipment Effectiveness** — Taux de Rendement Synthétique) mesure la performance globale de la ligne. Pour un opérateur, l'essentiel est de comprendre les trois composantes :

| Composante | Signification | Formule simplifiée |
|---|---|---|
| **Disponibilité** | La ligne tourne-t-elle quand elle devrait ? | Temps de production / Temps prévu |
| **Performance** | La cadence est-elle au niveau nominal ? | Cadence réelle / Cadence théorique |
| **Qualité** | Quel pourcentage de sacs est conforme ? | Sacs conformes / Sacs totaux |

**OEE = Disponibilité × Performance × Qualité**

Exemple concret : Disponibilité 98 % × Performance 94 % × Qualité 97,6 % = **OEE ≈ 89,8 %**

> ✅ Un OEE supérieur à 85 % est généralement considéré comme excellent en milieu industriel. Si l'OEE descend sous 75 %, examinez quelle composante est dégradée et signalez-le au responsable.

---

## 11. Profil et changement de mot de passe (`/profile`)

### 11.1 Accéder au profil

Cliquez sur votre nom d'utilisateur en haut à droite de l'interface, puis sur **"Profil"**, ou naviguez directement vers `/profile`.

### 11.2 Changer son mot de passe

1. Sur la page `/profile`, localisez la section **"Sécurité"**.
2. Saisissez votre **mot de passe actuel**.
3. Saisissez le **nouveau mot de passe** (2 fois pour confirmer).
4. Cliquez sur **"Enregistrer"**.

> ✅ Choisissez un mot de passe d'au moins 12 caractères, mêlant majuscules, minuscules, chiffres et symboles.

> ⚠️ Si vous oubliez votre mot de passe, vous ne pouvez pas le réinitialiser vous-même. Contactez l'administrateur.

---

## 12. Procédures en cas de problème

### 12.1 Le flux vidéo est figé ou absent

**Symptômes :** L'image sur `/monitoring/live` est fixe ou affiche "Connexion perdue".

**Étapes de diagnostic :**

1. Rechargez la page (F5). Si le flux revient : problème réseau temporaire.
2. Vérifiez le tableau de bord : le statut caméra est-il toujours vert ?
3. Si le statut caméra est rouge → contactez l'administrateur immédiatement.
4. Vérifiez si la session est toujours active (le moteur IA peut s'arrêter si la caméra se déconnecte).
5. En attendant le retour de la caméra, **ne démarrez pas de nouvelle session**.

### 12.2 Le compteur ne s'incrémente plus

**Symptômes :** Des sacs passent à la caméra mais le compteur reste bloqué.

**Étapes de diagnostic :**

1. Vérifiez que la session est bien **active** (statut sur `/production/sessions`).
2. Rechargez la page `/monitoring/live`.
3. Observez si les rectangles de détection apparaissent toujours sur le flux vidéo.
   - Si **oui mais compteur bloqué** → problème WebSocket. Rechargez la page complète.
   - Si **non** → le moteur IA ne détecte pas. Contactez l'administrateur.
4. Vérifiez `/maintenance/health` : CPU ou RAM en rouge → performance dégradée → contactez l'administrateur.

### 12.3 Le taux de rejet s'emballe (> 10 %)

**Symptômes :** Le taux de rejet dépasse 10 % sur une période courte. Une alerte `error_rate` s'est probablement déclenchée.

**Étapes de diagnostic :**

1. Consultez `/production/log` : quels scores sont en cause ? (logo ? couleur ? détection ?)
2. Observez le flux vidéo : les sacs semblent-ils physiquement différents ?
   - **Changement de lot** : un nouveau lot peut avoir une couleur ou impression légèrement différente. Signalez-le à l'administrateur pour ajustement du modèle.
   - **Problème d'éclairage** : la luminosité a-t-elle changé (fin de journée, passage nuageux) ? Signalez à l'administrateur.
   - **Problème de convoyeur** : les sacs arrivent de travers ? Alertez la maintenance physique.
3. Créez une alerte manuelle (section 8.4) pour laisser une trace dans le système.

### 12.4 Impossible de démarrer une session

**Symptômes :** Le bouton "Démarrer une session" est grisé ou renvoie une erreur.

**Causes possibles et solutions :**

| Cause | Solution |
|---|---|
| Une session est déjà active | Arrêtez la session active, puis redémarrez |
| Le moteur IA est hors ligne | Contactez l'administrateur |
| Problème de connexion réseau | Vérifiez votre connexion, rechargez la page |
| Erreur de permissions | Contactez l'administrateur (vérification de votre rôle) |

---

## 13. Lexique de l'interface

| Terme | Définition |
|---|---|
| **Session** | Période de production délimitée par un démarrage et un arrêt. Unité de base de traçabilité. |
| **COUNT_EVENT** | Message temps réel émis chaque fois qu'un sac franchit la ligne virtuelle. |
| **Ligne virtuelle** | Ligne horizontale affichée sur le flux vidéo, utilisée comme référence de comptage. |
| **quality_score** | Score synthétique de qualité d'un sac, combinant détection, logo et couleur. Entre 0 et 1. |
| **conforme** | Sac ayant passé les trois seuils de qualité (détection ≥ 0,70, logo ≥ 0,65, couleur ≥ 0,25). |
| **rejete** | Sac n'ayant pas atteint au moins un des trois seuils. |
| **Anomalie** | Événement de détection signalé pour vérification humaine. |
| **OEE** | Overall Equipment Effectiveness — indicateur global de performance industrielle (0–100 %). |
| **MJPEG** | Format de flux vidéo continu. Le navigateur l'affiche nativement sans plugin. |
| **WebSocket** | Canal de communication temps réel entre le serveur et le navigateur pour les mises à jour du compteur. |
| **Track ID** | Numéro d'identification attribué par le système de suivi IA à un sac pendant sa traversée du champ de la caméra. |
| **KPI** | Key Performance Indicator — indicateur clé de performance (cadence, taux de conformité, etc.). |

---

*Ce guide couvre les fonctions opérateur de la version 1.0 du Compteur Automatique de Sacs de Ciment.*
*Pour toute anomalie non couverte ici, contactez l'administrateur système.*

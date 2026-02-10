# Cement Bag Production Monitor - Dashboard

Interface d'administration professionnelle pour le suivi en temps réel de la production de sacs de ciment avec détection IA.

## 🎯 Caractéristiques

- **Tableau de bord en temps réel** : Affichage des métriques de production actualisées en direct
- **Graphiques analytiques** : Visualisation des intervalles entre sacs et tendances de débit
- **Heatmap d'activité** : Représentation visuelle de l'activité de production par plages de 5 secondes
- **Détection des interruptions** : Identification automatique des écarts de production anormaux
- **Design industriel moderne** : Interface sombre avec accents orange/cyan inspirée de systèmes de monitoring professionnels

## 📊 Métriques affichées

1. **Total Bags** : Nombre total de sacs comptés
2. **Production Rate** : Vitesse de production en sacs/minute
3. **Avg Interval** : Intervalle moyen entre les sacs en secondes
4. **Consistency** : Coefficient de variation (mesure de la régularité)
5. **Throughput Trend** : Comparaison des performances entre première et deuxième moitié
6. **Production Gaps** : Liste des interruptions détectées avec écarts par rapport à la moyenne

## 🚀 Installation

### Prérequis

- Node.js 22.13.0+
- pnpm 10.4.1+

### Étapes

```bash
cd dashboard
pnpm install
pnpm run dev
```

Le serveur de développement démarre sur `http://localhost:3000`

## 📁 Structure

```
dashboard/
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   └── Dashboard.tsx        # Page principale du tableau de bord
│   │   ├── components/
│   │   │   ├── StatCard.tsx         # Cartes de statistiques KPI
│   │   │   ├── ActivityHeatmap.tsx  # Heatmap d'activité
│   │   │   ├── ProductionGaps.tsx   # Détection des interruptions
│   │   │   └── Sidebar.tsx          # Navigation latérale
│   │   ├── hooks/
│   │   │   └── useProductionData.ts # Gestion des données de production
│   │   ├── index.css                # Styles globaux et animations
│   │   └── App.tsx                  # Routeur principal
│   ├── public/                      # Actifs statiques
│   └── index.html
├── package.json
├── DESIGN.md                        # Documentation du design
└── README.md                        # Ce fichier
```

## 🎨 Design

Le dashboard suit une philosophie de **Minimalisme Industriel** avec :

- **Palette de couleurs** : Noir profond (fond), gris foncé (cartes), orange ambre (accents), cyan bleu (données)
- **Typographie** : IBM Plex Sans pour le contenu, Space Mono Bold pour les chiffres
- **Animations** : Transitions fluides (fade-in, slide-up) pour une expérience polished
- **Responsive** : Adapté aux écrans de toutes tailles

Voir `DESIGN.md` pour plus de détails.

## 🔌 Intégration API

Actuellement, le dashboard utilise des données simulées. Pour intégrer vos données réelles :

1. Modifiez `useProductionData.ts` pour appeler votre API backend
2. Remplacez les générateurs de données simulées par des appels `fetch` ou `axios`
3. Mettez à jour les types TypeScript selon votre schéma de données

Exemple :

```typescript
// Dans useProductionData.ts
const fetchProductionData = async () => {
  const response = await fetch('/api/production/metrics');
  const data = await response.json();
  setMetrics(data);
};
```

## 📦 Dépendances principales

- **React 19** : Framework UI
- **Tailwind CSS 4** : Styling utilitaire
- **Recharts** : Visualisation de graphiques
- **Lucide React** : Icônes
- **Wouter** : Routeur client-side

## 🛠️ Scripts disponibles

```bash
pnpm run dev      # Démarrer le serveur de développement
pnpm run build    # Construire pour la production
pnpm run preview  # Prévisualiser la build de production
pnpm run check    # Vérifier les types TypeScript
pnpm run format   # Formater le code avec Prettier
```

## 🔐 Sécurité

- Les données sont actuellement simulées (mode développement)
- Pour la production, implémentez l'authentification OAuth/JWT
- Validez toutes les données reçues du backend
- Utilisez HTTPS pour les communications API

## 📝 Licence

Même licence que le projet principal compteur-ciment

## 👥 Contribution

Pour contribuer :

1. Créez une branche feature (`git checkout -b feature/ma-feature`)
2. Committez vos modifications (`git commit -m 'Ajout de ma-feature'`)
3. Poussez vers la branche (`git push origin feature/ma-feature`)
4. Ouvrez une Pull Request

## 📞 Support

Pour les problèmes ou suggestions, créez une issue dans le dépôt principal.

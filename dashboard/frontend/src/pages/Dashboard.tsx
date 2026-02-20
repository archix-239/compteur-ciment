import { Package, Zap, Clock, TrendingUp } from 'lucide-react';
import { StatCard } from '@/components/StatCard';
import { ProductionGaps } from '@/components/ProductionGaps';
import { useProductionData } from '@/hooks/useProductionData';
import { PageHeader } from '@/components/PageHeader';
import { Button } from '@/components/ui/button';
import { RefreshCw, Download } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

/**
 * Dashboard Page
 * Main production monitoring interface — all data from /api/dashboard/summary
 * Design: Minimalisme Industriel - Dark theme with orange accents
 */

export default function Dashboard() {
  const { metrics, intervalData, heatmapData, productionGaps, refresh } = useProductionData();

  const {
    totalBags, productionRate, avgInterval, consistency, stddev,
    firstHalfInterval, secondHalfInterval, slowdownPercent,
  } = metrics;

  // Durée estimée du flux = total sacs × intervalle moyen
  const fluxDuration = avgInterval > 0 ? (totalBags * avgInterval).toFixed(1) : '0.0';

  // Tendance du débit basée sur la comparaison 1re/2e moitié
  const productionTrend = slowdownPercent !== 0
    ? { value: Math.abs(slowdownPercent), direction: slowdownPercent < 0 ? 'up' : 'down' as 'up' | 'down' }
    : undefined;

  return (
    <div className="min-h-screen bg-background p-6 space-y-8">
      <PageHeader
        title="Tableau de Bord de Production"
        description="Analyse en temps réel de la ligne de convoyeur • Moteur YOLOv11"
      >
        <div className="text-right mr-4 hidden md:block">
          <div className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest mb-1">Status Actuel</div>
          <div className="text-xs text-green-400 font-medium flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
            {totalBags} sacs détectés — {fluxDuration}s de flux
          </div>
        </div>
        <Button variant="outline" className="border-zinc-800 text-white gap-2" onClick={refresh}>
          <RefreshCw className="w-4 h-4" /> Actualiser
        </Button>
        <Button className="bg-orange-600 hover:bg-orange-700 text-white gap-2">
          <Download className="w-4 h-4" /> Rapport Flash
        </Button>
      </PageHeader>

      <main className="max-w-full">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Total Sacs"
            value={totalBags}
            unit="sacs comptés"
            description="Nombre total de sacs valides détectés par l'IA sur la session actuelle."
            icon={<Package className="w-5 h-5" />}
            highlighted
          />
          <StatCard
            title="Taux de Production"
            value={productionRate.toFixed(1)}
            unit="sacs / minute"
            description="Vitesse moyenne de passage des sacs sur le convoyeur (moyenne glissante 5 min)."
            icon={<Zap className="w-5 h-5" />}
            trend={productionTrend}
          />
          <StatCard
            title="Intervalle Moyen"
            value={avgInterval.toFixed(2)}
            unit="secondes entre sacs"
            description="Temps moyen écoulé entre deux détections successives."
            icon={<Clock className="w-5 h-5" />}
          />
          <StatCard
            title="Consistance"
            value={`${consistency}%`}
            unit="coefficient de variation"
            description="Indice de régularité du flux. Plus il est proche de 100%, plus le flux est stable."
            icon={<TrendingUp className="w-5 h-5" />}
          />
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Interval Between Bags Chart */}
          <div className="bg-card border border-border rounded-lg p-6">
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-6">
              Intervalle entre Sacs (secondes)
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={intervalData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis dataKey="time" stroke="rgba(255,255,255,0.5)" />
                <YAxis stroke="rgba(255,255,255,0.5)" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(20, 20, 20, 0.9)',
                    border: '1px solid rgba(255,255,255,0.2)',
                    borderRadius: '0.5rem',
                  }}
                />
                <Bar dataKey="avgInterval" fill="#fbbf24" radius={[4, 4, 0, 0]} name="Moyenne" />
                <Bar dataKey="minInterval" fill="#60a5fa" radius={[4, 4, 0, 0]} name="Min" />
                <Bar dataKey="maxInterval" fill="#f87171" radius={[4, 4, 0, 0]} name="Max" />
              </BarChart>
            </ResponsiveContainer>
            <div className="text-xs text-muted-foreground mt-4 text-center">
              {avgInterval > 0
                ? `moyenne ${avgInterval.toFixed(2)}s — affichage de la variation min/max`
                : 'Aucune donnée — démarrez une session pour voir les intervalles'}
            </div>
          </div>

          {/* Activity Heatmap */}
          <div className="bg-card border border-border rounded-lg p-6">
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-6">
              Heatmap d'Activité (blocs de 5s)
            </h3>
            <div className="space-y-4">
              <div>
                <div className="text-xs text-muted-foreground mb-3">Sacs</div>
                <div className="flex gap-2 flex-wrap">
                  {heatmapData.length === 0 ? (
                    <div className="text-xs text-muted-foreground py-4">
                      Aucune donnée — démarrez une session
                    </div>
                  ) : (
                    heatmapData.map((bucket, idx) => (
                      <div
                        key={idx}
                        className={`
                          w-10 h-10 rounded transition-all duration-200
                          ${
                            bucket.activity.level === 'none'
                              ? 'bg-gray-700'
                              : bucket.activity.level === 'low'
                                ? 'bg-yellow-600'
                                : bucket.activity.level === 'medium'
                                  ? 'bg-yellow-500'
                                  : 'bg-yellow-400'
                          }
                          hover:ring-2 hover:ring-orange-500 cursor-pointer
                          flex items-center justify-center font-mono text-sm font-bold
                        `}
                        title={`${bucket.time}: ${bucket.activity.count} sacs`}
                      >
                        {bucket.activity.count > 0 && (
                          <span className="text-gray-900">{bucket.activity.count}</span>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="flex gap-4 mt-6 pt-4 border-t border-border">
                <div className="text-xs text-muted-foreground">Activité:</div>
                <div className="flex gap-3 flex-wrap">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-gray-700" />
                    <span className="text-xs text-muted-foreground">Aucune</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-yellow-600" />
                    <span className="text-xs text-muted-foreground">Faible</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-yellow-500" />
                    <span className="text-xs text-muted-foreground">Moyenne</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-yellow-400" />
                    <span className="text-xs text-muted-foreground">Élevée</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Production Gaps */}
          <ProductionGaps gaps={productionGaps} />

          {/* Throughput Trend */}
          <div className="bg-card border border-border rounded-lg p-6">
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-6">
              Tendance du Débit
            </h3>

            <div className="space-y-8">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs text-muted-foreground">PREMIÈRE MOITIÉ</div>
                  <div className="text-4xl font-bold font-mono text-foreground mt-2">
                    {firstHalfInterval.toFixed(2)}
                    <span className="text-lg text-muted-foreground ml-2">s</span>
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">intervalle moyen</div>
                </div>
                <div className="text-2xl text-muted-foreground">→</div>
                <div>
                  <div className="text-xs text-muted-foreground">DEUXIÈME MOITIÉ</div>
                  <div className="text-4xl font-bold font-mono text-foreground mt-2">
                    {secondHalfInterval.toFixed(2)}
                    <span className="text-lg text-muted-foreground ml-2">s</span>
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">intervalle moyen</div>
                </div>
              </div>

              <div className="pt-6 border-t border-border">
                {slowdownPercent === 0 ? (
                  <div className="text-zinc-400 font-medium text-sm">
                    Pas encore assez de données pour comparer les deux moitiés
                  </div>
                ) : slowdownPercent > 0 ? (
                  <div className="text-red-400 font-medium text-sm">
                    La production est {slowdownPercent}% plus lente en deuxième moitié
                  </div>
                ) : (
                  <div className="text-green-400 font-medium text-sm">
                    La production est {Math.abs(slowdownPercent)}% plus rapide en deuxième moitié
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <div className="text-xs text-muted-foreground">Score de Consistance</div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-yellow-500 to-yellow-400 h-2 rounded-full"
                    style={{ width: `${consistency}%` }}
                  />
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  {stddev > 0
                    ? `σ = ${stddev}s — ${consistency}% de consistance`
                    : `${consistency}% de consistance`}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

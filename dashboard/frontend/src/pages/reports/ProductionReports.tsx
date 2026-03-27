import { useState, useEffect, useCallback } from 'react';
import {
  FileText,
  Download,
  TrendingUp,
  TrendingDown,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
  Calendar as CalendarIcon,
  Clock,
  Zap,
  Activity,
  HelpCircle,
  RefreshCw,
  Minus,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as ReTooltip,
  Cell,
} from 'recharts';
import { API_URL, fetchApi } from '@/lib/api';

// ─── Types ────────────────────────────────────────────────────────────────────
interface TrendBucket {
  day: string;
  current: number;
  previous: number;
}

interface OEESlice {
  name: string;
  value: number;
  color: string;
}

interface PeakBucket {
  day: string;
  current: number;
}

interface ReportData {
  totalBags: number;
  totalBagsPrev: number;
  bagsDeltaPct: number;
  avgInterval: number;
  avgIntervalPrev: number;
  intervalDeltaPct: number;
  detectionRate: number;
  detectionRatePrev: number;
  detectionRateDelta: number;
  sessionHours: number;
  availability: number;
  oee: number;
  performance: number;
  stopTimeFormatted: string;
  trendData: TrendBucket[];
  oeeData: OEESlice[];
  consistency: number;
  peakBucket: PeakBucket | null;
  period: string;
  periodHours: number;
}

// ─── Helper : ? tooltip icon ──────────────────────────────────────────────────
function InfoTip({ content }: { content: string }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <HelpCircle className="w-3.5 h-3.5 text-zinc-600 hover:text-zinc-400 cursor-help transition-colors flex-shrink-0" />
      </TooltipTrigger>
      <TooltipContent className="max-w-[220px] text-center leading-snug bg-zinc-900 text-zinc-200 border border-zinc-700">
        {content}
      </TooltipContent>
    </Tooltip>
  );
}

// ─── Delta display helpers ────────────────────────────────────────────────────
function DeltaRow({
  value,
  suffix = '',
  invertColors = false,
}: {
  value: number;
  suffix?: string;
  invertColors?: boolean;
}) {
  const positive = invertColors ? value <= 0 : value >= 0;
  const cls = positive ? 'text-green-400' : 'text-red-400';
  const Icon =
    value > 0 ? ArrowUpRight : value < 0 ? ArrowDownRight : Minus;

  return (
    <div className={`flex items-center gap-1 text-xs ${cls}`}>
      <Icon className="w-3 h-3" />
      {value > 0 ? '+' : ''}{value}{suffix}
      <span className="text-zinc-500 ml-1">vs période prêc.</span>
    </div>
  );
}

// ─── Period label ─────────────────────────────────────────────────────────────
const PERIOD_LABEL: Record<string, string> = {
  day:   "Aujourd'hui",
  week:  'Cette Semaine',
  month: 'Ce Mois',
};

// ─── Main component ───────────────────────────────────────────────────────────
export default function ProductionReports() {
  const [period, setPeriod]   = useState<'day' | 'week' | 'month'>('week');
  const [data, setData]       = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async (p: string) => {
    setLoading(true);
    try {
      const json: ReportData = await fetchApi(`/api/reports/production?period=${p}`);
      setData(json);
    } catch (e) {
      console.error('Report fetch error:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData(period);
  }, [period, loadData]);

  // CSV download — browser follows redirect to streaming response
  const handleCsvExport = () => {
    window.open(`${API_URL}/api/reports/export/csv?period=${period}`, '_blank');
  };

  const d = data;

  return (
    <div className="p-6 space-y-6">
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Rapports de Production</h1>
          <p className="text-muted-foreground">Générez et analysez les données de production périodiques</p>
        </div>
        <div className="flex gap-3">
          <Select
            value={period}
            onValueChange={(v) => setPeriod(v as 'day' | 'week' | 'month')}
          >
            <SelectTrigger className="w-[180px] bg-zinc-900 border-zinc-800 text-white">
              <CalendarIcon className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Choisir la période" />
            </SelectTrigger>
            <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
              <SelectItem value="day">Aujourd'hui</SelectItem>
              <SelectItem value="week">Cette Semaine</SelectItem>
              <SelectItem value="month">Ce Mois</SelectItem>
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            className="border-zinc-800 text-white gap-2"
            onClick={() => loadData(period)}
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Actualiser
          </Button>

          <Button
            variant="outline"
            className="gap-2 border-zinc-800 text-white hover:bg-zinc-900"
            onClick={handleCsvExport}
          >
            <Download className="w-4 h-4" /> Export CSV
          </Button>

          <Button className="gap-2 bg-orange-600 hover:bg-orange-700 text-white">
            <FileText className="w-4 h-4" /> Rapport Complet
          </Button>
        </div>
      </div>

      {/* ── KPI Cards ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">

        {/* Production Totale */}
        <Card className="p-4 space-y-2 bg-card/50 border-zinc-800">
          <div className="flex items-center gap-1.5">
            <div className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
              Production Totale
            </div>
            <InfoTip content="Nombre total de sacs conformes comptés par le système IA sur la période sélectionnée." />
          </div>
          <div className="text-2xl font-bold font-mono text-white">
            {loading ? '—' : d?.totalBags.toLocaleString('fr-FR')}{' '}
            <span className="text-xs font-normal text-zinc-500">sacs</span>
          </div>
          {d && !loading && (
            <DeltaRow value={d.bagsDeltaPct} suffix="%" />
          )}
        </Card>

        {/* Débit Moyen */}
        <Card className="p-4 space-y-2 bg-card/50 border-zinc-800">
          <div className="flex items-center gap-1.5">
            <div className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
              Débit Moyen
            </div>
            <InfoTip content="Intervalle moyen entre deux sacs consécutifs (en secondes, pauses > 120 s exclues). Une valeur faible indique un débit élevé." />
          </div>
          <div className="text-2xl font-bold font-mono text-white">
            {loading ? '—' : d?.avgInterval.toFixed(2)}{' '}
            <span className="text-xs font-normal text-zinc-500">s/sac</span>
          </div>
          {d && !loading && (
            /* Higher interval = slower = bad → invertColors */
            <DeltaRow value={d.intervalDeltaPct} suffix="%" invertColors />
          )}
        </Card>

        {/* Rendement Détection */}
        <Card className="p-4 space-y-2 bg-card/50 border-zinc-800">
          <div className="flex items-center gap-1.5">
            <div className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
              Rendement Détection
            </div>
            <InfoTip content="Pourcentage de sacs conformes sur le total inspecté. Formule : conformes ÷ (conformes + rejetés) × 100." />
          </div>
          <div className="text-2xl font-bold font-mono text-white">
            {loading ? '—' : `${d?.detectionRate ?? 0}%`}
          </div>
          {d && !loading && (
            <div className="flex items-center gap-1 text-xs text-green-400">
              <TrendingUp className="w-3 h-3" />
              {d.detectionRateDelta >= 0 ? '+' : ''}{d.detectionRateDelta}%
              <span className="text-zinc-500 ml-1">vs période prêc.</span>
            </div>
          )}
        </Card>

        {/* Temps de Fonctionnement */}
        <Card className="p-4 space-y-2 bg-card/50 border-zinc-800">
          <div className="flex items-center gap-1.5">
            <div className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
              Fonctionnement
            </div>
            <InfoTip content="Durée cumulée des sessions de production actives sur la période sélectionnée. Disponibilité = durée session ÷ fenêtre totale." />
          </div>
          <div className="text-2xl font-bold font-mono text-white">
            {loading ? '—' : d?.sessionHours}{' '}
            <span className="text-xs font-normal text-zinc-500">heures</span>
          </div>
          {d && !loading && (
            <div className="flex items-center gap-1 text-zinc-400 text-xs">
              <Clock className="w-3 h-3" /> {d.availability}% de disponibilité
            </div>
          )}
        </Card>
      </div>

      {/* ── Charts row ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Trend chart */}
        <Card className="lg:col-span-2 p-6 bg-card/50 border-zinc-800 space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 font-semibold text-white">
              <Activity className="w-5 h-5 text-orange-500" />
              <span>Comparaison de Production — {PERIOD_LABEL[period]}</span>
              <InfoTip content="Sacs conformes par heure (jour), par jour (semaine) ou par semaine (mois). La courbe orange est la période actuelle, la courbe grise est la période précédente identique." />
            </div>
            <div className="flex gap-4 text-[10px] text-zinc-500 font-bold uppercase">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-0.5 bg-orange-500 rounded-full" />Actuelle
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-0.5 border-t-2 border-dashed border-zinc-500" />Précédente
              </div>
            </div>
          </div>

          {loading ? (
            <div className="h-[300px] flex items-center justify-center text-zinc-600">
              <RefreshCw className="w-6 h-6 animate-spin" />
            </div>
          ) : (d?.trendData ?? []).every(b => b.current === 0 && b.previous === 0) ? (
            <div className="h-[300px] flex flex-col items-center justify-center text-zinc-600 gap-2">
              <BarChart3 className="w-8 h-8" />
              <span className="text-xs uppercase tracking-widest">Aucune donnée sur la période</span>
            </div>
          ) : (
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={d?.trendData ?? []}>
                  <defs>
                    <linearGradient id="colorCurrent" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#f97316" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#f97316" stopOpacity={0}   />
                    </linearGradient>
                    <linearGradient id="colorPrev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#71717a" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#71717a" stopOpacity={0}    />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="day" stroke="rgba(255,255,255,0.4)" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="rgba(255,255,255,0.4)" fontSize={11} tickLine={false} axisLine={false} />
                  <ReTooltip
                    contentStyle={{ backgroundColor: '#09090b', border: '1px solid #27272a', borderRadius: '8px' }}
                    itemStyle={{ fontSize: '12px' }}
                    labelStyle={{ color: 'white', marginBottom: '4px' }}
                  />
                  <Area
                    type="monotone" dataKey="previous" name="Période Précédente"
                    stroke="#71717a" strokeDasharray="5 5" fillOpacity={1} fill="url(#colorPrev)"
                  />
                  <Area
                    type="monotone" dataKey="current" name="Période Actuelle"
                    stroke="#f97316" strokeWidth={2} fillOpacity={1} fill="url(#colorCurrent)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>

        {/* OEE breakdown */}
        <Card className="p-6 bg-card/50 border-zinc-800 space-y-6">
          <div className="font-semibold flex items-center gap-2 text-white">
            <Zap className="w-5 h-5 text-orange-500" />
            <span>OEE / Efficacité</span>
            <InfoTip content="Décomposition de l'OEE en trois piliers : Disponibilité (temps session / fenêtre), Performance (cadence réelle / 1 100 sacs/h) et Qualité (rendement de détection)." />
          </div>

          {loading ? (
            <div className="h-[200px] flex items-center justify-center text-zinc-600">
              <RefreshCw className="w-6 h-6 animate-spin" />
            </div>
          ) : (
            <div className="h-[200px] flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={d?.oeeData ?? []} layout="vertical">
                  <XAxis type="number" hide domain={[0, 100]} />
                  <YAxis
                    dataKey="name" type="category"
                    stroke="white" fontSize={10} width={90}
                    tickLine={false} axisLine={false}
                  />
                  <ReTooltip
                    cursor={{ fill: 'transparent' }}
                    contentStyle={{ backgroundColor: '#09090b', border: '1px solid #27272a', borderRadius: '8px' }}
                    formatter={(v: number) => [`${v}%`, '']}
                  />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]} name="Valeur (%)">
                    {(d?.oeeData ?? []).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          <div className="space-y-4 pt-4 border-t border-zinc-800">
            <div className="flex justify-between items-center text-xs">
              <span className="text-zinc-500">Taux OEE Global</span>
              <span className="text-green-400 font-bold font-mono">
                {loading ? '—' : `${d?.oee ?? 0}%`}
              </span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-zinc-500">Temps Hors Session</span>
              <span className="text-red-400 font-mono">
                {loading ? '—' : d?.stopTimeFormatted}
              </span>
            </div>
          </div>
        </Card>
      </div>

      {/* ── Analyses + Export ───────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* Key analyses */}
        <Card className="p-6 bg-card/50 border-zinc-800 space-y-4">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-white text-sm uppercase tracking-wider">Analyses Clés</h3>
            <InfoTip content="Points remarquables calculés automatiquement depuis les données de la période : pic de production (bucket le plus actif) et consistance du débit (basée sur le coefficient de variation)." />
          </div>
          <div className="space-y-3">
            {loading ? (
              <div className="flex items-center justify-center py-6 text-zinc-600">
                <RefreshCw className="w-5 h-5 animate-spin" />
              </div>
            ) : (
              <>
                <div className="p-3 rounded-lg bg-zinc-900 border border-zinc-800">
                  <div className="text-sm font-medium text-white">Pic de Production</div>
                  <div className="text-xs text-zinc-500">
                    {d?.peakBucket
                      ? `${d.peakBucket.day} — ${d.peakBucket.current.toLocaleString('fr-FR')} sacs comptés.`
                      : 'Aucune donnée disponible.'}
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-zinc-900 border border-zinc-800">
                  <div className="text-sm font-medium text-white">Consistance du Débit</div>
                  <div className="text-xs text-zinc-500">
                    {d && d.consistency > 0
                      ? `Score de consistance : ${d.consistency}% (basé sur le coefficient de variation des intervalles).`
                      : 'Données insuffisantes pour calculer la consistance.'}
                  </div>
                </div>
              </>
            )}
          </div>
        </Card>

        {/* Quick export */}
        <Card className="p-6 bg-card/50 border-zinc-800 space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-white text-sm uppercase tracking-wider">Export Rapide</h3>
              <InfoTip content="Téléchargement direct des logs de détection de la période sélectionnée. Le CSV contient : ID, horodatage, session, statut, scores, intervalle et URL de capture." />
            </div>
            <p className="text-xs text-zinc-500 leading-relaxed">
              Téléchargez les logs de la période sélectionnée ({PERIOD_LABEL[period]}).
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Button
              variant="outline"
              className="border-zinc-800 text-white gap-2 text-xs"
              onClick={handleCsvExport}
            >
              <Download className="w-3 h-3" /> Historique CSV
            </Button>
            <Button
              variant="outline"
              className="border-zinc-800 text-zinc-500 gap-2 text-xs cursor-not-allowed"
              disabled
            >
              <Download className="w-3 h-3" /> Excel (bientôt)
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}

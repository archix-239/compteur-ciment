import { useState, useEffect, useCallback } from 'react';
import {
  Target,
  Zap,
  PieChart,
  ArrowUpRight,
  ArrowDownRight,
  Download,
  ShieldCheck,
  BrainCircuit,
  Lightbulb,
  Clock,
  HelpCircle,
  RefreshCw,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PageHeader } from '@/components/PageHeader';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as ReTooltip,
  ResponsiveContainer,
  Cell,
  PieChart as RePieChart,
  Pie,
} from 'recharts';
import { fetchApi } from '@/lib/api';

// ─── Types ────────────────────────────────────────────────────────────────────
interface HourlyBucket {
  name: string;
  real: number;
  target: number;
  forecast: number;
}

interface DowntimeSlice {
  name: string;
  value: number;
  color: string;
}

interface Recommendation {
  type: string;
  color: string;
  title: string;
  text: string;
}

interface OEEData {
  oee: number;
  oeeDelta: number;
  availability: number;
  performance: number;
  quality: number;
  totalBags: number;
  rejectedBags: number;
  targetRatePerHour: number;
  actualRatePerHour: number;
  sessionHours: number;
  hourlyData: HourlyBucket[];
  downtimeData: DowntimeSlice[];
  totalStopsHours: number;
  recommendations: Recommendation[];
  periodHours: number;
}

// ─── Period options ───────────────────────────────────────────────────────────
const PERIOD_OPTIONS = [
  { label: '6H',  hours: 6   },
  { label: '24H', hours: 24  },
  { label: '7J',  hours: 168 },
  { label: '30J', hours: 720 },
];

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

// ─── Recommendation colour map ────────────────────────────────────────────────
const REC_COLOUR: Record<string, string> = {
  orange: 'text-orange-500',
  blue:   'text-blue-500',
  green:  'text-green-500',
  red:    'text-red-500',
};

// ─── Main component ───────────────────────────────────────────────────────────
export default function PerformanceAnalytics() {
  const [selectedHours, setSelectedHours] = useState(24);
  const [data, setData]       = useState<OEEData | null>(null);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async (hours: number) => {
    setLoading(true);
    try {
      const json: OEEData = await fetchApi(`/api/analytics/oee?hours=${hours}`);
      setData(json);
    } catch (e) {
      console.error('OEE fetch error:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData(selectedHours);
  }, [selectedHours, loadData]);

  const periodLabel = PERIOD_OPTIONS.find(p => p.hours === selectedHours)?.label ?? '24H';

  // Delta badge helper
  const oeeDelta = data?.oeeDelta ?? 0;
  const deltaPositive = oeeDelta >= 0;

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Analytique Avancée & OEE"
        description="Indicateurs de performance globale et prévisions basées sur l'historique"
        breadcrumbs={[{ label: 'Analytique', href: '#' }, { label: 'Performance' }]}
      >
        {/* Period selector */}
        <div className="flex gap-1 bg-zinc-900 border border-zinc-800 rounded-lg p-1">
          {PERIOD_OPTIONS.map(({ label, hours }) => (
            <button
              key={hours}
              onClick={() => setSelectedHours(hours)}
              className={`px-3 py-1 rounded text-xs font-bold uppercase transition-colors ${
                selectedHours === hours
                  ? 'bg-orange-600 text-white'
                  : 'text-zinc-500 hover:text-white'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <Button
          variant="outline"
          className="border-zinc-800 text-white gap-2"
          onClick={() => loadData(selectedHours)}
          disabled={loading}
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Actualiser
        </Button>

        <Button className="bg-orange-600 hover:bg-orange-700 text-white gap-2">
          <Download className="w-4 h-4" /> Export OEE
        </Button>
      </PageHeader>

      {/* ── KPI Cards ─────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">

        {/* TRS / OEE */}
        <Card className="p-6 bg-gradient-to-br from-orange-600/20 to-zinc-900 border-orange-500/30 flex flex-col justify-between h-[180px]">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-bold text-orange-400 uppercase tracking-[2px]">TRS GLOBAL / OEE</span>
              <InfoTip content="Taux de Rendement Synthétique = Disponibilité × Performance × Qualité. Mesure l'efficacité globale de l'équipement sur la période sélectionnée." />
            </div>
            <Target className="w-5 h-5 text-orange-500" />
          </div>
          <div>
            <div className="text-5xl font-bold text-white mb-1">
              {loading ? '—' : `${data?.oee ?? 0}%`}
            </div>
            <div className="flex items-center gap-2">
              {data && (
                <Badge
                  className={`${
                    deltaPositive ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'
                  } border-none font-bold text-[10px] flex items-center gap-0.5`}
                >
                  {deltaPositive
                    ? <ArrowUpRight className="w-3 h-3" />
                    : <ArrowDownRight className="w-3 h-3" />}
                  {oeeDelta > 0 ? '+' : ''}{oeeDelta}%
                </Badge>
              )}
              <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest italic">
                Vs Période Précédente
              </span>
            </div>
          </div>
        </Card>

        {/* Disponibilité */}
        <Card className="p-6 bg-zinc-900/50 border-zinc-800 flex flex-col justify-between h-[180px]">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-[2px]">Disponibilité</span>
              <InfoTip content="Pourcentage du temps planifié pendant lequel l'équipement est opérationnel. Calculé sur la durée totale des sessions de production divisée par la fenêtre de temps sélectionnée." />
            </div>
            <Clock className="w-5 h-5 text-blue-500" />
          </div>
          <div>
            <div className="text-4xl font-bold text-white mb-1">
              {loading ? '—' : `${data?.availability ?? 0}%`}
            </div>
            <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest italic">
              {loading ? '…' : `${data?.sessionHours ?? 0}h de fonctionnement`}
            </div>
          </div>
        </Card>

        {/* Performance */}
        <Card className="p-6 bg-zinc-900/50 border-zinc-800 flex flex-col justify-between h-[180px]">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-[2px]">Performance</span>
              <InfoTip content="Rapport entre la cadence réelle et la cadence théorique cible (1 100 sacs/h). Reflète l'efficacité du flux de production en session active." />
            </div>
            <Zap className="w-5 h-5 text-yellow-500" />
          </div>
          <div>
            <div className="text-4xl font-bold text-white mb-1">
              {loading ? '—' : `${data?.performance ?? 0}%`}
            </div>
            <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest italic">
              {loading ? '…' : `${data?.actualRatePerHour ?? 0} sacs/heure moy.`}
            </div>
          </div>
        </Card>

        {/* Qualité */}
        <Card className="p-6 bg-zinc-900/50 border-zinc-800 flex flex-col justify-between h-[180px]">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-[2px]">Qualité</span>
              <InfoTip content="Pourcentage de sacs conformes sur le total inspecté par le système IA. Formule : sacs conformes ÷ (conformes + rejetés) × 100." />
            </div>
            <ShieldCheck className="w-5 h-5 text-green-500" />
          </div>
          <div>
            <div className="text-4xl font-bold text-white mb-1">
              {loading ? '—' : `${data?.quality ?? 0}%`}
            </div>
            <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest italic">
              {loading ? '…' : `${data?.rejectedBags ?? 0} rejets détectés`}
            </div>
          </div>
        </Card>
      </div>

      {/* ── Charts row ────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Production / Forecasting chart */}
        <Card className="lg:col-span-2 p-6 bg-zinc-900/50 border-zinc-800">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-2">
              <BrainCircuit className="w-5 h-5 text-orange-500" />
              <h3 className="text-sm font-bold text-white uppercase tracking-widest">
                Production — {periodLabel}
              </h3>
              <InfoTip content="Sacs conformes comptés par heure (ou par jour pour 7J / 30J). La ligne pointillée orange est un prévisionnel basé sur la moyenne mobile des 3 derniers buckets. La ligne grise est la cible théorique (1 100 sacs/h)." />
            </div>
            <div className="flex gap-4">
              <div className="flex items-center gap-1.5">
                <div className="w-4 h-0.5 bg-orange-500 rounded-full" />
                <span className="text-[10px] text-zinc-400 font-bold uppercase">Réel</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-4 h-0.5 border-t-2 border-dashed border-orange-400/60" />
                <span className="text-[10px] text-zinc-400 font-bold uppercase">Forecast</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-4 h-0.5 border-t border-dashed border-zinc-600" />
                <span className="text-[10px] text-zinc-400 font-bold uppercase">Cible</span>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="h-[350px] flex items-center justify-center text-zinc-600">
              <RefreshCw className="w-6 h-6 animate-spin" />
            </div>
          ) : (data?.hourlyData ?? []).every(b => b.real === 0) ? (
            <div className="h-[350px] flex flex-col items-center justify-center text-zinc-600 gap-2">
              <BrainCircuit className="w-8 h-8" />
              <span className="text-xs uppercase tracking-widest">Aucune donnée sur la période</span>
            </div>
          ) : (
            <div className="h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data?.hourlyData ?? []}>
                  <defs>
                    <linearGradient id="colorReal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#f97316" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#f97316" stopOpacity={0}   />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                  <XAxis dataKey="name" stroke="#52525b" fontSize={10} tickLine={false} axisLine={false} />
                  <YAxis stroke="#52525b" fontSize={10} tickLine={false} axisLine={false} />
                  <ReTooltip
                    contentStyle={{ backgroundColor: '#18181b', border: '1px solid #3f3f46', borderRadius: '8px' }}
                    itemStyle={{ color: '#fff' }}
                  />
                  <Area
                    type="monotone" dataKey="real" name="Réel"
                    stroke="#f97316" fill="url(#colorReal)" strokeWidth={2}
                  />
                  <Line
                    type="monotone" dataKey="forecast" name="Forecast"
                    stroke="#f97316" strokeDasharray="5 5" strokeOpacity={0.5}
                    dot={false} strokeWidth={1.5}
                  />
                  <Line
                    type="monotone" dataKey="target" name="Cible"
                    stroke="#52525b" strokeDasharray="3 3"
                    dot={false} strokeWidth={1}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>

        {/* Downtime pie */}
        <Card className="p-6 bg-zinc-900/50 border-zinc-800">
          <div className="flex items-center gap-2 mb-6">
            <PieChart className="w-5 h-5 text-orange-500" />
            <h3 className="text-sm font-bold text-white uppercase tracking-widest">Répartition du Temps</h3>
            <InfoTip content="Distribution de la fenêtre temporelle sélectionnée : Production (intervalles < 30 s entre sacs), Micro-arrêts (30–120 s), Panne Technique (> 120 s) et Inactivité (hors session)." />
          </div>

          {loading ? (
            <div className="h-[250px] flex items-center justify-center text-zinc-600">
              <RefreshCw className="w-6 h-6 animate-spin" />
            </div>
          ) : (
            <>
              <div className="h-[220px] relative">
                <ResponsiveContainer width="100%" height="100%">
                  <RePieChart>
                    <Pie
                      data={data?.downtimeData ?? []}
                      cx="50%" cy="50%"
                      innerRadius={60} outerRadius={90}
                      paddingAngle={6} dataKey="value"
                    >
                      {(data?.downtimeData ?? []).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <ReTooltip
                      contentStyle={{ backgroundColor: '#18181b', border: 'none' }}
                      formatter={(v: number) => [`${v}%`, '']}
                    />
                  </RePieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest">Arrêts</span>
                  <span className="text-2xl font-bold text-white">{data?.totalStopsHours ?? 0}h</span>
                </div>
              </div>
              <div className="space-y-2.5 mt-4">
                {(data?.downtimeData ?? []).map(item => (
                  <div key={item.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
                      <span className="text-[11px] text-zinc-400">{item.name}</span>
                    </div>
                    <span className="text-[11px] font-bold text-white">{item.value}%</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </Card>
      </div>

      {/* ── Recommendations ───────────────────────────────────────────────── */}
      <Card className="p-6 bg-orange-600/5 border border-orange-500/20">
        <div className="flex items-center gap-2 mb-6">
          <Lightbulb className="w-6 h-6 text-orange-500" />
          <h3 className="text-sm font-bold text-white uppercase tracking-widest">
            Recommandations d'Optimisation IA
          </h3>
          <InfoTip content="Recommandations générées automatiquement à partir de l'analyse statistique des données de production sur la période sélectionnée (coefficient de variation, taux de rejet, disponibilité)." />
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-8 text-zinc-600">
            <RefreshCw className="w-5 h-5 animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {(data?.recommendations ?? []).map((rec, i) => (
              <div key={i} className="space-y-2 p-4 rounded-xl bg-zinc-950/50 border border-zinc-800">
                <div className={`text-[10px] font-bold uppercase tracking-widest mb-1 ${REC_COLOUR[rec.color] ?? 'text-zinc-400'}`}>
                  {rec.title}
                </div>
                <p className="text-xs text-zinc-300 leading-relaxed">{rec.text}</p>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

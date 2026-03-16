import { useCallback, useEffect, useState } from 'react';
import {
  Calendar as CalendarIcon,
  Clock,
  ZoomIn,
  ZoomOut,
  Filter,
  Download,
  Activity,
  ArrowUp,
  ArrowDown,
  Loader2,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Area,
} from 'recharts';
import { API_URL } from '@/lib/api';

// ── Types ─────────────────────────────────────────────────────────────────────

interface HourlyBucket {
  time: string;
  count: number;
  interval: number;
  rejected: number;
}

interface TimelineSummary {
  data: HourlyBucket[];
  peakMax: { time: string; count: number } | null;
  peakMin: { time: string; count: number } | null;
  totalBags: number;
  totalRejected: number;
  periodHours: number;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const PERIOD_OPTIONS: { label: string; hours: number }[] = [
  { label: 'DERNIÈRES 6H',  hours: 6  },
  { label: 'DERNIÈRES 24H', hours: 24 },
  { label: 'DERNIERS 3J',   hours: 72 },
];

function todayLabel() {
  return new Date().toLocaleDateString('fr-FR', {
    day: 'numeric', month: 'long', year: 'numeric',
  });
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function Timeline() {
  const [selectedHours, setSelectedHours] = useState<number>(24);
  const [summary, setSummary] = useState<TimelineSummary | null>(null);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async (hours: number) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/timeline/hourly?hours=${hours}`);
      if (res.ok) {
        setSummary(await res.json() as TimelineSummary);
      }
    } catch (e) {
      console.error('Timeline fetch error:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData(selectedHours);
  }, [selectedHours, loadData]);

  const handlePeriod = (hours: number) => {
    setSelectedHours(hours);
  };

  const handleExport = () => {
    if (!summary || summary.data.length === 0) return;
    const header = ['Heure', 'Sacs Comptés', 'Intervalle Moyen (s)', 'Rejetés'];
    const rows = summary.data.map(b => [b.time, b.count, b.interval, b.rejected]);
    const csv = [header, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `timeline_${selectedHours}h_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const data = summary?.data ?? [];

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Chronologie de Production</h1>
          <p className="text-muted-foreground">
            Analyse visuelle historique des cycles de production et de la cadence
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="gap-2 border-zinc-800 text-white"
            onClick={() => loadData(selectedHours)}
            disabled={loading}
          >
            {loading
              ? <Loader2 className="w-4 h-4 animate-spin" />
              : <Filter className="w-4 h-4" />}
            Actualiser
          </Button>
          <Button
            variant="outline"
            className="gap-2 border-zinc-800 text-white"
            onClick={handleExport}
            disabled={!summary || summary.data.length === 0}
          >
            <Download className="w-4 h-4" /> Exporter le Rapport
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* ── Main Chart ── */}
        <Card className="lg:col-span-3 p-6 bg-card/50 border-zinc-800 space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 font-semibold text-white">
              <Activity className="w-5 h-5 text-orange-500" />
              <span>
                Distribution Horaire de Production{' '}
                <span className="text-zinc-500 font-normal">
                  (Dernières {selectedHours}h)
                </span>
              </span>
              {summary && (
                <Badge className="bg-orange-500/10 text-orange-400 border-orange-500/20 font-mono text-xs">
                  {summary.totalBags} sacs
                </Badge>
              )}
            </div>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 border border-zinc-800 text-zinc-400 hover:text-white"
                title="Zoom in (non implémenté)"
              >
                <ZoomIn className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 border border-zinc-800 text-zinc-400 hover:text-white"
                title="Zoom out (non implémenté)"
              >
                <ZoomOut className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <div className="h-[400px] w-full">
            {loading ? (
              <div className="h-full flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
              </div>
            ) : data.length === 0 || data.every((b) => b.count === 0) ? (
              <div className="h-full flex flex-col items-center justify-center gap-2 text-zinc-500">
                <Clock className="w-10 h-10 text-zinc-700" />
                <p className="text-sm">Aucune donnée sur cette période</p>
                <p className="text-xs">Démarrez une session pour enregistrer des détections</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={data}>
                  <defs>
                    <linearGradient id="colorCountArea" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#f97316" stopOpacity={0.1} />
                      <stop offset="95%" stopColor="#f97316" stopOpacity={0}   />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="rgba(255,255,255,0.03)"
                  />
                  <XAxis
                    dataKey="time"
                    stroke="rgba(255,255,255,0.4)"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    interval={selectedHours <= 6 ? 0 : selectedHours <= 24 ? 1 : 5}
                  />
                  <YAxis
                    yAxisId="left"
                    stroke="rgba(255,255,255,0.4)"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    stroke="rgba(251,191,36,0.4)"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#09090b',
                      border: '1px solid #27272a',
                      borderRadius: '8px',
                    }}
                    cursor={{ stroke: 'rgba(249, 115, 22, 0.2)', strokeWidth: 2 }}
                    formatter={(value: number, name: string) => {
                      if (name === 'Intervalle Moyen (s)') return [`${value}s`, name];
                      return [value, name];
                    }}
                  />
                  <Legend
                    iconType="circle"
                    wrapperStyle={{ fontSize: '12px', paddingTop: '20px' }}
                  />
                  <Area
                    yAxisId="left"
                    type="monotone"
                    dataKey="count"
                    fill="url(#colorCountArea)"
                    stroke="none"
                  />
                  <Bar
                    yAxisId="left"
                    dataKey="count"
                    fill="#f97316"
                    radius={[4, 4, 0, 0]}
                    barSize={selectedHours <= 24 ? 20 : 8}
                    name="Sacs Comptés"
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="interval"
                    stroke="#fbbf24"
                    strokeWidth={2}
                    dot={{ r: 2 }}
                    name="Intervalle Moyen (s)"
                    connectNulls={false}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>

        {/* ── Right Panel ── */}
        <div className="space-y-6">
          {/* Peak analysis */}
          <Card className="p-4 space-y-4 bg-card/50 border-zinc-800">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Analyse des Pics
            </h3>
            <div className="space-y-4">
              {/* Max */}
              <div className="p-3 rounded-lg bg-green-500/5 border border-green-500/20">
                <div className="flex justify-between items-start">
                  <span className="text-[10px] font-bold text-green-400 uppercase">
                    Charge Maximum
                  </span>
                  <ArrowUp className="w-4 h-4 text-green-400" />
                </div>
                {loading ? (
                  <div className="text-zinc-600 text-sm mt-1">—</div>
                ) : summary?.peakMax ? (
                  <>
                    <div className="text-xl font-bold font-mono text-white mt-1">
                      {summary.peakMax.count.toLocaleString('fr-FR')} sacs/h
                    </div>
                    <div className="text-[10px] text-zinc-500 mt-1">
                      à {summary.peakMax.time}
                    </div>
                  </>
                ) : (
                  <div className="text-zinc-600 text-sm mt-1">Aucune donnée</div>
                )}
              </div>

              {/* Min */}
              <div className="p-3 rounded-lg bg-red-500/5 border border-red-500/20">
                <div className="flex justify-between items-start">
                  <span className="text-[10px] font-bold text-red-400 uppercase">
                    Charge Minimum
                  </span>
                  <ArrowDown className="w-4 h-4 text-red-400" />
                </div>
                {loading ? (
                  <div className="text-zinc-600 text-sm mt-1">—</div>
                ) : summary?.peakMin ? (
                  <>
                    <div className="text-xl font-bold font-mono text-white mt-1">
                      {summary.peakMin.count.toLocaleString('fr-FR')} sacs/h
                    </div>
                    <div className="text-[10px] text-zinc-500 mt-1">
                      à {summary.peakMin.time}
                    </div>
                  </>
                ) : (
                  <div className="text-zinc-600 text-sm mt-1">Aucune donnée</div>
                )}
              </div>

              {/* Totaux */}
              {summary && !loading && (
                <div className="pt-2 border-t border-zinc-800 space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Total comptés :</span>
                    <span className="text-white font-mono font-bold">
                      {summary.totalBags.toLocaleString('fr-FR')}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Total rejetés :</span>
                    <span className="text-red-400 font-mono font-bold">
                      {summary.totalRejected.toLocaleString('fr-FR')}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* Filters */}
          <Card className="p-4 space-y-4 bg-card/50 border-zinc-800">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Filtres
            </h3>
            <div className="space-y-3">
              <div className="space-y-1.5">
                <span className="text-[10px] text-zinc-500 uppercase">Date courante</span>
                <div className="w-full flex items-center gap-2 text-xs border border-zinc-800 bg-zinc-900/50 text-white rounded-md px-3 py-2">
                  <CalendarIcon className="w-3 h-3 text-orange-500 shrink-0" />
                  {todayLabel()}
                </div>
              </div>

              <div className="space-y-1.5">
                <span className="text-[10px] text-zinc-500 uppercase">Sélection Rapide</span>
                <div className="flex flex-col gap-2">
                  {PERIOD_OPTIONS.map(({ label, hours }) => (
                    <Button
                      key={hours}
                      variant={selectedHours === hours ? 'default' : 'secondary'}
                      className={`h-7 text-[9px] font-bold uppercase w-full ${
                        selectedHours === hours
                          ? 'bg-orange-600 hover:bg-orange-700 text-white'
                          : 'bg-zinc-800 text-zinc-300 hover:text-white'
                      }`}
                      onClick={() => handlePeriod(hours)}
                      disabled={loading}
                    >
                      {label}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

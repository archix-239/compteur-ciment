import { useEffect, useMemo, useState } from 'react';
import { ShieldCheck, Target, Percent, BarChart3, AlertTriangle, XCircle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { fetchApi } from '@/lib/api';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell, PieChart, Pie } from 'recharts';

interface QualitySummary {
  totalInspected: number;
  rejectedCount: number;
  rejectionRate: number;
  avgLogoScore: number;
  avgColorScore: number;
  avgDetectionScore: number;
  confidenceDistribution: { range: string; count: number }[];
  logoDistribution: { name: string; value: number; color: string }[];
  recentErrors: number;
  reviewedCorrections: number;
}

export default function QualityDashboard() {
  const [summary, setSummary] = useState<QualitySummary | null>(null);

  useEffect(() => {
    fetchApi('/api/quality/summary')
      .then((data) => setSummary(data as QualitySummary))
      .catch((err) => console.error('Error fetching quality summary:', err));
  }, []);

  const confidenceData = summary?.confidenceDistribution || [];
  const distributionData = summary?.logoDistribution || [];
  const stabilityIndex = useMemo(() => {
    if (!summary || summary.totalInspected === 0) return 0;
    return Math.max(0, 100 - summary.rejectionRate).toFixed(1);
  }, [summary]);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">Qualité de Détection</h1>
        <p className="text-muted-foreground">Analyse réelle de précision du modèle IA et fiabilité des données.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 bg-zinc-900/50 border-zinc-800 space-y-2">
          <div className="flex justify-between items-start"><span className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Taux de Rejet</span><Target className="w-4 h-4 text-orange-500" /></div>
          <div className="flex items-baseline gap-2"><span className="text-3xl font-bold text-white">{summary ? summary.rejectionRate.toFixed(1) : '0'}%</span><span className="text-xs text-zinc-400">Réel</span></div>
        </Card>

        <Card className="p-4 bg-zinc-900/50 border-zinc-800 space-y-2">
          <div className="flex justify-between items-start"><span className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Faux Positifs (estimés)</span><XCircle className="w-4 h-4 text-red-500" /></div>
          <div className="flex items-baseline gap-2"><span className="text-3xl font-bold text-white">{summary ? Math.max(0, (summary.rejectedCount / Math.max(summary.totalInspected, 1) * 100 * 0.25)).toFixed(1) : '0'}%</span><span className="text-xs text-zinc-500">approx.</span></div>
        </Card>

        <Card className="p-4 bg-zinc-900/50 border-zinc-800 space-y-2">
          <div className="flex justify-between items-start"><span className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Faux Négatifs (estimés)</span><AlertTriangle className="w-4 h-4 text-yellow-500" /></div>
          <div className="flex items-baseline gap-2"><span className="text-3xl font-bold text-white">{summary ? Math.max(0, (100 - summary.avgDetectionScore * 100) * 0.1).toFixed(1) : '0'}%</span><span className="text-xs text-zinc-500">approx.</span></div>
        </Card>

        <Card className="p-4 bg-zinc-900/50 border-zinc-800 space-y-2">
          <div className="flex justify-between items-start"><span className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Index de Stabilité</span><ShieldCheck className="w-4 h-4 text-green-500" /></div>
          <div className="flex items-baseline gap-2"><span className="text-3xl font-bold text-white">{stabilityIndex}</span><span className="text-xs text-green-500 font-bold">DYNAMIQUE</span></div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6 bg-zinc-900/50 border-zinc-800">
          <div className="flex items-center gap-2 mb-6"><BarChart3 className="w-4 h-4 text-orange-500" /><h3 className="text-sm font-bold text-white uppercase tracking-widest">Distribution des Scores de Confiance</h3></div>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={confidenceData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                <XAxis dataKey="range" stroke="#52525b" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#52525b" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ backgroundColor: '#18181b', border: '1px solid #3f3f46' }} />
                <Bar dataKey="count" fill="#f97316" radius={[4, 4, 0, 0]}>
                  {confidenceData.map((entry, index) => (<Cell key={`cell-${index}`} fill={entry.range === '80-100%' ? '#22c55e' : entry.range === '60-80%' ? '#f97316' : '#ef4444'} />))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-6 bg-zinc-900/50 border-zinc-800">
          <div className="flex items-center gap-2 mb-6"><Percent className="w-4 h-4 text-orange-500" /><h3 className="text-sm font-bold text-white uppercase tracking-widest">Reconnaissance du Logo</h3></div>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={distributionData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="value">
                  {distributionData.map((entry, index) => (<Cell key={`cell-${index}`} fill={entry.color} />))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#18181b', border: 'none' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    </div>
  );
}

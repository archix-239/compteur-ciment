import {
  ShieldCheck,
  Target,
  Percent,
  BarChart3,
  AlertTriangle,
  Zap,
  CheckCircle2,
  XCircle,
  TrendingUp
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
  PieChart,
  Pie,
  LineChart,
  Line,
  AreaChart,
  Area
} from 'recharts';

const confidenceData = [
  { range: '0-20%', count: 2 },
  { range: '20-40%', count: 5 },
  { range: '40-60%', count: 12 },
  { range: '60-80%', count: 85 },
  { range: '80-100%', count: 914 },
];

const distributionData = [
  { name: 'Logo Conforme', value: 92, color: '#f97316' },
  { name: 'Logo Flou', value: 5, color: '#eab308' },
  { name: 'Sans Logo', value: 3, color: '#ef4444' },
];

export default function QualityDashboard() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">Qualité de Détection</h1>
        <p className="text-muted-foreground">Analyse de précision du modèle IA et fiabilité des données</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 bg-zinc-900/50 border-zinc-800 space-y-2">
          <div className="flex justify-between items-start">
            <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Taux de Confiance</span>
            <Target className="w-4 h-4 text-orange-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-white">94.8%</span>
            <span className="text-xs text-green-500 font-bold">Moyenne</span>
          </div>
        </Card>

        <Card className="p-4 bg-zinc-900/50 border-zinc-800 space-y-2">
          <div className="flex justify-between items-start">
            <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Faux Positifs</span>
            <XCircle className="w-4 h-4 text-red-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-white">0.4%</span>
            <span className="text-xs text-zinc-500">12 cas / 24h</span>
          </div>
        </Card>

        <Card className="p-4 bg-zinc-900/50 border-zinc-800 space-y-2">
          <div className="flex justify-between items-start">
            <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Faux Négatifs</span>
            <AlertTriangle className="w-4 h-4 text-yellow-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-white">1.2%</span>
            <span className="text-xs text-zinc-500">38 cas / 24h</span>
          </div>
        </Card>

        <Card className="p-4 bg-zinc-900/50 border-zinc-800 space-y-2">
          <div className="flex justify-between items-start">
            <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Index de Stabilité</span>
            <ShieldCheck className="w-4 h-4 text-green-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-white">98.2</span>
            <span className="text-xs text-green-500 font-bold">EXCELLENT</span>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6 bg-zinc-900/50 border-zinc-800">
           <div className="flex items-center gap-2 mb-6">
            <BarChart3 className="w-4 h-4 text-orange-500" />
            <h3 className="text-sm font-bold text-white uppercase tracking-widest">Distribution des Scores de Confiance</h3>
          </div>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={confidenceData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                <XAxis dataKey="range" stroke="#52525b" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#52525b" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ backgroundColor: '#18181b', border: '1px solid #3f3f46' }} />
                <Bar dataKey="count" fill="#f97316" radius={[4, 4, 0, 0]}>
                  {confidenceData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index === 4 ? '#22c55e' : index === 3 ? '#f97316' : '#ef4444'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-6 bg-zinc-900/50 border-zinc-800">
           <div className="flex items-center gap-2 mb-6">
            <Percent className="w-4 h-4 text-orange-500" />
            <h3 className="text-sm font-bold text-white uppercase tracking-widest">Reconnaissance du Logo</h3>
          </div>
          <div className="h-[300px]">
             <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={distributionData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {distributionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#18181b', border: 'none' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-6 mt-4">
            {distributionData.map(d => (
              <div key={d.name} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: d.color }} />
                <span className="text-[11px] text-zinc-400">{d.name}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card className="p-6 bg-zinc-900/50 border-zinc-800">
         <h3 className="text-sm font-bold text-white uppercase tracking-widest mb-6">Matrice de Confusion (Performance IA)</h3>
         <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-zinc-800">
                  <th className="py-4 px-4 text-[10px] text-zinc-500 uppercase tracking-widest">Réalité \ Prédiction</th>
                  <th className="py-4 px-4 text-[10px] text-zinc-500 uppercase tracking-widest">Sac (IA)</th>
                  <th className="py-4 px-4 text-[10px] text-zinc-500 uppercase tracking-widest">Rien (IA)</th>
                  <th className="py-4 px-4 text-[10px] text-zinc-500 uppercase tracking-widest">Précision %</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                <tr className="border-b border-zinc-800/50">
                  <td className="py-4 px-4 font-bold text-white">Est un Sac</td>
                  <td className="py-4 px-4"><div className="w-12 h-12 flex items-center justify-center bg-green-500/20 text-green-500 font-bold rounded border border-green-500/30">988</div></td>
                  <td className="py-4 px-4"><div className="w-12 h-12 flex items-center justify-center bg-red-500/10 text-red-500/50 font-bold rounded border border-red-500/20">12</div></td>
                  <td className="py-4 px-4 text-green-500 font-mono font-bold">98.8%</td>
                </tr>
                <tr>
                  <td className="py-4 px-4 font-bold text-white">N'est pas un Sac</td>
                  <td className="py-4 px-4"><div className="w-12 h-12 flex items-center justify-center bg-yellow-500/10 text-yellow-500/50 font-bold rounded border border-yellow-500/20">4</div></td>
                  <td className="py-4 px-4"><div className="w-12 h-12 flex items-center justify-center bg-zinc-800 text-zinc-400 font-bold rounded border border-zinc-700">--</div></td>
                  <td className="py-4 px-4 text-zinc-500 font-mono">--</td>
                </tr>
              </tbody>
            </table>
         </div>
      </Card>
    </div>
  );
}

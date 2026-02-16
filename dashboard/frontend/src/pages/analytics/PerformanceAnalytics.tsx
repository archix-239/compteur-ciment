import {
  TrendingUp,
  Target,
  Zap,
  BarChart3,
  PieChart,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  Filter,
  Download,
  ShieldCheck,
  BrainCircuit,
  Lightbulb,
  Clock
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart as RePieChart,
  Pie
} from 'recharts';

const dataPerformance = [
  { name: '08:00', real: 1200, target: 1100, forecast: 1150 },
  { name: '10:00', real: 1150, target: 1100, forecast: 1180 },
  { name: '12:00', real: 800, target: 1100, forecast: 900 },
  { name: '14:00', real: 1300, target: 1100, forecast: 1250 },
  { name: '16:00', real: 1250, target: 1100, forecast: 1220 },
  { name: '18:00', real: 1100, target: 1100, forecast: 1150 },
  { name: '20:00', real: 1050, target: 1100, forecast: 1080 },
];

const dataRepartition = [
  { name: 'Production', value: 75, color: '#22c55e' },
  { name: 'Micro-arrêts', value: 12, color: '#eab308' },
  { name: 'Panne Technique', value: 8, color: '#ef4444' },
  { name: 'Changement Format', value: 5, color: '#6366f1' },
];

export default function PerformanceAnalytics() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Analytique Avancée & OEE</h1>
          <p className="text-muted-foreground">Indicateurs de performance globale et prévisions basées sur l'historique</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="border-zinc-800 text-white gap-2">
            <Calendar className="w-4 h-4" /> 24 Dernières Heures
          </Button>
          <Button className="bg-orange-600 hover:bg-orange-700 text-white gap-2">
            <Download className="w-4 h-4" /> Export Rapport OEE
          </Button>
        </div>
      </div>

      {/* TRS / OEE Section */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <Card className="p-6 bg-gradient-to-br from-orange-600/20 to-zinc-900 border-orange-500/30 flex flex-col justify-between h-[180px]">
           <div className="flex justify-between items-start">
              <span className="text-[10px] font-bold text-orange-400 uppercase tracking-[2px]">TRS GLOBAL / OEE</span>
              <Target className="w-5 h-5 text-orange-500" />
           </div>
           <div>
              <div className="text-5xl font-bold text-white mb-1">84.2%</div>
              <div className="flex items-center gap-2">
                 <Badge className="bg-green-500/20 text-green-500 border-none font-bold text-[10px]">+2.4%</Badge>
                 <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest italic">Vs Semaine Passée</span>
              </div>
           </div>
        </Card>
        <Card className="p-6 bg-zinc-900/50 border-zinc-800 flex flex-col justify-between h-[180px]">
           <div className="flex justify-between items-start">
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-[2px]">Disponibilité</span>
              <Clock className="w-5 h-5 text-blue-500" />
           </div>
           <div>
              <div className="text-4xl font-bold text-white mb-1">96.8%</div>
              <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest italic">22.4h de fonctionnement</div>
           </div>
        </Card>
        <Card className="p-6 bg-zinc-900/50 border-zinc-800 flex flex-col justify-between h-[180px]">
           <div className="flex justify-between items-start">
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-[2px]">Performance</span>
              <Zap className="w-5 h-5 text-yellow-500" />
           </div>
           <div>
              <div className="text-4xl font-bold text-white mb-1">89.1%</div>
              <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest italic">1,240 sacs/heure moy.</div>
           </div>
        </Card>
        <Card className="p-6 bg-zinc-900/50 border-zinc-800 flex flex-col justify-between h-[180px]">
           <div className="flex justify-between items-start">
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-[2px]">Qualité</span>
              <ShieldCheck className="w-5 h-5 text-green-500" />
           </div>
           <div>
              <div className="text-4xl font-bold text-white mb-1">99.1%</div>
              <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest italic">12 rejets détectés</div>
           </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Forecasting Chart */}
        <Card className="lg:col-span-2 p-6 bg-zinc-900/50 border-zinc-800">
           <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-2">
                 <BrainCircuit className="w-5 h-5 text-orange-500" />
                 <h3 className="text-sm font-bold text-white uppercase tracking-widest">Prévisions de Production (Forecasting)</h3>
              </div>
              <div className="flex gap-4">
                 <div className="flex items-center gap-2">
                    <div className="w-3 h-1 bg-orange-500 rounded-full" />
                    <span className="text-[10px] text-zinc-400 font-bold uppercase">Réel</span>
                 </div>
                 <div className="flex items-center gap-2">
                    <div className="w-3 h-1 bg-orange-500/30 rounded-full" />
                    <span className="text-[10px] text-zinc-400 font-bold uppercase">IA Forecast</span>
                 </div>
              </div>
           </div>
           <div className="h-[350px]">
             <ResponsiveContainer width="100%" height="100%">
               <AreaChart data={dataPerformance}>
                 <defs>
                   <linearGradient id="colorReal" x1="0" y1="0" x2="0" y2="1">
                     <stop offset="5%" stopColor="#f97316" stopOpacity={0.2}/>
                     <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                   </linearGradient>
                 </defs>
                 <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                 <XAxis dataKey="name" stroke="#52525b" fontSize={12} tickLine={false} axisLine={false} />
                 <YAxis stroke="#52525b" fontSize={12} tickLine={false} axisLine={false} />
                 <Tooltip
                   contentStyle={{ backgroundColor: '#18181b', border: '1px solid #3f3f46', borderRadius: '8px' }}
                   itemStyle={{ color: '#fff' }}
                 />
                 <Area type="monotone" dataKey="real" stroke="#f97316" fillOpacity={1} fill="url(#colorReal)" strokeWidth={3} />
                 <Line type="monotone" dataKey="forecast" stroke="#f97316" strokeDasharray="5 5" strokeOpacity={0.4} dot={false} strokeWidth={2} />
                 <Line type="monotone" dataKey="target" stroke="#52525b" strokeDasharray="3 3" dot={false} strokeWidth={1} />
               </AreaChart>
             </ResponsiveContainer>
           </div>
        </Card>

        {/* Downtime Causes */}
        <Card className="p-6 bg-zinc-900/50 border-zinc-800">
           <div className="flex items-center gap-2 mb-8">
            <PieChart className="w-5 h-5 text-orange-500" />
            <h3 className="text-sm font-bold text-white uppercase tracking-widest">Causes d'Arrêt</h3>
          </div>
          <div className="h-[250px] relative">
            <ResponsiveContainer width="100%" height="100%">
              <RePieChart>
                <Pie
                  data={dataRepartition}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={100}
                  paddingAngle={8}
                  dataKey="value"
                >
                  {dataRepartition.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#18181b', border: 'none' }} />
              </RePieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
               <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest">Temps Total</span>
               <span className="text-2xl font-bold text-white">4.2h</span>
            </div>
          </div>
          <div className="space-y-3 mt-8">
             {dataRepartition.map(item => (
                <div key={item.name} className="flex items-center justify-between">
                   <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="text-[11px] text-zinc-400">{item.name}</span>
                   </div>
                   <span className="text-[11px] font-bold text-white">{item.value}%</span>
                </div>
             ))}
          </div>
        </Card>
      </div>

      {/* Optimization Recommendations */}
      <Card className="p-6 bg-orange-600/5 border border-orange-500/20">
         <div className="flex items-center gap-2 mb-6">
            <Lightbulb className="w-6 h-6 text-orange-500" />
            <h3 className="text-sm font-bold text-white uppercase tracking-widest">Recommandations d'Optimisation IA</h3>
         </div>
         <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2 p-4 rounded-xl bg-zinc-950/50 border border-zinc-800">
               <div className="text-[10px] font-bold text-orange-500 uppercase tracking-widest mb-1">Vitesse Convoyeur</div>
               <p className="text-xs text-zinc-300 leading-relaxed">Le débit est instable entre 11h et 13h. Réduire la vitesse de 5% permettrait d'augmenter la précision de 12%.</p>
            </div>
            <div className="space-y-2 p-4 rounded-xl bg-zinc-950/50 border border-zinc-800">
               <div className="text-[10px] font-bold text-blue-500 uppercase tracking-widest mb-1">Maintenance Prédictive</div>
               <p className="text-xs text-zinc-300 leading-relaxed">Les micro-vibrations sur la Camera-01 indiquent un desserrage probable du support. Intervention recommandée sous 48h.</p>
            </div>
            <div className="space-y-2 p-4 rounded-xl bg-zinc-950/50 border border-zinc-800">
               <div className="text-[10px] font-bold text-green-500 uppercase tracking-widest mb-1">Qualité de Donnée</div>
               <p className="text-xs text-zinc-300 leading-relaxed">L'éclairage zénithal actuel crée des ombres portées. Une lumière rasante améliorerait la détection des logos à 99.8%.</p>
            </div>
         </div>
      </Card>
    </div>
  );
}

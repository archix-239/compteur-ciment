import {
  Database,
  HardDrive,
  Archive,
  Trash2,
  RefreshCw,
  Download,
  Clock,
  ShieldCheck,
  AlertTriangle,
  FileJson,
  ArrowDown
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';

export default function DatabaseManagement() {
  const tableStats = [
    { name: "detections_logs", size: "4.2 GB", rows: "2.4M", status: "optimized" },
    { name: "sessions_history", size: "128 MB", rows: "12,400", status: "optimized" },
    { name: "anomaly_snapshots", size: "18.5 GB", rows: "8,500", status: "warning" },
    { name: "audit_trail", size: "45 MB", rows: "1,200", status: "optimized" },
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Gestion de la Base de Données</h1>
          <p className="text-muted-foreground">Optimisation du stockage, archivage et intégrité des données de production</p>
        </div>
        <div className="flex gap-2">
           <Button variant="outline" className="border-zinc-800 text-white gap-2">
             <RefreshCw className="w-4 h-4" /> Réindexer Tout
           </Button>
           <Button className="bg-orange-600 hover:bg-orange-700 text-white gap-2 shadow-lg shadow-orange-900/20">
             <Download className="w-4 h-4" /> Backup Complet (.sql)
           </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         {/* DB Storage KPI */}
         <Card className="p-6 bg-zinc-900/50 border-zinc-800 flex flex-col justify-between">
            <div className="flex justify-between items-start">
               <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Utilisation Totale</span>
               <Database className="w-5 h-5 text-orange-500" />
            </div>
            <div className="space-y-4">
               <div className="text-4xl font-bold text-white">22.9 <span className="text-lg text-zinc-500 font-normal">GB</span></div>
               <div className="space-y-2">
                  <div className="flex justify-between text-[10px] uppercase font-bold text-zinc-500">
                     <span>Quota Disque (50GB)</span>
                     <span className="text-white">46%</span>
                  </div>
                  <Progress value={46} className="h-1.5 bg-zinc-800" />
               </div>
            </div>
         </Card>

         <Card className="p-6 bg-zinc-900/50 border-zinc-800 flex flex-col justify-between">
            <div className="flex justify-between items-start">
               <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Santé DB</span>
               <ShieldCheck className="w-5 h-5 text-green-500" />
            </div>
            <div className="space-y-4">
               <div className="text-4xl font-bold text-white">OPTIMAL</div>
               <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest italic flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" /> Dernière vérification il y a 4h
               </div>
            </div>
         </Card>

         <Card className="p-6 bg-zinc-900/50 border-zinc-800 flex flex-col justify-between">
            <div className="flex justify-between items-start">
               <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Archivage Auto</span>
               <Archive className="w-5 h-5 text-blue-500" />
            </div>
            <div className="space-y-4">
               <div className="text-4xl font-bold text-white">ACTIF</div>
               <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest italic">Rétention: 90 Jours</div>
            </div>
         </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
         <Card className="lg:col-span-2 bg-zinc-900/50 border-zinc-800 overflow-hidden">
            <div className="p-4 border-b border-zinc-800 bg-zinc-900/30">
               <h3 className="text-sm font-bold text-white uppercase tracking-widest">Statistiques des Tables</h3>
            </div>
            <div className="divide-y divide-zinc-800/50">
               {tableStats.map((stat, i) => (
                  <div key={i} className="p-4 hover:bg-zinc-800/30 transition-colors flex items-center justify-between">
                     <div className="flex gap-4">
                        <div className="p-2.5 rounded-lg bg-zinc-950 border border-zinc-800">
                           <HardDrive className="w-4 h-4 text-zinc-500" />
                        </div>
                        <div className="space-y-1">
                           <h4 className="text-sm font-bold text-white font-mono">{stat.name}</h4>
                           <div className="flex gap-3">
                              <span className="text-[10px] text-zinc-500 font-bold uppercase">{stat.rows} Lignes</span>
                              <span className="text-[10px] text-zinc-500 font-bold uppercase">{stat.size}</span>
                           </div>
                        </div>
                     </div>
                     <div className="flex items-center gap-4">
                        <Badge className={`
                           ${stat.status === 'optimized' ? 'bg-green-500/10 text-green-500 border-green-500/20' : 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'}
                           text-[9px] font-bold uppercase px-2 py-0.5
                        `}>
                           {stat.status}
                        </Badge>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-600 hover:text-white"><ArrowDown className="w-4 h-4" /></Button>
                     </div>
                  </div>
               ))}
            </div>
         </Card>

         <div className="space-y-6">
            <Card className="p-6 bg-zinc-900/50 border-zinc-800 space-y-6">
               <div className="flex items-center gap-2 border-b border-zinc-800 pb-4">
                  <Archive className="w-5 h-5 text-orange-500" />
                  <h3 className="text-sm font-bold text-white uppercase tracking-widest">Actions de Maintenance</h3>
               </div>
               <div className="space-y-4">
                  <Button variant="outline" className="w-full justify-start gap-3 border-zinc-800 h-12 text-xs text-white hover:bg-zinc-800">
                     <Archive className="w-4 h-4 text-blue-500" /> Archiver Anciennes Sessions
                  </Button>
                  <Button variant="outline" className="w-full justify-start gap-3 border-zinc-800 h-12 text-xs text-white hover:bg-zinc-800">
                     <FileJson className="w-4 h-4 text-green-500" /> Exporter Logs Binaires
                  </Button>
                  <Button className="w-full gap-3 bg-red-950/20 text-red-500 border border-red-900/50 h-12 text-xs font-bold uppercase tracking-widest hover:bg-red-950/40">
                     <Trash2 className="w-4 h-4" /> Purge Définitive (+90j)
                  </Button>
               </div>
            </Card>

            <Card className="p-5 bg-yellow-600/5 border border-yellow-500/20 space-y-3">
               <div className="flex items-center gap-2 text-yellow-500">
                  <AlertTriangle className="w-4 h-4" />
                  <h4 className="text-[10px] font-bold uppercase tracking-widest">Alerte Stockage</h4>
               </div>
               <p className="text-[11px] text-zinc-400 leading-relaxed italic">
                 La table `anomaly_snapshots` consomme 80% de l'espace total alloué. Une purge des images datant de plus de 30 jours est fortement recommandée.
               </p>
               <Button variant="link" className="p-0 text-yellow-500 text-[10px] font-bold uppercase h-auto">Lancer Optimisation →</Button>
            </Card>
         </div>
      </div>
    </div>
  );
}

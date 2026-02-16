import { useState, useEffect } from 'react';
import { API_URL } from '@/lib/api';
import {
  AlertTriangle,
  Image as ImageIcon,
  RefreshCcw,
  Zap,
  Sun,
  Clock,
  CheckCircle2,
  Filter,
  Eye,
  ChevronRight,
  Settings
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const anomalies = [
  {
    id: "AN-1042",
    type: "Écart d'intervalle",
    time: "14:20:12",
    severity: "medium",
    description: "Intervalle de 8.4s entre le sac #120 et #121 (Moyenne 2.2s)",
    thumbnail: "https://images.unsplash.com/photo-1581092160562-40aa08e78837?q=80&w=400&auto=format&fit=crop",
    status: "pending"
  },
  {
    id: "AN-1043",
    type: "Luminosité critique",
    time: "14:45:05",
    severity: "low",
    description: "Baisse de 40% de la luminosité sur le capteur Camera-01",
    thumbnail: "https://images.unsplash.com/photo-1590247813693-5541d1c609fd?q=80&w=400&auto=format&fit=crop",
    status: "resolved"
  },
  {
    id: "AN-1044",
    type: "Sac mal détecté",
    time: "15:10:42",
    severity: "high",
    description: "Sac à plat détecté avec un score de confiance de 0.42",
    thumbnail: "https://images.unsplash.com/photo-1565793298595-6a879b1d9492?q=80&w=400&auto=format&fit=crop",
    status: "pending"
  },
];

export default function AnomalyDetection() {
  const [anomalies, setAnomalies] = useState([]);

  useEffect(() => {
    fetch(`${API_URL}/api/logs/`)
      .then(res => res.json())
      .then(data => {
        const rejected = data.filter((l: any) => l.status === 'rejete').map((l: any) => ({
          id: `AN-${l.id}`,
          type: "Sac rejeté",
          time: new Date(l.timestamp).toLocaleTimeString('fr-FR'),
          severity: "high",
          description: `Sac non conforme détecté avec un score de ${l.detection_score.toFixed(2)}`,
          thumbnail: l.capture_url ? `${API_URL}${l.capture_url}` : "https://images.unsplash.com/photo-1565793298595-6a879b1d9492?q=80&w=400&auto=format&fit=crop",
          status: "pending"
        }));
        setAnomalies(rejected);
      })
      .catch(err => console.error("Error fetching anomalies:", err));
  }, []);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Détection des Anomalies</h1>
          <p className="text-muted-foreground">Historique des incidents de production et erreurs d'inférence IA</p>
        </div>
        <div className="flex gap-2">
           <Button variant="outline" className="border-zinc-800 text-white gap-2">
             <Filter className="w-4 h-4" /> Filtrer par Sévérité
           </Button>
           <Button className="bg-orange-600 hover:bg-orange-700 text-white gap-2">
             <CheckCircle2 className="w-4 h-4" /> Marquer Tout comme Résolu
           </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
           {anomalies.map((anomaly) => (
             <Card key={anomaly.id} className="p-5 bg-zinc-900/50 border-zinc-800 hover:border-zinc-700 transition-all cursor-pointer group">
               <div className="flex gap-6">
                  <div className="w-32 h-24 rounded-lg overflow-hidden border border-zinc-800 shrink-0 relative">
                     <img src={anomaly.thumbnail} alt="Anomaly" className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all" />
                     <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Eye className="w-5 h-5 text-white" />
                     </div>
                  </div>
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center justify-between">
                       <div className="flex items-center gap-3">
                         <span className="text-xs font-mono text-zinc-500">{anomaly.id}</span>
                         <Badge className={`
                           ${anomaly.severity === 'high' ? 'bg-red-500/10 text-red-500 border-red-500/20' :
                             anomaly.severity === 'medium' ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' :
                             'bg-blue-500/10 text-blue-500 border-blue-500/20'}
                           text-[10px] uppercase font-bold tracking-widest px-2 py-0.5
                         `}>
                           {anomaly.type}
                         </Badge>
                       </div>
                       <span className="text-[10px] text-zinc-500 font-bold">{anomaly.time}</span>
                    </div>
                    <p className="text-sm text-zinc-200">{anomaly.description}</p>
                    <div className="flex items-center justify-between pt-2">
                       <div className="flex gap-4">
                          <button className="text-[10px] font-bold text-orange-500 uppercase tracking-widest hover:underline">Voir Snapshot HD</button>
                          <button className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest hover:underline">Journal Complet</button>
                       </div>
                       {anomaly.status === 'resolved' ? (
                         <div className="flex items-center gap-1.5 text-green-500 text-[10px] font-bold uppercase tracking-widest">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Résolu
                         </div>
                       ) : (
                         <Button size="sm" variant="outline" className="h-7 text-[10px] border-zinc-800 text-white uppercase font-bold">Résoudre</Button>
                       )}
                    </div>
                  </div>
               </div>
             </Card>
           ))}
        </div>

        <div className="space-y-6">
           <Card className="p-6 bg-zinc-900/50 border-zinc-800 space-y-6">
              <div className="flex items-center gap-2 border-b border-zinc-800 pb-4">
                 <Settings className="w-5 h-5 text-orange-500" />
                 <h3 className="text-sm font-bold text-white uppercase tracking-widest">Actions Correctives</h3>
              </div>
              <div className="space-y-4">
                 <Button variant="outline" className="w-full justify-start gap-3 border-zinc-800 h-12 text-xs text-white hover:bg-zinc-800">
                    <RefreshCcw className="w-4 h-4 text-orange-500" /> Recalibrer les Seuils IA
                 </Button>
                 <Button variant="outline" className="w-full justify-start gap-3 border-zinc-800 h-12 text-xs text-white hover:bg-zinc-800">
                    <Sun className="w-4 h-4 text-yellow-500" /> Ajuster Compensation Expo
                 </Button>
                 <Button variant="outline" className="w-full justify-start gap-3 border-zinc-800 h-12 text-xs text-white hover:bg-zinc-800">
                    <Clock className="w-4 h-4 text-blue-500" /> Resynchroniser Horloge Caméra
                 </Button>
                 <Button className="w-full gap-3 bg-red-950/20 text-red-500 border border-red-900/50 h-12 text-xs font-bold uppercase tracking-widest hover:bg-red-950/40">
                    <AlertTriangle className="w-4 h-4" /> Forcer Redémarrage Moteur IA
                 </Button>
              </div>
           </Card>

           <Card className="p-5 bg-orange-600/5 border border-orange-500/20">
              <div className="flex items-center gap-2 text-orange-500 mb-3">
                 <Zap className="w-4 h-4" />
                 <h4 className="text-[10px] font-bold uppercase tracking-widest">Résumé IA</h4>
              </div>
              <p className="text-[11px] text-zinc-400 leading-relaxed italic mb-4">
                La majorité des anomalies récentes (72%) proviennent de variations brusques d'éclairage. Envisagez l'ajout d'une source lumineuse fixe sur la zone de détection.
              </p>
              <Button variant="link" className="p-0 text-orange-500 text-[10px] font-bold uppercase h-auto">En savoir plus sur l'optimisation →</Button>
           </Card>
        </div>
      </div>
    </div>
  );
}

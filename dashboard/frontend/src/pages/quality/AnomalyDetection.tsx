import { useCallback, useEffect, useState } from 'react';
import { AlertTriangle, RefreshCcw, Zap, Clock, CheckCircle2, Filter, Eye, Settings, Loader2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { fetchApi, API_URL } from '@/lib/api';

interface Anomaly {
  id: string;
  type: string;
  time: string;
  severity: 'low' | 'medium' | 'high';
  description: string;
  thumbnail?: string | null;
  status: string;
}

export default function AnomalyDetection() {
  const [anomalies, setAnomalies] = useState<Anomaly[]>([]);
  const [loading, setLoading] = useState(true);

  const loadAnomalies = useCallback(async () => {
    try {
      setLoading(true);
      const data = await fetchApi('/api/quality/anomalies?limit=80') as { items: Anomaly[] };
      setAnomalies(data.items || []);
    } catch (err) {
      console.error('Error fetching anomalies:', err);
      setAnomalies([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadAnomalies(); }, [loadAnomalies]);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Détection des Anomalies</h1>
          <p className="text-muted-foreground">Incidents qualité générés depuis les logs réels (rejets & faibles scores).</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="border-zinc-800 text-white gap-2" onClick={loadAnomalies}>
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCcw className="w-4 h-4" />} Actualiser
          </Button>
          <Button className="bg-orange-600 hover:bg-orange-700 text-white gap-2" disabled>
            <CheckCircle2 className="w-4 h-4" /> Marquer Tout comme Résolu
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          {loading ? (
            <Card className="p-6 bg-zinc-900/50 border-zinc-800 text-zinc-500">Chargement des anomalies...</Card>
          ) : anomalies.length === 0 ? (
            <Card className="p-6 bg-zinc-900/50 border-zinc-800 text-zinc-500">Aucune anomalie détectée.</Card>
          ) : (
            anomalies.map((anomaly) => (
              <Card key={anomaly.id} className="p-5 bg-zinc-900/50 border-zinc-800 hover:border-zinc-700 transition-all group">
                <div className="flex gap-6">
                  <div className="w-32 h-24 rounded-lg overflow-hidden border border-zinc-800 shrink-0 relative">
                    {anomaly.thumbnail ? (
                      <img src={anomaly.thumbnail.startsWith('http') ? anomaly.thumbnail : `${API_URL}${anomaly.thumbnail}`} alt="Anomaly" className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all" />
                    ) : (
                      <div className="w-full h-full bg-zinc-800 flex items-center justify-center text-zinc-500 text-xs">No snapshot</div>
                    )}
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <Eye className="w-5 h-5 text-white" />
                    </div>
                  </div>
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-mono text-zinc-500">{anomaly.id}</span>
                        <Badge className={`${anomaly.severity === 'high' ? 'bg-red-500/10 text-red-500 border-red-500/20' : anomaly.severity === 'medium' ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' : 'bg-blue-500/10 text-blue-500 border-blue-500/20'} text-[10px] uppercase font-bold tracking-widest px-2 py-0.5`}>
                          {anomaly.type}
                        </Badge>
                      </div>
                      <span className="text-[10px] text-zinc-500 font-bold">{anomaly.time}</span>
                    </div>
                    <p className="text-sm text-zinc-200">{anomaly.description}</p>
                    <div className="flex items-center justify-end pt-2">
                      <Button size="sm" variant="outline" className="h-7 text-[10px] border-zinc-800 text-white uppercase font-bold" disabled>Résoudre</Button>
                    </div>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>

        <div className="space-y-6">
          <Card className="p-6 bg-zinc-900/50 border-zinc-800 space-y-6">
            <div className="flex items-center gap-2 border-b border-zinc-800 pb-4"><Settings className="w-5 h-5 text-orange-500" /><h3 className="text-sm font-bold text-white uppercase tracking-widest">Actions Correctives</h3></div>
            <div className="space-y-4">
              <Button variant="outline" className="w-full justify-start gap-3 border-zinc-800 h-12 text-xs text-white hover:bg-zinc-800" disabled><Filter className="w-4 h-4 text-orange-500" /> Ajuster filtres qualité</Button>
              <Button variant="outline" className="w-full justify-start gap-3 border-zinc-800 h-12 text-xs text-white hover:bg-zinc-800" disabled><Clock className="w-4 h-4 text-blue-500" /> Réviser les cas &lt; 0.60</Button>
              <Button className="w-full gap-3 bg-red-950/20 text-red-500 border border-red-900/50 h-12 text-xs font-bold uppercase tracking-widest hover:bg-red-950/40" disabled><AlertTriangle className="w-4 h-4" /> Forcer Redémarrage Moteur IA</Button>
            </div>
          </Card>

          <Card className="p-5 bg-orange-600/5 border border-orange-500/20">
            <div className="flex items-center gap-2 text-orange-500 mb-3"><Zap className="w-4 h-4" /><h4 className="text-[10px] font-bold uppercase tracking-widest">Résumé IA</h4></div>
            <p className="text-[11px] text-zinc-400 leading-relaxed italic mb-1">Les anomalies sont générées automatiquement à partir des sacs rejetés et des faibles confiances.</p>
          </Card>
        </div>
      </div>
    </div>
  );
}

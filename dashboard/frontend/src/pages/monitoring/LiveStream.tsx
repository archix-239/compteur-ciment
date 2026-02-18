import { useState, useEffect, useRef } from 'react';
import { API_URL, WS_URL } from '@/lib/api';
import { useVideoStream } from '@/hooks/useVideoStream';
import { Camera, Activity, Shield, AlertCircle, Maximize2, RefreshCcw } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/PageHeader';
import { StatusBadge } from '@/components/StatusBadge';

export default function LiveStream() {
  const imgRef = useRef<HTMLImageElement>(null);
  const { status: streamStatus, fps, reconnect } = useVideoStream(imgRef, true);

  const [stats, setStats] = useState({
    detectedObjects: 0,
    verifiedBags: 0,
    rejectedBags: 0
  });

  useEffect(() => {
    // Initial fetch for stats
    fetch(`${API_URL}/api/dashboard/summary`)
      .then(res => res.json())
      .then(data => {
        setStats(prev => ({
          ...prev,
          verifiedBags: data.totalBags,
          rejectedBags: data.rejectedBags
        }));
      })
      .catch(() => {});

    // WebSocket for live count updates
    const ws = new WebSocket(WS_URL);
    ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      if (message.type === 'COUNT_EVENT') {
        const eventData = message.data;
        setStats(prev => ({
          ...prev,
          verifiedBags: eventData.session_stats.total,
          rejectedBags: eventData.session_stats.rejected
        }));
      }
    };

    return () => ws.close();
  }, []);

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Visualisation en Direct"
        description="Surveillance temps réel et overlay de détection IA"
        breadcrumbs={[{ label: 'Monitoring' }, { label: 'Flux en Direct' }]}
      >
        <StatusBadge
          status={streamStatus}
          label={streamStatus === 'online' ? 'EN LIGNE' : streamStatus === 'connecting' ? 'CONNEXION...' : 'HORS LIGNE'}
        />
        <Button variant="outline" size="sm" className="gap-2 border-zinc-800 text-white" onClick={reconnect}>
          <RefreshCcw className="w-4 h-4" /> Reconnexion
        </Button>
      </PageHeader>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 space-y-4">
          <Card className="relative aspect-video bg-black overflow-hidden border-orange-500/20 group">
            {/* Flux vidéo via WebSocket */}
            <img
              ref={imgRef}
              alt="Live Stream"
              className="absolute inset-0 w-full h-full object-contain"
              style={{ display: streamStatus === 'online' ? 'block' : 'none' }}
            />

            {/* Placeholder quand offline */}
            {streamStatus !== 'online' && (
              <div className="absolute inset-0 flex items-center justify-center text-orange-500/20 pointer-events-none">
                <Camera className="w-20 h-20 opacity-20" />
              </div>
            )}

            {/* Ligne Virtuelle */}
            <div className="absolute inset-y-0 left-1/2 w-0.5 bg-yellow-400/50 shadow-[0_0_10px_rgba(250,204,21,0.5)]">
              <div className="absolute top-4 -translate-x-1/2 bg-yellow-400 text-black text-[10px] font-bold px-1 rounded">
                LIGNE DE COMPTAGE
              </div>
            </div>

            {/* Infos Caméra */}
            <div className="absolute top-4 left-4 flex flex-col gap-2">
              <div className="bg-black/60 backdrop-blur-md border border-white/10 p-2 rounded text-[10px] font-mono">
                <div className="text-orange-400">CAM_01 // CONVOYEUR_FRONTAL</div>
                <div className="text-white/60">1280x720 @ {fps} FPS</div>
              </div>
            </div>

            {/* Stats Overlay */}
            <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-md border border-white/10 p-3 rounded">
              <div className="flex items-center gap-4 text-xs font-mono">
                <div>
                  <div className="text-white/40 mb-1 text-[8px]">FPS</div>
                  <div className={`font-bold ${fps > 0 ? 'text-green-400' : 'text-red-400'}`}>{fps}</div>
                </div>
                <div className="w-px h-8 bg-white/10" />
                <div>
                  <div className="text-white/40 mb-1 text-[8px]">STATUT</div>
                  <div className={`font-bold uppercase text-[10px] ${streamStatus === 'online' ? 'text-green-400' : 'text-red-400'}`}>
                    {streamStatus === 'online' ? 'LIVE' : streamStatus === 'connecting' ? '...' : 'OFF'}
                  </div>
                </div>
              </div>
            </div>

            {/* Compteurs Bas HUD */}
            <div className="absolute bottom-6 inset-x-6 flex items-end justify-between">
              <div className="flex gap-4">
                <div className="bg-black/60 backdrop-blur-md border border-green-500/30 p-3 rounded text-white min-w-[100px]">
                  <div className="text-[10px] text-green-400 font-bold mb-1 uppercase tracking-wider">Vérifiés</div>
                  <div className="text-2xl font-bold font-mono">{stats.verifiedBags}</div>
                </div>
                <div className="bg-black/60 backdrop-blur-md border border-red-500/30 p-3 rounded text-white min-w-[100px]">
                  <div className="text-[10px] text-red-400 font-bold mb-1 uppercase tracking-wider">Rejetés</div>
                  <div className="text-2xl font-bold font-mono">{stats.rejectedBags}</div>
                </div>
              </div>
              <Button variant="ghost" size="icon" className="text-white/40 hover:text-white bg-black/40">
                <Maximize2 className="w-5 h-5" />
              </Button>
            </div>
          </Card>

          <div className="grid grid-cols-3 gap-4">
            <Card className="p-4 bg-card/50 border-zinc-800">
              <div className="text-[10px] text-muted-foreground mb-1 uppercase font-bold">Modèle Actif</div>
              <div className="font-semibold text-white">YOLOv8-Custom</div>
            </Card>
            <Card className="p-4 bg-card/50 border-zinc-800">
              <div className="text-[10px] text-muted-foreground mb-1 uppercase font-bold">FPS Stream</div>
              <div className="font-semibold text-white">{fps} fps</div>
            </Card>
            <Card className="p-4 bg-card/50 border-zinc-800">
              <div className="text-[10px] text-muted-foreground mb-1 uppercase font-bold">Zone de Détection</div>
              <div className="font-semibold text-white">640px (Vertical)</div>
            </Card>
          </div>
        </div>

        {/* Panneau Latéral */}
        <div className="space-y-6">
          <Card className="p-4 space-y-4 bg-card/50 border-zinc-800">
            <div className="flex items-center gap-2 font-semibold text-white">
              <Activity className="w-4 h-4 text-orange-500" />
              <span>Détails de Session</span>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Début</span>
                <span className="text-zinc-300">10:45</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Durée</span>
                <span className="text-zinc-300">02:15:22</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Débit Moyen</span>
                <span className="text-zinc-300">28.4 sacs/min</span>
              </div>
            </div>
          </Card>

          <Card className="p-4 space-y-4 border-red-500/20 bg-red-500/5">
            <div className="flex items-center gap-2 font-semibold text-red-400">
              <AlertCircle className="w-4 h-4" />
              <span>Alertes Récentes</span>
            </div>
            <div className="space-y-3">
              <div className="text-xs border-l-2 border-red-500 pl-2 py-1">
                <div className="font-medium text-red-300">Code QR manquant</div>
                <div className="text-red-400/60">Sac #405 - il y a 2 min</div>
              </div>
              <div className="text-xs border-l-2 border-yellow-500 pl-2 py-1">
                <div className="font-medium text-yellow-300">Variation d'éclairage</div>
                <div className="text-yellow-400/60">Capteurs ajustés - il y a 15 min</div>
              </div>
            </div>
            <Button variant="ghost" className="w-full text-[10px] text-zinc-500 hover:text-white" size="sm">VOIR TOUTES LES ALERTES</Button>
          </Card>
        </div>
      </div>
    </div>
  );
}

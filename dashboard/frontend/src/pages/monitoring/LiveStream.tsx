import { useState, useEffect } from 'react';
import { Camera, Activity, Shield, AlertCircle, Maximize2, RefreshCcw } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/PageHeader';
import { StatusBadge } from '@/components/StatusBadge';

export default function LiveStream() {
  const [streamStatus, setStreamStatus] = useState<'online' | 'offline' | 'connecting'>('connecting');
  const [stats, setStats] = useState({
    fps: 0,
    latency: 0,
    detectedObjects: 0,
    verifiedBags: 0,
    rejectedBags: 0
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setStats({
        fps: 24 + Math.floor(Math.random() * 5),
        latency: 45 + Math.floor(Math.random() * 20),
        detectedObjects: Math.floor(Math.random() * 4),
        verifiedBags: 142,
        rejectedBags: 12
      });
      setStreamStatus('online');
    }, 1000);
    return () => clearInterval(interval);
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
        <Button variant="outline" size="sm" className="gap-2 border-zinc-800 text-white">
          <RefreshCcw className="w-4 h-4" /> Reconnexion
        </Button>
      </PageHeader>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 space-y-4">
          <Card className="relative aspect-video bg-black overflow-hidden border-orange-500/20 group">
            {/* Simulation de flux vidéo */}
            <div className="absolute inset-0 flex items-center justify-center text-orange-500/20">
              <Camera className="w-20 h-20 opacity-20" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />
            </div>

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
                <div className="text-white/60">1280x720 @ {stats.fps} FPS</div>
              </div>
            </div>

            {/* Stats Overlay */}
            <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-md border border-white/10 p-3 rounded">
              <div className="flex items-center gap-4 text-xs font-mono">
                <div>
                  <div className="text-white/40 mb-1 text-[8px]">LATENCE</div>
                  <div className="text-green-400 font-bold">{stats.latency}ms</div>
                </div>
                <div className="w-px h-8 bg-white/10" />
                <div>
                  <div className="text-white/40 mb-1 text-[8px]">OBJETS</div>
                  <div className="text-orange-400 font-bold">{stats.detectedObjects}</div>
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

            {/* Overlay Détection (Simulation) */}
            <div className="absolute top-1/3 left-1/4 w-32 h-40 border-2 border-green-500 rounded animate-pulse">
              <div className="absolute -top-6 left-0 bg-green-500 text-black text-[10px] font-bold px-1 flex items-center gap-1">
                <Shield className="w-3 h-3" /> ID:402 [VÉRIFIÉ]
              </div>
              <div className="absolute -bottom-6 left-0 text-[10px] font-mono text-green-400 bg-black/60 px-1">
                L:0.92 C:0.88
              </div>
            </div>
          </Card>

          <div className="grid grid-cols-3 gap-4">
            <Card className="p-4 bg-card/50 border-zinc-800">
              <div className="text-[10px] text-muted-foreground mb-1 uppercase font-bold">Modèle Actif</div>
              <div className="font-semibold text-white">YOLOv11-Custom</div>
            </Card>
            <Card className="p-4 bg-card/50 border-zinc-800">
              <div className="text-[10px] text-muted-foreground mb-1 uppercase font-bold">Temps d'Inférence</div>
              <div className="font-semibold text-white">12ms</div>
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

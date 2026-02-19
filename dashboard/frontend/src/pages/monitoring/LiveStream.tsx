import { useState, useEffect, useRef, useCallback } from 'react';
import { API_URL, WS_URL } from '@/lib/api';
import { useVideoStream } from '@/hooks/useVideoStream';
import { Camera, Activity, Shield, AlertCircle, Maximize2, RefreshCcw } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/PageHeader';
import { StatusBadge } from '@/components/StatusBadge';

interface RuntimeInfo {
  camera_name: string;
  model: string;
  capture_fps: number;
  line?: {
    type: 'horizontal' | 'vertical';
    direction: 'top-down' | 'bottom-up' | 'left-right' | 'right-left';
    position_percent: number;
    line_span_percent: number;
  };
}

export default function LiveStream() {
  const imgRef = useRef<HTMLImageElement>(null);
  const { status: streamStatus, fps, reconnect } = useVideoStream(imgRef, true);

  const [stats, setStats] = useState({ detectedObjects: 0, verifiedBags: 0, rejectedBags: 0 });
  const [runtime, setRuntime] = useState<RuntimeInfo | null>(null);

  const loadRuntime = useCallback(() => {
    fetch(`${API_URL}/api/config/runtime`).then((r) => r.json()).then(setRuntime).catch(() => {});
  }, []);

  useEffect(() => {
    fetch(`${API_URL}/api/dashboard/summary`).then(res => res.json()).then(data => {
      setStats(prev => ({ ...prev, verifiedBags: data.totalBags, rejectedBags: data.rejectedBags }));
    }).catch(() => {});

    loadRuntime();
    const runtimeTimer = setInterval(loadRuntime, 4000);

    const ws = new WebSocket(WS_URL);
    ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      if (message.type === 'COUNT_EVENT') {
        const eventData = message.data;
        setStats(prev => ({ ...prev, verifiedBags: eventData.session_stats.total, rejectedBags: eventData.session_stats.rejected }));
      }
    };

    return () => {
      ws.close();
      clearInterval(runtimeTimer);
    };
  }, [loadRuntime]);

  const line = runtime?.line;
  const isVertical = line?.type === 'vertical';

  return (
    <div className="p-6 space-y-6">
      <PageHeader title="Visualisation en Direct" description="Surveillance temps réel et overlay de détection IA" breadcrumbs={[{ label: 'Monitoring' }, { label: 'Flux en Direct' }]}>
        <StatusBadge status={streamStatus} label={streamStatus === 'online' ? 'EN LIGNE' : streamStatus === 'connecting' ? 'CONNEXION...' : 'HORS LIGNE'} />
        <Button variant="outline" size="sm" className="gap-2 border-zinc-800 text-white" onClick={reconnect}><RefreshCcw className="w-4 h-4" /> Reconnexion</Button>
      </PageHeader>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 space-y-4">
          <Card className="relative aspect-video bg-black overflow-hidden border-orange-500/20 group">
            <img ref={imgRef} alt="Live Stream" className="absolute inset-0 w-full h-full object-contain" style={{ display: streamStatus === 'online' ? 'block' : 'none' }} />

            {streamStatus !== 'online' && <div className="absolute inset-0 flex items-center justify-center text-orange-500/20 pointer-events-none"><Camera className="w-20 h-20 opacity-20" /></div>}

            {/* Overlay FRONTEND unique */}
            {line && isVertical && (
              <div className="absolute inset-y-0 w-0.5 bg-yellow-400/70 shadow-[0_0_10px_rgba(250,204,21,0.7)]" style={{ left: `${line.position_percent}%` }} />
            )}
            {line && !isVertical && (
              <div className="absolute inset-x-0 h-0.5 bg-yellow-400/70 shadow-[0_0_10px_rgba(250,204,21,0.7)]" style={{ top: `${line.position_percent}%` }} />
            )}

            <div className="absolute top-4 left-4 flex flex-col gap-2">
              <div className="bg-black/60 backdrop-blur-md border border-white/10 p-2 rounded text-[10px] font-mono">
                <div className="text-orange-400">{runtime?.camera_name || 'CAM_UNKNOWN'}</div>
                <div className="text-white/60">{runtime?.model || 'models/best_V5.pt'}</div>
                <div className="text-white/60">Capture: {runtime?.capture_fps ?? 0} FPS · Stream: {fps} FPS</div>
              </div>
            </div>

            <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-md border border-white/10 p-3 rounded">
              <div className="flex items-center gap-4 text-xs font-mono">
                <div><div className="text-white/40 mb-1 text-[8px]">FPS</div><div className={`font-bold ${fps > 0 ? 'text-green-400' : 'text-red-400'}`}>{fps}</div></div>
                <div className="w-px h-8 bg-white/10" />
                <div><div className="text-white/40 mb-1 text-[8px]">STATUT</div><div className={`font-bold uppercase text-[10px] ${streamStatus === 'online' ? 'text-green-400' : 'text-red-400'}`}>{streamStatus === 'online' ? 'LIVE' : streamStatus === 'connecting' ? '...' : 'OFF'}</div></div>
              </div>
            </div>

            <div className="absolute bottom-6 inset-x-6 flex items-end justify-between">
              <div className="flex gap-4">
                <div className="bg-black/60 backdrop-blur-md border border-green-500/30 p-3 rounded text-white min-w-[100px]"><div className="text-[10px] text-green-400 font-bold mb-1 uppercase tracking-wider">Vérifiés</div><div className="text-2xl font-bold font-mono">{stats.verifiedBags}</div></div>
                <div className="bg-black/60 backdrop-blur-md border border-red-500/30 p-3 rounded text-white min-w-[100px]"><div className="text-[10px] text-red-400 font-bold mb-1 uppercase tracking-wider">Rejetés</div><div className="text-2xl font-bold font-mono">{stats.rejectedBags}</div></div>
              </div>
              <Button variant="ghost" size="icon" className="text-white/40 hover:text-white bg-black/40"><Maximize2 className="w-5 h-5" /></Button>
            </div>
          </Card>

          <div className="grid grid-cols-3 gap-4">
            <Card className="p-4 bg-card/50 border-zinc-800"><div className="flex items-center gap-2 text-xs text-zinc-500 uppercase"><Activity className="w-4 h-4 text-orange-500" /> Objet détectés</div><div className="text-2xl font-bold text-white mt-2">{stats.detectedObjects}</div></Card>
            <Card className="p-4 bg-card/50 border-zinc-800"><div className="flex items-center gap-2 text-xs text-zinc-500 uppercase"><Shield className="w-4 h-4 text-green-500" /> Sacs vérifiés</div><div className="text-2xl font-bold text-white mt-2">{stats.verifiedBags}</div></Card>
            <Card className="p-4 bg-card/50 border-zinc-800"><div className="flex items-center gap-2 text-xs text-zinc-500 uppercase"><AlertCircle className="w-4 h-4 text-red-500" /> Rejetés</div><div className="text-2xl font-bold text-white mt-2">{stats.rejectedBags}</div></Card>
          </div>
        </div>
      </div>
    </div>
  );
}

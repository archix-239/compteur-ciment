import { useState, useEffect } from 'react';
import { Camera, Activity, Shield, AlertCircle, Maximize2, RefreshCcw } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Live Stream Viewer</h1>
          <p className="text-muted-foreground">Real-time monitoring and AI detection overlay</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant={streamStatus === 'online' ? 'default' : 'destructive'} className="flex items-center gap-1 px-3 py-1">
            <div className={`w-2 h-2 rounded-full ${streamStatus === 'online' ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`} />
            {streamStatus.toUpperCase()}
          </Badge>
          <Button variant="outline" size="sm" className="gap-2">
            <RefreshCcw className="w-4 h-4" /> Reconnect
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 space-y-4">
          <Card className="relative aspect-video bg-black overflow-hidden border-orange-500/20 group">
            <div className="absolute inset-0 flex items-center justify-center text-orange-500/20">
              <Camera className="w-20 h-20 opacity-20" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />
            </div>
            <div className="absolute inset-y-0 left-1/2 w-0.5 bg-yellow-400/50">
              <div className="absolute top-4 -translate-x-1/2 bg-yellow-400 text-black text-[10px] font-bold px-1 rounded">COUNT LINE</div>
            </div>
            <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-md border border-white/10 p-2 rounded text-[10px] font-mono">
              <div className="text-orange-400">CAM_01 // FRONT_CONVEYOR</div>
              <div className="text-white/60">1280x720 @ {stats.fps} FPS</div>
            </div>
            <div className="absolute bottom-6 inset-x-6 flex items-end justify-between">
              <div className="flex gap-4">
                <div className="bg-black/60 backdrop-blur-md border border-green-500/30 p-3 rounded text-white">
                  <div className="text-[10px] text-green-400 font-bold mb-1 uppercase tracking-wider">Verified</div>
                  <div className="text-2xl font-bold font-mono">{stats.verifiedBags}</div>
                </div>
                <div className="bg-black/60 backdrop-blur-md border border-red-500/30 p-3 rounded text-white">
                  <div className="text-[10px] text-red-400 font-bold mb-1 uppercase tracking-wider">Rejected</div>
                  <div className="text-2xl font-bold font-mono">{stats.rejectedBags}</div>
                </div>
              </div>
            </div>
            <div className="absolute top-1/3 left-1/4 w-32 h-40 border-2 border-green-500 rounded animate-pulse">
              <div className="absolute -top-6 left-0 bg-green-500 text-black text-[10px] font-bold px-1 flex items-center gap-1">
                <Shield className="w-3 h-3" /> ID:402 [VERIFIED]
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

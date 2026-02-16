import {
  Cpu,
  HardDrive,
  Activity,
  Video,
  Server,
  Zap,
  RefreshCw,
  Power,
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  Settings
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

export default function DeviceManagement() {
  const devices = [
    { name: "Camera Principal (Convoyeur)", status: "online", type: "RTSP", ip: "192.168.1.10", latency: "42ms" },
    { name: "Camera Grand Angle (Hall)", status: "online", type: "USB", ip: "Local", latency: "12ms" },
    { name: "Camera Contrôle Qualité", status: "offline", type: "RTSP", ip: "192.168.1.12", latency: "--" },
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Gestion des Appareils</h1>
          <p className="text-muted-foreground">Monitorage du matériel et contrôle des services d'acquisition</p>
        </div>
        <div className="flex gap-2">
           <Button variant="outline" className="border-zinc-800 text-white gap-2">
             <RefreshCw className="w-4 h-4" /> Actualiser
           </Button>
           <Button className="bg-red-600 hover:bg-red-700 text-white gap-2">
             <Power className="w-4 h-4" /> Arrêt d'Urgence
           </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Hardware Status */}
        <div className="lg:col-span-2 space-y-6">
           <Card className="p-6 bg-zinc-900/50 border-zinc-800 space-y-6">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
                 <div className="flex items-center gap-2">
                    <Server className="w-5 h-5 text-orange-500" />
                    <h3 className="text-sm font-bold text-white uppercase tracking-widest">Serveur Edge-IA</h3>
                 </div>
                 <Badge className="bg-green-500/10 text-green-500 border-green-500/20 font-bold">STABLE</Badge>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                 <div className="space-y-3">
                    <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                       <span>CPU Usage (Intel i9)</span>
                       <span className="text-white">42%</span>
                    </div>
                    <Progress value={42} className="h-1.5 bg-zinc-800" />
                    <p className="text-[10px] text-zinc-500 italic">Temp: 52°C</p>
                 </div>
                 <div className="space-y-3">
                    <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                       <span>GPU Usage (RTX 4090)</span>
                       <span className="text-orange-500">78%</span>
                    </div>
                    <Progress value={78} className="h-1.5 bg-zinc-800 [&>div]:bg-orange-500" />
                    <p className="text-[10px] text-zinc-500 italic">VRAM: 12GB / 24GB</p>
                 </div>
                 <div className="space-y-3">
                    <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                       <span>RAM (DDR5)</span>
                       <span className="text-white">14.2 GB</span>
                    </div>
                    <Progress value={45} className="h-1.5 bg-zinc-800" />
                    <p className="text-[10px] text-zinc-500 italic">Total: 32 GB</p>
                 </div>
              </div>
           </Card>

           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {devices.map((device, i) => (
                <Card key={i} className="p-5 bg-zinc-900/50 border-zinc-800 hover:border-zinc-700 transition-all">
                   <div className="flex items-start justify-between">
                      <div className="flex gap-4">
                         <div className={`p-3 rounded-xl ${device.status === 'online' ? 'bg-zinc-950 text-orange-500' : 'bg-zinc-950 text-zinc-700'} border border-zinc-800`}>
                            <Video className="w-5 h-5" />
                         </div>
                         <div className="space-y-1">
                            <h4 className="text-sm font-bold text-white">{device.name}</h4>
                            <div className="flex gap-3">
                               <span className="text-[10px] text-zinc-500 font-mono uppercase">{device.ip}</span>
                               <span className="text-[10px] text-zinc-500 font-mono uppercase">{device.type}</span>
                            </div>
                         </div>
                      </div>
                      {device.status === 'online' ? (
                        <div className="flex items-center gap-1.5">
                           <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                           <span className="text-[9px] font-bold text-green-500 uppercase">LIVE</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5">
                           <div className="w-2 h-2 rounded-full bg-red-500" />
                           <span className="text-[9px] font-bold text-red-500 uppercase">OFFLINE</span>
                        </div>
                      )}
                   </div>
                   <div className="flex items-center justify-between mt-6 pt-4 border-t border-zinc-800/50">
                      <div className="text-[10px] text-zinc-500">Latence: <span className="text-white font-mono">{device.latency}</span></div>
                      <div className="flex gap-2">
                         <Button variant="ghost" size="icon" className="h-7 w-7 text-zinc-500 hover:text-white"><Settings className="w-3.5 h-3.5" /></Button>
                         <Button variant="ghost" size="icon" className="h-7 w-7 text-zinc-500 hover:text-orange-500"><RefreshCw className="w-3.5 h-3.5" /></Button>
                      </div>
                   </div>
                </Card>
              ))}
           </div>
        </div>

        <div className="space-y-6">
           <Card className="p-6 bg-zinc-900/50 border-zinc-800 space-y-6">
              <div className="flex items-center gap-2 border-b border-zinc-800 pb-4">
                 <Zap className="w-5 h-5 text-orange-500" />
                 <h3 className="text-sm font-bold text-white uppercase tracking-widest">Services IA</h3>
              </div>
              <div className="space-y-4">
                 {[
                   { name: "Inférence YOLO", status: "running" },
                   { name: "Flux RTSP Proxy", status: "running" },
                   { name: "WebSocket Server", status: "running" },
                   { name: "Database Worker", status: "warning" },
                 ].map((service, i) => (
                   <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-zinc-950 border border-zinc-800">
                      <div className="flex flex-col">
                         <span className="text-xs font-medium text-white">{service.name}</span>
                         <span className={`text-[9px] font-bold uppercase ${service.status === 'running' ? 'text-green-500' : 'text-yellow-500'}`}>
                           {service.status}
                         </span>
                      </div>
                      <Button variant="outline" size="icon" className="h-8 w-8 border-zinc-800 hover:bg-zinc-800">
                         <RefreshCw className="w-3.5 h-3.5 text-zinc-500" />
                      </Button>
                   </div>
                 ))}
              </div>
           </Card>

           <Card className="p-5 bg-red-950/10 border border-red-900/30 space-y-4">
              <div className="flex items-center gap-2 text-red-500">
                 <AlertTriangle className="w-5 h-5" />
                 <h4 className="text-[10px] font-bold uppercase tracking-widest">Alertes Ressources</h4>
              </div>
              <p className="text-[11px] text-zinc-400 leading-relaxed italic">
                L'utilisation du disque (SATA-1) dépasse les 85%. Un nettoyage automatique sera déclenché dans 2 heures.
              </p>
              <Button className="w-full bg-red-900/20 text-red-400 border border-red-900/50 h-10 text-[10px] font-bold uppercase hover:bg-red-900/40">Vider le Cache Immédiatement</Button>
           </Card>
        </div>
      </div>
    </div>
  );
}

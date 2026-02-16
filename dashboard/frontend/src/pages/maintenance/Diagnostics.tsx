import {
  Terminal,
  Search,
  Play,
  FileText,
  HardDrive,
  Cpu,
  Activity,
  AlertTriangle,
  CheckCircle2,
  Trash2,
  Download,
  Info,
  ShieldCheck,
  Video,
  Zap,
  Gauge
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function Diagnostics() {
  const logs = [
    { time: "10:20:01", type: "INFO", message: "YOLO Inference Engine started successfully (v11.0.4)" },
    { time: "10:20:05", type: "DEBUG", message: "GPU Temperature: 62°C | Power: 145W" },
    { time: "10:20:12", type: "SUCCESS", message: "Frame capture sync with Camera-01 established" },
    { time: "10:21:45", type: "WARN", message: "Detection confidence dropped below 0.65 for Frame #1420" },
    { time: "10:22:10", type: "ERROR", message: "Failed to upload snapshot to S3: Network Timeout" },
    { time: "10:22:15", type: "INFO", message: "Retrying S3 upload in 5000ms..." },
    { time: "10:25:00", type: "SUCCESS", message: "S3 upload successful (Batch #42)" },
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Outils Diagnostic</h1>
          <p className="text-muted-foreground">Tests de performance, benchmarcking et console de débogage avancée</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="border-zinc-800 text-white gap-2">
            <Download className="w-4 h-4" /> Télécharger Logs (24h)
          </Button>
          <Button className="bg-orange-600 hover:bg-orange-700 text-white gap-2">
            <Play className="w-4 h-4" /> Lancer Diagnostic Complet
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4 bg-zinc-900/50 border-zinc-800">
           <div className="flex items-center gap-2 text-zinc-500 font-bold text-[10px] uppercase mb-2">
             <Cpu className="w-3 h-3 text-orange-500" /> IA Latence
           </div>
           <div className="text-xl font-bold text-white">12.4 <span className="text-xs text-zinc-500">ms</span></div>
           <Badge className="bg-green-500/10 text-green-500 border-green-500/20 mt-2 text-[8px] uppercase">Excellent</Badge>
        </Card>
        <Card className="p-4 bg-zinc-900/50 border-zinc-800">
           <div className="flex items-center gap-2 text-zinc-500 font-bold text-[10px] uppercase mb-2">
             <Activity className="w-3 h-3 text-blue-500" /> FPS Réel
           </div>
           <div className="text-xl font-bold text-white">28.4 <span className="text-xs text-zinc-500">fps</span></div>
           <p className="text-[10px] text-zinc-500 mt-2 italic">Cible: 30 fps</p>
        </Card>
        <Card className="p-4 bg-zinc-900/50 border-zinc-800">
           <div className="flex items-center gap-2 text-zinc-500 font-bold text-[10px] uppercase mb-2">
             <Gauge className="w-3 h-3 text-yellow-500" /> GPU Load
           </div>
           <div className="text-xl font-bold text-white">68.2 <span className="text-xs text-zinc-500">%</span></div>
           <p className="text-[10px] text-zinc-500 mt-2 italic">Temp: 58°C</p>
        </Card>
        <Card className="p-4 bg-zinc-900/50 border-zinc-800">
           <div className="flex items-center gap-2 text-zinc-500 font-bold text-[10px] uppercase mb-2">
             <Info className="w-3 h-3 text-zinc-500" /> Précision
           </div>
           <div className="text-xl font-bold text-white">99.8 <span className="text-xs text-zinc-500">%</span></div>
           <p className="text-[10px] text-zinc-500 mt-2 italic">Dernier Test</p>
        </Card>
      </div>

      <Tabs defaultValue="logs" className="space-y-4">
        <TabsList className="bg-zinc-900 border border-zinc-800 p-1">
          <TabsTrigger value="logs" className="gap-2">
            <Terminal className="w-4 h-4" /> Console Système
          </TabsTrigger>
          <TabsTrigger value="tests" className="gap-2">
            <ShieldCheck className="w-4 h-4" /> Tests de Performance
          </TabsTrigger>
          <TabsTrigger value="bench" className="gap-2">
            <Zap className="w-4 h-4" /> IA Benchmark
          </TabsTrigger>
        </TabsList>

        <TabsContent value="logs" className="space-y-4">
          <Card className="bg-zinc-950 border-zinc-800 overflow-hidden font-mono text-xs">
             <div className="p-3 border-b border-zinc-800 bg-zinc-900/50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                   <div className="flex gap-1.5">
                     <div className="w-2.5 h-2.5 rounded-full bg-red-500/50" />
                     <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/50" />
                     <div className="w-2.5 h-2.5 rounded-full bg-green-500/50" />
                   </div>
                   <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">Live Kernel Output</span>
                </div>
                <div className="flex gap-2">
                   <Button variant="ghost" size="icon" className="h-6 w-6 text-zinc-600"><Trash2 className="w-3.5 h-3.5" /></Button>
                   <Button variant="ghost" size="icon" className="h-6 w-6 text-zinc-600"><Download className="w-3.5 h-3.5" /></Button>
                </div>
             </div>
             <ScrollArea className="h-[400px] p-4">
                <div className="space-y-1.5">
                  {logs.map((log, i) => (
                    <div key={i} className="flex gap-4 group hover:bg-zinc-900/30 py-0.5 px-2 rounded">
                      <span className="text-zinc-700 shrink-0">[{log.time}]</span>
                      <span className={`font-bold shrink-0 w-16 ${
                        log.type === 'ERROR' ? 'text-red-500' :
                        log.type === 'WARN' ? 'text-yellow-500' :
                        log.type === 'SUCCESS' ? 'text-green-500' : 'text-blue-500'
                      }`}>
                        {log.type}
                      </span>
                      <span className="text-zinc-400 leading-relaxed">{log.message}</span>
                    </div>
                  ))}
                  <div className="flex gap-4 py-0.5 px-2">
                    <span className="text-zinc-700 shrink-0">[10:25:30]</span>
                    <span className="text-orange-500 animate-pulse font-bold">_</span>
                  </div>
                </div>
             </ScrollArea>
          </Card>
        </TabsContent>

        <TabsContent value="tests" className="space-y-4">
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { name: "Flux RTSP (Camera-01)", status: "pass", latency: "22ms" },
                { name: "Inférence YOLOv11 Engine", status: "pass", latency: "14ms" },
                { name: "Storage Write (SSD-01)", status: "pass", latency: "115MB/s" },
                { name: "Network Sync (S3 Cloud)", status: "fail", latency: "Timeout" },
                { name: "Database Write (Postgres)", status: "pass", latency: "8ms" },
                { name: "API Gateway Responsiveness", status: "pass", latency: "4ms" },
              ].map((test, i) => (
                <Card key={i} className="p-4 bg-zinc-900/50 border-zinc-800 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                     <div className={`w-2 h-2 rounded-full ${test.status === 'pass' ? 'bg-green-500' : 'bg-red-500'}`} />
                     <div>
                        <h4 className="text-sm font-bold text-white">{test.name}</h4>
                        <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest">{test.latency}</span>
                     </div>
                  </div>
                  <Button variant="outline" size="sm" className="h-8 border-zinc-800 text-[10px] font-bold uppercase">Tester</Button>
                </Card>
              ))}
           </div>
        </TabsContent>

        <TabsContent value="bench" className="space-y-4">
           <Card className="p-8 bg-zinc-950 border border-zinc-800 border-dashed flex flex-col items-center justify-center text-center gap-4">
              <Zap className="w-12 h-12 text-orange-500 animate-pulse" />
              <div className="space-y-2">
                 <h3 className="text-lg font-bold text-white">Prêt pour le Benchmark IA</h3>
                 <p className="text-sm text-zinc-500 max-w-md">Cette procédure va tester le moteur d'inférence avec 10,000 images tests pour mesurer la précision et la stabilité thermique du GPU.</p>
              </div>
              <Button className="bg-orange-600 hover:bg-orange-700 text-white px-8 h-12 gap-2 text-xs font-bold uppercase tracking-widest mt-4 shadow-xl shadow-orange-950/20">
                 Démarrer le Benchmark
              </Button>
           </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

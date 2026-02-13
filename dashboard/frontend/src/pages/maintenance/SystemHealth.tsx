import {
  Activity,
  Server,
  Cpu,
  HardDrive,
  ShieldCheck,
  RefreshCw,
  Thermometer,
  Database,
  Network,
  Clock,
  AlertTriangle,
  ChevronRight,
  Download
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';

/**
 * System Health Dashboard
 * Hardware metrics and service status
 */

export default function SystemHealth() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">System Health</h1>
          <p className="text-muted-foreground">Monitor infrastructure performance and service status</p>
        </div>
        <div className="flex gap-3">
          <Badge variant="outline" className="px-3 py-1 bg-green-500/10 text-green-400 border-green-500/20 gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            ALL SYSTEMS NORMAL
          </Badge>
          <Button variant="outline" className="gap-2 border-zinc-800 text-white">
            <RefreshCw className="w-4 h-4" /> Refresh Status
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Core Services */}
        <Card className="lg:col-span-2 p-6 bg-card/50 border-zinc-800 space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 font-semibold text-white">
              <ShieldCheck className="w-5 h-5 text-green-500" />
              <span>Service Status & Uptime</span>
            </div>
            <span className="text-[10px] text-zinc-500 font-mono uppercase tracking-widest">Last Sync: 2m ago</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { name: 'Vision Engine (YOLOv8)', status: 'Operational', uptime: '12d 4h', color: 'bg-green-500', latency: '12ms' },
              { name: 'FastAPI Internal API', status: 'Operational', uptime: '12d 4h', color: 'bg-green-500', latency: '5ms' },
              { name: 'MJPEG Stream Server', status: 'Active', uptime: '4d 2h', color: 'bg-green-500', latency: '45ms' },
              { name: 'Redis Metrics Store', status: 'Operational', uptime: '142d', color: 'bg-green-500', latency: '1ms' },
              { name: 'PostgreSQL DB Cluster', status: 'Operational', uptime: '142d', color: 'bg-green-500', latency: '2ms' },
              { name: 'Alert Notification Service', status: 'Standby', uptime: '12d 4h', color: 'bg-yellow-500', latency: '-' },
            ].map((service, i) => (
              <div key={i} className="group flex items-center justify-between p-4 rounded-lg bg-zinc-900/50 border border-zinc-800 hover:border-zinc-700 transition-colors">
                <div className="space-y-1">
                  <div className="text-sm font-medium text-white">{service.name}</div>
                  <div className="flex items-center gap-2 text-[10px] text-zinc-500">
                    <span>Uptime: {service.uptime}</span>
                    <span>•</span>
                    <span>Latency: {service.latency}</span>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <div className={`w-2 h-2 rounded-full ${service.color}`} />
                  <span className="text-[8px] text-zinc-500 uppercase">{service.status}</span>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Hardware Overview */}
        <Card className="p-6 bg-card/50 border-zinc-800 space-y-6">
          <div className="flex items-center gap-2 font-semibold text-white">
            <Server className="w-5 h-5 text-orange-500" />
            <span>Hardware Resources</span>
          </div>
          <div className="space-y-6">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="flex items-center gap-2 text-zinc-400"><Cpu className="w-3 h-3" /> CPU Load</span>
                <span className="font-mono text-white">42%</span>
              </div>
              <Progress value={42} className="h-1.5" />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="flex items-center gap-2 text-zinc-400"><Activity className="w-3 h-3" /> RAM Utilization</span>
                <span className="font-mono text-white">5.2 GB / 16 GB</span>
              </div>
              <Progress value={32} className="h-1.5" />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="flex items-center gap-2 text-zinc-400"><HardDrive className="w-3 h-3" /> NVMe Storage</span>
                <span className="font-mono text-white">1.2 TB / 2.0 TB</span>
              </div>
              <Progress value={60} className="h-1.5" />
            </div>

            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-zinc-800">
              <div className="space-y-1">
                <span className="text-[10px] text-zinc-500 uppercase font-bold">Internal Temp</span>
                <div className="flex items-center gap-1 text-orange-400 font-mono">
                  <Thermometer className="w-3 h-3" /> 48.2°C
                </div>
              </div>
              <div className="space-y-1">
                <span className="text-[10px] text-zinc-500 uppercase font-bold">Network I/O</span>
                <div className="flex items-center gap-1 text-blue-400 font-mono text-xs">
                  <Network className="w-3 h-3" /> 420 Mbps
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="p-6 bg-card/50 border-zinc-800 space-y-4 md:col-span-2">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-white">Deployment & CI/CD</h3>
            <Badge variant="secondary" className="text-[10px] font-mono">v1.2.4-stable</Badge>
          </div>
          <div className="space-y-2 font-mono text-[10px] bg-black/40 p-4 rounded border border-zinc-800">
            <div className="text-zinc-500">$ docker ps --format "table &#123;&#123;.Names&#125;&#125;\t&#123;&#123;.Status&#125;&#125;"</div>
            <div className="text-green-400">vision-yolo8-engine      Up 12 days (healthy)</div>
            <div className="text-green-400">api-gateway-backend      Up 12 days</div>
            <div className="text-green-400">postgres-db-1            Up 142 days</div>
            <div className="text-yellow-400">mjpeg-streaming-svc      Up 4 days (unhealthy - 0/1)</div>
          </div>
        </Card>

        <Card className="p-6 bg-card/50 border-zinc-800 space-y-4 md:col-span-2">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-white">Database Performance</h3>
            <Database className="w-4 h-4 text-blue-500" />
          </div>
          <div className="space-y-3">
            <div className="flex justify-between text-xs">
              <span className="text-zinc-500">Active Connections</span>
              <span className="text-white font-mono">42 / 100</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-zinc-500">Cache Hit Rate</span>
              <span className="text-green-400 font-mono">98.2%</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-zinc-500">Average Query Time</span>
              <span className="text-white font-mono">2.4ms</span>
            </div>
          </div>
        </Card>
      </div>

      <Card className="p-6 bg-card/50 border-zinc-800 space-y-4">
        <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
          <div className="flex items-center gap-2 font-semibold text-white">
            <Clock className="w-5 h-5 text-zinc-500" />
            <span>Recent System Events & Logs</span>
          </div>
          <Button variant="ghost" size="sm" className="text-xs gap-2 text-zinc-400 hover:text-white">
            <Download className="w-4 h-4" /> Download Full Logs
          </Button>
        </div>
        <div className="space-y-2 font-mono text-[11px]">
          <div className="flex gap-4 border-b border-zinc-800/50 py-2">
            <span className="text-zinc-500">2025-08-27 10:45:12</span>
            <span className="text-blue-400 font-bold">[INFO]</span>
            <span className="text-zinc-300">Vision engine successfully connected to RTSP stream: FRONT_CONVEYOR_01</span>
          </div>
          <div className="flex gap-4 border-b border-zinc-800/50 py-2">
            <span className="text-zinc-500">2025-08-27 10:45:15</span>
            <span className="text-zinc-400 font-bold">[DEBUG]</span>
            <span className="text-zinc-300">Model weights 'best_V5.pt' loaded. Inference device: NVIDIA RTX 4080 (CUDA 12.1)</span>
          </div>
          <div className="flex gap-4 border-b border-zinc-800/50 py-2">
            <span className="text-zinc-500">2025-08-27 11:02:05</span>
            <span className="text-yellow-400 font-bold">[WARN]</span>
            <span className="text-zinc-300">{"High network jitter detected (std_dev > 50ms). Stream buffer increased to 500ms."}</span>
          </div>
          <div className="flex gap-4 py-2">
            <span className="text-zinc-500">2025-08-27 11:05:00</span>
            <span className="text-blue-400 font-bold">[INFO]</span>
            <span className="text-zinc-300">Daily database backup initiated. Target: S3-Archive-Region-1</span>
          </div>
        </div>
      </Card>
    </div>
  );
}

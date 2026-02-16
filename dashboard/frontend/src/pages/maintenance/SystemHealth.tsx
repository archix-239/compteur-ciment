import { useState, useEffect } from 'react';
import { API_URL } from '@/lib/api';
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
import { PageHeader } from '@/components/PageHeader';
import { StatusBadge } from '@/components/StatusBadge';

/**
 * System Health Dashboard
 * Hardware metrics and service status
 */

export default function SystemHealth() {
  const [health, setHealth] = useState(null);

  useEffect(() => {
    const fetchHealth = () => {
      fetch(`${API_URL}/api/system/health`)
        .then(res => res.json())
        .then(data => setHealth(data))
        .catch(err => console.error("Error fetching health:", err));
    };
    fetchHealth();
    const interval = setInterval(fetchHealth, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Santé Système"
        description="Surveillance de l'infrastructure et état des services"
        breadcrumbs={[{ label: 'Maintenance' }, { label: 'Santé Système' }]}
      >
        <StatusBadge status="online" label="SYSTÈME OPÉRATIONNEL" />
        <Button variant="outline" className="gap-2 border-zinc-800 text-white hover:bg-zinc-900">
          <RefreshCw className="w-4 h-4" /> Actualiser
        </Button>
      </PageHeader>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Core Services */}
        <Card className="lg:col-span-2 p-6 bg-card/50 border-zinc-800 space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 font-semibold text-white">
              <ShieldCheck className="w-5 h-5 text-green-500" />
              <span>État des Services & Uptime</span>
            </div>
            <span className="text-[10px] text-zinc-500 font-mono uppercase tracking-widest">Dernière Sync: il y a 2m</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { name: 'Moteur Vision (YOLOv8)', status: 'Opérationnel', uptime: '12j 4h', color: 'bg-green-500', latency: '12ms' },
              { name: 'API Interne FastAPI', status: 'Opérationnel', uptime: '12j 4h', color: 'bg-green-500', latency: '5ms' },
              { name: 'Serveur Flux MJPEG', status: 'Actif', uptime: '4j 2h', color: 'bg-green-500', latency: '45ms' },
              { name: 'Stockage Métriques Redis', status: 'Opérationnel', uptime: '142j', color: 'bg-green-500', latency: '1ms' },
              { name: 'Cluster DB PostgreSQL', status: 'Opérationnel', uptime: '142j', color: 'bg-green-500', latency: '2ms' },
              { name: 'Service de Notifications', status: 'En attente', uptime: '12j 4h', color: 'bg-yellow-500', latency: '-' },
            ].map((service, i) => (
              <div key={i} className="group flex items-center justify-between p-4 rounded-lg bg-zinc-900/50 border border-zinc-800 hover:border-zinc-700 transition-colors">
                <div className="space-y-1">
                  <div className="text-sm font-medium text-white">{service.name}</div>
                  <div className="flex items-center gap-2 text-[10px] text-zinc-500">
                    <span>Uptime: {service.uptime}</span>
                    <span>•</span>
                    <span>Latence: {service.latency}</span>
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
            <span>Ressources Matérielles</span>
          </div>
          <div className="space-y-6">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="flex items-center gap-2 text-zinc-400"><Cpu className="w-3 h-3" /> Charge CPU</span>
                <span className="font-mono text-white">{health ? health.cpu : 0}%</span>
              </div>
              <Progress value={health ? health.cpu : 0} className="h-1.5" />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="flex items-center gap-2 text-zinc-400"><Activity className="w-3 h-3" /> Utilisation RAM</span>
                <span className="font-mono text-white">{health ? health.memory : 0}%</span>
              </div>
              <Progress value={health ? health.memory : 0} className="h-1.5" />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="flex items-center gap-2 text-zinc-400"><HardDrive className="w-3 h-3" /> Stockage NVMe</span>
                <span className="font-mono text-white">{health ? health.disk : 0}%</span>
              </div>
              <Progress value={health ? health.disk : 0} className="h-1.5" />
            </div>

            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-zinc-800">
              <div className="space-y-1">
                <span className="text-[10px] text-zinc-500 uppercase font-bold">Temp. Interne</span>
                <div className="flex items-center gap-1 text-orange-400 font-mono">
                  <Thermometer className="w-3 h-3" /> 48.2°C
                </div>
              </div>
              <div className="space-y-1">
                <span className="text-[10px] text-zinc-500 uppercase font-bold">I/O Réseau</span>
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
            <h3 className="font-semibold text-white text-sm">Déploiement & CI/CD</h3>
            <Badge variant="secondary" className="text-[10px] font-mono border-zinc-700 bg-zinc-900">v1.2.4-stable</Badge>
          </div>
          <div className="space-y-2 font-mono text-[10px] bg-black/40 p-4 rounded border border-zinc-800 overflow-x-auto">
            <div className="text-zinc-500">$ docker ps --format "table &#123;&#123;.Names&#125;&#125;\t&#123;&#123;.Status&#125;&#125;"</div>
            <div className="text-green-400">vision-yolo8-engine      Up 12 days (healthy)</div>
            <div className="text-green-400">api-gateway-backend      Up 12 days</div>
            <div className="text-green-400">postgres-db-1            Up 142 days</div>
            <div className="text-yellow-400">mjpeg-streaming-svc      Up 4 days (unhealthy - 0/1)</div>
          </div>
        </Card>

        <Card className="p-6 bg-card/50 border-zinc-800 space-y-4 md:col-span-2">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-white text-sm">Performance Base de Données</h3>
            <Database className="w-4 h-4 text-blue-500" />
          </div>
          <div className="space-y-3">
            <div className="flex justify-between text-xs">
              <span className="text-zinc-500">Connexions Actives</span>
              <span className="text-white font-mono">42 / 100</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-zinc-500">Taux de Hit Cache</span>
              <span className="text-green-400 font-mono font-bold">98.2%</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-zinc-500">Temps Moyen Requête</span>
              <span className="text-white font-mono">2.4ms</span>
            </div>
          </div>
        </Card>
      </div>

      <Card className="p-6 bg-card/50 border-zinc-800 space-y-4">
        <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
          <div className="flex items-center gap-2 font-semibold text-white">
            <Clock className="w-5 h-5 text-zinc-500" />
            <span>Événements Système Récents & Logs</span>
          </div>
          <Button variant="ghost" size="sm" className="text-[10px] gap-2 text-zinc-400 hover:text-white uppercase font-bold tracking-wider">
            <Download className="w-3 h-3" /> Télécharger Logs Complets
          </Button>
        </div>
        <div className="space-y-1 font-mono text-[11px]">
          <div className="flex gap-4 border-b border-zinc-800/50 py-2">
            <span className="text-zinc-500 whitespace-nowrap">2025-08-27 10:45:12</span>
            <span className="text-blue-400 font-bold">[INFO]</span>
            <span className="text-zinc-300">Moteur de vision connecté avec succès au flux RTSP: FRONT_CONVEYOR_01</span>
          </div>
          <div className="flex gap-4 border-b border-zinc-800/50 py-2">
            <span className="text-zinc-500 whitespace-nowrap">2025-08-27 10:45:15</span>
            <span className="text-zinc-400 font-bold">[DEBUG]</span>
            <span className="text-zinc-300">Poids du modèle 'best_V5.pt' chargés. Inférence : NVIDIA RTX 4080 (CUDA 12.1)</span>
          </div>
          <div className="flex gap-4 border-b border-zinc-800/50 py-2">
            <span className="text-zinc-500 whitespace-nowrap">2025-08-27 11:02:05</span>
            <span className="text-yellow-400 font-bold">[WARN]</span>
            <span className="text-zinc-300">{"Gigue réseau élevée détectée (std_dev > 50ms). Buffer augmenté à 500ms."}</span>
          </div>
          <div className="flex gap-4 py-2">
            <span className="text-zinc-500 whitespace-nowrap">2025-08-27 11:05:00</span>
            <span className="text-blue-400 font-bold">[INFO]</span>
            <span className="text-zinc-300">Sauvegarde quotidienne de la base de données initiée. Cible: S3-Archive-Region-1</span>
          </div>
        </div>
      </Card>
    </div>
  );
}

import { useCallback, useEffect, useState } from 'react';
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
  Download,
  Loader2,
  CheckCircle2,
  XCircle,
  Wifi,
  WifiOff,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { PageHeader } from '@/components/PageHeader';
import { StatusBadge } from '@/components/StatusBadge';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

// ── Types ─────────────────────────────────────────────────────────────────────

interface ServiceInfo {
  name: string;
  status: string;
  ok: boolean;
  uptime: string;
  detail: string;
}

interface DbStats {
  size_mb: number;
  total_logs: number;
  total_sessions: number;
  active_sessions: number;
  total_alerts: number;
  unread_alerts: number;
  query_time_ms: number;
}

interface SystemEvent {
  timestamp: string;
  level: 'INFO' | 'WARN' | 'ERROR' | 'DEBUG';
  message: string;
}

interface HealthData {
  status: string;
  uptime: string;
  uptime_sec: number;
  cpu: number;
  memory: number;
  memory_total_gb: number;
  memory_used_gb: number;
  disk: number;
  disk_total_gb: number;
  disk_used_gb: number;
  disk_free_gb: number;
  temperature: number | null;
  net_recv_mbps: number;
  net_sent_mbps: number;
  services: ServiceInfo[];
  db: DbStats;
  events: SystemEvent[];
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtTs(isoString: string): string {
  const d = new Date(isoString);
  return d.toLocaleString('fr-FR', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  });
}

function levelColor(level: string): string {
  if (level === 'ERROR')  return 'text-red-400';
  if (level === 'WARN')   return 'text-yellow-400';
  if (level === 'DEBUG')  return 'text-zinc-500';
  return 'text-blue-400';
}

function usageColor(pct: number): string {
  if (pct >= 90) return 'text-red-400';
  if (pct >= 70) return 'text-yellow-400';
  return 'text-white';
}

function progressColor(pct: number): string {
  if (pct >= 90) return '[&>div]:bg-red-500';
  if (pct >= 70) return '[&>div]:bg-yellow-500';
  return '[&>div]:bg-orange-500';
}

// ── InfoTooltip ───────────────────────────────────────────────────────────────

function InfoTooltip({ text, side = 'top' }: { text: string; side?: 'top' | 'right' | 'bottom' | 'left' }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-zinc-800 hover:bg-zinc-600 text-zinc-400 hover:text-zinc-100 transition-colors cursor-help ml-1.5 shrink-0"
        >
          <span className="text-[9px] font-bold leading-none select-none">?</span>
        </button>
      </TooltipTrigger>
      <TooltipContent
        side={side}
        className="max-w-[240px] bg-zinc-900 border border-zinc-700 text-zinc-300 text-xs leading-relaxed whitespace-normal"
      >
        {text}
      </TooltipContent>
    </Tooltip>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function SystemHealth() {
  const [health, setHealth] = useState<HealthData | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [error, setError] = useState(false);

  const fetchHealth = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/system/health`);
      if (res.ok) {
        setHealth(await res.json());
        setLastUpdate(new Date());
        setError(false);
      } else {
        setError(true);
      }
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHealth();
    const interval = setInterval(fetchHealth, 5000);
    return () => clearInterval(interval);
  }, [fetchHealth]);

  const systemOk = !error && health !== null;

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Santé Système"
        description="Surveillance de l'infrastructure et état des services"
        breadcrumbs={[{ label: 'Maintenance' }, { label: 'Santé Système' }]}
      >
        {loading
          ? <StatusBadge status="connecting" label="CHARGEMENT..." />
          : error
            ? <StatusBadge status="offline" label="ERREUR API" />
            : <StatusBadge status="online" label="SYSTÈME OPÉRATIONNEL" />
        }
        <Button
          variant="outline"
          className="gap-2 border-zinc-800 text-white hover:bg-zinc-900"
          onClick={fetchHealth}
          disabled={loading}
        >
          {loading
            ? <Loader2 className="w-4 h-4 animate-spin" />
            : <RefreshCw className="w-4 h-4" />}
          Actualiser
        </Button>
      </PageHeader>

      {lastUpdate && (
        <p className="text-[10px] text-zinc-600 font-mono">
          Dernière mise à jour : {lastUpdate.toLocaleTimeString('fr-FR')} — actualisation auto toutes les 5s
        </p>
      )}

      {/* ── Row 1 : Services + Hardware ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Services */}
        <Card className="lg:col-span-2 p-6 bg-card/50 border-zinc-800 space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 font-semibold text-white">
              <ShieldCheck className="w-5 h-5 text-green-500" />
              <span>État des Services & Uptime</span>
              <InfoTooltip
                side="right"
                text="Services actifs sur le backend. Le moteur Vision est réel (YOLOv8 thread). L'uptime correspond à l'uptime du système d'exploitation."
              />
            </div>
            <span className="text-[10px] text-zinc-500 font-mono uppercase tracking-widest">
              {health ? `Uptime OS : ${health.uptime}` : '—'}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {loading || !health ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-20 rounded-lg bg-zinc-900/50 border border-zinc-800 animate-pulse" />
              ))
            ) : (
              health.services.map((svc, i) => (
                <div
                  key={i}
                  className={`flex items-center justify-between p-4 rounded-lg border transition-colors ${
                    svc.ok
                      ? 'bg-zinc-900/50 border-zinc-800 hover:border-zinc-700'
                      : 'bg-red-500/5 border-red-500/20'
                  }`}
                >
                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="text-sm font-medium text-white truncate">{svc.name}</div>
                    <div className="flex items-center gap-2 text-[10px] text-zinc-500">
                      <span>Uptime: {svc.uptime}</span>
                      <span>·</span>
                      <span className="truncate">{svc.detail}</span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0 ml-2">
                    {svc.ok
                      ? <CheckCircle2 className="w-4 h-4 text-green-500" />
                      : <XCircle className="w-4 h-4 text-red-500" />}
                    <span className="text-[8px] text-zinc-500 uppercase">{svc.status}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>

        {/* Hardware */}
        <Card className="p-6 bg-card/50 border-zinc-800 space-y-6">
          <div className="flex items-center gap-2 font-semibold text-white">
            <Server className="w-5 h-5 text-orange-500" />
            <span>Ressources Matérielles</span>
            <InfoTooltip
              side="left"
              text="Métriques temps réel du système via psutil. Actualisées toutes les 5 secondes."
            />
          </div>

          <div className="space-y-5">
            {/* CPU */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="flex items-center gap-2 text-zinc-400">
                  <Cpu className="w-3 h-3" /> Charge CPU
                  <InfoTooltip side="right" text="Pourcentage d'utilisation du processeur depuis le dernier appel. Seuil critique : 90%." />
                </span>
                <span className={`font-mono ${usageColor(health?.cpu ?? 0)}`}>
                  {health?.cpu ?? '—'}%
                </span>
              </div>
              <Progress
                value={health?.cpu ?? 0}
                className={`h-1.5 ${progressColor(health?.cpu ?? 0)}`}
              />
            </div>

            {/* RAM */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="flex items-center gap-2 text-zinc-400">
                  <Activity className="w-3 h-3" /> RAM
                  <InfoTooltip
                    side="right"
                    text={`RAM utilisée / totale. ${health ? `${health.memory_used_gb} Go / ${health.memory_total_gb} Go` : ''}`}
                  />
                </span>
                <span className={`font-mono ${usageColor(health?.memory ?? 0)}`}>
                  {health?.memory ?? '—'}%
                  {health && (
                    <span className="text-zinc-500 text-[10px] ml-1">
                      ({health.memory_used_gb}/{health.memory_total_gb} Go)
                    </span>
                  )}
                </span>
              </div>
              <Progress
                value={health?.memory ?? 0}
                className={`h-1.5 ${progressColor(health?.memory ?? 0)}`}
              />
            </div>

            {/* Disk */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="flex items-center gap-2 text-zinc-400">
                  <HardDrive className="w-3 h-3" /> Stockage
                  <InfoTooltip
                    side="right"
                    text={`Espace disque utilisé / total. ${health ? `${health.disk_free_gb} Go libres sur ${health.disk_total_gb} Go` : ''}`}
                  />
                </span>
                <span className={`font-mono ${usageColor(health?.disk ?? 0)}`}>
                  {health?.disk ?? '—'}%
                  {health && (
                    <span className="text-zinc-500 text-[10px] ml-1">
                      ({health.disk_free_gb} Go libres)
                    </span>
                  )}
                </span>
              </div>
              <Progress
                value={health?.disk ?? 0}
                className={`h-1.5 ${progressColor(health?.disk ?? 0)}`}
              />
            </div>

            {/* Temperature + Network */}
            <div className="grid grid-cols-2 gap-4 pt-2 border-t border-zinc-800">
              <div className="space-y-1">
                <span className="text-[10px] text-zinc-500 uppercase font-bold flex items-center">
                  Temp. CPU
                  <InfoTooltip side="top" text="Température du processeur (Linux/Mac seulement via psutil). Non disponible sur Windows sans pilote dédié." />
                </span>
                <div className={`flex items-center gap-1 font-mono text-sm ${health?.temperature ? 'text-orange-400' : 'text-zinc-600'}`}>
                  <Thermometer className="w-3 h-3" />
                  {health?.temperature != null ? `${health.temperature}°C` : 'N/A'}
                </div>
              </div>
              <div className="space-y-1">
                <span className="text-[10px] text-zinc-500 uppercase font-bold flex items-center">
                  I/O Réseau
                  <InfoTooltip side="top" text="Débit réseau calculé entre deux appels consécutifs (intervalle ≈ 5s). Rx = réception, Tx = envoi." />
                </span>
                <div className="text-blue-400 font-mono text-xs space-y-0.5">
                  {health ? (
                    <>
                      <div className="flex items-center gap-1">
                        <Wifi className="w-3 h-3" /> ↓ {health.net_recv_mbps.toFixed(2)} Mbps
                      </div>
                      <div className="flex items-center gap-1">
                        <WifiOff className="w-3 h-3" /> ↑ {health.net_sent_mbps.toFixed(2)} Mbps
                      </div>
                    </>
                  ) : (
                    <span className="text-zinc-600">—</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* ── Row 2 : Process info + DB metrics ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* Process / Runtime info */}
        <Card className="p-6 bg-card/50 border-zinc-800 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-white text-sm flex items-center gap-2">
              <Server className="w-4 h-4 text-orange-500" />
              Déploiement & Runtime
              <InfoTooltip
                side="right"
                text="Informations sur le processus Python/FastAPI en cours d'exécution. L'uptime correspond à celui du système d'exploitation hôte."
              />
            </h3>
            <Badge
              variant="secondary"
              className="text-[10px] font-mono border-zinc-700 bg-zinc-900 text-zinc-400"
            >
              FastAPI + SQLite
            </Badge>
          </div>
          <div className="space-y-2 font-mono text-[11px] bg-black/40 p-4 rounded border border-zinc-800">
            <div className="text-zinc-500">$ runtime info</div>
            {loading || !health ? (
              <div className="text-zinc-600 animate-pulse">Chargement...</div>
            ) : (
              <>
                <div className="text-green-400">
                  backend-api           Online (uptime: {health.uptime})
                </div>
                {health.services.map((svc, i) => (
                  <div key={i} className={svc.ok ? 'text-green-400' : 'text-red-400'}>
                    {svc.name.toLowerCase().replace(/\s+/g, '-').padEnd(28)}
                    {svc.ok ? 'OK' : 'DOWN'} · {svc.detail}
                  </div>
                ))}
              </>
            )}
          </div>
        </Card>

        {/* Database metrics */}
        <Card className="p-6 bg-card/50 border-zinc-800 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-white text-sm flex items-center gap-2">
              <Database className="w-4 h-4 text-blue-500" />
              Métriques Base de Données
              <InfoTooltip
                side="left"
                text="Statistiques SQLite réelles : taille du fichier, nombre d'enregistrements par table et temps de requête mesuré en direct."
              />
            </h3>
          </div>

          {loading || !health ? (
            <div className="space-y-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-5 bg-zinc-900 rounded animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {[
                {
                  label: 'Taille fichier BD',
                  value: `${health.db.size_mb} MB`,
                  tip: 'Taille du fichier cement_counter.db sur disque.',
                  color: 'text-white',
                },
                {
                  label: 'Logs de détection',
                  value: health.db.total_logs.toLocaleString('fr-FR'),
                  tip: 'Nombre total d\'enregistrements DetectionLog en base.',
                  color: 'text-white',
                },
                {
                  label: 'Sessions totales',
                  value: `${health.db.total_sessions} (${health.db.active_sessions} active${health.db.active_sessions > 1 ? 's' : ''})`,
                  tip: 'Nombre de sessions de production enregistrées. Une session active est en cours d\'enregistrement.',
                  color: 'text-white',
                },
                {
                  label: 'Alertes totales',
                  value: `${health.db.total_alerts} (${health.db.unread_alerts} non lue${health.db.unread_alerts > 1 ? 's' : ''})`,
                  tip: 'Total des alertes en historique, avec le nombre de non lues.',
                  color: health.db.unread_alerts > 0 ? 'text-orange-400' : 'text-white',
                },
                {
                  label: 'Temps requête',
                  value: `${health.db.query_time_ms} ms`,
                  tip: 'Durée mesurée d\'un COUNT(*) sur detection_logs. Indicateur de la réactivité SQLite.',
                  color: health.db.query_time_ms > 50 ? 'text-yellow-400' : 'text-green-400',
                },
              ].map(({ label, value, tip, color }) => (
                <div key={label} className="flex justify-between items-center text-xs border-b border-zinc-800/50 pb-2 last:border-0 last:pb-0">
                  <span className="text-zinc-500 flex items-center">
                    {label}
                    <InfoTooltip side="left" text={tip} />
                  </span>
                  <span className={`font-mono font-bold ${color}`}>{value}</span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* ── Row 3 : Events log ── */}
      <Card className="p-6 bg-card/50 border-zinc-800 space-y-4">
        <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
          <div className="flex items-center gap-2 font-semibold text-white">
            <Clock className="w-5 h-5 text-zinc-500" />
            <span>Événements Système Récents</span>
            <InfoTooltip
              side="right"
              text="Flux des 10 derniers événements : alertes déclenchées par le moteur de règles et démarrages/arrêts de sessions de production. Données réelles depuis la BDD."
            />
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="text-[10px] gap-2 text-zinc-400 hover:text-white uppercase font-bold tracking-wider"
            onClick={() => window.location.href = '/alerts/management'}
          >
            <Download className="w-3 h-3" /> Voir toutes les alertes
          </Button>
        </div>

        <div className="space-y-0 font-mono text-[11px] min-h-[80px]">
          {loading ? (
            <div className="flex items-center gap-2 text-zinc-600 py-4">
              <Loader2 className="w-4 h-4 animate-spin" />
              Chargement des événements...
            </div>
          ) : !health || health.events.length === 0 ? (
            <div className="text-zinc-600 italic py-4 text-center text-xs">
              Aucun événement enregistré. Démarrez une session pour voir les logs ici.
            </div>
          ) : (
            health.events.map((evt, i) => (
              <div
                key={i}
                className="flex gap-4 border-b border-zinc-800/40 py-2 last:border-0 hover:bg-zinc-900/30 transition-colors px-1 rounded"
              >
                <span className="text-zinc-600 whitespace-nowrap shrink-0">{fmtTs(evt.timestamp)}</span>
                <span className={`font-bold shrink-0 w-14 ${levelColor(evt.level)}`}>[{evt.level}]</span>
                <span className="text-zinc-300 break-all">{evt.message}</span>
              </div>
            ))
          )}
        </div>
      </Card>

      {/* ── Alert if system issue ── */}
      {error && (
        <Card className="p-4 border-red-500/20 bg-red-500/5 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
          <p className="text-sm text-red-300">
            Impossible de contacter le backend. Vérifiez que le serveur FastAPI est démarré sur le port 8000.
          </p>
        </Card>
      )}
    </div>
  );
}

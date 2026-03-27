import { useState, useEffect, useRef } from 'react';
import { API_URL, WS_URL, fetchApi } from '@/lib/api';
import { useVideoStream } from '@/hooks/useVideoStream';
import { Camera, Activity, AlertCircle, Maximize2, RefreshCcw, AlertOctagon, Zap, Bell, Loader2, PauseCircle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/PageHeader';
import { StatusBadge } from '@/components/StatusBadge';

interface AlertItem {
  id: number;
  title: string;
  message: string;
  alert_type: 'critical' | 'warning' | 'info';
  is_read: boolean;
  timestamp: string;
}

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

  const [runtime, setRuntime] = useState<RuntimeInfo | null>(null);
  const [recentAlerts, setRecentAlerts] = useState<AlertItem[]>([]);
  const [alertsLoading, setAlertsLoading] = useState(true);
  const [sessionActive, setSessionActive] = useState(false);
  const [stats, setStats] = useState({
    latency: 0,
    detectedObjects: 0,
    verifiedBags: 0,
    rejectedBags: 0,
    activeSessionStart: '-',
    activeSessionDuration: '-',
    activeRate: 0,
  });

  useEffect(() => {
    // Load counts from the active session (or the last completed one — NOT all-time totals)
    fetchApi('/sessions/active')
      .then(session => {
        if (session) {
          setSessionActive(true);
          setStats(prev => ({
            ...prev,
            verifiedBags: session.total_count ?? 0,
            rejectedBags: session.rejected_count ?? 0,
            detectedObjects: (session.total_count ?? 0) + (session.rejected_count ?? 0),
          }));
        } else {
          setSessionActive(false);
          // Show counts from the last completed session, not the all-time DB total
          fetchApi('/sessions/?page=1&page_size=1')
            .then(data => {
              const last = data.items?.[0];
              setStats(prev => ({
                ...prev,
                verifiedBags: last?.total_count ?? 0,
                rejectedBags: last?.rejected_count ?? 0,
              }));
            })
            .catch(() => {});
        }
      })
      .catch(() => {});

    // ── Alertes récentes ────────────────────────────────────────────────────
    const loadAlerts = () => {
      fetchApi('/api/alerts/history?limit=3')
        .then(data => { setRecentAlerts(Array.isArray(data) ? data : (data.items ?? [])); setAlertsLoading(false); })
        .catch(() => setAlertsLoading(false));
    };
    loadAlerts();
    const alertsTimer = setInterval(loadAlerts, 30_000);

    const loadRuntime = () => {
      fetchApi('/api/config/runtime')
        .then(setRuntime)
        .catch(() => {});
    };
    loadRuntime();
    const runtimeTimer = setInterval(loadRuntime, 3000);

    const loadSession = () => {
      fetchApi('/sessions/active')
        .then((s) => {
          if (!s) {
            setSessionActive(false);
            setStats((prev) => ({ ...prev, activeSessionStart: '-', activeSessionDuration: '-', activeRate: 0 }));
            return;
          }
          setSessionActive(true);
          const start = new Date(s.start_time);
          const diffSec = Math.max(0, Math.floor((Date.now() - start.getTime()) / 1000));
          const hh = String(Math.floor(diffSec / 3600)).padStart(2, '0');
          const mm = String(Math.floor((diffSec % 3600) / 60)).padStart(2, '0');
          const ss = String(diffSec % 60).padStart(2, '0');
          const total = (s.total_count || 0) + (s.rejected_count || 0);
          const mins = Math.max(1, diffSec / 60);
          setStats((prev) => ({
            ...prev,
            activeSessionStart: start.toLocaleTimeString(),
            activeSessionDuration: `${hh}:${mm}:${ss}`,
            activeRate: Number((total / mins).toFixed(1)),
          }));
        })
        .catch(() => {});
    };
    loadSession();
    const sessionTimer = setInterval(loadSession, 1000);

    let ws: WebSocket;
    let wsReconnectTimer: ReturnType<typeof setTimeout>;
    let wsDestroyed = false;

    const connectWs = () => {
      if (wsDestroyed) return;
      ws = new WebSocket(WS_URL);
      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          if (message.type === 'COUNT_EVENT') {
            setSessionActive(true);
            setStats(prev => ({
              ...prev,
              verifiedBags: message.data.session_stats.total,
              rejectedBags: message.data.session_stats.rejected,
              detectedObjects: prev.detectedObjects + 1,
            }));
          } else if (message.type === 'SESSION_STOPPED') {
            setSessionActive(false);
            setStats(prev => ({
              ...prev,
              verifiedBags: message.data.total_count ?? prev.verifiedBags,
              rejectedBags: message.data.rejected_count ?? prev.rejectedBags,
              activeSessionStart: '-',
              activeSessionDuration: '-',
              activeRate: 0,
            }));
          } else if (message.type === 'SESSION_STARTED') {
            setSessionActive(true);
            setStats(prev => ({ ...prev, verifiedBags: 0, rejectedBags: 0, detectedObjects: 0 }));
          }
        } catch { /* ignore malformed messages */ }
      };
      ws.onclose = () => { if (!wsDestroyed) wsReconnectTimer = setTimeout(connectWs, 3000); };
      ws.onerror = () => { ws.close(); };
    };

    connectWs();

    return () => {
      wsDestroyed = true;
      clearTimeout(wsReconnectTimer);
      ws?.close();
      clearInterval(runtimeTimer);
      clearInterval(sessionTimer);
      clearInterval(alertsTimer);
    };
  }, []);

  const line = runtime?.line;

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
            <img
              ref={imgRef}
              alt="Live Stream"
              className="absolute inset-0 w-full h-full object-contain"
              style={{ display: streamStatus === 'online' ? 'block' : 'none' }}
            />
            <div className="absolute inset-0 flex items-center justify-center text-orange-500/20 pointer-events-none">
              {streamStatus !== 'online' && <Camera className="w-20 h-20 opacity-20" />}
            </div>

            {/* Ligne Virtuelle (React source de vérité) */}
            {line?.type === 'vertical' && (
              <div className="absolute inset-y-0 w-0.5 bg-yellow-400/50 shadow-[0_0_10px_rgba(250,204,21,0.5)]" style={{ left: `${line.position_percent}%` }}>
                <div className="absolute top-4 -translate-x-1/2 bg-yellow-400 text-black text-[10px] font-bold px-1 rounded">LIGNE DE COMPTAGE</div>
              </div>
            )}
            {line?.type === 'horizontal' && (
              <div className="absolute inset-x-0 h-0.5 bg-yellow-400/50 shadow-[0_0_10px_rgba(250,204,21,0.5)]" style={{ top: `${line.position_percent}%` }}>
                <div className="absolute left-4 -translate-y-1/2 bg-yellow-400 text-black text-[10px] font-bold px-1 rounded">LIGNE DE COMPTAGE</div>
              </div>
            )}

            {/* Overlay "Comptage en pause" quand aucune session n'est active */}
            {!sessionActive && (
              <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px] flex flex-col items-center justify-center z-10 pointer-events-none">
                <PauseCircle className="w-14 h-14 text-zinc-400 mb-3 opacity-80" />
                <p className="text-white font-bold text-lg tracking-wide">Comptage en pause</p>
                <p className="text-zinc-400 text-sm mt-1">Démarrez une session pour activer le comptage</p>
              </div>
            )}

            {/* Infos Caméra */}
            <div className="absolute top-4 left-4 flex flex-col gap-2">
              <div className="bg-black/60 backdrop-blur-md border border-white/10 p-2 rounded text-[10px] font-mono">
                <div className="text-orange-400">{runtime?.camera_name || 'CAM_01 // CONVOYEUR_FRONTAL'}</div>
                <div className="text-white/60">Capture {runtime?.capture_fps ?? 0} FPS · Stream {fps} FPS</div>
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
                  <div className="text-[10px] text-green-400 font-bold mb-1 uppercase tracking-wider">
                    {sessionActive ? 'Vérifiés (session)' : 'Vérifiés (dernière session)'}
                  </div>
                  <div className="text-2xl font-bold font-mono">{stats.verifiedBags}</div>
                </div>
                <div className="bg-black/60 backdrop-blur-md border border-red-500/30 p-3 rounded text-white min-w-[100px]">
                  <div className="text-[10px] text-red-400 font-bold mb-1 uppercase tracking-wider">
                    {sessionActive ? 'Rejetés (session)' : 'Rejetés (dernière session)'}
                  </div>
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
              <div className="font-semibold text-white">{runtime?.model || 'models/best_V5.pt'}</div>
            </Card>
            <Card className="p-4 bg-card/50 border-zinc-800">
              <div className="text-[10px] text-muted-foreground mb-1 uppercase font-bold">FPS Stream</div>
              <div className="font-semibold text-white">{fps} FPS</div>
            </Card>
            <Card className="p-4 bg-card/50 border-zinc-800">
              <div className="text-[10px] text-muted-foreground mb-1 uppercase font-bold">Zone de Détection</div>
              <div className="font-semibold text-white">{line ? `${line.type} · ${line.direction}` : 'N/A'}</div>
            </Card>
          </div>
        </div>

        <div className="space-y-6">
          <Card className="p-4 space-y-4 bg-card/50 border-zinc-800">
            <div className="flex items-center gap-2 font-semibold text-white"><Activity className="w-4 h-4 text-orange-500" /><span>Détail Session</span></div>
            <div className="space-y-3">
              <div className="flex justify-between text-sm"><span className="text-muted-foreground">Début</span><span className="text-zinc-300">{stats.activeSessionStart}</span></div>
              <div className="flex justify-between text-sm"><span className="text-muted-foreground">Durée</span><span className="text-zinc-300">{stats.activeSessionDuration}</span></div>
              <div className="flex justify-between text-sm"><span className="text-muted-foreground">Débit Moyen</span><span className="text-zinc-300">{stats.activeRate} sacs/min</span></div>
            </div>
          </Card>

          <Card className="p-4 space-y-3 border-red-500/20 bg-red-500/5">
            <div className="flex items-center gap-2 font-semibold text-red-400">
              <AlertCircle className="w-4 h-4" />
              <span>Alertes Récentes</span>
              {recentAlerts.filter(a => !a.is_read).length > 0 && (
                <span className="ml-auto text-[9px] font-bold bg-orange-500 text-white px-1.5 py-0.5 rounded-full">
                  {recentAlerts.filter(a => !a.is_read).length}
                </span>
              )}
            </div>
            <div className="space-y-2 min-h-[60px]">
              {alertsLoading ? (
                <div className="flex justify-center py-3">
                  <Loader2 className="w-4 h-4 text-orange-500 animate-spin" />
                </div>
              ) : recentAlerts.length === 0 ? (
                <div className="text-[10px] text-zinc-600 italic text-center py-3">
                  Aucune alerte récente
                </div>
              ) : (
                recentAlerts.map(alert => (
                  <div
                    key={alert.id}
                    className={`text-xs border-l-2 pl-2 py-1 ${
                      alert.alert_type === 'critical' ? 'border-red-500' :
                      alert.alert_type === 'warning'  ? 'border-yellow-500' :
                                                        'border-blue-500'
                    }`}
                  >
                    <div className="flex items-center gap-1">
                      {alert.alert_type === 'critical' ? <AlertOctagon className="w-3 h-3 text-red-400 shrink-0" /> :
                       alert.alert_type === 'warning'  ? <Zap className="w-3 h-3 text-yellow-400 shrink-0" /> :
                                                         <Bell className="w-3 h-3 text-blue-400 shrink-0" />}
                      <span className={`font-medium ${
                        alert.alert_type === 'critical' ? 'text-red-300' :
                        alert.alert_type === 'warning'  ? 'text-yellow-300' :
                                                          'text-blue-300'
                      }`}>
                        {alert.title}
                      </span>
                      {!alert.is_read && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-orange-500 shrink-0" />}
                    </div>
                    <div className="text-zinc-500 text-[10px] truncate mt-0.5 pl-4">{alert.message}</div>
                  </div>
                ))
              )}
            </div>
            <Button
              variant="ghost"
              className="w-full text-[10px] text-zinc-500 hover:text-white"
              size="sm"
              onClick={() => window.location.href = '/alerts/management'}
            >
              VOIR TOUTES LES ALERTES
            </Button>
          </Card>
        </div>
      </div>
    </div>
  );
}

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Terminal, Play, HardDrive, Cpu, Activity, AlertTriangle,
  CheckCircle2, XCircle, Trash2, Download, ShieldCheck, Video,
  Zap, Gauge, RefreshCw, HelpCircle, Loader2, WifiOff,
  TrendingUp, Clock,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { PageHeader } from '@/components/PageHeader';
import { API_URL } from '@/lib/api';

// ─── Types ────────────────────────────────────────────────────────────────────
interface DiagMetrics {
  fps: number;
  inference_ms: number | null;
  accuracy_pct: number | null;
  cpu_pct: number;
  ram_pct: number;
  engine_alive: boolean;
  total_detections: number;
}

interface LogEntry {
  timestamp: string;
  time: string;
  type: 'INFO' | 'WARN' | 'ERROR' | 'SUCCESS' | 'DEBUG';
  message: string;
}

interface TestResult {
  name: string;
  key: string;
  status: 'pass' | 'fail' | 'warn' | 'running';
  metric: string;
  latency: string;
  detail: string;
}

interface BenchResult {
  frames_tested: number;
  avg_ms: number;
  min_ms: number;
  max_ms: number;
  fps_equiv: number;
  model: string;
  ran_at: string;
}

// ─── Info Tooltip ─────────────────────────────────────────────────────────────
function InfoTooltip({ text }: { text: string }) {
  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <HelpCircle className="w-3.5 h-3.5 text-zinc-600 hover:text-zinc-400 cursor-help shrink-0" />
        </TooltipTrigger>
        <TooltipContent className="max-w-xs text-xs bg-zinc-900 border-zinc-700 text-zinc-300">
          {text}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// ─── Log type colors ──────────────────────────────────────────────────────────
const LOG_COLORS: Record<string, string> = {
  ERROR:   'text-red-500',
  WARN:    'text-yellow-500',
  SUCCESS: 'text-green-500',
  DEBUG:   'text-purple-400',
  INFO:    'text-blue-400',
};

// ─── Test status dot ──────────────────────────────────────────────────────────
function TestBadge({ status }: { status: TestResult['status'] }) {
  if (status === 'running') return <Loader2 className="w-4 h-4 animate-spin text-orange-400" />;
  if (status === 'pass')    return <div className="w-2.5 h-2.5 rounded-full bg-green-500" />;
  if (status === 'warn')    return <div className="w-2.5 h-2.5 rounded-full bg-yellow-500" />;
  return <div className="w-2.5 h-2.5 rounded-full bg-red-500" />;
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function Diagnostics() {
  const [metrics, setMetrics]         = useState<DiagMetrics | null>(null);
  const [logs, setLogs]               = useState<LogEntry[]>([]);
  const [logFilter, setLogFilter]     = useState<'ALL' | 'INFO' | 'WARN' | 'ERROR' | 'SUCCESS'>('ALL');
  const [localLogs, setLocalLogs]     = useState<LogEntry[]>([]);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [loadingMetrics, setLoadingMetrics] = useState(true);
  const [loadingLogs, setLoadingLogs]       = useState(true);

  const [testResults, setTestResults]  = useState<TestResult[]>([]);
  const [testsRunning, setTestsRunning] = useState(false);
  const [runningKey, setRunningKey]    = useState<string | null>(null);

  const [benchResult, setBenchResult]   = useState<BenchResult | null>(null);
  const [benchRunning, setBenchRunning] = useState(false);
  const [benchHistory, setBenchHistory] = useState<BenchResult[]>([]);

  const [flash, setFlash] = useState<{ msg: string; ok: boolean } | null>(null);
  const logEndRef = useRef<HTMLDivElement>(null);

  const showFlash = (msg: string, ok: boolean) => {
    setFlash({ msg, ok });
    setTimeout(() => setFlash(null), 4000);
  };

  // ── Load metrics ──────────────────────────────────────────────────────────
  const loadMetrics = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/diagnostics/metrics`);
      if (res.ok) setMetrics(await res.json());
    } catch { /* silent */ } finally {
      setLoadingMetrics(false);
    }
  }, []);

  // ── Load logs ─────────────────────────────────────────────────────────────
  const loadLogs = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/diagnostics/logs?limit=80`);
      if (res.ok) {
        const data = await res.json();
        setLogs(data.logs ?? []);
      }
    } catch { /* silent */ } finally {
      setLoadingLogs(false);
    }
  }, []);

  useEffect(() => { setLocalLogs(logs); }, [logs]);

  useEffect(() => {
    if (logEndRef.current)
      logEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [localLogs]);

  useEffect(() => {
    loadMetrics();
    loadLogs();
  }, [loadMetrics, loadLogs]);

  useEffect(() => {
    if (!autoRefresh) return;
    const id = setInterval(() => { loadMetrics(); loadLogs(); }, 10_000);
    return () => clearInterval(id);
  }, [autoRefresh, loadMetrics, loadLogs]);

  // ── Download logs ─────────────────────────────────────────────────────────
  const handleDownloadLogs = async () => {
    try {
      const res = await fetch(`${API_URL}/api/diagnostics/logs/download`);
      if (!res.ok) throw new Error('Erreur téléchargement');
      const blob  = await res.blob();
      const cd    = res.headers.get('Content-Disposition') || '';
      const fname = cd.match(/filename=([^;]+)/)?.[1] || 'diagnostics.txt';
      const url   = URL.createObjectURL(blob);
      const a     = document.createElement('a');
      a.href = url; a.download = fname; a.click();
      URL.revokeObjectURL(url);
    } catch (e: any) { showFlash(e.message, false); }
  };

  // ── Run individual or all tests ───────────────────────────────────────────
  const runTest = async (key?: string) => {
    if (key) {
      setRunningKey(key);
      setTestResults(prev =>
        prev.length ? prev.map(r => r.key === key ? { ...r, status: 'running' as const } : r)
          : [{ name: key, key, status: 'running', metric: '…', latency: '…', detail: '' }]
      );
    } else {
      setTestsRunning(true);
      setTestResults(['yolo', 'db', 'disk', 'api', 'camera'].map(k => ({
        name: k, key: k, status: 'running' as const, metric: '…', latency: '…', detail: '',
      })));
    }
    try {
      const res  = await fetch(`${API_URL}/api/diagnostics/run-tests`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(key ? { test: key } : {}),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Erreur');
      if (key) {
        setTestResults(prev => prev.map(r => r.key === key ? (data.results[0] ?? r) : r));
      } else {
        setTestResults(data.results ?? []);
        const pass = data.passed ?? 0;
        const tot  = data.total  ?? 0;
        showFlash(`Diagnostic : ${pass}/${tot} tests réussis`, pass === tot);
      }
    } catch (e: any) {
      showFlash(e.message, false);
      if (!key) setTestResults([]);
    } finally {
      setTestsRunning(false);
      setRunningKey(null);
    }
  };

  // ── IA Benchmark ──────────────────────────────────────────────────────────
  const runBenchmark = async () => {
    setBenchRunning(true);
    setBenchResult(null);
    try {
      const res  = await fetch(`${API_URL}/api/diagnostics/benchmark`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Erreur benchmark');
      const result: BenchResult = { ...data, ran_at: new Date().toLocaleTimeString('fr-FR') };
      setBenchResult(result);
      setBenchHistory(prev => [result, ...prev].slice(0, 5));
      showFlash(`Benchmark — ${data.avg_ms} ms/img · ${data.fps_equiv} FPS`, true);
    } catch (e: any) {
      showFlash(e.message, false);
    } finally {
      setBenchRunning(false);
    }
  };

  // ── Full diagnostic ───────────────────────────────────────────────────────
  const runFullDiagnostic = async () => {
    await loadMetrics();
    await runTest();
  };

  // ── Derived ───────────────────────────────────────────────────────────────
  const filteredLogs = logFilter === 'ALL' ? localLogs : localLogs.filter(l => l.type === logFilter);
  const passedCount  = testResults.filter(r => r.status === 'pass').length;
  const failedCount  = testResults.filter(r => r.status === 'fail').length;
  const warningCount = testResults.filter(r => r.status === 'warn').length;

  return (
    <div className="p-6 space-y-6">
      {/* Flash */}
      {flash && (
        <div className={`fixed top-4 right-4 z-50 flex items-center gap-3 px-4 py-3 rounded-lg border text-sm font-medium shadow-lg
          ${flash.ok ? 'bg-green-950/80 border-green-600/40 text-green-400' : 'bg-red-950/80 border-red-600/40 text-red-400'}`}>
          {flash.ok ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
          {flash.msg}
        </div>
      )}

      {/* Header */}
      <PageHeader
        title="Outils de Diagnostic"
        description="Tests de performance, benchmarking et console de débogage avancée"
        breadcrumbs={[{ label: 'Maintenance' }, { label: 'Diagnostics' }]}
      >
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="ghost" size="sm"
            className={`text-xs gap-1.5 border ${autoRefresh ? 'text-orange-400 border-orange-500/30 bg-orange-500/5' : 'text-zinc-500 border-zinc-700'}`}
            onClick={() => setAutoRefresh(v => !v)}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${autoRefresh ? 'animate-spin' : ''}`} />
            Auto {autoRefresh ? 'ON' : 'OFF'}
          </Button>
          <Button variant="outline" className="border-zinc-800 text-white gap-2" onClick={handleDownloadLogs}>
            <Download className="w-4 h-4" /> Télécharger Logs
          </Button>
          <Button
            className="bg-orange-600 hover:bg-orange-700 text-white gap-2"
            onClick={runFullDiagnostic}
            disabled={testsRunning}
          >
            {testsRunning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
            Diagnostic Complet
          </Button>
        </div>
      </PageHeader>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Inference */}
        <Card className="p-4 bg-zinc-900/50 border-zinc-800">
          <div className="flex items-center gap-2 text-zinc-500 font-bold text-[10px] uppercase mb-2">
            <Cpu className="w-3 h-3 text-orange-500" />
            <span>IA Latence</span>
            <InfoTooltip text="Temps estimé d'inférence par frame depuis l'attribut last_inference_ms du moteur ou calculé via les intervalles de détection récents." />
          </div>
          {loadingMetrics ? <div className="h-7 bg-zinc-800 rounded animate-pulse mt-1" /> : (
            <>
              <div className="text-xl font-bold text-white">
                {metrics?.inference_ms != null ? metrics.inference_ms : '—'}
                <span className="text-xs text-zinc-500"> ms</span>
              </div>
              <Badge className={`mt-2 text-[8px] uppercase border ${
                metrics?.inference_ms != null && metrics.inference_ms < 20
                  ? 'bg-green-500/10 text-green-500 border-green-500/20'
                  : metrics?.inference_ms != null && metrics.inference_ms < 50
                  ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'
                  : 'bg-zinc-800 text-zinc-500 border-zinc-700'
              }`}>
                {metrics?.inference_ms != null
                  ? (metrics.inference_ms < 20 ? 'Excellent' : metrics.inference_ms < 50 ? 'Correct' : 'Lent')
                  : 'N/A'}
              </Badge>
            </>
          )}
        </Card>

        {/* FPS */}
        <Card className="p-4 bg-zinc-900/50 border-zinc-800">
          <div className="flex items-center gap-2 text-zinc-500 font-bold text-[10px] uppercase mb-2">
            <Activity className="w-3 h-3 text-blue-500" />
            <span>FPS Réel</span>
            <InfoTooltip text="Frames par seconde : attribut fps du moteur IA, ou estimé via le nombre de détections sur les 60 dernières secondes." />
          </div>
          {loadingMetrics ? <div className="h-7 bg-zinc-800 rounded animate-pulse mt-1" /> : (
            <>
              <div className="text-xl font-bold text-white">
                {metrics?.fps ?? '—'}<span className="text-xs text-zinc-500"> fps</span>
              </div>
              <p className="text-[10px] text-zinc-500 mt-2 italic">
                {metrics?.engine_alive ? 'Cible : 30 fps' : 'Moteur arrêté'}
              </p>
            </>
          )}
        </Card>

        {/* CPU / RAM */}
        <Card className="p-4 bg-zinc-900/50 border-zinc-800">
          <div className="flex items-center gap-2 text-zinc-500 font-bold text-[10px] uppercase mb-2">
            <Gauge className="w-3 h-3 text-yellow-500" />
            <span>CPU / RAM</span>
            <InfoTooltip text="Utilisation CPU instantanée (psutil.cpu_percent) et pourcentage RAM du serveur." />
          </div>
          {loadingMetrics ? <div className="h-7 bg-zinc-800 rounded animate-pulse mt-1" /> : (
            <>
              <div className="text-xl font-bold text-white">
                {metrics?.cpu_pct ?? '—'}<span className="text-xs text-zinc-500"> %</span>
              </div>
              <p className="text-[10px] text-zinc-500 mt-2 italic">RAM : {metrics?.ram_pct ?? '—'}%</p>
            </>
          )}
        </Card>

        {/* Précision */}
        <Card className="p-4 bg-zinc-900/50 border-zinc-800">
          <div className="flex items-center gap-2 text-zinc-500 font-bold text-[10px] uppercase mb-2">
            <TrendingUp className="w-3 h-3 text-zinc-500" />
            <span>Précision</span>
            <InfoTooltip text="Taux de sacs conformes (conforme / total) calculé sur l'ensemble des logs de détection en base de données." />
          </div>
          {loadingMetrics ? <div className="h-7 bg-zinc-800 rounded animate-pulse mt-1" /> : (
            <>
              <div className="text-xl font-bold text-white">
                {metrics?.accuracy_pct != null ? metrics.accuracy_pct : '—'}
                <span className="text-xs text-zinc-500"> %</span>
              </div>
              <p className="text-[10px] text-zinc-500 mt-2 italic">
                {metrics?.total_detections != null
                  ? `${metrics.total_detections.toLocaleString('fr-FR')} détections`
                  : '—'}
              </p>
            </>
          )}
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="logs" className="space-y-4">
        <TabsList className="bg-zinc-900 border border-zinc-800 p-1">
          <TabsTrigger value="logs" className="gap-2">
            <Terminal className="w-4 h-4" /> Console Système
          </TabsTrigger>
          <TabsTrigger value="tests" className="gap-2">
            <ShieldCheck className="w-4 h-4" /> Tests de Performance
            {testResults.length > 0 && (
              <Badge className={`ml-1 text-[8px] px-1.5 py-0 border ${
                failedCount > 0 ? 'bg-red-500/10 text-red-500 border-red-500/20'
                : warningCount > 0 ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'
                : 'bg-green-500/10 text-green-500 border-green-500/20'
              }`}>
                {passedCount}/{testResults.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="bench" className="gap-2">
            <Zap className="w-4 h-4" /> IA Benchmark
          </TabsTrigger>
        </TabsList>

        {/* ── Console Système ── */}
        <TabsContent value="logs">
          <Card className="bg-zinc-950 border-zinc-800 overflow-hidden font-mono text-xs">
            <div className="p-3 border-b border-zinc-800 bg-zinc-900/50 flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-3">
                <div className="flex gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-500/50" />
                  <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/50" />
                  <div className="w-2.5 h-2.5 rounded-full bg-green-500/50" />
                </div>
                <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">
                  Live Kernel Output
                </span>
                {loadingLogs && <Loader2 className="w-3 h-3 animate-spin text-zinc-600" />}
              </div>
              {/* Filter buttons */}
              <div className="flex items-center gap-1">
                {(['ALL', 'INFO', 'WARN', 'ERROR', 'SUCCESS'] as const).map(f => (
                  <button
                    key={f}
                    onClick={() => setLogFilter(f)}
                    className={`text-[8px] font-bold uppercase px-2 py-0.5 rounded transition-colors ${
                      logFilter === f
                        ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                        : 'text-zinc-600 hover:text-zinc-400'
                    }`}
                  >{f}</button>
                ))}
              </div>
              <div className="flex gap-1">
                <Button variant="ghost" size="icon" className="h-6 w-6 text-zinc-600 hover:text-white"
                  onClick={() => setLocalLogs([])} title="Effacer l'affichage">
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
                <Button variant="ghost" size="icon" className="h-6 w-6 text-zinc-600 hover:text-white"
                  onClick={handleDownloadLogs} title="Télécharger">
                  <Download className="w-3.5 h-3.5" />
                </Button>
                <Button variant="ghost" size="icon" className="h-6 w-6 text-zinc-600 hover:text-white"
                  onClick={loadLogs} title="Rafraîchir">
                  <RefreshCw className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>

            <ScrollArea className="h-[400px] p-4">
              {filteredLogs.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-32 gap-2 text-zinc-700">
                  <WifiOff className="w-6 h-6" />
                  <span className="text-[10px] uppercase font-bold tracking-widest">Aucun événement</span>
                </div>
              ) : (
                <div className="space-y-1.5">
                  {filteredLogs.map((log, i) => (
                    <div key={i} className="flex gap-4 group hover:bg-zinc-900/30 py-0.5 px-2 rounded">
                      <span className="text-zinc-700 shrink-0">[{log.time}]</span>
                      <span className={`font-bold shrink-0 w-16 ${LOG_COLORS[log.type] ?? 'text-zinc-500'}`}>
                        {log.type}
                      </span>
                      <span className="text-zinc-400 leading-relaxed break-all">{log.message}</span>
                    </div>
                  ))}
                  <div ref={logEndRef} className="flex gap-4 py-0.5 px-2">
                    <span className="text-zinc-700 shrink-0">[{new Date().toLocaleTimeString('fr-FR')}]</span>
                    <span className="text-orange-500 animate-pulse font-bold">_</span>
                  </div>
                </div>
              )}
            </ScrollArea>

            <div className="px-4 py-2 border-t border-zinc-800 bg-zinc-900/20 flex items-center justify-between text-[9px] text-zinc-600 font-bold uppercase tracking-widest">
              <span>{filteredLogs.length} entrée{filteredLogs.length !== 1 ? 's' : ''}</span>
              <span className="flex items-center gap-1">
                <Clock className="w-2.5 h-2.5" />
                Actualisation {autoRefresh ? '10s' : 'manuelle'}
              </span>
            </div>
          </Card>
        </TabsContent>

        {/* ── Tests de Performance ── */}
        <TabsContent value="tests" className="space-y-4">
          {testResults.length === 0 ? (
            <Card className="p-10 bg-zinc-900/50 border-zinc-800 border-dashed flex flex-col items-center gap-4">
              <ShieldCheck className="w-10 h-10 text-zinc-700" />
              <p className="text-zinc-500 text-sm text-center">
                Cliquez sur « Diagnostic Complet » pour lancer tous les tests,<br />
                ou utilisez les boutons individuels après le premier lancement.
              </p>
              <Button
                className="bg-orange-600 hover:bg-orange-700 text-white gap-2"
                onClick={() => runTest()}
                disabled={testsRunning}
              >
                {testsRunning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                Lancer tous les tests
              </Button>
            </Card>
          ) : (
            <>
              <div className="flex items-center gap-3 flex-wrap">
                <Badge className="bg-green-500/10 text-green-500 border-green-500/20 text-xs">
                  <CheckCircle2 className="w-3 h-3 mr-1" />{passedCount} réussis
                </Badge>
                {failedCount > 0 && (
                  <Badge className="bg-red-500/10 text-red-500 border-red-500/20 text-xs">
                    <XCircle className="w-3 h-3 mr-1" />{failedCount} échoués
                  </Badge>
                )}
                {warningCount > 0 && (
                  <Badge className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20 text-xs">
                    <AlertTriangle className="w-3 h-3 mr-1" />{warningCount} avertissements
                  </Badge>
                )}
                <Button
                  variant="outline" size="sm"
                  className="ml-auto border-zinc-700 text-xs text-white gap-1.5"
                  onClick={() => runTest()}
                  disabled={testsRunning}
                >
                  {testsRunning ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                  Relancer tout
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {testResults.map(test => {
                  const icon =
                    test.key === 'yolo'   ? <Zap className="w-5 h-5 text-orange-400" />    :
                    test.key === 'db'     ? <HardDrive className="w-5 h-5 text-blue-400" />  :
                    test.key === 'disk'   ? <HardDrive className="w-5 h-5 text-purple-400" />:
                    test.key === 'api'    ? <Activity className="w-5 h-5 text-green-400" />  :
                    <Video className="w-5 h-5 text-cyan-400" />;

                  return (
                    <Card key={test.key} className="p-4 bg-zinc-900/50 border-zinc-800 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <TestBadge status={test.status} />
                        <div className="p-2 rounded-lg bg-zinc-950 border border-zinc-800 shrink-0">{icon}</div>
                        <div className="min-w-0">
                          <h4 className="text-sm font-bold text-white truncate">{test.name}</h4>
                          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                            <span className="text-[10px] text-zinc-500 uppercase font-bold">{test.latency}</span>
                            {test.detail && (
                              <span className="text-[9px] text-zinc-600 italic truncate">{test.detail}</span>
                            )}
                          </div>
                        </div>
                      </div>
                      <Button
                        variant="outline" size="sm"
                        className="h-8 border-zinc-800 text-[10px] font-bold uppercase shrink-0"
                        onClick={() => runTest(test.key)}
                        disabled={testsRunning || runningKey === test.key}
                      >
                        {runningKey === test.key ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Tester'}
                      </Button>
                    </Card>
                  );
                })}
              </div>
            </>
          )}
        </TabsContent>

        {/* ── IA Benchmark ── */}
        <TabsContent value="bench" className="space-y-4">
          {benchRunning ? (
            <Card className="p-12 bg-zinc-950 border-zinc-800 flex flex-col items-center gap-6">
              <Loader2 className="w-12 h-12 text-orange-500 animate-spin" />
              <div className="text-center space-y-2">
                <p className="text-white font-bold">Benchmark en cours…</p>
                <p className="text-zinc-500 text-sm">20 inférences sur frame 640×640</p>
              </div>
            </Card>
          ) : !benchResult ? (
            <Card className="p-8 bg-zinc-950 border border-zinc-800 border-dashed flex flex-col items-center justify-center text-center gap-4">
              <Zap className="w-12 h-12 text-orange-500" />
              <div className="space-y-2">
                <h3 className="text-lg font-bold text-white">Prêt pour le Benchmark IA</h3>
                <p className="text-sm text-zinc-500 max-w-md">
                  Exécute 20 inférences sur un frame blanc 640×640 pour mesurer la latence réelle
                  du modèle YOLOv11 chargé.
                </p>
                <p className="text-xs text-zinc-600">
                  Le moteur IA doit être actif (session en cours ou démarrée).
                </p>
              </div>
              <Button
                className="bg-orange-600 hover:bg-orange-700 text-white px-8 h-12 gap-2 text-xs font-bold uppercase tracking-widest mt-4 shadow-xl shadow-orange-950/20"
                onClick={runBenchmark}
              >
                <Zap className="w-4 h-4" /> Démarrer le Benchmark
              </Button>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Main result */}
              <Card className="p-6 bg-zinc-900/50 border-zinc-800 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-white uppercase tracking-widest">Résultat Benchmark</h3>
                  <Badge className="bg-green-500/10 text-green-500 border-green-500/20 text-[9px]">
                    {benchResult.frames_tested} frames
                  </Badge>
                </div>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-orange-400">{benchResult.avg_ms}</div>
                    <div className="text-[9px] text-zinc-500 uppercase font-bold mt-1">ms/img (moy.)</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-white">{benchResult.fps_equiv}</div>
                    <div className="text-[9px] text-zinc-500 uppercase font-bold mt-1">FPS équivalent</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-white">{benchResult.min_ms}</div>
                    <div className="text-[9px] text-zinc-500 uppercase font-bold mt-1">ms (min)</div>
                  </div>
                </div>
                <div className="pt-2 border-t border-zinc-800 flex items-center justify-between text-[10px] text-zinc-600">
                  <span>Modèle : <span className="text-zinc-400 font-mono">{benchResult.model}</span></span>
                  <span>{benchResult.ran_at}</span>
                </div>
                <Button
                  variant="outline"
                  className="w-full border-zinc-700 text-zinc-300 gap-2 text-xs"
                  onClick={runBenchmark}
                >
                  <RefreshCw className="w-3.5 h-3.5" /> Relancer
                </Button>
              </Card>

              {/* History */}
              {benchHistory.length > 1 && (
                <Card className="p-6 bg-zinc-900/50 border-zinc-800 space-y-3">
                  <h3 className="text-sm font-bold text-white uppercase tracking-widest">Historique</h3>
                  <div className="space-y-2">
                    {benchHistory.map((b, i) => (
                      <div key={i} className="flex items-center justify-between py-1.5 border-b border-zinc-800/50 last:border-0">
                        <span className="text-[10px] text-zinc-500">{b.ran_at}</span>
                        <span className="text-xs font-bold text-white">{b.avg_ms} ms</span>
                        <span className="text-[10px] text-zinc-500">{b.fps_equiv} FPS</span>
                      </div>
                    ))}
                  </div>
                </Card>
              )}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

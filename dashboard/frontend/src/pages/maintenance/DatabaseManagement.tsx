import { useState, useEffect, useCallback } from 'react';
import {
  Database, HardDrive, Archive, Trash2, RefreshCw, Download,
  ShieldCheck, AlertTriangle, Zap, CheckCircle2, XCircle,
  Clock, HelpCircle, ChevronRight, Loader2,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { PageHeader } from '@/components/PageHeader';
import { API_URL } from '@/lib/api';

// ─── Types ────────────────────────────────────────────────────────────────────
interface TableStat {
  name: string;
  rows: number;
  size_kb: number;
  query_ms: number;
  last_record: string | null;
  status: 'optimized' | 'attention' | 'fragmented';
}

interface DbStats {
  db_size_mb: number;
  db_size_bytes: number;
  fragmentation_pct: number;
  integrity: string;
  disk_total_gb: number;
  disk_used_gb: number;
  disk_pct: number;
  retention_days: number;
  tables: TableStat[];
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

// ─── Confirm Dialog ───────────────────────────────────────────────────────────
function ConfirmDialog({
  open, title, message, confirmLabel, danger,
  onConfirm, onCancel,
}: {
  open: boolean; title: string; message: string; confirmLabel: string;
  danger?: boolean; onConfirm: () => void; onCancel: () => void;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-6 w-full max-w-md shadow-2xl space-y-4">
        <div className="flex items-center gap-3">
          <AlertTriangle className={`w-6 h-6 ${danger ? 'text-red-500' : 'text-yellow-500'}`} />
          <h3 className="text-white font-bold text-base">{title}</h3>
        </div>
        <p className="text-zinc-400 text-sm leading-relaxed">{message}</p>
        <div className="flex gap-3 justify-end pt-2">
          <Button variant="outline" className="border-zinc-700 text-zinc-300" onClick={onCancel}>
            Annuler
          </Button>
          <Button
            className={danger ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-orange-600 hover:bg-orange-700 text-white'}
            onClick={onConfirm}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function fmtSize(kb: number): string {
  if (kb >= 1024 * 1024) return `${(kb / 1024 / 1024).toFixed(1)} GB`;
  if (kb >= 1024) return `${(kb / 1024).toFixed(1)} MB`;
  return `${kb.toFixed(0)} KB`;
}

function fmtRows(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

function fmtDate(iso: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' });
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function DatabaseManagement() {
  const [stats, setStats] = useState<DbStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [flash, setFlash] = useState<{ msg: string; ok: boolean } | null>(null);
  const [busy, setBusy] = useState<string | null>(null); // which action is running
  const [confirm, setConfirm] = useState<{ type: 'archive' | 'purge' } | null>(null);

  // ── Flash banner ────────────────────────────────────────────────────────────
  const showFlash = (msg: string, ok: boolean) => {
    setFlash({ msg, ok });
    setTimeout(() => setFlash(null), 4500);
  };

  // ── Load stats ──────────────────────────────────────────────────────────────
  const loadStats = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/database/stats`);
      if (!res.ok) throw new Error('Erreur chargement stats');
      setStats(await res.json());
    } catch (e: any) {
      showFlash(e.message || 'Impossible de charger les statistiques', false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadStats(); }, [loadStats]);

  // ── Reindex ─────────────────────────────────────────────────────────────────
  const handleReindex = async () => {
    setBusy('reindex');
    try {
      const res = await fetch(`${API_URL}/api/database/reindex`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Erreur');
      showFlash(`Réindexation terminée en ${data.elapsed_ms} ms`, true);
      await loadStats();
    } catch (e: any) {
      showFlash(e.message, false);
    } finally {
      setBusy(null);
    }
  };

  // ── Backup ──────────────────────────────────────────────────────────────────
  const handleBackup = async () => {
    setBusy('backup');
    try {
      const res = await fetch(`${API_URL}/api/database/backup`);
      if (!res.ok) throw new Error('Erreur téléchargement backup');
      const blob = await res.blob();
      const cd = res.headers.get('Content-Disposition') || '';
      const fname = cd.match(/filename=([^;]+)/)?.[1] || 'cement_counter_backup.db';
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = fname; a.click();
      URL.revokeObjectURL(url);
      showFlash('Backup téléchargé avec succès', true);
    } catch (e: any) {
      showFlash(e.message, false);
    } finally {
      setBusy(null);
    }
  };

  // ── Optimize ────────────────────────────────────────────────────────────────
  const handleOptimize = async () => {
    setBusy('optimize');
    try {
      const res = await fetch(`${API_URL}/api/database/optimize`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Erreur optimisation');
      const saved = data.saved_kb > 0 ? ` — ${data.saved_kb} KB récupérés` : '';
      showFlash(`Optimisation terminée en ${data.elapsed_ms} ms${saved}`, true);
      await loadStats();
    } catch (e: any) {
      showFlash(e.message, false);
    } finally {
      setBusy(null);
    }
  };

  // ── Archive ─────────────────────────────────────────────────────────────────
  const handleArchive = async () => {
    setConfirm(null);
    setBusy('archive');
    try {
      const res = await fetch(`${API_URL}/api/database/archive`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ days: stats?.retention_days ?? 90 }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Erreur archivage');
      showFlash(
        data.archived_sessions === 0
          ? 'Aucune session à archiver pour cette période'
          : `Archivage : ${data.archived_sessions} sessions + ${data.archived_logs} logs supprimés`,
        true
      );
      await loadStats();
    } catch (e: any) {
      showFlash(e.message, false);
    } finally {
      setBusy(null);
    }
  };

  // ── Purge ───────────────────────────────────────────────────────────────────
  const handlePurge = async () => {
    setConfirm(null);
    setBusy('purge');
    try {
      const res = await fetch(`${API_URL}/api/database/purge`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ days: stats?.retention_days ?? 90 }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Erreur purge');
      showFlash(
        `Purge : ${data.purged_logs} logs supprimés (${data.purged_files} fichiers)`,
        true
      );
      await loadStats();
    } catch (e: any) {
      showFlash(e.message, false);
    } finally {
      setBusy(null);
    }
  };

  // ── Derived values ──────────────────────────────────────────────────────────
  const integrityOk  = !stats || stats.integrity === 'ok';
  const healthLabel  = loading ? '…' : integrityOk ? 'OPTIMAL' : 'DÉGRADÉ';
  const healthColor  = integrityOk ? 'text-green-400' : 'text-red-400';
  const fragBadge    = stats
    ? stats.fragmentation_pct > 20 ? { label: 'Fragmenté', color: 'text-red-500 border-red-500/20 bg-red-500/10' }
    : stats.fragmentation_pct > 10 ? { label: 'Attention', color: 'text-yellow-500 border-yellow-500/20 bg-yellow-500/10' }
    : { label: 'Optimal', color: 'text-green-500 border-green-500/20 bg-green-500/10' }
    : null;

  const statusBadge = (s: TableStat['status']) =>
    s === 'optimized' ? 'bg-green-500/10 text-green-500 border-green-500/20'
    : s === 'attention' ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'
    : 'bg-red-500/10 text-red-500 border-red-500/20';

  const statusLabel = (s: TableStat['status']) =>
    s === 'optimized' ? 'Optimisé' : s === 'attention' ? 'Attention' : 'Fragmenté';

  return (
    <div className="p-6 space-y-6">
      {/* ── Confirm Dialog ── */}
      <ConfirmDialog
        open={confirm?.type === 'archive'}
        title="Archiver les anciennes sessions ?"
        message={`Cette action supprimera définitivement toutes les sessions terminées et leurs logs datant de plus de ${stats?.retention_days ?? 90} jours. Cette opération est irréversible.`}
        confirmLabel="Archiver"
        onConfirm={handleArchive}
        onCancel={() => setConfirm(null)}
      />
      <ConfirmDialog
        open={confirm?.type === 'purge'}
        title="Purge définitive des logs anciens ?"
        message={`Tous les logs de détection et leurs captures datant de plus de ${stats?.retention_days ?? 90} jours seront supprimés de façon permanente. Cette opération est irréversible.`}
        confirmLabel="Purger"
        danger
        onConfirm={handlePurge}
        onCancel={() => setConfirm(null)}
      />

      {/* ── Flash ── */}
      {flash && (
        <div className={`fixed top-4 right-4 z-50 flex items-center gap-3 px-4 py-3 rounded-lg border text-sm font-medium shadow-lg transition-all
          ${flash.ok ? 'bg-green-950/80 border-green-600/40 text-green-400' : 'bg-red-950/80 border-red-600/40 text-red-400'}`}>
          {flash.ok ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
          {flash.msg}
        </div>
      )}

      {/* ── Header ── */}
      <PageHeader
        title="Gestion de la Base de Données"
        description="Optimisation du stockage, archivage et intégrité des données de production"
        breadcrumbs={[{ label: 'Maintenance' }, { label: 'Base de Données' }]}
      >
        <Button
          variant="outline"
          className="border-zinc-800 text-white gap-2"
          onClick={handleReindex}
          disabled={!!busy}
        >
          {busy === 'reindex' ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          Réindexer Tout
        </Button>
        <Button
          className="bg-orange-600 hover:bg-orange-700 text-white gap-2 shadow-lg shadow-orange-900/20"
          onClick={handleBackup}
          disabled={!!busy}
        >
          {busy === 'backup' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
          Backup (.db)
        </Button>
      </PageHeader>

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Storage */}
        <Card className="p-6 bg-zinc-900/50 border-zinc-800 flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Utilisation Disque</span>
              <InfoTooltip text="Espace disque total utilisé sur la partition du serveur (données + captures + exports)." />
            </div>
            <Database className="w-5 h-5 text-orange-500" />
          </div>
          <div className="space-y-4">
            {loading ? (
              <div className="h-10 bg-zinc-800 rounded animate-pulse" />
            ) : (
              <>
                <div className="text-4xl font-bold text-white">
                  {stats?.disk_used_gb.toFixed(1)}
                  <span className="text-lg text-zinc-500 font-normal"> GB</span>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-[10px] uppercase font-bold text-zinc-500">
                    <span>Quota ({stats?.disk_total_gb} GB)</span>
                    <span className="text-white">{stats?.disk_pct}%</span>
                  </div>
                  <Progress value={stats?.disk_pct ?? 0} className="h-1.5 bg-zinc-800" />
                </div>
                <div className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest">
                  BDD SQLite : {stats?.db_size_mb} MB
                </div>
              </>
            )}
          </div>
        </Card>

        {/* Health */}
        <Card className="p-6 bg-zinc-900/50 border-zinc-800 flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Santé DB</span>
              <InfoTooltip text="Résultat du PRAGMA quick_check SQLite + taux de fragmentation des pages (pages libres / total)." />
            </div>
            <ShieldCheck className={`w-5 h-5 ${integrityOk ? 'text-green-500' : 'text-red-500'}`} />
          </div>
          <div className="space-y-4">
            {loading ? (
              <div className="h-10 bg-zinc-800 rounded animate-pulse" />
            ) : (
              <>
                <div className={`text-4xl font-bold ${healthColor}`}>{healthLabel}</div>
                <div className="flex items-center gap-2">
                  {fragBadge && (
                    <Badge className={`text-[9px] font-bold uppercase px-2 py-0.5 border ${fragBadge.color}`}>
                      Frag. {stats?.fragmentation_pct}%
                    </Badge>
                  )}
                </div>
                <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest italic flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${integrityOk ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
                  Intégrité : {stats?.integrity}
                </div>
              </>
            )}
          </div>
        </Card>

        {/* Archivage */}
        <Card className="p-6 bg-zinc-900/50 border-zinc-800 flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Rétention</span>
              <InfoTooltip text="Durée de conservation des logs configurée dans les paramètres système. L'archivage et la purge utilisent cette valeur." />
            </div>
            <Archive className="w-5 h-5 text-blue-500" />
          </div>
          <div className="space-y-4">
            {loading ? (
              <div className="h-10 bg-zinc-800 rounded animate-pulse" />
            ) : (
              <>
                <div className="text-4xl font-bold text-white">
                  {stats?.retention_days}
                  <span className="text-lg text-zinc-500 font-normal"> jours</span>
                </div>
                <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest italic">
                  Politique de rétention active
                </div>
              </>
            )}
          </div>
        </Card>
      </div>

      {/* ── Table Stats + Actions ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Table stats */}
        <Card className="lg:col-span-2 bg-zinc-900/50 border-zinc-800 overflow-hidden">
          <div className="p-4 border-b border-zinc-800 bg-zinc-900/30 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-white uppercase tracking-widest">Statistiques des Tables</h3>
              <InfoTooltip text="Taille et nombre de lignes par table SQLite (source : dbstat virtual table). Le statut dépend du taux de fragmentation global." />
            </div>
            <Button variant="ghost" size="icon" className="h-7 w-7 text-zinc-500 hover:text-white" onClick={loadStats} disabled={loading}>
              {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
            </Button>
          </div>
          <div className="divide-y divide-zinc-800/50 overflow-y-auto" style={{ maxHeight: '17.5rem' }}>
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="p-4 flex items-center gap-4">
                  <div className="w-10 h-10 bg-zinc-800 rounded-lg animate-pulse" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 bg-zinc-800 rounded w-1/3 animate-pulse" />
                    <div className="h-2 bg-zinc-800 rounded w-1/2 animate-pulse" />
                  </div>
                </div>
              ))
            ) : (
              (stats?.tables ?? []).map((tbl) => (
                <div key={tbl.name} className="p-4 hover:bg-zinc-800/30 transition-colors flex items-center justify-between">
                  <div className="flex gap-4">
                    <div className="p-2.5 rounded-lg bg-zinc-950 border border-zinc-800">
                      <HardDrive className="w-4 h-4 text-zinc-500" />
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-sm font-bold text-white font-mono">{tbl.name}</h4>
                      <div className="flex gap-3 flex-wrap">
                        <span className="text-[10px] text-zinc-500 font-bold uppercase">{fmtRows(tbl.rows)} lignes</span>
                        <span className="text-[10px] text-zinc-500 font-bold uppercase">{fmtSize(tbl.size_kb)}</span>
                        <span className="text-[10px] text-zinc-600 font-bold uppercase flex items-center gap-1">
                          <Clock className="w-2.5 h-2.5" />{tbl.query_ms} ms
                        </span>
                      </div>
                      {tbl.last_record && (
                        <div className="text-[9px] text-zinc-600 italic">Dernier enr. : {fmtDate(tbl.last_record)}</div>
                      )}
                    </div>
                  </div>
                  <Badge className={`text-[9px] font-bold uppercase px-2 py-0.5 border ${statusBadge(tbl.status)}`}>
                    {statusLabel(tbl.status)}
                  </Badge>
                </div>
              ))
            )}
          </div>
        </Card>

        {/* Actions */}
        <div className="space-y-6">
          <Card className="p-6 bg-zinc-900/50 border-zinc-800 space-y-6">
            <div className="flex items-center gap-2 border-b border-zinc-800 pb-4">
              <Archive className="w-5 h-5 text-orange-500" />
              <h3 className="text-sm font-bold text-white uppercase tracking-widest">Actions de Maintenance</h3>
            </div>
            <div className="space-y-3">
              {/* Optimize */}
              <Button
                variant="outline"
                className="w-full justify-between gap-3 border-zinc-800 h-12 text-xs text-white hover:bg-zinc-800"
                onClick={handleOptimize}
                disabled={!!busy}
              >
                <span className="flex items-center gap-2">
                  {busy === 'optimize' ? <Loader2 className="w-4 h-4 animate-spin text-orange-500" /> : <Zap className="w-4 h-4 text-orange-500" />}
                  Optimiser (VACUUM + ANALYZE)
                </span>
                <InfoTooltip text="Compacte la base de données (VACUUM) pour récupérer l'espace des pages supprimées, et met à jour les statistiques du planificateur de requêtes (ANALYZE)." />
              </Button>

              {/* Archive */}
              <Button
                variant="outline"
                className="w-full justify-between gap-3 border-zinc-800 h-12 text-xs text-white hover:bg-zinc-800"
                onClick={() => setConfirm({ type: 'archive' })}
                disabled={!!busy}
              >
                <span className="flex items-center gap-2">
                  {busy === 'archive' ? <Loader2 className="w-4 h-4 animate-spin text-blue-500" /> : <Archive className="w-4 h-4 text-blue-500" />}
                  Archiver Anciennes Sessions
                </span>
                <InfoTooltip text={`Supprime les sessions terminées et tous leurs logs datant de plus de ${stats?.retention_days ?? 90} jours.`} />
              </Button>

              {/* Purge */}
              <Button
                className="w-full justify-between gap-3 bg-red-950/20 text-red-500 border border-red-900/50 h-12 text-xs font-bold uppercase tracking-widest hover:bg-red-950/40"
                onClick={() => setConfirm({ type: 'purge' })}
                disabled={!!busy}
              >
                <span className="flex items-center gap-2">
                  {busy === 'purge' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                  Purge Définitive (+{stats?.retention_days ?? 90}j)
                </span>
                <InfoTooltip text="Suppression définitive des logs de détection et de leurs captures image datant de plus de la période de rétention. Irréversible." />
              </Button>
            </div>
          </Card>

          {/* Alert card */}
          {stats && stats.fragmentation_pct > 10 && (
            <Card className="p-5 bg-yellow-600/5 border border-yellow-500/20 space-y-3">
              <div className="flex items-center gap-2 text-yellow-500">
                <AlertTriangle className="w-4 h-4" />
                <h4 className="text-[10px] font-bold uppercase tracking-widest">Fragmentation Détectée</h4>
              </div>
              <p className="text-[11px] text-zinc-400 leading-relaxed italic">
                La base de données est fragmentée à {stats.fragmentation_pct}%. Une optimisation (VACUUM) est recommandée pour récupérer de l'espace et améliorer les performances.
              </p>
              <Button
                variant="link"
                className="p-0 text-yellow-500 text-[10px] font-bold uppercase h-auto flex items-center gap-1"
                onClick={handleOptimize}
                disabled={!!busy}
              >
                Lancer Optimisation <ChevronRight className="w-3 h-3" />
              </Button>
            </Card>
          )}

          {stats && stats.fragmentation_pct <= 10 && (
            <Card className="p-5 bg-green-600/5 border border-green-500/20 space-y-3">
              <div className="flex items-center gap-2 text-green-500">
                <CheckCircle2 className="w-4 h-4" />
                <h4 className="text-[10px] font-bold uppercase tracking-widest">Base de Données Saine</h4>
              </div>
              <p className="text-[11px] text-zinc-400 leading-relaxed italic">
                Intégrité vérifiée, fragmentation à {stats.fragmentation_pct}%. Aucune action immédiate requise.
              </p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

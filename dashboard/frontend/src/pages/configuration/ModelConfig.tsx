import { useCallback, useEffect, useRef, useState } from 'react';
import {
  RotateCcw, Plus, Target, Zap, BrainCircuit,
  Loader2, Trash2, Eye, CheckCircle2, XCircle, Upload,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { API_URL, fetchApi } from '@/lib/api';

// ── Types ─────────────────────────────────────────────────────────────────────

interface ModelRuntimeConfig {
  selected_model: string;
  confidence_threshold: number;
  nms_iou_threshold: number;
  max_detections: number;
  inference_size: number;
  tracking_persistence: boolean;
}

interface AvailableModel {
  path: string;
  filename: string;
  size_mb: number;
  is_active: boolean;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/** POST / DELETE with JSON error detail extracted from backend response. */
async function apiFetch(url: string, init: RequestInit): Promise<unknown> {
  const res = await fetch(url, init);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as { detail?: string }).detail ?? `Erreur ${res.status}`);
  }
  return res.json();
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function ModelConfig() {
  // Data
  const [cfg, setCfg] = useState<ModelRuntimeConfig | null>(null);
  const [diskModels, setDiskModels] = useState<AvailableModel[]>([]);
  // activeModelPath = chemin réel chargé par le moteur (source de vérité)
  const [activeModelPath, setActiveModelPath] = useState<string>('');

  // Activate
  const [activating, setActivating] = useState<string | null>(null);
  const [activateMsg, setActivateMsg] = useState<{ ok: boolean; text: string } | null>(null);

  // Upload
  const [uploading, setUploading] = useState(false);
  const [uploadMsg, setUploadMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Detail dialog
  const [detailModel, setDetailModel] = useState<AvailableModel | null>(null);

  // Delete dialog
  const [deleteTarget, setDeleteTarget] = useState<AvailableModel | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  // ── Data loading ────────────────────────────────────────────────────────────

  const loadData = useCallback(async () => {
    try {
      const [cfgData, listData] = await Promise.all([
        fetchApi('/api/config/model'),
        fetchApi('/api/models/list'),
      ]);
      const list = listData as { models: AvailableModel[]; active_model: string };
      setCfg(cfgData as ModelRuntimeConfig);
      setDiskModels(list.models);
      setActiveModelPath(list.active_model ?? '');
    } catch { /* silently ignore */ }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // ── Handlers ────────────────────────────────────────────────────────────────

  const flash = (
    setter: (v: { ok: boolean; text: string } | null) => void,
    ok: boolean,
    text: string,
  ) => {
    setter({ ok, text });
    setTimeout(() => setter(null), 4000);
  };

  const handleActivate = async (modelPath: string) => {
    setActivating(modelPath);
    try {
      await apiFetch(`${API_URL}/api/models/activate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model_path: modelPath }),
      });
      flash(setActivateMsg, true, 'Modèle activé avec succès.');
      await loadData();
    } catch (e) {
      flash(setActivateMsg, false, (e as Error).message);
    } finally {
      setActivating(null);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!file.name.endsWith('.pt')) {
      flash(setUploadMsg, false, 'Seuls les fichiers .pt sont acceptés.');
      return;
    }
    setUploading(true);
    try {
      const form = new FormData();
      form.append('file', file);
      await apiFetch(`${API_URL}/api/models/upload`, { method: 'POST', body: form });
      flash(setUploadMsg, true, `${file.name} ajouté avec succès.`);
      await loadData();
    } catch (e) {
      flash(setUploadMsg, false, (e as Error).message);
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    setDeleteError('');
    try {
      await apiFetch(`${API_URL}/api/models/${encodeURIComponent(deleteTarget.filename)}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      });
      setDeleteTarget(null);
      await loadData();
    } catch (e) {
      setDeleteError((e as Error).message);
    } finally {
      setDeleting(false);
    }
  };

  // ── Computed ────────────────────────────────────────────────────────────────

  // activeModelPath vient du moteur (source de vérité), pas de la DB
  const activeModel = diskModels.find((m) => m.path === activeModelPath) ?? null;

  const confidencePct = Math.round((cfg?.confidence_threshold ?? 0.7) * 100);

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="p-6 space-y-6">

      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Gestion des Modèles IA</h1>
          <p className="text-muted-foreground">Contrôle des versions du moteur YOLO et suivi des performances</p>
        </div>
        <Button
          className="bg-orange-600 hover:bg-orange-700 text-white gap-2 h-11 px-6 shadow-lg shadow-orange-900/20"
          disabled={uploading}
          onClick={() => fileInputRef.current?.click()}
        >
          {uploading
            ? <Loader2 className="w-4 h-4 animate-spin" />
            : <Plus className="w-4 h-4" />}
          Ajouter Un Nouveau Modèle
        </Button>
        {/* Hidden file input — only .pt accepted */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".pt"
          className="hidden"
          onChange={handleFileChange}
        />
      </div>

      {/* ── Status banners ── */}
      {activateMsg && (
        <div className={`flex items-center gap-2 text-xs rounded-lg px-4 py-2 border ${activateMsg.ok ? 'text-green-400 bg-green-500/10 border-green-500/20' : 'text-red-400 bg-red-500/10 border-red-500/20'}`}>
          {activateMsg.ok ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <XCircle className="w-4 h-4 shrink-0" />}
          {activateMsg.text}
        </div>
      )}
      {uploadMsg && (
        <div className={`flex items-center gap-2 text-xs rounded-lg px-4 py-2 border ${uploadMsg.ok ? 'text-green-400 bg-green-500/10 border-green-500/20' : 'text-red-400 bg-red-500/10 border-red-500/20'}`}>
          {uploadMsg.ok ? <Upload className="w-4 h-4 shrink-0" /> : <XCircle className="w-4 h-4 shrink-0" />}
          {uploadMsg.text}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ── Model list (2/3) ── */}
        <div className="lg:col-span-2 space-y-4">
          <h3 className="text-sm font-bold text-white uppercase tracking-widest">Historique des Versions</h3>

          {diskModels.length === 0 && (
            <Card className="p-8 bg-zinc-900/50 border-zinc-800 text-center text-zinc-500 text-sm">
              Aucun modèle trouvé dans{' '}
              <span className="font-mono text-zinc-300">models/</span>.
              Ajoutez un fichier <span className="font-mono text-zinc-300">.pt</span> pour commencer.
            </Card>
          )}

          {[...diskModels].sort((a, b) =>
            Number(b.path === activeModelPath) - Number(a.path === activeModelPath)
          ).map((m) => {
            const isActive = m.path === activeModelPath;
            const isLoadingThis = activating === m.path;

            return (
              <Card
                key={m.path}
                className={`p-5 bg-zinc-900/50 border-zinc-800 hover:border-zinc-700 transition-all ${isActive ? 'border-orange-500/30 ring-1 ring-orange-500/20' : ''}`}
              >
                <div className="flex items-start justify-between gap-4">
                  {/* Left — icon + info */}
                  <div className="flex gap-4 flex-1 min-w-0">
                    <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 h-fit shrink-0">
                      <BrainCircuit className={`w-5 h-5 ${isActive ? 'text-orange-500' : 'text-zinc-600'}`} />
                    </div>
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-3 flex-wrap">
                        <h4 className="text-sm font-bold text-white font-mono truncate">{m.path}</h4>
                        {isActive && (
                          <Badge className="bg-green-500/10 text-green-500 border-green-500/20 text-[9px] font-bold shrink-0">ACTIF</Badge>
                        )}
                      </div>
                      <div className="flex gap-6 pt-2">
                        <div className="flex flex-col">
                          <span className="text-[9px] text-zinc-600 uppercase font-bold tracking-tighter">Taille</span>
                          <span className="text-sm font-mono text-white font-bold">{m.size_mb} MB</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[9px] text-zinc-600 uppercase font-bold tracking-tighter">Fichier</span>
                          <span className="text-sm font-mono text-white font-bold">{m.filename}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right — actions */}
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    {/* Activate */}
                    {!isActive && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 border-zinc-700 text-[10px] font-bold uppercase tracking-widest gap-1.5 text-orange-400 hover:text-orange-300 hover:border-orange-500/40"
                        disabled={!!activating}
                        onClick={() => handleActivate(m.path)}
                      >
                        {isLoadingThis
                          ? <Loader2 className="w-3 h-3 animate-spin" />
                          : <RotateCcw className="w-3 h-3" />}
                        Activer
                      </Button>
                    )}
                    {/* Details */}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 text-[10px] font-bold uppercase text-zinc-500 hover:text-white gap-1"
                      onClick={() => setDetailModel(m)}
                    >
                      <Eye className="w-3 h-3" /> Voir Métriques Détaillées
                    </Button>
                    {/* Delete — disabled for active model */}
                    {!isActive && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 text-[10px] font-bold uppercase text-red-500/50 hover:text-red-400 gap-1"
                        onClick={() => { setDeleteError(''); setDeleteTarget(m); }}
                      >
                        <Trash2 className="w-3 h-3" /> Supprimer
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        {/* ── Right panel (1/3) ── */}
        <div className="space-y-6">
          <Card className="p-6 bg-zinc-900/50 border-zinc-800 space-y-6">
            <div className="flex items-center gap-2 border-b border-zinc-800 pb-4">
              <Target className="w-5 h-5 text-orange-500" />
              <h3 className="text-sm font-bold text-white uppercase tracking-widest">Performance Active</h3>
            </div>

            <div className="space-y-6">
              {/* Confidence */}
              <div className="space-y-3">
                <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                  <span>Seuil de Confiance</span>
                  <span className="text-orange-500">{confidencePct}%</span>
                </div>
                <Progress
                  value={confidencePct}
                  className="h-1.5 bg-zinc-800 [&>div]:bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.3)]"
                />
              </div>

              {/* NMS */}
              <div className="space-y-3">
                <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                  <span>Stabilité Détection (NMS)</span>
                  <span className="text-white">{cfg ? cfg.nms_iou_threshold.toFixed(2) : '—'}</span>
                </div>
                <Progress value={(cfg?.nms_iou_threshold ?? 0.45) * 100} className="h-1.5 bg-zinc-800" />
              </div>

              {/* Runtime block */}
              <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 space-y-3">
                <div className="flex items-center gap-2 text-[10px] font-bold text-zinc-500 uppercase">
                  <Zap className="w-4 h-4 text-yellow-500" /> Runtime Inférence
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-zinc-500">Modèle actif :</span>
                  <span className="text-white font-mono text-right truncate max-w-[130px]" title={activeModel?.filename}>
                    {activeModel?.filename ?? '—'}
                  </span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-zinc-500">Max Det :</span>
                  <span className="text-white font-mono">{cfg?.max_detections ?? '—'}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-zinc-500">Image Size :</span>
                  <span className="text-white font-mono">{cfg?.inference_size ?? '—'}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-zinc-500">Tracking :</span>
                  <span className={`font-mono ${cfg?.tracking_persistence ? 'text-green-400' : 'text-zinc-400'}`}>
                    {cfg ? (cfg.tracking_persistence ? 'Activé' : 'Désactivé') : '—'}
                  </span>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* ── Detail Dialog ──────────────────────────────────────────────────────── */}
      <Dialog open={!!detailModel} onOpenChange={(open: boolean) => { if (!open) setDetailModel(null); }}>
        <DialogContent className="bg-zinc-900 border-zinc-800 text-white max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <BrainCircuit className="w-5 h-5 text-orange-500" />
              Métriques du modèle
            </DialogTitle>
            <DialogDescription className="text-zinc-400 font-mono text-xs break-all">
              {detailModel?.path}
            </DialogDescription>
          </DialogHeader>

          {detailModel && (
            <div className="space-y-4 pt-2">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-lg bg-zinc-950 border border-zinc-800 space-y-1">
                  <span className="text-[9px] text-zinc-500 uppercase font-bold tracking-widest">Fichier</span>
                  <p className="text-sm text-white font-mono break-all">{detailModel.filename}</p>
                </div>
                <div className="p-3 rounded-lg bg-zinc-950 border border-zinc-800 space-y-1">
                  <span className="text-[9px] text-zinc-500 uppercase font-bold tracking-widest">Taille</span>
                  <p className="text-sm text-white font-mono">{detailModel.size_mb} MB</p>
                </div>
                <div className="p-3 rounded-lg bg-zinc-950 border border-zinc-800 space-y-1">
                  <span className="text-[9px] text-zinc-500 uppercase font-bold tracking-widest">Chemin</span>
                  <p className="text-sm text-white font-mono break-all">{detailModel.path}</p>
                </div>
                <div className="p-3 rounded-lg bg-zinc-950 border border-zinc-800 space-y-1">
                  <span className="text-[9px] text-zinc-500 uppercase font-bold tracking-widest">Statut</span>
                  <p className="text-sm">
                    {detailModel.path === activeModelPath
                      ? <span className="text-green-400 font-bold">Actif</span>
                      : <span className="text-zinc-400">Inactif</span>}
                  </p>
                </div>
              </div>

              {/* Active inference params — shown only for the active model */}
              {cfg && detailModel.path === activeModelPath && (
                <div className="p-4 rounded-lg bg-zinc-950 border border-zinc-800 space-y-3">
                  <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                    Paramètres d'inférence actifs
                  </p>
                  <div className="grid grid-cols-2 gap-y-2 gap-x-4 text-xs">
                    <div className="flex justify-between gap-2">
                      <span className="text-zinc-500">Confiance :</span>
                      <span className="text-white font-mono">{cfg.confidence_threshold}</span>
                    </div>
                    <div className="flex justify-between gap-2">
                      <span className="text-zinc-500">NMS IoU :</span>
                      <span className="text-white font-mono">{cfg.nms_iou_threshold}</span>
                    </div>
                    <div className="flex justify-between gap-2">
                      <span className="text-zinc-500">Max Det :</span>
                      <span className="text-white font-mono">{cfg.max_detections}</span>
                    </div>
                    <div className="flex justify-between gap-2">
                      <span className="text-zinc-500">Image Size :</span>
                      <span className="text-white font-mono">{cfg.inference_size}</span>
                    </div>
                    <div className="flex justify-between gap-2 col-span-2">
                      <span className="text-zinc-500">Tracking :</span>
                      <span className={`font-mono ${cfg.tracking_persistence ? 'text-green-400' : 'text-zinc-400'}`}>
                        {cfg.tracking_persistence ? 'Activé' : 'Désactivé'}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex gap-2 pt-2">
                {detailModel.path !== activeModelPath && (
                  <Button
                    className="flex-1 bg-orange-600 hover:bg-orange-700 text-white gap-2"
                    disabled={!!activating}
                    onClick={() => { handleActivate(detailModel.path); setDetailModel(null); }}
                  >
                    {activating === detailModel.path
                      ? <Loader2 className="w-4 h-4 animate-spin" />
                      : <RotateCcw className="w-4 h-4" />}
                    Activer ce modèle
                  </Button>
                )}
                <Button
                  variant="outline"
                  className="flex-1 border-zinc-700 text-white"
                  onClick={() => setDetailModel(null)}
                >
                  Fermer
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ── Delete Confirmation Dialog ─────────────────────────────────────────── */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open: boolean) => { if (!open) { setDeleteTarget(null); setDeleteError(''); } }}
      >
        <AlertDialogContent className="bg-zinc-900 border-zinc-800 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer ce modèle ?</AlertDialogTitle>
            <AlertDialogDescription className="text-zinc-400">
              Le fichier{' '}
              <span className="font-mono text-zinc-200">{deleteTarget?.filename}</span>{' '}
              sera supprimé définitivement du dossier{' '}
              <span className="font-mono text-zinc-200">models/</span>.
              Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {deleteError && (
            <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded px-3 py-2">
              {deleteError}
            </p>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel className="border-zinc-700 bg-transparent text-white hover:bg-zinc-800">
              Annuler
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700 text-white gap-2"
              onClick={handleDeleteConfirm}
              disabled={deleting}
            >
              {deleting
                ? <Loader2 className="w-4 h-4 animate-spin" />
                : <Trash2 className="w-4 h-4" />}
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

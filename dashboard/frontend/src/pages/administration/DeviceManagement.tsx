import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Cpu, HardDrive, Activity, Video, Server, Zap, RefreshCw, Power,
  AlertTriangle, CheckCircle2, Plus, Pencil, Trash2, Play, Wifi,
  WifiOff, HelpCircle, X, Loader2, ChevronRight,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from '@/components/ui/tooltip';

import { API_URL, getToken } from '@/lib/api';
const authFetch = (url: string, opts: RequestInit = {}) =>
  fetch(url, { ...opts, headers: { ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}), ...opts.headers } });
const API = API_URL;

// ── Types ────────────────────────────────────────────────────────────────────
interface CameraDevice {
  id: number;
  name: string;
  source_type: string;
  url: string;
  resolution: string;
  fps: number;
  is_active: boolean;
  notes: string | null;
  created_at: string | null;
  last_tested_at: string | null;
  last_status: string | null;
  last_latency_ms: number | null;
}
interface SystemStats {
  cpu_pct: number;
  cpu_temp_c: number | null;
  ram_used_gb: number;
  ram_total_gb: number;
  ram_pct: number;
  disk_used_gb: number;
  disk_total_gb: number;
  disk_pct: number;
}
interface ServiceStatus {
  key: string;
  name: string;
  status: string; // running | stopped | warning | error
}
interface CameraForm {
  name: string;
  source_type: string;
  url: string;
  resolution: string;
  fps: number;
  notes: string;
}
const EMPTY_FORM: CameraForm = {
  name: '', source_type: 'webcam', url: '0', resolution: '720p', fps: 30, notes: '',
};

// ── Helpers ──────────────────────────────────────────────────────────────────
function InfoTooltip({ text }: { text: string }) {
  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <HelpCircle className="w-3.5 h-3.5 text-zinc-500 cursor-help flex-shrink-0" />
        </TooltipTrigger>
        <TooltipContent className="max-w-xs text-xs bg-zinc-900 border-zinc-700 text-zinc-200">
          {text}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

function statusColor(s: string | null) {
  if (s === 'online') return 'text-green-500';
  if (s === 'offline') return 'text-red-500';
  return 'text-zinc-500';
}

function serviceColor(s: string) {
  if (s === 'running') return 'text-green-500';
  if (s === 'error' || s === 'stopped') return 'text-red-500';
  return 'text-yellow-500';
}

function progressColor(pct: number) {
  if (pct >= 90) return '[&>div]:bg-red-500';
  if (pct >= 75) return '[&>div]:bg-yellow-500';
  return '';
}

function sourceLabel(t: string) {
  if (t === 'webcam') return 'USB/Webcam';
  if (t === 'rtsp')   return 'RTSP';
  if (t === 'http')   return 'HTTP/MJPEG';
  return t.toUpperCase();
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function DeviceManagement() {
  const [cameras, setCameras]   = useState<CameraDevice[]>([]);
  const [sysStats, setSysStats] = useState<SystemStats | null>(null);
  const [services, setServices] = useState<ServiceStatus[]>([]);
  const [loading, setLoading]   = useState(true);
  const [flash, setFlash]       = useState<{ msg: string; ok: boolean } | null>(null);
  const flashTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Modal state
  const [modalOpen, setModalOpen]   = useState(false);
  const [editId, setEditId]         = useState<number | null>(null);
  const [form, setForm]             = useState<CameraForm>(EMPTY_FORM);
  const [saving, setSaving]         = useState(false);

  // Per-camera busy states
  const [testing, setTesting]     = useState<number | null>(null);
  const [activating, setActivating] = useState<number | null>(null);
  const [deleting, setDeleting]   = useState<number | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<CameraDevice | null>(null);

  const showFlash = useCallback((msg: string, ok: boolean) => {
    if (flashTimer.current) clearTimeout(flashTimer.current);
    setFlash({ msg, ok });
    flashTimer.current = setTimeout(() => setFlash(null), 4000);
  }, []);

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [camRes, sysRes, svcRes] = await Promise.all([
        fetch(`${API}/api/devices/cameras`),
        fetch(`${API}/api/devices/system`),
        fetch(`${API}/api/devices/services`),
      ]);
      if (camRes.ok) setCameras(await camRes.json());
      if (sysRes.ok) setSysStats(await sysRes.json());
      if (svcRes.ok) setServices(await svcRes.json());
    } catch {
      showFlash('Erreur de connexion au backend', false);
    } finally {
      setLoading(false);
    }
  }, [showFlash]);

  useEffect(() => { loadAll(); }, [loadAll]);

  // ── CRUD ──────────────────────────────────────────────────────────────────
  function openAdd() {
    setEditId(null);
    setForm(EMPTY_FORM);
    setModalOpen(true);
  }
  function openEdit(cam: CameraDevice) {
    setEditId(cam.id);
    setForm({
      name: cam.name,
      source_type: cam.source_type,
      url: cam.url,
      resolution: cam.resolution,
      fps: cam.fps,
      notes: cam.notes ?? '',
    });
    setModalOpen(true);
  }

  async function saveCamera() {
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      const body = { ...form, notes: form.notes || null };
      const res = editId
        ? await authFetch(`${API}/api/devices/cameras/${editId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
        : await authFetch(`${API}/api/devices/cameras`,           { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      if (res.ok) {
        showFlash(editId ? 'Caméra mise à jour' : 'Caméra ajoutée', true);
        setModalOpen(false);
        loadAll();
      } else {
        const err = await res.json().catch(() => ({}));
        showFlash(err.detail ?? 'Erreur lors de la sauvegarde', false);
      }
    } catch {
      showFlash('Erreur réseau', false);
    } finally {
      setSaving(false);
    }
  }

  async function testCamera(cam: CameraDevice) {
    setTesting(cam.id);
    try {
      const res = await authFetch(`${API}/api/devices/cameras/${cam.id}/test`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        showFlash(`${cam.name} — connexion OK (${data.latency_ms} ms)`, true);
      } else {
        showFlash(`${cam.name} — ${data.message}`, false);
      }
      loadAll();
    } catch {
      showFlash('Erreur de test', false);
    } finally {
      setTesting(null);
    }
  }

  async function activateCamera(cam: CameraDevice) {
    setActivating(cam.id);
    try {
      const res = await authFetch(`${API}/api/devices/cameras/${cam.id}/activate`, { method: 'POST' });
      if (res.ok) {
        showFlash(`${cam.name} activée — moteur de vision basculé`, true);
        loadAll();
      } else {
        const err = await res.json().catch(() => ({}));
        showFlash(err.detail ?? 'Erreur activation', false);
      }
    } catch {
      showFlash('Erreur réseau', false);
    } finally {
      setActivating(null);
    }
  }

  async function doDelete(cam: CameraDevice) {
    setDeleting(cam.id);
    setConfirmDelete(null);
    try {
      const res = await authFetch(`${API}/api/devices/cameras/${cam.id}`, { method: 'DELETE' });
      if (res.ok) {
        showFlash(`${cam.name} supprimée`, true);
        loadAll();
      } else {
        const err = await res.json().catch(() => ({}));
        showFlash(err.detail ?? 'Erreur suppression', false);
      }
    } catch {
      showFlash('Erreur réseau', false);
    } finally {
      setDeleting(null);
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="p-6 space-y-6 relative">

      {/* Flash banner */}
      {flash && (
        <div className={`fixed top-4 right-4 z-50 flex items-center gap-3 px-4 py-3 rounded-lg border text-sm font-medium shadow-lg transition-all
          ${flash.ok ? 'bg-green-900/90 border-green-700 text-green-200' : 'bg-red-900/90 border-red-700 text-red-200'}`}>
          {flash.ok ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
          {flash.msg}
        </div>
      )}

      {/* Confirm delete dialog */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-6 w-96 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3 text-red-400">
              <Trash2 className="w-5 h-5" />
              <h3 className="font-bold text-sm uppercase tracking-widest">Supprimer la caméra</h3>
            </div>
            <p className="text-sm text-zinc-300">
              Supprimer <span className="font-bold text-white">"{confirmDelete.name}"</span> ? Cette action est irréversible.
            </p>
            <div className="flex gap-3 justify-end">
              <Button variant="ghost" size="sm" onClick={() => setConfirmDelete(null)}>Annuler</Button>
              <Button size="sm" className="bg-red-600 hover:bg-red-700 text-white" onClick={() => doDelete(confirmDelete)}>
                Supprimer
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Camera modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-6 w-[480px] space-y-5 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm uppercase tracking-widest text-white flex items-center gap-2">
                <Video className="w-4 h-4 text-orange-500" />
                {editId ? 'Modifier la caméra' : 'Ajouter une caméra'}
              </h3>
              <button onClick={() => setModalOpen(false)} className="text-zinc-500 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Name */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 flex items-center gap-1">
                  Nom de la caméra
                </label>
                <input
                  className="w-full h-9 px-3 rounded-md bg-zinc-800 border border-zinc-700 text-white text-sm focus:outline-none focus:border-orange-500"
                  placeholder="ex: Caméra Convoyeur A"
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                />
              </div>

              {/* Source type */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 flex items-center gap-1.5">
                  Type de source
                  <InfoTooltip text="webcam = caméra USB locale (indice 0, 1…). rtsp = flux RTSP (IP cam). http = flux MJPEG/HTTP. file = fichier vidéo." />
                </label>
                <select
                  className="w-full h-9 px-3 rounded-md bg-zinc-800 border border-zinc-700 text-white text-sm focus:outline-none focus:border-orange-500"
                  value={form.source_type}
                  onChange={e => setForm(f => ({ ...f, source_type: e.target.value }))}
                >
                  <option value="webcam">USB / Webcam</option>
                  <option value="rtsp">RTSP (caméra IP)</option>
                  <option value="http">HTTP / MJPEG</option>
                  <option value="file">Fichier vidéo</option>
                </select>
              </div>

              {/* URL */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 flex items-center gap-1.5">
                  {form.source_type === 'webcam' ? 'Indice de la caméra' : 'URL / Chemin'}
                  <InfoTooltip text={
                    form.source_type === 'webcam'
                      ? 'Entrez 0 pour la 1ère webcam, 1 pour la 2ème, etc.'
                      : 'Ex: rtsp://admin:pass@192.168.1.10:554/stream1 ou http://192.168.1.10/video'
                  } />
                </label>
                <input
                  className="w-full h-9 px-3 rounded-md bg-zinc-800 border border-zinc-700 text-white text-sm font-mono focus:outline-none focus:border-orange-500"
                  placeholder={form.source_type === 'webcam' ? '0' : 'rtsp://…'}
                  value={form.url}
                  onChange={e => setForm(f => ({ ...f, url: e.target.value }))}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Resolution */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Résolution</label>
                  <select
                    className="w-full h-9 px-3 rounded-md bg-zinc-800 border border-zinc-700 text-white text-sm focus:outline-none focus:border-orange-500"
                    value={form.resolution}
                    onChange={e => setForm(f => ({ ...f, resolution: e.target.value }))}
                  >
                    <option value="1080p">1080p</option>
                    <option value="720p">720p</option>
                    <option value="480p">480p</option>
                    <option value="360p">360p</option>
                  </select>
                </div>

                {/* FPS */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">FPS cible</label>
                  <select
                    className="w-full h-9 px-3 rounded-md bg-zinc-800 border border-zinc-700 text-white text-sm focus:outline-none focus:border-orange-500"
                    value={form.fps}
                    onChange={e => setForm(f => ({ ...f, fps: Number(e.target.value) }))}
                  >
                    {[10, 15, 20, 25, 30, 60].map(v => <option key={v} value={v}>{v} fps</option>)}
                  </select>
                </div>
              </div>

              {/* Notes */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Notes (optionnel)</label>
                <input
                  className="w-full h-9 px-3 rounded-md bg-zinc-800 border border-zinc-700 text-white text-sm focus:outline-none focus:border-orange-500"
                  placeholder="Emplacement, notes d'installation…"
                  value={form.notes}
                  onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                />
              </div>
            </div>

            <div className="flex gap-3 justify-end pt-2">
              <Button variant="ghost" size="sm" onClick={() => setModalOpen(false)}>Annuler</Button>
              <Button size="sm" className="bg-orange-600 hover:bg-orange-700 text-white" onClick={saveCamera} disabled={saving || !form.name.trim()}>
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : (editId ? 'Enregistrer' : 'Ajouter')}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Gestion des Appareils</h1>
          <p className="text-muted-foreground text-sm">Caméras, serveur Edge-IA et services système</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="border-zinc-800 text-white gap-2 text-xs" onClick={loadAll} disabled={loading}>
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            Actualiser
          </Button>
          <Button className="bg-orange-600 hover:bg-orange-700 text-white gap-2 text-xs" onClick={openAdd}>
            <Plus className="w-4 h-4" /> Ajouter une caméra
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column: Server + Cameras */}
        <div className="lg:col-span-2 space-y-6">

          {/* Server card */}
          <Card className="p-6 bg-zinc-900/50 border-zinc-800 space-y-5">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
              <div className="flex items-center gap-2">
                <Server className="w-5 h-5 text-orange-500" />
                <h3 className="text-sm font-bold text-white uppercase tracking-widest">Serveur Edge-IA</h3>
                <InfoTooltip text="Métriques système en temps réel depuis psutil. Actualisation manuelle via le bouton Actualiser." />
              </div>
              {sysStats && (
                <Badge className={`font-bold text-[9px] ${sysStats.cpu_pct > 90 || sysStats.ram_pct > 90 ? 'bg-red-500/10 text-red-500 border-red-500/20' : sysStats.cpu_pct > 70 || sysStats.ram_pct > 75 ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' : 'bg-green-500/10 text-green-500 border-green-500/20'}`}>
                  {sysStats.cpu_pct > 90 || sysStats.ram_pct > 90 ? 'SURCHARGÉ' : sysStats.cpu_pct > 70 || sysStats.ram_pct > 75 ? 'CHARGÉ' : 'STABLE'}
                </Badge>
              )}
            </div>

            {loading && !sysStats ? (
              <div className="grid grid-cols-3 gap-6">
                {[0, 1, 2].map(i => (
                  <div key={i} className="space-y-3">
                    <div className="h-2 bg-zinc-800 rounded animate-pulse w-3/4" />
                    <div className="h-1.5 bg-zinc-800 rounded animate-pulse" />
                    <div className="h-2 bg-zinc-800 rounded animate-pulse w-1/2" />
                  </div>
                ))}
              </div>
            ) : sysStats ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-3">
                  <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                    <span>CPU</span>
                    <span className={sysStats.cpu_pct > 80 ? 'text-red-400' : sysStats.cpu_pct > 60 ? 'text-yellow-400' : 'text-white'}>
                      {sysStats.cpu_pct}%
                    </span>
                  </div>
                  <Progress value={sysStats.cpu_pct} className={`h-1.5 bg-zinc-800 ${progressColor(sysStats.cpu_pct)}`} />
                  <p className="text-[10px] text-zinc-500 italic">
                    {sysStats.cpu_temp_c !== null ? `Temp: ${sysStats.cpu_temp_c}°C` : 'Temp: N/A (Windows)'}
                  </p>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                    <span>RAM</span>
                    <span className={sysStats.ram_pct > 85 ? 'text-red-400' : sysStats.ram_pct > 70 ? 'text-yellow-400' : 'text-white'}>
                      {sysStats.ram_used_gb} GB
                    </span>
                  </div>
                  <Progress value={sysStats.ram_pct} className={`h-1.5 bg-zinc-800 ${progressColor(sysStats.ram_pct)}`} />
                  <p className="text-[10px] text-zinc-500 italic">Total: {sysStats.ram_total_gb} GB</p>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                    <span>Disque</span>
                    <span className={sysStats.disk_pct > 85 ? 'text-red-400' : sysStats.disk_pct > 70 ? 'text-yellow-400' : 'text-white'}>
                      {sysStats.disk_used_gb} GB
                    </span>
                  </div>
                  <Progress value={sysStats.disk_pct} className={`h-1.5 bg-zinc-800 ${progressColor(sysStats.disk_pct)}`} />
                  <p className="text-[10px] text-zinc-500 italic">Total: {sysStats.disk_total_gb} GB</p>
                </div>
              </div>
            ) : null}
          </Card>

          {/* Cameras */}
          <Card className="bg-zinc-900/50 border-zinc-800">
            <div className="flex items-center justify-between p-4 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <Video className="w-4 h-4 text-orange-500" />
                <h3 className="text-sm font-bold text-white uppercase tracking-widest">Caméras configurées</h3>
                <InfoTooltip text="Chaque caméra peut être testée (connexion OpenCV réelle) et activée (bascule le moteur de vision). Une seule caméra peut être active à la fois." />
                <Badge className="bg-zinc-800 text-zinc-300 border-zinc-700 text-[9px] font-mono">
                  {cameras.length}
                </Badge>
              </div>
              <Button variant="ghost" size="icon" className="h-7 w-7 text-zinc-500 hover:text-orange-400" onClick={openAdd}>
                <Plus className="w-3.5 h-3.5" />
              </Button>
            </div>

            {loading && cameras.length === 0 ? (
              <div className="divide-y divide-zinc-800/50">
                {[0, 1].map(i => (
                  <div key={i} className="p-4 flex items-center gap-4">
                    <div className="w-10 h-10 bg-zinc-800 rounded-lg animate-pulse" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3 bg-zinc-800 rounded w-1/3 animate-pulse" />
                      <div className="h-2 bg-zinc-800 rounded w-1/2 animate-pulse" />
                    </div>
                  </div>
                ))}
              </div>
            ) : cameras.length === 0 ? (
              <div className="p-10 text-center text-zinc-500 text-sm">
                <Video className="w-8 h-8 mx-auto mb-3 opacity-30" />
                Aucune caméra configurée.
                <Button variant="link" className="text-orange-400 ml-1 p-0 h-auto text-sm" onClick={openAdd}>Ajouter</Button>
              </div>
            ) : (
              <div className="divide-y divide-zinc-800/50">
                {cameras.map(cam => (
                  <div key={cam.id} className="p-4 hover:bg-zinc-800/20 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex gap-3">
                        <div className={`p-2.5 rounded-lg border flex-shrink-0 ${cam.is_active ? 'bg-orange-500/10 border-orange-500/30 text-orange-500' : 'bg-zinc-950 border-zinc-800 text-zinc-500'}`}>
                          <Video className="w-4 h-4" />
                        </div>
                        <div className="space-y-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-bold text-white truncate">{cam.name}</h4>
                            {cam.is_active && (
                              <Badge className="bg-orange-500/10 text-orange-400 border-orange-500/20 text-[9px] font-bold">ACTIVE</Badge>
                            )}
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <span className="text-[10px] text-zinc-400 font-mono bg-zinc-800 px-1.5 py-0.5 rounded">
                              {sourceLabel(cam.source_type)}
                            </span>
                            <span className="text-[10px] text-zinc-400 font-mono bg-zinc-800 px-1.5 py-0.5 rounded truncate max-w-[180px]">
                              {cam.url}
                            </span>
                            <span className="text-[10px] text-zinc-500">{cam.resolution} · {cam.fps} fps</span>
                          </div>
                          {cam.notes && <p className="text-[10px] text-zinc-500 italic">{cam.notes}</p>}
                        </div>
                      </div>

                      {/* Status dot */}
                      <div className="flex-shrink-0 flex items-center gap-1.5 ml-2">
                        {cam.last_status === 'online' ? (
                          <>
                            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                            <span className="text-[9px] font-bold text-green-500">LIVE</span>
                          </>
                        ) : cam.last_status === 'offline' ? (
                          <>
                            <div className="w-2 h-2 rounded-full bg-red-500" />
                            <span className="text-[9px] font-bold text-red-500">OFFLINE</span>
                          </>
                        ) : (
                          <>
                            <div className="w-2 h-2 rounded-full bg-zinc-600" />
                            <span className="text-[9px] font-bold text-zinc-500">INCONNU</span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Footer: latency + actions */}
                    <div className="flex items-center justify-between mt-4 pt-3 border-t border-zinc-800/50">
                      <div className="text-[10px] text-zinc-500 space-x-3">
                        {cam.last_latency_ms !== null && (
                          <span>Latence: <span className="text-white font-mono">{cam.last_latency_ms} ms</span></span>
                        )}
                        {cam.last_tested_at && (
                          <span>Testé: <span className="text-zinc-400">{new Date(cam.last_tested_at).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</span></span>
                        )}
                      </div>
                      <div className="flex gap-1.5">
                        {/* Test */}
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 text-[10px] border-zinc-700 text-zinc-300 hover:text-white hover:border-blue-500 gap-1"
                          onClick={() => testCamera(cam)}
                          disabled={testing === cam.id}
                        >
                          {testing === cam.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Wifi className="w-3 h-3" />}
                          Tester
                        </Button>

                        {/* Activate */}
                        {!cam.is_active && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 text-[10px] border-zinc-700 text-zinc-300 hover:text-orange-400 hover:border-orange-500 gap-1"
                            onClick={() => activateCamera(cam)}
                            disabled={activating === cam.id}
                          >
                            {activating === cam.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Play className="w-3 h-3" />}
                            Activer
                          </Button>
                        )}

                        {/* Edit */}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-zinc-500 hover:text-white"
                          onClick={() => openEdit(cam)}
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>

                        {/* Delete */}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-zinc-500 hover:text-red-400"
                          onClick={() => setConfirmDelete(cam)}
                          disabled={deleting === cam.id || cam.is_active}
                          title={cam.is_active ? 'Impossible de supprimer la caméra active' : 'Supprimer'}
                        >
                          {deleting === cam.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Right column: Services + Alert */}
        <div className="space-y-6">
          {/* Services IA */}
          <Card className="p-6 bg-zinc-900/50 border-zinc-800 space-y-5">
            <div className="flex items-center gap-2 border-b border-zinc-800 pb-4">
              <Zap className="w-5 h-5 text-orange-500" />
              <h3 className="text-sm font-bold text-white uppercase tracking-widest">Services Système</h3>
              <InfoTooltip text="Statut réel des services : YOLO (thread alive), SQLite (test écriture), FastAPI (toujours actif si vous voyez cette page), WebSocket/MJPEG (moteur running)." />
            </div>

            {loading && services.length === 0 ? (
              <div className="space-y-3">
                {[0, 1, 2, 3].map(i => (
                  <div key={i} className="h-12 bg-zinc-800 rounded-lg animate-pulse" />
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {services.map(svc => (
                  <div key={svc.key} className="flex items-center justify-between p-3 rounded-lg bg-zinc-950 border border-zinc-800">
                    <div className="flex flex-col">
                      <span className="text-xs font-medium text-white">{svc.name}</span>
                      <span className={`text-[9px] font-bold uppercase ${serviceColor(svc.status)}`}>
                        {svc.status === 'running' ? 'EN SERVICE' : svc.status === 'stopped' ? 'ARRÊTÉ' : svc.status === 'error' ? 'ERREUR' : 'AVERTISSEMENT'}
                      </span>
                    </div>
                    <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${svc.status === 'running' ? 'bg-green-500 animate-pulse' : svc.status === 'error' || svc.status === 'stopped' ? 'bg-red-500' : 'bg-yellow-500'}`} />
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Multi-camera info card */}
          <Card className="p-5 bg-zinc-900/50 border-zinc-800 space-y-3">
            <div className="flex items-center gap-2">
              <Video className="w-4 h-4 text-orange-500" />
              <h4 className="text-[10px] font-bold uppercase tracking-widest text-white">Multi-Caméra</h4>
            </div>
            <p className="text-[11px] text-zinc-400 leading-relaxed">
              Configurez plusieurs sources vidéo (RTSP, USB, HTTP/MJPEG). Une seule caméra est active à la fois.
              Utilisez <span className="text-orange-400 font-medium">Activer</span> pour basculer le moteur de vision vers une autre source sans redémarrage.
            </p>
            <div className="space-y-1.5">
              {[
                { icon: Wifi,    label: 'Tester', desc: 'Vérifie la connexion OpenCV réelle' },
                { icon: Play,    label: 'Activer', desc: 'Bascule le moteur vers cette caméra' },
                { icon: Pencil,  label: 'Modifier', desc: 'Modifie URL, résolution, FPS…' },
                { icon: Trash2,  label: 'Supprimer', desc: 'Retire la caméra (sauf active)' },
              ].map(({ icon: Icon, label, desc }) => (
                <div key={label} className="flex items-center gap-2 text-[10px]">
                  <Icon className="w-3 h-3 text-zinc-500 flex-shrink-0" />
                  <span className="text-zinc-300 font-medium w-16">{label}</span>
                  <span className="text-zinc-500">{desc}</span>
                </div>
              ))}
            </div>
          </Card>

          {/* Disk alert */}
          {sysStats && sysStats.disk_pct >= 80 && (
            <Card className="p-5 bg-red-950/10 border border-red-900/30 space-y-3">
              <div className="flex items-center gap-2 text-red-500">
                <AlertTriangle className="w-4 h-4" />
                <h4 className="text-[10px] font-bold uppercase tracking-widest">Alerte Disque</h4>
              </div>
              <p className="text-[11px] text-zinc-400 leading-relaxed">
                Utilisation du disque à <span className="text-red-400 font-bold">{sysStats.disk_pct}%</span> ({sysStats.disk_used_gb} GB / {sysStats.disk_total_gb} GB).
                Pensez à archiver ou purger les anciennes données.
              </p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

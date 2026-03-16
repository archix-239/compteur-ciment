import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Image as ImageIcon, Plus, Trash2, Save, Upload, Palette,
  CheckCircle2, AlertTriangle, Loader2, RefreshCw, HelpCircle,
  X, Play, Info,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from '@/components/ui/tooltip';

const API = 'http://localhost:8000';

// ── Types ─────────────────────────────────────────────────────────────────────
interface ColorRef {
  name: string;
  hex: string;
  tolerance: number;
  h_min: number; h_max: number;
  s_min: number; s_max: number;
  v_min: number; v_max: number;
}
interface TemplateHistoryItem {
  filename: string;
  url: string;
  size_kb: number;
  width: number;
  height: number;
  is_active: boolean;
}
interface TemplateConfig {
  active_file: string | null;
  active_url: string | null;
  active_width: number;
  active_height: number;
  threshold: number;
  color_threshold: number;
  color_refs: ColorRef[];
  history: TemplateHistoryItem[];
}

// ── Helpers ───────────────────────────────────────────────────────────────────
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

function scoreLabel(pct: number) {
  if (pct >= 70) return { label: 'Précis', color: 'text-green-400' };
  if (pct >= 45) return { label: 'Modéré', color: 'text-yellow-400' };
  return { label: 'Permissif', color: 'text-orange-400' };
}

// ── Component ──────────────────────────────────────────────────────────────────
export default function Templates() {
  const [config, setConfig]   = useState<TemplateConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [flash, setFlash]     = useState<{ msg: string; ok: boolean } | null>(null);
  const flashTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Template tab
  const [threshold, setThreshold]       = useState(65);   // as integer 0-100
  const [uploading, setUploading]       = useState(false);
  const [activating, setActivating]     = useState<string | null>(null);
  const [deletingTpl, setDeletingTpl]   = useState<string | null>(null);
  const [savingSettings, setSavingSettings] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Color tab
  const [colorThreshold, setColorThreshold] = useState(25); // as integer 0-100
  const [newColorHex, setNewColorHex]       = useState('#8E8E8E');
  const [newColorName, setNewColorName]     = useState('');
  const [newColorTol, setNewColorTol]       = useState(25);
  const [addingColor, setAddingColor]       = useState(false);
  const [deletingColor, setDeletingColor]   = useState<number | null>(null);

  const showFlash = useCallback((msg: string, ok: boolean) => {
    if (flashTimer.current) clearTimeout(flashTimer.current);
    setFlash({ msg, ok });
    flashTimer.current = setTimeout(() => setFlash(null), 4000);
  }, []);

  const loadConfig = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/config/template`);
      if (res.ok) {
        const data: TemplateConfig = await res.json();
        setConfig(data);
        setThreshold(Math.round(data.threshold * 100));
        setColorThreshold(Math.round(data.color_threshold * 100));
      }
    } catch {
      showFlash('Erreur de connexion au backend', false);
    } finally {
      setLoading(false);
    }
  }, [showFlash]);

  useEffect(() => { loadConfig(); }, [loadConfig]);

  // ── Template upload ────────────────────────────────────────────────────────
  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch(`${API}/api/config/template/upload`, { method: 'POST', body: fd });
      if (res.ok) {
        showFlash('Template uploadé et activé avec succès', true);
        loadConfig();
      } else {
        const err = await res.json().catch(() => ({}));
        showFlash((err as { detail?: string }).detail ?? 'Erreur upload', false);
      }
    } catch {
      showFlash('Erreur réseau', false);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  async function activateTemplate(filename: string) {
    setActivating(filename);
    try {
      const res = await fetch(`${API}/api/config/template/activate/${encodeURIComponent(filename)}`, { method: 'POST' });
      if (res.ok) {
        showFlash(`Template "${filename}" activé`, true);
        loadConfig();
      } else {
        const err = await res.json().catch(() => ({}));
        showFlash((err as { detail?: string }).detail ?? 'Erreur activation', false);
      }
    } catch {
      showFlash('Erreur réseau', false);
    } finally {
      setActivating(null);
    }
  }

  async function deleteTemplate(filename: string) {
    setDeletingTpl(filename);
    try {
      const res = await fetch(`${API}/api/config/template/history/${encodeURIComponent(filename)}`, { method: 'DELETE' });
      if (res.ok) {
        showFlash(`Template "${filename}" supprimé`, true);
        loadConfig();
      } else {
        const err = await res.json().catch(() => ({}));
        showFlash((err as { detail?: string }).detail ?? 'Erreur suppression', false);
      }
    } catch {
      showFlash('Erreur réseau', false);
    } finally {
      setDeletingTpl(null);
    }
  }

  async function saveSettings() {
    setSavingSettings(true);
    try {
      const res = await fetch(`${API}/api/config/template/settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          threshold: threshold / 100,
          color_threshold: colorThreshold / 100,
        }),
      });
      if (res.ok) {
        showFlash('Paramètres enregistrés et appliqués au moteur de vision', true);
        loadConfig();
      } else {
        const err = await res.json().catch(() => ({}));
        showFlash((err as { detail?: string }).detail ?? 'Erreur sauvegarde', false);
      }
    } catch {
      showFlash('Erreur réseau', false);
    } finally {
      setSavingSettings(false);
    }
  }

  // ── Color CRUD ────────────────────────────────────────────────────────────
  async function addColor() {
    if (!newColorName.trim()) { showFlash('Entrez un nom pour la couleur', false); return; }
    setAddingColor(true);
    try {
      const res = await fetch(`${API}/api/config/colors`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newColorName.trim(), hex: newColorHex, tolerance: newColorTol }),
      });
      if (res.ok) {
        showFlash('Couleur ajoutée', true);
        setNewColorName('');
        setNewColorHex('#8E8E8E');
        setNewColorTol(25);
        loadConfig();
      } else {
        const err = await res.json().catch(() => ({}));
        showFlash((err as { detail?: string }).detail ?? 'Erreur ajout', false);
      }
    } catch {
      showFlash('Erreur réseau', false);
    } finally {
      setAddingColor(false);
    }
  }

  async function deleteColor(idx: number) {
    setDeletingColor(idx);
    try {
      const res = await fetch(`${API}/api/config/colors/${idx}`, { method: 'DELETE' });
      if (res.ok) {
        showFlash('Couleur supprimée', true);
        loadConfig();
      }
    } catch {
      showFlash('Erreur réseau', false);
    } finally {
      setDeletingColor(null);
    }
  }

  const colors = config?.color_refs ?? [];
  const history = config?.history ?? [];
  const tplScore  = scoreLabel(threshold);
  const colorScore = scoreLabel(colorThreshold);

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="p-6 space-y-6 relative">

      {/* Flash */}
      {flash && (
        <div className={`fixed top-4 right-4 z-50 flex items-center gap-3 px-4 py-3 rounded-lg border text-sm font-medium shadow-lg
          ${flash.ok ? 'bg-green-900/90 border-green-700 text-green-200' : 'bg-red-900/90 border-red-700 text-red-200'}`}>
          {flash.ok ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
          {flash.msg}
        </div>
      )}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={handleFileUpload}
      />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Templates & Couleurs de Référence</h1>
          <p className="text-muted-foreground text-sm">
            Définissez le sac parfait — le moteur de vision calcule logo_score et color_score en temps réel
          </p>
        </div>
        <Button variant="outline" className="border-zinc-800 text-white gap-2 text-xs" onClick={loadConfig} disabled={loading}>
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          Actualiser
        </Button>
      </div>

      {/* Info banner */}
      <div className="flex items-start gap-3 p-3 rounded-lg bg-blue-950/20 border border-blue-900/30">
        <Info className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
        <p className="text-xs text-zinc-400 leading-relaxed">
          <span className="text-blue-300 font-medium">Scoring en temps réel.</span>{' '}
          Dès qu'un template ou une couleur est configuré, le moteur de vision utilise{' '}
          <span className="font-mono text-zinc-300">ORB matching</span> pour le{' '}
          <span className="font-mono text-zinc-300">logo_score</span> et une{' '}
          <span className="font-mono text-zinc-300">analyse HSV par masque</span> pour le{' '}
          <span className="font-mono text-zinc-300">color_score</span> — sans redémarrage.
        </p>
      </div>

      <Tabs defaultValue="logo" className="space-y-6">
        <TabsList className="bg-zinc-900 border border-zinc-800 p-1">
          <TabsTrigger value="logo" className="gap-2 text-white data-[state=active]:bg-zinc-800">
            <ImageIcon className="w-4 h-4" /> Templates Logo
          </TabsTrigger>
          <TabsTrigger value="color" className="gap-2 text-white data-[state=active]:bg-zinc-800">
            <Palette className="w-4 h-4" /> Bibliothèque Couleurs
          </TabsTrigger>
        </TabsList>

        {/* ── Logo Templates ──────────────────────────────────────────────── */}
        <TabsContent value="logo" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

            {/* Active template card */}
            <Card className="p-6 space-y-5 bg-zinc-900/50 border-zinc-800">
              <div className="flex items-center gap-2 border-b border-zinc-800 pb-3">
                <ImageIcon className="w-4 h-4 text-orange-500" />
                <span className="font-semibold text-white text-sm">Template Actif</span>
                <InfoTooltip text="Image de référence du sac parfait. Le moteur compare chaque sac détecté via ORB feature matching pour calculer le logo_score." />
              </div>

              {/* Image preview */}
              <div
                className="aspect-square bg-zinc-950 rounded-lg flex items-center justify-center border-2 border-dashed border-orange-500/30 overflow-hidden group relative cursor-pointer hover:border-orange-500/60 transition-colors"
                onClick={() => !uploading && fileInputRef.current?.click()}
              >
                {loading ? (
                  <Loader2 className="w-8 h-8 text-zinc-700 animate-spin" />
                ) : config?.active_url ? (
                  <>
                    <img
                      src={`${API}${config.active_url}`}
                      alt="Template actif"
                      className="w-full h-full object-contain"
                    />
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="flex flex-col items-center gap-2 text-white">
                        <Upload className="w-6 h-6" />
                        <span className="text-xs font-medium">Remplacer</span>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center gap-3 text-zinc-600">
                    <ImageIcon className="w-12 h-12 opacity-30" />
                    <span className="text-xs text-center">Aucun template<br />Cliquez pour uploader</span>
                  </div>
                )}
                {uploading && (
                  <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
                    <Loader2 className="w-8 h-8 text-orange-400 animate-spin" />
                  </div>
                )}
              </div>

              {/* Upload button */}
              <Button
                className="w-full bg-zinc-800 hover:bg-zinc-700 text-white gap-2 text-xs"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
              >
                {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                {config?.active_url ? 'Remplacer le template' : 'Uploader un template'}
              </Button>

              {/* Dimensions */}
              {config?.active_file && (
                <div className="grid grid-cols-2 gap-2 text-[10px]">
                  <div className="bg-zinc-800/50 rounded p-2 text-center">
                    <p className="text-zinc-500 uppercase font-bold tracking-widest">Fichier</p>
                    <p className="text-zinc-300 font-mono truncate" title={config.active_file}>
                      {config.active_file.length > 18
                        ? config.active_file.slice(-18)
                        : config.active_file}
                    </p>
                  </div>
                  <div className="bg-zinc-800/50 rounded p-2 text-center">
                    <p className="text-zinc-500 uppercase font-bold tracking-widest">Dimensions</p>
                    <p className="text-zinc-300 font-mono">
                      {config.active_width > 0 ? `${config.active_width}×${config.active_height}` : '—'}
                    </p>
                  </div>
                </div>
              )}

              {/* Logo threshold */}
              <div className="space-y-2 pt-2 border-t border-zinc-800">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">
                      Seuil logo_score
                    </span>
                    <InfoTooltip text="Score ORB minimum pour qu'un sac soit considéré conforme côté logo. En dessous de ce seuil → logo_score faible → potentiellement rejeté." />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-bold ${tplScore.color}`}>{tplScore.label}</span>
                    <span className="text-xs font-mono text-orange-400">
                      {(threshold / 100).toFixed(2)}
                    </span>
                  </div>
                </div>
                <Slider
                  value={[threshold]}
                  min={10} max={95} step={1}
                  onValueChange={([v]) => setThreshold(v)}
                  className="[&_[role=slider]]:bg-orange-500"
                />
                <div className="flex justify-between text-[9px] text-zinc-600 font-mono">
                  <span>0.10 (permissif)</span>
                  <span>0.95 (strict)</span>
                </div>
              </div>
            </Card>

            {/* History grid */}
            <Card className="md:col-span-2 p-6 space-y-4 bg-zinc-900/50 border-zinc-800">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-white text-sm">Historique des Templates</span>
                  <Badge className="bg-zinc-800 text-zinc-400 border-zinc-700 text-[9px] font-mono">
                    {history.length}
                  </Badge>
                </div>
                <Button
                  size="sm"
                  className="gap-2 bg-zinc-800 hover:bg-zinc-700 text-white h-8 text-xs"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                >
                  {uploading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />}
                  Nouveau Template
                </Button>
              </div>

              {loading ? (
                <div className="grid grid-cols-3 lg:grid-cols-4 gap-4">
                  {[0, 1, 2].map(i => (
                    <div key={i} className="aspect-square bg-zinc-800 rounded-md animate-pulse" />
                  ))}
                </div>
              ) : history.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-36 text-zinc-600 gap-2">
                  <ImageIcon className="w-10 h-10 opacity-20" />
                  <p className="text-xs text-center">Aucun template enregistré.<br />Uploadez une image du sac de référence.</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                  {history.map(t => (
                    <div key={t.filename} className={`group relative aspect-square rounded-md border overflow-hidden
                      ${t.is_active ? 'border-orange-500/50 ring-1 ring-orange-500/30' : 'border-zinc-800 hover:border-zinc-700'}`}>
                      <img
                        src={`${API}${t.url}`}
                        alt={t.filename}
                        className="w-full h-full object-contain bg-zinc-950"
                      />
                      {/* Active badge */}
                      {t.is_active && (
                        <div className="absolute top-1 left-1">
                          <Badge className="bg-orange-500/90 text-white border-0 text-[8px] font-bold px-1.5">ACTIF</Badge>
                        </div>
                      )}
                      {/* Meta */}
                      <div className="absolute bottom-0 left-0 right-0 bg-black/80 px-2 py-1">
                        <p className="text-[9px] text-zinc-400 font-mono truncate">{t.width}×{t.height} · {t.size_kb}KB</p>
                      </div>
                      {/* Hover actions */}
                      <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        {!t.is_active && (
                          <Button
                            variant="ghost" size="icon"
                            className="h-8 w-8 text-orange-400 hover:text-orange-300 hover:bg-orange-500/20"
                            onClick={() => activateTemplate(t.filename)}
                            disabled={activating === t.filename}
                            title="Activer"
                          >
                            {activating === t.filename
                              ? <Loader2 className="w-4 h-4 animate-spin" />
                              : <Play className="w-4 h-4" />
                            }
                          </Button>
                        )}
                        {!t.is_active && (
                          <Button
                            variant="ghost" size="icon"
                            className="h-8 w-8 text-red-400 hover:text-red-300 hover:bg-red-500/20"
                            onClick={() => deleteTemplate(t.filename)}
                            disabled={deletingTpl === t.filename}
                            title="Supprimer"
                          >
                            {deletingTpl === t.filename
                              ? <Loader2 className="w-4 h-4 animate-spin" />
                              : <Trash2 className="w-4 h-4" />
                            }
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        </TabsContent>

        {/* ── Colour Library ──────────────────────────────────────────────── */}
        <TabsContent value="color" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* Left: colour list */}
            <div className="lg:col-span-2 space-y-4">
              <Card className="p-6 bg-zinc-900/50 border-zinc-800 space-y-5">
                <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                  <div className="flex items-center gap-2">
                    <Palette className="w-4 h-4 text-orange-500" />
                    <h3 className="font-semibold text-white text-sm">Références Couleurs</h3>
                    <InfoTooltip text="Pour chaque sac détecté, le moteur calcule la fraction de pixels dans la plage HSV de chaque référence. Le meilleur match devient le color_score." />
                    <Badge className="bg-zinc-800 text-zinc-400 border-zinc-700 text-[9px] font-mono">
                      {colors.length}
                    </Badge>
                  </div>
                </div>

                {loading ? (
                  <div className="space-y-3">
                    {[0, 1, 2].map(i => (
                      <div key={i} className="h-14 bg-zinc-800 rounded-lg animate-pulse" />
                    ))}
                  </div>
                ) : colors.length === 0 ? (
                  <div className="flex flex-col items-center py-10 text-zinc-600 gap-2">
                    <Palette className="w-10 h-10 opacity-20" />
                    <p className="text-xs text-center">Aucune référence couleur.<br />Ajoutez les couleurs attendues du sac.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {colors.map((c, i) => (
                      <div key={i} className="flex items-center justify-between p-3.5 rounded-xl border border-zinc-800 bg-zinc-900/60 group hover:border-zinc-700 transition-colors">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-10 h-10 rounded-lg shadow-inner ring-1 ring-white/10 flex-shrink-0"
                            style={{ backgroundColor: c.hex }}
                          />
                          <div className="space-y-0.5">
                            <p className="text-sm font-medium text-white">{c.name}</p>
                            <div className="flex gap-2 text-[10px] text-zinc-500 font-mono">
                              <span>{c.hex.toUpperCase()}</span>
                              <span>·</span>
                              <span>H [{c.h_min}–{c.h_max}]</span>
                              <span>S [{c.s_min}–{c.s_max}]</span>
                              <span>V [{c.v_min}–{c.v_max}]</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-[9px] border-zinc-700 text-zinc-400 font-mono">
                            ±{c.tolerance}
                          </Badge>
                          <Button
                            variant="ghost" size="icon"
                            className="h-7 w-7 opacity-0 group-hover:opacity-100 text-zinc-500 hover:text-red-400 transition-opacity"
                            onClick={() => deleteColor(i)}
                            disabled={deletingColor === i}
                          >
                            {deletingColor === i ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </div>

            {/* Right: add colour form + colour threshold */}
            <div className="space-y-4">
              {/* Add form */}
              <Card className="p-5 bg-zinc-900/50 border-zinc-800 space-y-4">
                <div className="flex items-center gap-2 border-b border-zinc-800 pb-3">
                  <Plus className="w-4 h-4 text-orange-500" />
                  <h3 className="font-semibold text-white text-sm">Ajouter une Couleur</h3>
                </div>

                <div className="space-y-3">
                  {/* Colour picker */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 flex items-center gap-1.5">
                      Couleur de référence
                      <InfoTooltip text="Choisissez la couleur dominante du sac. La tolérance détermine l'amplitude de la plage HSV acceptée." />
                    </label>
                    <div className="flex items-center gap-3">
                      <div className="relative w-10 h-10 rounded-lg overflow-hidden border border-zinc-700 flex-shrink-0">
                        <div className="w-full h-full" style={{ backgroundColor: newColorHex }} />
                        <input
                          type="color"
                          value={newColorHex}
                          onChange={e => setNewColorHex(e.target.value)}
                          className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                        />
                      </div>
                      <input
                        className="flex-1 h-9 px-3 rounded-md bg-zinc-800 border border-zinc-700 text-white text-sm font-mono focus:outline-none focus:border-orange-500 uppercase"
                        value={newColorHex}
                        onChange={e => setNewColorHex(e.target.value)}
                        placeholder="#808080"
                        maxLength={7}
                      />
                    </div>
                  </div>

                  {/* Name */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Nom</label>
                    <input
                      className="w-full h-9 px-3 rounded-md bg-zinc-800 border border-zinc-700 text-white text-sm focus:outline-none focus:border-orange-500"
                      placeholder="ex: Gris Ciment Standard"
                      value={newColorName}
                      onChange={e => setNewColorName(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') addColor(); }}
                    />
                  </div>

                  {/* Tolerance */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 flex items-center gap-1.5">
                        Tolérance HSV
                        <InfoTooltip text="Amplitude de la plage HSV autour de la couleur choisie. Plus élevé = accepte des nuances plus éloignées." />
                      </label>
                      <span className="text-xs font-mono text-orange-400">±{newColorTol}</span>
                    </div>
                    <Slider
                      value={[newColorTol]}
                      min={5} max={60} step={1}
                      onValueChange={([v]) => setNewColorTol(v)}
                      className="[&_[role=slider]]:bg-orange-500"
                    />
                  </div>

                  <Button
                    className="w-full bg-orange-600 hover:bg-orange-700 text-white gap-2 text-xs h-9"
                    onClick={addColor}
                    disabled={addingColor || !newColorName.trim()}
                  >
                    {addingColor ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                    Ajouter
                  </Button>
                </div>
              </Card>

              {/* Color score threshold */}
              <Card className="p-5 bg-zinc-900/50 border-zinc-800 space-y-3">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-white text-xs uppercase tracking-widest">Seuil color_score</h3>
                  <InfoTooltip text="Fraction minimale de pixels dans la plage HSV pour valider la couleur du sac. En dessous → color_score faible." />
                </div>
                <div className="flex items-center justify-between text-[10px]">
                  <span className={`font-bold ${colorScore.color}`}>{colorScore.label}</span>
                  <span className="font-mono text-orange-400">{(colorThreshold / 100).toFixed(2)}</span>
                </div>
                <Slider
                  value={[colorThreshold]}
                  min={5} max={80} step={1}
                  onValueChange={([v]) => setColorThreshold(v)}
                  className="[&_[role=slider]]:bg-orange-500"
                />
                <div className="flex justify-between text-[9px] text-zinc-600 font-mono">
                  <span>0.05 (permissif)</span>
                  <span>0.80 (strict)</span>
                </div>
              </Card>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Save bar */}
      <div className="flex items-center justify-between pt-6 border-t border-zinc-800">
        <p className="text-xs text-zinc-500 flex items-center gap-1.5">
          <Info className="w-3.5 h-3.5" />
          Les seuils sont appliqués immédiatement au moteur de vision lors de la sauvegarde.
        </p>
        <div className="flex gap-3">
          <Button variant="outline" className="border-zinc-800 text-white text-xs" onClick={loadConfig} disabled={loading}>
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <X className="w-3.5 h-3.5" />}
            Annuler
          </Button>
          <Button className="gap-2 bg-orange-600 hover:bg-orange-700 text-white text-xs" onClick={saveSettings} disabled={savingSettings}>
            {savingSettings ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            Enregistrer les Seuils
          </Button>
        </div>
      </div>
    </div>
  );
}

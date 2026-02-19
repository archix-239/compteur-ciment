import { Settings2, Save, RefreshCw, ArrowRightLeft, ArrowUpDown, Square, Loader2 } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { fetchApi } from '@/lib/api';
import { useVideoStream } from '@/hooks/useVideoStream';

interface LineConfig {
  type: 'horizontal' | 'vertical';
  direction: 'top-down' | 'bottom-up' | 'left-right' | 'right-left';
  position_percent: number;
  line_span_percent: number;
}

export default function VirtualLine() {
  const [line, setLine] = useState<LineConfig>({
    type: 'vertical',
    direction: 'left-right',
    position_percent: 60,
    line_span_percent: 80,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveState, setSaveState] = useState<'idle' | 'ok' | 'error'>('idle');

  const imgRef = useRef<HTMLImageElement>(null);
  const { status: streamStatus, fps: streamFps } = useVideoStream(imgRef, true);

  const loadConfig = useCallback(async () => {
    try {
      setLoading(true);
      const cfg = await fetchApi('/api/config/line') as LineConfig;
      setLine(cfg);
      setSaveState('idle');
    } catch (error) {
      console.error('Erreur chargement ligne virtuelle:', error);
      setSaveState('error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadConfig(); }, [loadConfig]);

  const handleDirectionChange = (direction: LineConfig['direction']) => {
    setLine((prev) => ({
      ...prev,
      direction,
      type: direction === 'top-down' || direction === 'bottom-up' ? 'horizontal' : 'vertical',
    }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setSaveState('idle');
      const payload = {
        ...line,
        type: line.direction === 'top-down' || line.direction === 'bottom-up' ? 'horizontal' : 'vertical',
      };
      const saved = await fetchApi('/api/config/line', {
        method: 'PUT',
        body: JSON.stringify(payload),
      }) as LineConfig;
      setLine(saved);
      setSaveState('ok');
      setTimeout(() => setSaveState('idle'), 3000);
    } catch (error) {
      console.error('Erreur sauvegarde ligne virtuelle:', error);
      setSaveState('error');
      setTimeout(() => setSaveState('idle'), 3000);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-6 flex items-center justify-center min-h-[320px]"><Loader2 className="w-8 h-8 animate-spin text-orange-500" /></div>;
  }

  const isVertical = line.direction === 'left-right' || line.direction === 'right-left';

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Ligne Virtuelle de Comptage</h1>
          <p className="text-muted-foreground">Visualisation en direct : la ligne suit vos réglages en temps réel.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="border-zinc-800 text-white gap-2" onClick={loadConfig}><RefreshCw className="w-4 h-4" /> Réinitialiser</Button>
          <Button onClick={handleSave} disabled={saving} className="bg-orange-600 hover:bg-orange-700 text-white gap-2">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Enregistrer
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <Card className="xl:col-span-2 p-2 bg-zinc-950 border-zinc-800 overflow-hidden relative">
          <div className="aspect-video bg-black rounded-sm relative overflow-hidden">
            <img ref={imgRef} alt="Flux réel" className="absolute inset-0 w-full h-full object-contain" style={{ display: streamStatus === 'online' ? 'block' : 'none' }} />

            {streamStatus !== 'online' && (
              <div className="absolute inset-0 flex items-center justify-center text-zinc-500 text-sm">Connexion au flux vidéo...</div>
            )}

            {/* Overlay React = source de vérité unique */}
            {isVertical ? (
              <div className="absolute top-0 bottom-0 w-0.5 bg-yellow-400 shadow-[0_0_12px_rgba(250,204,21,0.6)]" style={{ left: `${line.position_percent}%` }} />
            ) : (
              <div className="absolute left-0 right-0 h-0.5 bg-yellow-400 shadow-[0_0_12px_rgba(250,204,21,0.6)]" style={{ top: `${line.position_percent}%` }} />
            )}

            <div className="absolute top-3 left-3 text-[10px] bg-black/60 px-2 py-1 rounded border border-zinc-700 text-zinc-200 font-mono">
              {line.type.toUpperCase()} · {line.direction} · {streamFps} FPS
            </div>
          </div>
        </Card>

        <div className="space-y-6">
          <Card className="p-6 bg-zinc-900/50 border-zinc-800 space-y-6">
            <div className="flex items-center gap-2 font-bold text-white border-b border-zinc-800 pb-4"><Settings2 className="w-5 h-5 text-orange-500" /><span className="uppercase tracking-widest text-xs">Paramètres Ligne</span></div>

            <div className="space-y-6">
              <div className="space-y-4">
                <div className="flex justify-between">
                  <Label className="text-zinc-500 text-[10px] uppercase font-bold tracking-widest">Position ({isVertical ? 'X' : 'Y'})</Label>
                  <span className="text-orange-400 font-mono text-xs">{line.position_percent}%</span>
                </div>
                <Slider value={[line.position_percent]} onValueChange={(v) => setLine((p) => ({ ...p, position_percent: v[0] }))} max={100} step={1} className="[&_[role=slider]]:bg-orange-500" />
              </div>

              <div className="space-y-4">
                <div className="flex justify-between">
                  <Label className="text-zinc-500 text-[10px] uppercase font-bold tracking-widest">Longueur active</Label>
                  <span className="text-orange-400 font-mono text-xs">{line.line_span_percent}%</span>
                </div>
                <Slider value={[line.line_span_percent]} onValueChange={(v) => setLine((p) => ({ ...p, line_span_percent: v[0] }))} max={100} step={1} className="[&_[role=slider]]:bg-orange-500" />
              </div>

              <div className="space-y-3">
                <Label className="text-zinc-500 text-[10px] uppercase font-bold tracking-widest">Direction</Label>
                <Select value={line.direction} onValueChange={(v) => handleDirectionChange(v as LineConfig['direction'])}>
                  <SelectTrigger className="bg-zinc-950 border-zinc-800 text-white h-11"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-zinc-950 border-zinc-800 text-white">
                    <SelectItem value="top-down"><div className="flex items-center gap-2"><ArrowUpDown className="w-4 h-4 text-orange-500" /><span>Haut → Bas</span></div></SelectItem>
                    <SelectItem value="bottom-up"><div className="flex items-center gap-2"><ArrowUpDown className="w-4 h-4 text-orange-500 rotate-180" /><span>Bas → Haut</span></div></SelectItem>
                    <SelectItem value="left-right"><div className="flex items-center gap-2"><ArrowRightLeft className="w-4 h-4 text-orange-500" /><span>Gauche → Droite</span></div></SelectItem>
                    <SelectItem value="right-left"><div className="flex items-center gap-2"><ArrowRightLeft className="w-4 h-4 text-orange-500 rotate-180" /><span>Droite → Gauche</span></div></SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {saveState === 'ok' && <p className="text-xs text-green-400">Configuration sauvegardée.</p>}
              {saveState === 'error' && <p className="text-xs text-red-400">Échec de sauvegarde.</p>}
            </div>
          </Card>

          <Card className="p-5 bg-orange-600/5 border border-orange-500/20 space-y-3">
            <div className="flex items-center gap-2 text-orange-500"><Square className="w-4 h-4" /><h4 className="text-[10px] font-bold uppercase tracking-widest">Conseil</h4></div>
            <p className="text-[11px] text-zinc-400 leading-relaxed italic">L’overlay affiché ici est la source de vérité (frontend), l’image backend est envoyée sans ligne incrustée pour éviter les doublons visuels.</p>
          </Card>
        </div>
      </div>
    </div>
  );
}

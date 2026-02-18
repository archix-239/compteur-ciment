import {
  Maximize2,
  Move,
  Settings2,
  Save,
  RefreshCw,
  ArrowRightLeft,
  ArrowUpDown,
  Square,
  Loader2,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { fetchApi } from '@/lib/api';

interface VirtualLineConfig {
  position_percent: number;
  line_span_percent: number;
  direction: string;
}

export default function VirtualLine() {
  const [lineY, setLineY] = useState(60);
  const [lineWidth, setLineWidth] = useState(80);
  const [direction, setDirection] = useState('left-right');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveState, setSaveState] = useState<'idle' | 'ok' | 'error'>('idle');

  const loadConfig = useCallback(async () => {
    try {
      setLoading(true);
      const cfg: VirtualLineConfig = await fetchApi('/api/config/virtual-line');
      setLineY(cfg.position_percent);
      setLineWidth(cfg.line_span_percent);
      setDirection(cfg.direction);
      setSaveState('idle');
    } catch (error) {
      console.error('Erreur chargement ligne virtuelle:', error);
      setSaveState('error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadConfig();
  }, [loadConfig]);

  const handleSave = async () => {
    try {
      setSaving(true);
      setSaveState('idle');
      await fetchApi('/api/config/virtual-line', {
        method: 'PUT',
        body: JSON.stringify({
          position_percent: lineY,
          line_span_percent: lineWidth,
          direction,
        }),
      });
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

  const handleReset = () => {
    loadConfig();
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[320px]">
        <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Ligne Virtuelle de Comptage</h1>
          <p className="text-muted-foreground">Définissez la position exacte et les paramètres de déclenchement du comptage</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="border-zinc-800 text-white gap-2" onClick={handleReset}>
            <RefreshCw className="w-4 h-4" /> Réinitialiser
          </Button>
          <Button onClick={handleSave} disabled={saving} className="bg-orange-600 hover:bg-orange-700 text-white gap-2 shadow-lg shadow-orange-900/20">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Enregistrer la Configuration
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <Card className="xl:col-span-2 p-1 bg-zinc-950 border-zinc-800 overflow-hidden relative group">
          <div className="aspect-video bg-zinc-900 rounded-sm relative flex items-center justify-center overflow-hidden">
            <div className="absolute inset-0 opacity-40 bg-[url('https://images.unsplash.com/photo-1565793298595-6a879b1d9492?q=80&w=2071&auto=format&fit=crop')] bg-cover bg-center" />
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px]" />

            <div
              className="absolute left-1/2 -translate-x-1/2 border-t-2 border-orange-500 shadow-[0_0_15px_rgba(249,115,22,0.5)] transition-all duration-300"
              style={{
                top: `${lineY}%`,
                width: `${lineWidth}%`,
                borderStyle: 'dashed',
              }}
            >
              <div className="absolute -top-3 -left-3 w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center cursor-move shadow-lg">
                <Move className="w-3 h-3 text-white" />
              </div>
              <div className="absolute -top-3 -right-3 w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center cursor-move shadow-lg">
                <Move className="w-3 h-3 text-white" />
              </div>
            </div>

            <div className="absolute top-4 left-4 flex gap-2">
              <Badge className="bg-red-500/20 text-red-500 border-red-500/30 gap-1.5 px-2 py-1">
                <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" /> LIVE
              </Badge>
              <Badge className="bg-zinc-900/80 text-zinc-300 border-zinc-700 font-mono">{direction}</Badge>
            </div>

            <div className="absolute bottom-4 right-4 text-zinc-500 font-mono text-[10px]">
              COORD: Y={lineY}% | W={lineWidth}%
            </div>

            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
              <div className="bg-black/60 backdrop-blur-sm p-4 rounded-xl border border-white/10 flex flex-col items-center gap-2">
                <Maximize2 className="w-8 h-8 text-white/50" />
                <span className="text-xs text-white font-medium">Prévisualisation de la zone de comptage</span>
              </div>
            </div>
          </div>
        </Card>

        <div className="space-y-6">
          <Card className="p-6 bg-zinc-900/50 border-zinc-800 space-y-6">
            <div className="flex items-center gap-2 font-bold text-white border-b border-zinc-800 pb-4">
              <Settings2 className="w-5 h-5 text-orange-500" />
              <span className="uppercase tracking-widest text-xs">Paramètres de Ligne</span>
            </div>

            <div className="space-y-6">
              <div className="space-y-4">
                <div className="flex justify-between">
                  <Label className="text-zinc-500 text-[10px] uppercase font-bold tracking-widest">Position Verticale (Y)</Label>
                  <span className="text-orange-400 font-mono text-xs">{lineY}%</span>
                </div>
                <Slider value={[lineY]} onValueChange={(v) => setLineY(v[0])} max={100} step={1} className="[&_[role=slider]]:bg-orange-500" />
              </div>

              <div className="space-y-4">
                <div className="flex justify-between">
                  <Label className="text-zinc-500 text-[10px] uppercase font-bold tracking-widest">Largeur de Détection</Label>
                  <span className="text-orange-400 font-mono text-xs">{lineWidth}%</span>
                </div>
                <Slider value={[lineWidth]} onValueChange={(v) => setLineWidth(v[0])} max={100} step={1} className="[&_[role=slider]]:bg-orange-500" />
              </div>

              <div className="space-y-3">
                <Label className="text-zinc-500 text-[10px] uppercase font-bold tracking-widest">Direction de Comptage</Label>
                <Select value={direction} onValueChange={setDirection}>
                  <SelectTrigger className="bg-zinc-950 border-zinc-800 text-white h-11">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-950 border-zinc-800 text-white">
                    <SelectItem value="top-down"><div className="flex items-center gap-2"><ArrowUpDown className="w-4 h-4 text-orange-500" /><span>Haut → Bas</span></div></SelectItem>
                    <SelectItem value="bottom-up"><div className="flex items-center gap-2"><ArrowUpDown className="w-4 h-4 text-orange-500 rotate-180" /><span>Bas → Haut</span></div></SelectItem>
                    <SelectItem value="left-right"><div className="flex items-center gap-2"><ArrowRightLeft className="w-4 h-4 text-orange-500" /><span>Gauche → Droite</span></div></SelectItem>
                    <SelectItem value="right-left"><div className="flex items-center gap-2"><ArrowRightLeft className="w-4 h-4 text-orange-500 rotate-180" /><span>Droite → Gauche</span></div></SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {saveState === 'ok' && <p className="text-xs text-green-400">Configuration sauvegardée et appliquée en temps réel.</p>}
              {saveState === 'error' && <p className="text-xs text-red-400">Échec de sauvegarde.</p>}
            </div>
          </Card>

          <Card className="p-5 bg-orange-600/5 border border-orange-500/20 space-y-3">
            <div className="flex items-center gap-2 text-orange-500">
              <Square className="w-4 h-4" />
              <h4 className="text-[10px] font-bold uppercase tracking-widest">Conseil Industriel</h4>
            </div>
            <p className="text-[11px] text-zinc-400 leading-relaxed italic">
              Positionnez la ligne à environ 2/3 de la hauteur de l&apos;image pour minimiser les erreurs de double-comptage lors des rebonds de convoyeur.
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}

function Badge({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={`text-[10px] font-bold rounded px-1.5 py-0.5 border ${className}`}>{children}</div>;
}

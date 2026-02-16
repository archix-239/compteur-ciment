import {
  Maximize2,
  Move,
  Settings2,
  Save,
  RefreshCw,
  ArrowRightLeft,
  ArrowUpDown,
  Square,
  Video
} from 'lucide-react';
import { useState } from 'react';
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
} from "@/components/ui/select";

export default function VirtualLine() {
  const [lineY, setLineY] = useState(60);
  const [lineWidth, setLineWidth] = useState(80);
  const [direction, setDirection] = useState('top-down');

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Ligne Virtuelle de Comptage</h1>
          <p className="text-muted-foreground">Définissez la position exacte et les paramètres de déclenchement du comptage</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="border-zinc-800 text-white gap-2">
            <RefreshCw className="w-4 h-4" /> Réinitialiser
          </Button>
          <Button className="bg-orange-600 hover:bg-orange-700 text-white gap-2 shadow-lg shadow-orange-900/20">
            <Save className="w-4 h-4" /> Enregistrer la Configuration
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Visual Editor */}
        <Card className="xl:col-span-2 p-1 bg-zinc-950 border-zinc-800 overflow-hidden relative group">
          <div className="aspect-video bg-zinc-900 rounded-sm relative flex items-center justify-center overflow-hidden">
            {/* Simulated Video Stream */}
            <div className="absolute inset-0 opacity-40 bg-[url('https://images.unsplash.com/photo-1565793298595-6a879b1d9492?q=80&w=2071&auto=format&fit=crop')] bg-cover bg-center" />

            {/* Overlay Grid */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px]" />

            {/* Virtual Line Visual */}
            <div
              className="absolute left-1/2 -translate-x-1/2 border-t-2 border-orange-500 shadow-[0_0_15px_rgba(249,115,22,0.5)] transition-all duration-300"
              style={{
                top: `${lineY}%`,
                width: `${lineWidth}%`,
                borderStyle: 'dashed'
              }}
            >
              <div className="absolute -top-3 -left-3 w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center cursor-move shadow-lg">
                <Move className="w-3 h-3 text-white" />
              </div>
              <div className="absolute -top-3 -right-3 w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center cursor-move shadow-lg">
                <Move className="w-3 h-3 text-white" />
              </div>
              <div className="absolute top-2 left-1/2 -translate-x-1/2 bg-orange-500/20 backdrop-blur-md px-2 py-0.5 rounded border border-orange-500/50 text-[10px] font-bold text-orange-400 uppercase">
                Zone de Détection ACTIVE
              </div>
            </div>

            {/* HUD Elements */}
            <div className="absolute top-4 left-4 flex gap-2">
              <Badge className="bg-red-500/20 text-red-500 border-red-500/30 gap-1.5 px-2 py-1">
                <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" /> LIVE
              </Badge>
              <Badge className="bg-zinc-900/80 text-zinc-300 border-zinc-700 font-mono">192.168.1.42:8554</Badge>
            </div>

            <div className="absolute bottom-4 right-4 text-zinc-500 font-mono text-[10px]">
              COORD: Y={lineY}% | W={lineWidth}%
            </div>

            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
               <div className="bg-black/60 backdrop-blur-sm p-4 rounded-xl border border-white/10 flex flex-col items-center gap-2">
                  <Maximize2 className="w-8 h-8 text-white/50" />
                  <span className="text-xs text-white font-medium">Cliquez pour agrandir</span>
               </div>
            </div>
          </div>
        </Card>

        {/* Configuration Panel */}
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
                <Slider
                  value={[lineY]}
                  onValueChange={(v) => setLineY(v[0])}
                  max={100}
                  step={1}
                  className="[&_[role=slider]]:bg-orange-500"
                />
              </div>

              <div className="space-y-4">
                <div className="flex justify-between">
                  <Label className="text-zinc-500 text-[10px] uppercase font-bold tracking-widest">Largeur de Détection</Label>
                  <span className="text-orange-400 font-mono text-xs">{lineWidth}%</span>
                </div>
                <Slider
                  value={[lineWidth]}
                  onValueChange={(v) => setLineWidth(v[0])}
                  max={100}
                  step={1}
                  className="[&_[role=slider]]:bg-orange-500"
                />
              </div>

              <div className="space-y-3">
                <Label className="text-zinc-500 text-[10px] uppercase font-bold tracking-widest">Direction de Comptage</Label>
                <Select value={direction} onValueChange={setDirection}>
                  <SelectTrigger className="bg-zinc-950 border-zinc-800 text-white h-11">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-950 border-zinc-800 text-white">
                    <SelectItem value="top-down" className="gap-2">
                       <div className="flex items-center gap-2">
                         <ArrowUpDown className="w-4 h-4 text-orange-500" />
                         <span>Haut → Bas</span>
                       </div>
                    </SelectItem>
                    <SelectItem value="bottom-up">
                      <div className="flex items-center gap-2">
                         <ArrowUpDown className="w-4 h-4 text-orange-500 rotate-180" />
                         <span>Bas → Haut</span>
                       </div>
                    </SelectItem>
                    <SelectItem value="left-right">
                      <div className="flex items-center gap-2">
                         <ArrowRightLeft className="w-4 h-4 text-orange-500" />
                         <span>Gauche → Droite</span>
                       </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </Card>

          <Card className="p-5 bg-orange-600/5 border border-orange-500/20 space-y-3">
             <div className="flex items-center gap-2 text-orange-500">
                <Square className="w-4 h-4" />
                <h4 className="text-[10px] font-bold uppercase tracking-widest">Conseil Industriel</h4>
             </div>
             <p className="text-[11px] text-zinc-400 leading-relaxed italic">
               Positionnez la ligne à environ 2/3 de la hauteur de l'image pour minimiser les erreurs de double-comptage lors des rebonds de convoyeur.
             </p>
          </Card>

          <Button variant="outline" className="w-full border-zinc-800 text-zinc-400 hover:text-white h-12 gap-2 uppercase text-[10px] font-bold tracking-widest">
            <Video className="w-4 h-4" /> Tester la Détection
          </Button>
        </div>
      </div>
    </div>
  );
}

function Badge({ children, className }: { children: React.ReactNode, className?: string }) {
  return (
    <div className={`text-[10px] font-bold rounded px-1.5 py-0.5 border ${className}`}>
      {children}
    </div>
  );
}

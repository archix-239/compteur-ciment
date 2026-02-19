import { useEffect, useMemo, useState } from 'react';
import { RotateCcw, Plus, Info, Target, Zap, BrainCircuit, ArrowRight } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { fetchApi } from '@/lib/api';

interface ModelRuntimeConfig {
  selected_model: string;
  confidence_threshold: number;
  nms_iou_threshold: number;
  max_detections: number;
  inference_size: number;
  tracking_persistence: boolean;
}

const models = [
  { version: 'models/best_V5.pt', date: 'Actuel', accuracy: 99.4, latency: '12.4ms', status: 'active', notes: 'Modèle optimisé pour éclairage variable et sacs empilés.' },
  { version: 'models/best_V4.pt', date: 'Précédent', accuracy: 98.2, latency: '14.1ms', status: 'available', notes: 'Version précédente. Stable mais moins précise sur les sacs blancs.' },
  { version: 'v10.8.1', date: 'Archive', accuracy: 96.5, latency: '18.5ms', status: 'archived', notes: 'Ancien moteur YOLOv10.' },
];

export default function ModelConfig() {
  const [cfg, setCfg] = useState<ModelRuntimeConfig | null>(null);

  useEffect(() => {
    fetchApi('/api/config/model')
      .then((d) => setCfg(d as ModelRuntimeConfig))
      .catch(() => {});
  }, []);

  const confidencePct = useMemo(() => Math.round(((cfg?.confidence_threshold ?? 0.7) * 100)), [cfg]);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Gestion des Modèles IA</h1>
          <p className="text-muted-foreground">Contrôle des versions du moteur YOLO et suivi des performances</p>
        </div>
        <Button className="bg-orange-600 hover:bg-orange-700 text-white gap-2 h-11 px-6 shadow-lg shadow-orange-900/20">
          <Plus className="w-4 h-4" /> Entraîner Nouveau Modèle
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <h3 className="text-sm font-bold text-white uppercase tracking-widest">Historique des Versions</h3>
          {models.map((m, i) => {
            const isActive = cfg ? m.version === cfg.selected_model : m.status === 'active';
            return (
              <Card key={i} className={`p-5 bg-zinc-900/50 border-zinc-800 hover:border-zinc-700 transition-all ${isActive ? 'border-orange-500/30 ring-1 ring-orange-500/20' : ''}`}>
                <div className="flex items-start justify-between">
                  <div className="flex gap-4">
                    <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 h-fit">
                      <BrainCircuit className={`w-5 h-5 ${isActive ? 'text-orange-500' : 'text-zinc-600'}`} />
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-3">
                        <h4 className="text-sm font-bold text-white">{m.version}</h4>
                        {isActive && <Badge className="bg-green-500/10 text-green-500 border-green-500/20 text-[9px] font-bold">ACTIF</Badge>}
                        {m.status === 'archived' && <Badge className="bg-zinc-800 text-zinc-500 border-none text-[9px] font-bold">ARCHIVÉ</Badge>}
                      </div>
                      <p className="text-[11px] text-zinc-500 font-bold uppercase tracking-widest">{m.date}</p>
                      <p className="text-xs text-zinc-400 mt-2 max-w-md">{m.notes}</p>
                      <div className="flex gap-6 pt-3">
                        <div className="flex flex-col"><span className="text-[9px] text-zinc-600 uppercase font-bold tracking-tighter">Précision</span><span className="text-sm font-mono text-white font-bold">{m.accuracy}%</span></div>
                        <div className="flex flex-col"><span className="text-[9px] text-zinc-600 uppercase font-bold tracking-tighter">Latence</span><span className="text-sm font-mono text-white font-bold">{m.latency}</span></div>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    {m.status === 'available' && <Button variant="outline" className="h-8 border-zinc-800 text-[10px] font-bold uppercase tracking-widest gap-2"><RotateCcw className="w-3 h-3" /> Rollback vers cette version</Button>}
                    <Button variant="ghost" size="sm" className="h-8 text-[10px] font-bold uppercase text-zinc-500 hover:text-white">Voir Métriques Détallées</Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        <div className="space-y-6">
          <Card className="p-6 bg-zinc-900/50 border-zinc-800 space-y-6">
            <div className="flex items-center gap-2 border-b border-zinc-800 pb-4"><Target className="w-5 h-5 text-orange-500" /><h3 className="text-sm font-bold text-white uppercase tracking-widest">Performance Active</h3></div>
            <div className="space-y-6">
              <div className="space-y-3">
                <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-zinc-500"><span>Score de Confiance Moyen</span><span className="text-orange-500">{confidencePct}%</span></div>
                <Progress value={confidencePct} className="h-1.5 bg-zinc-800 [&>div]:bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.3)]" />
              </div>
              <div className="space-y-3">
                <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-zinc-500"><span>Stabilité Détection (NMS)</span><span className="text-white">{cfg ? cfg.nms_iou_threshold.toFixed(2) : '0.45'}</span></div>
                <Progress value={(cfg?.nms_iou_threshold ?? 0.45) * 100} className="h-1.5 bg-zinc-800" />
              </div>
              <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 space-y-3">
                <div className="flex items-center gap-2 text-[10px] font-bold text-zinc-500 uppercase"><Zap className="w-4 h-4 text-yellow-500" /> Runtime Inférence</div>
                <div className="flex justify-between text-xs"><span className="text-zinc-500">Max Det :</span><span className="text-white font-mono">{cfg?.max_detections ?? 100}</span></div>
                <div className="flex justify-between text-xs"><span className="text-zinc-500">Image Size :</span><span className="text-white font-mono">{cfg?.inference_size ?? 1280}</span></div>
              </div>
            </div>
          </Card>

          <Card className="p-5 bg-orange-600/5 border border-orange-500/20 space-y-4">
            <div className="flex items-center gap-2 text-orange-500"><Info className="w-5 h-5" /><h4 className="text-[10px] font-bold uppercase tracking-widest">Fine-Tuning Intelligent</h4></div>
            <p className="text-[11px] text-zinc-400 leading-relaxed italic">La configuration IA est chargée depuis le backend et appliquée à chaud sur le moteur de vision.</p>
            <Button variant="outline" className="w-full border-zinc-800 text-[10px] font-bold uppercase h-10 gap-2">Lancer Ré-entraînement <ArrowRight className="w-3 h-3" /></Button>
          </Card>
        </div>
      </div>
    </div>
  );
}

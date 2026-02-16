import { useState } from 'react';
import { Cpu, Save, Sliders, Zap, Shield, Plus } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";

export default function ModelConfig() {
  const [modelType, setModelType] = useState('v8');

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">Configuration du Modèle IA</h1>
        <p className="text-muted-foreground">Gérez les modèles YOLO, les seuils de détection et les paramètres d'optimisation</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-6 space-y-6 bg-card/50 border-zinc-800">
            <div className="flex items-center gap-2 font-semibold text-white border-b border-zinc-800 pb-4">
              <Cpu className="w-5 h-5 text-orange-500" />
              <span>Sélection du Modèle</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-zinc-400">Modèle Actif</Label>
                  <Select value={modelType} onValueChange={setModelType}>
                    <SelectTrigger className="bg-zinc-900 border-zinc-800 text-white">
                      <SelectValue placeholder="Choisir la version YOLO" />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
                      <SelectItem value="v5">YOLOv5 (Ancien)</SelectItem>
                      <SelectItem value="v8">YOLOv8 (Recommandé)</SelectItem>
                      <SelectItem value="v11">YOLOv11 (Optimisé Edge)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-zinc-400">Fichier de Poids (.pt)</Label>
                  <Select defaultValue="best_v5">
                    <SelectTrigger className="bg-zinc-900 border-zinc-800 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
                      <SelectItem value="best_v5">best_V5.pt (Production)</SelectItem>
                      <SelectItem value="best_v4">best_V4.pt (Secours)</SelectItem>
                      <SelectItem value="latest">latest_exp_32.pt (Entrainement)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="p-4 bg-zinc-900/50 rounded-lg border border-zinc-800 space-y-3">
                <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Informations Modèle</div>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-zinc-400">mAP 50-95</span>
                    <span className="font-mono text-green-400 font-bold">0.842</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Paramètres</span>
                    <span className="text-white">3.2M</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Dernier Entraînement</span>
                    <span className="text-white text-[10px]">20-08-2025</span>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          <Card className="p-6 space-y-6 bg-card/50 border-zinc-800">
            <div className="flex items-center gap-2 font-semibold text-white border-b border-zinc-800 pb-4">
              <Sliders className="w-5 h-5 text-orange-500" />
              <span>Seuils de Détection</span>
            </div>

            <div className="space-y-8">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <div className="space-y-0.5">
                    <Label className="text-white">Seuil de Confiance (IoU)</Label>
                    <p className="text-[10px] text-zinc-500 italic">Score minimum pour valider une détection</p>
                  </div>
                  <Badge variant="outline" className="font-mono text-orange-400 border-orange-500/20">0.70</Badge>
                </div>
                <Slider defaultValue={[70]} max={100} step={1} className="[&_[role=slider]]:bg-orange-500" />
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <div className="space-y-0.5">
                    <Label className="text-white">Buffer de Suivi</Label>
                    <p className="text-[10px] text-zinc-500 italic">Nombre d'images mémorisées après perte de vue</p>
                  </div>
                  <Badge variant="outline" className="font-mono text-blue-400 border-blue-500/20">30 f</Badge>
                </div>
                <Slider defaultValue={[30]} max={120} step={1} className="[&_[role=slider]]:bg-blue-500" />
              </div>
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="p-6 space-y-6 bg-card/50 border-zinc-800">
            <div className="flex items-center gap-2 font-semibold text-white border-b border-zinc-800 pb-4">
              <Zap className="w-5 h-5 text-orange-500" />
              <span>Optimisation Matérielle</span>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-sm text-zinc-300 font-medium">Accélération GPU</Label>
                  <p className="text-[9px] text-zinc-500">Utiliser CUDA/TensorRT</p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-sm text-zinc-300 font-medium">Prétraitement CLAHE</Label>
                  <p className="text-[9px] text-zinc-500">Amélioration du contraste local</p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-sm text-zinc-300 font-medium">Demi-Précision (FP16)</Label>
                  <p className="text-[9px] text-zinc-500">Vitesse accrue sur matériel récent</p>
                </div>
                <Switch defaultChecked />
              </div>
            </div>
          </Card>

          <Card className="p-6 space-y-4 bg-card/50 border-zinc-800">
            <div className="flex items-center gap-2 font-semibold text-white">
              <Shield className="w-5 h-5 text-orange-500" />
              <span>Pipeline de Vérification</span>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2 p-2 rounded bg-green-500/10 border border-green-500/20">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                <span className="text-[10px] text-green-400 font-bold uppercase">Décodage QR Code</span>
              </div>
              <div className="flex items-center gap-2 p-2 rounded bg-blue-500/10 border border-blue-500/20">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                <span className="text-[10px] text-blue-400 font-bold uppercase">Matching Logo Template</span>
              </div>
              <div className="flex items-center gap-2 p-2 rounded bg-orange-500/10 border border-orange-500/20 opacity-50">
                <div className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                <span className="text-[10px] text-orange-400 font-bold uppercase">Analyse de Couleur HSV</span>
              </div>
            </div>
            <Button variant="ghost" size="sm" className="w-full gap-2 text-[10px] text-zinc-500 hover:text-white border border-dashed border-zinc-800">
              <Plus className="w-3 h-3" /> AJOUTER UNE ÉTAPE
            </Button>
          </Card>
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-6 border-t border-zinc-800">
        <Button variant="outline" className="border-zinc-800 text-white">Réinitialiser</Button>
        <Button className="gap-2 bg-orange-600 hover:bg-orange-700 text-white">
          <Save className="w-4 h-4" /> Appliquer les Paramètres IA
        </Button>
      </div>
    </div>
  );
}

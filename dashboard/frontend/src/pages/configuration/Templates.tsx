import { Image as ImageIcon, Plus, Trash2, Save, Upload, Search, Palette, Eye } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

export default function Templates() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">Templates & Couleurs de Référence</h1>
        <p className="text-muted-foreground">Gérez les critères de vérification visuelle et les bibliothèques de couleurs</p>
      </div>

      <Tabs defaultValue="logo" className="space-y-6">
        <TabsList className="bg-zinc-900 border border-zinc-800 p-1">
          <TabsTrigger value="logo" className="gap-2">
            <ImageIcon className="w-4 h-4" /> Templates Logo
          </TabsTrigger>
          <TabsTrigger value="color" className="gap-2">
            <Palette className="w-4 h-4" /> Bibliothèque Couleurs
          </TabsTrigger>
        </TabsList>

        <TabsContent value="logo" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="p-6 space-y-4 bg-card/50 border-zinc-800">
              <div className="font-semibold text-white">Template Logo Actuel</div>
              <div className="aspect-square bg-black/40 rounded-lg flex items-center justify-center border-2 border-dashed border-orange-500/30 overflow-hidden group relative">
                <ImageIcon className="w-12 h-12 opacity-20 text-muted-foreground" />
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button variant="outline" size="sm" className="gap-2 border-white text-white">
                    <Upload className="w-4 h-4" /> Remplacer
                  </Button>
                </div>
              </div>
              <div className="space-y-4 pt-4 border-t border-zinc-800">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label className="text-zinc-400">Seuil de Correspondance</Label>
                    <span className="text-xs font-mono text-orange-400">0.65</span>
                  </div>
                  <Slider defaultValue={[65]} max={100} step={1} className="[&_[role=slider]]:bg-orange-500" />
                </div>
                <div className="flex justify-between text-[10px] text-zinc-500 uppercase font-bold tracking-widest">
                  <span>Dimension Template</span>
                  <span>124 x 124 px</span>
                </div>
              </div>
            </Card>

            <Card className="md:col-span-2 p-6 space-y-4 bg-card/50 border-zinc-800">
              <div className="flex justify-between items-center">
                <div className="font-semibold text-white text-sm">Historique des Templates</div>
                <Button size="sm" className="gap-2 bg-zinc-800 hover:bg-zinc-700 text-white h-8 text-xs">
                  <Plus className="w-3 h-3" /> Nouveau Template
                </Button>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="group relative aspect-square rounded-md bg-zinc-900 border border-zinc-800 p-2">
                    <div className="w-full h-full bg-black/20 rounded flex items-center justify-center">
                      <ImageIcon className="w-8 h-8 opacity-10 text-zinc-500" />
                    </div>
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-white hover:text-orange-400">
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-white hover:text-red-400">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                    <div className="absolute bottom-1 right-1">
                      <Badge variant="outline" className="text-[8px] h-3 bg-black/40 border-zinc-800">V{i}.0</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="color" className="space-y-6">
           <Card className="p-6 bg-card/50 border-zinc-800 space-y-6">
             <div className="flex justify-between items-center border-b border-zinc-800 pb-4">
               <h3 className="font-semibold text-white">Gestion des Références Couleurs</h3>
               <Button size="sm" className="bg-orange-600 hover:bg-orange-700 text-white h-8 gap-2">
                 <Plus className="w-3 h-3" /> Ajouter une Couleur
               </Button>
             </div>
             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                  { name: 'Gris Ciment Standard', hex: '#8E8E8E', hsv: '0, 0, 56' },
                  { name: 'Gris Poussière (Extérieur)', hex: '#A5A5A5', hsv: '0, 0, 65' },
                  { name: 'Gris Humide Foncé', hex: '#5F5F5F', hsv: '0, 0, 37' },
                ].map((color, i) => (
                  <div key={i} className="flex items-center justify-between p-4 rounded-xl border border-zinc-800 bg-zinc-900/50 group hover:border-zinc-700 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg shadow-inner ring-1 ring-white/10" style={{ backgroundColor: color.hex }} />
                      <div>
                        <div className="text-sm font-medium text-white">{color.name}</div>
                        <div className="text-[10px] text-zinc-500 font-mono">HSV: {color.hsv}</div>
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 text-zinc-500 hover:text-red-400 h-8 w-8 transition-opacity">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
             </div>
           </Card>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end gap-3 pt-6 border-t border-zinc-800">
        <Button variant="outline" className="border-zinc-800 text-white">Ignorer</Button>
        <Button className="gap-2 bg-orange-600 hover:bg-orange-700 text-white">
          <Save className="w-4 h-4" /> Enregistrer les Modifications
        </Button>
      </div>
    </div>
  );
}

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
        <h1 className="text-2xl font-bold tracking-tight text-white">Templates & Color Reference</h1>
        <p className="text-muted-foreground">Manage visual verification criteria and color libraries</p>
      </div>

      <Tabs defaultValue="logo" className="space-y-6">
        <TabsList className="bg-muted/50 p-1">
          <TabsTrigger value="logo" className="gap-2">
            <ImageIcon className="w-4 h-4" /> Logo Templates
          </TabsTrigger>
          <TabsTrigger value="color" className="gap-2">
            <Palette className="w-4 h-4" /> Color Library
          </TabsTrigger>
        </TabsList>

        <TabsContent value="logo" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="p-6 space-y-4">
              <div className="font-semibold text-white">Current Logo Template</div>
              <div className="aspect-square bg-black/40 rounded-lg flex items-center justify-center border-2 border-dashed border-orange-500/30 overflow-hidden group relative">
                <ImageIcon className="w-12 h-12 opacity-20 text-muted-foreground" />
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button variant="outline" size="sm" className="gap-2">
                    <Upload className="w-4 h-4" /> Replace
                  </Button>
                </div>
              </div>
              <div className="space-y-4 pt-4 border-t">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label>Matching Threshold</Label>
                    <span className="text-xs font-mono">0.65</span>
                  </div>
                  <Slider defaultValue={[65]} max={100} step={1} />
                </div>
              </div>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end gap-3 pt-6 border-t">
        <Button variant="outline">Discard Changes</Button>
        <Button className="gap-2">
          <Save className="w-4 h-4" /> Save Templates
        </Button>
      </div>
    </div>
  );
}

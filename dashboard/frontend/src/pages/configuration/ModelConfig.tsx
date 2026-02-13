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
        <h1 className="text-2xl font-bold tracking-tight text-white">AI Model Configuration</h1>
        <p className="text-muted-foreground">Manage YOLO models, detection thresholds and optimization parameters</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-6 space-y-6">
            <div className="flex items-center gap-2 font-semibold border-b pb-4">
              <Cpu className="w-5 h-5 text-orange-500" />
              <span>Model Selection</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Active Model</Label>
                  <Select value={modelType} onValueChange={setModelType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select YOLO version" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="v5">YOLOv5 (Legacy)</SelectItem>
                      <SelectItem value="v8">YOLOv8 (Recommended)</SelectItem>
                      <SelectItem value="v11">YOLOv11 (Edge optimized)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Weights File</Label>
                  <Select defaultValue="best_v5">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="best_v5">best_V5.pt (Production)</SelectItem>
                      <SelectItem value="best_v4">best_V4.pt (Backup)</SelectItem>
                      <SelectItem value="latest">latest_exp_32.pt</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="p-4 bg-muted/30 rounded-lg space-y-3">
                <div className="text-xs font-bold text-muted-foreground uppercase">Model Info</div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>mAP 50-95</span>
                    <span className="font-mono text-green-400">0.842</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Parameters</span>
                    <span>3.2M</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Last Trained</span>
                    <span>2025-08-20</span>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          <Card className="p-6 space-y-6">
            <div className="flex items-center gap-2 font-semibold border-b pb-4">
              <Sliders className="w-5 h-5 text-orange-500" />
              <span>Detection Thresholds</span>
            </div>

            <div className="space-y-8">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <div className="space-y-0.5">
                    <Label>Confidence Threshold (IOU)</Label>
                    <p className="text-xs text-muted-foreground">Minimum score to consider a detection valid</p>
                  </div>
                  <Badge variant="outline" className="font-mono">0.70</Badge>
                </div>
                <Slider defaultValue={[70]} max={100} step={1} />
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <div className="space-y-0.5">
                    <Label>Tracking Buffer</Label>
                    <p className="text-xs text-muted-foreground">Number of frames to keep an object in memory after loss</p>
                  </div>
                  <Badge variant="outline" className="font-mono">30 f</Badge>
                </div>
                <Slider defaultValue={[30]} max={120} step={1} />
              </div>
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="p-6 space-y-6">
            <div className="flex items-center gap-2 font-semibold border-b pb-4">
              <Zap className="w-5 h-5 text-orange-500" />
              <span>Optimization</span>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Hardware Acceleration</Label>
                  <p className="text-[10px] text-muted-foreground">Use CUDA/TensorRT if available</p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>CLAHE Pre-processing</Label>
                  <p className="text-[10px] text-muted-foreground">Enhance contrast locally</p>
                </div>
                <Switch defaultChecked />
              </div>
            </div>
          </Card>

          <Card className="p-6 space-y-4">
            <div className="flex items-center gap-2 font-semibold">
              <Shield className="w-5 h-5 text-orange-500" />
              <span>Verification Pipeline</span>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2 p-2 rounded bg-green-500/10 border border-green-500/20">
                <div className="w-2 h-2 rounded-full bg-green-500" />
                <span className="text-xs">QR Code Decoding</span>
              </div>
              <div className="flex items-center gap-2 p-2 rounded bg-blue-500/10 border border-blue-500/20">
                <div className="w-2 h-2 rounded-full bg-blue-500" />
                <span className="text-xs">Template Logo Matching</span>
              </div>
            </div>
          </Card>
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-6 border-t">
        <Button variant="outline">Reset to Defaults</Button>
        <Button className="gap-2">
          <Save className="w-4 h-4" /> Apply Model Settings
        </Button>
      </div>
    </div>
  );
}

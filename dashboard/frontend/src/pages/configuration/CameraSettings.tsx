import { useState } from 'react';
import { Camera, Save, Settings2, RefreshCcw, Video, Wifi } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
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

export default function CameraSettings() {
  const [sourceType, setSourceType] = useState('ip');

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">Camera Settings</h1>
        <p className="text-muted-foreground">Configure video inputs and camera hardware parameters</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-6">
          <Card className="p-6 space-y-4">
            <div className="flex items-center gap-2 font-semibold">
              <Settings2 className="w-5 h-5 text-orange-500" />
              <span>Input Configuration</span>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Source Type</Label>
                <Select value={sourceType} onValueChange={setSourceType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select source" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ip">IP Camera (RTSP/HTTP)</SelectItem>
                    <SelectItem value="webcam">Local Webcam</SelectItem>
                    <SelectItem value="file">Video File</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {sourceType === 'ip' && (
                <div className="space-y-2">
                  <Label>Stream URL</Label>
                  <div className="flex gap-2">
                    <Input placeholder="http://192.168.1.100:8080/video" defaultValue="http://192.168.137.186:8080/video" />
                    <Button variant="outline" size="icon"><RefreshCcw className="w-4 h-4" /></Button>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Resolution</Label>
                  <Select defaultValue="720p">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1080p">1920 x 1080 (FHD)</SelectItem>
                      <SelectItem value="720p">1280 x 720 (HD)</SelectItem>
                      <SelectItem value="480p">854 x 480 (SD)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Frame Rate (FPS)</Label>
                  <Input type="number" defaultValue="30" />
                </div>
              </div>
            </div>
          </Card>

          <Card className="p-6 space-y-4">
            <div className="flex items-center gap-2 font-semibold">
              <Video className="w-5 h-5 text-orange-500" />
              <span>Image Adjustments</span>
            </div>

            <div className="space-y-6">
              <div className="space-y-3">
                <div className="flex justify-between">
                  <Label>Brightness</Label>
                  <span className="text-xs text-muted-foreground">50%</span>
                </div>
                <Slider defaultValue={[50]} max={100} step={1} />
              </div>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <Label>Contrast</Label>
                  <span className="text-xs text-muted-foreground">65%</span>
                </div>
                <Slider defaultValue={[65]} max={100} step={1} />
              </div>
              <div className="flex items-center justify-between">
                <Label>Auto-Focus</Label>
                <Switch defaultChecked />
              </div>
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="p-6 space-y-4 bg-black/40 border-dashed relative min-h-[300px] flex flex-col items-center justify-center text-center">
            <div className="absolute top-4 left-4 flex items-center gap-2 text-xs font-mono text-green-400">
              <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              PREVIEW_FEED
            </div>
            <Camera className="w-16 h-16 text-muted-foreground/20 mb-4" />
            <p className="text-sm text-muted-foreground">Camera preview will appear here<br/>after successful connection</p>
            <Button variant="outline" size="sm" className="mt-4">Test Connection</Button>
          </Card>

          <Card className="p-6 space-y-4">
            <div className="flex items-center gap-2 font-semibold">
              <Wifi className="w-5 h-5 text-orange-500" />
              <span>Connection Info</span>
            </div>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Status</span>
                <span className="text-green-400 font-medium">CONNECTED</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">IP Address</span>
                <span className="font-mono text-xs">192.168.137.186</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">MAC Address</span>
                <span className="font-mono text-xs">00:1B:44:11:3A:B7</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Uptime</span>
                <span>12d 04h 23m</span>
              </div>
            </div>
          </Card>
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-6 border-t">
        <Button variant="outline">Cancel Changes</Button>
        <Button className="gap-2">
          <Save className="w-4 h-4" /> Save Configuration
        </Button>
      </div>
    </div>
  );
}

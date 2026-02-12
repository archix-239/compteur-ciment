import { useState } from 'react';
import { Settings2, Camera, Save } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

export default function CameraSettings() {
  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold tracking-tight text-white">Camera Settings</h1>
      <Card className="p-6 max-w-2xl space-y-4">
        <div className="flex items-center gap-2 font-semibold">
          <Settings2 className="w-5 h-5 text-orange-500" />
          <span>Input Configuration</span>
        </div>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Stream URL</Label>
            <Input defaultValue="http://192.168.137.186:8080/video" />
          </div>
          <Button className="gap-2"><Save className="w-4 h-4" /> Save Configuration</Button>
        </div>
      </Card>
    </div>
  );
}

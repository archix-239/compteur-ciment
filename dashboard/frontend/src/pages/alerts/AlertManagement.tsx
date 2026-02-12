import { Bell, Save, AlertTriangle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from "@/components/ui/switch";

export default function AlertManagement() {
  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold tracking-tight text-white">Alert Management</h1>
      <Card className="p-6 max-w-2xl space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-yellow-500" />
            <div>
              <div className="font-medium text-white">Production Slowdown</div>
              <div className="text-sm text-muted-foreground">Notify when production rate drops</div>
            </div>
          </div>
          <Switch defaultChecked />
        </div>
        <Button className="gap-2"><Save className="w-4 h-4" /> Save Alert Settings</Button>
      </Card>
    </div>
  );
}

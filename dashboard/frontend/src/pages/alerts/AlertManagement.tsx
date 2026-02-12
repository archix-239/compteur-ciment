import { useState } from 'react';
import { Bell, Save, AlertTriangle, Info, AlertOctagon, Mail, MessageSquare, Webhook, Plus, Clock, CheckCircle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function AlertManagement() {
  const [alerts] = useState([
    { id: 1, type: 'Critical', message: 'Camera Connection Lost', time: '10 mins ago', status: 'Active' },
    { id: 2, type: 'Warning', message: 'Low Confidence Detections (>15%)', time: '1 hour ago', status: 'Resolved' },
  ]);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Alert Management</h1>
          <p className="text-muted-foreground">Define production monitoring rules and notification preferences</p>
        </div>
        <Button className="gap-2">
          <Plus className="w-4 h-4" /> New Rule
        </Button>
      </div>

      <Tabs defaultValue="rules" className="space-y-6">
        <TabsList className="bg-muted/50 p-1">
          <TabsTrigger value="rules" className="gap-2">
            <Bell className="w-4 h-4" /> Alert Rules
          </TabsTrigger>
          <TabsTrigger value="history" className="gap-2">
            <Clock className="w-4 h-4" /> Alert History
          </TabsTrigger>
        </TabsList>

        <TabsContent value="rules" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="p-6 space-y-4 border-red-500/20 bg-red-500/5">
              <div className="flex items-center justify-between">
                <div className="p-2 bg-red-500/20 rounded">
                  <AlertOctagon className="w-5 h-5 text-red-500" />
                </div>
                <Switch defaultChecked />
              </div>
              <div>
                <h3 className="font-bold text-white">Production Stopped</h3>
                <p className="text-xs text-muted-foreground">Triggered when no bags are detected for X seconds</p>
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] uppercase">Threshold (Seconds)</Label>
                <Input type="number" defaultValue="60" />
              </div>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end gap-3 pt-6 border-t">
        <Button variant="outline">Discard All Changes</Button>
        <Button className="gap-2">
          <Save className="w-4 h-4" /> Save Alert Settings
        </Button>
      </div>
    </div>
  );
}

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
    { id: 1, type: 'Critique', message: 'Perte de Connexion Caméra', time: 'il y a 10 min', status: 'Actif' },
    { id: 2, type: 'Avertissement', message: 'Taux de Confiance Faible (>15%)', time: 'il y a 1 h', status: 'Résolu' },
  ]);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Gestion des Alertes</h1>
          <p className="text-muted-foreground">Définissez les règles de surveillance et les canaux de notification</p>
        </div>
        <Button className="gap-2 bg-orange-600 hover:bg-orange-700 text-white">
          <Plus className="w-4 h-4" /> Nouvelle Règle
        </Button>
      </div>

      <Tabs defaultValue="rules" className="space-y-6">
        <TabsList className="bg-zinc-900 border border-zinc-800 p-1">
          <TabsTrigger value="rules" className="gap-2">
            <Bell className="w-4 h-4" /> Règles d'Alerte
          </TabsTrigger>
          <TabsTrigger value="history" className="gap-2">
            <Clock className="w-4 h-4" /> Historique
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
                <h3 className="font-bold text-white">Arrêt de Production</h3>
                <p className="text-[11px] text-muted-foreground leading-relaxed">Déclenché si aucun sac n'est détecté pendant X secondes</p>
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] uppercase font-bold text-zinc-500">Seuil (Secondes)</Label>
                <Input type="number" defaultValue="60" className="bg-zinc-900 border-zinc-800 text-white" />
              </div>
              <div className="flex gap-2">
                <Badge variant="destructive" className="text-[9px]">CRITIQUE</Badge>
                <Badge variant="outline" className="text-[9px] border-zinc-700">EMAIL</Badge>
              </div>
            </Card>

            <Card className="p-6 space-y-4 border-yellow-500/20 bg-yellow-500/5">
              <div className="flex items-center justify-between">
                <div className="p-2 bg-yellow-500/20 rounded">
                  <AlertTriangle className="w-5 h-5 text-yellow-500" />
                </div>
                <Switch defaultChecked />
              </div>
              <div>
                <h3 className="font-bold text-white">Ralentissement Détecté</h3>
                <p className="text-[11px] text-muted-foreground leading-relaxed">Déclenché si l'intervalle moyen dépasse le seuil</p>
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] uppercase font-bold text-zinc-500">Seuil (Secondes)</Label>
                <Input type="number" defaultValue="10" className="bg-zinc-900 border-zinc-800 text-white" />
              </div>
              <div className="flex gap-2">
                <Badge variant="outline" className="text-[9px] border-yellow-500/30 text-yellow-500">AVERTISSEMENT</Badge>
                <Badge variant="outline" className="text-[9px] border-zinc-700">WEBHOOK</Badge>
              </div>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="history">
          <Card className="p-4 bg-card/50 border-zinc-800">
            <div className="rounded-md border border-zinc-800 overflow-hidden">
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow className="border-zinc-800">
                    <TableHead className="w-[120px] text-zinc-400">Gravité</TableHead>
                    <TableHead className="text-zinc-400">Message</TableHead>
                    <TableHead className="text-zinc-400">Moment</TableHead>
                    <TableHead className="text-zinc-400">Statut</TableHead>
                    <TableHead className="text-right text-zinc-400">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {alerts.map((alert) => (
                    <TableRow key={alert.id} className="border-zinc-800 hover:bg-muted/20">
                      <TableCell>
                        <Badge
                          variant={alert.type === 'Critique' ? 'destructive' : 'outline'}
                          className={alert.type === 'Critique' ? '' : 'border-yellow-500/50 text-yellow-500'}
                        >
                          {alert.type.toUpperCase()}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium text-white">{alert.message}</TableCell>
                      <TableCell className="text-zinc-500 text-xs italic">{alert.time}</TableCell>
                      <TableCell>
                         <div className="flex items-center gap-2">
                            <div className={`w-1.5 h-1.5 rounded-full ${alert.status === 'Actif' ? 'bg-red-500 animate-pulse' : 'bg-green-500'}`} />
                            <span className="text-xs text-zinc-300">{alert.status}</span>
                         </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" className="text-orange-400 hover:text-orange-300 h-8 text-xs font-bold">RECONNAÎTRE</Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end gap-3 pt-6 border-t border-zinc-800">
        <Button variant="outline" className="border-zinc-800 text-white">Annuler</Button>
        <Button className="gap-2 bg-orange-600 hover:bg-orange-700 text-white">
          <Save className="w-4 h-4" /> Enregistrer la Configuration
        </Button>
      </div>
    </div>
  );
}

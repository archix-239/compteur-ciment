import {
  Key,
  Shield,
  Terminal,
  Copy,
  Plus,
  Trash2,
  Eye,
  RefreshCcw,
  Globe,
  Lock,
  Clock,
  CheckCircle2,
  Webhook,
  Zap,
  Play
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function ApiManagement() {
  const apiKeys = [
    {
      name: "Lecture-Seule Monitoring",
      key: "pk_live_**************************42",
      created: "12/01/2024",
      lastUsed: "Il y a 2h",
      scope: "monitoring:read",
      status: "active"
    },
    {
      name: "Intégration ERP SAP",
      key: "pk_live_**************************07",
      created: "05/02/2024",
      lastUsed: "À l'instant",
      scope: "production:write",
      status: "active"
    }
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Gestion de l'API</h1>
          <p className="text-muted-foreground">Générez des clés d'accès sécurisées et configurez vos webhooks sortants</p>
        </div>
        <Button className="bg-orange-600 hover:bg-orange-700 text-white gap-2 h-11 px-6 shadow-lg shadow-orange-900/20">
          <Plus className="w-4 h-4" /> Créer une Clé API
        </Button>
      </div>

      <Tabs defaultValue="keys" className="space-y-6">
        <TabsList className="bg-zinc-900 border border-zinc-800 p-1">
          <TabsTrigger value="keys" className="gap-2">
            <Key className="w-4 h-4" /> Clés API
          </TabsTrigger>
          <TabsTrigger value="webhooks" className="gap-2">
            <Webhook className="w-4 h-4" /> Webhooks
          </TabsTrigger>
          <TabsTrigger value="testing" className="gap-2">
            <Play className="w-4 h-4" /> Zone de Test
          </TabsTrigger>
        </TabsList>

        <TabsContent value="keys" className="space-y-6">
           <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="p-4 bg-zinc-900/50 border-zinc-800 space-y-3">
                <div className="flex items-center gap-2 text-zinc-500 font-bold text-[10px] uppercase tracking-widest">
                  <Globe className="w-3 h-3 text-orange-500" /> API Endpoint
                </div>
                <div className="flex items-center justify-between gap-2 p-2 rounded bg-zinc-950 border border-zinc-800">
                   <code className="text-xs text-orange-400 font-mono">https://api.ciment-monitor.io/v1</code>
                   <Button variant="ghost" size="icon" className="h-6 w-6"><Copy className="w-3 h-3 text-zinc-500" /></Button>
                </div>
              </Card>
              <Card className="p-4 bg-zinc-900/50 border-zinc-800 space-y-3">
                <div className="flex items-center gap-2 text-zinc-500 font-bold text-[10px] uppercase tracking-widest">
                  <Lock className="w-3 h-3 text-blue-500" /> Authentification
                </div>
                <p className="text-[11px] text-zinc-400 leading-tight">Header <code className="text-white bg-zinc-800 px-1 rounded">X-API-Key</code> requis.</p>
              </Card>
              <Card className="p-4 bg-zinc-900/50 border-zinc-800 space-y-3">
                <div className="flex items-center gap-2 text-zinc-500 font-bold text-[10px] uppercase tracking-widest">
                  <Zap className="w-3 h-3 text-green-500" /> Rate Limiting
                </div>
                <p className="text-[11px] text-zinc-400 leading-tight">Limite : <span className="text-white font-bold">1k req/min</span>.</p>
              </Card>
           </div>

           <Card className="bg-zinc-900/50 border-zinc-800 overflow-hidden">
             <Table>
               <TableHeader className="bg-zinc-950">
                 <TableRow className="border-zinc-800 hover:bg-transparent">
                   <TableHead className="text-zinc-500 text-[10px] uppercase font-bold h-10">Nom de la Clé</TableHead>
                   <TableHead className="text-zinc-500 text-[10px] uppercase font-bold h-10">Clé API</TableHead>
                   <TableHead className="text-zinc-500 text-[10px] uppercase font-bold h-10 text-right">Actions</TableHead>
                 </TableRow>
               </TableHeader>
               <TableBody>
                 {apiKeys.map((key) => (
                   <TableRow key={key.name} className="border-zinc-800 hover:bg-zinc-800/20">
                     <TableCell>
                        <div className="flex flex-col">
                           <span className="text-sm font-bold text-white">{key.name}</span>
                           <span className="text-[10px] text-zinc-500 font-mono lowercase">{key.scope}</span>
                        </div>
                     </TableCell>
                     <TableCell>
                       <code className="text-xs font-mono text-zinc-500 bg-zinc-950 px-2 py-1 rounded border border-zinc-800">
                         {key.key}
                       </code>
                     </TableCell>
                     <TableCell className="text-right">
                       <div className="flex justify-end gap-2">
                         <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-500 hover:text-white"><Eye className="w-4 h-4" /></Button>
                         <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-500 hover:text-red-400"><Trash2 className="w-4 h-4" /></Button>
                       </div>
                     </TableCell>
                   </TableRow>
                 ))}
               </TableBody>
             </Table>
           </Card>
        </TabsContent>

        <TabsContent value="webhooks" className="space-y-6">
           <Card className="p-6 bg-zinc-900/50 border-zinc-800 space-y-6">
              <div className="flex items-center justify-between">
                 <div className="flex items-center gap-2">
                    <Webhook className="w-5 h-5 text-orange-500" />
                    <h3 className="text-sm font-bold text-white uppercase tracking-widest">Configuration Webhook</h3>
                 </div>
                 <Button className="bg-zinc-800 text-white h-9 text-[10px] font-bold uppercase gap-2">
                   <Plus className="w-3 h-3" /> Nouveau Webhook
                 </Button>
              </div>
              <div className="space-y-4">
                 <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-950 flex items-center justify-between">
                    <div className="space-y-1">
                       <div className="flex items-center gap-3">
                          <span className="text-sm font-bold text-white">SAP Production Hook</span>
                          <Badge className="bg-green-500/10 text-green-500 border-green-500/20 text-[9px] uppercase">Actif</Badge>
                       </div>
                       <p className="text-xs text-zinc-500 font-mono">https://sap.client-erp.com/api/v1/counts</p>
                    </div>
                    <div className="flex items-center gap-4">
                       <Switch defaultChecked />
                       <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-500"><Settings className="w-4 h-4" /></Button>
                    </div>
                 </div>
              </div>
           </Card>
        </TabsContent>

        <TabsContent value="testing" className="space-y-6">
           <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="p-6 bg-zinc-900/50 border-zinc-800 space-y-4">
                 <h3 className="text-sm font-bold text-white uppercase tracking-widest">Requête de Test</h3>
                 <div className="space-y-4">
                    <div className="space-y-2">
                       <Label className="text-[10px] font-bold text-zinc-500 uppercase">Méthode & Endpoint</Label>
                       <div className="flex gap-2">
                          <div className="px-3 py-2 bg-zinc-950 border border-zinc-800 text-xs text-green-500 font-bold rounded">GET</div>
                          <div className="flex-1 px-3 py-2 bg-zinc-950 border border-zinc-800 text-xs text-white font-mono rounded">/v1/counts/latest</div>
                       </div>
                    </div>
                    <Button className="w-full bg-orange-600 hover:bg-orange-700 text-white h-11 gap-2 uppercase text-xs font-bold">
                       <Play className="w-4 h-4 fill-white" /> Envoyer la Requête
                    </Button>
                 </div>
              </Card>

              <Card className="p-6 bg-zinc-950 border border-zinc-800 space-y-4 font-mono">
                 <div className="flex items-center justify-between border-b border-zinc-900 pb-2">
                    <span className="text-[10px] font-bold text-zinc-500 uppercase">Réponse JSON</span>
                    <Badge className="bg-green-500/10 text-green-500 border-green-500/20 text-[9px]">200 OK</Badge>
                 </div>
                 <div className="text-xs space-y-1">
                    <p className="text-orange-400">{`{`}</p>
                    <p className="text-orange-400 ml-4">{`"id": "DET_9012",`}</p>
                    <p className="text-orange-400 ml-4">{`"timestamp": "2024-03-13T14:20:00Z",`}</p>
                    <p className="text-orange-400 ml-4">{`"confidence": 0.982,`}</p>
                    <p className="text-orange-400 ml-4">{`"class": "cement_bag"`}</p>
                    <p className="text-orange-400">{`}`}</p>
                 </div>
              </Card>
           </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

import { Settings } from 'lucide-react';

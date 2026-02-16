import {
  Bell,
  Volume2,
  VolumeX,
  Settings2,
  CheckCircle2,
  Clock,
  AlertOctagon,
  Mail,
  MessageSquare,
  Zap,
  Trash2,
  ChevronRight
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';

const notifications = [
  {
    id: 1,
    title: "Arrêt prolongé détecté",
    description: "La ligne de production est à l'arrêt depuis plus de 5 minutes.",
    time: "il y a 2 min",
    type: "critical",
    read: false
  },
  {
    id: 2,
    title: "Ajustement IA Requis",
    description: "Le taux de confiance est descendu sous les 70% sur la Camera-02.",
    time: "il y a 15 min",
    type: "warning",
    read: false
  },
  {
    id: 3,
    title: "Rapport journalier prêt",
    description: "Le rapport de production du 12 Mars a été généré avec succès.",
    time: "il y a 1h",
    type: "info",
    read: true
  },
];

export default function AlertManagement() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Gestion des Alertes</h1>
          <p className="text-muted-foreground">Configurez les notifications et gérez les incidents en temps réel</p>
        </div>
        <div className="flex gap-2">
           <Button variant="outline" className="border-zinc-800 text-white gap-2">
             <Trash2 className="w-4 h-4" /> Tout effacer
           </Button>
           <Button className="bg-orange-600 hover:bg-orange-700 text-white gap-2">
             <CheckCircle2 className="w-4 h-4" /> Tout marquer comme lu
           </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
           <Card className="bg-zinc-900/50 border-zinc-800 overflow-hidden">
             <div className="p-4 border-b border-zinc-800 bg-zinc-900/30 flex items-center justify-between">
                <h3 className="text-sm font-bold text-white uppercase tracking-widest">Centre de Notifications</h3>
                <Badge className="bg-orange-500/20 text-orange-500 border-orange-500/20">2 Non lues</Badge>
             </div>
             <ScrollArea className="h-[500px]">
                <div className="divide-y divide-zinc-800/50">
                   {notifications.map((notif) => (
                     <div key={notif.id} className={`p-4 hover:bg-zinc-800/30 transition-colors flex gap-4 ${!notif.read ? 'bg-orange-500/[0.02]' : ''}`}>
                        <div className={`
                          w-10 h-10 rounded-full flex items-center justify-center shrink-0
                          ${notif.type === 'critical' ? 'bg-red-500/20 text-red-500' :
                            notif.type === 'warning' ? 'bg-yellow-500/20 text-yellow-500' :
                            'bg-blue-500/20 text-blue-500'}
                        `}>
                           {notif.type === 'critical' ? <AlertOctagon className="w-5 h-5" /> :
                            notif.type === 'warning' ? <Zap className="w-5 h-5" /> :
                            <Bell className="w-5 h-5" />}
                        </div>
                        <div className="flex-1 space-y-1">
                           <div className="flex items-center justify-between">
                              <h4 className={`text-sm font-bold ${!notif.read ? 'text-white' : 'text-zinc-400'}`}>{notif.title}</h4>
                              <span className="text-[10px] text-zinc-500 font-bold">{notif.time}</span>
                           </div>
                           <p className="text-xs text-zinc-500 leading-relaxed">{notif.description}</p>
                           <div className="flex gap-4 pt-3">
                              <button className="text-[10px] font-bold text-orange-500 uppercase tracking-widest hover:underline">Acquitter</button>
                              <button className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest hover:underline">Plus de détails</button>
                              <button className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest hover:underline">Snooze 15m</button>
                           </div>
                        </div>
                        <div className="flex items-center">
                           {!notif.read && <div className="w-2 h-2 rounded-full bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.8)]" />}
                        </div>
                     </div>
                   ))}
                </div>
             </ScrollArea>
           </Card>
        </div>

        <div className="space-y-6">
           <Card className="p-6 bg-zinc-900/50 border-zinc-800 space-y-6">
              <div className="flex items-center gap-2 border-b border-zinc-800 pb-4">
                 <Settings2 className="w-5 h-5 text-orange-500" />
                 <h3 className="text-sm font-bold text-white uppercase tracking-widest">Configuration</h3>
              </div>
              <div className="space-y-6">
                 <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                       <Label className="text-xs text-zinc-300">Alertes Sonores</Label>
                       <p className="text-[10px] text-zinc-500 italic">Émettre un son pour les alertes critiques</p>
                    </div>
                    <Switch defaultChecked />
                 </div>
                 <div className="space-y-3">
                    <Label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Volume de l'alerte</Label>
                    <div className="flex items-center gap-3">
                       <VolumeX className="w-4 h-4 text-zinc-500" />
                       <div className="flex-1 h-1.5 bg-zinc-800 rounded-full overflow-hidden relative">
                          <div className="absolute top-0 left-0 h-full bg-orange-500 w-[65%]" />
                       </div>
                       <Volume2 className="w-4 h-4 text-zinc-300" />
                    </div>
                 </div>
                 <div className="pt-4 border-t border-zinc-800 space-y-4">
                    <div className="flex items-center justify-between">
                       <div className="flex items-center gap-2">
                          <Mail className="w-4 h-4 text-zinc-500" />
                          <span className="text-xs text-zinc-300">Notifications Email</span>
                       </div>
                       <Switch defaultChecked />
                    </div>
                    <div className="flex items-center justify-between">
                       <div className="flex items-center gap-2">
                          <MessageSquare className="w-4 h-4 text-zinc-500" />
                          <span className="text-xs text-zinc-300">Notifications Slack/Teams</span>
                       </div>
                       <Switch />
                    </div>
                 </div>
              </div>
           </Card>

           <Card className="p-5 bg-zinc-900/80 border border-zinc-800">
              <h4 className="text-[10px] font-bold text-white uppercase tracking-widest mb-4">Urgence / Contact</h4>
              <div className="space-y-3">
                 <div className="flex items-center justify-between p-2 rounded bg-zinc-950 border border-zinc-800">
                    <span className="text-[10px] text-zinc-400">Superviseur Astreinte</span>
                    <span className="text-[10px] font-bold text-orange-500 font-mono">+33 6 12 34 56 78</span>
                 </div>
                 <Button variant="outline" className="w-full border-zinc-800 text-[10px] font-bold uppercase tracking-widest h-9 gap-2">
                    Lancer une Alerte Manuelle <ChevronRight className="w-3 h-3" />
                 </Button>
              </div>
           </Card>
        </div>
      </div>
    </div>
  );
}

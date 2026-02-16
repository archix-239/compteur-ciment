import {
  History,
  User,
  Clock,
  Database,
  Settings,
  ArrowRight,
  Search,
  Filter,
  ArrowLeftRight
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const auditLogs = [
  {
    id: "LOG-9281",
    user: "Marc Lambert",
    role: "Administrateur",
    action: "Modification Seuil IA",
    target: "Ligne A - Camera 01",
    date: "13 Mars, 14:20",
    before: "0.65",
    after: "0.75",
    reason: "Optimisation faux positifs"
  },
  {
    id: "LOG-9280",
    user: "Sophie Durant",
    role: "Superviseur",
    action: "Réinitialisation Compteur",
    target: "Ligne B - Session #42",
    date: "13 Mars, 11:05",
    before: "1420",
    after: "0",
    reason: "Fin de lot de production"
  },
  {
    id: "LOG-9279",
    user: "Système",
    role: "Automate",
    action: "Rotation Clé API",
    target: "SAP Integration",
    date: "12 Mars, 00:00",
    before: "****42",
    after: "****89",
    reason: "Sécurité périodique"
  }
];

export default function AuditTrail() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Audit Trail</h1>
          <p className="text-muted-foreground">Historique complet des modifications et actions système pour la conformité</p>
        </div>
        <div className="flex gap-2">
           <Button variant="outline" className="border-zinc-800 text-white gap-2 h-10 px-4">
             <Filter className="w-4 h-4" /> Filtres
           </Button>
           <div className="relative group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 group-focus-within:text-orange-500 transition-colors" />
              <input
                placeholder="Rechercher une action..."
                className="bg-zinc-950 border border-zinc-800 rounded-lg h-10 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-orange-500 w-64 transition-all"
              />
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4 bg-zinc-900/50 border-zinc-800 flex items-center gap-4">
           <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20">
              <History className="w-5 h-5 text-blue-500" />
           </div>
           <div>
              <div className="text-2xl font-bold text-white">1,240</div>
              <div className="text-[10px] text-zinc-500 uppercase font-bold">Événements / Mois</div>
           </div>
        </Card>
        <Card className="p-4 bg-zinc-900/50 border-zinc-800 flex items-center gap-4">
           <div className="p-3 rounded-xl bg-orange-500/10 border border-orange-500/20">
              <User className="w-5 h-5 text-orange-500" />
           </div>
           <div>
              <div className="text-2xl font-bold text-white">12</div>
              <div className="text-[10px] text-zinc-500 uppercase font-bold">Utilisateurs Actifs</div>
           </div>
        </Card>
        <Card className="p-4 bg-zinc-900/50 border-zinc-800 flex items-center gap-4">
           <div className="p-3 rounded-xl bg-green-500/10 border border-green-500/20">
              <Database className="w-5 h-5 text-green-500" />
           </div>
           <div>
              <div className="text-2xl font-bold text-white">Conforme</div>
              <div className="text-[10px] text-zinc-500 uppercase font-bold">Standard ISO-27001</div>
           </div>
        </Card>
      </div>

      <Card className="bg-zinc-900/50 border-zinc-800 overflow-hidden">
        <div className="p-4 border-b border-zinc-800 bg-zinc-900/30">
          <h3 className="text-sm font-bold text-white uppercase tracking-widest">Journal d'Audit</h3>
        </div>
        <Table>
          <TableHeader className="bg-zinc-950">
            <TableRow className="border-zinc-800 hover:bg-transparent">
              <TableHead className="text-zinc-500 text-[10px] uppercase font-bold h-12">Utilisateur</TableHead>
              <TableHead className="text-zinc-500 text-[10px] uppercase font-bold h-12">Action / Cible</TableHead>
              <TableHead className="text-zinc-500 text-[10px] uppercase font-bold h-12">Date</TableHead>
              <TableHead className="text-zinc-500 text-[10px] uppercase font-bold h-12 text-center">Avant / Après</TableHead>
              <TableHead className="text-zinc-500 text-[10px] uppercase font-bold h-12">Raison</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {auditLogs.map((log) => (
              <TableRow key={log.id} className="border-zinc-800 hover:bg-zinc-800/20 group">
                <TableCell>
                  <div className="flex flex-col">
                     <span className="text-sm font-bold text-white">{log.user}</span>
                     <span className="text-[10px] text-zinc-500 uppercase font-bold">{log.role}</span>
                  </div>
                </TableCell>
                <TableCell>
                   <div className="flex flex-col">
                      <span className="text-sm text-orange-400 font-medium">{log.action}</span>
                      <span className="text-[10px] text-zinc-500 italic">{log.target}</span>
                   </div>
                </TableCell>
                <TableCell>
                   <div className="flex items-center gap-2 text-xs text-zinc-300">
                      <Clock className="w-3.5 h-3.5 text-zinc-500" /> {log.date}
                   </div>
                </TableCell>
                <TableCell>
                   <div className="flex items-center justify-center gap-2">
                      <span className="text-[11px] font-mono text-zinc-500 bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800">{log.before}</span>
                      <ArrowRight className="w-3 h-3 text-zinc-600" />
                      <span className="text-[11px] font-mono text-white bg-orange-600/20 px-2 py-0.5 rounded border border-orange-600/30">{log.after}</span>
                   </div>
                </TableCell>
                <TableCell>
                   <span className="text-[11px] text-zinc-400 leading-relaxed italic truncate max-w-[200px] block">"{log.reason}"</span>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <div className="flex justify-between items-center text-[10px] text-zinc-600 uppercase font-bold tracking-widest px-2">
         <span>Affichage de 3 sur 1,240 enregistrements</span>
         <div className="flex gap-2">
            <Button variant="outline" size="sm" className="h-8 border-zinc-800 text-zinc-500" disabled>Précédent</Button>
            <Button variant="outline" size="sm" className="h-8 border-zinc-800 text-white">Suivant</Button>
         </div>
      </div>
    </div>
  );
}

import { useState } from 'react';
import {
  Users,
  UserPlus,
  Shield,
  Mail,
  Key,
  Trash2,
  Edit2,
  Search,
  Filter,
  ShieldCheck,
  Clock,
  Lock,
  Globe,
  Monitor,
  Filter
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const MOCK_USERS = [
  { id: 1, name: 'Admin Principal', email: 'admin@cement-factory.com', role: 'Admin', status: 'Actif', initials: 'AP', lastActive: 'Maintenant' },
  { id: 2, name: 'John Opérateur', email: 'john.d@cement-factory.com', role: 'Opérateur', status: 'Actif', initials: 'JO', lastActive: 'il y a 12m' },
  { id: 3, name: 'Sarah Consultante', email: 'sarah.l@cement-factory.com', role: 'Lecteur', status: 'Inactif', initials: 'SC', lastActive: 'il y a 2j' },
];

const MOCK_CONNECTIONS = [
  { user: 'Admin Principal', ip: '192.168.1.42', location: 'Bureau Interne', device: 'Chrome / Windows', time: '27 Août, 10:45' },
  { user: 'John Opérateur', ip: '10.10.230.16', location: 'Salle de Contrôle A', device: 'Edge / Ubuntu', time: '27 Août, 08:30' },
  { user: 'Sarah Consultante', ip: '172.16.0.5', location: 'VPN Externe', device: 'Safari / macOS', time: '25 Août, 16:20' },
];

export default function UserManagement() {
  const [users] = useState(MOCK_USERS);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Gestion des Utilisateurs</h1>
          <p className="text-muted-foreground">Gérez les accès système, les rôles et surveillez la sécurité des connexions</p>
        </div>
        <Button className="gap-2 bg-orange-600 hover:bg-orange-700 text-white">
          <UserPlus className="w-4 h-4" /> Nouvel Utilisateur
        </Button>
      </div>

      <Tabs defaultValue="users" className="space-y-6">
        <TabsList className="bg-zinc-900 border border-zinc-800 p-1">
          <TabsTrigger value="users" className="gap-2 text-white">
            <Users className="w-4 h-4" /> Utilisateurs
          </TabsTrigger>
          <TabsTrigger value="activity" className="gap-2 text-white">
            <Clock className="w-4 h-4" /> Historique Connexions
          </TabsTrigger>
          <TabsTrigger value="permissions" className="gap-2 text-white">
            <Shield className="w-4 h-4" /> Rôles & Permissions
          </TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-6">
          <Card className="p-4 bg-card/50 border-zinc-800">
            <div className="flex gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input placeholder="Rechercher par nom, email ou rôle..." className="pl-10 bg-zinc-900 border-zinc-800 text-white" />
              </div>
              <Button variant="outline" className="gap-2 border-zinc-800 text-white hover:bg-zinc-900">
                <Filter className="w-4 h-4" /> Filtrer
              </Button>
            </div>

            <div className="rounded-md border border-zinc-800 overflow-hidden">
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow className="border-zinc-800">
                    <TableHead className="text-zinc-400">Profil Utilisateur</TableHead>
                    <TableHead className="text-zinc-400">Rôle Système</TableHead>
                    <TableHead className="text-zinc-400">État du Compte</TableHead>
                    <TableHead className="text-zinc-400">Dernière Activité</TableHead>
                    <TableHead className="text-right text-zinc-400">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id} className="hover:bg-muted/30 border-zinc-800 transition-colors">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-9 w-9 border border-orange-500/20 ring-1 ring-orange-500/10">
                            <AvatarFallback className="bg-orange-500/10 text-orange-400 text-xs font-bold">{user.initials}</AvatarFallback>
                          </Avatar>
                          <div className="flex flex-col">
                            <span className="font-semibold text-white text-sm">{user.name}</span>
                            <span className="text-[10px] text-zinc-500">{user.email}</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={
                            user.role === 'Admin' ? 'border-orange-500/30 bg-orange-500/5 text-orange-400' :
                            user.role === 'Opérateur' ? 'border-blue-500/30 bg-blue-500/5 text-blue-400' :
                            'border-zinc-700 text-zinc-400'
                          }
                        >
                          {user.role}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${user.status === 'Actif' ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]' : 'bg-zinc-600'}`} />
                          <span className={`text-xs ${user.status === 'Actif' ? 'text-green-400' : 'text-zinc-500'}`}>{user.status}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-zinc-400 text-xs font-mono">
                        {user.lastActive}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-500 hover:text-white transition-colors">
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-500 hover:text-red-400 transition-colors">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="activity">
          <Card className="p-4 bg-card/50 border-zinc-800">
            <div className="rounded-md border border-zinc-800 overflow-hidden">
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow className="border-zinc-800">
                    <TableHead className="text-zinc-400">Utilisateur</TableHead>
                    <TableHead className="text-zinc-400">Adresse IP</TableHead>
                    <TableHead className="text-zinc-400 text-center">Localisation</TableHead>
                    <TableHead className="text-zinc-400">Appareil / Navigateur</TableHead>
                    <TableHead className="text-zinc-400">Date et Heure</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {MOCK_CONNECTIONS.map((conn, i) => (
                    <TableRow key={i} className="border-zinc-800 hover:bg-white/5 transition-colors">
                      <TableCell className="font-medium text-white">{conn.user}</TableCell>
                      <TableCell className="font-mono text-zinc-400 text-[10px]">{conn.ip}</TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline" className="text-[10px] gap-1 border-zinc-800 text-zinc-400">
                          <Globe className="w-2.5 h-2.5" /> {conn.location}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-zinc-400 text-xs">
                         <div className="flex items-center gap-2">
                           <Monitor className="w-3 h-3 text-zinc-600" />
                           {conn.device}
                         </div>
                      </TableCell>
                      <TableCell className="text-zinc-500 text-[11px]">{conn.time}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="permissions">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { role: 'Administrateur', desc: 'Accès complet au système, configuration du modèle et gestion des utilisateurs.', access: 'TOUS_MODULES', color: 'text-orange-400' },
              { role: 'Opérateur', desc: 'Peut gérer les sessions de production et vérifier manuellement les comptages.', access: 'MONITORING, QUALITE', color: 'text-blue-400' },
              { role: 'Lecteur', desc: 'Accès en lecture seule aux tableaux de bord et rapports.', access: 'DASHBOARD, RAPPORTS', color: 'text-zinc-400' },
            ].map((p, i) => (
              <Card key={i} className="p-6 bg-card/50 border-zinc-800 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className={`font-bold ${p.color}`}>{p.role}</h3>
                  <ShieldCheck className="w-5 h-5 opacity-20 text-white" />
                </div>
                <p className="text-xs text-zinc-400 leading-relaxed">{p.desc}</p>
                <div className="pt-2">
                  <div className="text-[10px] text-zinc-500 uppercase font-bold mb-2 tracking-widest">Accès Activés</div>
                  <div className="flex flex-wrap gap-2">
                    {p.access.split(', ').map((a, j) => (
                      <Badge key={j} variant="secondary" className="text-[9px] bg-zinc-900 border-zinc-800 text-zinc-400">{a}</Badge>
                    ))}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

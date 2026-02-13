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
  ShieldCheck,
  Clock,
  Lock,
  Globe,
  Monitor
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
  { id: 1, name: 'Admin Principal', email: 'admin@cement-factory.com', role: 'Admin', status: 'Active', initials: 'AP', lastActive: 'Now' },
  { id: 2, name: 'John Operator', email: 'john.d@cement-factory.com', role: 'Operator', status: 'Active', initials: 'JO', lastActive: '12m ago' },
  { id: 3, name: 'Sarah Viewer', email: 'sarah.l@cement-factory.com', role: 'Viewer', status: 'Inactive', initials: 'SV', lastActive: '2d ago' },
];

const MOCK_CONNECTIONS = [
  { user: 'Admin Principal', ip: '192.168.1.42', location: 'Internal Office', device: 'Chrome / Windows', time: 'Aug 27, 10:45 AM' },
  { user: 'John Operator', ip: '10.10.230.16', location: 'Control Room A', device: 'Edge / Ubuntu', time: 'Aug 27, 08:30 AM' },
  { user: ' Sarah Viewer', ip: '172.16.0.5', location: 'External VPN', device: 'Safari / macOS', time: 'Aug 25, 04:20 PM' },
];

export default function UserManagement() {
  const [users] = useState(MOCK_USERS);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">User Management</h1>
          <p className="text-muted-foreground">Manage system access, roles and monitor connection security</p>
        </div>
        <Button className="gap-2 bg-orange-600 hover:bg-orange-700 text-white">
          <UserPlus className="w-4 h-4" /> Add New User
        </Button>
      </div>

      <Tabs defaultValue="users" className="space-y-6">
        <TabsList className="bg-zinc-900 border border-zinc-800 p-1">
          <TabsTrigger value="users" className="gap-2">
            <Users className="w-4 h-4" /> System Users
          </TabsTrigger>
          <TabsTrigger value="activity" className="gap-2">
            <Clock className="w-4 h-4" /> Connection History
          </TabsTrigger>
          <TabsTrigger value="permissions" className="gap-2">
            <Shield className="w-4 h-4" /> Roles & Permissions
          </TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-6">
          <Card className="p-4 bg-card/50 border-zinc-800">
            <div className="flex gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input placeholder="Search users by name, email or role..." className="pl-10 bg-zinc-900 border-zinc-800 text-white" />
              </div>
              <Button variant="outline" className="gap-2 border-zinc-800 text-white">
                <Filter className="w-4 h-4" /> Filter
              </Button>
            </div>

            <div className="rounded-md border border-zinc-800">
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow className="border-zinc-800">
                    <TableHead className="text-zinc-400">User Profile</TableHead>
                    <TableHead className="text-zinc-400">System Role</TableHead>
                    <TableHead className="text-zinc-400">Account Status</TableHead>
                    <TableHead className="text-zinc-400">Last Activity</TableHead>
                    <TableHead className="text-right text-zinc-400">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id} className="hover:bg-muted/30 border-zinc-800">
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
                            user.role === 'Operator' ? 'border-blue-500/30 bg-blue-500/5 text-blue-400' :
                            'border-zinc-700 text-zinc-400'
                          }
                        >
                          {user.role}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${user.status === 'Active' ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]' : 'bg-zinc-600'}`} />
                          <span className={`text-xs ${user.status === 'Active' ? 'text-green-400' : 'text-zinc-500'}`}>{user.status}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-zinc-400 text-xs font-mono">
                        {user.lastActive}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-500 hover:text-white">
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-500 hover:text-red-400">
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
            <div className="rounded-md border border-zinc-800">
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow className="border-zinc-800">
                    <TableHead className="text-zinc-400">User</TableHead>
                    <TableHead className="text-zinc-400">IP Address</TableHead>
                    <TableHead className="text-zinc-400 text-center">Location</TableHead>
                    <TableHead className="text-zinc-400">Device / User Agent</TableHead>
                    <TableHead className="text-zinc-400">Timestamp</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {MOCK_CONNECTIONS.map((conn, i) => (
                    <TableRow key={i} className="border-zinc-800 hover:bg-white/5 transition-colors">
                      <TableCell className="font-medium text-white">{conn.user}</TableCell>
                      <TableCell className="font-mono text-zinc-400 text-xs">{conn.ip}</TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline" className="text-[10px] gap-1 border-zinc-800">
                          <Globe className="w-2 h-2" /> {conn.location}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-zinc-400 text-xs flex items-center gap-2">
                        <Monitor className="w-3 h-3 text-zinc-600" /> {conn.device}
                      </TableCell>
                      <TableCell className="text-zinc-500 text-xs">{conn.time}</TableCell>
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
              { role: 'Administrator', desc: 'Full system access, model configuration, and user management.', access: 'ALL_MODULES', color: 'text-orange-400' },
              { role: 'Operator', desc: 'Can manage production sessions and manually verify counts.', access: 'MONITORING, QUALITY', color: 'text-blue-400' },
              { role: 'Viewer', desc: 'Read-only access to dashboards and reports.', access: 'DASHBOARD, REPORTS', color: 'text-zinc-400' },
            ].map((p, i) => (
              <Card key={i} className="p-6 bg-card/50 border-zinc-800 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className={`font-bold ${p.color}`}>{p.role}</h3>
                  <ShieldCheck className="w-5 h-5 opacity-20" />
                </div>
                <p className="text-xs text-zinc-400 leading-relaxed">{p.desc}</p>
                <div className="pt-2">
                  <div className="text-[10px] text-zinc-500 uppercase font-bold mb-2">Enabled Access</div>
                  <div className="flex flex-wrap gap-2">
                    {p.access.split(', ').map((a, j) => (
                      <Badge key={j} variant="secondary" className="text-[9px] bg-zinc-900 border-zinc-800">{a}</Badge>
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

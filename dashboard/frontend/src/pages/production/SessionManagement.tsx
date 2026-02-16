import { useState, useEffect } from 'react';
import { API_URL } from '@/lib/api';
import { Package, Clock, Play, Square, History, BarChart2, Calendar, Search } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const MOCK_SESSIONS = [
  { id: 'S-20250827-01', start: '10:45', end: '-', duration: '02:15:22', count: 142, rate: '28.4 s/m', status: 'En cours' },
  { id: 'S-20250826-03', start: '14:30', end: '18:00', duration: '03:30:00', count: 4820, rate: '22.9 s/m', status: 'Terminé' },
  { id: 'S-20250826-02', start: '09:00', end: '13:00', duration: '04:00:00', count: 5120, rate: '21.3 s/m', status: 'Terminé' },
  { id: 'S-20250826-01', start: '06:00', end: '08:45', duration: '02:45:00', count: 3200, rate: '19.4 s/m', status: 'Terminé' },
];

export default function SessionManagement() {
  const [sessions, setSessions] = useState([]);
  const [activeSession, setActiveSession] = useState(null);

  const fetchSessions = () => {
    fetch(`${API_URL}/sessions/`)
      .then(res => res.json())
      .then(data => {
        setSessions(data);
        const active = data.find(s => s.status === 'active');
        setActiveSession(active);
      })
      .catch(err => console.error("Error fetching sessions:", err));
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  const startSession = () => {
    fetch(`${API_URL}/sessions/start`, { method: 'POST' })
      .then(res => res.json())
      .then(() => fetchSessions())
      .catch(err => console.error("Error starting session:", err));
  };

  const stopSession = (id) => {
    fetch(`${API_URL}/sessions/stop/${id}`, { method: 'POST' })
      .then(res => res.json())
      .then(() => fetchSessions())
      .catch(err => console.error("Error stopping session:", err));
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Gestion des Sessions</h1>
          <p className="text-muted-foreground">Gérez les équipes de production et surveillez la performance par session</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="gap-2 border-zinc-800 text-white hover:bg-zinc-900">
            <History className="w-4 h-4" /> Réinitialiser
          </Button>
          <Button
            className="gap-2 bg-green-600 hover:bg-green-700 text-white font-bold"
            disabled={!!activeSession}
            onClick={startSession}
          >
            <Play className="w-4 h-4 fill-current" /> Nouvelle Session
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {activeSession ? (
          <Card className="p-6 bg-orange-600 text-white space-y-4 border-none shadow-lg shadow-orange-900/20">
            <div className="flex justify-between items-start">
              <div className="p-2 bg-white/20 rounded-lg">
                <Play className="w-6 h-6 fill-current" />
              </div>
              <Badge className="bg-white/20 text-white border-none text-[10px] font-bold">SESSION ACTIVE</Badge>
            </div>
            <div>
              <div className="text-3xl font-bold font-mono">{activeSession.total_count} sacs</div>
              <p className="text-[11px] opacity-70 italic mt-1 text-orange-100">ID: {activeSession.id}</p>
            </div>
            <div className="pt-4 border-t border-white/20 flex justify-between items-center">
              <div className="text-xs font-mono font-bold tracking-wider">
                {new Date(activeSession.start_time).toLocaleTimeString()}
              </div>
              <Button
                size="sm"
                variant="secondary"
                className="h-7 text-[10px] bg-white text-orange-600 hover:bg-zinc-100 font-bold"
                onClick={() => stopSession(activeSession.id)}
              >
                <Square className="w-3 h-3 mr-1 fill-current" /> ARRÊTER
              </Button>
            </div>
          </Card>
        ) : (
          <Card className="p-6 bg-zinc-900 text-zinc-500 space-y-4 border-dashed border-zinc-800 flex flex-col items-center justify-center">
            <Square className="w-12 h-12 opacity-20" />
            <p className="text-sm font-bold uppercase tracking-widest">Aucune Session Active</p>
          </Card>
        )}

        <Card className="p-6 bg-card/50 border-zinc-800 space-y-4">
          <div className="flex items-center gap-2 text-zinc-500 font-bold uppercase text-[10px] tracking-widest">
            <Clock className="w-4 h-4 text-orange-500" /> Cadence Actuelle
          </div>
          <div className="text-3xl font-bold text-white font-mono">28.4 <span className="text-sm font-normal text-zinc-500">sacs / min</span></div>
          <div className="w-full bg-zinc-900 h-1.5 rounded-full overflow-hidden border border-zinc-800">
            <div className="h-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]" style={{ width: '85%' }} />
          </div>
          <p className="text-[10px] text-zinc-500 italic">Performance optimisée - Au-dessus de l'objectif (22 s/m)</p>
        </Card>

        <Card className="p-6 bg-card/50 border-zinc-800 space-y-4">
          <div className="flex items-center gap-2 text-zinc-500 font-bold uppercase text-[10px] tracking-widest">
            <BarChart2 className="w-4 h-4 text-orange-500" /> Total Équipe
          </div>
          <div className="text-3xl font-bold text-white font-mono">13 282 <span className="text-sm font-normal text-zinc-500">sacs aujourd'hui</span></div>
          <p className="text-[10px] text-green-400 font-medium">+15% par rapport à l'équipe d'hier matin</p>
        </Card>
      </div>

      <Card className="p-4 bg-card/50 border-zinc-800">
        <div className="flex justify-between items-center mb-6 px-2">
          <h3 className="font-bold text-white text-sm uppercase tracking-wider">Historique des Sessions Récentes</h3>
          <div className="flex gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500" />
              <Input placeholder="Rechercher une session..." className="h-8 pl-8 w-[200px] bg-zinc-900 border-zinc-800 text-xs text-white" />
            </div>
            <Button variant="outline" size="icon" className="h-8 w-8 border-zinc-800 text-zinc-400 hover:text-white"><Calendar className="w-3.5 h-3.5" /></Button>
          </div>
        </div>

        <div className="rounded-xl border border-zinc-800 overflow-hidden">
          <Table>
            <TableHeader className="bg-zinc-900/80">
              <TableRow className="border-zinc-800">
                <TableHead className="text-zinc-500 text-[11px] font-bold uppercase">ID Session</TableHead>
                <TableHead className="text-zinc-500 text-[11px] font-bold uppercase">Début</TableHead>
                <TableHead className="text-zinc-500 text-[11px] font-bold uppercase">Fin</TableHead>
                <TableHead className="text-zinc-500 text-[11px] font-bold uppercase">Durée</TableHead>
                <TableHead className="text-zinc-500 text-[11px] font-bold uppercase text-center">Sacs Comptés</TableHead>
                <TableHead className="text-zinc-500 text-[11px] font-bold uppercase text-center">Débit Moyen</TableHead>
                <TableHead className="text-zinc-500 text-[11px] font-bold uppercase text-right">Statut</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sessions.map((session) => (
                <TableRow key={session.id} className="border-zinc-800 hover:bg-zinc-800/30 transition-colors">
                  <TableCell className="font-mono font-bold text-white text-[11px]">{session.id}</TableCell>
                  <TableCell className="text-zinc-300 text-sm">{new Date(session.start_time).toLocaleTimeString()}</TableCell>
                  <TableCell className="text-zinc-500 text-sm">{session.end_time ? new Date(session.end_time).toLocaleTimeString() : '-'}</TableCell>
                  <TableCell className="text-zinc-400 text-xs font-mono">-</TableCell>
                  <TableCell className="text-center font-mono font-bold text-orange-400">{(session.total_count + session.rejected_count).toLocaleString()}</TableCell>
                  <TableCell className="text-center text-zinc-400 text-xs italic">-</TableCell>
                  <TableCell className="text-right">
                    <Badge
                      variant={session.status === 'active' ? 'default' : 'outline'}
                      className={session.status === 'active' ? 'bg-green-600/20 text-green-400 border-green-500/30 hover:bg-green-600/30' : 'border-zinc-800 text-zinc-500'}
                    >
                      <span className="text-[9px] font-bold uppercase tracking-widest">{session.status === 'active' ? 'En cours' : 'Terminé'}</span>
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}

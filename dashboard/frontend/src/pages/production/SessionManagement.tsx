import { useState, useEffect, useMemo } from 'react';
import { API_URL } from '@/lib/api';
import { Clock, Play, Square, History, BarChart2, Calendar, Search } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface SessionItem {
  id: string;
  start_time: string;
  end_time: string | null;
  total_count: number;
  rejected_count: number;
  status: 'active' | 'completed';
}

interface SessionResponse {
  items: SessionItem[];
  total: number;
}

export default function SessionManagement() {
  const [sessions, setSessions] = useState<SessionItem[]>([]);
  const [activeSession, setActiveSession] = useState<SessionItem | null>(null);
  const [search, setSearch] = useState('');

  const fetchSessions = () => {
    fetch(`${API_URL}/sessions/?page=1&page_size=50`)
      .then(res => res.json())
      .then((data: SessionResponse) => {
        const items = data.items || [];
        setSessions(items);
        const active = items.find(s => s.status === 'active') || null;
        setActiveSession(active);
      })
      .catch(err => console.error('Error fetching sessions:', err));
  };

  useEffect(() => {
    fetchSessions();
    const timer = setInterval(fetchSessions, 4000);
    return () => clearInterval(timer);
  }, []);

  const startSession = () => {
    fetch(`${API_URL}/sessions/start`, { method: 'POST' })
      .then(res => res.json())
      .then(() => fetchSessions())
      .catch(err => console.error('Error starting session:', err));
  };

  const stopSession = (id: string) => {
    fetch(`${API_URL}/sessions/stop/${id}`, { method: 'POST' })
      .then(res => res.json())
      .then(() => fetchSessions())
      .catch(err => console.error('Error stopping session:', err));
  };

  const filteredSessions = useMemo(
    () => sessions.filter((s) => s.id.toLowerCase().includes(search.toLowerCase())),
    [sessions, search],
  );

  const activeRate = useMemo(() => {
    if (!activeSession) return 0;
    const elapsedMin = Math.max(1, (Date.now() - new Date(activeSession.start_time).getTime()) / 60000);
    return (((activeSession.total_count + activeSession.rejected_count) / elapsedMin)).toFixed(1);
  }, [activeSession]);

  const todayTotal = useMemo(
    () => sessions.reduce((acc, s) => acc + s.total_count + s.rejected_count, 0),
    [sessions],
  );

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Gestion des Sessions</h1>
          <p className="text-muted-foreground">Gérez les équipes de production et surveillez la performance par session</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="gap-2 border-zinc-800 text-white hover:bg-zinc-900" onClick={fetchSessions}>
            <History className="w-4 h-4" /> Réactualiser
          </Button>
          <Button className="gap-2 bg-green-600 hover:bg-green-700 text-white font-bold" disabled={!!activeSession} onClick={startSession}>
            <Play className="w-4 h-4 fill-current" /> Nouvelle Session
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {activeSession ? (
          <Card className="p-6 bg-orange-600 text-white space-y-4 border-none shadow-lg shadow-orange-900/20">
            <div className="flex justify-between items-start">
              <div className="p-2 bg-white/20 rounded-lg"><Play className="w-6 h-6 fill-current" /></div>
              <Badge className="bg-white/20 text-white border-none text-[10px] font-bold">SESSION ACTIVE</Badge>
            </div>
            <div>
              <div className="text-3xl font-bold font-mono">{activeSession.total_count} sacs</div>
              <p className="text-[11px] opacity-70 italic mt-1 text-orange-100">ID: {activeSession.id}</p>
            </div>
            <div className="pt-4 border-t border-white/20 flex justify-between items-center">
              <div className="text-xs font-mono font-bold tracking-wider">{new Date(activeSession.start_time).toLocaleTimeString()}</div>
              <Button size="sm" variant="secondary" className="h-7 text-[10px] bg-white text-orange-600 hover:bg-zinc-100 font-bold" onClick={() => stopSession(activeSession.id)}>
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
          <div className="flex items-center gap-2 text-zinc-500 font-bold uppercase text-[10px] tracking-widest"><Clock className="w-4 h-4 text-orange-500" /> Cadence Actuelle</div>
          <div className="text-3xl font-bold text-white font-mono">{activeRate} <span className="text-sm font-normal text-zinc-500">sacs / min</span></div>
          <div className="w-full bg-zinc-900 h-1.5 rounded-full overflow-hidden border border-zinc-800"><div className="h-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]" style={{ width: `${Math.min(100, Number(activeRate) * 4)}%` }} /></div>
          <p className="text-[10px] text-zinc-500 italic">Performance en temps réel depuis la session active</p>
        </Card>

        <Card className="p-6 bg-card/50 border-zinc-800 space-y-4">
          <div className="flex items-center gap-2 text-zinc-500 font-bold uppercase text-[10px] tracking-widest"><BarChart2 className="w-4 h-4 text-orange-500" /> Total Équipe</div>
          <div className="text-3xl font-bold text-white font-mono">{todayTotal.toLocaleString()} <span className="text-sm font-normal text-zinc-500">sacs</span></div>
          <p className="text-[10px] text-green-400 font-medium">Données réelles agrégées des sessions</p>
        </Card>
      </div>

      <Card className="p-4 bg-card/50 border-zinc-800">
        <div className="flex justify-between items-center mb-6 px-2">
          <h3 className="font-bold text-white text-sm uppercase tracking-wider">Historique des Sessions Récentes</h3>
          <div className="flex gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500" />
              <Input placeholder="Rechercher une session..." value={search} onChange={(e) => setSearch(e.target.value)} className="h-8 pl-8 w-[200px] bg-zinc-900 border-zinc-800 text-xs text-white" />
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
              {filteredSessions.map((session) => {
                const start = new Date(session.start_time).getTime();
                const end = session.end_time ? new Date(session.end_time).getTime() : Date.now();
                const diffSec = Math.max(0, Math.floor((end - start) / 1000));
                const rate = ((session.total_count + session.rejected_count) / Math.max(1, diffSec / 60)).toFixed(1);
                const hh = String(Math.floor(diffSec / 3600)).padStart(2, '0');
                const mm = String(Math.floor((diffSec % 3600) / 60)).padStart(2, '0');
                const ss = String(diffSec % 60).padStart(2, '0');

                return (
                  <TableRow key={session.id} className="border-zinc-800 hover:bg-zinc-800/30 transition-colors">
                    <TableCell className="font-mono font-bold text-white text-[11px]">{session.id}</TableCell>
                    <TableCell className="text-zinc-300 text-sm">{new Date(session.start_time).toLocaleTimeString()}</TableCell>
                    <TableCell className="text-zinc-500 text-sm">{session.end_time ? new Date(session.end_time).toLocaleTimeString() : '-'}</TableCell>
                    <TableCell className="text-zinc-400 text-xs font-mono">{`${hh}:${mm}:${ss}`}</TableCell>
                    <TableCell className="text-center font-mono font-bold text-orange-400">{(session.total_count + session.rejected_count).toLocaleString()}</TableCell>
                    <TableCell className="text-center text-zinc-400 text-xs italic">{rate} s/m</TableCell>
                    <TableCell className="text-right">
                      <Badge variant={session.status === 'active' ? 'default' : 'outline'} className={session.status === 'active' ? 'bg-green-600/20 text-green-400 border-green-500/30 hover:bg-green-600/30' : 'border-zinc-800 text-zinc-500'}>
                        <span className="text-[9px] font-bold uppercase tracking-widest">{session.status === 'active' ? 'En cours' : 'Terminé'}</span>
                      </Badge>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}

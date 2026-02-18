import { useCallback, useEffect, useMemo, useState } from 'react';
import { fetchApi } from '@/lib/api';
import { Clock, Play, Square, History, BarChart2, Calendar, Search, Loader2, AlertTriangle } from 'lucide-react';
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

interface SessionListResponse {
  items: SessionItem[];
  total: number;
  active_session_id: string | null;
}

function formatDuration(start: string, end: string | null) {
  const s = new Date(start).getTime();
  const e = end ? new Date(end).getTime() : Date.now();
  const diff = Math.max(0, Math.floor((e - s) / 1000));
  const hh = String(Math.floor(diff / 3600)).padStart(2, '0');
  const mm = String(Math.floor((diff % 3600) / 60)).padStart(2, '0');
  const ss = String(diff % 60).padStart(2, '0');
  return `${hh}:${mm}:${ss}`;
}

export default function SessionManagement() {
  const [sessions, setSessions] = useState<SessionItem[]>([]);
  const [activeSession, setActiveSession] = useState<SessionItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<'start' | 'stop' | null>(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const loadSessions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetchApi(`/sessions/?page=${page}&page_size=${pageSize}`) as SessionListResponse;
      setSessions(response.items);
      setTotal(response.total);
      const active = response.items.find((s) => s.status === 'active') || null;
      setActiveSession(active);
    } catch (err) {
      console.error('Error fetching sessions:', err);
      setError('Impossible de charger les sessions.');
    } finally {
      setLoading(false);
    }
  }, [page, pageSize]);

  useEffect(() => {
    loadSessions();
    const timer = setInterval(loadSessions, 4000);
    return () => clearInterval(timer);
  }, [loadSessions]);

  const startSession = async () => {
    try {
      setActionLoading('start');
      await fetchApi('/sessions/start', { method: 'POST' });
      await loadSessions();
    } catch (err) {
      console.error('Error starting session:', err);
      setError('Échec du démarrage de session.');
    } finally {
      setActionLoading(null);
    }
  };

  const stopSession = async (id: string) => {
    try {
      setActionLoading('stop');
      await fetchApi(`/sessions/stop/${id}`, { method: 'POST' });
      await loadSessions();
    } catch (err) {
      console.error('Error stopping session:', err);
      setError('Échec de l’arrêt de session.');
    } finally {
      setActionLoading(null);
    }
  };

  const filteredSessions = useMemo(
    () => sessions.filter((s) => s.id.toLowerCase().includes(search.toLowerCase())),
    [sessions, search],
  );

  const activeRate = useMemo(() => {
    if (!activeSession) return 0;
    const minutes = Math.max(1, (Date.now() - new Date(activeSession.start_time).getTime()) / 60000);
    const bags = activeSession.total_count + activeSession.rejected_count;
    return Number((bags / minutes).toFixed(1));
  }, [activeSession]);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Gestion des Sessions</h1>
          <p className="text-muted-foreground">Démarrez/arrêtez la production et suivez les stats en direct.</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="gap-2 border-zinc-800 text-white hover:bg-zinc-900" onClick={loadSessions}>
            <History className="w-4 h-4" /> Rafraîchir
          </Button>
          <Button className="gap-2 bg-green-600 hover:bg-green-700 text-white font-bold" disabled={!!activeSession || actionLoading !== null} onClick={startSession}>
            {actionLoading === 'start' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4 fill-current" />} Nouvelle Session
          </Button>
        </div>
      </div>

      {error && (
        <Card className="p-4 border-red-500/30 bg-red-500/10 text-red-300 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4" /> {error}
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {activeSession ? (
          <Card className="p-6 bg-orange-600 text-white space-y-4 border-none shadow-lg shadow-orange-900/20">
            <div className="flex justify-between items-start">
              <div className="p-2 bg-white/20 rounded-lg"><Play className="w-6 h-6 fill-current" /></div>
              <Badge className="bg-white/20 text-white border-none text-[10px] font-bold">SESSION ACTIVE</Badge>
            </div>
            <div>
              <div className="text-3xl font-bold font-mono">{activeSession.total_count} sacs conformes</div>
              <p className="text-[11px] opacity-70 italic mt-1 text-orange-100">ID: {activeSession.id}</p>
              <p className="text-[11px] opacity-80 mt-1">Rejetés: {activeSession.rejected_count}</p>
            </div>
            <div className="pt-4 border-t border-white/20 flex justify-between items-center">
              <div className="text-xs font-mono font-bold tracking-wider">{formatDuration(activeSession.start_time, null)}</div>
              <Button size="sm" variant="secondary" className="h-7 text-[10px] bg-white text-orange-600 hover:bg-zinc-100 font-bold" onClick={() => stopSession(activeSession.id)} disabled={actionLoading !== null}>
                {actionLoading === 'stop' ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Square className="w-3 h-3 mr-1 fill-current" />} ARRÊTER
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
          <div className="flex items-center gap-2 text-zinc-500 font-bold uppercase text-[10px] tracking-widest"><Clock className="w-4 h-4 text-orange-500" /> Cadence Active</div>
          <div className="text-3xl font-bold text-white font-mono">{activeRate} <span className="text-sm font-normal text-zinc-500">sacs / min</span></div>
          <p className="text-[10px] text-zinc-500 italic">Calculé depuis la session en cours.</p>
        </Card>

        <Card className="p-6 bg-card/50 border-zinc-800 space-y-4">
          <div className="flex items-center gap-2 text-zinc-500 font-bold uppercase text-[10px] tracking-widest"><BarChart2 className="w-4 h-4 text-orange-500" /> Total Sessions</div>
          <div className="text-3xl font-bold text-white font-mono">{total.toLocaleString()}</div>
          <p className="text-[10px] text-zinc-400">Sessions enregistrées en base.</p>
        </Card>
      </div>

      <Card className="p-4 bg-card/50 border-zinc-800">
        <div className="flex justify-between items-center mb-6 px-2">
          <h3 className="font-bold text-white text-sm uppercase tracking-wider">Historique des Sessions</h3>
          <div className="flex gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500" />
              <Input placeholder="Rechercher une session..." value={search} onChange={(e) => setSearch(e.target.value)} className="h-8 pl-8 w-[220px] bg-zinc-900 border-zinc-800 text-xs text-white" />
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
                <TableHead className="text-zinc-500 text-[11px] font-bold uppercase text-center">Conformes</TableHead>
                <TableHead className="text-zinc-500 text-[11px] font-bold uppercase text-center">Rejetés</TableHead>
                <TableHead className="text-zinc-500 text-[11px] font-bold uppercase text-right">Statut</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={7} className="text-center text-zinc-500 py-6">Chargement...</TableCell></TableRow>
              ) : filteredSessions.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="text-center text-zinc-500 py-6">Aucune session trouvée.</TableCell></TableRow>
              ) : (
                filteredSessions.map((session) => (
                  <TableRow key={session.id} className="border-zinc-800 hover:bg-zinc-800/30 transition-colors">
                    <TableCell className="font-mono font-bold text-white text-[11px]">{session.id}</TableCell>
                    <TableCell className="text-zinc-300 text-sm">{new Date(session.start_time).toLocaleString()}</TableCell>
                    <TableCell className="text-zinc-500 text-sm">{session.end_time ? new Date(session.end_time).toLocaleString() : '-'}</TableCell>
                    <TableCell className="text-zinc-400 text-xs font-mono">{formatDuration(session.start_time, session.end_time)}</TableCell>
                    <TableCell className="text-center font-mono font-bold text-green-400">{session.total_count}</TableCell>
                    <TableCell className="text-center font-mono font-bold text-red-400">{session.rejected_count}</TableCell>
                    <TableCell className="text-right">
                      <Badge variant={session.status === 'active' ? 'default' : 'outline'} className={session.status === 'active' ? 'bg-green-600/20 text-green-400 border-green-500/30 hover:bg-green-600/30' : 'border-zinc-800 text-zinc-500'}>
                        <span className="text-[9px] font-bold uppercase tracking-widest">{session.status === 'active' ? 'En cours' : 'Terminé'}</span>
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        <div className="flex items-center justify-between mt-4">
          <p className="text-xs text-muted-foreground">Affichage de {filteredSessions.length} sur {total} sessions.</p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page === 1} className="border-zinc-800 text-zinc-500" onClick={() => setPage((p) => Math.max(1, p - 1))}>Précédent</Button>
            <Button variant="outline" size="sm" disabled={page * pageSize >= total} className="border-zinc-800 text-white" onClick={() => setPage((p) => p + 1)}>Suivant</Button>
          </div>
        </div>
      </Card>
    </div>
  );
}

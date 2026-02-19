import { useCallback, useEffect, useMemo, useState } from 'react';
import { fetchApi } from '@/lib/api';
import { Clock, Play, Square, History, BarChart2, Calendar, Search, Loader2, AlertTriangle, Trash2 } from 'lucide-react';
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
interface SessionListResponse { items: SessionItem[]; total: number; active_session_id: string | null; }

function formatDuration(start: string, end: string | null) {
  const s = new Date(start).getTime();
  const e = end ? new Date(end).getTime() : Date.now();
  const diff = Math.max(0, Math.floor((e - s) / 1000));
  return `${String(Math.floor(diff / 3600)).padStart(2, '0')}:${String(Math.floor((diff % 3600) / 60)).padStart(2, '0')}:${String(diff % 60).padStart(2, '0')}`;
}

export default function SessionManagement() {
  const [sessions, setSessions] = useState<SessionItem[]>([]);
  const [activeSession, setActiveSession] = useState<SessionItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<'start' | 'stop' | 'delete' | null>(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<string[]>([]);

  const loadSessions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetchApi(`/sessions/?page=${page}&page_size=${pageSize}`) as SessionListResponse;
      setSessions(response.items);
      setTotal(response.total);
      setActiveSession(response.items.find((s) => s.status === 'active') || null);
      setSelected((prev) => prev.filter((id) => response.items.some((s) => s.id === id)));
    } catch (err) {
      console.error(err);
      setError('Impossible de charger les sessions.');
    } finally { setLoading(false); }
  }, [page, pageSize]);

  useEffect(() => { loadSessions(); const t = setInterval(loadSessions, 4000); return () => clearInterval(t); }, [loadSessions]);

  const startSession = async () => { try { setActionLoading('start'); await fetchApi('/sessions/start', { method: 'POST' }); await loadSessions(); } catch { setError('Échec du démarrage de session.'); } finally { setActionLoading(null); } };
  const stopSession = async (id: string) => { try { setActionLoading('stop'); await fetchApi(`/sessions/stop/${id}`, { method: 'POST' }); await loadSessions(); } catch { setError('Échec de l’arrêt de session.'); } finally { setActionLoading(null); } };

  const deleteOne = async (id: string) => {
    try {
      setActionLoading('delete');
      await fetchApi(`/api/sessions/${id}`, { method: 'DELETE' });
      await loadSessions();
    } catch { setError('Suppression impossible (session active ?).'); }
    finally { setActionLoading(null); }
  };

  const deleteBatch = async () => {
    if (selected.length === 0) return;
    try {
      setActionLoading('delete');
      await fetchApi('/api/sessions/batch', { method: 'DELETE', body: JSON.stringify({ session_ids: selected }) });
      setSelected([]);
      await loadSessions();
    } catch { setError('Suppression multiple impossible (session active ?).'); }
    finally { setActionLoading(null); }
  };

  const filtered = useMemo(() => sessions.filter((s) => s.id.toLowerCase().includes(search.toLowerCase())), [sessions, search]);
  const activeRate = useMemo(() => activeSession ? Number((((activeSession.total_count + activeSession.rejected_count) / Math.max(1, (Date.now() - new Date(activeSession.start_time).getTime()) / 60000))).toFixed(1)) : 0, [activeSession]);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold tracking-tight text-white">Gestion des Sessions</h1><p className="text-muted-foreground">Démarrez/arrêtez la production et gérez l’historique.</p></div>
        <div className="flex gap-3">
          <Button variant="outline" className="gap-2 border-zinc-800 text-white hover:bg-zinc-900" onClick={loadSessions}><History className="w-4 h-4" /> Rafraîchir</Button>
          <Button variant="outline" className="gap-2 border-red-900 text-red-300 hover:bg-red-950/30" onClick={deleteBatch} disabled={selected.length === 0 || actionLoading !== null}><Trash2 className="w-4 h-4" /> Supprimer sélection ({selected.length})</Button>
          <Button className="gap-2 bg-green-600 hover:bg-green-700 text-white font-bold" disabled={!!activeSession || actionLoading !== null} onClick={startSession}>{actionLoading === 'start' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4 fill-current" />} Nouvelle Session</Button>
        </div>
      </div>

      {error && <Card className="p-4 border-red-500/30 bg-red-500/10 text-red-300 flex items-center gap-2"><AlertTriangle className="w-4 h-4" /> {error}</Card>}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {activeSession ? <Card className="p-6 bg-orange-600 text-white space-y-4 border-none"><div className="text-3xl font-bold font-mono">{activeSession.total_count} conformes</div><p className="text-xs">Rejetés: {activeSession.rejected_count}</p><Button size="sm" variant="secondary" onClick={() => stopSession(activeSession.id)}><Square className="w-3 h-3 mr-1 fill-current" /> ARRÊTER</Button></Card> : <Card className="p-6 bg-zinc-900 text-zinc-500">Aucune Session Active</Card>}
        <Card className="p-6 bg-card/50 border-zinc-800"><div className="flex items-center gap-2 text-zinc-500 text-[10px] uppercase"><Clock className="w-4 h-4 text-orange-500" /> Cadence Active</div><div className="text-3xl font-bold text-white font-mono">{activeRate} <span className="text-sm text-zinc-500">sacs/min</span></div></Card>
        <Card className="p-6 bg-card/50 border-zinc-800"><div className="flex items-center gap-2 text-zinc-500 text-[10px] uppercase"><BarChart2 className="w-4 h-4 text-orange-500" /> Total Sessions</div><div className="text-3xl font-bold text-white font-mono">{total}</div></Card>
      </div>

      <Card className="p-4 bg-card/50 border-zinc-800">
        <div className="flex justify-between items-center mb-6 px-2">
          <h3 className="font-bold text-white text-sm uppercase tracking-wider">Historique</h3>
          <div className="relative"><Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500" /><Input placeholder="Rechercher..." value={search} onChange={(e) => setSearch(e.target.value)} className="h-8 pl-8 w-[220px] bg-zinc-900 border-zinc-800 text-xs text-white" /></div>
        </div>
        <div className="rounded-xl border border-zinc-800 overflow-hidden">
          <Table>
            <TableHeader className="bg-zinc-900/80"><TableRow className="border-zinc-800"><TableHead className="w-[40px]" /><TableHead>ID</TableHead><TableHead>Début</TableHead><TableHead>Fin</TableHead><TableHead>Durée</TableHead><TableHead className="text-center">Conformes</TableHead><TableHead className="text-center">Rejetés</TableHead><TableHead className="text-right">Statut</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
            <TableBody>
              {loading ? <TableRow><TableCell colSpan={9} className="text-center text-zinc-500 py-6">Chargement...</TableCell></TableRow> : filtered.map((s) => (
                <TableRow key={s.id} className="border-zinc-800 hover:bg-zinc-800/30">
                  <TableCell><input type="checkbox" checked={selected.includes(s.id)} disabled={s.status === 'active'} onChange={(e) => setSelected((prev) => e.target.checked ? [...prev, s.id] : prev.filter((x) => x !== s.id))} /></TableCell>
                  <TableCell className="font-mono text-[11px] text-white">{s.id}</TableCell>
                  <TableCell className="text-xs text-zinc-300">{new Date(s.start_time).toLocaleString()}</TableCell>
                  <TableCell className="text-xs text-zinc-500">{s.end_time ? new Date(s.end_time).toLocaleString() : '-'}</TableCell>
                  <TableCell className="text-xs text-zinc-400 font-mono">{formatDuration(s.start_time, s.end_time)}</TableCell>
                  <TableCell className="text-center text-green-400 font-mono">{s.total_count}</TableCell>
                  <TableCell className="text-center text-red-400 font-mono">{s.rejected_count}</TableCell>
                  <TableCell className="text-right"><Badge variant={s.status === 'active' ? 'default' : 'outline'}>{s.status}</Badge></TableCell>
                  <TableCell className="text-right"><Button size="sm" variant="outline" disabled={s.status === 'active' || actionLoading !== null} onClick={() => deleteOne(s.id)}>Supprimer</Button></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <div className="flex justify-between mt-4"><Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>Précédent</Button><Button variant="outline" size="sm" disabled={page * pageSize >= total} onClick={() => setPage((p) => p + 1)}>Suivant</Button></div>
      </Card>
    </div>
  );
}

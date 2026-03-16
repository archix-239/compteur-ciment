import { useCallback, useEffect, useMemo, useState } from 'react';
import { Search, Filter, Download, CheckCircle2, XCircle, Clock, Eye, FileSpreadsheet, Loader2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { fetchApi, API_URL } from '@/lib/api';

interface LogItem {
  id: number;
  session_id: string;
  timestamp: string;
  status: 'conforme' | 'rejete';
  identifier: string;
  detection_score: number;
  logo_score: number;
  color_score: number;
  interval: number;
  capture_url: string | null;
}

interface DetectionLogListResponse {
  items: LogItem[];
  total: number;
  page: number;
  page_size: number;
}

export default function ProductionLog() {
  const [logs, setLogs] = useState<LogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'conforme' | 'rejete'>('all');

  const loadLogs = useCallback(async () => {
    try {
      setLoading(true);
      const query = new URLSearchParams({
        page: String(page),
        page_size: String(pageSize),
      });
      if (search.trim()) query.set('search', search.trim());
      if (statusFilter !== 'all') query.set('status', statusFilter);

      const response = await fetchApi(`/api/logs/?${query.toString()}`) as DetectionLogListResponse;
      setLogs(response.items);
      setTotal(response.total);
    } catch (err) {
      console.error('Error fetching logs:', err);
      setLogs([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, search, statusFilter]);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  const mapped = useMemo(() => logs.map((log) => ({
    ...log,
    uiId: `B-${log.id}`,
    uiStatus: log.status === 'conforme' ? 'Vérifié' : 'Rejeté',
  })), [logs]);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Journal de Production</h1>
          <p className="text-muted-foreground">Historique détaillé des sacs détectés, filtrable par statut et identifiant.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2 border-zinc-800 text-white" disabled>
            <FileSpreadsheet className="w-4 h-4" /> Export CSV
          </Button>
          <Button variant="outline" className="gap-2 border-zinc-800 text-white" disabled>
            <Download className="w-4 h-4" /> Export Excel
          </Button>
        </div>
      </div>

      <Card className="p-4 bg-card/50 border-zinc-800">
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher par UUID / identifiant..."
              className="pl-10 bg-zinc-900 border-zinc-800 text-white"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            />
          </div>
          <div className="flex gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-2 border-zinc-800 text-white">
                  <Filter className="w-4 h-4" /> Statut
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="bg-zinc-900 border-zinc-800 text-white">
                <DropdownMenuItem className="hover:bg-zinc-800 cursor-pointer" onClick={() => { setStatusFilter('all'); setPage(1); }}>Tous les statuts</DropdownMenuItem>
                <DropdownMenuItem className="hover:bg-zinc-800 cursor-pointer" onClick={() => { setStatusFilter('conforme'); setPage(1); }}>Vérifiés uniquement</DropdownMenuItem>
                <DropdownMenuItem className="hover:bg-zinc-800 cursor-pointer" onClick={() => { setStatusFilter('rejete'); setPage(1); }}>Rejetés uniquement</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button variant="outline" className="border-zinc-800 text-white" onClick={loadLogs}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Actualiser'}
            </Button>
          </div>
        </div>

        <div className="rounded-md border border-border/50 overflow-hidden">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow className="border-zinc-800">
                <TableHead className="w-[100px] text-zinc-400">ID Sac</TableHead>
                <TableHead className="text-zinc-400">Horodatage</TableHead>
                <TableHead className="text-zinc-400">Session</TableHead>
                <TableHead className="text-zinc-400">UUID QR Code</TableHead>
                <TableHead className="text-center text-zinc-400">Détection</TableHead>
                <TableHead className="text-center text-zinc-400">Logo</TableHead>
                <TableHead className="text-center text-zinc-400">Couleur</TableHead>
                <TableHead className="text-zinc-400">Statut</TableHead>
                <TableHead className="text-zinc-400">Intervalle</TableHead>
                <TableHead className="text-right text-zinc-400">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={10} className="py-8 text-center text-zinc-500">Chargement...</TableCell></TableRow>
              ) : mapped.length === 0 ? (
                <TableRow><TableCell colSpan={10} className="py-8 text-center text-zinc-500">Aucune détection trouvée.</TableCell></TableRow>
              ) : (
                mapped.map((log) => (
                  <TableRow key={log.id} className="hover:bg-muted/30 transition-colors border-zinc-800">
                    <TableCell className="font-mono font-bold text-orange-400">{log.uiId}</TableCell>
                    <TableCell className="text-zinc-300">{new Date(log.timestamp).toLocaleString('fr-FR')}</TableCell>
                    <TableCell className="text-zinc-400 text-xs font-mono">{log.session_id}</TableCell>
                    <TableCell className="font-mono text-xs text-zinc-500">{log.identifier}</TableCell>
                    <TableCell className="text-center">
                      <div className="flex flex-col items-center gap-1">
                        <span className="text-[10px] text-zinc-400">{log.detection_score.toFixed(2)}</span>
                        <div className="w-12 h-1 bg-muted rounded-full overflow-hidden"><div className="h-full bg-blue-500" style={{ width: `${Math.min(100, log.detection_score * 100)}%` }} /></div>
                      </div>
                    </TableCell>
                    <TableCell className="text-center"><span className={`text-xs ${log.logo_score > 0.8 ? 'text-green-400' : 'text-yellow-400'}`}>{log.logo_score.toFixed(2)}</span></TableCell>
                    <TableCell className="text-center"><span className={`text-xs ${log.color_score > 0.8 ? 'text-green-400' : 'text-yellow-400'}`}>{log.color_score.toFixed(2)}</span></TableCell>
                    <TableCell>
                      <Badge variant={log.status === 'conforme' ? 'default' : 'destructive'} className="gap-1 px-2 text-[10px]">
                        {log.status === 'conforme' ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                        {log.uiStatus.toUpperCase()}
                      </Badge>
                    </TableCell>
                    <TableCell><div className="flex items-center gap-1 text-zinc-400 text-xs"><Clock className="w-3 h-3 text-zinc-600" />{log.interval.toFixed(1)}s</div></TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-500 hover:text-white" title="Voir Capture" disabled={!log.capture_url} onClick={() => log.capture_url && window.open(`${API_URL}${log.capture_url}`, '_blank')}>
                        <Eye className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        <div className="flex items-center justify-between mt-4">
          <p className="text-xs text-muted-foreground">
            {total === 0
              ? 'Aucune entrée.'
              : `Affichage de ${(page - 1) * pageSize + 1}–${(page - 1) * pageSize + mapped.length} sur ${total} entrées.`}
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page === 1} className="border-zinc-800 text-zinc-500" onClick={() => setPage((p) => Math.max(1, p - 1))}>Précédent</Button>
            <Button variant="outline" size="sm" disabled={page * pageSize >= total} className="border-zinc-800 text-white" onClick={() => setPage((p) => p + 1)}>Suivant</Button>
          </div>
        </div>
      </Card>
    </div>
  );
}

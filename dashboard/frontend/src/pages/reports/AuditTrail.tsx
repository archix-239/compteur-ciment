import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  History, User, Clock, Database, Search, RefreshCw,
  LogIn, LogOut, UserPlus, UserMinus, Settings, Key, AlertTriangle, Loader2,
  ChevronLeft, ChevronRight, Download,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { API_URL, getToken } from '@/lib/api';

// ── Types ──────────────────────────────────────────────────────────────────────

interface AuditEntry {
  id: number;
  username: string;
  timestamp: string;
  action: string;
  ip_address: string | null;
  user_agent: string | null;
}

interface AuditResponse {
  total: number;
  page: number;
  page_size: number;
  items: AuditEntry[];
}

// ── Helpers ────────────────────────────────────────────────────────────────────

const ACTION_META: Record<string, { label: string; color: string; Icon: any }> = {
  login:            { label: 'Connexion',         color: 'text-green-400 bg-green-500/10 border-green-500/20',  Icon: LogIn },
  failed_login:     { label: 'Échec connexion',   color: 'text-red-400 bg-red-500/10 border-red-500/20',       Icon: AlertTriangle },
  logout:           { label: 'Déconnexion',        color: 'text-zinc-400 bg-zinc-800/50 border-zinc-700/30',    Icon: LogOut },
  created:          { label: 'Créé',               color: 'text-blue-400 bg-blue-500/10 border-blue-500/20',    Icon: UserPlus },
  updated:          { label: 'Modifié',            color: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20', Icon: Settings },
  deleted:          { label: 'Supprimé',           color: 'text-red-400 bg-red-500/10 border-red-500/20',       Icon: UserMinus },
  password_changed: { label: 'Mot de passe',       color: 'text-orange-400 bg-orange-500/10 border-orange-500/20', Icon: Key },
};

function ActionBadge({ action }: { action: string }) {
  const meta = ACTION_META[action] ?? { label: action, color: 'text-zinc-400 bg-zinc-800 border-zinc-700', Icon: History };
  const { label, color, Icon } = meta;
  return (
    <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full border ${color}`}>
      <Icon className="w-3 h-3" />
      {label}
    </span>
  );
}

function formatTs(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
}

function parseUA(ua: string | null): string {
  if (!ua) return '—';
  if (ua.includes('Firefox')) return 'Firefox';
  if (ua.includes('Chrome')) return 'Chrome';
  if (ua.includes('Safari')) return 'Safari';
  if (ua.includes('Edge')) return 'Edge';
  return ua.slice(0, 30);
}

const PAGE_SIZE = 20;

// ── Component ──────────────────────────────────────────────────────────────────

export default function AuditTrail() {
  const [data, setData]       = useState<AuditResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage]       = useState(1);
  const [search, setSearch]   = useState('');
  const [actionFilter, setActionFilter] = useState('all');

  const load = useCallback(async (p: number, uname: string, action: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(p),
        page_size: String(PAGE_SIZE),
      });
      if (uname.trim()) params.set('username', uname.trim());
      if (action !== 'all') params.set('action', action);
      const res = await fetch(`${API_URL}/api/audit/?${params}`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (res.ok) setData(await res.json());
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(page, search, actionFilter); }, [load, page, search, actionFilter]);

  const handleSearch = (v: string) => { setSearch(v); setPage(1); };
  const handleAction = (v: string) => { setActionFilter(v); setPage(1); };

  const totalPages = data ? Math.ceil(data.total / PAGE_SIZE) : 1;

  // Stats (computed from full data on current filter — or just display totals from API)
  const stats = useMemo(() => {
    if (!data) return null;
    const items = data.items;
    const logins = items.filter(i => i.action === 'login').length;
    const failures = items.filter(i => i.action === 'failed_login').length;
    const uniqueUsers = new Set(items.map(i => i.username)).size;
    return { total: data.total, logins, failures, uniqueUsers };
  }, [data]);

  // CSV export (current filter, all pages)
  const exportCsv = async () => {
    const params = new URLSearchParams({ page: '1', page_size: '1000' });
    if (search.trim()) params.set('username', search.trim());
    if (actionFilter !== 'all') params.set('action', actionFilter);
    const res = await fetch(`${API_URL}/api/audit/?${params}`, {
      headers: { Authorization: `Bearer ${getToken()}` },
    });
    if (!res.ok) return;
    const d: AuditResponse = await res.json();
    const header = ['ID', 'Utilisateur', 'Action', 'Horodatage', 'IP', 'Navigateur'];
    const rows = d.items.map(i => [i.id, i.username, i.action, i.timestamp, i.ip_address ?? '', parseUA(i.user_agent)]);
    const csv = [header, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url;
    a.download = `audit_trail_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click(); URL.revokeObjectURL(url);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Audit Trail</h1>
          <p className="text-muted-foreground text-sm">Historique complet des actions et connexions utilisateurs</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="border-zinc-800 text-white gap-2 h-10" onClick={exportCsv}>
            <Download className="w-4 h-4" /> Exporter CSV
          </Button>
          <Button variant="outline" className="border-zinc-800 text-white gap-2 h-10" onClick={() => load(page, search, actionFilter)} disabled={loading}>
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            Actualiser
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { icon: History,      label: 'Total événements', value: stats?.total ?? '—',        color: 'text-blue-400 bg-blue-500/10 border-blue-500/20' },
          { icon: User,         label: 'Utilisateurs',     value: stats?.uniqueUsers ?? '—',  color: 'text-orange-400 bg-orange-500/10 border-orange-500/20' },
          { icon: LogIn,        label: 'Connexions',       value: stats?.logins ?? '—',       color: 'text-green-400 bg-green-500/10 border-green-500/20' },
          { icon: AlertTriangle,label: 'Échecs',           value: stats?.failures ?? '—',     color: 'text-red-400 bg-red-500/10 border-red-500/20' },
        ].map(({ icon: Icon, label, value, color }) => (
          <Card key={label} className="p-4 bg-zinc-900/50 border-zinc-800 flex items-center gap-3">
            <div className={`p-2.5 rounded-xl border ${color} shrink-0`}>
              <Icon className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xl font-bold text-white">{value}</div>
              <div className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest">{label}</div>
            </div>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <input
            value={search}
            onChange={e => handleSearch(e.target.value)}
            placeholder="Rechercher un utilisateur…"
            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg h-10 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-orange-500 transition-all"
          />
        </div>
        <Select value={actionFilter} onValueChange={handleAction}>
          <SelectTrigger className="bg-zinc-950 border-zinc-800 text-white h-10 w-52">
            <SelectValue placeholder="Toutes les actions" />
          </SelectTrigger>
          <SelectContent className="bg-zinc-950 border-zinc-800 text-white">
            <SelectItem value="all">Toutes les actions</SelectItem>
            <SelectItem value="login">Connexion</SelectItem>
            <SelectItem value="failed_login">Échec connexion</SelectItem>
            <SelectItem value="logout">Déconnexion</SelectItem>
            <SelectItem value="created">Créé</SelectItem>
            <SelectItem value="updated">Modifié</SelectItem>
            <SelectItem value="deleted">Supprimé</SelectItem>
            <SelectItem value="password_changed">Mot de passe</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Card className="bg-zinc-900/50 border-zinc-800 overflow-hidden">
        <Table>
          <TableHeader className="bg-zinc-950">
            <TableRow className="border-zinc-800 hover:bg-transparent">
              <TableHead className="text-zinc-500 text-[10px] uppercase font-bold h-11 pl-6">Utilisateur</TableHead>
              <TableHead className="text-zinc-500 text-[10px] uppercase font-bold h-11">Action</TableHead>
              <TableHead className="text-zinc-500 text-[10px] uppercase font-bold h-11">Date & Heure</TableHead>
              <TableHead className="text-zinc-500 text-[10px] uppercase font-bold h-11">Adresse IP</TableHead>
              <TableHead className="text-zinc-500 text-[10px] uppercase font-bold h-11">Navigateur</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-12">
                  <Loader2 className="w-6 h-6 text-orange-500 animate-spin mx-auto" />
                </TableCell>
              </TableRow>
            ) : !data || data.items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-10 text-zinc-500 text-sm italic">
                  Aucun événement trouvé.
                </TableCell>
              </TableRow>
            ) : (
              data.items.map(entry => (
                <TableRow key={entry.id} className="border-zinc-800 hover:bg-zinc-800/20">
                  <TableCell className="pl-6">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-orange-600/20 border border-orange-500/20 flex items-center justify-center text-orange-400 text-xs font-bold uppercase shrink-0">
                        {entry.username.charAt(0)}
                      </div>
                      <span className="text-sm font-medium text-white">{entry.username}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <ActionBadge action={entry.action} />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5 text-xs text-zinc-300">
                      <Clock className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                      {formatTs(entry.timestamp)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-xs font-mono text-zinc-400">
                      {entry.ip_address ?? <span className="text-zinc-600 italic">—</span>}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="text-xs text-zinc-500">{parseUA(entry.user_agent)}</span>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Pagination */}
      {data && data.total > 0 && (
        <div className="flex items-center justify-between text-xs text-zinc-500 px-1">
          <span>
            {data.total === 0 ? 'Aucun résultat.' : `Affichage de ${(page - 1) * PAGE_SIZE + 1}–${Math.min(page * PAGE_SIZE, data.total)} sur ${data.total} événements`}
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline" size="sm"
              className="h-8 border-zinc-800 text-zinc-400 gap-1"
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page <= 1 || loading}
            >
              <ChevronLeft className="w-3 h-3" /> Précédent
            </Button>
            <span className="text-zinc-400 text-xs font-mono px-2">{page} / {totalPages}</span>
            <Button
              variant="outline" size="sm"
              className="h-8 border-zinc-800 text-zinc-400 gap-1"
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages || loading}
            >
              Suivant <ChevronRight className="w-3 h-3" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

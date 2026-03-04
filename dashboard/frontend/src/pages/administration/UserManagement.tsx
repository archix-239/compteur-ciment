import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Users, UserPlus, Shield, Key, Trash2, Edit2, Search, ShieldCheck,
  Clock, Monitor, CheckCircle2, AlertTriangle, X, Loader2,
  RefreshCw, HelpCircle, Lock, UserCheck, UserX, Eye, EyeOff,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from '@/components/ui/tooltip';

const API = 'http://localhost:8000';

// ── Types ─────────────────────────────────────────────────────────────────────
interface UserRow {
  id: number;
  username: string;
  full_name: string | null;
  role: string;
  is_active: boolean;
  last_login: string | null;
  login_count: number;
}
interface ActivityRow {
  id: number;
  username: string;
  timestamp: string;
  action: string;
  ip_address: string | null;
  user_agent: string | null;
}
interface UserForm {
  username: string;
  full_name: string;
  role: string;
  password: string;
}
const EMPTY_FORM: UserForm = { username: '', full_name: '', role: 'operator', password: '' };

// ── Helpers ───────────────────────────────────────────────────────────────────
function InfoTooltip({ text }: { text: string }) {
  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <HelpCircle className="w-3.5 h-3.5 text-zinc-500 cursor-help flex-shrink-0" />
        </TooltipTrigger>
        <TooltipContent className="max-w-xs text-xs bg-zinc-900 border-zinc-700 text-zinc-200">
          {text}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

function roleBadge(role: string) {
  if (role === 'admin') return 'border-orange-500/30 bg-orange-500/5 text-orange-400';
  if (role === 'operator') return 'border-blue-500/30 bg-blue-500/5 text-blue-400';
  return 'border-zinc-700 bg-zinc-800/50 text-zinc-400';
}
function roleLabel(role: string) {
  if (role === 'admin') return 'Administrateur';
  if (role === 'operator') return 'Opérateur';
  return 'Lecteur';
}
function initials(u: UserRow) {
  const src = u.full_name || u.username;
  return src.substring(0, 2).toUpperCase();
}
function actionLabel(action: string) {
  const map: Record<string, string> = {
    login: 'Connexion',
    failed_login: 'Échec connexion',
    logout: 'Déconnexion',
    created: 'Compte créé',
    updated: 'Profil modifié',
    deleted: 'Compte supprimé',
    password_changed: 'Mot de passe modifié',
  };
  return map[action] ?? action;
}
function actionColor(action: string) {
  if (action === 'login') return 'text-green-400';
  if (action === 'failed_login' || action === 'deleted') return 'text-red-400';
  if (action === 'password_changed') return 'text-yellow-400';
  return 'text-blue-400';
}
function fmtDate(iso: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('fr-FR', {
    day: '2-digit', month: '2-digit', year: '2-digit',
    hour: '2-digit', minute: '2-digit',
  });
}

// ── Component ──────────────────────────────────────────────────────────────────
export default function UserManagement() {
  const [users, setUsers]           = useState<UserRow[]>([]);
  const [activity, setActivity]     = useState<ActivityRow[]>([]);
  const [search, setSearch]         = useState('');
  const [loading, setLoading]       = useState(true);
  const [actLoading, setActLoading] = useState(false);
  const [flash, setFlash]           = useState<{ msg: string; ok: boolean } | null>(null);
  const flashTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Add / Edit modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId]       = useState<number | null>(null);
  const [form, setForm]           = useState<UserForm>(EMPTY_FORM);
  const [showPwd, setShowPwd]     = useState(false);
  const [saving, setSaving]       = useState(false);

  // Password change modal
  const [pwdModal, setPwdModal]     = useState<UserRow | null>(null);
  const [newPwd, setNewPwd]         = useState('');
  const [showNewPwd, setShowNewPwd] = useState(false);
  const [pwdSaving, setPwdSaving]   = useState(false);

  // Confirm delete
  const [confirmDelete, setConfirmDelete] = useState<UserRow | null>(null);
  const [deleting, setDeleting]           = useState<number | null>(null);

  const showFlash = useCallback((msg: string, ok: boolean) => {
    if (flashTimer.current) clearTimeout(flashTimer.current);
    setFlash({ msg, ok });
    flashTimer.current = setTimeout(() => setFlash(null), 4000);
  }, []);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/users/`);
      if (res.ok) setUsers(await res.json());
    } catch {
      showFlash('Erreur de connexion au backend', false);
    } finally {
      setLoading(false);
    }
  }, [showFlash]);

  const loadActivity = useCallback(async () => {
    setActLoading(true);
    try {
      const res = await fetch(`${API}/api/users/activity?limit=50`);
      if (res.ok) setActivity(await res.json());
    } catch {
      // silently ignore
    } finally {
      setActLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUsers();
    loadActivity();
  }, [loadUsers, loadActivity]);

  // ── CRUD ────────────────────────────────────────────────────────────────────
  function openAdd() {
    setEditId(null);
    setForm(EMPTY_FORM);
    setShowPwd(false);
    setModalOpen(true);
  }
  function openEdit(u: UserRow) {
    setEditId(u.id);
    setForm({ username: u.username, full_name: u.full_name ?? '', role: u.role, password: '' });
    setShowPwd(false);
    setModalOpen(true);
  }

  async function saveUser() {
    if (!form.username.trim()) return;
    if (!editId && form.password.length < 6) {
      showFlash('Le mot de passe doit faire au moins 6 caractères', false);
      return;
    }
    setSaving(true);
    try {
      let res: Response;
      if (editId) {
        res = await fetch(`${API}/api/users/${editId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ full_name: form.full_name || null, role: form.role }),
        });
      } else {
        res = await fetch(`${API}/api/users/`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            username: form.username,
            full_name: form.full_name || null,
            role: form.role,
            password: form.password,
          }),
        });
      }
      if (res.ok) {
        showFlash(editId ? 'Utilisateur mis à jour' : 'Utilisateur créé', true);
        setModalOpen(false);
        loadUsers();
        loadActivity();
      } else {
        const err = await res.json().catch(() => ({}));
        showFlash((err as { detail?: string }).detail ?? 'Erreur lors de la sauvegarde', false);
      }
    } catch {
      showFlash('Erreur réseau', false);
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(u: UserRow) {
    try {
      const res = await fetch(`${API}/api/users/${u.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !u.is_active }),
      });
      if (res.ok) {
        showFlash(`${u.username} ${!u.is_active ? 'activé' : 'désactivé'}`, true);
        loadUsers();
      } else {
        const err = await res.json().catch(() => ({}));
        showFlash((err as { detail?: string }).detail ?? 'Erreur', false);
      }
    } catch {
      showFlash('Erreur réseau', false);
    }
  }

  async function doDelete(u: UserRow) {
    setDeleting(u.id);
    setConfirmDelete(null);
    try {
      const res = await fetch(`${API}/api/users/${u.id}`, { method: 'DELETE' });
      if (res.ok) {
        showFlash(`${u.username} supprimé`, true);
        loadUsers();
        loadActivity();
      } else {
        const err = await res.json().catch(() => ({}));
        showFlash((err as { detail?: string }).detail ?? 'Erreur', false);
      }
    } catch {
      showFlash('Erreur réseau', false);
    } finally {
      setDeleting(null);
    }
  }

  async function changePassword() {
    if (!pwdModal || newPwd.length < 6) {
      showFlash('Le mot de passe doit faire au moins 6 caractères', false);
      return;
    }
    setPwdSaving(true);
    try {
      const res = await fetch(`${API}/api/users/${pwdModal.id}/password`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ new_password: newPwd }),
      });
      if (res.ok) {
        showFlash(`Mot de passe de ${pwdModal.username} modifié`, true);
        setPwdModal(null);
        setNewPwd('');
        loadActivity();
      } else {
        const err = await res.json().catch(() => ({}));
        showFlash((err as { detail?: string }).detail ?? 'Erreur', false);
      }
    } catch {
      showFlash('Erreur réseau', false);
    } finally {
      setPwdSaving(false);
    }
  }

  const filtered = users.filter(u => {
    const q = search.toLowerCase();
    return (
      u.username.toLowerCase().includes(q) ||
      (u.full_name ?? '').toLowerCase().includes(q) ||
      u.role.toLowerCase().includes(q)
    );
  });

  const stats = {
    total: users.length,
    active: users.filter(u => u.is_active).length,
    admins: users.filter(u => u.role === 'admin').length,
  };

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="p-6 space-y-6 relative">

      {/* Flash banner */}
      {flash && (
        <div className={`fixed top-4 right-4 z-50 flex items-center gap-3 px-4 py-3 rounded-lg border text-sm font-medium shadow-lg
          ${flash.ok ? 'bg-green-900/90 border-green-700 text-green-200' : 'bg-red-900/90 border-red-700 text-red-200'}`}>
          {flash.ok ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
          {flash.msg}
        </div>
      )}

      {/* Confirm delete dialog */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-6 w-96 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3 text-red-400">
              <Trash2 className="w-5 h-5" />
              <h3 className="font-bold text-sm uppercase tracking-widest">Supprimer l'utilisateur</h3>
            </div>
            <p className="text-sm text-zinc-300">
              Supprimer <span className="font-bold text-white">"{confirmDelete.username}"</span> ? Cette action est irréversible.
            </p>
            <div className="flex gap-3 justify-end">
              <Button variant="ghost" size="sm" onClick={() => setConfirmDelete(null)}>Annuler</Button>
              <Button size="sm" className="bg-red-600 hover:bg-red-700 text-white" onClick={() => doDelete(confirmDelete)}>
                Supprimer
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Password modal */}
      {pwdModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-6 w-96 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm uppercase tracking-widest text-white flex items-center gap-2">
                <Key className="w-4 h-4 text-orange-500" />
                Changer le mot de passe
              </h3>
              <button onClick={() => setPwdModal(null)} className="text-zinc-500 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-zinc-400">Compte : <span className="text-white font-mono">{pwdModal.username}</span></p>
            <div className="relative">
              <input
                type={showNewPwd ? 'text' : 'password'}
                className="w-full h-9 px-3 pr-10 rounded-md bg-zinc-800 border border-zinc-700 text-white text-sm font-mono focus:outline-none focus:border-orange-500"
                placeholder="Nouveau mot de passe (min. 6 car.)"
                value={newPwd}
                onChange={e => setNewPwd(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') changePassword(); }}
              />
              <button
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white"
                onClick={() => setShowNewPwd(v => !v)}
              >
                {showNewPwd ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>
            <div className="flex gap-3 justify-end">
              <Button variant="ghost" size="sm" onClick={() => setPwdModal(null)}>Annuler</Button>
              <Button size="sm" className="bg-orange-600 hover:bg-orange-700 text-white" onClick={changePassword} disabled={pwdSaving || newPwd.length < 6}>
                {pwdSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Enregistrer'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-6 w-[440px] space-y-5 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm uppercase tracking-widest text-white flex items-center gap-2">
                <Users className="w-4 h-4 text-orange-500" />
                {editId ? "Modifier l'utilisateur" : 'Nouvel utilisateur'}
              </h3>
              <button onClick={() => setModalOpen(false)} className="text-zinc-500 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3.5">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 flex items-center gap-1.5">
                  Nom d'utilisateur
                  {editId && <InfoTooltip text="Le nom d'utilisateur ne peut pas être modifié après création." />}
                </label>
                <input
                  className="w-full h-9 px-3 rounded-md bg-zinc-800 border border-zinc-700 text-white text-sm font-mono focus:outline-none focus:border-orange-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  placeholder="ex: jean.operateur"
                  value={form.username}
                  onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
                  disabled={!!editId}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Nom complet</label>
                <input
                  className="w-full h-9 px-3 rounded-md bg-zinc-800 border border-zinc-700 text-white text-sm focus:outline-none focus:border-orange-500"
                  placeholder="ex: Jean Dupont"
                  value={form.full_name}
                  onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 flex items-center gap-1.5">
                  Rôle
                  <InfoTooltip text="admin = accès complet. operator = sessions + qualité. viewer = lecture seule." />
                </label>
                <select
                  className="w-full h-9 px-3 rounded-md bg-zinc-800 border border-zinc-700 text-white text-sm focus:outline-none focus:border-orange-500"
                  value={form.role}
                  onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
                >
                  <option value="admin">Administrateur</option>
                  <option value="operator">Opérateur</option>
                  <option value="viewer">Lecteur</option>
                </select>
              </div>

              {!editId && (
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Mot de passe (min. 6 car.)</label>
                  <div className="relative">
                    <input
                      type={showPwd ? 'text' : 'password'}
                      className="w-full h-9 px-3 pr-10 rounded-md bg-zinc-800 border border-zinc-700 text-white text-sm font-mono focus:outline-none focus:border-orange-500"
                      placeholder="••••••••"
                      value={form.password}
                      onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                    />
                    <button
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white"
                      onClick={() => setShowPwd(v => !v)}
                    >
                      {showPwd ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-3 justify-end pt-1">
              <Button variant="ghost" size="sm" onClick={() => setModalOpen(false)}>Annuler</Button>
              <Button
                size="sm"
                className="bg-orange-600 hover:bg-orange-700 text-white"
                onClick={saveUser}
                disabled={saving || !form.username.trim() || (!editId && form.password.length < 6)}
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : (editId ? 'Enregistrer' : 'Créer')}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Gestion des Utilisateurs</h1>
          <p className="text-muted-foreground text-sm">Gérez les comptes, les rôles et surveillez l'activité des connexions</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="border-zinc-800 text-white gap-2 text-xs" onClick={() => { loadUsers(); loadActivity(); }} disabled={loading}>
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            Actualiser
          </Button>
          <Button className="gap-2 bg-orange-600 hover:bg-orange-700 text-white text-xs" onClick={openAdd}>
            <UserPlus className="w-4 h-4" /> Nouvel Utilisateur
          </Button>
        </div>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total', value: stats.total, icon: Users, color: 'text-white' },
          { label: 'Actifs', value: stats.active, icon: UserCheck, color: 'text-green-400' },
          { label: 'Admins', value: stats.admins, icon: Shield, color: 'text-orange-400' },
        ].map(({ label, value, icon: Icon, color }) => (
          <Card key={label} className="p-4 bg-zinc-900/50 border-zinc-800 flex items-center gap-4">
            <div className="p-2.5 rounded-lg bg-zinc-800 border border-zinc-700">
              <Icon className={`w-4 h-4 ${color}`} />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">{label}</p>
              <p className={`text-2xl font-bold ${color}`}>{loading ? '—' : value}</p>
            </div>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="users" className="space-y-6">
        <TabsList className="bg-zinc-900 border border-zinc-800 p-1">
          <TabsTrigger value="users" className="gap-2 text-white data-[state=active]:bg-zinc-800">
            <Users className="w-4 h-4" /> Utilisateurs
          </TabsTrigger>
          <TabsTrigger value="activity" className="gap-2 text-white data-[state=active]:bg-zinc-800" onClick={loadActivity}>
            <Clock className="w-4 h-4" /> Historique
          </TabsTrigger>
          <TabsTrigger value="permissions" className="gap-2 text-white data-[state=active]:bg-zinc-800">
            <Shield className="w-4 h-4" /> Rôles & Permissions
          </TabsTrigger>
        </TabsList>

        {/* ── Utilisateurs ──────────────────────────────────────────────────── */}
        <TabsContent value="users" className="space-y-4">
          <Card className="bg-zinc-900/50 border-zinc-800">
            <div className="p-4 border-b border-zinc-800">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                <Input
                  placeholder="Rechercher par nom d'utilisateur, nom complet ou rôle…"
                  className="pl-10 bg-zinc-800 border-zinc-700 text-white text-sm h-9"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
              </div>
            </div>

            <div className="overflow-hidden">
              <Table>
                <TableHeader className="bg-zinc-900/80">
                  <TableRow className="border-zinc-800 hover:bg-transparent">
                    <TableHead className="text-zinc-500 text-[10px] uppercase tracking-widest font-bold">Profil</TableHead>
                    <TableHead className="text-zinc-500 text-[10px] uppercase tracking-widest font-bold">Rôle</TableHead>
                    <TableHead className="text-zinc-500 text-[10px] uppercase tracking-widest font-bold">État</TableHead>
                    <TableHead className="text-zinc-500 text-[10px] uppercase tracking-widest font-bold">
                      <div className="flex items-center gap-1">
                        Dernière connexion
                        <InfoTooltip text="Horodatage de la dernière connexion réussie. Enregistré à chaque POST /token." />
                      </div>
                    </TableHead>
                    <TableHead className="text-zinc-500 text-[10px] uppercase tracking-widest font-bold text-center">
                      <div className="flex items-center justify-center gap-1">
                        Connexions
                        <InfoTooltip text="Nombre total de connexions réussies depuis la création du compte." />
                      </div>
                    </TableHead>
                    <TableHead className="text-right text-zinc-500 text-[10px] uppercase tracking-widest font-bold">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    Array.from({ length: 3 }).map((_, i) => (
                      <TableRow key={i} className="border-zinc-800">
                        <TableCell colSpan={6}>
                          <div className="h-8 bg-zinc-800 rounded animate-pulse" />
                        </TableCell>
                      </TableRow>
                    ))
                  ) : filtered.length === 0 ? (
                    <TableRow className="border-zinc-800">
                      <TableCell colSpan={6} className="text-center py-10 text-zinc-500 text-sm">
                        {search
                          ? 'Aucun résultat pour cette recherche.'
                          : 'Aucun utilisateur. Cliquez sur "Nouvel Utilisateur".'}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filtered.map(u => (
                      <TableRow key={u.id} className="border-zinc-800 hover:bg-zinc-800/30 transition-colors">
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-9 w-9 border border-orange-500/20 ring-1 ring-orange-500/10">
                              <AvatarFallback className={`text-xs font-bold ${u.is_active ? 'bg-orange-500/10 text-orange-400' : 'bg-zinc-800 text-zinc-500'}`}>
                                {initials(u)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="text-sm font-semibold text-white">{u.full_name || u.username}</p>
                              <p className="text-[10px] text-zinc-500 font-mono">{u.username}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={`text-[10px] font-bold ${roleBadge(u.role)}`}>
                            {roleLabel(u.role)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full flex-shrink-0 ${u.is_active ? 'bg-green-500 shadow-[0_0_6px_rgba(34,197,94,0.4)]' : 'bg-zinc-600'}`} />
                            <span className={`text-xs ${u.is_active ? 'text-green-400' : 'text-zinc-500'}`}>
                              {u.is_active ? 'Actif' : 'Inactif'}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-zinc-400 text-xs font-mono">
                          {fmtDate(u.last_login)}
                        </TableCell>
                        <TableCell className="text-center">
                          <span className="text-sm font-mono text-zinc-300">{u.login_count}</span>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            {/* Toggle active */}
                            <TooltipProvider delayDuration={200}>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost" size="icon"
                                    className={`h-8 w-8 ${u.is_active ? 'text-zinc-500 hover:text-yellow-400' : 'text-zinc-500 hover:text-green-400'}`}
                                    onClick={() => toggleActive(u)}
                                  >
                                    {u.is_active ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent className="text-xs bg-zinc-900 border-zinc-700">
                                  {u.is_active ? 'Désactiver le compte' : 'Activer le compte'}
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>

                            {/* Change password */}
                            <TooltipProvider delayDuration={200}>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost" size="icon"
                                    className="h-8 w-8 text-zinc-500 hover:text-orange-400"
                                    onClick={() => { setPwdModal(u); setNewPwd(''); setShowNewPwd(false); }}
                                  >
                                    <Key className="w-4 h-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent className="text-xs bg-zinc-900 border-zinc-700">
                                  Changer le mot de passe
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>

                            {/* Edit */}
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-500 hover:text-white" onClick={() => openEdit(u)}>
                              <Edit2 className="w-4 h-4" />
                            </Button>

                            {/* Delete */}
                            <Button
                              variant="ghost" size="icon"
                              className="h-8 w-8 text-zinc-500 hover:text-red-400"
                              onClick={() => setConfirmDelete(u)}
                              disabled={deleting === u.id}
                            >
                              {deleting === u.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </Card>
        </TabsContent>

        {/* ── Historique ────────────────────────────────────────────────────── */}
        <TabsContent value="activity">
          <Card className="bg-zinc-900/50 border-zinc-800">
            <div className="flex items-center justify-between p-4 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-orange-500" />
                <h3 className="text-sm font-bold text-white uppercase tracking-widest">Journal d'activité</h3>
                <InfoTooltip text="Connexions, échecs d'authentification, créations/suppressions de comptes et changements de mot de passe. Les 50 dernières entrées." />
              </div>
              <Button variant="ghost" size="icon" className="h-7 w-7 text-zinc-500 hover:text-white" onClick={loadActivity} disabled={actLoading}>
                {actLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
              </Button>
            </div>
            <div className="overflow-auto" style={{ maxHeight: '28rem' }}>
              <Table>
                <TableHeader className="bg-zinc-900/80 sticky top-0">
                  <TableRow className="border-zinc-800 hover:bg-transparent">
                    <TableHead className="text-zinc-500 text-[10px] uppercase tracking-widest font-bold">Utilisateur</TableHead>
                    <TableHead className="text-zinc-500 text-[10px] uppercase tracking-widest font-bold">Action</TableHead>
                    <TableHead className="text-zinc-500 text-[10px] uppercase tracking-widest font-bold">Adresse IP</TableHead>
                    <TableHead className="text-zinc-500 text-[10px] uppercase tracking-widest font-bold">Navigateur</TableHead>
                    <TableHead className="text-zinc-500 text-[10px] uppercase tracking-widest font-bold">Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {actLoading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <TableRow key={i} className="border-zinc-800">
                        <TableCell colSpan={5}><div className="h-6 bg-zinc-800 rounded animate-pulse" /></TableCell>
                      </TableRow>
                    ))
                  ) : activity.length === 0 ? (
                    <TableRow className="border-zinc-800">
                      <TableCell colSpan={5} className="text-center py-10 text-zinc-500 text-sm">
                        Aucune activité enregistrée.
                        Les connexions via <span className="font-mono text-zinc-400">POST /token</span> seront journalisées ici.
                      </TableCell>
                    </TableRow>
                  ) : (
                    activity.map(a => (
                      <TableRow key={a.id} className="border-zinc-800 hover:bg-zinc-800/20 transition-colors">
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Avatar className="h-6 w-6">
                              <AvatarFallback className="bg-zinc-800 text-zinc-400 text-[9px] font-bold">
                                {a.username.substring(0, 2).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-xs font-mono text-white">{a.username}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className={`text-xs font-bold ${actionColor(a.action)}`}>
                            {actionLabel(a.action)}
                          </span>
                        </TableCell>
                        <TableCell className="font-mono text-zinc-400 text-[10px]">
                          {a.ip_address ?? '—'}
                        </TableCell>
                        <TableCell className="text-zinc-500 text-[10px] max-w-[200px]">
                          {a.user_agent ? (
                            <TooltipProvider delayDuration={200}>
                              <Tooltip>
                                <TooltipTrigger className="flex items-center gap-1.5 truncate max-w-[200px]">
                                  <Monitor className="w-3 h-3 text-zinc-600 flex-shrink-0" />
                                  <span className="truncate">{a.user_agent}</span>
                                </TooltipTrigger>
                                <TooltipContent className="text-xs bg-zinc-900 border-zinc-700 max-w-xs">
                                  {a.user_agent}
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          ) : '—'}
                        </TableCell>
                        <TableCell className="text-zinc-500 text-[11px] font-mono whitespace-nowrap">
                          {fmtDate(a.timestamp)}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </Card>
        </TabsContent>

        {/* ── Rôles & Permissions ───────────────────────────────────────────── */}
        <TabsContent value="permissions">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                role: 'admin', label: 'Administrateur', color: 'text-orange-400',
                cardClass: 'border-orange-500/20 bg-orange-500/5',
                desc: 'Accès complet au système. Peut configurer le modèle IA, gérer les utilisateurs, les appareils et modifier tous les paramètres système.',
                perms: ['Dashboard', 'Production', 'Qualité', 'Alertes', 'Rapports', 'Analytique', 'Maintenance', 'Administration'],
              },
              {
                role: 'operator', label: 'Opérateur', color: 'text-blue-400',
                cardClass: 'border-blue-500/20 bg-blue-500/5',
                desc: 'Peut démarrer/arrêter des sessions de production, vérifier manuellement les comptages qualité et créer des alertes manuelles.',
                perms: ['Dashboard', 'Production', 'Qualité', 'Alertes', 'Rapports'],
              },
              {
                role: 'viewer', label: 'Lecteur', color: 'text-zinc-400',
                cardClass: 'border-zinc-700 bg-zinc-800/20',
                desc: 'Accès en lecture seule aux tableaux de bord et rapports. Aucune action de modification possible.',
                perms: ['Dashboard', 'Rapports', 'Analytique'],
              },
            ].map(p => (
              <Card key={p.role} className={`p-6 border ${p.cardClass} space-y-4 bg-zinc-900/50`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className={`w-5 h-5 ${p.color}`} />
                    <h3 className={`font-bold text-sm ${p.color}`}>{p.label}</h3>
                  </div>
                  <Badge variant="outline" className={`text-[9px] font-mono ${roleBadge(p.role)}`}>
                    {loading ? '—' : users.filter(u => u.role === p.role).length} compte(s)
                  </Badge>
                </div>
                <p className="text-xs text-zinc-400 leading-relaxed">{p.desc}</p>
                <div>
                  <p className="text-[10px] text-zinc-500 uppercase font-bold mb-2 tracking-widest">Modules accessibles</p>
                  <div className="flex flex-wrap gap-1.5">
                    {p.perms.map(a => (
                      <Badge key={a} variant="secondary" className="text-[9px] bg-zinc-900 border-zinc-800 text-zinc-400">{a}</Badge>
                    ))}
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* Security note */}
          <Card className="mt-4 p-4 bg-zinc-900/50 border-zinc-800">
            <div className="flex items-start gap-3">
              <Lock className="w-4 h-4 text-zinc-500 mt-0.5 flex-shrink-0" />
              <div className="space-y-1">
                <p className="text-xs font-bold text-zinc-300">Sécurité des mots de passe</p>
                <p className="text-[11px] text-zinc-500 leading-relaxed">
                  Les mots de passe sont hachés avec <span className="font-mono text-zinc-400">bcrypt</span> (passlib).
                  Minimum 6 caractères requis. Les tokens JWT expirent après{' '}
                  <span className="text-zinc-400 font-mono">30 min</span> d'inactivité.
                  Toutes les connexions (réussies ou échouées) sont journalisées dans l'onglet Historique.
                </p>
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

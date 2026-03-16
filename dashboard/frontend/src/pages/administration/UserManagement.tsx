import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Users, UserPlus, Shield, Key, Trash2, Edit2, Search, ShieldCheck,
  Clock, Monitor, CheckCircle2, AlertTriangle, X, Loader2,
  RefreshCw, HelpCircle, Lock, UserCheck, UserX, Eye, EyeOff,
  Plus, Settings2, ChevronDown, ChevronRight,
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
interface PermissionEntry {
  id: string;
  group: string;
  label: string;
}
interface RoleRow {
  id: number;
  name: string;
  label: string;
  description: string | null;
  permissions: string[];
  is_builtin: boolean;
  user_count: number;
}
interface RoleForm {
  name: string;
  label: string;
  description: string;
  permissions: string[];
}

const EMPTY_USER_FORM: UserForm = { username: '', full_name: '', role: 'operator', password: '' };
const EMPTY_ROLE_FORM: RoleForm = { name: '', label: '', description: '', permissions: [] };

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

function roleBadgeClass(role: string, roles: RoleRow[]) {
  const r = roles.find(x => x.name === role);
  if (!r) return 'border-zinc-700 bg-zinc-800/50 text-zinc-400';
  if (role === 'admin') return 'border-orange-500/30 bg-orange-500/5 text-orange-400';
  if (role === 'operator') return 'border-blue-500/30 bg-blue-500/5 text-blue-400';
  if (role === 'viewer') return 'border-zinc-700 bg-zinc-800/50 text-zinc-400';
  return 'border-purple-500/30 bg-purple-500/5 text-purple-400';
}
function roleLabel(role: string, roles: RoleRow[]) {
  return roles.find(r => r.name === role)?.label ?? role;
}
function initials(u: UserRow) {
  const src = u.full_name || u.username;
  return src.substring(0, 2).toUpperCase();
}
function actionLabel(action: string) {
  const map: Record<string, string> = {
    login: 'Connexion', failed_login: 'Échec connexion', logout: 'Déconnexion',
    created: 'Compte créé', updated: 'Profil modifié', deleted: 'Compte supprimé',
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
function groupPermissions(catalog: PermissionEntry[]) {
  const groups: Record<string, PermissionEntry[]> = {};
  for (const p of catalog) {
    if (!groups[p.group]) groups[p.group] = [];
    groups[p.group].push(p);
  }
  return Object.entries(groups);
}
function roleCardColor(name: string) {
  if (name === 'admin') return 'border-orange-500/30 bg-orange-500/5';
  if (name === 'operator') return 'border-blue-500/30 bg-blue-500/5';
  if (name === 'viewer') return 'border-zinc-700 bg-zinc-800/20';
  return 'border-purple-500/30 bg-purple-500/5';
}
function roleIconColor(name: string) {
  if (name === 'admin') return 'text-orange-400';
  if (name === 'operator') return 'text-blue-400';
  if (name === 'viewer') return 'text-zinc-400';
  return 'text-purple-400';
}

// ── Component ──────────────────────────────────────────────────────────────────
export default function UserManagement() {
  const [users, setUsers]           = useState<UserRow[]>([]);
  const [activity, setActivity]     = useState<ActivityRow[]>([]);
  const [roles, setRoles]           = useState<RoleRow[]>([]);
  const [catalog, setCatalog]       = useState<PermissionEntry[]>([]);
  const [search, setSearch]         = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [loading, setLoading]       = useState(true);
  const [actLoading, setActLoading] = useState(false);
  const [flash, setFlash]           = useState<{ msg: string; ok: boolean } | null>(null);
  const flashTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // User modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId]       = useState<number | null>(null);
  const [form, setForm]           = useState<UserForm>(EMPTY_USER_FORM);
  const [showPwd, setShowPwd]     = useState(false);
  const [saving, setSaving]       = useState(false);

  // Password change modal
  const [pwdModal, setPwdModal]     = useState<UserRow | null>(null);
  const [newPwd, setNewPwd]         = useState('');
  const [showNewPwd, setShowNewPwd] = useState(false);
  const [pwdSaving, setPwdSaving]   = useState(false);

  // Confirm delete user
  const [confirmDelete, setConfirmDelete] = useState<UserRow | null>(null);
  const [deleting, setDeleting]           = useState<number | null>(null);

  // Role management
  const [selectedRole, setSelectedRole]   = useState<RoleRow | null>(null);
  const [editedPerms, setEditedPerms]     = useState<Set<string>>(new Set());
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [permSaving, setPermSaving]       = useState(false);
  const [roleModal, setRoleModal]         = useState(false);
  const [roleForm, setRoleForm]           = useState<RoleForm>(EMPTY_ROLE_FORM);
  const [roleSaving, setRoleSaving]       = useState(false);
  const [confirmDeleteRole, setConfirmDeleteRole] = useState<RoleRow | null>(null);
  const [deletingRole, setDeletingRole]   = useState<number | null>(null);
  const [editRoleDesc, setEditRoleDesc]   = useState(false);
  const [descDraft, setDescDraft]         = useState('');

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
    } catch { showFlash('Erreur de connexion au backend', false); }
    finally { setLoading(false); }
  }, [showFlash]);

  const loadActivity = useCallback(async () => {
    setActLoading(true);
    try {
      const res = await fetch(`${API}/api/users/activity?limit=50`);
      if (res.ok) setActivity(await res.json());
    } catch { /* silent */ }
    finally { setActLoading(false); }
  }, []);

  const loadRoles = useCallback(async () => {
    try {
      const [rolesRes, catalogRes] = await Promise.all([
        fetch(`${API}/api/roles/`),
        fetch(`${API}/api/roles/permissions`),
      ]);
      if (rolesRes.ok) {
        const data: RoleRow[] = await rolesRes.json();
        setRoles(data);
        // Auto-select first role if none selected
        setSelectedRole(prev => prev ? (data.find(r => r.id === prev.id) ?? data[0] ?? null) : (data[0] ?? null));
      }
      if (catalogRes.ok) setCatalog(await catalogRes.json());
    } catch { /* silent */ }
  }, []);

  useEffect(() => {
    loadUsers();
    loadActivity();
    loadRoles();
  }, [loadUsers, loadActivity, loadRoles]);

  // Sync editedPerms when selectedRole changes
  useEffect(() => {
    if (selectedRole) {
      setEditedPerms(new Set(selectedRole.permissions));
      // Expand all groups initially
      const groups = [...new Set(catalog.map(p => p.group))];
      setExpandedGroups(new Set(groups));
      setEditRoleDesc(false);
    }
  }, [selectedRole, catalog]);

  // ── User CRUD ───────────────────────────────────────────────────────────────
  function openAdd() {
    setEditId(null);
    setForm({ ...EMPTY_USER_FORM, role: roles[1]?.name ?? 'operator' });
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
          method: 'PUT', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ full_name: form.full_name || null, role: form.role }),
        });
      } else {
        res = await fetch(`${API}/api/users/`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: form.username, full_name: form.full_name || null, role: form.role, password: form.password }),
        });
      }
      if (res.ok) {
        showFlash(editId ? 'Utilisateur mis à jour' : 'Utilisateur créé', true);
        setModalOpen(false);
        loadUsers(); loadActivity();
      } else {
        const err = await res.json().catch(() => ({}));
        showFlash((err as { detail?: string }).detail ?? 'Erreur', false);
      }
    } catch { showFlash('Erreur réseau', false); }
    finally { setSaving(false); }
  }

  async function toggleActive(u: UserRow) {
    try {
      const res = await fetch(`${API}/api/users/${u.id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !u.is_active }),
      });
      if (res.ok) { showFlash(`${u.username} ${!u.is_active ? 'activé' : 'désactivé'}`, true); loadUsers(); }
      else { const err = await res.json().catch(() => ({})); showFlash((err as { detail?: string }).detail ?? 'Erreur', false); }
    } catch { showFlash('Erreur réseau', false); }
  }

  async function doDelete(u: UserRow) {
    setDeleting(u.id); setConfirmDelete(null);
    try {
      const res = await fetch(`${API}/api/users/${u.id}`, { method: 'DELETE' });
      if (res.ok) { showFlash(`${u.username} supprimé`, true); loadUsers(); loadActivity(); }
      else { const err = await res.json().catch(() => ({})); showFlash((err as { detail?: string }).detail ?? 'Erreur', false); }
    } catch { showFlash('Erreur réseau', false); }
    finally { setDeleting(null); }
  }

  async function changePassword() {
    if (!pwdModal || newPwd.length < 6) { showFlash('Le mot de passe doit faire au moins 6 caractères', false); return; }
    setPwdSaving(true);
    try {
      const res = await fetch(`${API}/api/users/${pwdModal.id}/password`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ new_password: newPwd }),
      });
      if (res.ok) { showFlash(`Mot de passe de ${pwdModal.username} modifié`, true); setPwdModal(null); setNewPwd(''); loadActivity(); }
      else { const err = await res.json().catch(() => ({})); showFlash((err as { detail?: string }).detail ?? 'Erreur', false); }
    } catch { showFlash('Erreur réseau', false); }
    finally { setPwdSaving(false); }
  }

  // ── Role CRUD ───────────────────────────────────────────────────────────────
  async function saveRolePermissions() {
    if (!selectedRole) return;
    setPermSaving(true);
    try {
      const body: Record<string, unknown> = { permissions: [...editedPerms] };
      if (!selectedRole.is_builtin && descDraft !== selectedRole.description) {
        body.description = descDraft;
      }
      const res = await fetch(`${API}/api/roles/${selectedRole.id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        showFlash(`Permissions de "${selectedRole.label}" mises à jour`, true);
        await loadRoles();
      } else {
        const err = await res.json().catch(() => ({}));
        showFlash((err as { detail?: string }).detail ?? 'Erreur', false);
      }
    } catch { showFlash('Erreur réseau', false); }
    finally { setPermSaving(false); }
  }

  async function createRole() {
    if (!roleForm.name.trim() || !roleForm.label.trim()) return;
    setRoleSaving(true);
    try {
      const res = await fetch(`${API}/api/roles/`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(roleForm),
      });
      if (res.ok) {
        showFlash(`Rôle "${roleForm.label}" créé`, true);
        setRoleModal(false); setRoleForm(EMPTY_ROLE_FORM);
        await loadRoles();
      } else {
        const err = await res.json().catch(() => ({}));
        showFlash((err as { detail?: string }).detail ?? 'Erreur', false);
      }
    } catch { showFlash('Erreur réseau', false); }
    finally { setRoleSaving(false); }
  }

  async function doDeleteRole(r: RoleRow) {
    setDeletingRole(r.id); setConfirmDeleteRole(null);
    try {
      const res = await fetch(`${API}/api/roles/${r.id}`, { method: 'DELETE' });
      if (res.ok) {
        showFlash(`Rôle "${r.label}" supprimé`, true);
        setSelectedRole(null);
        await loadRoles();
      } else {
        const err = await res.json().catch(() => ({}));
        showFlash((err as { detail?: string }).detail ?? 'Erreur', false);
      }
    } catch { showFlash('Erreur réseau', false); }
    finally { setDeletingRole(null); }
  }

  function togglePerm(permId: string) {
    setEditedPerms(prev => {
      const next = new Set(prev);
      if (next.has(permId)) next.delete(permId); else next.add(permId);
      return next;
    });
  }

  function toggleGroup(group: string, groupPerms: PermissionEntry[]) {
    const allOn = groupPerms.every(p => editedPerms.has(p.id));
    setEditedPerms(prev => {
      const next = new Set(prev);
      groupPerms.forEach(p => allOn ? next.delete(p.id) : next.add(p.id));
      return next;
    });
  }

  function toggleExpandGroup(group: string) {
    setExpandedGroups(prev => {
      const next = new Set(prev);
      if (next.has(group)) next.delete(group); else next.add(group);
      return next;
    });
  }

  const permsDirty = selectedRole
    ? JSON.stringify([...editedPerms].sort()) !== JSON.stringify([...selectedRole.permissions].sort())
    : false;

  const filtered = users.filter(u => {
    const q = search.toLowerCase();
    const matchSearch = u.username.toLowerCase().includes(q) || (u.full_name ?? '').toLowerCase().includes(q) || u.role.toLowerCase().includes(q);
    const matchRole = roleFilter === 'all' || u.role === roleFilter;
    return matchSearch && matchRole;
  });

  const stats = {
    total: users.length,
    active: users.filter(u => u.is_active).length,
    admins: users.filter(u => u.role === 'admin').length,
  };

  const grouped = groupPermissions(catalog);

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

      {/* ── Delete user dialog ── */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-6 w-96 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3 text-red-400"><Trash2 className="w-5 h-5" /><h3 className="font-bold text-sm uppercase tracking-widest">Supprimer l'utilisateur</h3></div>
            <p className="text-sm text-zinc-300">Supprimer <span className="font-bold text-white">"{confirmDelete.username}"</span> ? Cette action est irréversible.</p>
            <div className="flex gap-3 justify-end">
              <Button variant="ghost" size="sm" onClick={() => setConfirmDelete(null)}>Annuler</Button>
              <Button size="sm" className="bg-red-600 hover:bg-red-700 text-white" onClick={() => doDelete(confirmDelete)}>Supprimer</Button>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete role dialog ── */}
      {confirmDeleteRole && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-6 w-96 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3 text-red-400"><Trash2 className="w-5 h-5" /><h3 className="font-bold text-sm uppercase tracking-widest">Supprimer le rôle</h3></div>
            <p className="text-sm text-zinc-300">Supprimer le rôle <span className="font-bold text-white">"{confirmDeleteRole.label}"</span> ? Cette action est irréversible.</p>
            <div className="flex gap-3 justify-end">
              <Button variant="ghost" size="sm" onClick={() => setConfirmDeleteRole(null)}>Annuler</Button>
              <Button size="sm" className="bg-red-600 hover:bg-red-700 text-white" onClick={() => doDeleteRole(confirmDeleteRole)}>Supprimer</Button>
            </div>
          </div>
        </div>
      )}

      {/* ── Password modal ── */}
      {pwdModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-6 w-96 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm uppercase tracking-widest text-white flex items-center gap-2"><Key className="w-4 h-4 text-orange-500" /> Changer le mot de passe</h3>
              <button onClick={() => setPwdModal(null)} className="text-zinc-500 hover:text-white"><X className="w-4 h-4" /></button>
            </div>
            <p className="text-xs text-zinc-400">Compte : <span className="text-white font-mono">{pwdModal.username}</span></p>
            <div className="relative">
              <input type={showNewPwd ? 'text' : 'password'}
                className="w-full h-9 px-3 pr-10 rounded-md bg-zinc-800 border border-zinc-700 text-white text-sm font-mono focus:outline-none focus:border-orange-500"
                placeholder="Nouveau mot de passe (min. 6 car.)"
                value={newPwd} onChange={e => setNewPwd(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') changePassword(); }}
              />
              <button className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white" onClick={() => setShowNewPwd(v => !v)}>
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

      {/* ── Add/Edit user modal ── */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-6 w-[440px] space-y-5 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm uppercase tracking-widest text-white flex items-center gap-2">
                <Users className="w-4 h-4 text-orange-500" /> {editId ? "Modifier l'utilisateur" : 'Nouvel utilisateur'}
              </h3>
              <button onClick={() => setModalOpen(false)} className="text-zinc-500 hover:text-white"><X className="w-4 h-4" /></button>
            </div>

            <div className="space-y-3.5">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 flex items-center gap-1.5">
                  Nom d'utilisateur {editId && <InfoTooltip text="Le nom d'utilisateur ne peut pas être modifié après création." />}
                </label>
                <input className="w-full h-9 px-3 rounded-md bg-zinc-800 border border-zinc-700 text-white text-sm font-mono focus:outline-none focus:border-orange-500 disabled:opacity-50"
                  placeholder="ex: jean.operateur" value={form.username}
                  onChange={e => setForm(f => ({ ...f, username: e.target.value }))} disabled={!!editId} />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Nom complet</label>
                <input className="w-full h-9 px-3 rounded-md bg-zinc-800 border border-zinc-700 text-white text-sm focus:outline-none focus:border-orange-500"
                  placeholder="ex: Jean Dupont" value={form.full_name}
                  onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))} />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 flex items-center gap-1.5">
                  Rôle <InfoTooltip text="Détermine les permissions d'accès. Configurez les permissions par rôle dans l'onglet Rôles & Permissions." />
                </label>
                <select className="w-full h-9 px-3 rounded-md bg-zinc-800 border border-zinc-700 text-white text-sm focus:outline-none focus:border-orange-500"
                  value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}>
                  {roles.map(r => <option key={r.name} value={r.name}>{r.label}</option>)}
                </select>
              </div>

              {!editId && (
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Mot de passe (min. 6 car.)</label>
                  <div className="relative">
                    <input type={showPwd ? 'text' : 'password'}
                      className="w-full h-9 px-3 pr-10 rounded-md bg-zinc-800 border border-zinc-700 text-white text-sm font-mono focus:outline-none focus:border-orange-500"
                      placeholder="••••••••" value={form.password}
                      onChange={e => setForm(f => ({ ...f, password: e.target.value }))} />
                    <button className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white" onClick={() => setShowPwd(v => !v)}>
                      {showPwd ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-3 justify-end pt-1">
              <Button variant="ghost" size="sm" onClick={() => setModalOpen(false)}>Annuler</Button>
              <Button size="sm" className="bg-orange-600 hover:bg-orange-700 text-white" onClick={saveUser}
                disabled={saving || !form.username.trim() || (!editId && form.password.length < 6)}>
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : (editId ? 'Enregistrer' : 'Créer')}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── Create role modal ── */}
      {roleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-6 w-[460px] space-y-5 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm uppercase tracking-widest text-white flex items-center gap-2">
                <Plus className="w-4 h-4 text-orange-500" /> Nouveau Rôle Personnalisé
              </h3>
              <button onClick={() => setRoleModal(false)} className="text-zinc-500 hover:text-white"><X className="w-4 h-4" /></button>
            </div>

            <div className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 flex items-center gap-1.5">
                    Identifiant
                    <InfoTooltip text="Identifiant unique, minuscules, sans espaces (ex: chef_equipe)" />
                  </label>
                  <input className="w-full h-9 px-3 rounded-md bg-zinc-800 border border-zinc-700 text-white text-sm font-mono focus:outline-none focus:border-orange-500"
                    placeholder="chef_equipe" value={roleForm.name}
                    onChange={e => setRoleForm(f => ({ ...f, name: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '_') }))} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Libellé affiché</label>
                  <input className="w-full h-9 px-3 rounded-md bg-zinc-800 border border-zinc-700 text-white text-sm focus:outline-none focus:border-orange-500"
                    placeholder="Chef d'équipe" value={roleForm.label}
                    onChange={e => setRoleForm(f => ({ ...f, label: e.target.value }))} />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Description</label>
                <input className="w-full h-9 px-3 rounded-md bg-zinc-800 border border-zinc-700 text-white text-sm focus:outline-none focus:border-orange-500"
                  placeholder="Superviseur de ligne, accès production + rapports" value={roleForm.description}
                  onChange={e => setRoleForm(f => ({ ...f, description: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Permissions initiales (optionnel)</label>
                <div className="grid grid-cols-2 gap-1 max-h-40 overflow-y-auto pr-1">
                  {catalog.map(p => (
                    <label key={p.id} className="flex items-center gap-2 text-xs text-zinc-400 cursor-pointer hover:text-white py-0.5">
                      <input type="checkbox" className="accent-orange-500"
                        checked={roleForm.permissions.includes(p.id)}
                        onChange={() => setRoleForm(f => ({
                          ...f,
                          permissions: f.permissions.includes(p.id)
                            ? f.permissions.filter(x => x !== p.id)
                            : [...f.permissions, p.id],
                        }))} />
                      {p.label}
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-3 justify-end pt-1">
              <Button variant="ghost" size="sm" onClick={() => setRoleModal(false)}>Annuler</Button>
              <Button size="sm" className="bg-orange-600 hover:bg-orange-700 text-white" onClick={createRole}
                disabled={roleSaving || !roleForm.name.trim() || !roleForm.label.trim()}>
                {roleSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Créer le rôle'}
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
          <Button variant="outline" className="border-zinc-800 text-white gap-2 text-xs" onClick={() => { loadUsers(); loadActivity(); loadRoles(); }} disabled={loading}>
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />} Actualiser
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
            <div className="p-2.5 rounded-lg bg-zinc-800 border border-zinc-700"><Icon className={`w-4 h-4 ${color}`} /></div>
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
          <TabsTrigger value="roles" className="gap-2 text-white data-[state=active]:bg-zinc-800">
            <Settings2 className="w-4 h-4" /> Rôles & Permissions
          </TabsTrigger>
        </TabsList>

        {/* ── Utilisateurs ──────────────────────────────────────────────────── */}
        <TabsContent value="users" className="space-y-4">
          <Card className="bg-zinc-900/50 border-zinc-800">
            <div className="p-4 border-b border-zinc-800 flex gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                <Input placeholder="Rechercher par nom d'utilisateur, nom complet ou rôle…"
                  className="pl-10 bg-zinc-800 border-zinc-700 text-white text-sm h-9"
                  value={search} onChange={e => setSearch(e.target.value)} />
              </div>
              <select
                className="h-9 px-3 rounded-md bg-zinc-800 border border-zinc-700 text-white text-sm focus:outline-none focus:border-orange-500"
                value={roleFilter} onChange={e => setRoleFilter(e.target.value)}>
                <option value="all">Tous les rôles</option>
                {roles.map(r => <option key={r.name} value={r.name}>{r.label}</option>)}
              </select>
            </div>

            <div className="overflow-hidden">
              <Table>
                <TableHeader className="bg-zinc-900/80">
                  <TableRow className="border-zinc-800 hover:bg-transparent">
                    <TableHead className="text-zinc-500 text-[10px] uppercase tracking-widest font-bold">Profil</TableHead>
                    <TableHead className="text-zinc-500 text-[10px] uppercase tracking-widest font-bold">Rôle</TableHead>
                    <TableHead className="text-zinc-500 text-[10px] uppercase tracking-widest font-bold">État</TableHead>
                    <TableHead className="text-zinc-500 text-[10px] uppercase tracking-widest font-bold">
                      <div className="flex items-center gap-1">Dernière connexion
                        <InfoTooltip text="Horodatage de la dernière connexion réussie." />
                      </div>
                    </TableHead>
                    <TableHead className="text-zinc-500 text-[10px] uppercase tracking-widest font-bold text-center">
                      <div className="flex items-center justify-center gap-1">Connexions
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
                        <TableCell colSpan={6}><div className="h-8 bg-zinc-800 rounded animate-pulse" /></TableCell>
                      </TableRow>
                    ))
                  ) : filtered.length === 0 ? (
                    <TableRow className="border-zinc-800">
                      <TableCell colSpan={6} className="text-center py-10 text-zinc-500 text-sm">
                        {search || roleFilter !== 'all' ? 'Aucun résultat pour ce filtre.' : 'Aucun utilisateur. Cliquez sur "Nouvel Utilisateur".'}
                      </TableCell>
                    </TableRow>
                  ) : filtered.map(u => (
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
                        <Badge variant="outline" className={`text-[10px] font-bold ${roleBadgeClass(u.role, roles)}`}>
                          {roleLabel(u.role, roles)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full flex-shrink-0 ${u.is_active ? 'bg-green-500 shadow-[0_0_6px_rgba(34,197,94,0.4)]' : 'bg-zinc-600'}`} />
                          <span className={`text-xs ${u.is_active ? 'text-green-400' : 'text-zinc-500'}`}>{u.is_active ? 'Actif' : 'Inactif'}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-zinc-400 text-xs font-mono">{fmtDate(u.last_login)}</TableCell>
                      <TableCell className="text-center"><span className="text-sm font-mono text-zinc-300">{u.login_count}</span></TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <TooltipProvider delayDuration={200}><Tooltip>
                            <TooltipTrigger asChild>
                              <Button variant="ghost" size="icon" className={`h-8 w-8 ${u.is_active ? 'text-zinc-500 hover:text-yellow-400' : 'text-zinc-500 hover:text-green-400'}`} onClick={() => toggleActive(u)}>
                                {u.is_active ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent className="text-xs bg-zinc-900 border-zinc-700">{u.is_active ? 'Désactiver' : 'Activer'}</TooltipContent>
                          </Tooltip></TooltipProvider>
                          <TooltipProvider delayDuration={200}><Tooltip>
                            <TooltipTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-500 hover:text-orange-400" onClick={() => { setPwdModal(u); setNewPwd(''); setShowNewPwd(false); }}>
                                <Key className="w-4 h-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent className="text-xs bg-zinc-900 border-zinc-700">Changer le mot de passe</TooltipContent>
                          </Tooltip></TooltipProvider>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-500 hover:text-white" onClick={() => openEdit(u)}><Edit2 className="w-4 h-4" /></Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-500 hover:text-red-400" onClick={() => setConfirmDelete(u)} disabled={deleting === u.id}>
                            {deleting === u.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
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

        {/* ── Historique ────────────────────────────────────────────────────── */}
        <TabsContent value="activity">
          <Card className="bg-zinc-900/50 border-zinc-800">
            <div className="flex items-center justify-between p-4 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-orange-500" />
                <h3 className="text-sm font-bold text-white uppercase tracking-widest">Journal d'activité</h3>
                <InfoTooltip text="Connexions, échecs d'authentification, créations/suppressions de comptes. 50 dernières entrées." />
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
                      <TableRow key={i} className="border-zinc-800"><TableCell colSpan={5}><div className="h-6 bg-zinc-800 rounded animate-pulse" /></TableCell></TableRow>
                    ))
                  ) : activity.length === 0 ? (
                    <TableRow className="border-zinc-800">
                      <TableCell colSpan={5} className="text-center py-10 text-zinc-500 text-sm">
                        Aucune activité enregistrée. Les connexions via <span className="font-mono text-zinc-400">POST /token</span> seront journalisées ici.
                      </TableCell>
                    </TableRow>
                  ) : activity.map(a => (
                    <TableRow key={a.id} className="border-zinc-800 hover:bg-zinc-800/20 transition-colors">
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Avatar className="h-6 w-6"><AvatarFallback className="bg-zinc-800 text-zinc-400 text-[9px] font-bold">{a.username.substring(0, 2).toUpperCase()}</AvatarFallback></Avatar>
                          <span className="text-xs font-mono text-white">{a.username}</span>
                        </div>
                      </TableCell>
                      <TableCell><span className={`text-xs font-bold ${actionColor(a.action)}`}>{actionLabel(a.action)}</span></TableCell>
                      <TableCell className="font-mono text-zinc-400 text-[10px]">{a.ip_address ?? '—'}</TableCell>
                      <TableCell className="text-zinc-500 text-[10px] max-w-[200px]">
                        {a.user_agent ? (
                          <TooltipProvider delayDuration={200}><Tooltip>
                            <TooltipTrigger className="flex items-center gap-1.5 truncate max-w-[200px]">
                              <Monitor className="w-3 h-3 text-zinc-600 flex-shrink-0" />
                              <span className="truncate">{a.user_agent}</span>
                            </TooltipTrigger>
                            <TooltipContent className="text-xs bg-zinc-900 border-zinc-700 max-w-xs">{a.user_agent}</TooltipContent>
                          </Tooltip></TooltipProvider>
                        ) : '—'}
                      </TableCell>
                      <TableCell className="text-zinc-500 text-[11px] font-mono whitespace-nowrap">{fmtDate(a.timestamp)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </Card>
        </TabsContent>

        {/* ── Rôles & Permissions ───────────────────────────────────────────── */}
        <TabsContent value="roles">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* Left: Role list */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">Rôles</h3>
                <Button size="sm" className="h-7 text-[10px] bg-orange-600 hover:bg-orange-700 text-white gap-1" onClick={() => { setRoleForm(EMPTY_ROLE_FORM); setRoleModal(true); }}>
                  <Plus className="w-3 h-3" /> Nouveau
                </Button>
              </div>

              {roles.map(r => (
                <Card
                  key={r.id}
                  className={`p-4 cursor-pointer transition-all border-2 ${
                    selectedRole?.id === r.id
                      ? 'border-orange-500/60 bg-orange-500/5'
                      : `${roleCardColor(r.name)} hover:border-zinc-600`
                  }`}
                  onClick={() => { setSelectedRole(r); setDescDraft(r.description ?? ''); }}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <ShieldCheck className={`w-4 h-4 shrink-0 ${roleIconColor(r.name)}`} />
                      <div className="min-w-0">
                        <p className={`text-sm font-bold ${roleIconColor(r.name)} truncate`}>{r.label}</p>
                        <p className="text-[10px] text-zinc-500 font-mono">{r.name}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      {r.is_builtin ? (
                        <Badge variant="outline" className="text-[9px] border-zinc-700 text-zinc-500 px-1.5">Intégré</Badge>
                      ) : (
                        <Badge variant="outline" className="text-[9px] border-purple-500/30 text-purple-400 px-1.5">Custom</Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-3 pt-2 border-t border-white/5">
                    <span className="text-[10px] text-zinc-500">{r.permissions.length} permissions</span>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-[9px] bg-zinc-900 border-zinc-800 text-zinc-400 font-mono">
                        {r.user_count} user{r.user_count !== 1 ? 's' : ''}
                      </Badge>
                      {!r.is_builtin && (
                        <Button
                          size="icon" variant="ghost"
                          className="h-5 w-5 text-zinc-600 hover:text-red-400"
                          title="Supprimer ce rôle"
                          disabled={deletingRole === r.id || r.user_count > 0}
                          onClick={e => { e.stopPropagation(); setConfirmDeleteRole(r); }}
                        >
                          {deletingRole === r.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              ))}

              {/* Security note */}
              <Card className="p-4 bg-zinc-900/50 border-zinc-800 mt-2">
                <div className="flex items-start gap-2">
                  <Lock className="w-3.5 h-3.5 text-zinc-600 mt-0.5 shrink-0" />
                  <p className="text-[10px] text-zinc-500 leading-relaxed">
                    Mots de passe hachés avec <span className="font-mono text-zinc-400">bcrypt</span>. Tokens JWT expirent après <span className="font-mono text-zinc-400">30 min</span>.
                  </p>
                </div>
              </Card>
            </div>

            {/* Right: Permission editor */}
            <div className="lg:col-span-2">
              {!selectedRole ? (
                <Card className="p-12 bg-zinc-900/50 border-zinc-800 flex flex-col items-center justify-center text-zinc-500 gap-3">
                  <Shield className="w-10 h-10 opacity-20" />
                  <p className="text-sm">Sélectionnez un rôle pour gérer ses permissions</p>
                </Card>
              ) : (
                <Card className="bg-zinc-900/50 border-zinc-800 overflow-hidden">
                  {/* Role header */}
                  <div className="p-5 border-b border-zinc-800">
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center gap-2">
                          <ShieldCheck className={`w-5 h-5 ${roleIconColor(selectedRole.name)}`} />
                          <h3 className={`font-bold text-base ${roleIconColor(selectedRole.name)}`}>{selectedRole.label}</h3>
                          {selectedRole.is_builtin
                            ? <Badge variant="outline" className="text-[9px] border-zinc-700 text-zinc-500">Intégré</Badge>
                            : <Badge variant="outline" className="text-[9px] border-purple-500/30 text-purple-400">Personnalisé</Badge>
                          }
                        </div>
                        {editRoleDesc && !selectedRole.is_builtin ? (
                          <input
                            className="w-full h-7 px-2 rounded bg-zinc-800 border border-zinc-700 text-xs text-zinc-300 focus:outline-none focus:border-orange-500"
                            value={descDraft}
                            onChange={e => setDescDraft(e.target.value)}
                            onBlur={() => setEditRoleDesc(false)}
                            autoFocus
                          />
                        ) : (
                          <p className="text-xs text-zinc-400 leading-relaxed cursor-text"
                            onClick={() => { if (!selectedRole.is_builtin) { setEditRoleDesc(true); setDescDraft(selectedRole.description ?? ''); } }}>
                            {selectedRole.description || <span className="italic text-zinc-600">Aucune description. Cliquez pour ajouter.</span>}
                          </p>
                        )}
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-[10px] text-zinc-500 uppercase tracking-widest">Utilisateurs</p>
                        <p className="text-2xl font-bold text-white font-mono">{selectedRole.user_count}</p>
                      </div>
                    </div>

                    {/* Global toggles */}
                    <div className="flex gap-2 mt-4">
                      <Button size="sm" variant="outline" className="h-6 text-[10px] border-zinc-700 text-zinc-400 hover:text-white"
                        onClick={() => setEditedPerms(new Set(catalog.map(p => p.id)))}>
                        Tout activer
                      </Button>
                      <Button size="sm" variant="outline" className="h-6 text-[10px] border-zinc-700 text-zinc-400 hover:text-white"
                        onClick={() => setEditedPerms(new Set())}>
                        Tout désactiver
                      </Button>
                      <span className="ml-auto text-[10px] text-zinc-500 self-center font-mono">{editedPerms.size}/{catalog.length} actives</span>
                    </div>
                  </div>

                  {/* Permission groups */}
                  <div className="divide-y divide-zinc-800 overflow-auto" style={{ maxHeight: '52vh' }}>
                    {grouped.map(([group, perms]) => {
                      const allOn = perms.every(p => editedPerms.has(p.id));
                      const someOn = perms.some(p => editedPerms.has(p.id));
                      const expanded = expandedGroups.has(group);
                      return (
                        <div key={group}>
                          {/* Group header */}
                          <button
                            className="w-full flex items-center justify-between px-5 py-3 hover:bg-zinc-800/30 transition-colors"
                            onClick={() => toggleExpandGroup(group)}
                          >
                            <div className="flex items-center gap-3">
                              <input
                                type="checkbox"
                                className="accent-orange-500 w-3.5 h-3.5"
                                checked={allOn}
                                ref={el => { if (el) el.indeterminate = someOn && !allOn; }}
                                onChange={() => toggleGroup(group, perms)}
                                onClick={e => e.stopPropagation()}
                              />
                              <span className="text-xs font-bold text-zinc-300 uppercase tracking-wider">{group}</span>
                              <Badge variant="secondary" className="text-[9px] bg-zinc-800 border-zinc-700 text-zinc-500">
                                {perms.filter(p => editedPerms.has(p.id)).length}/{perms.length}
                              </Badge>
                            </div>
                            {expanded
                              ? <ChevronDown className="w-3.5 h-3.5 text-zinc-500" />
                              : <ChevronRight className="w-3.5 h-3.5 text-zinc-500" />}
                          </button>

                          {/* Permissions list */}
                          {expanded && (
                            <div className="px-5 pb-3 space-y-1 bg-zinc-900/30">
                              {perms.map(p => (
                                <label key={p.id} className="flex items-center gap-3 py-1.5 cursor-pointer group hover:bg-zinc-800/20 px-2 rounded-md transition-colors">
                                  <input
                                    type="checkbox"
                                    className="accent-orange-500 w-3.5 h-3.5 shrink-0"
                                    checked={editedPerms.has(p.id)}
                                    onChange={() => togglePerm(p.id)}
                                  />
                                  <span className={`text-sm flex-1 ${editedPerms.has(p.id) ? 'text-zinc-200' : 'text-zinc-500'}`}>{p.label}</span>
                                  <span className="text-[9px] font-mono text-zinc-700 group-hover:text-zinc-500 transition-colors">{p.id}</span>
                                </label>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Save footer */}
                  <div className="p-4 border-t border-zinc-800 flex items-center justify-between">
                    {permsDirty ? (
                      <span className="text-xs text-yellow-400 flex items-center gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5" /> Modifications non sauvegardées
                      </span>
                    ) : (
                      <span className="text-xs text-zinc-600">Aucune modification en attente</span>
                    )}
                    <Button
                      size="sm"
                      className="bg-orange-600 hover:bg-orange-700 text-white gap-2"
                      onClick={saveRolePermissions}
                      disabled={permSaving || !permsDirty}
                    >
                      {permSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                      Enregistrer
                    </Button>
                  </div>
                </Card>
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

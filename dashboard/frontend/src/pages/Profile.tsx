import { useEffect, useRef, useState } from 'react';
import {
  User, Shield, Key, LogOut, Save, Lock, Loader2,
  CheckCircle2, AlertCircle, RefreshCw, Eye, EyeOff,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { useLocation } from 'wouter';
import { fetchApi } from '@/lib/api';

const ROLE_LABELS: Record<string, string> = {
  admin: 'Administrateur', operator: 'Opérateur', viewer: 'Observateur',
};
const ROLE_COLORS: Record<string, string> = {
  admin: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
  operator: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  viewer: 'bg-zinc-700/30 text-zinc-400 border-zinc-600/30',
};

export default function Profile() {
  const { user, logout, login } = useAuth();
  const [, setLocation] = useLocation();

  const [fullName, setFullName] = useState('');
  const [saving, setSaving]     = useState(false);

  const [curPwd, setCurPwd]     = useState('');
  const [newPwd, setNewPwd]     = useState('');
  const [confPwd, setConfPwd]   = useState('');
  const [showCur, setShowCur]   = useState(false);
  const [showNew, setShowNew]   = useState(false);
  const [pwdSaving, setPwdSaving] = useState(false);

  const [flash, setFlash] = useState<{ text: string; ok: boolean } | null>(null);
  const flashTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (user) setFullName(user.full_name);
  }, [user]);

  const showFlash = (text: string, ok = true) => {
    if (flashTimer.current) clearTimeout(flashTimer.current);
    setFlash({ text, ok });
    flashTimer.current = setTimeout(() => setFlash(null), 4000);
  };

  const handleLogout = () => { logout(); setLocation('/login'); };

  // Save profile (full_name)
  const saveProfile = async () => {
    if (!user) return;
    if (!fullName.trim()) { showFlash('Le nom ne peut pas être vide.', false); return; }
    setSaving(true);
    try {
      await fetchApi(`/api/users/${user.id}`, {
        method: 'PUT',
        body: JSON.stringify({ full_name: fullName.trim() }),
      });
      showFlash('Profil mis à jour.');
    } catch {
      showFlash('Erreur réseau.', false);
    } finally {
      setSaving(false);
    }
  };

  // Change password
  const changePassword = async () => {
    if (!user) return;
    if (!curPwd) { showFlash('Saisissez le mot de passe actuel.', false); return; }
    if (newPwd.length < 6) { showFlash('Le nouveau mot de passe doit contenir au moins 6 caractères.', false); return; }
    if (newPwd !== confPwd) { showFlash('Les mots de passe ne correspondent pas.', false); return; }
    setPwdSaving(true);
    try {
      await fetchApi('/api/users/me/password', {
        method: 'PATCH',
        body: JSON.stringify({ current_password: curPwd, new_password: newPwd }),
      });
      showFlash('Mot de passe modifié avec succès.');
      setCurPwd(''); setNewPwd(''); setConfPwd('');
    } catch {
      showFlash('Erreur réseau.', false);
    } finally {
      setPwdSaving(false);
    }
  };

  if (!user) return null;

  const initials = user.full_name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  const roleLabel = ROLE_LABELS[user.role] ?? user.role;
  const roleColor = ROLE_COLORS[user.role] ?? ROLE_COLORS.viewer;

  return (
    <div className="p-6 space-y-6">
      {/* Flash */}
      {flash && (
        <div className={`fixed top-4 right-4 z-50 flex items-center gap-3 px-4 py-3 rounded-lg border text-sm font-medium shadow-lg
          ${flash.ok ? 'bg-green-900/90 border-green-700 text-green-200' : 'bg-red-900/90 border-red-700 text-red-200'}`}>
          {flash.ok ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          {flash.text}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Mon Profil</h1>
          <p className="text-muted-foreground text-sm">Gérez vos informations personnelles et votre sécurité</p>
        </div>
        <Button
          variant="destructive"
          className="bg-red-950/20 text-red-400 border border-red-900/50 hover:bg-red-950/40 gap-2"
          onClick={handleLogout}
        >
          <LogOut className="w-4 h-4" /> Déconnexion
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ── Left column ── */}
        <div className="space-y-6">

          {/* Avatar card */}
          <Card className="p-8 bg-zinc-900/50 border-zinc-800 flex flex-col items-center text-center">
            <Avatar className="h-24 w-24 border-2 border-orange-500 ring-4 ring-orange-500/10 mb-4">
              <AvatarFallback className="bg-orange-500/10 text-orange-400 text-3xl font-bold font-mono">
                {initials}
              </AvatarFallback>
            </Avatar>
            <h3 className="text-xl font-bold text-white">{user.full_name}</h3>
            <p className="text-zinc-500 text-xs font-mono mt-0.5">@{user.username}</p>
            <Badge className={`mt-3 text-[10px] font-bold uppercase border ${roleColor}`}>
              {roleLabel}
            </Badge>

            <div className="mt-6 w-full pt-6 border-t border-zinc-800 space-y-2.5">
              <div className="flex justify-between text-xs">
                <span className="text-zinc-500">Statut</span>
                <span className={`font-bold ${user.is_active ? 'text-green-400' : 'text-red-400'}`}>
                  {user.is_active ? 'Actif' : 'Inactif'}
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-zinc-500">Rôle</span>
                <span className="text-zinc-300">{roleLabel}</span>
              </div>
            </div>
          </Card>

          {/* Permissions card */}
          <Card className="p-6 bg-zinc-900/50 border-zinc-800 space-y-4">
            <div className="flex items-center gap-2 font-bold text-white text-xs uppercase tracking-widest border-b border-zinc-800 pb-4">
              <Shield className="w-4 h-4 text-orange-500" />
              <span>Mes Permissions</span>
            </div>
            {user.role === 'admin' ? (
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-orange-500/10 border border-orange-500/20">
                <Shield className="w-4 h-4 text-orange-400 shrink-0" />
                <p className="text-xs text-orange-300">Accès complet au système</p>
              </div>
            ) : user.permissions.length === 0 ? (
              <p className="text-xs text-zinc-600 italic">Aucune permission assignée.</p>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {user.permissions.map(p => (
                  <span key={p} className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 border border-zinc-700">
                    {p}
                  </span>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* ── Right column ── */}
        <div className="lg:col-span-2 space-y-6">

          {/* Personal info */}
          <Card className="p-6 bg-zinc-900/50 border-zinc-800 space-y-5">
            <div className="flex items-center gap-2 font-bold text-white text-xs uppercase tracking-widest border-b border-zinc-800 pb-4">
              <User className="w-4 h-4 text-orange-500" />
              <span>Informations Personnelles</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-2">
                <Label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Nom Complet</Label>
                <Input
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  className="bg-zinc-950 border-zinc-800 text-white h-11"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Identifiant</Label>
                <Input
                  value={user.username}
                  readOnly
                  className="bg-zinc-950/50 border-zinc-800 text-zinc-500 h-11 cursor-not-allowed"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Rôle</Label>
                <Input
                  value={roleLabel}
                  readOnly
                  className="bg-zinc-950/50 border-zinc-800 text-zinc-500 h-11 cursor-not-allowed"
                />
              </div>
            </div>
            <div className="flex justify-end pt-2">
              <Button
                className="bg-orange-600 hover:bg-orange-700 text-white font-bold h-10 px-8 gap-2"
                onClick={saveProfile}
                disabled={saving}
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Enregistrer
              </Button>
            </div>
          </Card>

          {/* Change password */}
          <Card className="p-6 bg-zinc-900/50 border-zinc-800 space-y-5">
            <div className="flex items-center gap-2 font-bold text-white text-xs uppercase tracking-widest border-b border-zinc-800 pb-4">
              <Lock className="w-4 h-4 text-orange-500" />
              <span>Changer le Mot de Passe</span>
            </div>
            <div className="space-y-4">
              {/* Current */}
              <div className="space-y-2">
                <Label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Mot de passe actuel</Label>
                <div className="relative">
                  <Input
                    type={showCur ? 'text' : 'password'}
                    value={curPwd}
                    onChange={e => setCurPwd(e.target.value)}
                    placeholder="••••••••"
                    className="bg-zinc-950 border-zinc-800 text-white h-11 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCur(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white transition-colors"
                  >
                    {showCur ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              {/* New + confirm */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Nouveau mot de passe</Label>
                  <div className="relative">
                    <Input
                      type={showNew ? 'text' : 'password'}
                      value={newPwd}
                      onChange={e => setNewPwd(e.target.value)}
                      placeholder="Min. 6 caractères"
                      className="bg-zinc-950 border-zinc-800 text-white h-11 pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNew(v => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white transition-colors"
                    >
                      {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {/* Strength bar */}
                  {newPwd.length > 0 && (
                    <div className="flex gap-1 pt-1">
                      {[1, 2, 3, 4].map(i => (
                        <div key={i} className={`h-1 flex-1 rounded-full transition-colors ${
                          newPwd.length >= i * 3
                            ? i <= 1 ? 'bg-red-500' : i <= 2 ? 'bg-yellow-500' : i <= 3 ? 'bg-blue-500' : 'bg-green-500'
                            : 'bg-zinc-800'
                        }`} />
                      ))}
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Confirmer</Label>
                  <Input
                    type="password"
                    value={confPwd}
                    onChange={e => setConfPwd(e.target.value)}
                    placeholder="••••••••"
                    className={`bg-zinc-950 border-zinc-800 text-white h-11 ${
                      confPwd && confPwd !== newPwd ? 'border-red-500/50' : ''
                    }`}
                  />
                  {confPwd && confPwd !== newPwd && (
                    <p className="text-[10px] text-red-400">Les mots de passe ne correspondent pas</p>
                  )}
                </div>
              </div>
            </div>
            <div className="flex justify-end pt-2">
              <Button
                className="bg-orange-600 hover:bg-orange-700 text-white font-bold h-10 px-8 gap-2"
                onClick={changePassword}
                disabled={pwdSaving || !curPwd || !newPwd || newPwd !== confPwd}
              >
                {pwdSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Key className="w-4 h-4" />}
                Modifier le Mot de Passe
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

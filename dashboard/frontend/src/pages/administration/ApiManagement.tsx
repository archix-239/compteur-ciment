import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Key, Plus, Trash2, Copy, Eye, EyeOff, Shield, Clock,
  Loader2, CheckCircle2, AlertCircle, RefreshCw, AlertTriangle,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { API_URL, fetchApi } from '@/lib/api';

// ── Types ──────────────────────────────────────────────────────────────────────

interface ApiKeyRow {
  id: number;
  name: string;
  key_prefix: string;
  scope: string;
  created_at: string | null;
  last_used_at: string | null;
}

const SCOPE_META: Record<string, { label: string; color: string }> = {
  read:  { label: 'Lecture seule', color: 'text-blue-400 bg-blue-500/10 border-blue-500/20' },
  write: { label: 'Lecture / Écriture', color: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20' },
  admin: { label: 'Administrateur', color: 'text-orange-400 bg-orange-500/10 border-orange-500/20' },
};

function formatDate(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('fr-FR', { day: '2-digit', month: 'short', year: '2-digit', hour: '2-digit', minute: '2-digit' });
}

// ── Component ──────────────────────────────────────────────────────────────────

export default function ApiManagement() {
  const [keys, setKeys]       = useState<ApiKeyRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  // Create form
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName]       = useState('');
  const [newScope, setNewScope]     = useState('read');

  // Newly created key (show raw once)
  const [newRawKey, setNewRawKey]   = useState<string | null>(null);
  const [rawVisible, setRawVisible] = useState(false);
  const [copied, setCopied]         = useState(false);

  // Revoke confirm
  const [revokeId, setRevokeId]     = useState<number | null>(null);
  const [revoking, setRevoking]     = useState(false);

  // Flash
  const [flash, setFlash] = useState<{ text: string; ok: boolean } | null>(null);
  const flashTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const showFlash = (text: string, ok = true) => {
    if (flashTimer.current) clearTimeout(flashTimer.current);
    setFlash({ text, ok });
    flashTimer.current = setTimeout(() => setFlash(null), 4000);
  };

  const loadKeys = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchApi('/api/apikeys/');
      setKeys(data);
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { loadKeys(); }, [loadKeys]);

  const createKey = async () => {
    if (!newName.trim()) { showFlash('Le nom est requis.', false); return; }
    setCreating(true);
    try {
      const data = await fetchApi('/api/apikeys/', {
        method: 'POST',
        body: JSON.stringify({ name: newName.trim(), scope: newScope }),
      });
      setNewRawKey(data.raw_key);
      setRawVisible(true);
      setShowCreate(false);
      setNewName(''); setNewScope('read');
      await loadKeys();
    } catch {
      showFlash('Erreur lors de la création.', false);
    } finally {
      setCreating(false);
    }
  };

  const revokeKey = async () => {
    if (revokeId === null) return;
    setRevoking(true);
    try {
      await fetchApi(`/api/apikeys/${revokeId}`, { method: 'DELETE' });
      showFlash('Clé révoquée.');
      await loadKeys();
    } catch {
      showFlash('Erreur réseau.', false);
    } finally {
      setRevoking(false);
      setRevokeId(null);
    }
  };

  const copyKey = async (key: string) => {
    await navigator.clipboard.writeText(key);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

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

      {/* Revoke confirm */}
      <AlertDialog open={revokeId !== null} onOpenChange={o => { if (!o) setRevokeId(null); }}>
        <AlertDialogContent className="bg-zinc-900 border-zinc-800">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-400" /> Révoquer la clé API ?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-zinc-400">
              Cette action est irréversible. Toutes les applications utilisant cette clé perdront immédiatement leur accès.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-zinc-700 text-zinc-300">Annuler</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-700 hover:bg-red-800 text-white"
              onClick={revokeKey}
              disabled={revoking}
            >
              {revoking ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Révoquer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Gestion des API</h1>
          <p className="text-muted-foreground text-sm">Créez et gérez les clés d'accès pour les intégrations externes</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="border-zinc-800 text-white gap-2 h-10" onClick={loadKeys} disabled={loading}>
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          </Button>
          <Button className="bg-orange-600 hover:bg-orange-700 text-white gap-2 h-10" onClick={() => setShowCreate(v => !v)}>
            <Plus className="w-4 h-4" /> Nouvelle Clé API
          </Button>
        </div>
      </div>

      {/* New raw key banner (shown once after creation) */}
      {newRawKey && (
        <Card className="p-5 bg-green-900/20 border-green-700/50 space-y-3">
          <div className="flex items-center gap-2 text-green-300 font-bold text-sm">
            <CheckCircle2 className="w-5 h-5" />
            Clé créée — copiez-la maintenant, elle ne sera plus affichée
          </div>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Input
                readOnly
                type={rawVisible ? 'text' : 'password'}
                value={newRawKey}
                className="bg-zinc-950 border-zinc-700 text-green-300 font-mono text-xs h-11 pr-24"
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
                <button
                  type="button"
                  onClick={() => setRawVisible(v => !v)}
                  className="p-1.5 text-zinc-500 hover:text-white transition-colors"
                >
                  {rawVisible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
                <button
                  type="button"
                  onClick={() => copyKey(newRawKey)}
                  className="p-1.5 text-zinc-500 hover:text-white transition-colors"
                >
                  {copied ? <CheckCircle2 className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <Button
              className="bg-green-700 hover:bg-green-800 text-white h-11 px-4"
              onClick={() => copyKey(newRawKey)}
            >
              {copied ? 'Copié !' : 'Copier'}
            </Button>
            <Button variant="outline" className="border-zinc-700 text-zinc-400 h-11" onClick={() => setNewRawKey(null)}>
              Fermer
            </Button>
          </div>
        </Card>
      )}

      {/* Create form */}
      {showCreate && (
        <Card className="p-6 bg-zinc-900/50 border-zinc-800 space-y-4">
          <h3 className="text-sm font-bold text-white uppercase tracking-widest border-b border-zinc-800 pb-3">
            Nouvelle Clé API
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <div className="md:col-span-2 space-y-2">
              <Label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Nom / Description</Label>
              <Input
                value={newName}
                onChange={e => setNewName(e.target.value)}
                placeholder="ex: Intégration ERP SAP"
                className="bg-zinc-950 border-zinc-800 text-white h-11"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Niveau d'accès</Label>
              <Select value={newScope} onValueChange={setNewScope}>
                <SelectTrigger className="bg-zinc-950 border-zinc-800 text-white h-11">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-zinc-950 border-zinc-800 text-white">
                  <SelectItem value="read">Lecture seule</SelectItem>
                  <SelectItem value="write">Lecture / Écriture</SelectItem>
                  <SelectItem value="admin">Administrateur</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" className="border-zinc-800 text-zinc-400" onClick={() => setShowCreate(false)}>Annuler</Button>
            <Button
              className="bg-orange-600 hover:bg-orange-700 text-white gap-2"
              onClick={createKey}
              disabled={creating || !newName.trim()}
            >
              {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Key className="w-4 h-4" />}
              Générer la Clé
            </Button>
          </div>
        </Card>
      )}

      {/* Keys table */}
      <Card className="bg-zinc-900/50 border-zinc-800 overflow-hidden">
        <div className="px-5 py-4 border-b border-zinc-800 flex items-center justify-between">
          <h3 className="text-xs font-bold text-white uppercase tracking-widest">Clés Actives ({keys.length})</h3>
        </div>
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-6 h-6 text-orange-500 animate-spin" />
          </div>
        ) : keys.length === 0 ? (
          <div className="text-center py-12 text-zinc-500">
            <Key className="w-10 h-10 mx-auto mb-3 opacity-20" />
            <p className="text-sm italic">Aucune clé API active.</p>
            <p className="text-xs text-zinc-600 mt-1">Créez une clé pour permettre l'accès aux intégrations externes.</p>
          </div>
        ) : (
          <Table>
            <TableHeader className="bg-zinc-950">
              <TableRow className="border-zinc-800 hover:bg-transparent">
                <TableHead className="text-zinc-500 text-[10px] uppercase font-bold h-11 pl-6">Nom</TableHead>
                <TableHead className="text-zinc-500 text-[10px] uppercase font-bold h-11">Clé</TableHead>
                <TableHead className="text-zinc-500 text-[10px] uppercase font-bold h-11">Accès</TableHead>
                <TableHead className="text-zinc-500 text-[10px] uppercase font-bold h-11">Créée le</TableHead>
                <TableHead className="text-zinc-500 text-[10px] uppercase font-bold h-11">Dernière util.</TableHead>
                <TableHead className="text-zinc-500 text-[10px] uppercase font-bold h-11 text-right pr-6">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {keys.map(k => {
                const scope = SCOPE_META[k.scope] ?? { label: k.scope, color: 'text-zinc-400 bg-zinc-800 border-zinc-700' };
                return (
                  <TableRow key={k.id} className="border-zinc-800 hover:bg-zinc-800/20">
                    <TableCell className="pl-6">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-orange-500/10 border border-orange-500/20 flex items-center justify-center shrink-0">
                          <Key className="w-3.5 h-3.5 text-orange-400" />
                        </div>
                        <span className="text-sm font-medium text-white">{k.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono text-zinc-400 bg-zinc-950 px-2 py-1 rounded border border-zinc-800">
                          {k.key_prefix}
                        </span>
                        <Shield className="w-3 h-3 text-zinc-600" />
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className={`text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full border ${scope.color}`}>
                        {scope.label}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5 text-xs text-zinc-400">
                        <Clock className="w-3 h-3 text-zinc-600" />
                        {formatDate(k.created_at)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-xs text-zinc-500">{formatDate(k.last_used_at)}</span>
                    </TableCell>
                    <TableCell className="text-right pr-6">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 text-red-400 hover:text-red-300 hover:bg-red-500/10 gap-1.5 text-xs"
                        onClick={() => setRevokeId(k.id)}
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Révoquer
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </Card>

      {/* Info box */}
      <Card className="p-5 bg-zinc-900/30 border-zinc-800/50 space-y-3">
        <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Comment utiliser une clé API</h4>
        <div className="space-y-2 text-xs text-zinc-500 font-mono">
          <p>Inclure dans l'en-tête de chaque requête :</p>
          <code className="block bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-zinc-300">
            Authorization: Bearer {'<votre_clé>'}
          </code>
          <p className="font-sans text-zinc-600 italic">
            Exemple : <span className="text-zinc-500">GET {API_URL}/api/dashboard/summary</span>
          </p>
        </div>
      </Card>
    </div>
  );
}

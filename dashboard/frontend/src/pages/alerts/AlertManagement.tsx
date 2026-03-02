import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Bell,
  Volume2,
  VolumeX,
  Settings2,
  CheckCircle2,
  Clock,
  AlertOctagon,
  Mail,
  MessageSquare,
  Zap,
  Trash2,
  ChevronRight,
  Loader2,
  RefreshCw,
  ShieldAlert,
  PhoneCall,
  ToggleLeft,
  Plus,
  X,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { API_URL } from '@/lib/api';

// ── Types ──────────────────────────────────────────────────────────────────────

interface AlertItem {
  id: number;
  rule_id: number | null;
  timestamp: string;
  message: string;
  title: string;
  is_read: boolean;
  alert_type: 'critical' | 'warning' | 'info';
}

interface AlertRule {
  id: number;
  name: string;
  type: string;
  threshold: number;
  is_active: boolean;
}

interface AlertSettings {
  sound_enabled: boolean;
  sound_volume: number;
  email_enabled: boolean;
  slack_enabled: boolean;
  supervisor_phone: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function timeAgo(isoString: string): string {
  const diff = (Date.now() - new Date(isoString).getTime()) / 1000;
  if (diff < 60) return `il y a ${Math.floor(diff)}s`;
  if (diff < 3600) return `il y a ${Math.floor(diff / 60)}min`;
  if (diff < 86400) return `il y a ${Math.floor(diff / 3600)}h`;
  return `il y a ${Math.floor(diff / 86400)}j`;
}

function ruleTypeLabel(type: string): string {
  if (type === 'production_rate') return 'Cadence (sacs/min)';
  if (type === 'error_rate') return 'Taux de rejet (%)';
  return type;
}

function ruleTypeDescription(type: string): string {
  if (type === 'production_rate') return 'Alerte si la cadence descend sous ce seuil';
  if (type === 'error_rate') return 'Alerte si le taux de rejet dépasse ce seuil';
  return '';
}

// ── InfoTooltip ───────────────────────────────────────────────────────────────

function InfoTooltip({ text, side = 'top' }: { text: string; side?: 'top' | 'right' | 'bottom' | 'left' }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-zinc-800 hover:bg-zinc-600 text-zinc-400 hover:text-zinc-100 transition-colors cursor-help ml-1.5 shrink-0"
        >
          <span className="text-[9px] font-bold leading-none select-none">?</span>
        </button>
      </TooltipTrigger>
      <TooltipContent
        side={side}
        className="max-w-[240px] bg-zinc-900 border border-zinc-700 text-zinc-300 text-xs leading-relaxed whitespace-normal"
      >
        {text}
      </TooltipContent>
    </Tooltip>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────

const RULE_TYPE_OPTIONS = [
  { value: 'production_rate', label: 'Cadence de production (sacs/min)', hint: 'Déclenche si la cadence descend SOUS le seuil', alertType: 'warning' },
  { value: 'error_rate',      label: 'Taux de rejet (%)',                hint: 'Déclenche si le taux de rejet dépasse le seuil', alertType: 'critical' },
  { value: 'consistency',     label: 'Score de consistance (%)',          hint: 'Déclenche si la consistance descend SOUS le seuil', alertType: 'warning' },
];

export default function AlertManagement() {
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [rules, setRules] = useState<AlertRule[]>([]);

  // New rule dialog state
  const [newRuleOpen, setNewRuleOpen] = useState(false);
  const [newRule, setNewRule] = useState({ name: '', type: 'production_rate', threshold: 10, is_active: true });
  const [newRuleSaving, setNewRuleSaving] = useState(false);
  const [settings, setSettings] = useState<AlertSettings>({
    sound_enabled: true,
    sound_volume: 65,
    email_enabled: true,
    slack_enabled: false,
    supervisor_phone: '+33 6 12 34 56 78',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [evaluating, setEvaluating] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ text: string; ok: boolean } | null>(null);
  const flashTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Flash banner ────────────────────────────────────────────────────────────
  const flash = (text: string, ok = true) => {
    if (flashTimer.current) clearTimeout(flashTimer.current);
    setStatusMsg({ text, ok });
    flashTimer.current = setTimeout(() => setStatusMsg(null), 4000);
  };

  // ── Load all data ───────────────────────────────────────────────────────────
  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [histRes, rulesRes, settRes] = await Promise.all([
        fetch(`${API_URL}/api/alerts/history?limit=100`),
        fetch(`${API_URL}/api/alerts/rules`),
        fetch(`${API_URL}/api/alerts/settings`),
      ]);
      if (histRes.ok)   setAlerts(await histRes.json());
      if (rulesRes.ok)  setRules(await rulesRes.json());
      if (settRes.ok)   setSettings(await settRes.json());
    } catch {
      flash('Erreur de chargement des alertes.', false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  // ── Actions: notifications ──────────────────────────────────────────────────
  const markRead = async (id: number) => {
    await fetch(`${API_URL}/api/alerts/history/${id}/read`, { method: 'PATCH' });
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, is_read: true } : a));
  };

  const deleteAlert = async (id: number) => {
    await fetch(`${API_URL}/api/alerts/history/${id}`, { method: 'DELETE' });
    setAlerts(prev => prev.filter(a => a.id !== id));
  };

  const markAllRead = async () => {
    await fetch(`${API_URL}/api/alerts/history/read-all`, { method: 'POST' });
    setAlerts(prev => prev.map(a => ({ ...a, is_read: true })));
    flash('Toutes les alertes marquées comme lues.');
  };

  const clearAll = async () => {
    await fetch(`${API_URL}/api/alerts/history`, { method: 'DELETE' });
    setAlerts([]);
    flash('Historique des alertes effacé.');
  };

  // ── Actions: settings ───────────────────────────────────────────────────────
  const saveSettings = async (patch: Partial<AlertSettings>) => {
    const next = { ...settings, ...patch };
    setSettings(next);
    setSaving(true);
    try {
      await fetch(`${API_URL}/api/alerts/settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(next),
      });
      flash('Configuration enregistrée.');
    } catch {
      flash('Erreur lors de la sauvegarde.', false);
    } finally {
      setSaving(false);
    }
  };

  // ── Actions: rules ──────────────────────────────────────────────────────────
  const updateRule = async (id: number, patch: Partial<AlertRule>) => {
    setRules(prev => prev.map(r => r.id === id ? { ...r, ...patch } : r));
    try {
      await fetch(`${API_URL}/api/alerts/rules/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      });
      flash('Règle mise à jour.');
    } catch {
      flash('Erreur lors de la mise à jour.', false);
    }
  };

  // ── Actions: create new rule ────────────────────────────────────────────────
  const createRule = async () => {
    if (!newRule.name.trim()) { flash('Veuillez saisir un nom pour la règle.', false); return; }
    setNewRuleSaving(true);
    try {
      const res = await fetch(`${API_URL}/api/alerts/rules`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newRule),
      });
      if (res.ok) {
        const created = await res.json();
        setRules(prev => [...prev, created]);
        setNewRuleOpen(false);
        setNewRule({ name: '', type: 'production_rate', threshold: 10, is_active: true });
        flash('Règle créée avec succès.');
      } else {
        flash('Erreur lors de la création de la règle.', false);
      }
    } catch {
      flash('Erreur réseau.', false);
    } finally {
      setNewRuleSaving(false);
    }
  };

  // ── Actions: delete rule ────────────────────────────────────────────────────
  const deleteRule = async (id: number) => {
    await fetch(`${API_URL}/api/alerts/rules/${id}`, { method: 'DELETE' });
    setRules(prev => prev.filter(r => r.id !== id));
    flash('Règle supprimée.');
  };

  // ── Actions: manual alert ───────────────────────────────────────────────────
  const triggerManual = async () => {
    try {
      const res = await fetch(`${API_URL}/api/alerts/history`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'Alerte manuelle',
          message: 'Alerte déclenchée manuellement par l\'opérateur.',
          alert_type: 'warning',
        }),
      });
      if (res.ok) {
        const newAlert = await res.json();
        setAlerts(prev => [newAlert, ...prev]);
        flash('Alerte manuelle déclenchée.');
      }
    } catch {
      flash('Impossible de créer l\'alerte.', false);
    }
  };

  // ── Actions: evaluate rules ─────────────────────────────────────────────────
  const evaluateRules = async () => {
    setEvaluating(true);
    try {
      const res = await fetch(`${API_URL}/api/alerts/evaluate`, { method: 'POST' });
      const data = await res.json();
      if (data.triggered > 0) {
        flash(`${data.triggered} nouvelle(s) alerte(s) générée(s).`);
        loadAll();
      } else {
        flash('Aucune règle déclenchée. Production nominale.');
      }
    } catch {
      flash('Erreur lors de l\'évaluation.', false);
    } finally {
      setEvaluating(false);
    }
  };

  const unreadCount = alerts.filter(a => !a.is_read).length;

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Gestion des Alertes</h1>
          <p className="text-muted-foreground">
            Configurez les notifications et gérez les incidents en temps réel
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="border-zinc-800 text-white gap-2"
            onClick={loadAll}
            disabled={loading}
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            Actualiser
          </Button>
          <Button
            variant="outline"
            className="border-zinc-800 text-white gap-2"
            onClick={evaluateRules}
            disabled={evaluating}
          >
            {evaluating ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldAlert className="w-4 h-4" />}
            Évaluer les règles
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" className="border-zinc-800 text-white gap-2" disabled={alerts.length === 0}>
                <Trash2 className="w-4 h-4" /> Tout effacer
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="bg-zinc-950 border-zinc-800">
              <AlertDialogHeader>
                <AlertDialogTitle className="text-white">Effacer l'historique ?</AlertDialogTitle>
                <AlertDialogDescription>
                  Toutes les alertes seront supprimées définitivement.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="border-zinc-700">Annuler</AlertDialogCancel>
                <AlertDialogAction className="bg-red-600 hover:bg-red-700" onClick={clearAll}>
                  Effacer
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          <Button
            className="bg-orange-600 hover:bg-orange-700 text-white gap-2"
            onClick={markAllRead}
            disabled={unreadCount === 0}
          >
            <CheckCircle2 className="w-4 h-4" /> Tout marquer comme lu
          </Button>
        </div>
      </div>

      {/* Flash banner */}
      {statusMsg && (
        <div className={`px-4 py-2 rounded-lg text-sm font-medium border ${
          statusMsg.ok
            ? 'bg-green-500/10 text-green-400 border-green-500/30'
            : 'bg-red-500/10 text-red-400 border-red-500/30'
        }`}>
          {statusMsg.text}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ── Notification center ── */}
        <div className="lg:col-span-2 space-y-4">
          <Card className="bg-zinc-900/50 border-zinc-800 overflow-hidden">
            <div className="p-4 border-b border-zinc-800 bg-zinc-900/30 flex items-center justify-between">
              <h3 className="text-sm font-bold text-white uppercase tracking-widest flex items-center">
                Centre de Notifications
                <InfoTooltip
                  side="right"
                  text="Historique de toutes les alertes générées automatiquement par les règles ou manuellement par l'opérateur. Les alertes non lues apparaissent en haut avec un point orange."
                />
              </h3>
              <Badge className={`border font-mono text-xs ${
                unreadCount > 0
                  ? 'bg-orange-500/20 text-orange-400 border-orange-500/30'
                  : 'bg-zinc-800 text-zinc-500 border-zinc-700'
              }`}>
                {unreadCount > 0 ? `${unreadCount} Non lue${unreadCount > 1 ? 's' : ''}` : 'Tout lu'}
              </Badge>
            </div>

            <ScrollArea className="h-[500px]">
              {loading ? (
                <div className="h-40 flex items-center justify-center">
                  <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
                </div>
              ) : alerts.length === 0 ? (
                <div className="h-40 flex flex-col items-center justify-center gap-2 text-zinc-600">
                  <Bell className="w-8 h-8 text-zinc-700" />
                  <p className="text-sm">Aucune alerte enregistrée</p>
                </div>
              ) : (
                <div className="divide-y divide-zinc-800/50">
                  {alerts.map((alert) => (
                    <div
                      key={alert.id}
                      className={`p-4 hover:bg-zinc-800/30 transition-colors flex gap-4 ${!alert.is_read ? 'bg-orange-500/[0.02]' : ''}`}
                    >
                      {/* Icon */}
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                        alert.alert_type === 'critical' ? 'bg-red-500/20 text-red-400' :
                        alert.alert_type === 'warning'  ? 'bg-yellow-500/20 text-yellow-400' :
                                                          'bg-blue-500/20 text-blue-400'
                      }`}>
                        {alert.alert_type === 'critical' ? <AlertOctagon className="w-5 h-5" /> :
                         alert.alert_type === 'warning'  ? <Zap className="w-5 h-5" /> :
                                                           <Bell className="w-5 h-5" />}
                      </div>

                      {/* Content */}
                      <div className="flex-1 space-y-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <h4 className={`text-sm font-bold truncate ${!alert.is_read ? 'text-white' : 'text-zinc-400'}`}>
                            {alert.title}
                          </h4>
                          <span className="text-[10px] text-zinc-500 font-mono shrink-0">
                            {timeAgo(alert.timestamp)}
                          </span>
                        </div>
                        <p className="text-xs text-zinc-500 leading-relaxed">{alert.message}</p>
                        <div className="flex gap-4 pt-2">
                          {!alert.is_read && (
                            <button
                              className="text-[10px] font-bold text-orange-400 uppercase tracking-widest hover:text-orange-300 transition-colors"
                              onClick={() => markRead(alert.id)}
                            >
                              Acquitter
                            </button>
                          )}
                          <button
                            className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest hover:text-red-400 transition-colors"
                            onClick={() => deleteAlert(alert.id)}
                          >
                            Supprimer
                          </button>
                        </div>
                      </div>

                      {/* Unread dot */}
                      <div className="flex items-start pt-1">
                        {!alert.is_read && (
                          <div className="w-2 h-2 rounded-full bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.8)]" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </Card>

          {/* Alert rules */}
          <Card className="bg-zinc-900/50 border-zinc-800 overflow-hidden">
            <div className="p-4 border-b border-zinc-800 bg-zinc-900/30 flex items-center justify-between">
              <h3 className="text-sm font-bold text-white uppercase tracking-widest flex items-center">
                Règles d'Alerte Automatique
                <InfoTooltip
                  side="right"
                  text="Règles évaluées toutes les 10 minutes contre les données de production réelles. Cliquez sur 'Évaluer les règles' pour forcer une évaluation immédiate."
                />
              </h3>
              <div className="flex items-center gap-2">
                <Badge className="bg-zinc-800 text-zinc-400 border-zinc-700 text-xs">
                  {rules.filter(r => r.is_active).length}/{rules.length} actives
                </Badge>
                <Button
                  size="sm"
                  className="h-7 text-[10px] font-bold bg-orange-600 hover:bg-orange-700 text-white gap-1"
                  onClick={() => setNewRuleOpen(true)}
                >
                  <Plus className="w-3 h-3" /> Ajouter
                </Button>
              </div>
            </div>
            <div className="divide-y divide-zinc-800/50">
              {loading ? (
                <div className="p-6 flex justify-center">
                  <Loader2 className="w-6 h-6 text-orange-500 animate-spin" />
                </div>
              ) : rules.length === 0 ? (
                <div className="p-6 text-center text-xs text-zinc-600">
                  Aucune règle configurée. Cliquez sur "Ajouter" pour créer la première règle.
                </div>
              ) : rules.map((rule) => (
                <div key={rule.id} className="p-4 flex items-center gap-4">
                  <div className={`w-2 h-10 rounded-full shrink-0 ${
                    rule.type === 'error_rate' ? 'bg-red-500' : 'bg-yellow-500'
                  } ${!rule.is_active ? 'opacity-30' : ''}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-bold ${rule.is_active ? 'text-white' : 'text-zinc-500'}`}>
                        {rule.name}
                      </span>
                      <InfoTooltip
                        side="right"
                        text={ruleTypeDescription(rule.type)}
                      />
                    </div>
                    <span className="text-[10px] text-zinc-500">{ruleTypeLabel(rule.type)}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-zinc-500">Seuil :</span>
                      <input
                        type="number"
                        step="0.1"
                        value={rule.threshold}
                        onChange={(e) => {
                          const v = parseFloat(e.target.value);
                          if (!isNaN(v)) setRules(prev => prev.map(r => r.id === rule.id ? { ...r, threshold: v } : r));
                        }}
                        onBlur={() => updateRule(rule.id, { threshold: rule.threshold })}
                        className="w-16 text-xs font-mono text-center text-white bg-zinc-900 border border-zinc-700 rounded px-1 py-0.5 focus:border-orange-500 focus:outline-none"
                      />
                    </div>
                    <Switch
                      checked={rule.is_active}
                      onCheckedChange={(v) => updateRule(rule.id, { is_active: v })}
                    />
                    <button
                      className="text-zinc-600 hover:text-red-400 transition-colors"
                      title="Supprimer cette règle"
                      onClick={() => deleteRule(rule.id)}
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* ── New Rule Dialog ── */}
          <Dialog open={newRuleOpen} onOpenChange={(o: boolean) => setNewRuleOpen(o)}>
            <DialogContent className="bg-zinc-950 border-zinc-800 text-white max-w-md">
              <DialogHeader>
                <DialogTitle className="text-white flex items-center gap-2">
                  <Plus className="w-4 h-4 text-orange-500" />
                  Nouvelle Règle d'Alerte
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-4 py-2">
                {/* Name */}
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                    Nom de la règle *
                  </Label>
                  <Input
                    value={newRule.name}
                    onChange={e => setNewRule(r => ({ ...r, name: e.target.value }))}
                    placeholder="Ex: Cadence minimale ligne B"
                    className="bg-zinc-900 border-zinc-700 text-white h-10 focus:border-orange-500"
                  />
                </div>

                {/* Type */}
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                    Type de métrique
                  </Label>
                  <Select
                    value={newRule.type}
                    onValueChange={v => setNewRule(r => ({ ...r, type: v }))}
                  >
                    <SelectTrigger className="bg-zinc-900 border-zinc-700 text-white h-10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-950 border-zinc-800 text-white">
                      {RULE_TYPE_OPTIONS.map(opt => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-[10px] text-zinc-500 italic">
                    {RULE_TYPE_OPTIONS.find(o => o.value === newRule.type)?.hint}
                  </p>
                </div>

                {/* Threshold */}
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                    Seuil de déclenchement
                  </Label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      step="0.1"
                      min="0"
                      value={newRule.threshold}
                      onChange={e => {
                        const v = parseFloat(e.target.value);
                        if (!isNaN(v)) setNewRule(r => ({ ...r, threshold: v }));
                      }}
                      className="bg-zinc-900 border-zinc-700 text-white h-10 font-mono focus:border-orange-500"
                    />
                    <span className="text-xs text-zinc-500 shrink-0">
                      {newRule.type === 'error_rate' ? '%' :
                       newRule.type === 'production_rate' ? 'sacs/min' : '%'}
                    </span>
                  </div>
                </div>

                {/* Active */}
                <div className="flex items-center justify-between pt-2 border-t border-zinc-800">
                  <Label className="text-sm text-zinc-300">Activer immédiatement</Label>
                  <Switch
                    checked={newRule.is_active}
                    onCheckedChange={v => setNewRule(r => ({ ...r, is_active: v }))}
                  />
                </div>
              </div>

              <DialogFooter className="gap-2">
                <Button
                  variant="outline"
                  className="border-zinc-700 text-zinc-400"
                  onClick={() => setNewRuleOpen(false)}
                  disabled={newRuleSaving}
                >
                  Annuler
                </Button>
                <Button
                  className="bg-orange-600 hover:bg-orange-700 text-white gap-2"
                  onClick={createRule}
                  disabled={newRuleSaving || !newRule.name.trim()}
                >
                  {newRuleSaving && <Loader2 className="w-3 h-3 animate-spin" />}
                  Créer la règle
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* ── Right panel ── */}
        <div className="space-y-6">

          {/* Configuration card */}
          <Card className="p-6 bg-zinc-900/50 border-zinc-800 space-y-6">
            <div className="flex items-center gap-2 border-b border-zinc-800 pb-4">
              <Settings2 className="w-5 h-5 text-orange-500" />
              <h3 className="text-sm font-bold text-white uppercase tracking-widest flex items-center">
                Configuration
                <InfoTooltip
                  side="left"
                  text="Paramètres de notification. Les modifications sont sauvegardées automatiquement en base de données et persistent après redémarrage."
                />
              </h3>
              {saving && <Loader2 className="w-3 h-3 text-orange-400 animate-spin ml-auto" />}
            </div>

            <div className="space-y-6">
              {/* Sound */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-xs text-zinc-300 flex items-center">
                    Alertes Sonores
                    <InfoTooltip
                      side="left"
                      text="Émet un signal sonore dans le navigateur lors de la réception d'une alerte critique."
                    />
                  </Label>
                  <p className="text-[10px] text-zinc-500 italic">Pour les alertes critiques</p>
                </div>
                <Switch
                  checked={settings.sound_enabled}
                  onCheckedChange={(v) => saveSettings({ sound_enabled: v })}
                />
              </div>

              {/* Volume */}
              <div className="space-y-3">
                <Label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest flex items-center">
                  Volume de l'alerte ({settings.sound_volume}%)
                  <InfoTooltip
                    side="left"
                    text="Niveau sonore des alertes critiques. S'applique uniquement si les alertes sonores sont activées."
                  />
                </Label>
                <div className="flex items-center gap-3">
                  <VolumeX className="w-4 h-4 text-zinc-500 shrink-0" />
                  <Slider
                    value={[settings.sound_volume]}
                    onValueChange={([v]) => setSettings(s => ({ ...s, sound_volume: v }))}
                    onValueCommit={([v]) => saveSettings({ sound_volume: v })}
                    min={0}
                    max={100}
                    step={5}
                    className="flex-1"
                  />
                  <Volume2 className="w-4 h-4 text-zinc-300 shrink-0" />
                </div>
              </div>

              {/* Email / Slack */}
              <div className="pt-4 border-t border-zinc-800 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-zinc-500" />
                    <span className="text-xs text-zinc-300 flex items-center">
                      Notifications Email
                      <InfoTooltip
                        side="left"
                        text="Envoi d'un email au contact d'urgence lors d'une alerte critique. Nécessite la configuration SMTP dans les paramètres système."
                      />
                    </span>
                  </div>
                  <Switch
                    checked={settings.email_enabled}
                    onCheckedChange={(v) => saveSettings({ email_enabled: v })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-zinc-500" />
                    <span className="text-xs text-zinc-300 flex items-center">
                      Notifications Slack/Teams
                      <InfoTooltip
                        side="left"
                        text="Envoi de messages sur un canal Slack ou Teams via webhook. Configurez l'URL du webhook dans les paramètres système."
                      />
                    </span>
                  </div>
                  <Switch
                    checked={settings.slack_enabled}
                    onCheckedChange={(v) => saveSettings({ slack_enabled: v })}
                  />
                </div>
              </div>
            </div>
          </Card>

          {/* Emergency contact */}
          <Card className="p-5 bg-zinc-900/80 border border-zinc-800 space-y-4">
            <h4 className="text-[10px] font-bold text-white uppercase tracking-widest flex items-center">
              <PhoneCall className="w-3.5 h-3.5 text-orange-500 mr-1.5" />
              Urgence / Contact
              <InfoTooltip
                side="left"
                text="Numéro du superviseur d'astreinte. Ce numéro est affiché à des fins de référence et peut être mis à jour via les paramètres système."
              />
            </h4>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-2 rounded bg-zinc-950 border border-zinc-800">
                <span className="text-[10px] text-zinc-400">Superviseur Astreinte</span>
                <span className="text-[10px] font-bold text-orange-400 font-mono">
                  {settings.supervisor_phone}
                </span>
              </div>

              <Button
                variant="outline"
                className="w-full border-zinc-800 text-[10px] font-bold uppercase tracking-widest h-9 gap-2 hover:border-orange-500/50 hover:text-orange-400"
                onClick={triggerManual}
              >
                <ToggleLeft className="w-3 h-3" />
                Lancer une Alerte Manuelle
                <ChevronRight className="w-3 h-3 ml-auto" />
              </Button>

              {/* Type badges legend */}
              <div className="pt-2 border-t border-zinc-800 space-y-1.5">
                <span className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest flex items-center">
                  Légende des types
                  <InfoTooltip
                    side="left"
                    text="Chaque alerte est classée par sévérité. Critique = arrêt de production ou taux de rejet élevé. Avertissement = cadence faible. Info = notification générale."
                  />
                </span>
                {[
                  { label: 'Critique', color: 'bg-red-500/20 text-red-400 border-red-500/30' },
                  { label: 'Avertissement', color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' },
                  { label: 'Information', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
                ].map(({ label, color }) => (
                  <div key={label} className="flex items-center gap-2">
                    <Badge className={`${color} border text-[9px] px-2 py-0`}>{label}</Badge>
                    <Clock className="w-3 h-3 text-zinc-700" />
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

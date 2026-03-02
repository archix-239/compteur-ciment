import { useCallback, useEffect, useState } from 'react';
import {
  Settings2,
  Save,
  Globe,
  Shield,
  Database,
  HardDrive,
  Lock,
  Key,
  BellRing,
  Cpu,
  RefreshCw,
  Archive,
  Cloud,
  Loader2,
  Volume2,
  VolumeX,
  Mail,
  MessageSquare,
  PhoneCall,
  Bell,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { API_URL } from '@/lib/api';

// ── Types ─────────────────────────────────────────────────────────────────────

interface GeneralSettings {
  site_name: string;
  site_location: string;
  site_timezone: string;
  site_language: string;
  notify_low_production: string;
  notify_weekly_reports: string;
  log_level: string;
  log_retention_days: string;
}

interface AlertSettings {
  sound_enabled: boolean;
  sound_volume: number;
  email_enabled: boolean;
  slack_enabled: boolean;
  supervisor_phone: string;
}

interface AlertRule {
  id: number;
  name: string;
  type: string;
  threshold: number;
  is_active: boolean;
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

function ruleTypeLabel(type: string): string {
  if (type === 'production_rate') return 'Cadence (sacs/min)';
  if (type === 'error_rate') return 'Taux de rejet (%)';
  if (type === 'consistency') return 'Consistance (%)';
  return type;
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function SystemSettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [alertSaving, setAlertSaving] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ text: string; ok: boolean } | null>(null);

  const [general, setGeneral] = useState<GeneralSettings>({
    site_name: 'Cimenterie Centrale - Ligne A',
    site_location: 'Zone Industrielle Nord, Secteur 4',
    site_timezone: 'utc1',
    site_language: 'fr',
    notify_low_production: 'true',
    notify_weekly_reports: 'true',
    log_level: 'info',
    log_retention_days: '30',
  });

  const [alertSettings, setAlertSettings] = useState<AlertSettings>({
    sound_enabled: true,
    sound_volume: 65,
    email_enabled: true,
    slack_enabled: false,
    supervisor_phone: '+33 6 12 34 56 78',
  });

  const [alertRules, setAlertRules] = useState<AlertRule[]>([]);

  const flash = (text: string, ok = true) => {
    setStatusMsg({ text, ok });
    setTimeout(() => setStatusMsg(null), 4000);
  };

  // ── Load ─────────────────────────────────────────────────────────────────────
  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [genRes, alertRes, rulesRes] = await Promise.all([
        fetch(`${API_URL}/api/system/general-settings`),
        fetch(`${API_URL}/api/alerts/settings`),
        fetch(`${API_URL}/api/alerts/rules`),
      ]);
      if (genRes.ok)   setGeneral(await genRes.json());
      if (alertRes.ok) setAlertSettings(await alertRes.json());
      if (rulesRes.ok) setAlertRules(await rulesRes.json());
    } catch {
      flash('Erreur lors du chargement des paramètres.', false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  // ── Save general ─────────────────────────────────────────────────────────────
  const saveGeneral = async () => {
    setSaving(true);
    try {
      await fetch(`${API_URL}/api/system/general-settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(general),
      });
      flash('Paramètres généraux enregistrés.');
    } catch {
      flash('Erreur lors de la sauvegarde.', false);
    } finally {
      setSaving(false);
    }
  };

  // ── Save alert settings ───────────────────────────────────────────────────────
  const saveAlertSettings = async (patch: Partial<AlertSettings>) => {
    const next = { ...alertSettings, ...patch };
    setAlertSettings(next);
    setAlertSaving(true);
    try {
      await fetch(`${API_URL}/api/alerts/settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(next),
      });
      flash('Paramètres d\'alerte sauvegardés.');
    } catch {
      flash('Erreur lors de la sauvegarde.', false);
    } finally {
      setAlertSaving(false);
    }
  };

  // ── Update rule ───────────────────────────────────────────────────────────────
  const updateRule = async (id: number, patch: Partial<AlertRule>) => {
    setAlertRules(prev => prev.map(r => r.id === id ? { ...r, ...patch } : r));
    try {
      await fetch(`${API_URL}/api/alerts/rules/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      });
    } catch {
      flash('Erreur lors de la mise à jour de la règle.', false);
    }
  };

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Paramètres Système</h1>
          <p className="text-muted-foreground">
            Configurez les variables globales, les alertes et la maintenance de la plateforme
          </p>
        </div>
        <Button
          variant="outline"
          className="border-zinc-800 text-white gap-2"
          onClick={loadAll}
          disabled={loading}
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          Actualiser
        </Button>
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

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="bg-zinc-900 border border-zinc-800 p-1">
          <TabsTrigger value="general" className="gap-2">
            <Settings2 className="w-4 h-4" /> Général
          </TabsTrigger>
          <TabsTrigger value="alerts" className="gap-2">
            <Bell className="w-4 h-4" /> Alertes
          </TabsTrigger>
          <TabsTrigger value="performance" className="gap-2">
            <Cpu className="w-4 h-4" /> Performance
          </TabsTrigger>
          <TabsTrigger value="security" className="gap-2">
            <Lock className="w-4 h-4" /> Sécurité
          </TabsTrigger>
          <TabsTrigger value="data" className="gap-2">
            <Archive className="w-4 h-4" /> Archivage & Backup
          </TabsTrigger>
        </TabsList>

        {/* ── Général ── */}
        <TabsContent value="general" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Site identity */}
            <Card className="p-6 bg-zinc-900/50 border-zinc-800 space-y-6">
              <div className="flex items-center gap-2 font-semibold text-white border-b border-zinc-800 pb-4">
                <Globe className="w-5 h-5 text-orange-500" />
                <span>Identité de l'Usine</span>
                <InfoTooltip
                  side="right"
                  text="Informations d'identification du site de production. Ces données apparaissent dans les rapports exportés."
                />
              </div>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-zinc-500 text-[10px] uppercase font-bold tracking-widest">Nom du Site</Label>
                  <Input
                    value={general.site_name}
                    onChange={e => setGeneral(g => ({ ...g, site_name: e.target.value }))}
                    className="bg-zinc-950 border-zinc-800 text-white h-11"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-zinc-500 text-[10px] uppercase font-bold tracking-widest">Localisation</Label>
                  <Input
                    value={general.site_location}
                    onChange={e => setGeneral(g => ({ ...g, site_location: e.target.value }))}
                    className="bg-zinc-950 border-zinc-800 text-white h-11"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-zinc-500 text-[10px] uppercase font-bold tracking-widest flex items-center">
                      Fuseau Horaire
                      <InfoTooltip side="top" text="Utilisé pour horodater les rapports et les alertes. Correspond au fuseau local du site." />
                    </Label>
                    <Select
                      value={general.site_timezone}
                      onValueChange={v => setGeneral(g => ({ ...g, site_timezone: v }))}
                    >
                      <SelectTrigger className="bg-zinc-950 border-zinc-800 text-white h-11">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-zinc-950 border-zinc-800 text-white">
                        <SelectItem value="utc0">UTC +00:00 (GMT)</SelectItem>
                        <SelectItem value="utc1">UTC +01:00 (Paris)</SelectItem>
                        <SelectItem value="utc2">UTC +02:00 (CEST)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-zinc-500 text-[10px] uppercase font-bold tracking-widest">Langue</Label>
                    <Select
                      value={general.site_language}
                      onValueChange={v => setGeneral(g => ({ ...g, site_language: v }))}
                    >
                      <SelectTrigger className="bg-zinc-950 border-zinc-800 text-white h-11">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-zinc-950 border-zinc-800 text-white">
                        <SelectItem value="fr">Français (FR)</SelectItem>
                        <SelectItem value="en">English (US)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </Card>

            {/* Notification preferences */}
            <Card className="p-6 bg-zinc-900/50 border-zinc-800 space-y-6">
              <div className="flex items-center gap-2 font-semibold text-white border-b border-zinc-800 pb-4">
                <BellRing className="w-5 h-5 text-orange-500" />
                <span>Préférences Notifications</span>
                <InfoTooltip
                  side="left"
                  text="Préférences globales de notification. Les règles d'alerte détaillées (seuils, canaux) se configurent dans l'onglet 'Alertes'."
                />
              </div>
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-sm text-zinc-300 flex items-center">
                      Alerte de Production Basse
                      <InfoTooltip
                        side="left"
                        text="Active/désactive la règle de cadence faible dans le moteur d'alertes automatiques. Le seuil précis se configure dans l'onglet Alertes."
                      />
                    </Label>
                    <p className="text-[10px] text-zinc-500 italic">Si le débit tombe sous le seuil configuré</p>
                  </div>
                  <Switch
                    checked={general.notify_low_production === 'true'}
                    onCheckedChange={v => {
                      setGeneral(g => ({ ...g, notify_low_production: v ? 'true' : 'false' }));
                      // Also toggle the production_rate rule
                      const rule = alertRules.find(r => r.type === 'production_rate');
                      if (rule) updateRule(rule.id, { is_active: v });
                    }}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-sm text-zinc-300 flex items-center">
                      Rapports Hebdomadaires
                      <InfoTooltip
                        side="left"
                        text="Génération et envoi automatique du rapport de production chaque lundi. Nécessite la configuration email dans l'onglet Alertes."
                      />
                    </Label>
                    <p className="text-[10px] text-zinc-500 italic">Envoi auto par email le lundi</p>
                  </div>
                  <Switch
                    checked={general.notify_weekly_reports === 'true'}
                    onCheckedChange={v => setGeneral(g => ({ ...g, notify_weekly_reports: v ? 'true' : 'false' }))}
                  />
                </div>
              </div>
            </Card>
          </div>
        </TabsContent>

        {/* ── Alertes ── */}
        <TabsContent value="alerts" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Notification channels */}
            <Card className="p-6 bg-zinc-900/50 border-zinc-800 space-y-6">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
                <div className="flex items-center gap-2 font-semibold text-white">
                  <Bell className="w-5 h-5 text-orange-500" />
                  <span>Canaux de Notification</span>
                  <InfoTooltip
                    side="right"
                    text="Configuration des canaux par lesquels les alertes sont transmises. Les modifications sont sauvegardées en BDD et persistées."
                  />
                </div>
                {alertSaving && <Loader2 className="w-4 h-4 text-orange-400 animate-spin" />}
              </div>

              <div className="space-y-6">
                {/* Sound */}
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-xs text-zinc-300 flex items-center">
                      Alertes Sonores
                      <InfoTooltip side="right" text="Émet un signal dans le navigateur lors d'une alerte critique." />
                    </Label>
                    <p className="text-[10px] text-zinc-500 italic">Pour les alertes critiques uniquement</p>
                  </div>
                  <Switch
                    checked={alertSettings.sound_enabled}
                    onCheckedChange={v => saveAlertSettings({ sound_enabled: v })}
                  />
                </div>

                {/* Volume */}
                <div className="space-y-3">
                  <Label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest flex items-center">
                    Volume sonore ({alertSettings.sound_volume}%)
                    <InfoTooltip side="right" text="Niveau sonore des alertes critiques. Actif uniquement si 'Alertes Sonores' est activé." />
                  </Label>
                  <div className="flex items-center gap-3">
                    <VolumeX className="w-4 h-4 text-zinc-500 shrink-0" />
                    <Slider
                      value={[alertSettings.sound_volume]}
                      onValueChange={([v]) => setAlertSettings(s => ({ ...s, sound_volume: v }))}
                      onValueCommit={([v]) => saveAlertSettings({ sound_volume: v })}
                      min={0} max={100} step={5}
                      className="flex-1"
                    />
                    <Volume2 className="w-4 h-4 text-zinc-300 shrink-0" />
                  </div>
                </div>

                <div className="pt-4 border-t border-zinc-800 space-y-4">
                  {/* Email */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-zinc-500" />
                      <span className="text-xs text-zinc-300 flex items-center">
                        Notifications Email
                        <InfoTooltip side="right" text="Envoi d'un email au contact d'urgence lors d'une alerte critique. Nécessite la configuration SMTP système." />
                      </span>
                    </div>
                    <Switch
                      checked={alertSettings.email_enabled}
                      onCheckedChange={v => saveAlertSettings({ email_enabled: v })}
                    />
                  </div>

                  {/* Slack */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="w-4 h-4 text-zinc-500" />
                      <span className="text-xs text-zinc-300 flex items-center">
                        Notifications Slack/Teams
                        <InfoTooltip side="right" text="Messages via webhook Slack ou Teams. Configurez l'URL du webhook dans l'intégration Services Tiers." />
                      </span>
                    </div>
                    <Switch
                      checked={alertSettings.slack_enabled}
                      onCheckedChange={v => saveAlertSettings({ slack_enabled: v })}
                    />
                  </div>
                </div>

                {/* Supervisor phone */}
                <div className="pt-4 border-t border-zinc-800 space-y-2">
                  <Label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest flex items-center">
                    <PhoneCall className="w-3 h-3 mr-1" />
                    Téléphone Superviseur
                    <InfoTooltip side="right" text="Numéro affiché sur la page des alertes et dans les rapports d'incident." />
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      value={alertSettings.supervisor_phone}
                      onChange={e => setAlertSettings(s => ({ ...s, supervisor_phone: e.target.value }))}
                      className="bg-zinc-950 border-zinc-800 text-white h-10 font-mono"
                      placeholder="+33 6 XX XX XX XX"
                    />
                    <Button
                      className="bg-orange-600 hover:bg-orange-700 text-white h-10 px-3"
                      onClick={() => saveAlertSettings({})}
                    >
                      <Save className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </Card>

            {/* Alert rules */}
            <Card className="p-6 bg-zinc-900/50 border-zinc-800 space-y-4">
              <div className="flex items-center gap-2 font-semibold text-white border-b border-zinc-800 pb-4">
                <Shield className="w-5 h-5 text-orange-500" />
                <span>Règles d'Alerte</span>
                <InfoTooltip
                  side="left"
                  text="Aperçu des règles actives. Pour créer de nouvelles règles ou modifier les seuils en détail, utilisez la page Gestion des Alertes."
                />
              </div>

              {loading ? (
                <div className="flex justify-center py-6">
                  <Loader2 className="w-6 h-6 text-orange-500 animate-spin" />
                </div>
              ) : alertRules.length === 0 ? (
                <p className="text-xs text-zinc-600 italic text-center py-4">
                  Aucune règle configurée.
                </p>
              ) : (
                <div className="space-y-3">
                  {alertRules.map(rule => (
                    <div key={rule.id} className="flex items-center gap-3 p-3 rounded-lg bg-zinc-900 border border-zinc-800">
                      <div className={`w-1.5 h-8 rounded-full shrink-0 ${
                        rule.type === 'error_rate' ? 'bg-red-500' : 'bg-yellow-500'
                      } ${!rule.is_active ? 'opacity-30' : ''}`} />
                      <div className="flex-1 min-w-0">
                        <div className={`text-xs font-bold truncate ${rule.is_active ? 'text-white' : 'text-zinc-500'}`}>
                          {rule.name}
                        </div>
                        <div className="text-[10px] text-zinc-500">
                          {ruleTypeLabel(rule.type)} — seuil : {rule.threshold}
                        </div>
                      </div>
                      <Switch
                        checked={rule.is_active}
                        onCheckedChange={v => updateRule(rule.id, { is_active: v })}
                      />
                    </div>
                  ))}
                </div>
              )}

              <div className="pt-2 border-t border-zinc-800">
                <Button
                  variant="outline"
                  className="w-full border-zinc-700 text-orange-400 hover:text-orange-300 text-[10px] font-bold uppercase h-8"
                  onClick={() => window.location.href = '/alerts/management'}
                >
                  Gérer toutes les règles →
                </Button>
              </div>
            </Card>
          </div>
        </TabsContent>

        {/* ── Performance ── */}
        <TabsContent value="performance" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="p-6 bg-zinc-900/50 border-zinc-800 space-y-6">
              <div className="flex items-center gap-2 font-semibold text-white border-b border-zinc-800 pb-4">
                <Settings2 className="w-5 h-5 text-orange-500" />
                <span>Configuration de Logging</span>
                <InfoTooltip
                  side="right"
                  text="Niveau de verbosité des logs système. 'Info' est recommandé en production. 'Debug' est utile en phase de développement."
                />
              </div>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-zinc-500 text-[10px] uppercase font-bold tracking-widest">Niveau de Log</Label>
                  <Select
                    value={general.log_level}
                    onValueChange={v => setGeneral(g => ({ ...g, log_level: v }))}
                  >
                    <SelectTrigger className="bg-zinc-950 border-zinc-800 text-white h-11">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-950 border-zinc-800 text-white">
                      <SelectItem value="debug">Debug (Verbeux)</SelectItem>
                      <SelectItem value="info">Info (Standard)</SelectItem>
                      <SelectItem value="warn">Warn (Alertes uniquement)</SelectItem>
                      <SelectItem value="error">Error (Critique)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-zinc-500 text-[10px] uppercase font-bold tracking-widest flex items-center">
                    Rétention des Logs (Jours)
                    <InfoTooltip side="right" text="Durée de conservation des logs de détection en base de données avant suppression automatique." />
                  </Label>
                  <Input
                    type="number"
                    value={general.log_retention_days}
                    onChange={e => setGeneral(g => ({ ...g, log_retention_days: e.target.value }))}
                    className="bg-zinc-950 border-zinc-800 text-white h-11"
                  />
                </div>
              </div>
            </Card>

            <Card className="p-6 bg-zinc-900/50 border-zinc-800 space-y-6">
              <div className="flex items-center gap-2 font-semibold text-white border-b border-zinc-800 pb-4">
                <HardDrive className="w-5 h-5 text-orange-500" />
                <span>Optimisation Cache</span>
                <InfoTooltip
                  side="left"
                  text="Paramètres de gestion du cache vidéo des captures de sacs. Le nettoyage automatique libère de l'espace quand le disque est à plus de 90%."
                />
              </div>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-zinc-500 text-[10px] uppercase font-bold tracking-widest">Taille Max Cache Vidéo (GB)</Label>
                  <Input type="number" defaultValue="10" className="bg-zinc-950 border-zinc-800 text-white h-11" />
                </div>
                <div className="flex items-center justify-between pt-2">
                  <div className="space-y-0.5">
                    <Label className="text-sm text-zinc-300 flex items-center">
                      Nettoyage Automatique
                      <InfoTooltip side="left" text="Supprime automatiquement les captures les plus anciennes quand l'espace disque dépasse 90%." />
                    </Label>
                    <p className="text-[10px] text-zinc-500 italic">Vider si disque &gt; 90%</p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </div>
            </Card>
          </div>
        </TabsContent>

        {/* ── Sécurité ── */}
        <TabsContent value="security" className="space-y-6">
          <Card className="p-6 bg-zinc-900/50 border-zinc-800 space-y-6">
            <div className="flex items-center gap-2 font-semibold text-white border-b border-zinc-800 pb-4">
              <Shield className="w-5 h-5 text-orange-500" />
              <span>Politique de Sécurité & Chiffrement</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label className="text-sm text-zinc-300 flex items-center">
                      Authentification à 2 Facteurs (2FA)
                      <InfoTooltip side="right" text="Exige un code OTP en plus du mot de passe pour les comptes administrateurs." />
                    </Label>
                    <p className="text-[11px] text-zinc-500">Obligatoire pour tous les administrateurs</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label className="text-sm text-zinc-300 flex items-center">
                      SSL / TLS Forcé
                      <InfoTooltip side="right" text="Redirige automatiquement les connexions HTTP vers HTTPS. Nécessite un certificat SSL valide." />
                    </Label>
                    <p className="text-[11px] text-zinc-500">Redirection automatique HTTP → HTTPS</p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </div>
              <div className="space-y-4 p-4 rounded-xl bg-zinc-950 border border-zinc-800">
                <div className="flex items-center gap-2 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                  <Key className="w-3.5 h-3.5" /> Clés de Chiffrement
                  <InfoTooltip side="top" text="Chiffrement AES-256-GCM utilisé pour les données sensibles en base de données. La rotation périodique est recommandée tous les 90 jours." />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-zinc-500">Algorithme :</span>
                    <span className="text-white font-mono">AES-256-GCM</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-zinc-500">Dernière rotation :</span>
                    <span className="text-zinc-300 font-mono">il y a 42 jours</span>
                  </div>
                </div>
                <Button variant="outline" size="sm" className="w-full text-[10px] border-zinc-800 h-8 font-bold uppercase">
                  Forcer Rotation Clé
                </Button>
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* ── Archivage & Backup ── */}
        <TabsContent value="data" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="p-6 bg-zinc-900/50 border-zinc-800 space-y-6">
              <div className="flex items-center gap-2 font-semibold text-white border-b border-zinc-800 pb-4">
                <Cloud className="w-5 h-5 text-orange-500" />
                <span>Sauvegarde Cloud (AWS S3)</span>
                <InfoTooltip
                  side="right"
                  text="Sauvegarde automatique quotidienne des logs et configurations vers un bucket S3. Nécessite les credentials AWS dans les variables d'environnement."
                />
              </div>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-zinc-500 text-[10px] uppercase font-bold tracking-widest">Bucket Name</Label>
                  <Input defaultValue="ciment-monitor-backups" className="bg-zinc-950 border-zinc-800 text-white h-11" />
                </div>
                <div className="flex items-center justify-between pt-2">
                  <div className="space-y-0.5">
                    <Label className="text-sm text-zinc-300">Backup Automatique</Label>
                    <p className="text-[10px] text-zinc-500 italic">Quotidien à 03:00</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <Button className="w-full bg-zinc-800 hover:bg-zinc-700 text-white h-10 text-[10px] font-bold uppercase">
                  Lancer Backup Manuel
                </Button>
              </div>
            </Card>

            <Card className="p-6 bg-zinc-900/50 border-zinc-800 space-y-6">
              <div className="flex items-center gap-2 font-semibold text-white border-b border-zinc-800 pb-4">
                <RefreshCw className="w-5 h-5 text-orange-500" />
                <span>Restauration de Configuration</span>
                <InfoTooltip
                  side="left"
                  text="Restaure toutes les configurations système depuis un fichier .json exporté précédemment. Attention : écrase les paramètres actuels."
                />
              </div>
              <div className="p-8 rounded-xl border border-zinc-800 border-dashed flex flex-col items-center justify-center text-center gap-3">
                <Database className="w-8 h-8 text-zinc-700" />
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-white">Importer un fichier .json</h4>
                  <p className="text-[10px] text-zinc-500">Toutes les configurations actuelles seront écrasées</p>
                </div>
                <Button variant="outline" className="border-zinc-800 text-orange-500 text-[10px] font-bold uppercase mt-2">
                  Choisir un fichier
                </Button>
              </div>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Save footer — only for general + performance */}
      <div className="flex justify-end gap-3 pt-6 border-t border-zinc-800">
        <Button
          variant="outline"
          className="border-zinc-800 text-white h-11 px-6"
          onClick={loadAll}
          disabled={loading}
        >
          Réinitialiser
        </Button>
        <Button
          className="gap-2 bg-orange-600 hover:bg-orange-700 text-white font-bold h-11 px-8 shadow-lg shadow-orange-900/20"
          onClick={saveGeneral}
          disabled={saving}
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Enregistrer les Paramètres
        </Button>
      </div>
    </div>
  );
}

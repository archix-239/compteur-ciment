import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Settings2, Save, Globe, Shield, Database, HardDrive, Lock, Key,
  BellRing, Cpu, RefreshCw, Archive, Cloud, Loader2, Volume2, VolumeX,
  Mail, MessageSquare, PhoneCall, Bell, CheckCircle2, AlertTriangle,
  Upload, Download, FileJson, Server,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from '@/components/ui/tooltip';
import { API_URL, fetchApi, getToken } from '@/lib/api';

// ── Types ──────────────────────────────────────────────────────────────────────

interface GeneralSettings {
  site_name: string;
  site_location: string;
  site_timezone: string;
  site_language: string;
  notify_low_production: string;
  notify_weekly_reports: string;
  log_level: string;
  log_retention_days: string;
  cache_max_gb: string;
  cache_auto_cleanup: string;
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

interface SecuritySettings {
  jwt_expire_minutes: string;
  max_login_attempts: string;
  session_timeout_minutes: string;
  require_2fa_admin: string;
  force_https: string;
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function InfoTooltip({ text, side = 'top' }: { text: string; side?: 'top' | 'right' | 'bottom' | 'left' }) {
  return (
    <TooltipProvider delayDuration={200}>
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
    </TooltipProvider>
  );
}

function ruleTypeLabel(type: string): string {
  if (type === 'production_rate') return 'Cadence (sacs/min)';
  if (type === 'error_rate') return 'Taux de rejet (%)';
  if (type === 'consistency') return 'Consistance (%)';
  return type;
}

const DEFAULT_GENERAL: GeneralSettings = {
  site_name: 'Cimenterie Centrale - Ligne A',
  site_location: 'Zone Industrielle Nord, Secteur 4',
  site_timezone: 'utc1',
  site_language: 'fr',
  notify_low_production: 'true',
  notify_weekly_reports: 'true',
  log_level: 'info',
  log_retention_days: '30',
  cache_max_gb: '10',
  cache_auto_cleanup: 'true',
};

const DEFAULT_SECURITY: SecuritySettings = {
  jwt_expire_minutes: '30',
  max_login_attempts: '5',
  session_timeout_minutes: '480',
  require_2fa_admin: 'false',
  force_https: 'false',
};

// ── Component ──────────────────────────────────────────────────────────────────

export default function SystemSettings() {
  const [loading, setLoading]           = useState(true);
  const [saving, setSaving]             = useState(false);
  const [secSaving, setSecSaving]       = useState(false);
  const [alertSaving, setAlertSaving]   = useState(false);
  const [activeTab, setActiveTab]       = useState('general');
  const [flash, setFlash]               = useState<{ text: string; ok: boolean } | null>(null);
  const flashTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [general, setGeneral]             = useState<GeneralSettings>(DEFAULT_GENERAL);
  const [alertSettings, setAlertSettings] = useState<AlertSettings>({
    sound_enabled: true, sound_volume: 65,
    email_enabled: true, slack_enabled: false,
    supervisor_phone: '+33 6 12 34 56 78',
  });
  const [alertRules, setAlertRules]       = useState<AlertRule[]>([]);
  const [security, setSecurity]           = useState<SecuritySettings>(DEFAULT_SECURITY);

  // Backup state
  const [importing, setImporting]   = useState(false);
  const [exporting, setExporting]   = useState(false);
  const [backingUp, setBackingUp]   = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const showFlash = useCallback((text: string, ok = true) => {
    if (flashTimer.current) clearTimeout(flashTimer.current);
    setFlash({ text, ok });
    flashTimer.current = setTimeout(() => setFlash(null), 4000);
  }, []);

  // ── Load ─────────────────────────────────────────────────────────────────────
  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [gen, alertSett, rules, sec] = await Promise.all([
        fetchApi('/api/system/general-settings'),
        fetchApi('/api/alerts/settings'),
        fetchApi('/api/alerts/rules'),
        fetchApi('/api/system/security-settings'),
      ]);
      setGeneral(gen);
      setAlertSettings(alertSett);
      setAlertRules(rules);
      setSecurity(sec);
    } catch {
      showFlash('Erreur lors du chargement des paramètres.', false);
    } finally {
      setLoading(false);
    }
  }, [showFlash]);

  useEffect(() => { loadAll(); }, [loadAll]);

  // ── Save general + performance ────────────────────────────────────────────────
  const saveGeneral = async () => {
    setSaving(true);
    try {
      await fetchApi('/api/system/general-settings', {
        method: 'PUT',
        body: JSON.stringify(general),
      });
      showFlash('Paramètres enregistrés.');
    } catch {
      showFlash('Erreur lors de la sauvegarde.', false);
    } finally {
      setSaving(false);
    }
  };

  // ── Save security ─────────────────────────────────────────────────────────────
  const saveSecurity = async () => {
    setSecSaving(true);
    try {
      await fetchApi('/api/system/security-settings', {
        method: 'PUT',
        body: JSON.stringify(security),
      });
      showFlash('Paramètres de sécurité enregistrés.');
    } catch {
      showFlash('Erreur lors de la sauvegarde.', false);
    } finally {
      setSecSaving(false);
    }
  };

  // ── Save alert settings (auto-save on change) ─────────────────────────────────
  const saveAlertSettings = async (patch: Partial<AlertSettings>) => {
    const next = { ...alertSettings, ...patch };
    setAlertSettings(next);
    setAlertSaving(true);
    try {
      await fetchApi('/api/alerts/settings', {
        method: 'PUT',
        body: JSON.stringify(next),
      });
    } catch {
      showFlash('Erreur lors de la sauvegarde des alertes.', false);
    } finally {
      setAlertSaving(false);
    }
  };

  // ── Update alert rule toggle ───────────────────────────────────────────────────
  const updateRule = async (id: number, patch: Partial<AlertRule>) => {
    setAlertRules(prev => prev.map(r => r.id === id ? { ...r, ...patch } : r));
    try {
      await fetchApi(`/api/alerts/rules/${id}`, {
        method: 'PUT',
        body: JSON.stringify(patch),
      });
    } catch {
      showFlash('Erreur lors de la mise à jour de la règle.', false);
    }
  };

  // ── Export config ──────────────────────────────────────────────────────────────
  const exportConfig = async () => {
    setExporting(true);
    try {
      const res = await fetch(`${API_URL}/api/system/export-config`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (!res.ok) { showFlash('Erreur lors de l\'export.', false); return; }
      const blob = await res.blob();
      const cd = res.headers.get('content-disposition') ?? '';
      const match = cd.match(/filename=([^;]+)/);
      const filename = match ? match[1] : 'config_backup.json';
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = filename; a.click();
      URL.revokeObjectURL(url);
      showFlash('Configuration exportée.');
    } catch {
      showFlash('Erreur réseau.', false);
    } finally {
      setExporting(false);
    }
  };

  // ── Import config ──────────────────────────────────────────────────────────────
  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    try {
      const text = await file.text();
      const json = JSON.parse(text);
      const data = await fetchApi('/api/system/import-config', {
        method: 'POST',
        body: JSON.stringify(json),
      });
      showFlash(`Configuration restaurée — ${data.restored_keys} paramètres importés.`);
      await loadAll();
    } catch {
      showFlash('Fichier invalide ou erreur réseau.', false);
    } finally {
      setImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // ── DB Backup download ─────────────────────────────────────────────────────────
  const downloadBackup = async () => {
    setBackingUp(true);
    try {
      const res = await fetch(`${API_URL}/api/system/db-backup`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (!res.ok) { showFlash('Erreur lors du backup.', false); return; }
      const blob = await res.blob();
      const cd = res.headers.get('content-disposition') ?? '';
      const match = cd.match(/filename=([^;]+)/);
      const filename = match ? match[1] : 'production_backup.db';
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = filename; a.click();
      URL.revokeObjectURL(url);
      showFlash('Backup téléchargé.');
    } catch {
      showFlash('Erreur réseau.', false);
    } finally {
      setBackingUp(false);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <div className="p-6 space-y-6">

      {/* Hidden file input for import */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        className="hidden"
        onChange={handleImportFile}
      />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Paramètres Système</h1>
          <p className="text-muted-foreground text-sm">
            Configurez les variables globales, la sécurité, les alertes et l'archivage
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
      {flash && (
        <div className={`fixed top-4 right-4 z-50 flex items-center gap-3 px-4 py-3 rounded-lg border text-sm font-medium shadow-lg
          ${flash.ok ? 'bg-green-900/90 border-green-700 text-green-200' : 'bg-red-900/90 border-red-700 text-red-200'}`}>
          {flash.ok ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
          {flash.text}
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-zinc-900 border border-zinc-800 p-1">
          <TabsTrigger value="general"     className="gap-2 text-white data-[state=active]:bg-zinc-800"><Globe        className="w-4 h-4" /> Général</TabsTrigger>
          <TabsTrigger value="alerts"      className="gap-2 text-white data-[state=active]:bg-zinc-800"><Bell         className="w-4 h-4" /> Alertes</TabsTrigger>
          <TabsTrigger value="performance" className="gap-2 text-white data-[state=active]:bg-zinc-800"><Cpu          className="w-4 h-4" /> Performance</TabsTrigger>
          <TabsTrigger value="security"    className="gap-2 text-white data-[state=active]:bg-zinc-800"><Lock         className="w-4 h-4" /> Sécurité</TabsTrigger>
          <TabsTrigger value="data"        className="gap-2 text-white data-[state=active]:bg-zinc-800"><Archive      className="w-4 h-4" /> Archivage</TabsTrigger>
        </TabsList>

        {/* ── Général ─────────────────────────────────────────────────────────── */}
        <TabsContent value="general" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            {/* Site identity */}
            <Card className="p-6 bg-zinc-900/50 border-zinc-800 space-y-6">
              <div className="flex items-center gap-2 font-semibold text-white border-b border-zinc-800 pb-4">
                <Globe className="w-5 h-5 text-orange-500" />
                <span>Identité de l'Usine</span>
                <InfoTooltip side="right" text="Ces informations apparaissent dans les en-têtes des rapports PDF exportés." />
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
                      <InfoTooltip side="top" text="Fuseau horaire local du site, utilisé pour horodater les rapports." />
                    </Label>
                    <Select value={general.site_timezone} onValueChange={v => setGeneral(g => ({ ...g, site_timezone: v }))}>
                      <SelectTrigger className="bg-zinc-950 border-zinc-800 text-white h-11"><SelectValue /></SelectTrigger>
                      <SelectContent className="bg-zinc-950 border-zinc-800 text-white">
                        <SelectItem value="utc0">UTC +00:00 (GMT)</SelectItem>
                        <SelectItem value="utc1">UTC +01:00 (Paris)</SelectItem>
                        <SelectItem value="utc2">UTC +02:00 (CEST)</SelectItem>
                        <SelectItem value="utc3">UTC +03:00 (Moscou)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-zinc-500 text-[10px] uppercase font-bold tracking-widest">Langue</Label>
                    <Select value={general.site_language} onValueChange={v => setGeneral(g => ({ ...g, site_language: v }))}>
                      <SelectTrigger className="bg-zinc-950 border-zinc-800 text-white h-11"><SelectValue /></SelectTrigger>
                      <SelectContent className="bg-zinc-950 border-zinc-800 text-white">
                        <SelectItem value="fr">Français (FR)</SelectItem>
                        <SelectItem value="en">English (US)</SelectItem>
                        <SelectItem value="ar">العربية (AR)</SelectItem>
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
                <InfoTooltip side="left" text="Préférences globales. Les règles d'alerte détaillées se configurent dans l'onglet 'Alertes'." />
              </div>
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-sm text-zinc-300 flex items-center">
                      Alerte de Production Basse
                      <InfoTooltip side="left" text="Active la règle de cadence faible dans le moteur d'alertes. Le seuil se configure dans l'onglet Alertes." />
                    </Label>
                    <p className="text-[10px] text-zinc-500 italic">Si le débit tombe sous le seuil configuré</p>
                  </div>
                  <Switch
                    checked={general.notify_low_production === 'true'}
                    onCheckedChange={v => {
                      setGeneral(g => ({ ...g, notify_low_production: v ? 'true' : 'false' }));
                      const rule = alertRules.find(r => r.type === 'production_rate');
                      if (rule) updateRule(rule.id, { is_active: v });
                    }}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-sm text-zinc-300 flex items-center">
                      Rapports Hebdomadaires
                      <InfoTooltip side="left" text="Génération et envoi automatique du rapport de production chaque lundi. Nécessite la configuration email." />
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

        {/* ── Alertes ──────────────────────────────────────────────────────────── */}
        <TabsContent value="alerts" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            {/* Notification channels */}
            <Card className="p-6 bg-zinc-900/50 border-zinc-800 space-y-6">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
                <div className="flex items-center gap-2 font-semibold text-white">
                  <Bell className="w-5 h-5 text-orange-500" />
                  <span>Canaux de Notification</span>
                  <InfoTooltip side="right" text="Modifications sauvegardées automatiquement en base de données." />
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
                  <Switch checked={alertSettings.sound_enabled} onCheckedChange={v => saveAlertSettings({ sound_enabled: v })} />
                </div>

                {/* Volume */}
                <div className="space-y-3">
                  <Label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest flex items-center">
                    Volume sonore ({alertSettings.sound_volume}%)
                    <InfoTooltip side="right" text="Actif uniquement si 'Alertes Sonores' est activé." />
                  </Label>
                  <div className="flex items-center gap-3">
                    <VolumeX className="w-4 h-4 text-zinc-500 shrink-0" />
                    <Slider
                      value={[alertSettings.sound_volume]}
                      onValueChange={([v]) => setAlertSettings(s => ({ ...s, sound_volume: v }))}
                      onValueCommit={([v]) => saveAlertSettings({ sound_volume: v })}
                      min={0} max={100} step={5} className="flex-1"
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
                    <Switch checked={alertSettings.email_enabled} onCheckedChange={v => saveAlertSettings({ email_enabled: v })} />
                  </div>

                  {/* Slack/Teams */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="w-4 h-4 text-zinc-500" />
                      <span className="text-xs text-zinc-300 flex items-center">
                        Notifications Slack/Teams
                        <InfoTooltip side="right" text="Messages via webhook. Configurez l'URL du webhook dans la page Intégration > Services Tiers." />
                      </span>
                    </div>
                    <Switch checked={alertSettings.slack_enabled} onCheckedChange={v => saveAlertSettings({ slack_enabled: v })} />
                  </div>
                </div>

                {/* Supervisor phone */}
                <div className="pt-4 border-t border-zinc-800 space-y-2">
                  <Label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest flex items-center">
                    <PhoneCall className="w-3 h-3 mr-1" /> Téléphone Superviseur
                    <InfoTooltip side="right" text="Numéro affiché sur la page des alertes et dans les rapports d'incident." />
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      value={alertSettings.supervisor_phone}
                      onChange={e => setAlertSettings(s => ({ ...s, supervisor_phone: e.target.value }))}
                      className="bg-zinc-950 border-zinc-800 text-white h-10 font-mono"
                      placeholder="+33 6 XX XX XX XX"
                    />
                    <Button className="bg-orange-600 hover:bg-orange-700 text-white h-10 px-3" onClick={() => saveAlertSettings({})}>
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
                <span>Règles d'Alerte Actives</span>
                <InfoTooltip side="left" text="Aperçu des règles. Pour créer de nouvelles règles ou modifier les seuils, utilisez la page Gestion des Alertes." />
              </div>

              {loading ? (
                <div className="flex justify-center py-6"><Loader2 className="w-6 h-6 text-orange-500 animate-spin" /></div>
              ) : alertRules.length === 0 ? (
                <p className="text-xs text-zinc-600 italic text-center py-4">Aucune règle configurée.</p>
              ) : (
                <div className="space-y-3">
                  {alertRules.map(rule => (
                    <div key={rule.id} className="flex items-center gap-3 p-3 rounded-lg bg-zinc-900 border border-zinc-800">
                      <div className={`w-1.5 h-8 rounded-full shrink-0 ${rule.type === 'error_rate' ? 'bg-red-500' : 'bg-yellow-500'} ${!rule.is_active ? 'opacity-30' : ''}`} />
                      <div className="flex-1 min-w-0">
                        <div className={`text-xs font-bold truncate ${rule.is_active ? 'text-white' : 'text-zinc-500'}`}>{rule.name}</div>
                        <div className="text-[10px] text-zinc-500">{ruleTypeLabel(rule.type)} — seuil : {rule.threshold}</div>
                      </div>
                      <Switch checked={rule.is_active} onCheckedChange={v => updateRule(rule.id, { is_active: v })} />
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

        {/* ── Performance ──────────────────────────────────────────────────────── */}
        <TabsContent value="performance" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            {/* Logging */}
            <Card className="p-6 bg-zinc-900/50 border-zinc-800 space-y-6">
              <div className="flex items-center gap-2 font-semibold text-white border-b border-zinc-800 pb-4">
                <Settings2 className="w-5 h-5 text-orange-500" />
                <span>Configuration de Logging</span>
                <InfoTooltip side="right" text="'Info' est recommandé en production. 'Debug' est utile en développement et génère beaucoup de logs." />
              </div>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-zinc-500 text-[10px] uppercase font-bold tracking-widest">Niveau de Log</Label>
                  <Select value={general.log_level} onValueChange={v => setGeneral(g => ({ ...g, log_level: v }))}>
                    <SelectTrigger className="bg-zinc-950 border-zinc-800 text-white h-11"><SelectValue /></SelectTrigger>
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
                    type="number" min={1} max={365}
                    value={general.log_retention_days}
                    onChange={e => setGeneral(g => ({ ...g, log_retention_days: e.target.value }))}
                    className="bg-zinc-950 border-zinc-800 text-white h-11"
                  />
                </div>
              </div>
            </Card>

            {/* Cache */}
            <Card className="p-6 bg-zinc-900/50 border-zinc-800 space-y-6">
              <div className="flex items-center gap-2 font-semibold text-white border-b border-zinc-800 pb-4">
                <HardDrive className="w-5 h-5 text-orange-500" />
                <span>Optimisation Cache</span>
                <InfoTooltip side="left" text="Gestion du cache des captures vidéo de sacs. Le nettoyage automatique libère de l'espace quand le disque dépasse 90%." />
              </div>
              <div className="space-y-5">
                <div className="space-y-2">
                  <Label className="text-zinc-500 text-[10px] uppercase font-bold tracking-widest flex items-center">
                    Taille Max Cache Vidéo (GB)
                    <InfoTooltip side="right" text="Espace disque maximum alloué aux captures d'images et vidéo des sacs détectés." />
                  </Label>
                  <Input
                    type="number" min={1} max={500}
                    value={general.cache_max_gb}
                    onChange={e => setGeneral(g => ({ ...g, cache_max_gb: e.target.value }))}
                    className="bg-zinc-950 border-zinc-800 text-white h-11"
                  />
                </div>
                <div className="flex items-center justify-between pt-2">
                  <div className="space-y-0.5">
                    <Label className="text-sm text-zinc-300 flex items-center">
                      Nettoyage Automatique
                      <InfoTooltip side="left" text="Supprime automatiquement les captures les plus anciennes quand l'espace disque dépasse 90% de la limite configurée." />
                    </Label>
                    <p className="text-[10px] text-zinc-500 italic">Supprimer les plus anciens si &gt; 90%</p>
                  </div>
                  <Switch
                    checked={general.cache_auto_cleanup === 'true'}
                    onCheckedChange={v => setGeneral(g => ({ ...g, cache_auto_cleanup: v ? 'true' : 'false' }))}
                  />
                </div>
              </div>
            </Card>
          </div>
        </TabsContent>

        {/* ── Sécurité ─────────────────────────────────────────────────────────── */}
        <TabsContent value="security" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            {/* Session & Auth */}
            <Card className="p-6 bg-zinc-900/50 border-zinc-800 space-y-6">
              <div className="flex items-center gap-2 font-semibold text-white border-b border-zinc-800 pb-4">
                <Lock className="w-5 h-5 text-orange-500" />
                <span>Session & Authentification</span>
                <InfoTooltip side="right" text="Paramètres de durée de vie des tokens JWT et de verrouillage de compte." />
              </div>

              <div className="space-y-5">
                <div className="space-y-2">
                  <Label className="text-zinc-500 text-[10px] uppercase font-bold tracking-widest flex items-center">
                    Expiration du Token JWT (minutes)
                    <InfoTooltip side="right" text="Durée de validité du token d'accès après connexion. Valeur recommandée : 30 à 60 min." />
                  </Label>
                  <Input
                    type="number" min={5} max={1440}
                    value={security.jwt_expire_minutes}
                    onChange={e => setSecurity(s => ({ ...s, jwt_expire_minutes: e.target.value }))}
                    className="bg-zinc-950 border-zinc-800 text-white h-11 font-mono"
                  />
                  <p className="text-[10px] text-zinc-600 italic">Actuellement : {security.jwt_expire_minutes} min — les tokens existants ne sont pas invalidés immédiatement</p>
                </div>

                <div className="space-y-2">
                  <Label className="text-zinc-500 text-[10px] uppercase font-bold tracking-widest flex items-center">
                    Tentatives de Connexion Max
                    <InfoTooltip side="right" text="Nombre maximum d'échecs de connexion avant verrouillage temporaire du compte." />
                  </Label>
                  <Input
                    type="number" min={3} max={20}
                    value={security.max_login_attempts}
                    onChange={e => setSecurity(s => ({ ...s, max_login_attempts: e.target.value }))}
                    className="bg-zinc-950 border-zinc-800 text-white h-11 font-mono"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-zinc-500 text-[10px] uppercase font-bold tracking-widest flex items-center">
                    Timeout de Session Inactive (minutes)
                    <InfoTooltip side="right" text="Déconnexion automatique après cette durée d'inactivité. 480 = 8 heures." />
                  </Label>
                  <Input
                    type="number" min={5} max={1440}
                    value={security.session_timeout_minutes}
                    onChange={e => setSecurity(s => ({ ...s, session_timeout_minutes: e.target.value }))}
                    className="bg-zinc-950 border-zinc-800 text-white h-11 font-mono"
                  />
                </div>
              </div>
            </Card>

            {/* Security policies */}
            <Card className="p-6 bg-zinc-900/50 border-zinc-800 space-y-6">
              <div className="flex items-center gap-2 font-semibold text-white border-b border-zinc-800 pb-4">
                <Shield className="w-5 h-5 text-orange-500" />
                <span>Politiques de Sécurité</span>
              </div>

              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label className="text-sm text-zinc-300 flex items-center">
                      2FA Obligatoire (Admins)
                      <InfoTooltip side="right" text="Exige un code OTP (TOTP) en plus du mot de passe pour tous les comptes administrateurs." />
                    </Label>
                    <p className="text-[11px] text-zinc-500">Obligatoire pour le rôle admin</p>
                  </div>
                  <Switch
                    checked={security.require_2fa_admin === 'true'}
                    onCheckedChange={v => setSecurity(s => ({ ...s, require_2fa_admin: v ? 'true' : 'false' }))}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label className="text-sm text-zinc-300 flex items-center">
                      Forcer HTTPS
                      <InfoTooltip side="right" text="Redirige automatiquement les connexions HTTP vers HTTPS. Nécessite un certificat SSL valide configuré sur le serveur." />
                    </Label>
                    <p className="text-[11px] text-zinc-500">Redirection HTTP → HTTPS</p>
                  </div>
                  <Switch
                    checked={security.force_https === 'true'}
                    onCheckedChange={v => setSecurity(s => ({ ...s, force_https: v ? 'true' : 'false' }))}
                  />
                </div>
              </div>

              {/* Info box */}
              <div className="mt-4 p-4 rounded-xl bg-zinc-950 border border-zinc-800 space-y-3">
                <div className="flex items-center gap-2 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                  <Key className="w-3.5 h-3.5" /> Chiffrement & Hachage
                </div>
                <div className="space-y-2 text-xs">
                  {[
                    ['Mots de passe', 'bcrypt (cost 12)'],
                    ['Tokens JWT', 'HS256 — SECRET_KEY env'],
                    ['Transport', 'HTTPS / TLS 1.3 recommandé'],
                  ].map(([label, value]) => (
                    <div key={label} className="flex justify-between">
                      <span className="text-zinc-500">{label} :</span>
                      <span className="text-zinc-300 font-mono">{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          </div>
        </TabsContent>

        {/* ── Archivage & Backup ────────────────────────────────────────────────── */}
        <TabsContent value="data" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            {/* Config export / import */}
            <Card className="p-6 bg-zinc-900/50 border-zinc-800 space-y-6">
              <div className="flex items-center gap-2 font-semibold text-white border-b border-zinc-800 pb-4">
                <FileJson className="w-5 h-5 text-orange-500" />
                <span>Export / Import Configuration</span>
                <InfoTooltip side="right" text="Exporte tous les paramètres système en JSON. L'import restaure les paramètres depuis un fichier exporté précédemment." />
              </div>

              <div className="space-y-4">
                <div className="p-4 rounded-lg bg-zinc-950 border border-zinc-800 space-y-2">
                  <p className="text-xs font-bold text-zinc-300">Exporter la configuration</p>
                  <p className="text-[10px] text-zinc-500 leading-relaxed">
                    Génère un fichier <span className="font-mono text-zinc-400">.json</span> contenant tous les paramètres système et les configurations de caméras.
                    Utile pour migrer ou sauvegarder les réglages.
                  </p>
                  <Button
                    className="w-full mt-2 bg-zinc-800 hover:bg-zinc-700 text-white h-9 text-xs font-bold gap-2"
                    onClick={exportConfig}
                    disabled={exporting}
                  >
                    {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                    Télécharger config.json
                  </Button>
                </div>

                <div className="p-4 rounded-lg bg-zinc-950 border border-zinc-800 space-y-2">
                  <p className="text-xs font-bold text-zinc-300">Importer une configuration</p>
                  <p className="text-[10px] text-zinc-500 leading-relaxed">
                    Restaure les paramètres depuis un fichier <span className="font-mono text-zinc-400">config_backup_*.json</span> exporté précédemment.
                    <span className="text-yellow-500 ml-1">Les paramètres actuels seront écrasés.</span>
                  </p>
                  <Button
                    variant="outline"
                    className="w-full mt-2 border-zinc-700 text-orange-400 hover:text-orange-300 h-9 text-xs font-bold gap-2"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={importing}
                  >
                    {importing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                    {importing ? 'Import en cours…' : 'Choisir un fichier .json'}
                  </Button>
                </div>
              </div>
            </Card>

            {/* DB Backup */}
            <Card className="p-6 bg-zinc-900/50 border-zinc-800 space-y-6">
              <div className="flex items-center gap-2 font-semibold text-white border-b border-zinc-800 pb-4">
                <Server className="w-5 h-5 text-orange-500" />
                <span>Sauvegarde Base de Données</span>
                <InfoTooltip side="left" text="Télécharge une copie complète de la base de données SQLite. Inclut toutes les sessions, logs de détection et configurations." />
              </div>

              <div className="space-y-4">
                <div className="p-4 rounded-lg bg-zinc-950 border border-zinc-800 space-y-3">
                  <div className="flex items-center gap-2">
                    <Database className="w-4 h-4 text-zinc-500" />
                    <p className="text-xs font-bold text-zinc-300">Backup Manuel</p>
                  </div>
                  <p className="text-[10px] text-zinc-500 leading-relaxed">
                    Télécharge le fichier <span className="font-mono text-zinc-400">production.db</span> (SQLite).
                    Contient l'intégralité des données : sessions, logs, alertes, utilisateurs et paramètres.
                  </p>
                  <Button
                    className="w-full mt-1 bg-orange-600 hover:bg-orange-700 text-white h-9 text-xs font-bold gap-2"
                    onClick={downloadBackup}
                    disabled={backingUp}
                  >
                    {backingUp ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                    {backingUp ? 'Préparation…' : 'Télécharger production.db'}
                  </Button>
                </div>

                <div className="p-4 rounded-lg bg-zinc-950 border border-zinc-800 space-y-2">
                  <div className="flex items-center gap-2">
                    <Cloud className="w-4 h-4 text-zinc-500" />
                    <p className="text-xs font-bold text-zinc-300">Sauvegarde Cloud (AWS S3)</p>
                  </div>
                  <p className="text-[10px] text-zinc-500 leading-relaxed">
                    La sauvegarde automatique vers S3 nécessite les credentials AWS configurés en variables d'environnement
                    (<span className="font-mono text-zinc-400">AWS_ACCESS_KEY_ID</span>,{' '}
                    <span className="font-mono text-zinc-400">AWS_SECRET_ACCESS_KEY</span>).
                  </p>
                  <div className="flex items-center gap-2 pt-1">
                    <div className="w-2 h-2 rounded-full bg-zinc-700" />
                    <span className="text-[10px] text-zinc-500">Non configuré</span>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Contextual save footer — only for tabs that need an explicit save */}
      {(activeTab === 'general' || activeTab === 'performance') && (
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
      )}

      {activeTab === 'security' && (
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
            onClick={saveSecurity}
            disabled={secSaving}
          >
            {secSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Enregistrer la Sécurité
          </Button>
        </div>
      )}
    </div>
  );
}

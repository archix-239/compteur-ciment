import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Link as LinkIcon, Webhook, Mail, MessageSquare, Loader2,
  Save, CheckCircle2, AlertCircle, RefreshCw, Send, Eye, EyeOff,
  Globe, Settings, Info, BookOpen, ShieldCheck, Calendar,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { API_URL, getToken } from '@/lib/api';

// ── InfoTooltip ────────────────────────────────────────────────────────────────
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
        <TooltipContent side={side} className="max-w-[260px] bg-zinc-900 border border-zinc-700 text-zinc-300 text-xs leading-relaxed whitespace-normal">
          {text}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// ── Types ──────────────────────────────────────────────────────────────────────

interface IntegrationSettings {
  webhook_enabled: string;
  webhook_url: string;
  webhook_secret: string;
  smtp_host: string;
  smtp_port: string;
  smtp_user: string;
  smtp_password: string;
  smtp_from: string;
  slack_webhook_url: string;
  slack_enabled: string;
  teams_webhook_url: string;
  teams_enabled: string;
}

const DEFAULTS: IntegrationSettings = {
  webhook_enabled: 'false', webhook_url: '', webhook_secret: '',
  smtp_host: '', smtp_port: '587', smtp_user: '', smtp_password: '', smtp_from: '',
  slack_webhook_url: '', slack_enabled: 'false',
  teams_webhook_url: '', teams_enabled: 'false',
};

// ── Component ──────────────────────────────────────────────────────────────────

export default function ThirdParty() {
  const [cfg, setCfg]           = useState<IntegrationSettings>(DEFAULTS);
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);
  const [testing, setTesting]   = useState<string | null>(null);
  const [showSmtpPwd, setShowSmtpPwd] = useState(false);
  const [showSecret, setShowSecret]   = useState(false);

  const [flash, setFlash] = useState<{ text: string; ok: boolean } | null>(null);
  const flashTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const showFlash = (text: string, ok = true) => {
    if (flashTimer.current) clearTimeout(flashTimer.current);
    setFlash({ text, ok });
    flashTimer.current = setTimeout(() => setFlash(null), 5000);
  };

  const authHeader = () => ({ Authorization: `Bearer ${getToken()}` });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/system/integration-settings`, { headers: authHeader() });
      if (res.ok) setCfg(await res.json());
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const save = async () => {
    setSaving(true);
    try {
      const res = await fetch(`${API_URL}/api/system/integration-settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...authHeader() },
        body: JSON.stringify(cfg),
      });
      if (res.ok) showFlash('Paramètres d\'intégration enregistrés.');
      else showFlash('Erreur lors de la sauvegarde.', false);
    } catch {
      showFlash('Erreur réseau.', false);
    } finally {
      setSaving(false);
    }
  };

  const testWebhook = async () => {
    if (!cfg.webhook_url) { showFlash('Configurez d\'abord l\'URL du webhook.', false); return; }
    setTesting('webhook');
    // Save first so the backend uses the latest URL
    await fetch(`${API_URL}/api/system/integration-settings`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...authHeader() },
      body: JSON.stringify(cfg),
    });
    try {
      const res = await fetch(`${API_URL}/api/system/test-webhook`, {
        method: 'POST', headers: authHeader(),
      });
      if (res.ok) {
        const d = await res.json();
        showFlash(`Webhook testé avec succès — HTTP ${d.status_code}`);
      } else {
        const d = await res.json().catch(() => ({}));
        showFlash((d as { detail?: string }).detail ?? 'Échec du test webhook.', false);
      }
    } catch {
      showFlash('Erreur réseau lors du test.', false);
    } finally {
      setTesting(null);
    }
  };

  const set = (key: keyof IntegrationSettings, value: string) =>
    setCfg(c => ({ ...c, [key]: value }));

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-7 h-7 text-orange-500 animate-spin" />
      </div>
    );
  }

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
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Services Tiers</h1>
          <p className="text-muted-foreground text-sm">Configurez les intégrations externes : webhooks, email, Slack, Teams</p>
        </div>
        <Button variant="outline" className="border-zinc-800 text-white gap-2 h-10" onClick={load}>
          <RefreshCw className="w-4 h-4" /> Actualiser
        </Button>
      </div>

      <Tabs defaultValue="webhook" className="space-y-6">
        <TabsList className="bg-zinc-900 border border-zinc-800 p-1">
          <TabsTrigger value="webhook" className="gap-2 text-white data-[state=active]:bg-zinc-800">
            <Webhook className="w-4 h-4" /> Webhook
          </TabsTrigger>
          <TabsTrigger value="smtp" className="gap-2 text-white data-[state=active]:bg-zinc-800">
            <Mail className="w-4 h-4" /> Email SMTP
          </TabsTrigger>
          <TabsTrigger value="messaging" className="gap-2 text-white data-[state=active]:bg-zinc-800">
            <MessageSquare className="w-4 h-4" /> Slack / Teams
          </TabsTrigger>
        </TabsList>

        {/* ── Webhook ── */}
        <TabsContent value="webhook">
          <Card className="p-6 bg-zinc-900/50 border-zinc-800 space-y-6">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
              <div className="flex items-center gap-2 font-semibold text-white">
                <Webhook className="w-5 h-5 text-orange-500" />
                <span>Webhook Sortant</span>
              </div>
              <Switch
                checked={cfg.webhook_enabled === 'true'}
                onCheckedChange={v => set('webhook_enabled', v ? 'true' : 'false')}
              />
            </div>

            <div className="space-y-5">
              <div className="space-y-2">
                <Label className="text-zinc-500 text-[10px] uppercase font-bold tracking-widest flex items-center gap-1">
                  <Globe className="w-3 h-3" /> URL du Webhook
                </Label>
                <Input
                  value={cfg.webhook_url}
                  onChange={e => set('webhook_url', e.target.value)}
                  placeholder="https://example.com/hooks/ciment-monitor"
                  className="bg-zinc-950 border-zinc-800 text-white h-11 font-mono text-sm"
                  disabled={cfg.webhook_enabled !== 'true'}
                />
                <p className="text-[10px] text-zinc-600 italic">
                  Ciment Monitor enverra une requête POST JSON à cette URL lors de chaque événement de production.
                </p>
              </div>

              <div className="space-y-2">
                <Label className="text-zinc-500 text-[10px] uppercase font-bold tracking-widest flex items-center gap-1">
                  <Settings className="w-3 h-3" /> Secret de Signature (optionnel)
                </Label>
                <div className="relative">
                  <Input
                    type={showSecret ? 'text' : 'password'}
                    value={cfg.webhook_secret}
                    onChange={e => set('webhook_secret', e.target.value)}
                    placeholder="Laissez vide si non requis"
                    className="bg-zinc-950 border-zinc-800 text-white h-11 font-mono pr-10"
                    disabled={cfg.webhook_enabled !== 'true'}
                  />
                  <button
                    type="button"
                    onClick={() => setShowSecret(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white transition-colors"
                  >
                    {showSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-[10px] text-zinc-600 italic">
                  Transmis dans l'en-tête <code className="text-zinc-400">X-Webhook-Secret</code> pour vérifier l'authenticité.
                </p>
              </div>

              {/* Payload example */}
              <div className="p-4 rounded-lg bg-zinc-950 border border-zinc-800 space-y-2">
                <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest">Exemple de payload envoyé</p>
                <pre className="text-[10px] text-zinc-400 font-mono leading-relaxed overflow-x-auto">
{`{
  "event": "count",
  "session_id": "S-20240313-01",
  "bag_count": 1420,
  "rejected": 12,
  "timestamp": "2024-03-13T14:25:00Z"
}`}
                </pre>
              </div>
            </div>

            <div className="flex justify-between items-center pt-2 border-t border-zinc-800">
              <Button
                variant="outline"
                className="border-zinc-700 text-zinc-300 gap-2 h-10"
                onClick={testWebhook}
                disabled={testing === 'webhook' || cfg.webhook_enabled !== 'true' || !cfg.webhook_url}
              >
                {testing === 'webhook' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                Envoyer un test
              </Button>
              <Button
                className="bg-orange-600 hover:bg-orange-700 text-white gap-2 h-10 px-8"
                onClick={save}
                disabled={saving}
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Enregistrer
              </Button>
            </div>
          </Card>
        </TabsContent>

        {/* ── SMTP ── */}
        <TabsContent value="smtp">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* Formulaire SMTP */}
            <Card className="lg:col-span-2 p-6 bg-zinc-900/50 border-zinc-800 space-y-6">
              <div className="flex items-center gap-2 font-semibold text-white border-b border-zinc-800 pb-4">
                <Mail className="w-5 h-5 text-orange-500" />
                <span>Configuration Email SMTP</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <Label className="text-zinc-500 text-[10px] uppercase font-bold tracking-widest flex items-center">
                    Serveur SMTP
                    <InfoTooltip side="right" text="Adresse du serveur d'envoi d'emails de votre fournisseur. Gmail : smtp.gmail.com — Outlook : smtp.office365.com — Serveur d'entreprise : selon votre IT." />
                  </Label>
                  <Input
                    value={cfg.smtp_host}
                    onChange={e => set('smtp_host', e.target.value)}
                    placeholder="smtp.gmail.com"
                    className="bg-zinc-950 border-zinc-800 text-white h-11 font-mono"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-zinc-500 text-[10px] uppercase font-bold tracking-widest flex items-center">
                    Port
                    <InfoTooltip side="right" text="587 = STARTTLS (recommandé). 465 = SSL/TLS. 25 = non chiffré (déconseillé). Gmail impose le port 587." />
                  </Label>
                  <Input
                    value={cfg.smtp_port}
                    onChange={e => set('smtp_port', e.target.value)}
                    placeholder="587"
                    className="bg-zinc-950 border-zinc-800 text-white h-11 font-mono"
                    type="number"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-zinc-500 text-[10px] uppercase font-bold tracking-widest flex items-center">
                    Utilisateur SMTP
                    <InfoTooltip side="right" text="Pour Gmail : votre adresse Gmail complète (ex : moncompte@gmail.com). C'est aussi l'adresse qui sera utilisée pour l'authentification." />
                  </Label>
                  <Input
                    value={cfg.smtp_user}
                    onChange={e => set('smtp_user', e.target.value)}
                    placeholder="noreply@usine.com"
                    className="bg-zinc-950 border-zinc-800 text-white h-11"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-zinc-500 text-[10px] uppercase font-bold tracking-widest flex items-center">
                    Mot de passe SMTP
                    <InfoTooltip side="right" text="Pour Gmail : NE PAS utiliser votre mot de passe habituel. Utilisez un mot de passe d'application généré dans Mon compte Google → Sécurité → Mots de passe des applications (code 16 caractères)." />
                  </Label>
                  <div className="relative">
                    <Input
                      type={showSmtpPwd ? 'text' : 'password'}
                      value={cfg.smtp_password}
                      onChange={e => set('smtp_password', e.target.value)}
                      placeholder="••••••••"
                      className="bg-zinc-950 border-zinc-800 text-white h-11 pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowSmtpPwd(v => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white transition-colors"
                    >
                      {showSmtpPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <div className="md:col-span-2 space-y-2">
                  <Label className="text-zinc-500 text-[10px] uppercase font-bold tracking-widest flex items-center">
                    Adresse d'Envoi (From)
                    <InfoTooltip side="right" text="Adresse qui apparaît comme expéditeur dans les emails reçus. Pour Gmail elle doit être identique à l'utilisateur SMTP. Peut inclure un nom d'affichage : Ciment Monitor <moncompte@gmail.com>." />
                  </Label>
                  <Input
                    value={cfg.smtp_from}
                    onChange={e => set('smtp_from', e.target.value)}
                    placeholder="Ciment Monitor <noreply@usine.com>"
                    className="bg-zinc-950 border-zinc-800 text-white h-11"
                  />
                </div>
              </div>

              <div className="p-4 rounded-lg bg-zinc-950/60 border border-zinc-800 text-[10px] text-zinc-500 space-y-1">
                <p className="font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-1.5">
                  <Info className="w-3 h-3" /> Utilisé pour :
                </p>
                <ul className="list-disc list-inside space-y-0.5 mt-1">
                  <li>Alertes critiques de production</li>
                  <li>Rapports planifiés automatiques (configurables dans Rapports → Export de Données)</li>
                  <li>Notifications d'anomalie qualité</li>
                </ul>
              </div>

              <div className="flex justify-between items-center pt-2 border-t border-zinc-800">
              <Button
                variant="outline"
                className="border-zinc-700 text-zinc-300 gap-2 h-10"
                disabled={testing === 'smtp' || !cfg.smtp_host}
                onClick={async () => {
                  setTesting('smtp');
                  // Save first so backend uses latest config
                  await fetch(`${API_URL}/api/system/integration-settings`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json', ...authHeader() },
                    body: JSON.stringify(cfg),
                  });
                  try {
                    const res = await fetch(`${API_URL}/api/system/test-smtp`, {
                      method: 'POST', headers: authHeader(),
                    });
                    const d = await res.json();
                    if (res.ok) showFlash(d.message ?? 'Email de test envoyé.');
                    else showFlash((d as { detail?: string }).detail ?? 'Échec du test SMTP.', false);
                  } catch {
                    showFlash('Erreur réseau lors du test SMTP.', false);
                  } finally {
                    setTesting(null);
                  }
                }}
              >
                {testing === 'smtp' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                Tester la connexion
              </Button>
              <Button
                className="bg-orange-600 hover:bg-orange-700 text-white gap-2 h-10 px-8"
                onClick={save}
                disabled={saving}
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Enregistrer
              </Button>
            </div>
          </Card>

            {/* Guide de configuration */}
            <div className="space-y-4">

              {/* Guide Gmail */}
              <Card className="p-5 bg-zinc-900/50 border-zinc-800 space-y-4">
                <div className="flex items-center gap-2 font-semibold text-white border-b border-zinc-800 pb-3">
                  <BookOpen className="w-4 h-4 text-orange-500" />
                  <span className="text-sm">Guide Gmail</span>
                </div>
                <ol className="space-y-2.5 text-xs text-zinc-400 list-decimal list-inside">
                  <li>Connectez-vous à <span className="text-orange-400 font-mono text-[11px]">myaccount.google.com</span></li>
                  <li>Allez dans <span className="text-white">Sécurité</span> → activez la <span className="text-white">Vérification en 2 étapes</span></li>
                  <li>Cherchez <span className="text-white">Mots de passe des applications</span></li>
                  <li>Créez un mot de passe → application : <span className="text-white">Autre</span> → nom : <span className="text-white">CimentMonitor</span></li>
                  <li>Copiez le <span className="text-white">code 16 caractères</span> dans le champ mot de passe</li>
                </ol>
                <div className="p-3 bg-zinc-950 rounded-lg space-y-1 text-[11px] font-mono border border-zinc-800">
                  <p className="text-zinc-500 uppercase text-[9px] tracking-widest mb-2">Valeurs Gmail</p>
                  <p><span className="text-zinc-500">Serveur :</span> <span className="text-orange-400">smtp.gmail.com</span></p>
                  <p><span className="text-zinc-500">Port    :</span> <span className="text-orange-400">587</span></p>
                  <p><span className="text-zinc-500">Sécurité:</span> <span className="text-orange-400">STARTTLS</span></p>
                </div>
              </Card>

              {/* Sécurité */}
              <Card className="p-5 bg-zinc-900/50 border-zinc-800 space-y-3">
                <div className="flex items-center gap-2 font-semibold text-white border-b border-zinc-800 pb-3">
                  <ShieldCheck className="w-4 h-4 text-green-500" />
                  <span className="text-sm">Sécurité</span>
                </div>
                <ul className="space-y-2 text-[11px] text-zinc-400">
                  <li className="flex items-start gap-2"><span className="text-green-500 mt-0.5">✓</span> Le mot de passe d'application ne donne accès qu'à l'envoi d'emails, pas à votre compte Google</li>
                  <li className="flex items-start gap-2"><span className="text-green-500 mt-0.5">✓</span> Connexion chiffrée via STARTTLS (port 587)</li>
                  <li className="flex items-start gap-2"><span className="text-orange-400 mt-0.5">!</span> Révocable à tout moment depuis Mon compte Google → Sécurité</li>
                </ul>
              </Card>

              {/* Utilisation */}
              <Card className="p-5 bg-zinc-900/50 border-zinc-800 space-y-3">
                <div className="flex items-center gap-2 font-semibold text-white border-b border-zinc-800 pb-3">
                  <Calendar className="w-4 h-4 text-blue-400" />
                  <span className="text-sm">Rapports planifiés</span>
                </div>
                <p className="text-[11px] text-zinc-400">
                  Une fois le SMTP configuré, activez l'envoi automatique dans :<br />
                  <span className="text-orange-400">Rapports → Export de Données → Planification</span>
                </p>
                <p className="text-[11px] text-zinc-400">
                  Le fichier (CSV / Excel / PDF) sera envoyé en pièce jointe à l'adresse de destination configurée dans la planification.
                </p>
              </Card>

            </div>
          </div>
        </TabsContent>

        {/* ── Slack / Teams ── */}
        <TabsContent value="messaging" className="space-y-6">
          {/* Slack */}
          <Card className="p-6 bg-zinc-900/50 border-zinc-800 space-y-5">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
              <div className="flex items-center gap-2 font-semibold text-white">
                <MessageSquare className="w-5 h-5 text-[#4A154B]" />
                <span>Slack</span>
              </div>
              <Switch
                checked={cfg.slack_enabled === 'true'}
                onCheckedChange={v => set('slack_enabled', v ? 'true' : 'false')}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-zinc-500 text-[10px] uppercase font-bold tracking-widest">URL Webhook Slack</Label>
              <Input
                value={cfg.slack_webhook_url}
                onChange={e => set('slack_webhook_url', e.target.value)}
                placeholder="https://hooks.slack.com/services/T.../B.../..."
                className="bg-zinc-950 border-zinc-800 text-white h-11 font-mono text-sm"
                disabled={cfg.slack_enabled !== 'true'}
              />
              <p className="text-[10px] text-zinc-600 italic">
                Créez un webhook entrant depuis votre espace Slack : <span className="text-zinc-500">api.slack.com/apps → Incoming Webhooks</span>
              </p>
            </div>
          </Card>

          {/* Teams */}
          <Card className="p-6 bg-zinc-900/50 border-zinc-800 space-y-5">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
              <div className="flex items-center gap-2 font-semibold text-white">
                <MessageSquare className="w-5 h-5 text-[#6264A7]" />
                <span>Microsoft Teams</span>
              </div>
              <Switch
                checked={cfg.teams_enabled === 'true'}
                onCheckedChange={v => set('teams_enabled', v ? 'true' : 'false')}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-zinc-500 text-[10px] uppercase font-bold tracking-widest">URL Webhook Teams</Label>
              <Input
                value={cfg.teams_webhook_url}
                onChange={e => set('teams_webhook_url', e.target.value)}
                placeholder="https://your-domain.webhook.office.com/webhookb2/..."
                className="bg-zinc-950 border-zinc-800 text-white h-11 font-mono text-sm"
                disabled={cfg.teams_enabled !== 'true'}
              />
              <p className="text-[10px] text-zinc-600 italic">
                Ajoutez un connecteur "Incoming Webhook" dans le canal Teams souhaité.
              </p>
            </div>
          </Card>

          <div className="flex justify-end">
            <Button
              className="bg-orange-600 hover:bg-orange-700 text-white gap-2 h-10 px-8"
              onClick={save}
              disabled={saving}
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Enregistrer
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Link as LinkIcon, Webhook, Mail, MessageSquare, Loader2,
  Save, CheckCircle2, AlertCircle, RefreshCw, Send, Eye, EyeOff,
  Globe, Settings,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { API_URL, getToken } from '@/lib/api';

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
          <Card className="p-6 bg-zinc-900/50 border-zinc-800 space-y-6">
            <div className="flex items-center gap-2 font-semibold text-white border-b border-zinc-800 pb-4">
              <Mail className="w-5 h-5 text-orange-500" />
              <span>Configuration Email SMTP</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-2">
                <Label className="text-zinc-500 text-[10px] uppercase font-bold tracking-widest">Serveur SMTP</Label>
                <Input
                  value={cfg.smtp_host}
                  onChange={e => set('smtp_host', e.target.value)}
                  placeholder="smtp.gmail.com"
                  className="bg-zinc-950 border-zinc-800 text-white h-11 font-mono"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-zinc-500 text-[10px] uppercase font-bold tracking-widest">Port</Label>
                <Input
                  value={cfg.smtp_port}
                  onChange={e => set('smtp_port', e.target.value)}
                  placeholder="587"
                  className="bg-zinc-950 border-zinc-800 text-white h-11 font-mono"
                  type="number"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-zinc-500 text-[10px] uppercase font-bold tracking-widest">Utilisateur SMTP</Label>
                <Input
                  value={cfg.smtp_user}
                  onChange={e => set('smtp_user', e.target.value)}
                  placeholder="noreply@usine.com"
                  className="bg-zinc-950 border-zinc-800 text-white h-11"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-zinc-500 text-[10px] uppercase font-bold tracking-widest">Mot de passe SMTP</Label>
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
                <Label className="text-zinc-500 text-[10px] uppercase font-bold tracking-widest">Adresse d'Envoi (From)</Label>
                <Input
                  value={cfg.smtp_from}
                  onChange={e => set('smtp_from', e.target.value)}
                  placeholder="Ciment Monitor <noreply@usine.com>"
                  className="bg-zinc-950 border-zinc-800 text-white h-11"
                />
              </div>
            </div>

            <div className="p-4 rounded-lg bg-zinc-950/60 border border-zinc-800 text-[10px] text-zinc-500 space-y-1">
              <p className="font-bold text-zinc-400 uppercase tracking-widest">Utilisé pour :</p>
              <ul className="list-disc list-inside space-y-0.5">
                <li>Alertes critiques de production</li>
                <li>Rapports hebdomadaires automatiques (si activé dans Paramètres Système)</li>
                <li>Notifications d'anomalie</li>
              </ul>
            </div>

            <div className="flex justify-end pt-2 border-t border-zinc-800">
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

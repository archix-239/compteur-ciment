import { useState, useEffect, useCallback } from 'react';
import {
  Download,
  FileText,
  Table as TableIcon,
  Code,
  FileJson,
  Calendar,
  Filter,
  CheckCircle2,
  Loader2,
  RefreshCcw,
  AlertCircle,
  Clock,
  Rows,
  HardDrive,
  Play,
  Save,
  Bell,
  Mail,
  ToggleLeft,
  ToggleRight,
  ChevronDown,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { PageHeader } from '@/components/PageHeader';
import { API_URL } from '@/lib/api';

// ── InfoTooltip ────────────────────────────────────────────────────────────────
function InfoTooltip({ text, side = 'top' }: { text: string; side?: 'top' | 'right' | 'bottom' | 'left' }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          className="ml-1 inline-flex items-center justify-center w-4 h-4 rounded-full bg-zinc-700 hover:bg-zinc-600 text-[9px] font-bold text-zinc-400 hover:text-white transition-colors leading-none"
        >
          ?
        </button>
      </TooltipTrigger>
      <TooltipContent side={side} className="bg-zinc-900 border-zinc-700 text-white text-xs max-w-xs">
        {text}
      </TooltipContent>
    </Tooltip>
  );
}

// ── Types ──────────────────────────────────────────────────────────────────────
interface Preview {
  rows: number;
  size_kb: number;
}

interface ExportRecord {
  name: string;
  source: string;
  period_label: string;
  rows: number;
  size_kb: number;
  timestamp: string;
  format: string;
}

interface ScheduledExport {
  name: string;
  source: string;
  period_label: string;
  rows: number;
  size_kb: number;
  triggered_at: string;
  format: string;
  download_url: string;
}

interface ScheduleConfig {
  enabled: boolean;
  frequency: string;
  time: string;
  day_of_week: number;
  day_of_month: number;
  source: string;
  format: string;
  period: string;
  email: string;
}

const FORMAT_OPTIONS = [
  {
    id: 'csv',
    label: 'CSV',
    subtitle: 'Standard Excel',
    icon: TableIcon,
    iconColor: 'text-green-500',
  },
  {
    id: 'xlsx',
    label: 'Excel (.xlsx)',
    subtitle: 'Avec mise en forme',
    icon: FileText,
    iconColor: 'text-blue-500',
  },
  {
    id: 'pdf',
    label: 'PDF Rapport',
    subtitle: 'Formaté A4 Paysage',
    icon: Code,
    iconColor: 'text-red-500',
  },
  {
    id: 'json',
    label: 'JSON',
    subtitle: 'Pour Développeurs',
    icon: FileJson,
    iconColor: 'text-orange-500',
  },
];

const SOURCE_OPTIONS = [
  { value: 'counts',    label: 'Comptages Individuels (Brut)' },
  { value: 'sessions',  label: 'Gestion des Sessions' },
  { value: 'anomalies', label: 'Journal des Anomalies' },
  { value: 'quality',   label: 'Métriques de Qualité' },
];

const PERIOD_OPTIONS = [
  { value: 'today',        label: "Aujourd'hui" },
  { value: 'yesterday',    label: 'Hier' },
  { value: 'last-7-days',  label: '7 Derniers Jours' },
  { value: 'last-30-days', label: '30 Derniers Jours' },
  { value: 'custom',       label: 'Période Personnalisée' },
];

const FREQ_OPTIONS = [
  { value: 'daily',   label: 'Quotidien' },
  { value: 'weekly',  label: 'Hebdomadaire' },
  { value: 'monthly', label: 'Mensuel' },
];

const DAY_OF_WEEK_OPTIONS = [
  { value: '1', label: 'Lundi' },
  { value: '2', label: 'Mardi' },
  { value: '3', label: 'Mercredi' },
  { value: '4', label: 'Jeudi' },
  { value: '5', label: 'Vendredi' },
  { value: '6', label: 'Samedi' },
  { value: '7', label: 'Dimanche' },
];

function fmtTs(iso: string) {
  try {
    const d = new Date(iso);
    return (
      d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' }) +
      ', ' +
      d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
    );
  } catch {
    return iso;
  }
}

export default function DataExport() {
  // ── Export state ────────────────────────────────────────────────────────
  const [period, setPeriod]     = useState('today');
  const [source, setSource]     = useState('counts');
  const [format, setFormat]     = useState<string | null>(null);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo]     = useState('');

  const [preview, setPreview]               = useState<Preview | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  const [exporting, setExporting] = useState(false);
  const [flash, setFlash]         = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  const [history, setHistory]           = useState<ExportRecord[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);

  // ── Schedule state ──────────────────────────────────────────────────────
  const [schedOpen, setSchedOpen]             = useState(false);
  const [schedCfg, setSchedCfg]               = useState<ScheduleConfig>({
    enabled: false, frequency: 'daily', time: '06:00',
    day_of_week: 1, day_of_month: 1, source: 'counts',
    format: 'csv', period: 'yesterday', email: '',
  });
  const [schedLoading, setSchedLoading]       = useState(false);
  const [schedSaving, setSchedSaving]         = useState(false);
  const [schedRunning, setSchedRunning]       = useState(false);
  const [schedHistory, setSchedHistory]       = useState<ScheduledExport[]>([]);
  const [schedFlash, setSchedFlash]           = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  // ── Load preview ──────────────────────────────────────────────────────────
  const loadPreview = useCallback(() => {
    if (period === 'custom' && (!dateFrom || !dateTo)) return;
    setPreviewLoading(true);
    const params = new URLSearchParams({ period, source });
    if (period === 'custom') { params.set('date_from', dateFrom); params.set('date_to', dateTo); }
    fetch(`${API_URL}/api/reports/export/preview?${params}`)
      .then(r => r.json())
      .then((d: Preview) => { setPreview(d); setPreviewLoading(false); })
      .catch(() => setPreviewLoading(false));
  }, [period, source, dateFrom, dateTo]);

  useEffect(() => { loadPreview(); }, [loadPreview]);

  // ── Load export history ───────────────────────────────────────────────────
  const loadHistory = () => {
    setHistoryLoading(true);
    fetch(`${API_URL}/api/reports/export/history`)
      .then(r => r.json())
      .then((d: ExportRecord[]) => { setHistory(d); setHistoryLoading(false); })
      .catch(() => setHistoryLoading(false));
  };
  useEffect(() => { loadHistory(); }, []);

  // ── Load schedule config ──────────────────────────────────────────────────
  const loadSched = () => {
    setSchedLoading(true);
    Promise.all([
      fetch(`${API_URL}/api/reports/export/schedule`).then(r => r.json()),
      fetch(`${API_URL}/api/reports/export/scheduled`).then(r => r.json()),
    ])
      .then(([cfg, hist]) => {
        setSchedCfg(cfg);
        setSchedHistory(hist);
        setSchedLoading(false);
      })
      .catch(() => setSchedLoading(false));
  };
  useEffect(() => { loadSched(); }, []);

  // ── Trigger download ──────────────────────────────────────────────────────
  const handleExport = async () => {
    if (!format) return;
    setExporting(true);
    setFlash(null);
    try {
      const params = new URLSearchParams({ period, source, fmt: format });
      if (period === 'custom') { params.set('date_from', dateFrom); params.set('date_to', dateTo); }
      const res = await fetch(`${API_URL}/api/reports/export/data?${params}`);
      if (!res.ok) throw new Error('Échec de la génération');
      const blob = await res.blob();
      const cd = res.headers.get('Content-Disposition') || '';
      const match = cd.match(/filename=([^;]+)/);
      const filename = match ? match[1] : `export.${format}`;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = filename; a.click();
      URL.revokeObjectURL(url);
      setFlash({ type: 'success', msg: `"${filename}" téléchargé avec succès.` });
      loadHistory();
    } catch (e: any) {
      setFlash({ type: 'error', msg: e.message || "Erreur lors de l'export." });
    } finally {
      setExporting(false);
      setTimeout(() => setFlash(null), 4000);
    }
  };

  // ── Save schedule config ──────────────────────────────────────────────────
  const saveSched = async () => {
    setSchedSaving(true);
    setSchedFlash(null);
    try {
      const res = await fetch(`${API_URL}/api/reports/export/schedule`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(schedCfg),
      });
      if (!res.ok) throw new Error('Échec de la sauvegarde');
      const updated = await res.json();
      setSchedCfg(updated);
      setSchedFlash({ type: 'success', msg: 'Planification sauvegardée.' });
    } catch (e: any) {
      setSchedFlash({ type: 'error', msg: e.message });
    } finally {
      setSchedSaving(false);
      setTimeout(() => setSchedFlash(null), 4000);
    }
  };

  // ── Manual schedule run ───────────────────────────────────────────────────
  const runSchedNow = async () => {
    setSchedRunning(true);
    setSchedFlash(null);
    try {
      const res = await fetch(`${API_URL}/api/reports/export/schedule/run`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Échec du déclenchement');
      setSchedFlash({ type: 'success', msg: `Export planifié généré : "${data.file}"` });
      loadSched();
    } catch (e: any) {
      setSchedFlash({ type: 'error', msg: e.message });
    } finally {
      setSchedRunning(false);
      setTimeout(() => setSchedFlash(null), 5000);
    }
  };

  const fmtSize = (kb: number) =>
    kb >= 1024 ? `${(kb / 1024).toFixed(1)} MB` : `${kb} KB`;

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Export de Données"
        description="Extraire les données historiques pour analyse externe ou archivage légal"
        breadcrumbs={[{ label: 'Rapports' }, { label: 'Export de Données' }]}
      >
        <Button variant="outline" size="sm" className="gap-2 border-zinc-800 text-white" onClick={loadPreview}>
          <RefreshCcw className="w-4 h-4" /> Actualiser
        </Button>
      </PageHeader>

      {/* Flash banner */}
      {flash && (
        <div className={`flex items-center gap-3 px-4 py-3 rounded-lg border text-sm font-medium ${
          flash.type === 'success'
            ? 'bg-green-500/10 border-green-500/30 text-green-400'
            : 'bg-red-500/10 border-red-500/30 text-red-400'
        }`}>
          {flash.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
          {flash.msg}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* ── Critères ──────────────────────────────────────────────────────── */}
        <Card className="p-6 bg-zinc-900/50 border-zinc-800 space-y-6">
          <div className="flex items-center gap-2 border-b border-zinc-800 pb-4">
            <Filter className="w-5 h-5 text-orange-500" />
            <h3 className="text-sm font-bold text-white uppercase tracking-widest">
              Critères de Sélection
            </h3>
            <InfoTooltip text="Choisissez la période et la source de données à exporter. La prévisualisation se met à jour automatiquement." />
          </div>

          <div className="space-y-4">
            {/* Period */}
            <div className="space-y-2">
              <Label className="text-zinc-500 text-[10px] uppercase font-bold tracking-widest flex items-center">
                Période
                <InfoTooltip text="Plage temporelle couverte par l'export. 'Aujourd'hui' = 24 dernières heures." />
              </Label>
              <Select value={period} onValueChange={setPeriod}>
                <SelectTrigger className="bg-zinc-950 border-zinc-800 text-white h-11">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-zinc-950 border-zinc-800 text-white">
                  {PERIOD_OPTIONS.map(o => (
                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Custom date range */}
            {period === 'custom' && (
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-zinc-500 text-[10px] uppercase font-bold">Du</Label>
                  <Input type="datetime-local" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
                    className="bg-zinc-950 border-zinc-800 text-white h-10 text-xs" />
                </div>
                <div className="space-y-1">
                  <Label className="text-zinc-500 text-[10px] uppercase font-bold">Au</Label>
                  <Input type="datetime-local" value={dateTo} onChange={e => setDateTo(e.target.value)}
                    className="bg-zinc-950 border-zinc-800 text-white h-10 text-xs" />
                </div>
              </div>
            )}

            {/* Source */}
            <div className="space-y-2">
              <Label className="text-zinc-500 text-[10px] uppercase font-bold tracking-widest flex items-center">
                Source de Données
                <InfoTooltip text="Table exportée : Comptages = chaque sac détecté, Sessions = résumé par session, Anomalies = historique des alertes, Qualité = revues opérateur." side="right" />
              </Label>
              <Select value={source} onValueChange={setSource}>
                <SelectTrigger className="bg-zinc-950 border-zinc-800 text-white h-11">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-zinc-950 border-zinc-800 text-white">
                  {SOURCE_OPTIONS.map(o => (
                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Preview stats */}
            <div className="grid grid-cols-2 gap-4 pt-2">
              <div className="p-3 rounded-lg bg-zinc-950 border border-zinc-800 space-y-1">
                <div className="flex items-center gap-1 text-[10px] text-zinc-500 uppercase font-bold">
                  <Rows className="w-3 h-3" /> Lignes estimées
                  <InfoTooltip text="Nombre d'enregistrements selon les critères choisis." />
                </div>
                <div className="text-xl font-bold text-white font-mono">
                  {previewLoading ? <Loader2 className="w-5 h-5 animate-spin text-orange-500" /> : (preview?.rows ?? 0).toLocaleString('fr-FR')}
                </div>
              </div>
              <div className="p-3 rounded-lg bg-zinc-950 border border-zinc-800 space-y-1">
                <div className="flex items-center gap-1 text-[10px] text-zinc-500 uppercase font-bold">
                  <HardDrive className="w-3 h-3" /> Taille estimée
                  <InfoTooltip text="Estimation basée sur la taille moyenne d'une ligne. Le PDF est limité à 2 000 lignes." />
                </div>
                <div className="text-xl font-bold text-white font-mono">
                  {previewLoading ? <Loader2 className="w-5 h-5 animate-spin text-orange-500" /> : fmtSize(preview?.size_kb ?? 0)}
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* ── Format d'export ────────────────────────────────────────────────── */}
        <Card className="p-6 bg-zinc-900/50 border-zinc-800 space-y-6">
          <div className="flex items-center gap-2 border-b border-zinc-800 pb-4">
            <Download className="w-5 h-5 text-orange-500" />
            <h3 className="text-sm font-bold text-white uppercase tracking-widest">
              Format d'Export
            </h3>
            <InfoTooltip text="CSV et JSON sont légers et universels. XLSX génère un fichier Excel mis en forme. PDF produit un tableau A4 paysage (max 2 000 lignes)." />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {FORMAT_OPTIONS.map(opt => {
              const Icon = opt.icon;
              const isSelected = format === opt.id;
              return (
                <button
                  key={opt.id}
                  onClick={() => setFormat(opt.id)}
                  className={`flex flex-col items-center justify-center p-5 rounded-xl border transition-all group relative cursor-pointer
                    ${isSelected
                      ? 'border-orange-500 bg-orange-500/10 shadow-[0_0_12px_rgba(249,115,22,0.15)]'
                      : 'border-zinc-800 bg-zinc-950 hover:border-orange-500/50 hover:bg-orange-500/5'}`}
                >
                  {isSelected && (
                    <CheckCircle2 className="absolute top-2 right-2 w-4 h-4 text-orange-500" />
                  )}
                  <Icon className={`w-8 h-8 mb-3 ${opt.iconColor}`} />
                  <span className="text-sm font-bold text-white">{opt.label}</span>
                  <span className="text-[10px] text-zinc-500 mt-1 uppercase font-bold">{opt.subtitle}</span>
                </button>
              );
            })}
          </div>

          <Button
            className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold uppercase tracking-widest text-xs h-11 gap-2 disabled:opacity-50"
            disabled={!format || exporting || (preview?.rows === 0)}
            onClick={handleExport}
          >
            {exporting
              ? <><Loader2 className="w-4 h-4 animate-spin" /> Génération en cours…</>
              : <><Download className="w-4 h-4" /> Lancer l'Export</>}
          </Button>

          {!format && (
            <p className="text-[10px] text-zinc-600 text-center italic">Sélectionnez un format pour activer l'export</p>
          )}
          {format && preview?.rows === 0 && (
            <p className="text-[10px] text-yellow-600 text-center italic">Aucune donnée pour cette période et cette source</p>
          )}
        </Card>
      </div>

      {/* ── Planification ──────────────────────────────────────────────────────── */}
      <Card className="bg-zinc-900/50 border-zinc-800 overflow-hidden">
        <button
          onClick={() => setSchedOpen(v => !v)}
          className="w-full flex items-center justify-between p-5 hover:bg-zinc-800/30 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${schedCfg.enabled ? 'bg-orange-500/20' : 'bg-zinc-800'}`}>
              <Calendar className={`w-5 h-5 ${schedCfg.enabled ? 'text-orange-500' : 'text-zinc-500'}`} />
            </div>
            <div className="text-left">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-white">Planifier un Export Automatique</span>
                <InfoTooltip
                  text="Configurer un export récurrent généré automatiquement selon une fréquence. Le fichier est sauvegardé sur le serveur et téléchargeable depuis l'historique."
                  side="right"
                />
                {schedCfg.enabled && (
                  <span className="text-[9px] font-bold uppercase px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-400 border border-orange-500/30">
                    Actif — {schedCfg.frequency} à {schedCfg.time}
                  </span>
                )}
              </div>
              <p className="text-xs text-zinc-500 mt-0.5">
                {schedCfg.enabled
                  ? `Source : ${SOURCE_OPTIONS.find(o => o.value === schedCfg.source)?.label} · Format : ${schedCfg.format.toUpperCase()} · Période : ${PERIOD_OPTIONS.find(o => o.value === schedCfg.period)?.label}`
                  : 'Recevez vos rapports automatiquement sans intervention manuelle'}
              </p>
            </div>
          </div>
          <ChevronDown className={`w-5 h-5 text-zinc-500 transition-transform duration-200 ${schedOpen ? '' : '-rotate-90'}`} />
        </button>

        {schedOpen && (
          <div className="border-t border-zinc-800 p-6 space-y-6">
            {/* Schedule flash */}
            {schedFlash && (
              <div className={`flex items-center gap-3 px-4 py-3 rounded-lg border text-sm font-medium ${
                schedFlash.type === 'success'
                  ? 'bg-green-500/10 border-green-500/30 text-green-400'
                  : 'bg-red-500/10 border-red-500/30 text-red-400'
              }`}>
                {schedFlash.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
                {schedFlash.msg}
              </div>
            )}

            {schedLoading ? (
              <div className="flex justify-center py-6"><Loader2 className="w-5 h-5 animate-spin text-orange-500" /></div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Left column — schedule params */}
                <div className="space-y-4">
                  {/* Enable toggle */}
                  <div className="flex items-center justify-between p-4 rounded-lg bg-zinc-950 border border-zinc-800">
                    <div>
                      <div className="text-sm font-medium text-white flex items-center gap-1">
                        Activer la planification
                        <InfoTooltip text="Quand activé, le système vérifie chaque minute si un export doit être déclenché selon la configuration." />
                      </div>
                      <div className="text-[10px] text-zinc-500 mt-0.5">
                        {schedCfg.enabled ? 'Le scheduler est actif' : 'Le scheduler est désactivé'}
                      </div>
                    </div>
                    <button onClick={() => setSchedCfg(c => ({ ...c, enabled: !c.enabled }))}>
                      {schedCfg.enabled
                        ? <ToggleRight className="w-8 h-8 text-orange-500" />
                        : <ToggleLeft className="w-8 h-8 text-zinc-600" />}
                    </button>
                  </div>

                  {/* Frequency */}
                  <div className="space-y-2">
                    <Label className="text-zinc-500 text-[10px] uppercase font-bold tracking-widest flex items-center">
                      Fréquence
                      <InfoTooltip text="Quotidien = chaque jour à l'heure définie. Hebdomadaire = un jour de la semaine. Mensuel = un jour du mois." />
                    </Label>
                    <Select value={schedCfg.frequency} onValueChange={v => setSchedCfg(c => ({ ...c, frequency: v }))}>
                      <SelectTrigger className="bg-zinc-950 border-zinc-800 text-white h-10">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-zinc-950 border-zinc-800 text-white">
                        {FREQ_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Time */}
                  <div className="space-y-2">
                    <Label className="text-zinc-500 text-[10px] uppercase font-bold tracking-widest flex items-center">
                      Heure de déclenchement (UTC)
                      <InfoTooltip text="Heure à laquelle l'export sera généré automatiquement. Le serveur utilise l'heure UTC." />
                    </Label>
                    <Input
                      type="time"
                      value={schedCfg.time}
                      onChange={e => setSchedCfg(c => ({ ...c, time: e.target.value }))}
                      className="bg-zinc-950 border-zinc-800 text-white h-10"
                    />
                  </div>

                  {/* Day of week (weekly only) */}
                  {schedCfg.frequency === 'weekly' && (
                    <div className="space-y-2">
                      <Label className="text-zinc-500 text-[10px] uppercase font-bold tracking-widest">Jour de la semaine</Label>
                      <Select value={String(schedCfg.day_of_week)} onValueChange={v => setSchedCfg(c => ({ ...c, day_of_week: Number(v) }))}>
                        <SelectTrigger className="bg-zinc-950 border-zinc-800 text-white h-10">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-zinc-950 border-zinc-800 text-white">
                          {DAY_OF_WEEK_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {/* Day of month (monthly only) */}
                  {schedCfg.frequency === 'monthly' && (
                    <div className="space-y-2">
                      <Label className="text-zinc-500 text-[10px] uppercase font-bold tracking-widest flex items-center">
                        Jour du mois (1–28)
                        <InfoTooltip text="Jour du mois auquel déclencher l'export. Limité à 28 pour éviter les problèmes avec février." />
                      </Label>
                      <Input
                        type="number" min={1} max={28}
                        value={schedCfg.day_of_month}
                        onChange={e => setSchedCfg(c => ({ ...c, day_of_month: Number(e.target.value) }))}
                        className="bg-zinc-950 border-zinc-800 text-white h-10"
                      />
                    </div>
                  )}
                </div>

                {/* Right column — content params */}
                <div className="space-y-4">
                  {/* Source */}
                  <div className="space-y-2">
                    <Label className="text-zinc-500 text-[10px] uppercase font-bold tracking-widest flex items-center">
                      Source exportée
                      <InfoTooltip text="Type de données qui sera exporté lors de chaque déclenchement automatique." side="left" />
                    </Label>
                    <Select value={schedCfg.source} onValueChange={v => setSchedCfg(c => ({ ...c, source: v }))}>
                      <SelectTrigger className="bg-zinc-950 border-zinc-800 text-white h-10">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-zinc-950 border-zinc-800 text-white">
                        {SOURCE_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Format */}
                  <div className="space-y-2">
                    <Label className="text-zinc-500 text-[10px] uppercase font-bold tracking-widest">Format du fichier</Label>
                    <Select value={schedCfg.format} onValueChange={v => setSchedCfg(c => ({ ...c, format: v }))}>
                      <SelectTrigger className="bg-zinc-950 border-zinc-800 text-white h-10">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-zinc-950 border-zinc-800 text-white">
                        {FORMAT_OPTIONS.map(o => <SelectItem key={o.id} value={o.id}>{o.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Period */}
                  <div className="space-y-2">
                    <Label className="text-zinc-500 text-[10px] uppercase font-bold tracking-widest flex items-center">
                      Couverture temporelle
                      <InfoTooltip text="Période de données couverte par chaque export automatique. 'Hier' est recommandé pour un export quotidien." side="left" />
                    </Label>
                    <Select value={schedCfg.period} onValueChange={v => setSchedCfg(c => ({ ...c, period: v }))}>
                      <SelectTrigger className="bg-zinc-950 border-zinc-800 text-white h-10">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-zinc-950 border-zinc-800 text-white">
                        {PERIOD_OPTIONS.filter(o => o.value !== 'custom').map(o => (
                          <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Email */}
                  <div className="space-y-2">
                    <Label className="text-zinc-500 text-[10px] uppercase font-bold tracking-widest flex items-center">
                      <Mail className="w-3 h-3 mr-1" /> Email de notification (optionnel)
                      <InfoTooltip text="Adresse email pour notifier de la génération. L'envoi automatique nécessite une configuration SMTP serveur." side="left" />
                    </Label>
                    <Input
                      type="email"
                      placeholder="operateur@cimenterie.com"
                      value={schedCfg.email}
                      onChange={e => setSchedCfg(c => ({ ...c, email: e.target.value }))}
                      className="bg-zinc-950 border-zinc-800 text-white h-10"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center gap-3 pt-2 border-t border-zinc-800">
              <Button
                onClick={saveSched}
                disabled={schedSaving}
                className="bg-orange-500 hover:bg-orange-600 text-white font-bold uppercase text-xs h-10 gap-2"
              >
                {schedSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Sauvegarder
              </Button>
              <Button
                onClick={runSchedNow}
                disabled={schedRunning}
                variant="outline"
                className="border-zinc-700 text-zinc-300 hover:text-white font-bold uppercase text-xs h-10 gap-2"
              >
                {schedRunning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                Déclencher maintenant
              </Button>
              <span className="text-[10px] text-zinc-600 ml-auto italic">
                Le serveur vérifie le planning toutes les 30 secondes
              </span>
            </div>

            {/* Scheduled exports history */}
            {schedHistory.length > 0 && (
              <div className="space-y-2 pt-2">
                <h4 className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest flex items-center gap-1">
                  <Bell className="w-3 h-3" /> Derniers exports automatiques
                </h4>
                {schedHistory.map((rec, i) => (
                  <div key={i} className="flex items-center justify-between p-2.5 rounded-lg bg-zinc-950/80 border border-zinc-800 text-xs">
                    <div className="flex items-center gap-2">
                      <FileText className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                      <div>
                        <div className="font-medium text-white font-mono">{rec.name}</div>
                        <div className="text-zinc-500 text-[10px]">
                          {rec.source} · {rec.period_label} · {rec.rows.toLocaleString('fr-FR')} lignes · {fmtTs(rec.triggered_at)}
                        </div>
                      </div>
                    </div>
                    <a
                      href={`${API_URL}${rec.download_url}`}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1 text-[10px] font-bold text-orange-500 hover:text-orange-400 uppercase"
                    >
                      <Download className="w-3 h-3" /> Télécharger
                    </a>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </Card>

      {/* ── Historique des exports manuels ─────────────────────────────────────── */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold text-white uppercase tracking-widest flex items-center gap-2">
          <Clock className="w-4 h-4 text-orange-500" />
          Historique des Exports
          <InfoTooltip text="Liste des exports manuels générés depuis le démarrage du serveur (max 20 entrées). Se réinitialise au redémarrage." />
        </h3>

        {historyLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-5 h-5 text-orange-500 animate-spin" />
          </div>
        ) : history.length === 0 ? (
          <div className="text-center py-10 text-zinc-600 text-sm italic border border-dashed border-zinc-800 rounded-lg">
            Aucun export effectué dans cette session
          </div>
        ) : (
          <div className="space-y-2">
            {history.map((rec, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-zinc-900/50 border border-zinc-800">
                <div className="flex items-center gap-3">
                  <FileText className="w-4 h-4 text-zinc-500 shrink-0" />
                  <div>
                    <div className="text-xs font-medium text-white font-mono">{rec.name}</div>
                    <div className="text-[10px] text-zinc-500">
                      {rec.source} · {rec.period_label} · {rec.rows.toLocaleString('fr-FR')} lignes · {fmtSize(rec.size_kb)} · {fmtTs(rec.timestamp)}
                    </div>
                  </div>
                </div>
                <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-full border ${
                  rec.format === 'json'    ? 'text-orange-400 border-orange-500/30 bg-orange-500/10' :
                  rec.format === 'xlsx'   ? 'text-blue-400   border-blue-500/30   bg-blue-500/10'   :
                  rec.format === 'pdf'    ? 'text-red-400    border-red-500/30    bg-red-500/10'    :
                                           'text-green-400  border-green-500/30  bg-green-500/10'
                }`}>
                  {rec.format.toUpperCase()}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

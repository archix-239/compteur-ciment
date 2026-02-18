import { useState, useEffect, useCallback, useRef } from 'react';
import { Camera, Save, Wifi, Settings2, RefreshCcw, Video, Loader2, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { fetchApi } from '@/lib/api';
import { useVideoStream } from '@/hooks/useVideoStream';

interface CameraConfig {
  source_type: string;
  url: string;
  resolution: string;
  fps: number;
  brightness: number;
  contrast: number;
  autofocus: boolean;
}

interface TestResult {
  success: boolean;
  message: string;
  resolution_detected?: string;
  fps_detected?: number;
}

export default function CameraSettings() {
  const [config, setConfig] = useState<CameraConfig>({
    source_type: 'webcam',
    url: '0',
    resolution: '720p',
    fps: 30,
    brightness: 50,
    contrast: 65,
    autofocus: true,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<TestResult | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<boolean | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const previewImgRef = useRef<HTMLImageElement>(null);
  const { status: streamStatus, fps: streamFps } = useVideoStream(previewImgRef, showPreview);

  const loadConfig = useCallback(async () => {
    try {
      setLoading(true);
      const data = await fetchApi('/api/config/camera');
      setConfig(data);
      setTestResult(null);
      setSaveSuccess(null);
    } catch (err) {
      console.error('Erreur chargement config caméra:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadConfig();
  }, [loadConfig]);

  const handleSave = async () => {
    try {
      setSaving(true);
      setSaveSuccess(null);
      await fetchApi('/api/config/camera', {
        method: 'PUT',
        body: JSON.stringify(config),
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(null), 3000);
    } catch (err) {
      console.error('Erreur sauvegarde config:', err);
      setSaveSuccess(false);
      setTimeout(() => setSaveSuccess(null), 3000);
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async () => {
    try {
      setTesting(true);
      setTestResult(null);
      const result = await fetchApi('/api/config/camera/test', {
        method: 'POST',
        body: JSON.stringify(config),
      });
      setTestResult(result);
      setShowPreview(result.success);
    } catch (err) {
      console.error('Erreur test connexion:', err);
      setTestResult({ success: false, message: 'Erreur réseau lors du test.' });
      setShowPreview(false);
    } finally {
      setTesting(false);
    }
  };

  const handleCancel = () => {
    loadConfig();
  };

  const updateConfig = (patch: Partial<CameraConfig>) => {
    setConfig(prev => ({ ...prev, ...patch }));
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">Paramètres Caméra</h1>
        <p className="text-muted-foreground">Configurez les entrées vidéo et les paramètres matériels de la caméra</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-6">
          <Card className="p-6 space-y-4 bg-card/50 border-zinc-800">
            <div className="flex items-center gap-2 font-semibold text-white">
              <Settings2 className="w-5 h-5 text-orange-500" />
              <span>Configuration d'Entrée</span>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-zinc-400">Type de Source</Label>
                <Select value={config.source_type} onValueChange={(v) => updateConfig({ source_type: v })}>
                  <SelectTrigger className="bg-zinc-900 border-zinc-800 text-white">
                    <SelectValue placeholder="Sélectionner la source" />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
                    <SelectItem value="ip">Caméra IP (RTSP/HTTP)</SelectItem>
                    <SelectItem value="webcam">Webcam Locale</SelectItem>
                    <SelectItem value="file">Fichier Vidéo</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {config.source_type === 'ip' && (
                <div className="space-y-2">
                  <Label className="text-zinc-400">URL du Flux</Label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="http://192.168.1.100:8080/video"
                      value={config.url}
                      onChange={(e) => updateConfig({ url: e.target.value })}
                      className="bg-zinc-900 border-zinc-800 text-white"
                    />
                    <Button variant="outline" size="icon" className="border-zinc-800 text-white" onClick={handleTest} disabled={testing}>
                      {testing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCcw className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>
              )}

              {config.source_type === 'file' && (
                <div className="space-y-2">
                  <Label className="text-zinc-400">Chemin du Fichier</Label>
                  <Input
                    placeholder="/chemin/vers/video.mp4"
                    value={config.url}
                    onChange={(e) => updateConfig({ url: e.target.value })}
                    className="bg-zinc-900 border-zinc-800 text-white"
                  />
                </div>
              )}

              {config.source_type === 'webcam' && (
                <div className="space-y-2">
                  <Label className="text-zinc-400">Index Webcam</Label>
                  <Input
                    type="number"
                    min={0}
                    value={config.url}
                    onChange={(e) => updateConfig({ url: e.target.value })}
                    className="bg-zinc-900 border-zinc-800 text-white"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-zinc-400">Résolution Cible</Label>
                  <Select value={config.resolution} onValueChange={(v) => updateConfig({ resolution: v })}>
                    <SelectTrigger className="bg-zinc-900 border-zinc-800 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
                      <SelectItem value="1080p">1920 x 1080 (FHD)</SelectItem>
                      <SelectItem value="720p">1280 x 720 (HD)</SelectItem>
                      <SelectItem value="480p">854 x 480 (SD)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-zinc-400">Fréquence (FPS)</Label>
                  <Input
                    type="number"
                    min={1}
                    max={120}
                    value={config.fps}
                    onChange={(e) => updateConfig({ fps: parseInt(e.target.value) || 30 })}
                    className="bg-zinc-900 border-zinc-800 text-white"
                  />
                </div>
              </div>
            </div>
          </Card>

          <Card className="p-6 space-y-4 bg-card/50 border-zinc-800">
            <div className="flex items-center gap-2 font-semibold text-white">
              <Video className="w-5 h-5 text-orange-500" />
              <span>Réglages d'Image</span>
            </div>

            <div className="space-y-6">
              <div className="space-y-3">
                <div className="flex justify-between">
                  <Label className="text-zinc-400">Luminosité</Label>
                  <span className="text-xs text-zinc-500">{config.brightness}%</span>
                </div>
                <Slider
                  value={[config.brightness]}
                  onValueChange={(v) => updateConfig({ brightness: v[0] })}
                  max={100}
                  step={1}
                  className="[&_[role=slider]]:bg-orange-500"
                />
              </div>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <Label className="text-zinc-400">Contraste</Label>
                  <span className="text-xs text-zinc-500">{config.contrast}%</span>
                </div>
                <Slider
                  value={[config.contrast]}
                  onValueChange={(v) => updateConfig({ contrast: v[0] })}
                  max={100}
                  step={1}
                  className="[&_[role=slider]]:bg-orange-500"
                />
              </div>
              <div className="flex items-center justify-between">
                <Label className="text-zinc-400">Auto-Focus matériel</Label>
                <Switch
                  checked={config.autofocus}
                  onCheckedChange={(v) => updateConfig({ autofocus: v })}
                />
              </div>
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="p-6 space-y-4 bg-black/40 border-dashed border-zinc-800 relative min-h-[300px] flex flex-col items-center justify-center text-center">
            {showPreview && streamStatus === 'online' ? (
              <div className="absolute top-4 left-4 flex items-center gap-2 text-[10px] font-mono text-green-400 font-bold uppercase tracking-widest">
                <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
                LIVE — {streamFps} FPS
              </div>
            ) : (
              <div className="absolute top-4 left-4 flex items-center gap-2 text-[10px] font-mono text-zinc-500 font-bold uppercase tracking-widest">
                <div className="w-1.5 h-1.5 rounded-full bg-zinc-500" />
                PREVISUALISATION_FLUX
              </div>
            )}

            {/* WebSocket video stream image */}
            <img
              ref={previewImgRef}
              alt="Flux caméra"
              className="w-full h-auto rounded max-h-[260px] object-contain"
              style={{ display: showPreview && streamStatus === 'online' ? 'block' : 'none' }}
            />

            {/* Placeholder when no stream */}
            {!(showPreview && streamStatus === 'online') && (
              <>
                <Camera className="w-16 h-16 text-zinc-800 mb-4" />
                <p className="text-xs text-zinc-500">
                  {showPreview && streamStatus === 'connecting'
                    ? 'Connexion au flux vidéo en cours...'
                    : "L'aperçu de la caméra apparaîtra ici\naprès un test de connexion réussi"}
                </p>
              </>
            )}

            <Button
              variant="outline"
              size="sm"
              className="mt-4 border-zinc-800 text-zinc-400 hover:text-white"
              onClick={handleTest}
              disabled={testing}
            >
              {testing ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Test en cours...</>
              ) : (
                'Tester la Connexion'
              )}
            </Button>
          </Card>

          <Card className="p-6 space-y-4 bg-card/50 border-zinc-800">
            <div className="flex items-center gap-2 font-semibold text-white">
              <Wifi className="w-5 h-5 text-orange-500" />
              <span>État de Connexion</span>
            </div>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-zinc-500">Statut</span>
                {testResult === null ? (
                  <span className="text-zinc-500 font-bold uppercase text-xs flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> Non testé
                  </span>
                ) : testResult.success ? (
                  <span className="text-green-400 font-bold uppercase text-xs flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Connecté
                  </span>
                ) : (
                  <span className="text-red-400 font-bold uppercase text-xs flex items-center gap-1">
                    <XCircle className="w-3 h-3" /> Échec
                  </span>
                )}
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Source</span>
                <span className="font-mono text-xs text-white">
                  {config.source_type === 'ip' ? config.url : config.source_type === 'webcam' ? `Webcam ${config.url}` : config.url}
                </span>
              </div>
              {testResult?.resolution_detected && (
                <div className="flex justify-between">
                  <span className="text-zinc-500">Résolution détectée</span>
                  <span className="font-mono text-xs text-white">{testResult.resolution_detected}</span>
                </div>
              )}
              {testResult?.fps_detected !== undefined && testResult?.fps_detected !== null && (
                <div className="flex justify-between">
                  <span className="text-zinc-500">FPS détecté</span>
                  <span className="font-mono text-xs text-white">{testResult.fps_detected}</span>
                </div>
              )}
              {testResult?.message && (
                <div className="flex justify-between">
                  <span className="text-zinc-500">Message</span>
                  <span className={`text-xs ${testResult.success ? 'text-green-400' : 'text-red-400'}`}>
                    {testResult.message}
                  </span>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-6 border-t border-zinc-800">
        {saveSuccess === true && (
          <span className="flex items-center gap-1 text-sm text-green-400 mr-auto">
            <CheckCircle2 className="w-4 h-4" /> Configuration sauvegardée
          </span>
        )}
        {saveSuccess === false && (
          <span className="flex items-center gap-1 text-sm text-red-400 mr-auto">
            <XCircle className="w-4 h-4" /> Erreur lors de la sauvegarde
          </span>
        )}
        <Button variant="outline" className="border-zinc-800 text-white" onClick={handleCancel}>
          Annuler les changements
        </Button>
        <Button className="gap-2 bg-orange-600 hover:bg-orange-700 text-white" onClick={handleSave} disabled={saving}>
          {saving ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Sauvegarde...</>
          ) : (
            <><Save className="w-4 h-4" /> Sauvegarder la Configuration</>
          )}
        </Button>
      </div>
    </div>
  );
}

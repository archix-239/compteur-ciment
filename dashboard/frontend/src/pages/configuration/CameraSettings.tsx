import { useState, useEffect } from 'react';
import { API_URL } from '@/lib/api';
import { Camera, Save, Globe, Wifi, Settings2, RefreshCcw, Video, CheckCircle2, XCircle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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

export default function CameraSettings() {
  const [sourceType, setSourceType] = useState('ip');
  const [url, setUrl] = useState('');
  const [resolution, setResolution] = useState('720p');
  const [fps, setFps] = useState(30);
  const [brightness, setBrightness] = useState(50);
  const [contrast, setContrast] = useState(50);
  const [autoFocus, setAutoFocus] = useState(true);

  const [testStatus, setTestStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_URL}/api/settings/camera`)
      .then(res => res.json())
      .then(data => {
        setSourceType(data.source_type);
        setUrl(data.url);
        setResolution(data.resolution);
        setFps(data.fps);
        setBrightness(data.brightness);
        setContrast(data.contrast);
        setAutoFocus(data.auto_focus);
        setLoading(false);
      })
      .catch(err => {
        console.error("Error fetching camera settings:", err);
        setLoading(false);
      });
  }, []);

  const handleSave = () => {
    const settings = {
      source_type: sourceType,
      url: url,
      resolution: resolution,
      fps: fps,
      brightness: brightness,
      contrast: contrast,
      auto_focus: autoFocus
    };

    fetch(`${API_URL}/api/settings/camera`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings)
    })
      .then(res => res.json())
      .then(() => alert("Configuration enregistrée avec succès"))
      .catch(err => console.error("Error saving settings:", err));
  };

  const handleTestConnection = () => {
    setTestStatus('loading');
    fetch(`${API_URL}/api/vision/test_connection`, { method: 'POST' })
      .then(res => res.json())
      .then(data => {
        setTestStatus(data.status === 'success' ? 'success' : 'error');
      })
      .catch(() => setTestStatus('error'));
  };

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
                <Select value={sourceType} onValueChange={setSourceType}>
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

              {sourceType !== 'webcam' && (
                <div className="space-y-2">
                  <Label className="text-zinc-400">URL du Flux / Chemin</Label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="http://192.168.1.100:8080/video"
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      className="bg-zinc-900 border-zinc-800 text-white"
                    />
                    <Button variant="outline" size="icon" className="border-zinc-800 text-white"><RefreshCcw className="w-4 h-4" /></Button>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-zinc-400">Résolution Cible</Label>
                  <Select value={resolution} onValueChange={setResolution}>
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
                    value={fps}
                    onChange={(e) => setFps(parseInt(e.target.value))}
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
                  <span className="text-xs text-zinc-500">{brightness}%</span>
                </div>
                <Slider
                  value={[brightness]}
                  onValueChange={(val) => setBrightness(val[0])}
                  max={100}
                  step={1}
                  className="[&_[role=slider]]:bg-orange-500"
                />
              </div>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <Label className="text-zinc-400">Contraste</Label>
                  <span className="text-xs text-zinc-500">{contrast}%</span>
                </div>
                <Slider
                  value={[contrast]}
                  onValueChange={(val) => setContrast(val[0])}
                  max={100}
                  step={1}
                  className="[&_[role=slider]]:bg-orange-500"
                />
              </div>
              <div className="flex items-center justify-between">
                <Label className="text-zinc-400">Auto-Focus matériel</Label>
                <Switch
                  checked={autoFocus}
                  onCheckedChange={setAutoFocus}
                />
              </div>
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="p-6 space-y-4 bg-black/40 border-dashed border-zinc-800 relative min-h-[300px] flex flex-col items-center justify-center text-center overflow-hidden">
            <div className="absolute top-4 left-4 z-10 flex items-center gap-2 text-[10px] font-mono text-green-400 font-bold uppercase tracking-widest">
              <div className={`w-1.5 h-1.5 rounded-full ${testStatus === 'success' ? 'bg-green-400 animate-pulse' : 'bg-zinc-600'}`} />
              PREVISUALISATION_FLUX
            </div>

            {testStatus === 'success' ? (
              <img src={`${API_URL}/api/vision/video_feed`} alt="Preview" className="absolute inset-0 w-full h-full object-contain" />
            ) : (
              <>
                <Camera className="w-16 h-16 text-zinc-800 mb-4" />
                <p className="text-xs text-zinc-500">L'aperçu de la caméra apparaîtra ici<br/>une fois la connexion établie</p>
              </>
            )}

            <div className="absolute bottom-4 inset-x-4 flex flex-col items-center gap-2 z-10">
              {testStatus === 'success' && (
                <Badge className="bg-green-500/20 text-green-400 border-green-500/30 gap-1">
                  <CheckCircle2 className="w-3 h-3" /> FLUX ACTIF
                </Badge>
              )}
              {testStatus === 'error' && (
                <Badge variant="destructive" className="gap-1">
                  <XCircle className="w-3 h-3" /> ÉCHEC CONNEXION
                </Badge>
              )}
              <Button
                variant="outline"
                size="sm"
                className="border-zinc-800 text-white bg-black/60 backdrop-blur"
                onClick={handleTestConnection}
                disabled={testStatus === 'loading'}
              >
                {testStatus === 'loading' ? 'Vérification...' : 'Tester la Connexion'}
              </Button>
            </div>
          </Card>

          <Card className="p-6 space-y-4 bg-card/50 border-zinc-800">
            <div className="flex items-center gap-2 font-semibold text-white">
              <Wifi className="w-5 h-5 text-orange-500" />
              <span>État de Connexion</span>
            </div>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-zinc-500">Statut</span>
                <span className="text-green-400 font-bold uppercase text-xs">Connecté</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Adresse IP</span>
                <span className="font-mono text-xs text-white">192.168.137.186</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Adresse MAC</span>
                <span className="font-mono text-[10px] text-zinc-400 uppercase">00:1B:44:11:3A:B7</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Uptime Flux</span>
                <span className="text-white">12j 04h 23m</span>
              </div>
            </div>
          </Card>
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-6 border-t border-zinc-800">
        <Button variant="outline" className="border-zinc-800 text-white">Annuler les changements</Button>
        <Button
          className="gap-2 bg-orange-600 hover:bg-orange-700 text-white"
          onClick={handleSave}
        >
          <Save className="w-4 h-4" /> Sauvegarder la Configuration
        </Button>
      </div>
    </div>
  );
}

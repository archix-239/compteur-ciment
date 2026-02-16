import {
  Settings2,
  Save,
  Globe,
  Shield,
  Database,
  HardDrive,
  Lock,
  Key,
  Languages,
  BellRing,
  Cpu,
  RefreshCw,
  Archive,
  Cloud
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function SystemSettings() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">Paramètres Système</h1>
        <p className="text-muted-foreground">Configurez les variables globales, la sécurité et la maintenance de la plateforme</p>
      </div>

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="bg-zinc-900 border border-zinc-800 p-1">
          <TabsTrigger value="general" className="gap-2">
            <Settings2 className="w-4 h-4" /> Général
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

        <TabsContent value="general" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="p-6 bg-zinc-900/50 border-zinc-800 space-y-6">
              <div className="flex items-center gap-2 font-semibold text-white border-b border-zinc-800 pb-4">
                <Globe className="w-5 h-5 text-orange-500" />
                <span>Identité de l'Usine</span>
              </div>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-zinc-500 text-[10px] uppercase font-bold tracking-widest">Nom du Site</Label>
                  <Input defaultValue="Cimenterie Centrale - Ligne A" className="bg-zinc-950 border-zinc-800 text-white h-11" />
                </div>
                <div className="space-y-2">
                  <Label className="text-zinc-500 text-[10px] uppercase font-bold tracking-widest">Localisation</Label>
                  <Input defaultValue="Zone Industrielle Nord, Secteur 4" className="bg-zinc-950 border-zinc-800 text-white h-11" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                   <div className="space-y-2">
                    <Label className="text-zinc-500 text-[10px] uppercase font-bold tracking-widest">Fuseau Horaire</Label>
                    <Select defaultValue="utc1">
                      <SelectTrigger className="bg-zinc-950 border-zinc-800 text-white h-11">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-zinc-950 border-zinc-800 text-white">
                        <SelectItem value="utc0">UTC +00:00 (GMT)</SelectItem>
                        <SelectItem value="utc1">UTC +01:00 (Paris)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-zinc-500 text-[10px] uppercase font-bold tracking-widest">Langue</Label>
                    <Select defaultValue="fr">
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

            <Card className="p-6 bg-zinc-900/50 border-zinc-800 space-y-6">
               <div className="flex items-center gap-2 font-semibold text-white border-b border-zinc-800 pb-4">
                <BellRing className="w-5 h-5 text-orange-500" />
                <span>Préférences Notifications</span>
              </div>
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-sm text-zinc-300">Alerte de Production Basse</Label>
                    <p className="text-[10px] text-zinc-500 italic">Si le débit tombe sous 10 sacs/min</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-sm text-zinc-300">Rapports Hebdomadaires</Label>
                    <p className="text-[10px] text-zinc-500 italic">Envoi auto par email le lundi</p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </div>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="p-6 bg-zinc-900/50 border-zinc-800 space-y-6">
                 <div className="flex items-center gap-2 font-semibold text-white border-b border-zinc-800 pb-4">
                    <Settings2 className="w-5 h-5 text-orange-500" />
                    <span>Configuration de Logging</span>
                 </div>
                 <div className="space-y-4">
                    <div className="space-y-2">
                       <Label className="text-zinc-500 text-[10px] uppercase font-bold tracking-widest">Niveau de Log</Label>
                       <Select defaultValue="info">
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
                       <Label className="text-zinc-500 text-[10px] uppercase font-bold tracking-widest">Rétention des Logs (Jours)</Label>
                       <Input type="number" defaultValue="30" className="bg-zinc-950 border-zinc-800 text-white h-11" />
                    </div>
                 </div>
              </Card>

              <Card className="p-6 bg-zinc-900/50 border-zinc-800 space-y-6">
                 <div className="flex items-center gap-2 font-semibold text-white border-b border-zinc-800 pb-4">
                    <HardDrive className="w-5 h-5 text-orange-500" />
                    <span>Optimisation Cache</span>
                 </div>
                 <div className="space-y-4">
                    <div className="space-y-2">
                       <Label className="text-zinc-500 text-[10px] uppercase font-bold tracking-widest">Taille Max Cache Vidéo (GB)</Label>
                       <Input type="number" defaultValue="10" className="bg-zinc-950 border-zinc-800 text-white h-11" />
                    </div>
                    <div className="flex items-center justify-between pt-2">
                       <div className="space-y-0.5">
                          <Label className="text-sm text-zinc-300">Nettoyage Automatique</Label>
                          <p className="text-[10px] text-zinc-500 italic">Vider si disque &gt; 90%</p>
                       </div>
                       <Switch defaultChecked />
                    </div>
                 </div>
              </Card>
           </div>
        </TabsContent>

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
                      <Label className="text-sm text-zinc-300">Authentification à 2 Facteurs (2FA)</Label>
                      <p className="text-[11px] text-zinc-500">Obligatoire pour tous les administrateurs</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label className="text-sm text-zinc-300">SSL / TLS Forcé</Label>
                      <p className="text-[11px] text-zinc-500">Redirection automatique HTTP → HTTPS</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
               </div>
               <div className="space-y-4 p-4 rounded-xl bg-zinc-950 border border-zinc-800">
                  <div className="flex items-center gap-2 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                    <Key className="w-3.5 h-3.5" /> Clés de Chiffrement
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
                  <Button variant="outline" size="sm" className="w-full text-[10px] border-zinc-800 h-8 font-bold uppercase">Forcer Rotation Clé</Button>
               </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="data" className="space-y-6">
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="p-6 bg-zinc-900/50 border-zinc-800 space-y-6">
                 <div className="flex items-center gap-2 font-semibold text-white border-b border-zinc-800 pb-4">
                    <Cloud className="w-5 h-5 text-orange-500" />
                    <span>Sauvegarde Cloud (AWS S3)</span>
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
                    <Button className="w-full bg-zinc-800 hover:bg-zinc-700 text-white h-10 text-[10px] font-bold uppercase">Lancer Backup Manuel</Button>
                 </div>
              </Card>

              <Card className="p-6 bg-zinc-900/50 border-zinc-800 space-y-6">
                 <div className="flex items-center gap-2 font-semibold text-white border-b border-zinc-800 pb-4">
                    <RefreshCw className="w-5 h-5 text-orange-500" />
                    <span>Restauration de Configuration</span>
                 </div>
                 <div className="p-8 rounded-xl border border-zinc-800 border-dashed flex flex-col items-center justify-center text-center gap-3">
                    <Database className="w-8 h-8 text-zinc-700" />
                    <div className="space-y-1">
                       <h4 className="text-sm font-bold text-white">Importer un fichier .json</h4>
                       <p className="text-[10px] text-zinc-500">Toutes les configurations actuelles seront écrasées</p>
                    </div>
                    <Button variant="outline" className="border-zinc-800 text-orange-500 text-[10px] font-bold uppercase mt-2">Choisir un fichier</Button>
                 </div>
              </Card>
           </div>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end gap-3 pt-6 border-t border-zinc-800">
        <Button variant="outline" className="border-zinc-800 text-white h-11 px-6">Réinitialiser tout</Button>
        <Button className="gap-2 bg-orange-600 hover:bg-orange-700 text-white font-bold h-11 px-8 shadow-lg shadow-orange-900/20">
          <Save className="w-4 h-4" /> Enregistrer les Paramètres
        </Button>
      </div>
    </div>
  );
}

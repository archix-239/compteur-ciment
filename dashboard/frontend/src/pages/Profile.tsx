import {
  User,
  Mail,
  Shield,
  Key,
  Bell,
  Globe,
  Camera,
  LogOut,
  Save,
  CheckCircle2,
  Lock,
  Smartphone
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";

export default function Profile() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Mon Profil</h1>
          <p className="text-muted-foreground">Gérez vos informations personnelles et vos préférences de sécurité</p>
        </div>
        <Button variant="destructive" className="bg-red-950/20 text-red-500 border border-red-900/50 hover:bg-red-950/40 gap-2">
          <LogOut className="w-4 h-4" /> Déconnexion
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Avatar & Basic Info */}
        <div className="space-y-6">
          <Card className="p-8 bg-zinc-900/50 border-zinc-800 flex flex-col items-center text-center">
             <div className="relative group">
                <Avatar className="h-24 w-24 border-2 border-orange-500 ring-4 ring-orange-500/10 mb-4">
                  <AvatarFallback className="bg-orange-500/10 text-orange-400 text-3xl font-bold font-mono">AD</AvatarFallback>
                </Avatar>
                <button className="absolute bottom-4 right-0 p-2 bg-orange-600 rounded-full text-white shadow-lg opacity-0 group-hover:opacity-100 transition-opacity border-2 border-zinc-900">
                  <Camera className="w-4 h-4" />
                </button>
             </div>
             <h3 className="text-xl font-bold text-white">Administrateur Principal</h3>
             <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest mt-1">Superviseur d'Usine</p>

             <div className="mt-6 w-full pt-6 border-t border-zinc-800 space-y-3">
                <div className="flex justify-between text-xs">
                  <span className="text-zinc-500">Dernière Connexion</span>
                  <span className="text-zinc-300">Aujourd'hui, 08:42</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-zinc-500">Membre depuis</span>
                  <span className="text-zinc-300">Janvier 2024</span>
                </div>
             </div>
          </Card>

          <Card className="p-6 bg-zinc-900/50 border-zinc-800 space-y-4">
             <div className="flex items-center gap-2 font-bold text-white text-xs uppercase tracking-widest border-b border-zinc-800 pb-4">
                <Smartphone className="w-4 h-4 text-orange-500" />
                <span>Sécurité Mobile</span>
             </div>
             <div className="space-y-4">
                <div className="flex items-center justify-between">
                   <div className="space-y-0.5">
                      <Label className="text-xs text-zinc-300">Double Authentification (2FA)</Label>
                      <p className="text-[10px] text-zinc-500 italic">Protégez votre compte</p>
                   </div>
                   <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between pt-2">
                   <div className="space-y-0.5">
                      <Label className="text-xs text-zinc-300">Alertes SMS</Label>
                      <p className="text-[10px] text-zinc-500 italic">En cas de panne critique</p>
                   </div>
                   <Switch />
                </div>
             </div>
          </Card>
        </div>

        {/* Right Column: Detailed Settings */}
        <div className="lg:col-span-2 space-y-6">
           <Card className="p-6 bg-zinc-900/50 border-zinc-800 space-y-6">
              <div className="flex items-center gap-2 font-bold text-white text-xs uppercase tracking-widest border-b border-zinc-800 pb-4">
                 <User className="w-4 h-4 text-orange-500" />
                 <span>Informations Personnelles</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div className="space-y-2">
                    <Label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Nom Complet</Label>
                    <Input defaultValue="Administrateur Principal" className="bg-zinc-950 border-zinc-800 text-white h-11" />
                 </div>
                 <div className="space-y-2">
                    <Label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Adresse Email</Label>
                    <Input defaultValue="admin@usine-cement.com" className="bg-zinc-950 border-zinc-800 text-white h-11" />
                 </div>
                 <div className="space-y-2">
                    <Label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Poste / Fonction</Label>
                    <Input defaultValue="Superviseur Production" className="bg-zinc-950 border-zinc-800 text-white h-11" />
                 </div>
                 <div className="space-y-2">
                    <Label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Numéro de Téléphone</Label>
                    <Input defaultValue="+33 6 12 34 56 78" className="bg-zinc-950 border-zinc-800 text-white h-11" />
                 </div>
              </div>
           </Card>

           <Card className="p-6 bg-zinc-900/50 border-zinc-800 space-y-6">
              <div className="flex items-center gap-2 font-bold text-white text-xs uppercase tracking-widest border-b border-zinc-800 pb-4">
                 <Lock className="w-4 h-4 text-orange-500" />
                 <span>Changer le Mot de passe</span>
              </div>
              <div className="space-y-4">
                 <div className="space-y-2">
                    <Label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Mot de passe actuel</Label>
                    <Input type="password" placeholder="••••••••" className="bg-zinc-950 border-zinc-800 text-white h-11" />
                 </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                       <Label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Nouveau mot de passe</Label>
                       <Input type="password" placeholder="••••••••" className="bg-zinc-950 border-zinc-800 text-white h-11" />
                    </div>
                    <div className="space-y-2">
                       <Label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Confirmer le nouveau mot de passe</Label>
                       <Input type="password" placeholder="••••••••" className="bg-zinc-950 border-zinc-800 text-white h-11" />
                    </div>
                 </div>
              </div>
           </Card>

           <div className="flex justify-end gap-3 pt-4">
              <Button variant="outline" className="border-zinc-800 text-white px-8">Annuler</Button>
              <Button className="bg-orange-600 hover:bg-orange-700 text-white font-bold px-12 gap-2 shadow-lg shadow-orange-950/20">
                <Save className="w-4 h-4" /> Enregistrer le Profil
              </Button>
           </div>
        </div>
      </div>
    </div>
  );
}

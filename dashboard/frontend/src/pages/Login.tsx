import { useState } from 'react';
import {
  Package,
  Lock,
  User,
  ShieldCheck,
  ArrowRight,
  Eye,
  EyeOff,
  AlertCircle
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useLocation } from "wouter";

export default function Login() {
  const [, setLocation] = useLocation();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    // Simulate login
    setTimeout(() => {
      setIsLoading(false);
      setLocation("/");
    }, 1500);
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-zinc-950 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-full opacity-20 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-orange-600 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-orange-900 rounded-full blur-[120px]" />
      </div>

      <div className="w-full max-w-md px-6 relative z-10">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center shadow-xl shadow-orange-900/40 mb-4">
            <Package className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight text-center">Ciment <span className="text-orange-500">Monitor Pro</span></h1>
          <p className="text-zinc-500 text-sm mt-1 uppercase tracking-widest font-bold">Système de Vision Industrielle</p>
        </div>

        <Card className="p-8 bg-zinc-900/50 border-zinc-800 backdrop-blur-xl shadow-2xl">
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <Label className="text-zinc-400 text-xs uppercase font-bold tracking-widest">Identifiant</Label>
              <div className="relative group">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600 group-focus-within:text-orange-500 transition-colors" />
                <Input
                  placeholder="admin@usine.com"
                  className="bg-zinc-950 border-zinc-800 text-white pl-10 h-12 focus:border-orange-500/50 transition-all"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label className="text-zinc-400 text-xs uppercase font-bold tracking-widest">Mot de passe</Label>
                <button type="button" className="text-[10px] text-orange-500 hover:underline uppercase font-bold">Oublié ?</button>
              </div>
              <div className="relative group">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600 group-focus-within:text-orange-500 transition-colors" />
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  className="bg-zinc-950 border-zinc-800 text-white pl-10 pr-10 h-12 focus:border-orange-500/50 transition-all"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-lg bg-orange-500/5 border border-orange-500/10 mb-2">
               <ShieldCheck className="w-5 h-5 text-orange-500 shrink-0" />
               <p className="text-[10px] text-zinc-400 leading-relaxed italic">Connexion sécurisée via le réseau interne de l'usine (VPN-01).</p>
            </div>

            <Button
              type="submit"
              className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold h-12 gap-2 shadow-lg shadow-orange-950/20"
              disabled={isLoading}
            >
              {isLoading ? "Connexion en cours..." : "Accéder au Dashboard"}
              {!isLoading && <ArrowRight className="w-4 h-4" />}
            </Button>
          </form>
        </Card>

        <div className="mt-8 text-center space-y-4">
           <div className="flex items-center justify-center gap-2 text-[10px] text-zinc-600 font-bold uppercase tracking-[3px]">
              <span>Hardware: Edge-Node-01</span>
              <span className="w-1 h-1 rounded-full bg-zinc-800" />
              <span>Version: 2.4.0</span>
           </div>
           <p className="text-[11px] text-zinc-500">© 2024 Ciment Monitor. Tous droits réservés.</p>
        </div>
      </div>
    </div>
  );
}

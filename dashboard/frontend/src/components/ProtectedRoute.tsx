import { Redirect } from 'wouter';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2, ShieldOff } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  /** If specified, user must have this permission (or be admin). */
  permission?: string;
}

export default function ProtectedRoute({ children, permission }: ProtectedRouteProps) {
  const { user, isLoading, hasPermission } = useAuth();

  // Still validating stored token on mount
  if (isLoading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
      </div>
    );
  }

  // Not authenticated → go to login
  if (!user) {
    return <Redirect to="/login" />;
  }

  // Authenticated but missing required permission
  if (permission && !hasPermission(permission)) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4 text-center p-8">
        <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
          <ShieldOff className="w-8 h-8 text-red-400" />
        </div>
        <h2 className="text-xl font-bold text-white">Accès Refusé</h2>
        <p className="text-zinc-500 max-w-sm text-sm">
          Vous n'avez pas la permission d'accéder à cette page.<br />
          Contactez un administrateur pour obtenir les droits nécessaires.
        </p>
        <p className="text-xs text-zinc-600 font-mono bg-zinc-900 px-3 py-1.5 rounded border border-zinc-800">
          Permission requise : <span className="text-orange-400">{permission}</span>
        </p>
      </div>
    );
  }

  return <>{children}</>;
}

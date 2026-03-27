import {
  BarChart3, Settings, LogOut, Package, ShieldCheck, Bell,
  FileText, User, Users, TrendingUp, Activity, Link as LinkIcon,
  ChevronDown, LayoutDashboard, Video, Clock, Wrench, Database,
  Cpu, RefreshCw, Server, History,
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { fetchApi } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { useLocation } from 'wouter';

interface SidebarProps {
  activeRoute?: string;
}

interface MenuItem {
  id: string;
  label: string;
  href: string;
  permission?: string;
}

interface MenuSection {
  title: string;
  icon: any;
  key: string;
  items: MenuItem[];
}

// Role display helpers
const ROLE_LABELS: Record<string, string> = {
  admin:    'Administrateur',
  operator: 'Opérateur',
  viewer:   'Observateur',
};
const ROLE_COLORS: Record<string, string> = {
  admin:    'bg-orange-500/20 text-orange-300',
  operator: 'bg-blue-500/20 text-blue-300',
  viewer:   'bg-zinc-700/50 text-zinc-400',
};

const MENU_SECTIONS: MenuSection[] = [
  {
    title: 'Monitoring', icon: LayoutDashboard, key: 'monitoring',
    items: [
      { id: 'dashboard',   label: 'Tableau de Bord',    href: '/',                permission: 'dashboard_view' },
      { id: 'live-stream', label: 'Flux en Direct',      href: '/monitoring/live', permission: 'livestream_view' },
    ],
  },
  {
    title: 'Production', icon: Package, key: 'production',
    items: [
      { id: 'production-log', label: 'Journal de Production', href: '/production/log',      permission: 'logs_view' },
      { id: 'sessions',       label: 'Gestion des Sessions',  href: '/production/sessions', permission: 'sessions_manage' },
      { id: 'timeline',       label: 'Chronologie',           href: '/production/timeline', permission: 'timeline_view' },
    ],
  },
  {
    title: 'Configuration', icon: Settings, key: 'configuration',
    items: [
      { id: 'camera-settings', label: 'Paramètres Caméra',   href: '/config/camera',    permission: 'config_camera' },
      { id: 'model-config',    label: 'Modèle IA',            href: '/config/model',     permission: 'config_model' },
      { id: 'templates',       label: 'Templates & Couleurs', href: '/config/templates', permission: 'config_templates' },
      { id: 'virtual-line',    label: 'Ligne Virtuelle',      href: '/config/line',      permission: 'config_line' },
    ],
  },
  {
    title: 'Qualité', icon: ShieldCheck, key: 'qualite',
    items: [
      { id: 'quality-dash', label: "Qualité Détection",    href: '/quality/dashboard', permission: 'quality_view' },
      { id: 'anomalies',    label: "Détection d'Anomalies", href: '/quality/anomalies', permission: 'anomalies_view' },
    ],
  },
  {
    title: 'Alertes', icon: Bell, key: 'alertes',
    items: [
      { id: 'alert-mgmt', label: 'Gestion des Alertes', href: '/alerts/management', permission: 'alerts_view' },
    ],
  },
  {
    title: 'Rapports', icon: FileText, key: 'rapports',
    items: [
      { id: 'reports', label: 'Rapports de Production', href: '/reports/production', permission: 'reports_view' },
      { id: 'export',  label: 'Export de Données',      href: '/reports/export',     permission: 'reports_export' },
      { id: 'audit',   label: 'Audit Trail',            href: '/reports/audit',      permission: 'reports_view' },
    ],
  },
  {
    title: 'Administration', icon: Users, key: 'administration',
    items: [
      { id: 'users',   label: 'Utilisateurs',     href: '/admin/users',   permission: 'users_manage' },
      { id: 'system',  label: 'Paramètres Système', href: '/admin/system', permission: 'system_settings' },
      { id: 'devices', label: 'Gestion Appareils', href: '/admin/devices', permission: 'devices_manage' },
      { id: 'api-mgmt', label: 'Gestion API',      href: '/admin/api',    permission: 'system_settings' },
    ],
  },
  {
    title: 'Analytique', icon: TrendingUp, key: 'analytique',
    items: [
      { id: 'analytics', label: 'Performance & OEE', href: '/analytics/performance', permission: 'analytics_view' },
    ],
  },
  {
    title: 'Maintenance', icon: Wrench, key: 'maintenance',
    items: [
      { id: 'health',      label: 'Santé Système',     href: '/maintenance/health',       permission: 'maintenance_view' },
      { id: 'database',    label: 'Gestion de la BD',  href: '/maintenance/database',     permission: 'database_manage' },
      { id: 'diagnostics', label: 'Outils Diagnostic', href: '/maintenance/diagnostics',  permission: 'maintenance_view' },
    ],
  },
  {
    title: 'Intégration', icon: LinkIcon, key: 'integration',
    items: [
      { id: 'integration', label: 'Services Tiers', href: '/integration/third-party', permission: 'system_settings' },
    ],
  },
];

export function Sidebar({ activeRoute = 'dashboard' }: SidebarProps) {
  const { user, logout, hasPermission } = useAuth();
  const [, setLocation] = useLocation();
  const [unreadAlerts, setUnreadAlerts] = useState(0);

  useEffect(() => {
    const fetchUnread = async () => {
      try {
        const data = await fetchApi('/api/alerts/unread-count');
        setUnreadAlerts(data.count ?? 0);
      } catch { /* silent */ }
    };
    fetchUnread();
    const id = setInterval(fetchUnread, 30_000);
    return () => clearInterval(id);
  }, []);

  const [expanded, setExpanded] = useState<Record<string, boolean>>({
    monitoring: true, production: true, configuration: false,
    qualite: false, alertes: false, rapports: false,
    administration: false, analytique: false, maintenance: false,
    integration: false,
  });

  const toggle = (key: string) => setExpanded(p => ({ ...p, [key]: !p[key] }));

  const handleLogout = () => {
    logout();
    setLocation('/login');
  };

  const roleLabel = user ? (ROLE_LABELS[user.role] ?? user.role) : '';
  const roleColor = user ? (ROLE_COLORS[user.role] ?? 'bg-zinc-700/50 text-zinc-400') : '';

  return (
    <aside className="fixed left-0 top-0 h-screen w-72 bg-sidebar border-r border-sidebar-border flex flex-col overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-sidebar-border bg-sidebar z-10 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center shrink-0">
            <Package className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-sidebar-foreground">Ciment</h1>
            <p className="text-xs text-sidebar-accent">Monitor Pro</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-6 space-y-4 overflow-y-auto custom-scrollbar">
        {MENU_SECTIONS.map((section) => {
          const Icon = section.icon;
          // Filter items by permission
          const visibleItems = section.items.filter(
            item => !item.permission || hasPermission(item.permission)
          );
          if (visibleItems.length === 0) return null;

          const isExpanded = expanded[section.key];

          return (
            <div key={section.key} className="space-y-1">
              <button
                onClick={() => toggle(section.key)}
                className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold uppercase tracking-wider text-sidebar-foreground/50 hover:text-sidebar-foreground transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Icon className="w-4 h-4" />
                  <span>{section.title}</span>
                  {section.title === 'Alertes' && unreadAlerts > 0 && (
                    <span className="inline-flex items-center justify-center h-4 min-w-4 px-1 rounded-full bg-orange-500 text-white text-[9px] font-bold leading-none">
                      {unreadAlerts > 99 ? '99+' : unreadAlerts}
                    </span>
                  )}
                </div>
                <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${isExpanded ? '' : '-rotate-90'}`} />
              </button>

              {isExpanded && (
                <div className="space-y-1 ml-4 border-l border-sidebar-border/50">
                  {visibleItems.map(item => {
                    const isActive = activeRoute === item.id;
                    return (
                      <a
                        key={item.id}
                        href={item.href}
                        className={`
                          flex items-center gap-3 px-4 py-2 text-sm transition-all duration-200 rounded-r-lg ml-[-1px]
                          ${isActive
                            ? 'border-l-2 border-orange-500 bg-orange-500/10 text-orange-400 font-medium'
                            : 'text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/20'
                          }
                        `}
                      >
                        <span>{item.label}</span>
                      </a>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* Footer: user info + profile + logout */}
      <div className="border-t border-sidebar-border bg-sidebar shrink-0">
        {/* User identity */}
        {user && (
          <div className="px-4 py-3 border-b border-sidebar-border/50 flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-orange-600 flex items-center justify-center shrink-0 text-white text-xs font-bold uppercase">
              {user.full_name.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-sidebar-foreground truncate">{user.full_name}</p>
              <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded ${roleColor}`}>
                {roleLabel}
              </span>
            </div>
          </div>
        )}

        <div className="p-3 space-y-1">
          <a
            href="/profile"
            className={`
              flex items-center gap-3 px-4 py-2.5 rounded-lg w-full
              transition-all duration-200 text-sm font-medium
              ${activeRoute === 'profile'
                ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20'
                : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/20 hover:text-sidebar-foreground'}
            `}
          >
            <User className="w-4 h-4" />
            <span>Mon Profil</span>
          </a>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-2.5 rounded-lg w-full text-sidebar-foreground/70 hover:bg-red-500/10 hover:text-red-400 transition-all duration-200 text-sm font-medium"
          >
            <LogOut className="w-4 h-4" />
            <span>Déconnexion</span>
          </button>
        </div>
      </div>
    </aside>
  );
}

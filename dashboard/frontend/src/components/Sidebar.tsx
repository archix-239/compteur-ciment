import {
  BarChart3,
  Settings,
  LogOut,
  Package,
  ShieldCheck,
  Bell,
  FileText,
  User,
  Users,
  TrendingUp,
  Activity,
  Link as LinkIcon,
  ChevronDown,
  LayoutDashboard,
  Video,
  Clock,
  Wrench,
  Database,
  Cpu,
  RefreshCw,
  Server,
  History
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { API_URL } from '@/lib/api';

interface SidebarProps {
  activeRoute?: string;
}

interface MenuSection {
  title: string;
  icon: any;
  items: {
    id: string;
    label: string;
    href: string;
  }[];
}

export function Sidebar({ activeRoute = 'dashboard' }: SidebarProps) {
  const [unreadAlerts, setUnreadAlerts] = useState<number>(0);

  useEffect(() => {
    const fetchUnread = async () => {
      try {
        const res = await fetch(`${API_URL}/api/alerts/unread-count`);
        if (res.ok) {
          const data = await res.json();
          setUnreadAlerts(data.count ?? 0);
        }
      } catch {
        // silent fail — sidebar badge is non-critical
      }
    };
    fetchUnread();
    const interval = setInterval(fetchUnread, 30_000);
    return () => clearInterval(interval);
  }, []);

  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    monitoring: true,
    production: true,
    configuration: false,
    quality: false,
    alerts: false,
    reports: false,
    administration: false,
    analytics: false,
    maintenance: false,
    integration: false
  });

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const menuSections: MenuSection[] = [
    {
      title: 'Monitoring',
      icon: LayoutDashboard,
      items: [
        { id: 'dashboard', label: 'Tableau de Bord', href: '/' },
        { id: 'live-stream', label: 'Flux en Direct', href: '/monitoring/live' },
      ]
    },
    {
      title: 'Production',
      icon: Package,
      items: [
        { id: 'production-log', label: 'Journal de Production', href: '/production/log' },
        { id: 'sessions', label: 'Gestion des Sessions', href: '/production/sessions' },
        { id: 'timeline', label: 'Chronologie', href: '/production/timeline' },
      ]
    },
    {
      title: 'Configuration',
      icon: Settings,
      items: [
        { id: 'camera-settings', label: 'Paramètres Caméra', href: '/config/camera' },
        { id: 'model-config', label: 'Modèle IA', href: '/config/model' },
        { id: 'templates', label: 'Templates & Couleurs', href: '/config/templates' },
        { id: 'virtual-line', label: 'Ligne Virtuelle', href: '/config/line' },
      ]
    },
    {
      title: 'Qualité',
      icon: ShieldCheck,
      items: [
        { id: 'quality-dash', label: 'Qualité Détection', href: '/quality/dashboard' },
        { id: 'anomalies', label: 'Détection d\'Anomalies', href: '/quality/anomalies' },
      ]
    },
    {
      title: 'Alertes',
      icon: Bell,
      items: [
        { id: 'alert-mgmt', label: 'Gestion des Alertes', href: '/alerts/management' },
      ]
    },
    {
      title: 'Rapports',
      icon: FileText,
      items: [
        { id: 'reports', label: 'Rapports de Production', href: '/reports/production' },
        { id: 'export', label: 'Export de Données', href: '/reports/export' },
        { id: 'audit', label: 'Audit Trail', href: '/reports/audit' },
      ]
    },
    {
      title: 'Administration',
      icon: Users,
      items: [
        { id: 'users', label: 'Utilisateurs', href: '/admin/users' },
        { id: 'system', label: 'Paramètres Système', href: '/admin/system' },
        { id: 'devices', label: 'Gestion Appareils', href: '/admin/devices' },
        { id: 'api-mgmt', label: 'Gestion API', href: '/admin/api' },
      ]
    },
    {
      title: 'Analytique',
      icon: TrendingUp,
      items: [
        { id: 'analytics', label: 'Performance & OEE', href: '/analytics/performance' },
      ]
    },
    {
      title: 'Maintenance',
      icon: Wrench,
      items: [
        { id: 'health', label: 'Santé Système', href: '/maintenance/health' },
        { id: 'database', label: 'Gestion de la BD', href: '/maintenance/database' },
        { id: 'diagnostics', label: 'Outils Diagnostic', href: '/maintenance/diagnostics' },
      ]
    },
    {
      title: 'Intégration',
      icon: LinkIcon,
      items: [
        { id: 'integration', label: 'Services Tiers', href: '/integration/third-party' },
      ]
    },
  ];

  return (
    <aside className="fixed left-0 top-0 h-screen w-72 bg-sidebar border-r border-sidebar-border flex flex-col overflow-hidden">
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

      <nav className="flex-1 px-3 py-6 space-y-4 overflow-y-auto custom-scrollbar">
        {menuSections.map((section) => {
          const Icon = section.icon;
          const sectionKey = section.title.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
          const isExpanded = expandedSections[sectionKey];

          return (
            <div key={section.title} className="space-y-1">
              <button
                onClick={() => toggleSection(sectionKey)}
                className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold uppercase tracking-wider text-sidebar-foreground/50 hover:text-sidebar-foreground transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Icon className="w-4 h-4" />
                  <span>{section.title}</span>
                  {section.title === 'Alertes' && unreadAlerts > 0 && (
                    <span className="ml-0.5 inline-flex items-center justify-center h-4 min-w-4 px-1 rounded-full bg-orange-500 text-white text-[9px] font-bold leading-none">
                      {unreadAlerts > 99 ? '99+' : unreadAlerts}
                    </span>
                  )}
                </div>
                <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${isExpanded ? '' : '-rotate-90'}`} />
              </button>

              {isExpanded && (
                <div className="space-y-1 ml-4 border-l border-sidebar-border/50">
                  {section.items.map((item) => {
                    const isActive = activeRoute === item.id;
                    return (
                      <a
                        key={item.id}
                        href={item.href}
                        className={`
                          flex items-center gap-3 px-4 py-2 text-sm transition-all duration-200 rounded-r-lg ml-[-1px]
                          ${
                            isActive
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

      <div className="p-4 border-t border-sidebar-border bg-sidebar shrink-0 space-y-1">
        <a
          href="/profile"
          className={`
            flex items-center gap-3 px-4 py-3 rounded-lg w-full
            transition-all duration-200 text-sm font-medium
            ${activeRoute === 'profile'
              ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20'
              : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/20 hover:text-sidebar-foreground'}
          `}
        >
          <User className="w-5 h-5" />
          <span>Mon Profil</span>
        </a>
        <button
          className="
            flex items-center gap-3 px-4 py-3 rounded-lg w-full
            text-sidebar-foreground/70 hover:bg-sidebar-accent/20 hover:text-red-400
            transition-all duration-200 text-sm font-medium
          "
        >
          <LogOut className="w-5 h-5" />
          <span>Déconnexion</span>
        </button>
      </div>
    </aside>
  );
}

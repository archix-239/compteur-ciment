import {
  BarChart3,
  Settings,
  LogOut,
  Package,
  ShieldCheck,
  Bell,
  FileText,
  Users,
  TrendingUp,
  Activity,
  Link as LinkIcon,
  ChevronDown
} from 'lucide-react';
import { useState } from 'react';

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
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    monitoring: true,
    production: true
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
      icon: BarChart3,
      items: [
        { id: 'dashboard', label: 'Dashboard Principal', href: '/' },
        { id: 'live-stream', label: 'Live Stream Viewer', href: '/monitoring/live' },
      ]
    },
    {
      title: 'Production',
      icon: Package,
      items: [
        { id: 'production-log', label: 'Production Log', href: '/production/log' },
        { id: 'sessions', label: 'Session Management', href: '/production/sessions' },
        { id: 'timeline', label: 'Production Timeline', href: '/production/timeline' },
      ]
    },
    {
      title: 'Configuration',
      icon: Settings,
      items: [
        { id: 'camera-settings', label: 'Camera Settings', href: '/config/camera' },
        { id: 'model-config', label: 'Model Configuration', href: '/config/model' },
        { id: 'templates', label: 'Templates & Color', href: '/config/templates' },
        { id: 'virtual-line', label: 'Virtual Line', href: '/config/line' },
      ]
    },
    {
      title: 'Quality',
      icon: ShieldCheck,
      items: [
        { id: 'quality-dash', label: 'Detection Quality', href: '/quality/dashboard' },
        { id: 'verification', label: 'Manual Verification', href: '/quality/verification' },
        { id: 'anomalies', label: 'Anomaly Detection', href: '/quality/anomalies' },
      ]
    },
    {
      title: 'Alerts',
      icon: Bell,
      items: [
        { id: 'alert-mgmt', label: 'Alert Management', href: '/alerts/management' },
      ]
    },
    {
      title: 'Reports',
      icon: FileText,
      items: [
        { id: 'reports', label: 'Production Reports', href: '/reports/production' },
        { id: 'export', label: 'Data Export', href: '/reports/export' },
      ]
    },
    {
      title: 'Administration',
      icon: Users,
      items: [
        { id: 'users', label: 'User Management', href: '/admin/users' },
        { id: 'system', label: 'System Settings', href: '/admin/system' },
      ]
    },
    {
      title: 'Analytics',
      icon: TrendingUp,
      items: [
        { id: 'analytics', label: 'Performance Analytics', href: '/analytics/performance' },
      ]
    },
    {
      title: 'Maintenance',
      icon: Activity,
      items: [
        { id: 'health', label: 'System Health', href: '/maintenance/health' },
      ]
    },
    {
      title: 'Integration',
      icon: LinkIcon,
      items: [
        { id: 'integration', label: 'Third-party Integrations', href: '/integration/third-party' },
      ]
    },
  ];

  return (
    <aside className="fixed left-0 top-0 h-screen w-72 bg-sidebar border-r border-sidebar-border flex flex-col overflow-y-auto custom-scrollbar">
      <div className="p-6 border-b border-sidebar-border sticky top-0 bg-sidebar z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center shrink-0">
            <Package className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-sidebar-foreground">Cement</h1>
            <p className="text-xs text-sidebar-accent">Monitor Pro</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-3 py-6 space-y-4">
        {menuSections.map((section) => {
          const Icon = section.icon;
          const isExpanded = expandedSections[section.title.toLowerCase()];

          return (
            <div key={section.title} className="space-y-1">
              <button
                onClick={() => toggleSection(section.title.toLowerCase())}
                className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold uppercase tracking-wider text-sidebar-foreground/50 hover:text-sidebar-foreground transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Icon className="w-4 h-4" />
                  <span>{section.title}</span>
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

      <div className="p-4 border-t border-sidebar-border sticky bottom-0 bg-sidebar">
        <button
          className="
            flex items-center gap-3 px-4 py-3 rounded-lg w-full
            text-sidebar-foreground/70 hover:bg-sidebar-accent/20 hover:text-sidebar-foreground
            transition-all duration-200 text-sm font-medium
          "
        >
          <LogOut className="w-5 h-5" />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}

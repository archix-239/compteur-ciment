import { BarChart3, Settings, LogOut, Package } from 'lucide-react';

/**
 * Sidebar Component
 * Navigation principale pour l'interface d'administration
 * Design: Minimalisme Industriel - Dark sidebar avec accents orange
 */

interface SidebarProps {
  activeRoute?: string;
}

export function Sidebar({ activeRoute = 'dashboard' }: SidebarProps) {
  const menuItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: BarChart3,
      href: '/',
    },
    {
      id: 'production',
      label: 'Production Log',
      icon: Package,
      href: '/production',
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: Settings,
      href: '/settings',
    },
  ];

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-sidebar border-r border-sidebar-border flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center">
            <Package className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-sidebar-foreground">Cement</h1>
            <p className="text-xs text-sidebar-accent">Monitor</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeRoute === item.id;

          return (
            <a
              key={item.id}
              href={item.href}
              className={`
                flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200
                ${
                  isActive
                    ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                    : 'text-sidebar-foreground hover:bg-sidebar-accent/20'
                }
              `}
            >
              <Icon className="w-5 h-5" />
              <span className="text-sm font-medium">{item.label}</span>
            </a>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-sidebar-border">
        <button
          className="
            flex items-center gap-3 px-4 py-3 rounded-lg w-full
            text-sidebar-foreground hover:bg-sidebar-accent/20
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

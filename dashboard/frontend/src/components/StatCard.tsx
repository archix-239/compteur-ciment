import { ReactNode } from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
  unit?: string;
  icon?: ReactNode;
  trend?: {
    value: number;
    direction: 'up' | 'down';
  };
  highlighted?: boolean;
}

/**
 * StatCard Component
 * Displays a single metric with title, value, and optional trend
 * Design: Minimalisme Industriel - Dark card with orange accent border for highlighted
 */
export function StatCard({
  title,
  value,
  unit,
  icon,
  trend,
  highlighted = false,
}: StatCardProps) {
  return (
    <div
      className={`
        rounded-lg p-6 transition-all duration-300 animate-fadeInUp
        ${
          highlighted
            ? 'bg-gradient-to-br from-orange-950 to-orange-900 border-2 border-orange-500 shadow-lg shadow-orange-500/20'
            : 'bg-card border border-border hover:border-muted-foreground/30'
        }
      `}
    >
      <div className="flex items-start justify-between mb-4">
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
          {title}
        </h3>
        {icon && (
          <div className={highlighted ? 'text-orange-400' : 'text-muted-foreground'}>
            {icon}
          </div>
        )}
      </div>

      <div className="space-y-2">
        <div className="flex items-baseline gap-2">
          <span
            className={`text-4xl font-bold font-mono ${
              highlighted ? 'text-orange-300' : 'text-foreground'
            }`}
          >
            {value}
          </span>
          {unit && (
            <span className="text-sm text-muted-foreground font-medium">{unit}</span>
          )}
        </div>

        {trend && (
          <div
            className={`text-xs font-medium ${
              trend.direction === 'up' ? 'text-green-400' : 'text-red-400'
            }`}
          >
            {trend.direction === 'up' ? '↑' : '↓'} {Math.abs(trend.value)}% vs average
          </div>
        )}
      </div>
    </div>
  );
}

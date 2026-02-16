import { Badge } from "@/components/ui/badge";

interface StatusBadgeProps {
  status: 'online' | 'offline' | 'warning' | 'connecting';
  label: string;
  className?: string;
}

export function StatusBadge({ status, label, className }: StatusBadgeProps) {
  const colors = {
    online: 'bg-green-500/10 text-green-400 border-green-500/20',
    offline: 'bg-red-500/10 text-red-400 border-red-500/20',
    warning: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
    connecting: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  };

  const dotColors = {
    online: 'bg-green-500',
    offline: 'bg-red-500',
    warning: 'bg-yellow-500',
    connecting: 'bg-blue-500',
  };

  return (
    <Badge variant="outline" className={`${colors[status]} gap-2 px-3 py-1 ${className}`}>
      <div className={`w-1.5 h-1.5 rounded-full ${dotColors[status]} ${status === 'online' || status === 'connecting' ? 'animate-pulse' : ''}`} />
      <span className="text-[10px] font-bold uppercase tracking-widest">{label}</span>
    </Badge>
  );
}

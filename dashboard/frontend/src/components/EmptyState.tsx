import { ReactNode } from 'react';
import { LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({ icon: Icon, title, description, actionLabel, onAction }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center space-y-4 rounded-xl border-2 border-dashed border-zinc-800 bg-zinc-900/20">
      <div className="p-4 rounded-full bg-zinc-900 border border-zinc-800">
        <Icon className="w-8 h-8 text-zinc-600" />
      </div>
      <div className="space-y-1 max-w-[300px]">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider">{title}</h3>
        <p className="text-xs text-zinc-500 leading-relaxed italic">{description}</p>
      </div>
      {actionLabel && onAction && (
        <Button
          variant="outline"
          size="sm"
          onClick={onAction}
          className="border-zinc-800 text-orange-500 hover:text-white h-9 text-[10px] font-bold uppercase tracking-widest mt-2"
        >
          {actionLabel}
        </Button>
      )}
    </div>
  );
}

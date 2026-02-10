import { AlertCircle } from 'lucide-react';

/**
 * ProductionGaps Component
 * Displays detected production gaps and anomalies
 * Design: Minimalisme Industriel - Dark card with red accent indicators
 */

interface Gap {
  id: string;
  bagRange: string;
  duration: string;
  time: string;
  deviation: number; // percentage above average
}

interface ProductionGapsProps {
  gaps: Gap[];
  title?: string;
}

export function ProductionGaps({
  gaps,
  title = 'Production Gaps Detected',
}: ProductionGapsProps) {
  return (
    <div className="bg-card border border-border rounded-lg p-6">
      <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-6">
        {title}
      </h3>

      <div className="space-y-4">
        {gaps.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-green-400 text-sm font-medium">No gaps detected</div>
            <div className="text-muted-foreground text-xs mt-1">Production running smoothly</div>
          </div>
        ) : (
          gaps.map((gap) => (
            <div key={gap.id} className="border-l-2 border-red-500 pl-4 py-2">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="font-mono text-sm font-medium text-foreground">
                    {gap.duration} gap between Bag {gap.bagRange}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    at {gap.time} — {gap.deviation}% above average
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

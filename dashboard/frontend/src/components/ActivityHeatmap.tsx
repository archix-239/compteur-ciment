/**
 * ActivityHeatmap Component
 * Displays a 5-second bucket heatmap showing production activity levels
 * Design: Minimalisme Industriel - Grid with color-coded activity levels
 */

interface ActivityLevel {
  level: 'none' | 'low' | 'medium' | 'high';
  count: number;
}

interface HeatmapBucket {
  time: string;
  activity: ActivityLevel;
}

interface ActivityHeatmapProps {
  buckets: HeatmapBucket[];
  title?: string;
}

const activityColors = {
  none: 'bg-gray-700',
  low: 'bg-yellow-600',
  medium: 'bg-yellow-500',
  high: 'bg-yellow-400',
};

const activityLabels = {
  none: 'None',
  low: 'Low',
  medium: 'Med',
  high: 'High',
};

export function ActivityHeatmap({
  buckets,
  title = 'Activity Heatmap (5s buckets)',
}: ActivityHeatmapProps) {
  return (
    <div className="bg-card border border-border rounded-lg p-6">
      <div className="mb-6">
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-4">
          {title}
        </h3>

        {/* Heatmap Grid */}
        <div className="space-y-4">
          {/* Bags row */}
          <div>
            <div className="text-xs text-muted-foreground mb-2">Bags</div>
            <div className="flex gap-2 flex-wrap">
              {buckets.map((bucket, idx) => (
                <div
                  key={idx}
                  className={`
                    w-8 h-8 rounded transition-all duration-200
                    ${activityColors[bucket.activity.level]}
                    hover:ring-2 hover:ring-orange-500 cursor-pointer
                    flex items-center justify-center text-xs font-mono
                  `}
                  title={`${bucket.time}: ${bucket.activity.count} bags`}
                >
                  {bucket.activity.count > 0 && (
                    <span className="text-gray-900 font-bold text-xs">
                      {bucket.activity.count}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Legend */}
          <div className="flex gap-4 mt-6 pt-4 border-t border-border">
            <div className="text-xs text-muted-foreground">Activity:</div>
            <div className="flex gap-3">
              {(Object.keys(activityColors) as Array<keyof typeof activityColors>).map(
                (level) => (
                  <div key={level} className="flex items-center gap-2">
                    <div className={`w-4 h-4 rounded ${activityColors[level]}`} />
                    <span className="text-xs text-muted-foreground">
                      {activityLabels[level]}
                    </span>
                  </div>
                )
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

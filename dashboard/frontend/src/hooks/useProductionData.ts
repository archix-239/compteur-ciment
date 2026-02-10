import { useState, useCallback, useEffect } from 'react';

/**
 * Production Data Hook
 * Manages simulated real-time production data based on cement bag counter
 */

export interface ProductionMetrics {
  totalBags: number;
  productionRate: number; // bags per minute
  avgInterval: number; // seconds
  consistency: number; // percentage
  firstHalfInterval: number;
  secondHalfInterval: number;
  slowdownPercent: number;
}

export interface IntervalDataPoint {
  time: string;
  avgInterval: number;
  minInterval: number;
  maxInterval: number;
}

export interface HeatmapBucket {
  time: string;
  activity: {
    level: 'none' | 'low' | 'medium' | 'high';
    count: number;
  };
}

export interface ProductionGap {
  id: string;
  bagRange: string;
  duration: string;
  time: string;
  deviation: number;
}

// Simulated data generators
const generateIntervalData = (): IntervalDataPoint[] => {
  const now = new Date();
  const intervals = [];

  for (let i = 13; i >= 0; i--) {
    const time = new Date(now.getTime() - i * 60000);
    const baseInterval = 2.21;
    const variance = (Math.random() - 0.5) * 0.8;

    intervals.push({
      time: `${time.getHours()}:${String(time.getMinutes()).padStart(2, '0')}`,
      avgInterval: baseInterval + variance,
      minInterval: baseInterval - 0.4 + Math.random() * 0.3,
      maxInterval: baseInterval + 0.6 + Math.random() * 0.4,
    });
  }

  return intervals;
};

const generateHeatmapData = (): HeatmapBucket[] => {
  const buckets: HeatmapBucket[] = [];
  for (let i = 0; i < 6; i++) {
    const count = Math.floor(Math.random() * 5);
    const level: 'none' | 'low' | 'medium' | 'high' =
      count === 0 ? 'none' : count < 2 ? 'low' : count < 4 ? 'medium' : 'high';
    buckets.push({
      time: `${i}s`,
      activity: { level, count },
    });
  }
  return buckets;
};

const generateProductionGaps = (): ProductionGap[] => {
  return [
    {
      id: '1',
      bagRange: '#5 → #6',
      duration: '4.71s',
      time: '11:55',
      deviation: 113,
    },
    {
      id: '2',
      bagRange: '#7 → #8',
      duration: '4.64s',
      time: '17:45',
      deviation: 110,
    },
    {
      id: '3',
      bagRange: '#11 → #12',
      duration: '4.27s',
      time: '26:03',
      deviation: 93,
    },
  ];
};

export function useProductionData() {
  const [metrics, setMetrics] = useState<ProductionMetrics>({
    totalBags: 14,
    productionRate: 28.6,
    avgInterval: 2.21,
    consistency: 59,
    firstHalfInterval: 2.09,
    secondHalfInterval: 2.32,
    slowdownPercent: 10.9,
  });

  const [intervalData, setIntervalData] = useState<IntervalDataPoint[]>(generateIntervalData());
  const [heatmapData, setHeatmapData] = useState<HeatmapBucket[]>(generateHeatmapData());
  const [productionGaps, setProductionGaps] = useState<ProductionGap[]>(
    generateProductionGaps()
  );

  // Simulate real-time updates
  useEffect(() => {
    const updateInterval = setInterval(() => {
      setMetrics((prev) => ({
        ...prev,
        totalBags: prev.totalBags + (Math.random() > 0.7 ? 1 : 0),
        productionRate: Math.max(20, prev.productionRate + (Math.random() - 0.5) * 3),
        avgInterval: Math.max(1.5, prev.avgInterval + (Math.random() - 0.5) * 0.1),
        consistency: Math.min(100, Math.max(40, prev.consistency + (Math.random() - 0.5) * 2)),
      }));

      setIntervalData(generateIntervalData());
      setHeatmapData(generateHeatmapData());

      // Occasionally update production gaps
      if (Math.random() > 0.8) {
        setProductionGaps(generateProductionGaps());
      }
    }, 3000);

    return () => clearInterval(updateInterval);
  }, []);

  const resetMetrics = useCallback(() => {
    setMetrics({
      totalBags: 0,
      productionRate: 0,
      avgInterval: 0,
      consistency: 0,
      firstHalfInterval: 0,
      secondHalfInterval: 0,
      slowdownPercent: 0,
    });
  }, []);

  return {
    metrics,
    intervalData,
    heatmapData,
    productionGaps,
    resetMetrics,
  };
}

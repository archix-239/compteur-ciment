import { useState, useCallback, useEffect } from 'react';
import { API_URL, WS_URL } from '@/lib/api';

/**
 * Production Data Hook
 * Manages real-time production data from the backend
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
    totalBags: 0,
    productionRate: 0,
    avgInterval: 0,
    consistency: 0,
    firstHalfInterval: 0,
    secondHalfInterval: 0,
    slowdownPercent: 0,
  });

  const [intervalData, setIntervalData] = useState<IntervalDataPoint[]>([]);
  const [heatmapData, setHeatmapData] = useState<HeatmapBucket[]>([]);
  const [productionGaps, setProductionGaps] = useState<ProductionGap[]>([]);

  // Initial fetch
  useEffect(() => {
    fetch(`${API_URL}/api/dashboard/summary`)
      .then(res => res.json())
      .then(data => {
        setMetrics(prev => ({
          ...prev,
          totalBags: data.totalBags,
          productionRate: data.productionRate,
          avgInterval: data.avgInterval,
          consistency: data.consistency
        }));
      })
      .catch(err => console.error("Error fetching dashboard summary:", err));

    // Fallback data for charts if API doesn't provide them yet
    setIntervalData(generateIntervalData());
    setHeatmapData(generateHeatmapData());
    setProductionGaps(generateProductionGaps());
  }, []);

  // WebSocket for real-time updates
  useEffect(() => {
    const ws = new WebSocket(WS_URL);

    ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      if (message.type === 'COUNT_EVENT') {
        const eventData = message.data;
        setMetrics((prev) => ({
          ...prev,
          totalBags: eventData.session_stats.total,
          // Update other metrics if needed
        }));

        // Update charts on each event
        setIntervalData(generateIntervalData());
        setHeatmapData(generateHeatmapData());
      }
    };

    ws.onerror = (error) => console.error("WebSocket error:", error);
    ws.onclose = () => console.log("WebSocket connection closed");

    return () => ws.close();
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

import { useState, useCallback, useEffect } from 'react';
import { API_URL, WS_URL } from '@/lib/api';

/**
 * Production Data Hook
 * Manages real-time production data from the backend.
 * All data comes from GET /api/dashboard/summary — no simulated data.
 */

export interface ProductionMetrics {
  totalBags: number;
  productionRate: number;    // sacs / minute
  avgInterval: number;       // secondes entre sacs
  consistency: number;       // % (100 = parfait)
  stddev: number;            // écart-type des intervalles
  firstHalfInterval: number;
  secondHalfInterval: number;
  slowdownPercent: number;   // positif = ralentissement, négatif = accélération
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

const DEFAULT_METRICS: ProductionMetrics = {
  totalBags: 0,
  productionRate: 0,
  avgInterval: 0,
  consistency: 0,
  stddev: 0,
  firstHalfInterval: 0,
  secondHalfInterval: 0,
  slowdownPercent: 0,
};

export function useProductionData() {
  const [metrics, setMetrics] = useState<ProductionMetrics>(DEFAULT_METRICS);
  const [intervalData, setIntervalData] = useState<IntervalDataPoint[]>([]);
  const [heatmapData, setHeatmapData] = useState<HeatmapBucket[]>([]);
  const [productionGaps, setProductionGaps] = useState<ProductionGap[]>([]);
  const [loading, setLoading] = useState(true);

  // ── Chargement des données ─────────────────────────────────────────────────

  const loadData = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/dashboard/summary`);
      if (!res.ok) return;
      const data = await res.json();

      setMetrics({
        totalBags:          data.totalBags          ?? 0,
        productionRate:     data.productionRate      ?? 0,
        avgInterval:        data.avgInterval         ?? 0,
        consistency:        data.consistency         ?? 0,
        stddev:             data.stddev              ?? 0,
        firstHalfInterval:  data.firstHalfInterval   ?? 0,
        secondHalfInterval: data.secondHalfInterval  ?? 0,
        slowdownPercent:    data.slowdownPercent      ?? 0,
      });

      setIntervalData(data.intervalData    ?? []);
      setHeatmapData(data.heatmapData      ?? []);
      setProductionGaps(data.productionGaps ?? []);
    } catch (e) {
      console.error('Dashboard summary error:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  // Chargement initial + rafraîchissement toutes les 30s
  useEffect(() => {
    loadData();
    const timer = setInterval(loadData, 30_000);
    return () => clearInterval(timer);
  }, [loadData]);

  // ── WebSocket — mise à jour en temps réel (avec reconnexion automatique) ────

  useEffect(() => {
    let ws: WebSocket;
    let reconnectTimer: ReturnType<typeof setTimeout>;
    let destroyed = false;

    const connect = () => {
      if (destroyed) return;
      ws = new WebSocket(WS_URL);

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data as string);
          if (message.type === 'COUNT_EVENT') {
            const total = message.data?.session_stats?.total;
            if (typeof total === 'number') {
              setMetrics((prev) => ({ ...prev, totalBags: total }));
            }
            loadData();
          }
        } catch { /* ignore */ }
      };

      ws.onclose = () => {
        if (!destroyed) reconnectTimer = setTimeout(connect, 3000);
      };
      ws.onerror = () => { ws.close(); };
    };

    connect();
    return () => {
      destroyed = true;
      clearTimeout(reconnectTimer);
      ws?.close();
    };
  }, [loadData]);

  // ── Réinitialisation ───────────────────────────────────────────────────────

  const resetMetrics = useCallback(() => {
    setMetrics(DEFAULT_METRICS);
    setIntervalData([]);
    setHeatmapData([]);
    setProductionGaps([]);
  }, []);

  return {
    metrics,
    intervalData,
    heatmapData,
    productionGaps,
    loading,
    refresh: loadData,
    resetMetrics,
  };
}

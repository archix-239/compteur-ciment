import { useState, useEffect, useRef, useCallback } from 'react';
import { WS_VIDEO_URL } from '@/lib/api';

interface VideoStreamState {
  status: 'connecting' | 'online' | 'offline';
  fps: number;
  latency: number;
}

/**
 * Hook to receive video frames via WebSocket from /ws/video.
 * Renders base64 JPEG frames onto a provided <img> element.
 */
export function useVideoStream(imgRef: React.RefObject<HTMLImageElement | null>, enabled: boolean = true) {
  const [state, setState] = useState<VideoStreamState>({
    status: 'offline',
    fps: 0,
    latency: 0,
  });
  const wsRef = useRef<WebSocket | null>(null);
  const frameCountRef = useRef(0);
  const fpsIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const connect = useCallback(() => {
    if (!enabled) return;
    if (wsRef.current && wsRef.current.readyState <= WebSocket.OPEN) return;

    setState(prev => ({ ...prev, status: 'connecting' }));

    const ws = new WebSocket(WS_VIDEO_URL);
    wsRef.current = ws;

    ws.onopen = () => {
      setState(prev => ({ ...prev, status: 'online' }));
    };

    ws.onmessage = (event) => {
      const data = event.data;
      // Empty string = keepalive ping, ignore
      if (!data || data.length === 0) return;

      frameCountRef.current++;

      if (imgRef.current) {
        imgRef.current.src = `data:image/jpeg;base64,${data}`;
      }
    };

    ws.onerror = () => {
      setState(prev => ({ ...prev, status: 'offline' }));
    };

    ws.onclose = () => {
      setState(prev => ({ ...prev, status: 'offline', fps: 0 }));
      wsRef.current = null;

      // Auto-reconnect after 2 seconds
      if (enabled) {
        reconnectTimeoutRef.current = setTimeout(connect, 2000);
      }
    };
  }, [enabled, imgRef]);

  useEffect(() => {
    if (!enabled) {
      // Cleanup if disabled
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
      setState({ status: 'offline', fps: 0, latency: 0 });
      return;
    }

    connect();

    // FPS counter: measure every second
    fpsIntervalRef.current = setInterval(() => {
      setState(prev => ({ ...prev, fps: frameCountRef.current }));
      frameCountRef.current = 0;
    }, 1000);

    return () => {
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      if (fpsIntervalRef.current) clearInterval(fpsIntervalRef.current);
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [enabled, connect]);

  const reconnect = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    connect();
  }, [connect]);

  return { ...state, reconnect };
}

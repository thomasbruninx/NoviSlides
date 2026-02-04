import { useEffect, useRef } from 'react';
import type { ActiveSlideshowChangedEvent } from '@/lib/types';

type UseActiveSlideshowEventsArgs = {
  onActiveChange: (event: ActiveSlideshowChangedEvent) => void;
  reconnectIntervalMs?: number;
  enabled?: boolean;
};

export function useActiveSlideshowEvents({
  onActiveChange,
  reconnectIntervalMs = 30000,
  enabled = true
}: UseActiveSlideshowEventsArgs) {
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!enabled) return;

    const url = '/api/events?scope=active';
    let eventSource: EventSource | null = null;

    const clearReconnect = () => {
      if (!reconnectTimerRef.current) return;
      clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    };

    const scheduleReconnect = () => {
      if (reconnectTimerRef.current) return;
      reconnectTimerRef.current = setTimeout(() => {
        reconnectTimerRef.current = null;
        connect();
      }, reconnectIntervalMs);
    };

    const closeEventSource = () => {
      eventSource?.close();
      eventSource = null;
    };

    const connect = () => {
      closeEventSource();
      eventSource = new EventSource(url);

      eventSource.onopen = () => {
        clearReconnect();
      };

      eventSource.addEventListener('activeSlideshowChanged', (raw) => {
        try {
          const payload = JSON.parse((raw as MessageEvent).data) as ActiveSlideshowChangedEvent;
          onActiveChange(payload);
        } catch {
          // Ignore malformed events.
        }
      });

      eventSource.onerror = () => {
        closeEventSource();
        scheduleReconnect();
      };
    };

    connect();

    return () => {
      clearReconnect();
      closeEventSource();
    };
  }, [enabled, onActiveChange, reconnectIntervalMs]);
}

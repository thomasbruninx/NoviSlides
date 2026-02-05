import { useEffect, useRef } from 'react';
import type { DisplayMountChangedEvent } from '@/lib/types';

type UseDisplayMountEventsArgs = {
  displayName: string;
  onMountChange: (event: DisplayMountChangedEvent) => void;
  reconnectIntervalMs?: number;
  enabled?: boolean;
};

export function useDisplayMountEvents({
  displayName,
  onMountChange,
  reconnectIntervalMs = 30000,
  enabled = true
}: UseDisplayMountEventsArgs) {
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!enabled) return;

    const url = `/api/events?scope=display&displayName=${encodeURIComponent(displayName)}`;
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

      eventSource.addEventListener('displayMountChanged', (raw) => {
        try {
          const payload = JSON.parse((raw as MessageEvent).data) as DisplayMountChangedEvent;
          onMountChange(payload);
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
  }, [displayName, enabled, onMountChange, reconnectIntervalMs]);
}

import { useEffect, useRef } from 'react';
import type { ApiResponse, DisplayDto, DisplayMountChangedEvent } from '@/lib/types';

type DisplayMountState = string | null | '__missing';

type UseDisplayMountEventsArgs = {
  displayName: string;
  onMountChange: (event: DisplayMountChangedEvent) => void;
  reconnectIntervalMs?: number;
  pollIntervalMs?: number;
  initialMountedSlideshowId?: string | null;
  enabled?: boolean;
};

export function useDisplayMountEvents({
  displayName,
  onMountChange,
  reconnectIntervalMs = 30000,
  pollIntervalMs = 60000,
  initialMountedSlideshowId = null,
  enabled = true
}: UseDisplayMountEventsArgs) {
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const mountStateRef = useRef<DisplayMountState>(initialMountedSlideshowId);

  useEffect(() => {
    if (!enabled) return;

    const url = `/api/events?scope=display&displayName=${encodeURIComponent(displayName)}`;
    let eventSource: EventSource | null = null;
    mountStateRef.current = initialMountedSlideshowId;

    const clearReconnect = () => {
      if (!reconnectTimerRef.current) return;
      clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    };

    const clearPolling = () => {
      if (!pollTimerRef.current) return;
      clearInterval(pollTimerRef.current);
      pollTimerRef.current = null;
    };

    const pollForMountChanges = async () => {
      try {
        const response = await fetch('/api/displays', { cache: 'no-store' });
        if (!response.ok) return;
        const payload = (await response.json()) as ApiResponse<DisplayDto[]>;
        if (!payload.ok) return;
        const display = payload.data.find((item) => item.name === displayName);
        const nextMountState: DisplayMountState = display
          ? (display.mountedSlideshowId ?? null)
          : '__missing';
        if (nextMountState === mountStateRef.current) return;
        mountStateRef.current = nextMountState;
        onMountChange({
          type: 'displayMountChanged',
          displayName,
          slideshowId: display?.mountedSlideshowId ?? null,
          at: new Date().toISOString()
        });
      } catch {
        // Ignore polling errors and keep retrying.
      }
    };

    const startPolling = () => {
      if (pollTimerRef.current) return;
      void pollForMountChanges();
      pollTimerRef.current = setInterval(() => {
        void pollForMountChanges();
      }, pollIntervalMs);
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
        clearPolling();
        void pollForMountChanges();
      };

      eventSource.addEventListener('displayMountChanged', (raw) => {
        try {
          const payload = JSON.parse((raw as MessageEvent).data) as DisplayMountChangedEvent;
          mountStateRef.current = payload.slideshowId ?? null;
          onMountChange(payload);
        } catch {
          // Ignore malformed events.
        }
      });

      eventSource.onerror = () => {
        closeEventSource();
        startPolling();
        scheduleReconnect();
      };
    };

    connect();

    return () => {
      clearReconnect();
      clearPolling();
      closeEventSource();
    };
  }, [
    displayName,
    enabled,
    initialMountedSlideshowId,
    onMountChange,
    pollIntervalMs,
    reconnectIntervalMs
  ]);
}

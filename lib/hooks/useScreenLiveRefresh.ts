import { useCallback, useEffect, useRef } from 'react';
import type { ScreenChangedEvent, ScreenDeckDto } from '@/lib/types';

type UseScreenLiveRefreshArgs = {
  slideshowId: string;
  screenKey: string;
  currentRevision: number;
  fetchLatestDeck: () => Promise<ScreenDeckDto>;
  onDeckUpdate: (deck: ScreenDeckDto) => void;
  pollIntervalMs?: number;
  sseErrorThreshold?: number;
  reconnectIntervalMs?: number;
};

export function useScreenLiveRefresh({
  slideshowId,
  screenKey,
  currentRevision,
  fetchLatestDeck,
  onDeckUpdate,
  pollIntervalMs = 15000,
  sseErrorThreshold = 3,
  reconnectIntervalMs = 30000
}: UseScreenLiveRefreshArgs) {
  const revisionRef = useRef(currentRevision);
  const pollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const errorCountRef = useRef(0);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    revisionRef.current = currentRevision;
  }, [currentRevision]);

  const applyDeckIfNewer = useCallback(
    async (expectedRevision?: number) => {
      try {
        const deck = await fetchLatestDeck();
        if (expectedRevision && deck.screen.revision < expectedRevision) {
          return;
        }
        if (deck.screen.revision <= revisionRef.current) {
          return;
        }
        onDeckUpdate(deck);
        revisionRef.current = deck.screen.revision;
      } catch {
        // Ignore fetch errors; polling/SSE will try again.
      }
    },
    [fetchLatestDeck, onDeckUpdate]
  );

  useEffect(() => {
    const startPolling = () => {
      if (pollTimerRef.current) return;
      void applyDeckIfNewer();
      pollTimerRef.current = setInterval(() => {
        void applyDeckIfNewer();
      }, pollIntervalMs);
    };

    const stopPolling = () => {
      if (!pollTimerRef.current) return;
      clearInterval(pollTimerRef.current);
      pollTimerRef.current = null;
    };

    const url = `/api/events?slideshowId=${encodeURIComponent(
      slideshowId
    )}&screenKey=${encodeURIComponent(screenKey)}`;
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
        errorCountRef.current = 0;
        stopPolling();
        clearReconnect();
        void applyDeckIfNewer();
      };

      eventSource.addEventListener('screenChanged', (raw) => {
        try {
          const payload = JSON.parse((raw as MessageEvent).data) as ScreenChangedEvent;
          if (payload.revision > revisionRef.current) {
            void applyDeckIfNewer(payload.revision);
          }
        } catch {
          // Ignore malformed events.
        }
      });

      eventSource.addEventListener('ping', () => {
        errorCountRef.current = 0;
      });

      eventSource.onerror = () => {
        errorCountRef.current += 1;
        if (errorCountRef.current >= sseErrorThreshold) {
          closeEventSource();
          startPolling();
          scheduleReconnect();
        }
      };
    };

    connect();

    return () => {
      stopPolling();
      clearReconnect();
      closeEventSource();
    };
  }, [
    applyDeckIfNewer,
    pollIntervalMs,
    reconnectIntervalMs,
    screenKey,
    slideshowId,
    sseErrorThreshold
  ]);
}

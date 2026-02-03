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
};

export function useScreenLiveRefresh({
  slideshowId,
  screenKey,
  currentRevision,
  fetchLatestDeck,
  onDeckUpdate,
  pollIntervalMs = 15000,
  sseErrorThreshold = 3
}: UseScreenLiveRefreshArgs) {
  const revisionRef = useRef(currentRevision);
  const pollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const errorCountRef = useRef(0);

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

    const connect = () => {
      eventSource = new EventSource(url);

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
          eventSource?.close();
          eventSource = null;
          startPolling();
        }
      };
    };

    connect();

    return () => {
      stopPolling();
      eventSource?.close();
      eventSource = null;
    };
  }, [applyDeckIfNewer, pollIntervalMs, screenKey, slideshowId, sseErrorThreshold]);
}

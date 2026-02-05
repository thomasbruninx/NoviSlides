'use client';

import { useCallback, useState } from 'react';
import type { ActiveSlideshowChangedEvent, ApiResponse, ScreenDeckDto } from '@/lib/types';
import { useScreenLiveRefresh } from '@/lib/hooks/useScreenLiveRefresh';
import { useActiveSlideshowEvents } from '@/lib/hooks/useActiveSlideshowEvents';
import RevealDeck from './RevealDeck';

export default function LiveRevealDeck({
  initialDeck,
  slideshowId,
  screenKey,
  watchActiveSlideshow = false
}: {
  initialDeck: ScreenDeckDto;
  slideshowId: string;
  screenKey: string;
  watchActiveSlideshow?: boolean;
}) {
  const [deck, setDeck] = useState<ScreenDeckDto>(initialDeck);
  const [revision, setRevision] = useState<number>(initialDeck.screen.revision);

  const fetchLatestDeck = useCallback(async () => {
    const response = await fetch(
      `/api/slideshows/${slideshowId}/deck`,
      { cache: 'no-store' }
    );
    if (!response.ok) {
      throw new Error('Failed to fetch deck');
    }
    const payload = (await response.json()) as ApiResponse<ScreenDeckDto>;
    if (!payload.ok) {
      throw new Error(payload.error.message);
    }
    return payload.data;
  }, [slideshowId]);

  const handleDeckUpdate = useCallback((nextDeck: ScreenDeckDto) => {
    setDeck(nextDeck);
    setRevision(nextDeck.screen.revision);
  }, []);

  const handleActiveChange = useCallback(
    (event: ActiveSlideshowChangedEvent) => {
      if (event.slideshowId !== slideshowId) {
        window.location.reload();
      }
    },
    [slideshowId]
  );

  useScreenLiveRefresh({
    slideshowId,
    screenKey,
    currentRevision: revision,
    fetchLatestDeck,
    onDeckUpdate: handleDeckUpdate
  });

  useActiveSlideshowEvents({
    enabled: watchActiveSlideshow,
    onActiveChange: handleActiveChange
  });

  return (
    <RevealDeck
      key={revision}
      slideshow={deck.slideshow}
      screen={deck.screen}
      slides={deck.slides}
    />
  );
}

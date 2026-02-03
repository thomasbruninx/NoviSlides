'use client';

import { useCallback, useState } from 'react';
import type { ApiResponse, ScreenDeckDto } from '@/lib/types';
import { useScreenLiveRefresh } from '@/lib/hooks/useScreenLiveRefresh';
import RevealDeck from './RevealDeck';

export default function LiveRevealDeck({
  initialDeck,
  slideshowId,
  screenKey
}: {
  initialDeck: ScreenDeckDto;
  slideshowId: string;
  screenKey: string;
}) {
  const [deck, setDeck] = useState<ScreenDeckDto>(initialDeck);
  const [revision, setRevision] = useState<number>(initialDeck.screen.revision);

  const fetchLatestDeck = useCallback(async () => {
    const response = await fetch(
      `/api/slideshows/${slideshowId}/screens/${screenKey}/deck`,
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
  }, [screenKey, slideshowId]);

  const handleDeckUpdate = useCallback((nextDeck: ScreenDeckDto) => {
    setDeck(nextDeck);
    setRevision(nextDeck.screen.revision);
  }, []);

  useScreenLiveRefresh({
    slideshowId,
    screenKey,
    currentRevision: revision,
    fetchLatestDeck,
    onDeckUpdate: handleDeckUpdate
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

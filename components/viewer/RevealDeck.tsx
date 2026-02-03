'use client';

import { useEffect, useMemo, useRef } from 'react';
import Reveal from 'reveal.js';
import { useViewportSize } from '@mantine/hooks';
import type { SlideDto, ScreenDto, SlideshowDto } from '@/lib/types';
import { computeScale } from '@/lib/utils/aspect';
import SlideSection from './SlideSection';

export default function RevealDeck({
  slideshow,
  screen,
  slides
}: {
  slideshow: SlideshowDto;
  screen: ScreenDto;
  slides: SlideDto[];
}) {
  const deckRef = useRef<HTMLDivElement | null>(null);
  const revealRef = useRef<InstanceType<typeof Reveal> | null>(null);
  const { width: viewportWidth, height: viewportHeight } = useViewportSize();

  const layout = useMemo(() => {
    return computeScale(screen.width, screen.height, viewportWidth, viewportHeight);
  }, [screen.width, screen.height, viewportWidth, viewportHeight]);

  useEffect(() => {
    if (!deckRef.current) return;

    if (!revealRef.current) {
      const deck = new Reveal(deckRef.current, {
        embedded: true,
        width: screen.width,
        height: screen.height,
        autoSlide: slideshow.defaultAutoSlideMs,
        transition: slideshow.revealTransition,
        loop: slideshow.loop,
        controls: slideshow.controls,
        progress: false,
        slideNumber: false,
        keyboard: true,
        touch: true
      });
      deck.initialize();
      revealRef.current = deck;
    } else {
      revealRef.current.configure({
        autoSlide: slideshow.defaultAutoSlideMs,
        transition: slideshow.revealTransition,
        loop: slideshow.loop,
        controls: slideshow.controls
      });
      revealRef.current.sync();
      revealRef.current.layout();
    }
  }, [slides.length, screen.width, screen.height, slideshow.controls, slideshow.defaultAutoSlideMs, slideshow.loop, slideshow.revealTransition]);

  useEffect(() => {
    revealRef.current?.layout();
  }, [layout.scale, layout.width, layout.height]);

  return (
    <div className="viewer-root">
      <div
        className="viewer-frame"
        style={{
          width: screen.width,
          height: screen.height,
          transform: `translate(${layout.offsetX}px, ${layout.offsetY}px) scale(${layout.scale})`,
          transformOrigin: 'top left'
        }}
      >
        <div ref={deckRef} className="reveal">
          <div className="slides">
            {slides.map((slide) => (
              <SlideSection key={slide.id} slide={slide} elements={slide.elements ?? []} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

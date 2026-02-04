'use client';

import { useEffect, useMemo, useRef } from 'react';
import Reveal from 'reveal.js';
import type { SlideDto, ScreenDto, SlideshowDto } from '@/lib/types';
import { useGoogleFonts } from '@/lib/hooks/useGoogleFonts';
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
  const isReadyRef = useRef(false);

  const labelFonts = useMemo(
    () =>
      slides
        .flatMap((slide) => slide.elements ?? [])
        .filter((element) => element.type === 'label')
        .map((element) => (element.dataJson as Record<string, unknown>).fontFamily as string)
        .filter((font): font is string => Boolean(font)),
    [slides]
  );

  useGoogleFonts(labelFonts);
  const latestConfigRef = useRef({
    width: screen.width,
    height: screen.height,
    autoSlide: slideshow.defaultAutoSlideMs,
    transition: slideshow.revealTransition,
    loop: slideshow.loop,
    controls: slideshow.controls,
    autoSlideStoppable: slideshow.autoSlideStoppable
  });
  useEffect(() => {
    latestConfigRef.current = {
      width: screen.width,
      height: screen.height,
      autoSlide: slideshow.defaultAutoSlideMs,
      transition: slideshow.revealTransition,
      loop: slideshow.loop,
      controls: slideshow.controls,
      autoSlideStoppable: slideshow.autoSlideStoppable
    };
  }, [
    screen.width,
    screen.height,
    slideshow.controls,
    slideshow.defaultAutoSlideMs,
    slideshow.loop,
    slideshow.revealTransition,
    slideshow.autoSlideStoppable
  ]);

  useEffect(() => {
    if (!deckRef.current) return;

    if (!revealRef.current) {
      const initialConfig = latestConfigRef.current;
      const deck = new Reveal(deckRef.current, {
        embedded: true,
        width: initialConfig.width,
        height: initialConfig.height,
        autoSlide: initialConfig.autoSlide,
        transition: initialConfig.transition,
        loop: initialConfig.loop,
        controls: initialConfig.controls,
        autoSlideStoppable: initialConfig.autoSlideStoppable,
        progress: false,
        slideNumber: false,
        keyboard: true,
        touch: true
      });
      revealRef.current = deck;
      deck
        .initialize()
        .then(() => {
          isReadyRef.current = true;
          const config = latestConfigRef.current;
          deck.configure({
            width: config.width,
            height: config.height,
            autoSlide: config.autoSlide,
            transition: config.transition,
            loop: config.loop,
            controls: config.controls,
            autoSlideStoppable: config.autoSlideStoppable
          });
          deck.sync();
          deck.layout();
        })
        .catch(() => {
          // Ignore initialization errors to avoid crashing the viewer.
        });
    } else if (isReadyRef.current) {
      const config = latestConfigRef.current;
      revealRef.current.configure({
        width: config.width,
        height: config.height,
        autoSlide: config.autoSlide,
        transition: config.transition,
        loop: config.loop,
        controls: config.controls,
        autoSlideStoppable: config.autoSlideStoppable
      });
      revealRef.current.sync();
      revealRef.current.layout();
    }
  }, [
    slides.length,
    screen.width,
    screen.height,
    slideshow.controls,
    slideshow.defaultAutoSlideMs,
    slideshow.loop,
    slideshow.revealTransition,
    slideshow.autoSlideStoppable
  ]);

  useEffect(() => {
    if (!revealRef.current) return;

    const deck = revealRef.current;

    const restartVideosInSlide = (slide: HTMLElement | null) => {
      if (!slide) return;
      const videos = Array.from(slide.querySelectorAll('video'));
      videos.forEach((video) => {
        try {
          video.currentTime = 0;
        } catch {
          // Ignore seek errors for streams or blocked playback.
        }

        const shouldAutoplay = video.autoplay || video.hasAttribute('autoplay');
        if (shouldAutoplay) {
          const maybePromise = video.play();
          if (maybePromise && typeof maybePromise.catch === 'function') {
            maybePromise.catch(() => {
              // Autoplay might be blocked; ignore silently.
            });
          }
        } else {
          video.pause();
        }
      });
    };

    const resetVideosOutsideSlide = (slide: HTMLElement | null) => {
      const root = deckRef.current?.querySelector('.slides');
      if (!root) return;
      const allVideos = Array.from(root.querySelectorAll('video'));
      allVideos.forEach((video) => {
        if (slide && slide.contains(video)) return;
        video.pause();
        try {
          video.currentTime = 0;
        } catch {
          // Ignore seek errors for streams or blocked playback.
        }
      });
    };

    const handleSlideChange = (event: { currentSlide?: HTMLElement | null }) => {
      const currentSlide = event.currentSlide ?? deck.getCurrentSlide();
      resetVideosOutsideSlide(currentSlide ?? null);
      restartVideosInSlide(currentSlide ?? null);
    };

    const handleReady = (event: { currentSlide?: HTMLElement | null }) => {
      const currentSlide = event.currentSlide ?? deck.getCurrentSlide();
      restartVideosInSlide(currentSlide ?? null);
    };

    deck.on('slidechanged', handleSlideChange);
    deck.on('ready', handleReady);

    const initialSlide = deck.getCurrentSlide();
    restartVideosInSlide(initialSlide ?? null);

    return () => {
      deck.off('slidechanged', handleSlideChange);
      deck.off('ready', handleReady);
    };
  }, [slides.length]);

  useEffect(() => {
    return () => {
      try {
        revealRef.current?.destroy();
      } catch {
        // Ignore teardown errors.
      } finally {
        revealRef.current = null;
      }
    };
  }, []);

  return (
    <div 
      className="viewer-root" 
      style={{
        width: screen.width,
        height: screen.height
      }}>
      <div
        className="viewer-frame"
        style={{
          width: screen.width,
          height: screen.height
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

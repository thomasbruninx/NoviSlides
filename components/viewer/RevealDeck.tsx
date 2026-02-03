'use client';

import { useEffect, useRef } from 'react';
import Reveal from 'reveal.js';
import type { SlideDto, ScreenDto, SlideshowDto } from '@/lib/types';
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
  const latestConfigRef = useRef({
    width: screen.width,
    height: screen.height,
    autoSlide: slideshow.defaultAutoSlideMs,
    transition: slideshow.revealTransition,
    loop: slideshow.loop,
    controls: slideshow.controls
  });
  useEffect(() => {
    latestConfigRef.current = {
      width: screen.width,
      height: screen.height,
      autoSlide: slideshow.defaultAutoSlideMs,
      transition: slideshow.revealTransition,
      loop: slideshow.loop,
      controls: slideshow.controls
    };
  }, [screen.width, screen.height, slideshow.controls, slideshow.defaultAutoSlideMs, slideshow.loop, slideshow.revealTransition]);

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
            controls: config.controls
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
        controls: config.controls
      });
      revealRef.current.sync();
      revealRef.current.layout();
    }
  }, [slides.length, screen.width, screen.height, slideshow.controls, slideshow.defaultAutoSlideMs, slideshow.loop, slideshow.revealTransition]);

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

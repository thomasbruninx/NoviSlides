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
  const loopResetSlideRef = useRef<HTMLElement | null>(null);

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

    const getSlideSections = () => {
      const root = deckRef.current?.querySelector('.slides');
      if (!root) return [];
      return Array.from(root.children).filter(
        (node): node is HTMLElement =>
          node instanceof HTMLElement && node.tagName.toLowerCase() === 'section'
      );
    };

    const getSlideIndex = (slide: HTMLElement | null) => {
      if (!slide) return null;
      const sections = getSlideSections();
      const direct = sections.indexOf(slide);
      if (direct !== -1) {
        return { index: direct, total: sections.length };
      }
      const parent = slide.closest('.slides > section');
      if (!parent || !(parent instanceof HTMLElement)) return null;
      const index = sections.indexOf(parent);
      if (index === -1) return null;
      return { index, total: sections.length };
    };

    const setFragmentResetting = (enabled: boolean) => {
      const root = deckRef.current;
      if (!root) return;
      if (enabled) {
        root.classList.add('fragment-resetting');
      } else {
        root.classList.remove('fragment-resetting');
      }
    };

    const resetFragmentsForLoop = (slide: HTMLElement | null) => {
      if (!slide) return;
      const fragments = Array.from(
        slide.querySelectorAll<HTMLElement>('.fragment.visible, .fragment.current-fragment')
      );
      if (fragments.length === 0) return;
      fragments.forEach((fragment) => {
        fragment.classList.add('fragment-no-transition');
        fragment.classList.remove('visible', 'current-fragment');
      });
    };

    const handleBeforeSlideChange = (event: { data?: { indexh?: number } } & { indexh?: number }) => {
      if (!slideshow.loop) return;
      const currentInfo = getSlideIndex(deck.getCurrentSlide());
      const nextIndex =
        typeof event.data?.indexh === 'number'
          ? event.data.indexh
          : typeof event.indexh === 'number'
            ? event.indexh
            : null;
      if (!currentInfo || nextIndex === null) return;
      if (currentInfo.index === currentInfo.total - 1 && nextIndex === 0) {
        const nextSlide = getSlideSections()[0] ?? null;
        if (nextSlide) {
          setFragmentResetting(true);
          resetFragmentsForLoop(nextSlide);
          loopResetSlideRef.current = nextSlide;
        }
      }
    };

    const handleSlideChange = (event: {
      currentSlide?: HTMLElement | null;
      previousSlide?: HTMLElement | null;
      data?: {
        currentSlide?: HTMLElement | null;
        previousSlide?: HTMLElement | null;
      };
    }) => {
      const currentSlide = event.data?.currentSlide ?? event.currentSlide ?? deck.getCurrentSlide();
      resetVideosOutsideSlide(currentSlide ?? null);
      restartVideosInSlide(currentSlide ?? null);

      if (slideshow.loop) {
        const currentInfo = getSlideIndex(currentSlide ?? null);
        const prevSlide = event.data?.previousSlide ?? event.previousSlide ?? null;
        const prevInfo = getSlideIndex(prevSlide);
        if (
          currentInfo &&
          prevInfo &&
          currentInfo.index === 0 &&
          prevInfo.index === prevInfo.total - 1
        ) {
          if (!loopResetSlideRef.current) {
            if (currentSlide) {
              setFragmentResetting(true);
              resetFragmentsForLoop(currentSlide);
              loopResetSlideRef.current = currentSlide;
            }
          }
        }
      }

      if (loopResetSlideRef.current) {
        loopResetSlideRef.current = null;
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            setFragmentResetting(false);
          });
        });
      }
    };

    const handleReady = (event: { currentSlide?: HTMLElement | null }) => {
      const currentSlide = event.currentSlide ?? deck.getCurrentSlide();
      restartVideosInSlide(currentSlide ?? null);
    };

    deck.on('beforeslidechange', handleBeforeSlideChange);
    deck.on('slidechanged', handleSlideChange);
    deck.on('ready', handleReady);

    const initialSlide = deck.getCurrentSlide();
    restartVideosInSlide(initialSlide ?? null);

    return () => {
      deck.off('beforeslidechange', handleBeforeSlideChange);
      deck.off('slidechanged', handleSlideChange);
      deck.off('ready', handleReady);
    };
  }, [slides.length, slideshow.loop]);

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

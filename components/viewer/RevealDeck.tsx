'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Reveal from 'reveal.js';
import type { SlideDto, ScreenDto, SlideshowDto } from '@/lib/types';
import { useGoogleFonts } from '@/lib/hooks/useGoogleFonts';
import SlideSection from './SlideSection';
import { buildFontSpec, isSystemFont, normalizeFont } from '@/lib/utils/fonts';
import { resolveMediaPath } from '@/lib/utils/media';
import { getIconUrl } from '@/lib/utils/icons';

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
  const [isLoading, setIsLoading] = useState(true);
  const [loadProgress, setLoadProgress] = useState({ loaded: 0, total: 0 });
  const [isRevealReady, setIsRevealReady] = useState(false);
  const hasLoadedOnceRef = useRef(false);

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

  useEffect(() => {
    if (hasLoadedOnceRef.current) return;
    if (!slides.length) return;
    let cancelled = false;

    const loadImage = (url: string) =>
      new Promise<void>((resolve) => {
        if (!url) return resolve();
        const img = new Image();
        img.onload = () => resolve();
        img.onerror = () => resolve();
        img.src = url;
      });

    const loadVideo = (url: string) =>
      new Promise<void>((resolve) => {
        if (!url) return resolve();
        const video = document.createElement('video');
        const cleanup = () => {
          video.removeEventListener('loadedmetadata', done);
          video.removeEventListener('error', done);
          video.src = '';
        };
        const done = () => {
          cleanup();
          resolve();
        };
        video.preload = 'metadata';
        video.addEventListener('loadedmetadata', done);
        video.addEventListener('error', done);
        video.src = url;
      });

    const preload = async () => {
      setIsLoading(true);
      setLoadProgress({ loaded: 0, total: 0 });
      const imageUrls = new Set<string>();
      const videoUrls = new Set<string>();
      const fontSpecs = new Set<string>();

      slides.forEach((slide) => {
        const background = slide.backgroundImagePath
          ? resolveMediaPath(slide.backgroundImagePath)
          : '';
        if (background) {
          imageUrls.add(background);
        }
        (slide.elements ?? []).forEach((element) => {
          const data = element.dataJson as Record<string, unknown>;
          if (element.type === 'image') {
            const path = resolveMediaPath((data.path as string | undefined) ?? '');
            if (path) imageUrls.add(path);
          }
          if (element.type === 'video') {
            const path = resolveMediaPath((data.path as string | undefined) ?? '');
            if (path) videoUrls.add(path);
          }
          if (element.type === 'symbol') {
            const iconName = (data.iconName as string | undefined) ?? '';
            if (iconName) {
              const style = (data.iconStyle as string | undefined) ?? 'filled';
              const color = (data.color as string | undefined) ?? '#ffffff';
              imageUrls.add(
                getIconUrl(style as 'filled' | 'outlined' | 'round' | 'sharp' | 'two-tone', iconName, color)
              );
            }
          }
          if (element.type === 'label') {
            const family = (data.fontFamily as string | undefined) ?? '';
            const primary = normalizeFont(family);
            if (primary && !isSystemFont(primary)) {
              const spec = buildFontSpec(primary, 16, 400, false);
              if (spec) fontSpecs.add(spec);
            }
          }
        });
      });

      const imageList = Array.from(imageUrls);
      const videoList = Array.from(videoUrls);
      const fontList = Array.from(fontSpecs);
      const total = imageList.length + videoList.length + fontList.length;
      setLoadProgress({ loaded: 0, total });

      const bumpLoaded = () => {
        setLoadProgress((current) => ({
          loaded: Math.min(current.loaded + 1, current.total),
          total: current.total
        }));
      };

      const imagePromises = imageList.map((url) =>
        loadImage(url).finally(() => bumpLoaded())
      );
      const videoPromises = videoList.map((url) =>
        loadVideo(url).finally(() => bumpLoaded())
      );
      const fontPromises = document.fonts?.load
        ? fontList.map((spec) =>
            document.fonts.load(spec).catch(() => []).finally(() => bumpLoaded())
          )
        : [];

      await Promise.allSettled([...imagePromises, ...videoPromises, ...fontPromises]);
      if (cancelled) return;
      await new Promise((resolve) => setTimeout(resolve, 2000));
      if (cancelled) return;
      hasLoadedOnceRef.current = true;
      setIsLoading(false);
    };

    void preload();

    return () => {
      cancelled = true;
    };
  }, [slides]);
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
    if (isLoading) return;
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
          setIsRevealReady(true);
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
    slideshow.autoSlideStoppable,
    isLoading
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

  const showLoading = isLoading || !isRevealReady;
  const progressRatio =
    loadProgress.total > 0 ? Math.min(1, loadProgress.loaded / loadProgress.total) : 0;

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
        {showLoading ? (
          <div className="viewer-loading">
            <div className="viewer-loading-card">
              <div className="viewer-loading-title">Loading slideshow…</div>
              <div className="viewer-loading-sub">
                Preparing media and fonts
                {loadProgress.total > 0
                  ? ` • ${Math.min(loadProgress.loaded, loadProgress.total)}/${loadProgress.total}`
                  : ''}
              </div>
              <div className="viewer-loading-bar">
                <div
                  className="viewer-loading-bar-fill"
                  style={{ width: `${progressRatio * 100}%` }}
                />
              </div>
            </div>
          </div>
        ) : null}
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

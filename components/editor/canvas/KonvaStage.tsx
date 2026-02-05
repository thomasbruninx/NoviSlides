'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Stage, Layer, Rect, Image as KonvaImage, Line } from 'react-konva';
import { useElementSize } from '@mantine/hooks';
import useImage from 'use-image';
import type Konva from 'konva';
import type { ScreenDto, SlideDto, SlideElementDto } from '@/lib/types';
import { useGoogleFonts } from '@/lib/hooks/useGoogleFonts';
import { buildFontSpec, isSystemFont } from '@/lib/utils/fonts';
import ElementRenderer from './ElementRenderer';
import Transformers from './Transformers';

export default function KonvaStage({
  screen,
  slide,
  selectedElementId,
  onSelectElement,
  onElementCommit,
  showGrid = false,
  gridSize = 25,
  showGuides = true,
  magneticGuides = true
}: {
  screen: ScreenDto;
  slide: SlideDto | null;
  selectedElementId: string | null;
  onSelectElement: (id: string | null) => void;
  onElementCommit: (
    id: string,
    attrs: Partial<SlideElementDto>,
    options?: { skipGridSnap?: boolean }
  ) => void;
  showGrid?: boolean;
  gridSize?: number;
  showGuides?: boolean;
  magneticGuides?: boolean;
}) {
  const { ref, width: containerWidth, height: containerHeight } = useElementSize();
  const elementRefs = useRef<Record<string, Konva.Node>>({});
  const transformerRef = useRef<Konva.Transformer>(null);
  const [guides, setGuides] = useState<Array<{ orientation: 'vertical' | 'horizontal'; position: number }>>([]);
  const GUIDE_VISIBLE_DISTANCE = 50;
  const GUIDE_SNAP_DISTANCE = 15;

  const [backgroundImage] = useImage(slide?.backgroundImagePath ?? '');

  const backgroundLayout = useMemo(() => {
    if (!backgroundImage || !slide?.backgroundImagePath) return null;
    const imageWidth =
      (backgroundImage as HTMLImageElement).naturalWidth || backgroundImage.width || screen.width;
    const imageHeight =
      (backgroundImage as HTMLImageElement).naturalHeight || backgroundImage.height || screen.height;
    const size = slide.backgroundImageSize ?? 'cover';
    const position = slide.backgroundImagePosition ?? 'center';

    let targetWidth = imageWidth;
    let targetHeight = imageHeight;

    if (size === 'cover' || size === 'contain') {
      const scale =
        size === 'cover'
          ? Math.max(screen.width / imageWidth, screen.height / imageHeight)
          : Math.min(screen.width / imageWidth, screen.height / imageHeight);
      targetWidth = imageWidth * scale;
      targetHeight = imageHeight * scale;
    }

    const [vertical, horizontal] = position.split('-') as [string | undefined, string | undefined];
    const alignX = horizontal === 'left' ? 'left' : horizontal === 'right' ? 'right' : 'center';
    const alignY = vertical === 'top' ? 'top' : vertical === 'bottom' ? 'bottom' : 'center';

    const x =
      alignX === 'left'
        ? 0
        : alignX === 'right'
          ? screen.width - targetWidth
          : (screen.width - targetWidth) / 2;
    const y =
      alignY === 'top'
        ? 0
        : alignY === 'bottom'
          ? screen.height - targetHeight
          : (screen.height - targetHeight) / 2;

    return { x, y, width: targetWidth, height: targetHeight };
  }, [
    backgroundImage,
    screen.height,
    screen.width,
    slide?.backgroundImagePath,
    slide?.backgroundImagePosition,
    slide?.backgroundImageSize
  ]);

  const lastScaleRef = useRef(1);
  const scale = useMemo(() => {
    if (!containerWidth || !containerHeight) {
      return lastScaleRef.current;
    }
    const nextScale = Math.min(containerWidth / screen.width, containerHeight / screen.height);
    lastScaleRef.current = nextScale;
    return nextScale;
  }, [containerWidth, containerHeight, screen.width, screen.height]);

  const selectedNode = selectedElementId ? elementRefs.current[selectedElementId] : null;

  const handleStagePointerDown = (event: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => {
    event.evt.preventDefault();
    if (event.target === event.target.getStage()) {
      onSelectElement(null);
    }
  };

  const stageWidth = screen.width * scale;
  const stageHeight = screen.height * scale;

  const clearGuides = useCallback(() => {
    setGuides([]);
  }, []);

  useEffect(() => {
    if (!showGuides) {
      setGuides([]);
    }
  }, [showGuides]);

  const handleElementDragStart = useCallback(() => {
    clearGuides();
  }, [clearGuides]);

  const handleElementDragEnd = useCallback(() => {
    clearGuides();
  }, [clearGuides]);

  const handleElementDragMove = useCallback(
    (payload: { id: string; node: Konva.Node; width: number; height: number }) => {
      if (!slide) return;

      const { node, width, height, id } = payload;
      const x = node.x();
      const y = node.y();
      const centerX = x + width / 2;
      const centerY = y + height / 2;
      const slideCenterX = screen.width / 2;
      const slideCenterY = screen.height / 2;

      const nextGuides: Array<{ orientation: 'vertical' | 'horizontal'; position: number }> = [];
      let snappedX = x;
      let snappedY = y;

      const slideCenterDeltaX = Math.abs(centerX - slideCenterX);
      const slideCenterDeltaY = Math.abs(centerY - slideCenterY);
      const useSlideCenterX = slideCenterDeltaX <= GUIDE_VISIBLE_DISTANCE;
      const useSlideCenterY = slideCenterDeltaY <= GUIDE_VISIBLE_DISTANCE;

      if (useSlideCenterX && showGuides) {
        nextGuides.push({ orientation: 'vertical', position: slideCenterX });
      }
      if (useSlideCenterY && showGuides) {
        nextGuides.push({ orientation: 'horizontal', position: slideCenterY });
      }

      if (magneticGuides) {
        if (slideCenterDeltaX <= GUIDE_SNAP_DISTANCE) {
          snappedX = x + (slideCenterX - centerX);
        }
        if (slideCenterDeltaY <= GUIDE_SNAP_DISTANCE) {
          snappedY = y + (slideCenterY - centerY);
        }
      }

      if (!useSlideCenterX || !useSlideCenterY) {
        const otherElements = (slide.elements ?? []).filter((element) => element.id !== id);
        if (!useSlideCenterX) {
          let closestX = Number.POSITIVE_INFINITY;
          let closestXCenter: number | null = null;
          otherElements.forEach((element) => {
            const candidate = element.x + element.width / 2;
            const distance = Math.abs(centerX - candidate);
            if (distance < closestX) {
              closestX = distance;
              closestXCenter = candidate;
            }
          });
          if (closestXCenter !== null && closestX <= GUIDE_VISIBLE_DISTANCE) {
            if (showGuides) {
              nextGuides.push({ orientation: 'vertical', position: closestXCenter });
            }
            if (magneticGuides && closestX <= GUIDE_SNAP_DISTANCE) {
              snappedX = x + (closestXCenter - centerX);
            }
          }
        }

        if (!useSlideCenterY) {
          let closestY = Number.POSITIVE_INFINITY;
          let closestYCenter: number | null = null;
          otherElements.forEach((element) => {
            const candidate = element.y + element.height / 2;
            const distance = Math.abs(centerY - candidate);
            if (distance < closestY) {
              closestY = distance;
              closestYCenter = candidate;
            }
          });
          if (closestYCenter !== null && closestY <= GUIDE_VISIBLE_DISTANCE) {
            if (showGuides) {
              nextGuides.push({ orientation: 'horizontal', position: closestYCenter });
            }
            if (magneticGuides && closestY <= GUIDE_SNAP_DISTANCE) {
              snappedY = y + (closestYCenter - centerY);
            }
          }
        }
      }

      if (magneticGuides && (snappedX !== x || snappedY !== y)) {
        node.position({ x: snappedX, y: snappedY });
        node.setAttr('skipGridSnap', true);
      } else {
        node.setAttr('skipGridSnap', false);
      }

      if (showGuides) {
        setGuides(nextGuides);
      } else {
        setGuides([]);
      }
    },
    [magneticGuides, screen.height, screen.width, showGuides, slide]
  );

  const labelFonts = useMemo(
    () =>
      (slide?.elements ?? [])
        .filter((element) => element.type === 'label')
        .map((element) => (element.dataJson as Record<string, unknown>).fontFamily as string)
        .filter((font): font is string => Boolean(font)),
    [slide]
  );

  useGoogleFonts(labelFonts);

  const labelFontSpecs = useMemo(() => {
    const specs = new Set<string>();
    (slide?.elements ?? []).forEach((element) => {
      if (element.type !== 'label') return;
      const data = element.dataJson as Record<string, unknown>;
      const fontFamily = (data.fontFamily as string) ?? 'sans-serif';
      if (isSystemFont(fontFamily)) return;
      const fontSize = (data.fontSize as number) ?? 32;
      const isBold = (data.bold as boolean | undefined) ?? false;
      const isItalic = (data.italic as boolean | undefined) ?? false;
      const spec = buildFontSpec(fontFamily, fontSize, isBold ? 700 : 400, isItalic);
      if (spec) {
        specs.add(spec);
      }
    });
    return Array.from(specs);
  }, [slide]);

  const refreshLabelMetrics = useCallback(() => {
    Object.values(elementRefs.current).forEach((node) => {
      if (!node || (typeof node.isDestroyed === 'function' && node.isDestroyed())) return;
      if (node.getClassName() !== 'Text') return;
      const textNode = node as Konva.Text;
      if (typeof textNode.clearCache === 'function') {
        textNode.clearCache();
      }
      textNode.fontFamily(textNode.fontFamily());
      textNode.fontSize(textNode.fontSize());
      textNode.fontStyle(textNode.fontStyle());
      textNode.textDecoration(textNode.textDecoration());
      textNode.align(textNode.align());
      textNode.lineHeight(textNode.lineHeight());
      textNode.padding(textNode.padding());
      textNode.width(textNode.width());
      textNode.height(textNode.height());
      textNode.text(textNode.text());
      const internal = textNode as Konva.Text & { _setTextData?: () => void };
      if (typeof internal._setTextData === 'function') {
        internal._setTextData();
      }
      textNode.getLayer()?.batchDraw();
    });
  }, []);

  const ensureFontsAndRefresh = useCallback(() => {
    if (!labelFontSpecs.length || !document.fonts?.load) {
      refreshLabelMetrics();
      return;
    }
    Promise.all(
      labelFontSpecs.map((spec) =>
        document.fonts.load(spec).catch(() => {
          return [];
        })
      )
    ).then(() => {
      refreshLabelMetrics();
    });
  }, [labelFontSpecs, refreshLabelMetrics]);

  useEffect(() => {
    if (!('fonts' in document) || !document.fonts?.addEventListener) return;
    const handler = () => {
      refreshLabelMetrics();
    };
    document.fonts.addEventListener('loadingdone', handler);
    document.fonts.addEventListener('loadingerror', handler);
    return () => {
      document.fonts.removeEventListener('loadingdone', handler);
      document.fonts.removeEventListener('loadingerror', handler);
    };
  }, [refreshLabelMetrics]);

  useEffect(() => {
    if (!labelFonts.length) return;
    requestAnimationFrame(() => {
      refreshLabelMetrics();
    });
    const timer = setTimeout(() => {
      refreshLabelMetrics();
    }, 200);
    return () => clearTimeout(timer);
  }, [labelFonts, refreshLabelMetrics, slide?.id]);

  useEffect(() => {
    if (!labelFontSpecs.length || !document.fonts?.check) {
      refreshLabelMetrics();
      return;
    }
    let cancelled = false;
    const maxAttempts = 20;
    const interval = 150;
    const checkLoop = (attempt: number) => {
      if (cancelled) return;
      const ready = labelFontSpecs.every((spec) => document.fonts.check(spec));
      if (ready || attempt >= maxAttempts) {
        ensureFontsAndRefresh();
        return;
      }
      setTimeout(() => checkLoop(attempt + 1), interval);
    };
    checkLoop(0);
    return () => {
      cancelled = true;
    };
  }, [ensureFontsAndRefresh, labelFontSpecs, refreshLabelMetrics, slide?.id]);

  useEffect(() => {
    const handler = () => {
      ensureFontsAndRefresh();
    };
    window.addEventListener('novi-google-fonts-loaded', handler as EventListener);
    return () => {
      window.removeEventListener('novi-google-fonts-loaded', handler as EventListener);
    };
  }, [ensureFontsAndRefresh]);

  useEffect(() => {
    if (!document.fonts?.ready) return;
    let cancelled = false;
    document.fonts.ready
      .then(() => {
        if (!cancelled) {
          ensureFontsAndRefresh();
        }
      })
      .catch(() => {
        if (!cancelled) {
          refreshLabelMetrics();
        }
      });
    return () => {
      cancelled = true;
    };
  }, [ensureFontsAndRefresh, refreshLabelMetrics, slide?.id]);

  return (
    <div
      ref={ref}
      className="editor-canvas"
      style={{
        width: '100%',
        height: '100%',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      <div
        style={{
          position: 'absolute',
          left: '50%',
          top: '50%',
          width: stageWidth,
          height: stageHeight,
          transform: 'translate(-50%, -50%)'
        }}
      >
        <Stage
          width={stageWidth}
          height={stageHeight}
          scaleX={scale}
          scaleY={scale}
          onMouseDown={handleStagePointerDown}
          onTouchStart={handleStagePointerDown}
          tabIndex={-1}
          style={{ outline: 'none' }}
        >
          <Layer listening={false}>
            <Rect width={screen.width} height={screen.height} fill={slide?.backgroundColor ?? '#0b0f18'} />
            {backgroundImage && backgroundLayout ? (
              <KonvaImage
                image={backgroundImage}
                x={backgroundLayout.x}
                y={backgroundLayout.y}
                width={backgroundLayout.width}
                height={backgroundLayout.height}
              />
            ) : null}
          </Layer>
          {showGrid ? (
            <Layer listening={false}>
              {Array.from({ length: Math.floor(screen.width / gridSize) - 1 }, (_, index) => {
                const x = (index + 1) * gridSize;
                return (
                  <Line
                    key={`v-${x}`}
                    points={[x, 0, x, screen.height]}
                    stroke="rgba(255,255,255,0.08)"
                    strokeWidth={1}
                  />
                );
              })}
              {Array.from({ length: Math.floor(screen.height / gridSize) - 1 }, (_, index) => {
                const y = (index + 1) * gridSize;
                return (
                  <Line
                    key={`h-${y}`}
                    points={[0, y, screen.width, y]}
                    stroke="rgba(255,255,255,0.08)"
                    strokeWidth={1}
                  />
                );
              })}
            </Layer>
          ) : null}
          <Layer>
            {(slide?.elements ?? [])
              .slice()
              .sort((a, b) => a.zIndex - b.zIndex)
              .map((element) => (
                <ElementRenderer
                  key={element.id}
                  element={element}
                  isSelected={selectedElementId === element.id}
                  registerRef={(node) => {
                    if (node) {
                      elementRefs.current[element.id] = node;
                      if (node.getClassName() === 'Text') {
                        requestAnimationFrame(() => {
                          ensureFontsAndRefresh();
                        });
                      }
                    }
                  }}
                  onSelect={() => onSelectElement(element.id)}
                  onCommit={(attrs, options) => onElementCommit(element.id, attrs, options)}
                  onDragStart={handleElementDragStart}
                  onDragMove={handleElementDragMove}
                  onDragEnd={handleElementDragEnd}
                />
              ))}
            <Transformers transformerRef={transformerRef} selectedNode={selectedNode ?? null} />
          </Layer>
          {showGuides && guides.length ? (
            <Layer listening={false}>
              {guides.map((guide, index) => (
                <Line
                  key={`${guide.orientation}-${guide.position}-${index}`}
                  points={
                    guide.orientation === 'vertical'
                      ? [guide.position, 0, guide.position, screen.height]
                      : [0, guide.position, screen.width, guide.position]
                  }
                  stroke="rgba(84,179,255,0.9)"
                  strokeWidth={1}
                  dash={[4, 4]}
                />
              ))}
            </Layer>
          ) : null}
        </Stage>
      </div>
    </div>
  );
}

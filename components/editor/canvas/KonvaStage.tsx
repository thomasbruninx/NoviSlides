'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Stage, Layer, Rect, Image as KonvaImage, Line } from 'react-konva';
import { useElementSize } from '@mantine/hooks';
import useImage from 'use-image';
import type Konva from 'konva';
import type { ScreenDto, SlideDto, SlideElementDto } from '@/lib/types';
import { useGoogleFonts } from '@/lib/hooks/useGoogleFonts';
import { buildFontSpec, isSystemFont } from '@/lib/utils/fonts';
import { parseColorToRgb, relativeLuminance } from '@/lib/helpers/color';
import ElementRenderer from './ElementRenderer';
import Transformers from './Transformers';

export default function KonvaStage({
  screen,
  slide,
  selectedElementIds,
  onSelectElement,
  onElementCommit,
  onElementsCommit,
  zoom = 1,
  onZoomChange,
  panMode = false,
  showGrid = false,
  gridSize = 25,
  showGuides = true,
  magneticGuides = true
}: {
  screen: ScreenDto;
  slide: SlideDto | null;
  selectedElementIds: string[];
  onSelectElement: (id: string | null, options?: { append?: boolean }) => void;
  onElementCommit: (
    id: string,
    attrs: Partial<SlideElementDto>,
    options?: { skipGridSnap?: boolean }
  ) => void;
  onElementsCommit?: (
    updates: Array<{ id: string; attrs: Partial<SlideElementDto> }>,
    options?: { skipGridSnap?: boolean }
  ) => void;
  zoom?: number;
  onZoomChange?: (value: number) => void;
  panMode?: boolean;
  showGrid?: boolean;
  gridSize?: number;
  showGuides?: boolean;
  magneticGuides?: boolean;
}) {
  const STAGE_PADDING = 80;
  const { ref, width: containerWidth, height: containerHeight } = useElementSize();
  const stageRef = useRef<Konva.Stage>(null);
  const elementRefs = useRef<Record<string, Konva.Node>>({});
  const transformerRef = useRef<Konva.Transformer>(null);
  const [guides, setGuides] = useState<Array<{ orientation: 'vertical' | 'horizontal'; position: number }>>([]);
  const GUIDE_VISIBLE_DISTANCE = 50;
  const GUIDE_SNAP_DISTANCE = 15;
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const isPanningRef = useRef(false);
  const lastPanPosRef = useRef<{ x: number; y: number } | null>(null);
  const [isMiddlePanning, setIsMiddlePanning] = useState(false);
  const lastGuidesRef = useRef<Array<{ orientation: 'vertical' | 'horizontal'; position: number }>>([]);
  const multiDragRef = useRef<{
    activeId: string;
    startById: Record<string, { x: number; y: number }>;
    groupStart?: { x: number; y: number; width: number; height: number };
  } | null>(null);

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

  const stageLogicalWidth = screen.width + STAGE_PADDING * 2;
  const stageLogicalHeight = screen.height + STAGE_PADDING * 2;

  const lastScaleRef = useRef(1);
  const baseScale = useMemo(() => {
    if (!containerWidth || !containerHeight) {
      return lastScaleRef.current;
    }
    const nextScale = Math.min(
      containerWidth / stageLogicalWidth,
      containerHeight / stageLogicalHeight
    );
    lastScaleRef.current = nextScale;
    return nextScale;
  }, [containerWidth, containerHeight, stageLogicalWidth, stageLogicalHeight]);
  const scale = baseScale * zoom;

  const selectedNodes = useMemo(
    () =>
      selectedElementIds
        .map((id) => elementRefs.current[id])
        .filter((node): node is Konva.Node => Boolean(node)),
    [selectedElementIds]
  );
  const selectedIdSet = useMemo(() => new Set(selectedElementIds), [selectedElementIds]);
  const gridStroke = useMemo(() => {
    const rgb = parseColorToRgb(slide?.backgroundColor);
    const luminance = rgb ? relativeLuminance(rgb) : null;
    const lightThreshold = 0.5;
    const midThreshold = 0.4;
    const hasImageBackground = Boolean(slide?.backgroundImagePath);

    if (rgb && rgb.r > 192) {
      return hasImageBackground ? 'rgba(18,22,30,0.26)' : 'rgba(18,22,30,0.22)';
    }
    if (luminance !== null && luminance >= lightThreshold) {
      return hasImageBackground ? 'rgba(18,22,30,0.26)' : 'rgba(18,22,30,0.22)';
    }
    if (luminance !== null && luminance >= midThreshold) {
      return hasImageBackground ? 'rgba(18,22,30,0.2)' : 'rgba(18,22,30,0.16)';
    }
    return hasImageBackground ? 'rgba(255,255,255,0.16)' : 'rgba(255,255,255,0.12)';
  }, [slide?.backgroundColor, slide?.backgroundImagePath]);

  const beginPan = (event: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => {
    const evt = event.evt as MouseEvent;
    isPanningRef.current = true;
    lastPanPosRef.current = { x: evt.clientX, y: evt.clientY };
    const container = stageRef.current?.container();
    if (container) {
      container.style.cursor = 'grabbing';
    }
  };

  const endPan = () => {
    isPanningRef.current = false;
    lastPanPosRef.current = null;
    const container = stageRef.current?.container();
    if (container) {
      container.style.cursor = panMode ? 'grab' : 'default';
    }
    setIsMiddlePanning(false);
  };

  const beginMiddlePan = useCallback((payload: { clientX: number; clientY: number }) => {
    const container = stageRef.current?.container();
    if (!container) return;
    isPanningRef.current = true;
    lastPanPosRef.current = { x: payload.clientX, y: payload.clientY };
    container.style.cursor = 'grabbing';
    setIsMiddlePanning(true);
  }, []);

  const handleStagePointerDown = (event: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => {
    const evt = event.evt as MouseEvent;
    const isMiddle = evt.button === 1;
    const isPrimaryPan = panMode && evt.button === 0;
    if (isMiddle || isPrimaryPan) {
      evt.preventDefault();
      if (isMiddle) {
        setIsMiddlePanning(true);
      }
      beginPan(event);
      return;
    }
    if (event.target === event.target.getStage()) {
      onSelectElement(null, { append: false });
    }
  };

  const handleStagePointerMove = (event: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => {
    if (!isPanningRef.current) return;
    const evt = event.evt as MouseEvent;
    if (!lastPanPosRef.current) {
      lastPanPosRef.current = { x: evt.clientX, y: evt.clientY };
      return;
    }
    const dx = evt.clientX - lastPanPosRef.current.x;
    const dy = evt.clientY - lastPanPosRef.current.y;
    lastPanPosRef.current = { x: evt.clientX, y: evt.clientY };
    setPanOffset((prev) => ({ x: prev.x + dx, y: prev.y + dy }));
  };

  const handleStagePointerUp = () => {
    if (isPanningRef.current) {
      endPan();
    }
  };

  const handleWheel = (event: Konva.KonvaEventObject<WheelEvent>) => {
    if (!onZoomChange) return;
    event.evt.preventDefault();
    const direction = event.evt.deltaY > 0 ? -1 : 1;
    const factor = direction > 0 ? 1.1 : 0.9;
    const next = Math.min(3, Math.max(0.3, zoom * factor));
    onZoomChange(next);
  };

  const stageWidth = stageLogicalWidth * scale;
  const stageHeight = stageLogicalHeight * scale;
  const contentOffset = { x: STAGE_PADDING, y: STAGE_PADDING };

  useEffect(() => {
    const container = stageRef.current?.container();
    if (container) {
      container.style.cursor = panMode ? 'grab' : 'default';
    }
  }, [panMode]);

  useEffect(() => {
    setPanOffset({ x: 0, y: 0 });
  }, [slide?.id, screen.id]);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const handler = (event: Konva.KonvaEventObject<DragEvent>) => {
      const evt = event.evt as MouseEvent;
      if (typeof evt.button === 'number' && evt.button === 1) {
        event.target.stopDrag();
      }
    };
    stage.on('dragstart', handler);
    return () => {
      stage.off('dragstart', handler);
    };
  }, []);

  const clearGuides = useCallback(() => {
    if (!lastGuidesRef.current.length) return;
    lastGuidesRef.current = [];
    setGuides([]);
  }, []);

  const setGuidesIfChanged = useCallback((next: Array<{ orientation: 'vertical' | 'horizontal'; position: number }>) => {
    const prev = lastGuidesRef.current;
    if (
      prev.length === next.length &&
      prev.every(
        (guide, index) =>
          guide.orientation === next[index]?.orientation && guide.position === next[index]?.position
      )
    ) {
      return;
    }
    lastGuidesRef.current = next;
    setGuides(next);
  }, []);

  useEffect(() => {
    if (!showGuides) {
      setGuides([]);
    }
  }, [showGuides]);

  const handleElementDragStart = useCallback((id: string) => {
    clearGuides();
    if (!slide || selectedElementIds.length <= 1 || !selectedElementIds.includes(id)) {
      multiDragRef.current = null;
      return;
    }
    const startById: Record<string, { x: number; y: number }> = {};
    (slide.elements ?? []).forEach((element) => {
      if (selectedElementIds.includes(element.id)) {
        startById[element.id] = { x: element.x, y: element.y };
      }
    });

    let minX = Number.POSITIVE_INFINITY;
    let minY = Number.POSITIVE_INFINITY;
    let maxX = Number.NEGATIVE_INFINITY;
    let maxY = Number.NEGATIVE_INFINITY;
    (slide.elements ?? []).forEach((element) => {
      const start = startById[element.id];
      if (!start) return;
      minX = Math.min(minX, start.x);
      minY = Math.min(minY, start.y);
      maxX = Math.max(maxX, start.x + element.width);
      maxY = Math.max(maxY, start.y + element.height);
    });

    multiDragRef.current = {
      activeId: id,
      startById,
      groupStart:
        Number.isFinite(minX) &&
        Number.isFinite(minY) &&
        Number.isFinite(maxX) &&
        Number.isFinite(maxY)
          ? { x: minX, y: minY, width: Math.max(10, maxX - minX), height: Math.max(10, maxY - minY) }
          : undefined
    };
  }, [clearGuides, selectedElementIds, slide]);

  const handleElementDragEnd = useCallback(() => {
    clearGuides();
    multiDragRef.current = null;
  }, [clearGuides]);

  const handleElementDragMove = useCallback(
    (payload: { id: string; node: Konva.Node; width: number; height: number }) => {
      if (!slide) return;

      const { node, width, height, id } = payload;
      const x = node.x();
      const y = node.y();
      const multiDrag = multiDragRef.current;
      const isMultiDragActive =
        Boolean(multiDrag) &&
        multiDrag?.activeId === id &&
        selectedElementIds.length > 1 &&
        Boolean(multiDrag?.startById[id]);

      let subjectX = x;
      let subjectY = y;
      let subjectWidth = width;
      let subjectHeight = height;
      let activeStartX = x;
      let activeStartY = y;

      if (isMultiDragActive && multiDrag) {
        const activeStart = multiDrag.startById[id];
        if (activeStart) {
          activeStartX = activeStart.x;
          activeStartY = activeStart.y;
          const dx = x - activeStart.x;
          const dy = y - activeStart.y;
          const groupStart = multiDrag.groupStart;
          if (groupStart) {
            subjectX = groupStart.x + dx;
            subjectY = groupStart.y + dy;
            subjectWidth = groupStart.width;
            subjectHeight = groupStart.height;
          }
        }
      }

      const centerX = subjectX + subjectWidth / 2;
      const centerY = subjectY + subjectHeight / 2;
      const slideCenterX = screen.width / 2;
      const slideCenterY = screen.height / 2;

      const nextGuides: Array<{ orientation: 'vertical' | 'horizontal'; position: number }> = [];
      let snappedSubjectX = subjectX;
      let snappedSubjectY = subjectY;

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
          snappedSubjectX = subjectX + (slideCenterX - centerX);
        }
        if (slideCenterDeltaY <= GUIDE_SNAP_DISTANCE) {
          snappedSubjectY = subjectY + (slideCenterY - centerY);
        }
      }

      if (!useSlideCenterX || !useSlideCenterY) {
        const otherElements = (slide.elements ?? []).filter((element) =>
          isMultiDragActive ? !selectedIdSet.has(element.id) : element.id !== id
        );
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
              snappedSubjectX = subjectX + (closestXCenter - centerX);
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
              snappedSubjectY = subjectY + (closestYCenter - centerY);
            }
          }
        }
      }

      const nextNodeX =
        isMultiDragActive && multiDrag
          ? activeStartX + (x - activeStartX) + (snappedSubjectX - subjectX)
          : snappedSubjectX;
      const nextNodeY =
        isMultiDragActive && multiDrag
          ? activeStartY + (y - activeStartY) + (snappedSubjectY - subjectY)
          : snappedSubjectY;

      if (magneticGuides && (nextNodeX !== x || nextNodeY !== y)) {
        node.position({ x: nextNodeX, y: nextNodeY });
        node.setAttr('skipGridSnap', true);
      } else {
        node.setAttr('skipGridSnap', false);
      }

      if (showGuides) {
        setGuidesIfChanged(nextGuides);
      } else {
        clearGuides();
      }

      if (
        multiDrag &&
        multiDrag.activeId === id &&
        selectedElementIds.length > 1 &&
        multiDrag.startById[id]
      ) {
        const activeStart = multiDrag.startById[id];
        const dx = node.x() - activeStart.x;
        const dy = node.y() - activeStart.y;
        selectedElementIds.forEach((selectedId) => {
          if (selectedId === id) return;
          const selectedNode = elementRefs.current[selectedId];
          const selectedStart = multiDrag.startById[selectedId];
          if (!selectedNode || !selectedStart) return;
          selectedNode.position({
            x: selectedStart.x + dx,
            y: selectedStart.y + dy
          });
          selectedNode.setAttr('skipGridSnap', Boolean(node.getAttr('skipGridSnap')));
        });
        node.getLayer()?.batchDraw();
      }
    },
    [clearGuides, magneticGuides, screen.height, screen.width, selectedElementIds, selectedIdSet, setGuidesIfChanged, showGuides, slide]
  );

  const handleTransformerTransformStart = useCallback(() => {
    clearGuides();
  }, [clearGuides]);

  const handleTransformerTransformEnd = useCallback(() => {
    if (!onElementsCommit) return;
    const transformer = transformerRef.current;
    if (!transformer) return;
    const nodes = transformer.nodes();
    if (nodes.length <= 1) return;
    const elementById = new Map((slide?.elements ?? []).map((element) => [element.id, element]));
    const updates: Array<{ id: string; attrs: Partial<SlideElementDto> }> = [];
    nodes.forEach((node) => {
      const id = node.id();
      if (!id) return;
      const source = elementById.get(id);
      const scaleX = node.scaleX();
      const scaleY = node.scaleY();
      const baseWidth = typeof node.width() === 'number' && node.width() > 0 ? node.width() : source?.width ?? 0;
      const baseHeight = typeof node.height() === 'number' && node.height() > 0 ? node.height() : source?.height ?? 0;
      updates.push({
        id,
        attrs: {
          x: node.x(),
          y: node.y(),
          width: Math.max(10, Math.abs(baseWidth * scaleX)),
          height: Math.max(10, Math.abs(baseHeight * scaleY)),
          rotation: node.rotation()
        }
      });
      node.scaleX(1);
      node.scaleY(1);
    });

    if (!updates.length) return;
    onElementsCommit(updates, { skipGridSnap: true });
    transformer.getLayer()?.batchDraw();
  }, [onElementsCommit, slide?.elements]);

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
      if (!node) return;
      const maybeNode = node as Konva.Node & { isDestroyed?: () => boolean };
      if (typeof maybeNode.isDestroyed === 'function' && maybeNode.isDestroyed()) return;
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

  useEffect(() => {
    if (typeof window === 'undefined') return;
    (window as Window & { __NOVI_EDITOR_STAGE__?: Konva.Stage | null }).__NOVI_EDITOR_STAGE__ =
      stageRef.current;
    return () => {
      (window as Window & { __NOVI_EDITOR_STAGE__?: Konva.Stage | null }).__NOVI_EDITOR_STAGE__ = null;
    };
  }, []);

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
          transform: `translate(-50%, -50%) translate(${panOffset.x}px, ${panOffset.y}px)`
        }}
      >
        <div
          data-editor-parity-root="true"
          style={{
            position: 'absolute',
            inset: 0,
            pointerEvents: 'none',
            opacity: 0,
            zIndex: 1
          }}
        >
          <div
            data-editor-parity-slide="true"
            style={{
              position: 'absolute',
              left: contentOffset.x * scale,
              top: contentOffset.y * scale,
              width: screen.width * scale,
              height: screen.height * scale
            }}
          />
          {(slide?.elements ?? []).map((element) => (
            <div
              key={`parity-${element.id}`}
              data-editor-parity-element-id={element.id}
              style={{
                position: 'absolute',
                left: (contentOffset.x + element.x) * scale,
                top: (contentOffset.y + element.y) * scale,
                width: element.width * scale,
                height: element.height * scale
              }}
            />
          ))}
        </div>
        <Stage
          ref={stageRef}
          width={stageWidth}
          height={stageHeight}
          scaleX={scale}
          scaleY={scale}
          onMouseDown={handleStagePointerDown}
          onMouseMove={handleStagePointerMove}
          onMouseUp={handleStagePointerUp}
          onMouseLeave={handleStagePointerUp}
          onTouchStart={handleStagePointerDown}
          onTouchMove={handleStagePointerMove}
          onTouchEnd={handleStagePointerUp}
          onWheel={handleWheel}
          tabIndex={-1}
          style={{ outline: 'none' }}
        >
          <Layer
            listening={false}
            x={contentOffset.x}
            y={contentOffset.y}
            clipX={0}
            clipY={0}
            clipWidth={screen.width}
            clipHeight={screen.height}
          >
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
            <Layer
              listening={false}
              x={contentOffset.x}
              y={contentOffset.y}
              clipX={0}
              clipY={0}
              clipWidth={screen.width}
              clipHeight={screen.height}
            >
              {Array.from({ length: Math.floor(screen.width / gridSize) - 1 }, (_, index) => {
                const x = (index + 1) * gridSize;
                return (
                  <Line
                    key={`v-${x}`}
                    points={[x, 0, x, screen.height]}
                    stroke={gridStroke}
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
                    stroke={gridStroke}
                    strokeWidth={1}
                  />
                );
              })}
            </Layer>
          ) : null}
          <Layer
            x={contentOffset.x}
            y={contentOffset.y}
            clipX={0}
            clipY={0}
            clipWidth={screen.width}
            clipHeight={screen.height}
          >
            {(slide?.elements ?? [])
              .slice()
              .sort((a, b) => a.zIndex - b.zIndex)
              .map((element) => (
                <ElementRenderer
                  key={element.id}
                  element={element}
                  isSelected={selectedElementIds.includes(element.id)}
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
                  onSelect={(options) => onSelectElement(element.id, options)}
                  onCommit={(attrs, options) => {
                    const multiDrag = multiDragRef.current;
                    if (
                      attrs.x !== undefined &&
                      attrs.y !== undefined &&
                      multiDrag &&
                      multiDrag.activeId === element.id &&
                      selectedElementIds.length > 1 &&
                      onElementsCommit &&
                      multiDrag.startById[element.id]
                    ) {
                      const activeStart = multiDrag.startById[element.id];
                      const dx = attrs.x - activeStart.x;
                      const dy = attrs.y - activeStart.y;
                      const updates: Array<{ id: string; attrs: Partial<SlideElementDto> }> = [];
                      selectedElementIds.forEach((selectedId) => {
                        const start = multiDrag.startById[selectedId];
                        if (!start) return;
                        updates.push({
                          id: selectedId,
                          attrs: {
                            x: start.x + dx,
                            y: start.y + dy
                          }
                        });
                      });
                      onElementsCommit(updates, options);
                      multiDragRef.current = null;
                      return;
                    }
                    onElementCommit(element.id, attrs, options);
                  }}
                  onDragStart={handleElementDragStart}
                  onDragMove={handleElementDragMove}
                  onDragEnd={handleElementDragEnd}
                  draggable={!panMode && !isMiddlePanning}
                  canSelect={!panMode && !isMiddlePanning}
                  allowNodeTransformCommit={selectedElementIds.length <= 1}
                  onMiddleMouseDown={beginMiddlePan}
                />
              ))}
          </Layer>
          <Layer x={contentOffset.x} y={contentOffset.y}>
            <Transformers
              transformerRef={transformerRef}
              selectedNodes={selectedNodes}
              onTransformStart={handleTransformerTransformStart}
              onTransformEnd={handleTransformerTransformEnd}
            />
          </Layer>
          {showGuides && guides.length ? (
            <Layer
              listening={false}
              x={contentOffset.x}
              y={contentOffset.y}
              clipX={0}
              clipY={0}
              clipWidth={screen.width}
              clipHeight={screen.height}
            >
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

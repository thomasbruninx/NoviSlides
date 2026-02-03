'use client';

import { useMemo, useRef } from 'react';
import { Stage, Layer, Rect, Image as KonvaImage, Line } from 'react-konva';
import { useElementSize } from '@mantine/hooks';
import useImage from 'use-image';
import type Konva from 'konva';
import type { ScreenDto, SlideDto, SlideElementDto } from '@/lib/types';
import ElementRenderer from './ElementRenderer';
import Transformers from './Transformers';

export default function KonvaStage({
  screen,
  slide,
  selectedElementId,
  onSelectElement,
  onElementCommit,
  showGrid = false,
  gridSize = 25
}: {
  screen: ScreenDto;
  slide: SlideDto | null;
  selectedElementId: string | null;
  onSelectElement: (id: string | null) => void;
  onElementCommit: (id: string, attrs: Partial<SlideElementDto>) => void;
  showGrid?: boolean;
  gridSize?: number;
}) {
  const { ref, width: containerWidth, height: containerHeight } = useElementSize();
  const elementRefs = useRef<Record<string, Konva.Node>>({});
  const transformerRef = useRef<Konva.Transformer>(null);

  const [backgroundImage] = useImage(slide?.backgroundImagePath ?? '');

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
          <Layer>
            <Rect width={screen.width} height={screen.height} fill={slide?.backgroundColor ?? '#0b0f18'} />
            {backgroundImage ? (
              <KonvaImage image={backgroundImage} width={screen.width} height={screen.height} />
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
                    }
                  }}
                  onSelect={() => onSelectElement(element.id)}
                  onCommit={(attrs) => onElementCommit(element.id, attrs)}
                />
              ))}
            <Transformers transformerRef={transformerRef} selectedNode={selectedNode ?? null} />
          </Layer>
        </Stage>
      </div>
    </div>
  );
}

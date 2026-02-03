'use client';

import { useMemo, useRef } from 'react';
import { Stage, Layer, Rect, Image as KonvaImage } from 'react-konva';
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
  onElementCommit
}: {
  screen: ScreenDto;
  slide: SlideDto | null;
  selectedElementId: string | null;
  onSelectElement: (id: string | null) => void;
  onElementCommit: (id: string, attrs: Partial<SlideElementDto>) => void;
}) {
  const { ref, width: containerWidth, height: containerHeight } = useElementSize();
  const elementRefs = useRef<Record<string, Konva.Node>>({});
  const transformerRef = useRef<Konva.Transformer>(null);

  const [backgroundImage] = useImage(slide?.backgroundImagePath ?? '');

  const scale = useMemo(() => {
    if (!containerWidth || !containerHeight) return 1;
    return Math.min(containerWidth / screen.width, containerHeight / screen.height);
  }, [containerWidth, containerHeight, screen.width, screen.height]);

  const selectedNode = selectedElementId ? elementRefs.current[selectedElementId] : null;

  return (
    <div
      ref={ref}
      className="editor-canvas grid-background"
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}
      onClick={() => onSelectElement(null)}
    >
      <Stage
        width={screen.width * scale}
        height={screen.height * scale}
        scaleX={scale}
        scaleY={scale}
      >
        <Layer>
          <Rect width={screen.width} height={screen.height} fill={slide?.backgroundColor ?? '#0b0f18'} />
          {backgroundImage ? (
            <KonvaImage image={backgroundImage} width={screen.width} height={screen.height} />
          ) : null}
        </Layer>
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
  );
}

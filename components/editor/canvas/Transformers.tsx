'use client';

import { useEffect } from 'react';
import type { RefObject } from 'react';
import { Transformer } from 'react-konva';
import type Konva from 'konva';

export default function Transformers({
  transformerRef,
  selectedNodes,
  onTransformStart,
  onTransformEnd
}: {
  transformerRef: RefObject<Konva.Transformer | null>;
  selectedNodes: Konva.Node[];
  onTransformStart?: () => void;
  onTransformEnd?: () => void;
}) {
  useEffect(() => {
    const transformer = transformerRef.current;
    if (!transformer) return;
    if (selectedNodes.length) {
      transformer.nodes(selectedNodes);
    } else {
      transformer.nodes([]);
    }
    transformer.getLayer()?.batchDraw();
  }, [selectedNodes, transformerRef]);

  return (
    <Transformer
      ref={transformerRef}
      rotateEnabled
      resizeEnabled
      flipEnabled={false}
      enabledAnchors={['top-left', 'top-center', 'top-right', 'middle-left', 'middle-right', 'bottom-left', 'bottom-center', 'bottom-right']}
      onTransformStart={onTransformStart}
      onTransformEnd={onTransformEnd}
      ignoreStroke
      boundBoxFunc={(oldBox, newBox) => {
        if (newBox.width < 10 || newBox.height < 10) {
          return oldBox;
        }
        return newBox;
      }}
    />
  );
}

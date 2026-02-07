'use client';

import { useEffect } from 'react';
import type { RefObject } from 'react';
import { Transformer } from 'react-konva';
import type Konva from 'konva';

export default function Transformers({
  transformerRef,
  selectedNodes
}: {
  transformerRef: RefObject<Konva.Transformer | null>;
  selectedNodes: Konva.Node[];
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
      rotateEnabled={selectedNodes.length === 1}
      resizeEnabled={selectedNodes.length === 1}
      enabledAnchors={
        selectedNodes.length === 1
          ? ['top-left', 'top-center', 'top-right', 'middle-left', 'middle-right', 'bottom-left', 'bottom-center', 'bottom-right']
          : []
      }
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

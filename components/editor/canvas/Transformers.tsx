'use client';

import { useEffect } from 'react';
import type { RefObject } from 'react';
import { Transformer } from 'react-konva';
import type Konva from 'konva';

export default function Transformers({
  transformerRef,
  selectedNode
}: {
  transformerRef: RefObject<Konva.Transformer | null>;
  selectedNode: Konva.Node | null;
}) {
  useEffect(() => {
    const transformer = transformerRef.current;
    if (!transformer) return;
    if (selectedNode) {
      transformer.nodes([selectedNode]);
    } else {
      transformer.nodes([]);
    }
    transformer.getLayer()?.batchDraw();
  }, [selectedNode, transformerRef]);

  return (
    <Transformer
      ref={transformerRef}
      rotateEnabled
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

'use client';

import { useCallback } from 'react';
import { Group, Rect, Text, Image as KonvaImage, Shape } from 'react-konva';
import useImage from 'use-image';
import type Konva from 'konva';
import type { SlideElementDto } from '@/lib/types';
import { resolveMediaPath } from '@/lib/utils/media';

export default function ElementRenderer({
  element,
  isSelected,
  registerRef,
  onSelect,
  onCommit
}: {
  element: SlideElementDto;
  isSelected: boolean;
  registerRef: (node: Konva.Node | null) => void;
  onSelect: () => void;
  onCommit: (attrs: Partial<SlideElementDto>) => void;
}) {
  const rawPath = element.type === 'image' ? ((element.dataJson as Record<string, unknown>).path as string) : '';
  const imagePath = resolveMediaPath(rawPath);
  const [image] = useImage(imagePath);

  const commonProps = {
    x: element.x,
    y: element.y,
    width: element.width,
    height: element.height,
    rotation: element.rotation,
    opacity: element.opacity,
    draggable: true,
    onClick: (event: Konva.KonvaEventObject<MouseEvent>) => {
      event.cancelBubble = true;
      onSelect();
    },
    onTap: (event: Konva.KonvaEventObject<TouchEvent>) => {
      event.cancelBubble = true;
      onSelect();
    },
    onDragEnd: (event: Konva.KonvaEventObject<DragEvent>) => {
      onCommit({ x: event.target.x(), y: event.target.y() });
    },
    onTransformEnd: (event: Konva.KonvaEventObject<Event>) => {
      const node = event.target;
      const scaleX = node.scaleX();
      const scaleY = node.scaleY();
      node.scaleX(1);
      node.scaleY(1);

      const width = Math.max(10, node.width() * scaleX);
      const height = Math.max(10, node.height() * scaleY);

      onCommit({
        x: node.x(),
        y: node.y(),
        width,
        height,
        rotation: node.rotation()
      });
    }
  };

  const refCallback = useCallback(
    (node: Konva.Node | null) => {
      registerRef(node);
    },
    [registerRef]
  );

  if (element.type === 'label') {
    const data = element.dataJson as Record<string, unknown>;
    const fontStyleParts: string[] = [];
    if ((data.bold as boolean | undefined) ?? false) {
      fontStyleParts.push('bold');
    }
    if ((data.italic as boolean | undefined) ?? false) {
      fontStyleParts.push('italic');
    }
    const fontStyle = fontStyleParts.length ? fontStyleParts.join(' ') : 'normal';
    const textDecoration = ((data.underline as boolean | undefined) ?? false) ? 'underline' : '';
    return (
      <Text
        ref={refCallback}
        {...commonProps}
        text={(data.text as string) ?? 'Label'}
        fontSize={(data.fontSize as number) ?? 32}
        fontFamily={(data.fontFamily as string) ?? 'Segoe UI, Arial'}
        fontStyle={fontStyle}
        textDecoration={textDecoration}
        fill={(data.color as string) ?? '#ffffff'}
        align={(data.align as 'left' | 'center' | 'right') ?? 'left'}
        stroke={isSelected ? '#54b3ff' : undefined}
        strokeWidth={isSelected ? 1 : 0}
      />
    );
  }

  if (element.type === 'video') {
    return (
      <Group ref={refCallback} {...commonProps}>
        <Rect
          width={element.width}
          height={element.height}
          fill="#101726"
          stroke={isSelected ? '#54b3ff' : '#2b3447'}
          strokeWidth={isSelected ? 1 : 1}
        />
        <Text
          text=">"
          width={element.width}
          height={element.height - 24}
          align="center"
          verticalAlign="middle"
          fill="#cbd5f5"
          fontSize={36}
          fontFamily="Plus Jakarta Sans, Segoe UI, Arial"
        />
        <Text
          text="VIDEO"
          width={element.width}
          height={element.height}
          align="center"
          verticalAlign="bottom"
          fill="#cbd5f5"
          fontSize={14}
          fontFamily="Plus Jakarta Sans, Segoe UI, Arial"
        />
      </Group>
    );
  }

  if (element.type === 'shape') {
    const data = element.dataJson as Record<string, unknown>;
    const shape = (data.shape as string) ?? 'rectangle';
    const fill = (data.fill as string) ?? '#2b3447';
    const stroke = (data.stroke as string) ?? '#6b7aa6';
    const strokeWidth = (data.strokeWidth as number) ?? 2;

    return (
      <Shape
        ref={refCallback}
        {...commonProps}
        fill={fill}
        stroke={stroke}
        strokeWidth={strokeWidth}
        sceneFunc={(ctx, node) => {
          const width = node.width();
          const height = node.height();
          ctx.beginPath();
          if (shape === 'circle') {
            ctx.ellipse(width / 2, height / 2, width / 2, height / 2, 0, 0, Math.PI * 2);
          } else if (shape === 'triangle') {
            ctx.moveTo(width / 2, 0);
            ctx.lineTo(width, height);
            ctx.lineTo(0, height);
            ctx.closePath();
          } else {
            ctx.rect(0, 0, width, height);
          }
          ctx.fillStrokeShape(node);
        }}
      />
    );
  }

  return (
    <KonvaImage
      ref={refCallback}
      {...commonProps}
      image={image}
      stroke={isSelected ? '#54b3ff' : undefined}
      strokeWidth={isSelected ? 1 : 0}
    />
  );
}

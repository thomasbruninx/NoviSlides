'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Group, Rect, Text, Image as KonvaImage, Shape } from 'react-konva';
import useImage from 'use-image';
import type Konva from 'konva';
import type { SlideElementDto } from '@/lib/types';
import { resolveMediaPath } from '@/lib/utils/media';
import { getIconUrl } from '@/lib/utils/icons';
import { buildFontSpec, isSystemFont } from '@/lib/utils/fonts';

export default function ElementRenderer({
  element,
  isSelected,
  registerRef,
  onSelect,
  onCommit,
  onDragStart,
  onDragMove,
  onDragEnd
}: {
  element: SlideElementDto;
  isSelected: boolean;
  registerRef: (node: Konva.Node | null) => void;
  onSelect: () => void;
  onCommit: (attrs: Partial<SlideElementDto>, options?: { skipGridSnap?: boolean }) => void;
  onDragStart?: (id: string) => void;
  onDragMove?: (payload: { id: string; node: Konva.Node; width: number; height: number }) => void;
  onDragEnd?: (id: string) => void;
}) {
  const localRef = useRef<Konva.Node | null>(null);
  const rawPath = element.type === 'image' ? ((element.dataJson as Record<string, unknown>).path as string) : '';
  const imagePath = resolveMediaPath(rawPath);
  const [image] = useImage(imagePath);
  const [videoThumbnail, setVideoThumbnail] = useState<HTMLVideoElement | null>(null);
  const iconPath = useMemo(() => {
    if (element.type !== 'symbol') return '';
    const data = element.dataJson as Record<string, unknown>;
    const iconName = (data.iconName as string | undefined) ?? '';
    const iconStyle = (data.iconStyle as string | undefined) ?? 'filled';
    const iconColor = (data.color as string | undefined) ?? '#ffffff';
    if (!iconName) return '';
    return getIconUrl(
      iconStyle as 'filled' | 'outlined' | 'round' | 'sharp' | 'two-tone',
      iconName,
      iconColor
    );
  }, [element]);
  const [iconImage] = useImage(iconPath);

  const videoPath = useMemo(() => {
    if (element.type !== 'video') return '';
    const data = element.dataJson as Record<string, unknown>;
    return resolveMediaPath((data.path as string) ?? '');
  }, [element]);

  useEffect(() => {
    if (element.type !== 'video' || !videoPath) {
      setVideoThumbnail(null);
      return;
    }

    const video = document.createElement('video');
    video.src = videoPath;
    video.muted = true;
    video.playsInline = true;
    video.preload = 'metadata';

    const handleError = () => {
      setVideoThumbnail(null);
    };

    const handleSeeked = () => {
      setVideoThumbnail(video);
    };

    const handleLoaded = async () => {
      try {
        video.currentTime = 0.01;
        await video.play();
        video.pause();
      } catch {
        // Ignore autoplay restrictions; seeked handler may still fire.
      }
    };

    video.addEventListener('loadeddata', handleLoaded);
    video.addEventListener('seeked', handleSeeked);
    video.addEventListener('error', handleError);

    return () => {
      video.removeEventListener('loadeddata', handleLoaded);
      video.removeEventListener('seeked', handleSeeked);
      video.removeEventListener('error', handleError);
      video.src = '';
    };
  }, [element.type, videoPath]);

  useEffect(() => {
    if (element.type !== 'label') return;
    if (!document.fonts?.load) return;
    const data = element.dataJson as Record<string, unknown>;
    const fontFamily = (data.fontFamily as string) ?? 'Segoe UI, Arial';
    const fontSize = (data.fontSize as number) ?? 32;
    const isBold = (data.bold as boolean | undefined) ?? false;
    const isItalic = (data.italic as boolean | undefined) ?? false;
    if (isSystemFont(fontFamily)) return;
    const fontSpec = buildFontSpec(fontFamily, fontSize, isBold ? 700 : 400, isItalic);
    if (!fontSpec) return;

    let cancelled = false;
    document.fonts
      .load(fontSpec)
      .then(() => {
        if (cancelled) return;
        const node = localRef.current;
        if (!node || node.getClassName() !== 'Text') return;
        const textNode = node as Konva.Text;
        textNode.fontFamily(textNode.fontFamily());
        textNode.text(textNode.text());
        textNode.getLayer()?.batchDraw();
      })
      .catch(() => {
        // Ignore font load errors.
      });

    return () => {
      cancelled = true;
    };
  }, [element.type, element.dataJson]);

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
    onDragStart: (event: Konva.KonvaEventObject<DragEvent>) => {
      event.target.setAttr('skipGridSnap', false);
      onDragStart?.(element.id);
    },
    onDragMove: (event: Konva.KonvaEventObject<DragEvent>) => {
      onDragMove?.({
        id: element.id,
        node: event.target,
        width: element.width,
        height: element.height
      });
    },
    onDragEnd: (event: Konva.KonvaEventObject<DragEvent>) => {
      const skipGridSnap = Boolean(event.target.getAttr('skipGridSnap'));
      onCommit({ x: event.target.x(), y: event.target.y() }, { skipGridSnap });
      onDragEnd?.(element.id);
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
      localRef.current = node;
      registerRef(node);
    },
    [registerRef]
  );

  useEffect(() => {
    if (element.type !== 'video') return;
    if (!localRef.current) return;
    const layer = localRef.current.getLayer();
    if (!layer) return;
    requestAnimationFrame(() => layer.batchDraw());
  }, [element.type, videoThumbnail]);

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
        {videoThumbnail ? (
          <KonvaImage image={videoThumbnail} width={element.width} height={element.height} />
        ) : (
          <Rect
            width={element.width}
            height={element.height}
            fill="#101726"
            stroke={isSelected ? '#54b3ff' : '#2b3447'}
            strokeWidth={isSelected ? 1 : 1}
          />
        )}
        {isSelected ? (
          <Rect
            width={element.width}
            height={element.height}
            stroke="#54b3ff"
            strokeWidth={1}
          />
        ) : null}
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

  if (element.type === 'symbol') {
    return (
      <KonvaImage
        ref={refCallback}
        {...commonProps}
        image={iconImage}
        stroke={isSelected ? '#54b3ff' : undefined}
        strokeWidth={isSelected ? 1 : 0}
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

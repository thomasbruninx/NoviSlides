import type { CSSProperties } from 'react';
import clsx from 'clsx';
/* eslint-disable @next/next/no-img-element */
import type { SlideDto, SlideElementDto } from '@/lib/types';
import { resolveMediaPath } from '@/lib/utils/media';
import { getIconUrl } from '@/lib/utils/icons';
import { resolveRenderableFontFamily } from '@/lib/utils/fonts';

function getFragmentClass(animation?: string) {
  switch (animation) {
    case 'fade':
      return 'fade-in';
    case 'zoom':
      return 'zoom-in';
    case 'appear':
      return 'appear';
    default:
      return '';
  }
}

const resolveBackgroundPosition = (value: string) => {
  const [vertical, horizontal] = value.split('-') as [string | undefined, string | undefined];
  const x = horizontal === 'left' ? 'left' : horizontal === 'right' ? 'right' : 'center';
  const y = vertical === 'top' ? 'top' : vertical === 'bottom' ? 'bottom' : 'center';
  return `${x} ${y}`;
};

export default function SlideSection({
  slide,
  elements
}: {
  slide: SlideDto;
  elements: SlideElementDto[];
}) {
  const sorted = [...elements].sort((a, b) => a.zIndex - b.zIndex);
  const backgroundSize = slide.backgroundImageSize ?? 'cover';
  const backgroundPosition = slide.backgroundImagePosition ?? 'center';
  const resolvedSize = backgroundSize === 'center' ? 'auto' : backgroundSize;
  const resolvedPosition = resolveBackgroundPosition(backgroundPosition);
  return (
    <section
      data-background-color={slide.backgroundColor ?? undefined}
      data-background-image={slide.backgroundImagePath ?? undefined}
      data-background-size={slide.backgroundImagePath ? resolvedSize : undefined}
      data-background-position={slide.backgroundImagePath ? resolvedPosition : undefined}
      data-transition={slide.transitionOverride ?? undefined}
      data-autoslide={slide.autoSlideMsOverride ?? undefined}
      style={{ width: '100%', height: '100%' }}
    >
      <div className="slide-layer">
        {sorted.map((element, index) => {
          const isLabel = element.type === 'label';
          const fragmentClass = getFragmentClass(element.animation);
          const fragmentIndex = element.zIndex ?? index;

          const style: CSSProperties = {
            left: element.x,
            top: element.y,
            width: element.width,
            height: element.height
          };
          const contentStyle: CSSProperties = {
            width: '100%',
            height: '100%',
            opacity: element.opacity,
            transform: `rotate(${element.rotation}deg)`,
            transformOrigin: 'top left'
          };

          if (isLabel) {
            const data = element.dataJson as Record<string, unknown>;
            const animationDurationMs =
              typeof data.animationDurationMs === 'number' ? data.animationDurationMs : undefined;
            const animationDelayMs =
              typeof data.animationDelayMs === 'number' ? data.animationDelayMs : undefined;
            const isBold = (data.bold as boolean | undefined) ?? false;
            const isItalic = (data.italic as boolean | undefined) ?? false;
            const isUnderline = (data.underline as boolean | undefined) ?? false;
            const fontFamily = (data.fontFamily as string) ?? 'Segoe UI, Arial';
            const fragmentStyle: CSSProperties = {
              ...style,
              ...(fragmentClass && animationDurationMs !== undefined
                ? { transitionDuration: `${animationDurationMs}ms` }
                : {}),
              ...(fragmentClass && animationDelayMs !== undefined
                ? { transitionDelay: `${animationDelayMs}ms` }
                : {})
            };
            return (
              <div
                key={element.id}
                className={clsx('slide-element', 'label', fragmentClass && 'fragment', fragmentClass)}
                data-element-id={element.id}
                data-fragment-index={fragmentIndex}
                style={fragmentStyle}
              >
                <div
                  style={{
                    ...contentStyle,
                    color: (data.color as string) ?? '#fff',
                    fontSize: (data.fontSize as number) ?? 32,
                    fontFamily: resolveRenderableFontFamily(fontFamily),
                    textAlign: (data.align as 'left' | 'center' | 'right') ?? 'left',
                    fontWeight: isBold ? '700' : '400',
                    fontStyle: isItalic ? 'italic' : 'normal',
                    textDecoration: isUnderline ? 'underline' : 'none',
                    whiteSpace: 'pre-wrap',
                    lineHeight: 1.2
                  }}
                >
                  {data.text as string}
                </div>
              </div>
            );
          }

          const data = element.dataJson as Record<string, unknown>;
          const animationDurationMs =
            typeof data.animationDurationMs === 'number' ? data.animationDurationMs : undefined;
          const animationDelayMs =
            typeof data.animationDelayMs === 'number' ? data.animationDelayMs : undefined;
          const fragmentStyle: CSSProperties = {
            ...style,
            ...(fragmentClass && animationDurationMs !== undefined
              ? { transitionDuration: `${animationDurationMs}ms` }
              : {}),
            ...(fragmentClass && animationDelayMs !== undefined
              ? { transitionDelay: `${animationDelayMs}ms` }
              : {})
          };
          if (element.type === 'symbol') {
            const iconName = (data.iconName as string | undefined) ?? '';
            const iconStyle = (data.iconStyle as string | undefined) ?? 'filled';
            const iconColor = (data.color as string | undefined) ?? '#ffffff';
            const iconPath = iconName
              ? getIconUrl(
                  iconStyle as 'filled' | 'outlined' | 'round' | 'sharp' | 'two-tone',
                  iconName,
                  iconColor
                )
              : '';
            return (
              <div
                key={element.id}
                className={clsx('slide-element', fragmentClass && 'fragment', fragmentClass)}
                data-element-id={element.id}
                data-fragment-index={fragmentIndex}
                style={fragmentStyle}
              >
                <div style={contentStyle}>
                  {iconPath ? (
                    <img
                      src={iconPath}
                      alt={iconName}
                      style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                    />
                  ) : null}
                </div>
              </div>
            );
          }

          if (element.type === 'shape') {
            const shape = (data.shape as string) ?? 'rectangle';
            const fill = (data.fill as string) ?? '#2b3447';
            const stroke = (data.stroke as string) ?? '#6b7aa6';
            const strokeWidth = (data.strokeWidth as number) ?? 2;
            return (
              <div
                key={element.id}
                className={clsx('slide-element', fragmentClass && 'fragment', fragmentClass)}
                data-element-id={element.id}
                data-fragment-index={fragmentIndex}
                style={fragmentStyle}
              >
                <div style={contentStyle}>
                  <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
                    {shape === 'circle' ? (
                      <ellipse
                        cx="50"
                        cy="50"
                        rx="50"
                        ry="50"
                        fill={fill}
                        stroke={stroke}
                        strokeWidth={strokeWidth}
                        vectorEffect="non-scaling-stroke"
                      />
                    ) : shape === 'triangle' ? (
                      <polygon
                        points="50,0 100,100 0,100"
                        fill={fill}
                        stroke={stroke}
                        strokeWidth={strokeWidth}
                        vectorEffect="non-scaling-stroke"
                      />
                    ) : (
                      <rect
                        x="0"
                        y="0"
                        width="100"
                        height="100"
                        fill={fill}
                        stroke={stroke}
                        strokeWidth={strokeWidth}
                        vectorEffect="non-scaling-stroke"
                      />
                    )}
                  </svg>
                </div>
              </div>
            );
          }
          const isVideo = element.type === 'video';
          const path = resolveMediaPath(data.path as string | undefined);

          return (
            <div
              key={element.id}
              className={clsx('slide-element', fragmentClass && 'fragment', fragmentClass)}
              data-element-id={element.id}
              data-fragment-index={fragmentIndex}
              style={fragmentStyle}
            >
              {path ? (
                <div style={contentStyle}>
                  {isVideo ? (
                    <video
                      src={path}
                      data-autoplay={((data.autoplay as boolean | undefined) ?? false) ? 'true' : 'false'}
                      loop={(data.loop as boolean | undefined) ?? true}
                      muted={((data.autoplay as boolean | undefined) ?? false) ? true : ((data.muted as boolean | undefined) ?? true)}
                      controls={(data.controls as boolean | undefined) ?? false}
                      playsInline
                      preload="metadata"
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : (
                    <img
                      src={path}
                      alt={(data.originalName as string | undefined) ?? ''}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  )}
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </section>
  );
}

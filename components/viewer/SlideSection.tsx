import type { CSSProperties } from 'react';
import clsx from 'clsx';
/* eslint-disable @next/next/no-img-element */
import type { SlideDto, SlideElementDto } from '@/lib/types';
import { resolveMediaPath } from '@/lib/utils/media';

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

export default function SlideSection({
  slide,
  elements
}: {
  slide: SlideDto;
  elements: SlideElementDto[];
}) {
  const sorted = [...elements].sort((a, b) => a.zIndex - b.zIndex);
  return (
    <section
      data-background-color={slide.backgroundColor ?? undefined}
      data-background-image={slide.backgroundImagePath ?? undefined}
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
            height: element.height,
            opacity: element.opacity,
            transform: `rotate(${element.rotation}deg)`
          };

          if (isLabel) {
            const data = element.dataJson as Record<string, unknown>;
            const isBold = (data.bold as boolean | undefined) ?? false;
            const isItalic = (data.italic as boolean | undefined) ?? false;
            const isUnderline = (data.underline as boolean | undefined) ?? false;
            return (
              <div
                key={element.id}
                className={clsx('slide-element', 'label', fragmentClass && 'fragment', fragmentClass)}
                data-fragment-index={fragmentIndex}
                style={{
                  ...style,
                  color: (data.color as string) ?? '#fff',
                  fontSize: (data.fontSize as number) ?? 32,
                  fontFamily: (data.fontFamily as string) ?? 'Segoe UI, Arial',
                  textAlign: (data.align as 'left' | 'center' | 'right') ?? 'left',
                  fontWeight: isBold ? '700' : '400',
                  fontStyle: isItalic ? 'italic' : 'normal',
                  textDecoration: isUnderline ? 'underline' : 'none'
                }}
              >
                {data.text as string}
              </div>
            );
          }

          const data = element.dataJson as Record<string, unknown>;
          const isVideo = element.type === 'video';
          const path = resolveMediaPath(data.path as string | undefined);

          return (
            <div
              key={element.id}
              className={clsx('slide-element', fragmentClass && 'fragment', fragmentClass)}
              data-fragment-index={fragmentIndex}
              style={style}
            >
              {path ? (
                isVideo ? (
                  <video
                    src={path}
                    autoPlay={(data.autoplay as boolean | undefined) ?? false}
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
                )
              ) : null}
            </div>
          );
        })}
      </div>
    </section>
  );
}

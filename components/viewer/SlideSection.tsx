import type { SlideDto, SlideElementDto } from '@/lib/types';
import type { CSSProperties } from 'react';
import clsx from 'clsx';

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
      data-auto-slide={slide.autoSlideMsOverride ?? undefined}
      style={{ width: '100%', height: '100%', position: 'relative' }}
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
                  textAlign: (data.align as 'left' | 'center' | 'right') ?? 'left'
                }}
              >
                {data.text as string}
              </div>
            );
          }

          const data = element.dataJson as Record<string, unknown>;
          return (
            <div
              key={element.id}
              className={clsx('slide-element', fragmentClass && 'fragment', fragmentClass)}
              data-fragment-index={fragmentIndex}
              style={style}
            >
              {data.path ? (
                <img
                  src={data.path as string}
                  alt={data.originalName as string | undefined}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : null}
            </div>
          );
        })}
      </div>
    </section>
  );
}

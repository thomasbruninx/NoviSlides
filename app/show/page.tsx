import LiveRevealDeck from '@/components/viewer/LiveRevealDeck';
import ViewerEmpty from '@/components/viewer/ViewerEmpty';
import { prisma } from '@/lib/db/prisma';
import { toScreenDto, toSlideDto, toSlideElementDto, toSlideshowDto } from '@/lib/utils/serializers';

export default async function ShowPage() {
  const slideshow = await prisma.slideshow.findFirst({ where: { isActive: true } });

  if (!slideshow) {
    return (
      <ViewerEmpty
        title="No active slideshow"
        description="Activate a slideshow in the editor to start playback."
      />
    );
  }

  const screen = await prisma.screen.findUnique({
    where: { slideshowId_key: { slideshowId: slideshow.id, key: slideshow.defaultScreenKey } },
    include: {
      slides: {
        orderBy: { orderIndex: 'asc' },
        include: { elements: { orderBy: { zIndex: 'asc' } } }
      }
    }
  });

  if (!screen) {
    return (
      <ViewerEmpty
        title="Missing default screen"
        description="The active slideshow has no screen for its default key."
      />
    );
  }

  const slides = screen.slides.map((slide) => ({
    ...toSlideDto(slide),
    elements: slide.elements.map(toSlideElementDto)
  }));

  return (
    <LiveRevealDeck
      slideshowId={slideshow.id}
      screenKey={screen.key}
      watchActiveSlideshow
      initialDeck={{
        slideshow: toSlideshowDto(slideshow),
        screen: toScreenDto(screen),
        slides
      }}
    />
  );
}

export const dynamic = 'force-dynamic';

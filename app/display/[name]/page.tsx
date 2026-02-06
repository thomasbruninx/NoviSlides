import LiveRevealDeck from '@/components/viewer/LiveRevealDeck';
import ViewerEmpty from '@/components/viewer/ViewerEmpty';
import { prisma } from '@/lib/db/prisma';
import { toScreenDto, toSlideDto, toSlideElementDto, toSlideshowDto } from '@/lib/utils/serializers';

export default async function DisplayPage({ params }: { params: Promise<{ name: string }> }) {
  const { name } = await params;
  const display = await prisma.display.findUnique({ where: { name } });

  if (!display) {
    return (
      <ViewerEmpty
        title="Display not found"
        description="This display name is not configured."
      />
    );
  }

  if (!display.mountedSlideshowId) {
    return (
      <ViewerEmpty
        title="No slideshow mounted"
        description="Mount a slideshow to this display from the editor settings."
      />
    );
  }

  const slideshow = await prisma.slideshow.findUnique({ where: { id: display.mountedSlideshowId } });
  if (!slideshow) {
    return (
      <ViewerEmpty
        title="Mounted slideshow missing"
        description="The slideshow mounted to this display no longer exists."
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
        description="This slideshow has no screen for its default key."
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
      displayName={display.name}
      initialDeck={{
        slideshow: toSlideshowDto(slideshow),
        screen: toScreenDto(screen),
        slides
      }}
    />
  );
}

export const dynamic = 'force-dynamic';

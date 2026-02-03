import LiveRevealDeck from '@/components/viewer/LiveRevealDeck';
import ViewerEmpty from '@/components/viewer/ViewerEmpty';
import { prisma } from '@/lib/db/prisma';
import { toScreenDto, toSlideDto, toSlideElementDto, toSlideshowDto } from '@/lib/utils/serializers';

export default async function ScreenPage({
  params
}: {
  params: { slideshowId: string; screenKey: string };
}) {
  const slideshow = await prisma.slideshow.findUnique({ where: { id: params.slideshowId } });

  if (!slideshow) {
    return (
      <ViewerEmpty
        title="Slideshow not found"
        description="We couldn't find that slideshow."
      />
    );
  }

  const screen = await prisma.screen.findUnique({
    where: { slideshowId_key: { slideshowId: slideshow.id, key: params.screenKey } },
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
        title="Screen not found"
        description="This slideshow does not include the requested screen key."
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
      initialDeck={{
        slideshow: toSlideshowDto(slideshow),
        screen: toScreenDto(screen),
        slides
      }}
    />
  );
}

export const dynamic = 'force-dynamic';

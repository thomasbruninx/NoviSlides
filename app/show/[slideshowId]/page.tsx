import RevealDeck from '@/components/viewer/RevealDeck';
import ViewerEmpty from '@/components/viewer/ViewerEmpty';
import { prisma } from '@/lib/db/prisma';
import { toScreenDto, toSlideDto, toSlideElementDto, toSlideshowDto } from '@/lib/utils/serializers';

export default async function SlideshowPage({ params }: { params: { slideshowId: string } }) {
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
    <RevealDeck
      slideshow={toSlideshowDto(slideshow)}
      screen={toScreenDto(screen)}
      slides={slides}
    />
  );
}

export const dynamic = 'force-dynamic';

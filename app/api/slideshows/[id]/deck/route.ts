import { fail, ok } from '@/lib/utils/respond';
import { prisma } from '@/lib/db/prisma';
import { toScreenDto, toSlideDto, toSlideElementDto, toSlideshowDto } from '@/lib/utils/serializers';

type SlideRecord = Parameters<typeof toSlideDto>[0];
type SlideElementRecord = Parameters<typeof toSlideElementDto>[0];

export async function GET(_: Request, context: { params: Promise<{ id: string }> }) {
  const params = await context.params;
  try {
    const slideshow = await prisma.slideshow.findUnique({ where: { id: params.id } });
    if (!slideshow) {
      return fail('not_found', 'Slideshow not found', 404);
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
      return fail('not_found', 'Screen deck not found', 404);
    }

    const slides = screen.slides.map((slide: SlideRecord & { elements: SlideElementRecord[] }) => ({
      ...toSlideDto(slide),
      elements: slide.elements.map(toSlideElementDto)
    }));

    return ok({
      slideshow: toSlideshowDto(slideshow),
      screen: toScreenDto(screen),
      slides
    });
  } catch (error) {
    console.error('GET /api/slideshows/:id/deck', error);
    return fail('server_error', 'Failed to fetch slideshow deck', 500);
  }
}

export const dynamic = 'force-dynamic';

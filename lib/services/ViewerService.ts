import { prisma } from '@/lib/db/prisma';
import type { ScreenDeckDto } from '@/lib/types';
import { toScreenDto, toSlideDto, toSlideElementDto, toSlideshowDto } from '@/lib/utils/serializers';

export class ViewerService {
  async getScreenDeckByKey(slideshowId: string, screenKey: string): Promise<ScreenDeckDto | null> {
    const slideshow = await prisma.slideshow.findUnique({ where: { id: slideshowId } });
    if (!slideshow) return null;

    const screen = await prisma.screen.findUnique({
      where: { slideshowId_key: { slideshowId: slideshow.id, key: screenKey } },
      include: {
        slides: {
          orderBy: { orderIndex: 'asc' },
          include: { elements: { orderBy: { zIndex: 'asc' } } }
        }
      }
    });

    if (!screen) return null;

    const slides = screen.slides.map((slide) => ({
      ...toSlideDto(slide),
      elements: slide.elements.map(toSlideElementDto)
    }));

    return {
      slideshow: toSlideshowDto(slideshow),
      screen: toScreenDto(screen),
      slides
    };
  }
}

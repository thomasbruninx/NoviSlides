import { prisma } from '@/lib/db/prisma';
import { SlideshowRepository } from '@/lib/repositories';
import type { SlideshowExport, SlideBackgroundImagePosition, SlideBackgroundImageSize } from '@/lib/types';

export class SlideshowTransferService {
  private slideshowRepo = new SlideshowRepository();

  async exportSlideshow(id: string): Promise<SlideshowExport> {
    const slideshow = await this.slideshowRepo.getByIdWithDeck(id);
    if (!slideshow) {
      throw new Error('Slideshow not found');
    }

    return {
      version: 1,
      exportedAt: new Date().toISOString(),
      slideshow: {
        name: slideshow.name,
        defaultAutoSlideMs: slideshow.defaultAutoSlideMs,
        revealTransition: slideshow.revealTransition,
        loop: slideshow.loop,
        controls: slideshow.controls,
        autoSlideStoppable: slideshow.autoSlideStoppable,
        defaultScreenKey: slideshow.defaultScreenKey
      },
      screens: slideshow.screens.map((screen) => ({
        key: screen.key,
        width: screen.width,
        height: screen.height,
        slides: screen.slides.map((slide) => ({
          orderIndex: slide.orderIndex,
          title: slide.title,
          autoSlideMsOverride: slide.autoSlideMsOverride,
          backgroundColor: slide.backgroundColor,
          backgroundImagePath: slide.backgroundImagePath,
          backgroundImageSize: slide.backgroundImageSize as SlideBackgroundImageSize | null,
          backgroundImagePosition: slide.backgroundImagePosition as SlideBackgroundImagePosition | null,
          transitionOverride: slide.transitionOverride,
          elements: slide.elements.map((element) => ({
            type: element.type as SlideshowExport['screens'][number]['slides'][number]['elements'][number]['type'],
            x: element.x,
            y: element.y,
            width: element.width,
            height: element.height,
            rotation: element.rotation,
            opacity: element.opacity,
            zIndex: element.zIndex,
            animation: element.animation as SlideshowExport['screens'][number]['slides'][number]['elements'][number]['animation'],
            dataJson: (() => {
              try {
                return JSON.parse(element.dataJson);
              } catch {
                return {};
              }
            })()
          }))
        }))
      }))
    };
  }

  async importSlideshow(payload: SlideshowExport, nameOverride?: string) {
    const name = nameOverride?.trim() || payload.slideshow.name.trim();
    return prisma.$transaction(async (tx) => {
      const created = await tx.slideshow.create({
        data: {
          name,
          defaultAutoSlideMs: payload.slideshow.defaultAutoSlideMs,
          revealTransition: payload.slideshow.revealTransition,
          loop: payload.slideshow.loop,
          controls: payload.slideshow.controls,
          autoSlideStoppable: payload.slideshow.autoSlideStoppable,
          defaultScreenKey: payload.slideshow.defaultScreenKey
        }
      });

      const screenKeys = new Set(payload.screens.map((screen) => screen.key));
      const defaultKey = screenKeys.has(payload.slideshow.defaultScreenKey)
        ? payload.slideshow.defaultScreenKey
        : payload.screens[0]?.key ?? 'main';
      if (defaultKey !== payload.slideshow.defaultScreenKey) {
        await tx.slideshow.update({
          where: { id: created.id },
          data: { defaultScreenKey: defaultKey }
        });
      }

      for (const screen of payload.screens) {
        const createdScreen = await tx.screen.create({
          data: {
            slideshowId: created.id,
            key: screen.key,
            width: screen.width,
            height: screen.height
          }
        });

        for (const slide of screen.slides) {
          const createdSlide = await tx.slide.create({
            data: {
              screenId: createdScreen.id,
              orderIndex: slide.orderIndex,
              title: slide.title ?? null,
              autoSlideMsOverride: slide.autoSlideMsOverride ?? null,
              backgroundColor: slide.backgroundColor ?? null,
              backgroundImagePath: slide.backgroundImagePath ?? null,
              backgroundImageSize: slide.backgroundImageSize ?? null,
              backgroundImagePosition: slide.backgroundImagePosition ?? null,
              transitionOverride: slide.transitionOverride ?? null
            }
          });

          for (let index = 0; index < slide.elements.length; index += 1) {
            const element = slide.elements[index];
            await tx.slideElement.create({
              data: {
                slideId: createdSlide.id,
                type: element.type,
                x: element.x,
                y: element.y,
                width: element.width,
                height: element.height,
                rotation: element.rotation ?? 0,
                opacity: element.opacity ?? 1,
                zIndex: element.zIndex ?? index,
                animation: element.animation ?? 'none',
                dataJson: JSON.stringify(element.dataJson)
              }
            });
          }
        }
      }

      return created;
    });
  }
}

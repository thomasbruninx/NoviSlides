import { prisma } from '../db/prisma';
import type { TemplateDefinition, TemplateScreen } from '../templates/types';
import { DEFAULT_TEMPLATE_KEY, templates } from '../templates/templates';

export class TemplateService {
  listTemplates() {
    return templates.map((template) => ({
      key: template.key,
      name: template.name,
      description: template.description,
      isDefault: template.isDefault
    }));
  }

  getTemplate(key?: string): TemplateDefinition {
    const resolvedKey = key ?? DEFAULT_TEMPLATE_KEY;
    const template = templates.find((item) => item.key === resolvedKey);
    if (!template) {
      const fallback = templates.find((item) => item.key === DEFAULT_TEMPLATE_KEY);
      if (!fallback) {
        throw new Error('No default template configured');
      }
      return fallback;
    }
    return template;
  }

  buildScreens(key?: string): TemplateScreen[] {
    return this.getTemplate(key).build();
  }

  async applyTemplateToSlideshow(slideshowId: string, key?: string) {
    const screens = this.buildScreens(key);
    return prisma.$transaction(async (tx) => {
      for (const screen of screens) {
        const createdScreen = await tx.screen.create({
          data: {
            slideshowId,
            key: screen.key,
            width: screen.width,
            height: screen.height
          }
        });

        for (let slideIndex = 0; slideIndex < screen.slides.length; slideIndex += 1) {
          const slide = screen.slides[slideIndex];
          const createdSlide = await tx.slide.create({
            data: {
              screenId: createdScreen.id,
              orderIndex: slideIndex,
              title: slide.title,
              autoSlideMsOverride: slide.autoSlideMsOverride ?? null,
              backgroundColor: slide.backgroundColor ?? null,
              backgroundImagePath: slide.backgroundImagePath ?? null,
              backgroundImageSize: slide.backgroundImageSize ?? null,
              backgroundImagePosition: slide.backgroundImagePosition ?? null,
              transitionOverride: slide.transitionOverride ?? null
            }
          });

          for (let elementIndex = 0; elementIndex < slide.elements.length; elementIndex += 1) {
            const element = slide.elements[elementIndex];
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
                zIndex: element.zIndex ?? elementIndex,
                animation: element.animation ?? 'none',
                dataJson: JSON.stringify(element.dataJson)
              }
            });
          }
        }
      }

      return screens.length;
    });
  }
}

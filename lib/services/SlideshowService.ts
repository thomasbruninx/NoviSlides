import { prisma } from '../db/prisma';
import { SlideshowRepository, ScreenRepository, SlideRepository } from '../repositories';
import { TemplateService } from './TemplateService';
import { bumpAllScreensForSlideshow, bumpScreenRevision } from './ScreenRevisionService';
import { eventHub } from './events';

const DEFAULT_RESOLUTION = { width: 1920, height: 540 };

export class SlideshowService {
  private slideshowRepo = new SlideshowRepository();
  private screenRepo = new ScreenRepository();
  private slideRepo = new SlideRepository();
  private templateService = new TemplateService();

  async listSlideshows() {
    return this.slideshowRepo.list();
  }

  async getSlideshow(id: string) {
    return this.slideshowRepo.getById(id);
  }

  async getSlideshowWithScreens(id: string) {
    return this.slideshowRepo.getByIdWithScreens(id);
  }

  async getActiveSlideshow() {
    return this.slideshowRepo.getActive();
  }

  async createSlideshow(input: {
    name: string;
    defaultAutoSlideMs?: number;
    revealTransition?: string;
    loop?: boolean;
    controls?: boolean;
    autoSlideStoppable?: boolean;
    defaultScreenKey?: string;
    templateKey?: string;
    initialScreen?: { key: string; width: number; height: number };
  }) {
    const templateScreens = input.templateKey || !input.initialScreen ? this.templateService.buildScreens(input.templateKey) : [];
    const defaultScreenKey =
      input.defaultScreenKey ?? templateScreens[0]?.key ?? input.initialScreen?.key ?? 'main';
    const slideshow = await this.slideshowRepo.create({
      name: input.name,
      defaultAutoSlideMs: input.defaultAutoSlideMs ?? 5000,
      revealTransition: input.revealTransition ?? 'slide',
      loop: input.loop ?? true,
      controls: input.controls ?? true,
      autoSlideStoppable: input.autoSlideStoppable ?? false,
      defaultScreenKey
    });

    if (input.templateKey || !input.initialScreen) {
      await this.templateService.applyTemplateToSlideshow(slideshow.id, input.templateKey);
    } else if (input.initialScreen) {
      const screen = await this.screenRepo.create({
        slideshow: { connect: { id: slideshow.id } },
        key: input.initialScreen.key,
        width: input.initialScreen.width,
        height: input.initialScreen.height
      });

      await this.slideRepo.create({
        screen: { connect: { id: screen.id } },
        orderIndex: 0,
        title: 'New Slide',
        backgroundColor: '#0b0f18'
      });
    }

    return slideshow;
  }

  async updateSlideshow(id: string, data: {
    name?: string;
    defaultAutoSlideMs?: number;
    revealTransition?: string;
    loop?: boolean;
    controls?: boolean;
    autoSlideStoppable?: boolean;
    defaultScreenKey?: string;
    isActive?: boolean;
  }) {
    const shouldBump =
      data.defaultAutoSlideMs !== undefined ||
      data.revealTransition !== undefined ||
      data.loop !== undefined ||
      data.controls !== undefined ||
      data.autoSlideStoppable !== undefined;

    if (!shouldBump) {
      return this.slideshowRepo.update(id, data);
    }

    const result = await prisma.$transaction(async (tx) => {
      const updated = await tx.slideshow.update({
        where: { id },
        data
      });
      const revisions = await bumpAllScreensForSlideshow(id, tx);
      return { updated, revisions };
    });

    for (const revisionInfo of result.revisions) {
      eventHub.publish({
        type: 'screenChanged',
        slideshowId: revisionInfo.slideshowId,
        screenKey: revisionInfo.screenKey,
        revision: revisionInfo.revision,
        at: new Date().toISOString()
      });
    }

    return result.updated;
  }

  async deleteSlideshow(id: string) {
    return this.slideshowRepo.delete(id);
  }

  async activateSlideshow(id: string) {
    const slideshow = await this.slideshowRepo.activate(id);
    eventHub.publish({
      type: 'activeSlideshowChanged',
      slideshowId: slideshow.id,
      defaultScreenKey: slideshow.defaultScreenKey,
      at: new Date().toISOString()
    });
    return slideshow;
  }

  async deactivateSlideshow(id: string) {
    return this.slideshowRepo.deactivate(id);
  }

  async createScreen(slideshowId: string, input: { key: string; width?: number; height?: number }) {
    const width = input.width ?? DEFAULT_RESOLUTION.width;
    const height = input.height ?? DEFAULT_RESOLUTION.height;

    return this.screenRepo.create({
      slideshow: { connect: { id: slideshowId } },
      key: input.key,
      width,
      height
    });
  }

  async updateScreen(id: string, input: { key?: string; width?: number; height?: number }) {
    const result = await prisma.$transaction(async (tx) => {
      const updated = await tx.screen.update({
        where: { id },
        data: input
      });
      const revisionInfo = await bumpScreenRevision(updated.id, tx);
      return { updated, revisionInfo };
    });

    eventHub.publish({
      type: 'screenChanged',
      slideshowId: result.revisionInfo.slideshowId,
      screenKey: result.revisionInfo.screenKey,
      revision: result.revisionInfo.revision,
      at: new Date().toISOString()
    });

    return result.updated;
  }

  async deleteScreen(id: string) {
    const screen = await this.screenRepo.getById(id);
    if (!screen) {
      return null;
    }

    const slideshow = await this.slideshowRepo.getById(screen.slideshowId);
    const deleted = await this.screenRepo.delete(id);

    if (slideshow && slideshow.defaultScreenKey === screen.key) {
      const remaining = await this.screenRepo.listBySlideshow(screen.slideshowId);
      const fallbackKey = remaining[0]?.key ?? 'main';
      await this.slideshowRepo.update(screen.slideshowId, {
        defaultScreenKey: fallbackKey
      });
    }

    return deleted;
  }

  async ensureDefaultScreen(slideshowId: string) {
    const slideshow = await this.slideshowRepo.getById(slideshowId);
    if (!slideshow) return null;

    const screen = await this.screenRepo.getByKey(slideshowId, slideshow.defaultScreenKey);
    if (screen) return screen;

    const fallbackKey = slideshow.defaultScreenKey || 'main';
    return this.screenRepo.create({
      slideshow: { connect: { id: slideshowId } },
      key: fallbackKey,
      width: DEFAULT_RESOLUTION.width,
      height: DEFAULT_RESOLUTION.height
    });
  }

  async createDemoSlideshow() {
    return prisma.$transaction(async (tx) => {
      const slideshow = await tx.slideshow.create({
        data: {
          name: 'Demo Multi-Screen',
          isActive: false,
          defaultAutoSlideMs: 6000,
          revealTransition: 'fade',
          loop: true,
          controls: true,
          autoSlideStoppable: false,
          defaultScreenKey: 'main'
        }
      });

      const mainScreen = await tx.screen.create({
        data: {
          slideshowId: slideshow.id,
          key: 'main',
          width: DEFAULT_RESOLUTION.width,
          height: DEFAULT_RESOLUTION.height
        }
      });
      const sideScreen = await tx.screen.create({
        data: {
          slideshowId: slideshow.id,
          key: 'side',
          width: DEFAULT_RESOLUTION.width,
          height: DEFAULT_RESOLUTION.height
        }
      });

      const mainSlide = await tx.slide.create({
        data: {
          screenId: mainScreen.id,
          orderIndex: 0,
          title: 'Main Screen',
          backgroundColor: '#101622'
        }
      });
      const sideSlide = await tx.slide.create({
        data: {
          screenId: sideScreen.id,
          orderIndex: 0,
          title: 'Side Screen',
          backgroundColor: '#141b2b'
        }
      });

      await tx.slideElement.create({
        data: {
          slideId: mainSlide.id,
          type: 'label',
          x: 140,
          y: 180,
          width: 1200,
          height: 120,
          rotation: 0,
          opacity: 1,
          zIndex: 0,
          animation: 'appear',
          dataJson: JSON.stringify({
            text: 'Main display content',
            fontSize: 64,
            fontFamily: 'Space Grotesk, Segoe UI, Arial',
            color: '#ffffff',
            align: 'left'
          })
        }
      });

      await tx.slideElement.create({
        data: {
          slideId: sideSlide.id,
          type: 'label',
          x: 140,
          y: 180,
          width: 1200,
          height: 120,
          rotation: 0,
          opacity: 1,
          zIndex: 0,
          animation: 'appear',
          dataJson: JSON.stringify({
            text: 'Secondary screen',
            fontSize: 56,
            fontFamily: 'Space Grotesk, Segoe UI, Arial',
            color: '#a9c1ff',
            align: 'left'
          })
        }
      });

      return slideshow;
    });
  }
}

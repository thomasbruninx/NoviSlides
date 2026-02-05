import { prisma } from '@/lib/db/prisma';
import { DisplayRepository } from '@/lib/repositories';
import { eventHub } from './events';

export class DisplayValidationError extends Error {
  code = 'validation_error' as const;
}

export class DisplayNotFoundError extends Error {
  code = 'not_found' as const;
}

export class DisplayService {
  private displayRepo = new DisplayRepository();

  private publishDisplayUnmounted(name: string) {
    eventHub.publish({
      type: 'displayMountChanged',
      displayName: name,
      slideshowId: null,
      at: new Date().toISOString()
    });
  }

  async listDisplays() {
    return this.displayRepo.list();
  }

  async getDisplayByName(name: string) {
    return this.displayRepo.getByName(name);
  }

  async createDisplay(input: { name: string; width: number; height: number }) {
    const name = input.name.trim();
    if (!name) {
      throw new DisplayValidationError('Display name is required');
    }
    const existing = await this.displayRepo.getByName(name);
    if (existing) {
      throw new DisplayValidationError('Display name must be unique');
    }
    return this.displayRepo.create({
      name,
      width: input.width,
      height: input.height
    });
  }

  async updateDisplay(id: string, input: { name?: string; width?: number; height?: number }) {
    const current = await this.displayRepo.getById(id);
    if (!current) {
      throw new DisplayNotFoundError('Display not found');
    }

    const nextName = input.name?.trim();
    if (nextName !== undefined && !nextName) {
      throw new DisplayValidationError('Display name is required');
    }
    if (nextName && nextName !== current.name) {
      const existing = await this.displayRepo.getByName(nextName);
      if (existing && existing.id !== id) {
        throw new DisplayValidationError('Display name must be unique');
      }
    }

    return this.displayRepo.update(id, {
      ...(nextName !== undefined ? { name: nextName } : {}),
      ...(input.width !== undefined ? { width: input.width } : {}),
      ...(input.height !== undefined ? { height: input.height } : {})
    });
  }

  async deleteDisplay(id: string) {
    const display = await this.displayRepo.getById(id);
    if (!display) {
      throw new DisplayNotFoundError('Display not found');
    }
    await this.displayRepo.delete(id);
    this.publishDisplayUnmounted(display.name);
    return display;
  }

  async mountSlideshow(displayId: string, slideshowId: string) {
    const result = await prisma.$transaction(async (tx) => {
      const display = await tx.display.findUnique({ where: { id: displayId } });
      if (!display) {
        throw new DisplayNotFoundError('Display not found');
      }

      const slideshow = await tx.slideshow.findUnique({ where: { id: slideshowId } });
      if (!slideshow) {
        throw new DisplayNotFoundError('Slideshow not found');
      }

      const prevForSlideshow = await tx.display.findFirst({
        where: { mountedSlideshowId: slideshowId }
      });

      if (prevForSlideshow && prevForSlideshow.id !== display.id) {
        await tx.display.update({
          where: { id: prevForSlideshow.id },
          data: { mountedSlideshowId: null }
        });
      }

      const updated = await tx.display.update({
        where: { id: display.id },
        data: { mountedSlideshowId: slideshowId }
      });

      return { updated, prevForSlideshow };
    });

    const affectedNames = new Set<string>();
    affectedNames.add(result.updated.name);
    if (result.prevForSlideshow && result.prevForSlideshow.id !== result.updated.id) {
      affectedNames.add(result.prevForSlideshow.name);
    }

    const affectedDisplays = await prisma.display.findMany({
      where: { name: { in: Array.from(affectedNames) } }
    });
    for (const display of affectedDisplays) {
      eventHub.publish({
        type: 'displayMountChanged',
        displayName: display.name,
        slideshowId: display.mountedSlideshowId ?? null,
        at: new Date().toISOString()
      });
    }

    return result.updated;
  }

  async unmountSlideshow(slideshowId: string) {
    const mountedDisplays = await prisma.display.findMany({
      where: { mountedSlideshowId: slideshowId },
      select: { id: true, name: true }
    });
    if (!mountedDisplays.length) {
      return { unmountedCount: 0 };
    }

    await prisma.display.updateMany({
      where: { id: { in: mountedDisplays.map((display) => display.id) } },
      data: { mountedSlideshowId: null }
    });

    for (const display of mountedDisplays) {
      this.publishDisplayUnmounted(display.name);
    }

    return { unmountedCount: mountedDisplays.length };
  }

  async unmountAllDisplays() {
    const mountedDisplays = await prisma.display.findMany({
      where: { mountedSlideshowId: { not: null } },
      select: { id: true, name: true }
    });
    if (!mountedDisplays.length) {
      return { unmountedCount: 0 };
    }

    await prisma.display.updateMany({
      where: { id: { in: mountedDisplays.map((display) => display.id) } },
      data: { mountedSlideshowId: null }
    });

    for (const display of mountedDisplays) {
      this.publishDisplayUnmounted(display.name);
    }

    return { unmountedCount: mountedDisplays.length };
  }
}

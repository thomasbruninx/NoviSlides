import { prisma } from '@/lib/db/prisma';
import type { Prisma } from '@prisma/client';
import { SlideRepository } from '@/lib/repositories';
import { bumpScreenRevision } from './ScreenRevisionService';
import { eventHub } from './events';

export class SlideService {
  private slideRepo = new SlideRepository();

  async listByScreen(screenId: string) {
    return this.slideRepo.listByScreen(screenId);
  }

  async createSlide(
    screenId: string,
    input: {
      title?: string;
      autoSlideMsOverride?: number | null;
      backgroundColor?: string | null;
      backgroundImagePath?: string | null;
      transitionOverride?: string | null;
    }
  ) {
    const result = await prisma.$transaction(async (tx) => {
      const orderIndex = await tx.slide.count({ where: { screenId } });
      const created = await tx.slide.create({
        data: {
          screen: { connect: { id: screenId } },
          orderIndex,
          title: input.title,
          autoSlideMsOverride: input.autoSlideMsOverride ?? null,
          backgroundColor: input.backgroundColor ?? null,
          backgroundImagePath: input.backgroundImagePath ?? null,
          transitionOverride: input.transitionOverride ?? null
        }
      });
      const revisionInfo = await bumpScreenRevision(screenId, tx);
      return { created, revisionInfo };
    });

    eventHub.publish({
      type: 'screenChanged',
      slideshowId: result.revisionInfo.slideshowId,
      screenKey: result.revisionInfo.screenKey,
      revision: result.revisionInfo.revision,
      at: new Date().toISOString()
    });

    return result.created;
  }

  async updateSlide(id: string, data: Prisma.SlideUpdateInput) {
    const result = await prisma.$transaction(async (tx) => {
      const updated = await tx.slide.update({
        where: { id },
        data
      });
      const revisionInfo = await bumpScreenRevision(updated.screenId, tx);
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

  async deleteSlide(id: string) {
    const result = await prisma.$transaction(async (tx) => {
      const deleted = await tx.slide.delete({
        where: { id }
      });
      const revisionInfo = await bumpScreenRevision(deleted.screenId, tx);
      return { deleted, revisionInfo };
    });

    eventHub.publish({
      type: 'screenChanged',
      slideshowId: result.revisionInfo.slideshowId,
      screenKey: result.revisionInfo.screenKey,
      revision: result.revisionInfo.revision,
      at: new Date().toISOString()
    });

    return result.deleted;
  }

  async reorderSlides(screenId: string, orderedIds: string[]) {
    const result = await prisma.$transaction(async (tx) => {
      const updates = await Promise.all(
        orderedIds.map((id, index) =>
          tx.slide.update({
            where: { id },
            data: { orderIndex: index }
          })
        )
      );
      const revisionInfo = await bumpScreenRevision(screenId, tx);
      return { updates, revisionInfo };
    });

    eventHub.publish({
      type: 'screenChanged',
      slideshowId: result.revisionInfo.slideshowId,
      screenKey: result.revisionInfo.screenKey,
      revision: result.revisionInfo.revision,
      at: new Date().toISOString()
    });

    return result.updates;
  }
}

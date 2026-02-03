import { prisma } from '@/lib/db/prisma';
import type { Prisma } from '@prisma/client';
import { bumpScreenRevision } from './ScreenRevisionService';
import { eventHub } from './events';

export class ElementService {
  async createElement(
    slideId: string,
    input: {
      type: string;
      x: number;
      y: number;
      width: number;
      height: number;
      rotation?: number;
      opacity?: number;
      zIndex?: number;
      animation?: string;
      dataJson: string;
    }
  ) {
    const result = await prisma.$transaction(async (tx) => {
      const slide = await tx.slide.findUnique({
        where: { id: slideId },
        select: { screenId: true }
      });
      if (!slide) {
        throw new Error('Slide not found');
      }

      const created = await tx.slideElement.create({
        data: {
          slide: { connect: { id: slideId } },
          type: input.type,
          x: input.x,
          y: input.y,
          width: input.width,
          height: input.height,
          rotation: input.rotation ?? 0,
          opacity: input.opacity ?? 1,
          zIndex: input.zIndex ?? 0,
          animation: input.animation ?? 'none',
          dataJson: input.dataJson
        }
      });
      const revisionInfo = await bumpScreenRevision(slide.screenId, tx);
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

  async updateElement(id: string, data: Prisma.SlideElementUpdateInput) {
    const result = await prisma.$transaction(async (tx) => {
      const updated = await tx.slideElement.update({
        where: { id },
        data,
        include: { slide: { select: { screenId: true } } }
      });
      const revisionInfo = await bumpScreenRevision(updated.slide.screenId, tx);
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

  async deleteElement(id: string) {
    const result = await prisma.$transaction(async (tx) => {
      const deleted = await tx.slideElement.delete({
        where: { id },
        include: { slide: { select: { screenId: true } } }
      });
      const revisionInfo = await bumpScreenRevision(deleted.slide.screenId, tx);
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

  async reorderElements(slideId: string, orderedIds: string[]) {
    const result = await prisma.$transaction(async (tx) => {
      const slide = await tx.slide.findUnique({
        where: { id: slideId },
        select: { screenId: true }
      });
      if (!slide) {
        throw new Error('Slide not found');
      }

      const updates = await Promise.all(
        orderedIds.map((id, index) =>
          tx.slideElement.update({
            where: { id },
            data: { zIndex: index }
          })
        )
      );
      const revisionInfo = await bumpScreenRevision(slide.screenId, tx);
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

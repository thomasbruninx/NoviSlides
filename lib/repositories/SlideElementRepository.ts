import { prisma } from '../db/prisma';
import type { Prisma } from '@prisma/client';

export class SlideElementRepository {
  async create(data: Prisma.SlideElementCreateInput) {
    return prisma.slideElement.create({ data });
  }

  async update(id: string, data: Prisma.SlideElementUpdateInput) {
    return prisma.slideElement.update({ where: { id }, data });
  }

  async delete(id: string) {
    return prisma.slideElement.delete({ where: { id } });
  }

  async reorderZ(slideId: string, orderedIds: string[]) {
    return prisma.$transaction(
      orderedIds.map((id, index) =>
        prisma.slideElement.update({
          where: { id },
          data: { zIndex: index }
        })
      )
    );
  }

  async countByMediaAssetId(mediaAssetId: string) {
    const marker = `\"mediaAssetId\":\"${mediaAssetId}\"`;
    return prisma.slideElement.count({
      where: {
        dataJson: {
          contains: marker
        }
      }
    });
  }
}

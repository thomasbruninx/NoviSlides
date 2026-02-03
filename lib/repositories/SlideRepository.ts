import { prisma } from '../db/prisma';
import type { Prisma } from '@prisma/client';

export class SlideRepository {
  async listByScreen(screenId: string) {
    return prisma.slide.findMany({
      where: { screenId },
      orderBy: { orderIndex: 'asc' },
      include: { elements: { orderBy: { zIndex: 'asc' } } }
    });
  }

  async getById(id: string) {
    return prisma.slide.findUnique({
      where: { id },
      include: { elements: true }
    });
  }

  async create(data: Prisma.SlideCreateInput) {
    return prisma.slide.create({ data });
  }

  async update(id: string, data: Prisma.SlideUpdateInput) {
    return prisma.slide.update({ where: { id }, data });
  }

  async delete(id: string) {
    return prisma.slide.delete({ where: { id } });
  }

  async reorder(screenId: string, orderedIds: string[]) {
    return prisma.$transaction(
      orderedIds.map((id, index) =>
        prisma.slide.update({
          where: { id },
          data: { orderIndex: index }
        })
      )
    );
  }
}

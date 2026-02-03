import { prisma } from '../db/prisma';
import type { Prisma } from '@prisma/client';

export class ScreenRepository {
  async listBySlideshow(slideshowId: string) {
    return prisma.screen.findMany({
      where: { slideshowId },
      orderBy: { createdAt: 'asc' }
    });
  }

  async getById(id: string) {
    return prisma.screen.findUnique({ where: { id } });
  }

  async getByKey(slideshowId: string, key: string) {
    return prisma.screen.findUnique({
      where: { slideshowId_key: { slideshowId, key } }
    });
  }

  async create(data: Prisma.ScreenCreateInput) {
    return prisma.screen.create({ data });
  }

  async update(id: string, data: Prisma.ScreenUpdateInput) {
    return prisma.screen.update({ where: { id }, data });
  }

  async delete(id: string) {
    return prisma.screen.delete({ where: { id } });
  }
}

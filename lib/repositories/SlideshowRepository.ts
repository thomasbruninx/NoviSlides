import { prisma } from '../db/prisma';
import type { Prisma } from '@prisma/client';

export class SlideshowRepository {
  async list() {
    return prisma.slideshow.findMany({ orderBy: { createdAt: 'desc' } });
  }

  async getById(id: string) {
    return prisma.slideshow.findUnique({ where: { id } });
  }

  async getByIdWithScreens(id: string) {
    return prisma.slideshow.findUnique({
      where: { id },
      include: { screens: true }
    });
  }

  async getByIdWithDeck(id: string) {
    return prisma.slideshow.findUnique({
      where: { id },
      include: {
        screens: {
          orderBy: { createdAt: 'asc' },
          include: {
            slides: {
              orderBy: { orderIndex: 'asc' },
              include: {
                elements: {
                  orderBy: { zIndex: 'asc' }
                }
              }
            }
          }
        }
      }
    });
  }

  async create(data: Prisma.SlideshowCreateInput) {
    return prisma.slideshow.create({ data });
  }

  async update(id: string, data: Prisma.SlideshowUpdateInput) {
    return prisma.slideshow.update({ where: { id }, data });
  }

  async delete(id: string) {
    return prisma.slideshow.delete({ where: { id } });
  }
}

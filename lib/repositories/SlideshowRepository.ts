import { prisma } from '../db/prisma';
import type { Prisma, Slideshow } from '@prisma/client';

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

  async getActive() {
    return prisma.slideshow.findFirst({ where: { isActive: true } });
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

  async activate(id: string) {
    return prisma.$transaction(async (tx) => {
      await tx.slideshow.updateMany({ data: { isActive: false } });
      return tx.slideshow.update({ where: { id }, data: { isActive: true } });
    });
  }

  async deactivate(id: string) {
    return prisma.slideshow.update({ where: { id }, data: { isActive: false } });
  }
}

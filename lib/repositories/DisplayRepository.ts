import { prisma } from '../db/prisma';
import type { Prisma } from '@prisma/client';

export class DisplayRepository {
  async list() {
    return prisma.display.findMany({
      orderBy: { name: 'asc' }
    });
  }

  async getById(id: string) {
    return prisma.display.findUnique({ where: { id } });
  }

  async getByName(name: string) {
    return prisma.display.findUnique({ where: { name } });
  }

  async create(data: Prisma.DisplayCreateInput) {
    return prisma.display.create({ data });
  }

  async update(id: string, data: Prisma.DisplayUpdateInput) {
    return prisma.display.update({ where: { id }, data });
  }

  async delete(id: string) {
    return prisma.display.delete({ where: { id } });
  }
}

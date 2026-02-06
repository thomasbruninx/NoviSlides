import type { Prisma } from '@prisma/client';
import { prisma } from '../db/prisma';

export class EditorSessionRepository {
  async create(data: Prisma.EditorSessionCreateInput) {
    return prisma.editorSession.create({ data });
  }

  async findByTokenHash(tokenHash: string) {
    return prisma.editorSession.findUnique({ where: { tokenHash } });
  }

  async deleteByTokenHash(tokenHash: string) {
    return prisma.editorSession.deleteMany({ where: { tokenHash } });
  }

  async deleteAll() {
    return prisma.editorSession.deleteMany({});
  }

  async deleteExpired(now = new Date()) {
    return prisma.editorSession.deleteMany({
      where: {
        expiresAt: {
          lte: now
        }
      }
    });
  }
}

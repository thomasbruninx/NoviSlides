import { prisma } from '../db/prisma';

export class EditorAuthRepository {
  async getConfig() {
    return prisma.editorAuth.findUnique({ where: { id: 'default' } });
  }

  async createConfig(passwordHash: string) {
    return prisma.editorAuth.create({
      data: {
        id: 'default',
        passwordHash
      }
    });
  }

  async updatePasswordHash(passwordHash: string) {
    return prisma.editorAuth.update({
      where: { id: 'default' },
      data: { passwordHash }
    });
  }
}

import { prisma } from '../db/prisma';

export class TenantSettingsRepository {
  async getSettings() {
    return prisma.tenantSettings.findUnique({ where: { id: 'default' } });
  }

  async upsertSettings(data: { googleFontsApiKey?: string | null }) {
    return prisma.tenantSettings.upsert({
      where: { id: 'default' },
      create: {
        id: 'default',
        googleFontsApiKey: data.googleFontsApiKey ?? null
      },
      update: {
        googleFontsApiKey: data.googleFontsApiKey ?? null
      }
    });
  }
}

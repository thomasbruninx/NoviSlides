import type { TenantSettings } from '@prisma/client';
import { TenantSettingsRepository } from '@/lib/repositories';

const startupGoogleFontsApiKey = process.env.GOOGLE_FONTS_API_KEY?.trim() || null;

export class TenantSettingsService {
  private tenantSettingsRepo = new TenantSettingsRepository();

  isGoogleFontsApiKeyManagedByEnv(): boolean {
    return Boolean(startupGoogleFontsApiKey);
  }

  private async syncStartupGoogleFontsApiKey(settings: TenantSettings): Promise<TenantSettings> {
    if (!startupGoogleFontsApiKey) {
      return settings;
    }
    if (settings.googleFontsApiKey === startupGoogleFontsApiKey) {
      return settings;
    }
    return this.tenantSettingsRepo.upsertSettings({ googleFontsApiKey: startupGoogleFontsApiKey });
  }

  async getSettings(): Promise<TenantSettings> {
    const existing = await this.tenantSettingsRepo.getSettings();
    if (existing) {
      return this.syncStartupGoogleFontsApiKey(existing);
    }
    const created = await this.tenantSettingsRepo.upsertSettings({
      googleFontsApiKey: startupGoogleFontsApiKey
    });
    return this.syncStartupGoogleFontsApiKey(created);
  }

  async updateSettings(input: { googleFontsApiKey?: string | null }): Promise<TenantSettings> {
    if (startupGoogleFontsApiKey) {
      return this.getSettings();
    }
    const trimmedKey = input.googleFontsApiKey?.trim();
    return this.tenantSettingsRepo.upsertSettings({
      googleFontsApiKey: trimmedKey ? trimmedKey : null
    });
  }

  async getGoogleFontsApiKey(): Promise<string | null> {
    const settings = await this.getSettings();
    return settings.googleFontsApiKey;
  }
}

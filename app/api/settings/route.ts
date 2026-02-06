import { z } from 'zod';
import { TenantSettingsService } from '@/lib/services';
import { toTenantSettingsDto } from '@/lib/utils/serializers';
import { fail, ok } from '@/lib/utils/respond';
import { updateTenantSettingsSchema } from '@/lib/validation';

export async function GET() {
  try {
    const service = new TenantSettingsService();
    const settings = await service.getSettings();
    return ok(toTenantSettingsDto(settings, service.isGoogleFontsApiKeyManagedByEnv()));
  } catch (error) {
    console.error('GET /api/settings', error);
    return fail('server_error', 'Failed to fetch settings', 500);
  }
}

export async function PUT(request: Request) {
  try {
    const payload = updateTenantSettingsSchema.parse(await request.json());
    const service = new TenantSettingsService();
    const updated = await service.updateSettings(payload);
    return ok(toTenantSettingsDto(updated, service.isGoogleFontsApiKeyManagedByEnv()));
  } catch (error) {
    if (error instanceof z.ZodError) {
      return fail('validation_error', 'Invalid settings payload', 400, error.flatten());
    }
    console.error('PUT /api/settings', error);
    return fail('server_error', 'Failed to update settings', 500);
  }
}

export const dynamic = 'force-dynamic';

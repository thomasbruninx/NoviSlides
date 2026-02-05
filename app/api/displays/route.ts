import { z } from 'zod';
import { DisplayService, DisplayValidationError } from '@/lib/services';
import { createDisplaySchema } from '@/lib/validation';
import { fail, ok } from '@/lib/utils/respond';
import { toDisplayDto } from '@/lib/utils/serializers';

export async function GET() {
  try {
    const service = new DisplayService();
    const displays = await service.listDisplays();
    return ok(displays.map(toDisplayDto));
  } catch (error) {
    console.error('GET /api/displays', error);
    return fail('server_error', 'Failed to fetch displays', 500);
  }
}

export async function POST(request: Request) {
  try {
    const payload = createDisplaySchema.parse(await request.json());
    const service = new DisplayService();
    const created = await service.createDisplay(payload);
    return ok(toDisplayDto(created), 201);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return fail('validation_error', 'Invalid display payload', 400, error.flatten());
    }
    if (error instanceof DisplayValidationError) {
      return fail('validation_error', error.message, 400);
    }
    console.error('POST /api/displays', error);
    return fail('server_error', 'Failed to create display', 500);
  }
}

export const dynamic = 'force-dynamic';

import { z } from 'zod';
import { SlideshowTransferService } from '@/lib/services';
import { slideshowImportSchema } from '@/lib/validation';
import { fail, ok } from '@/lib/utils/respond';

export async function POST(request: Request) {
  try {
    const payload = slideshowImportSchema.parse(await request.json());
    const service = new SlideshowTransferService();
    const created = await service.importSlideshow(payload.data, payload.nameOverride);
    return ok(created, 201);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return fail('validation_error', 'Invalid slideshow import', 400, error.flatten());
    }
    console.error('POST /api/slideshows/import', error);
    return fail('server_error', 'Failed to import slideshow', 500);
  }
}

export const dynamic = 'force-dynamic';

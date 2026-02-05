import { z } from 'zod';
import { SlideshowTransferService } from '@/lib/services';
import { fail, ok } from '@/lib/utils/respond';

export async function GET(_: Request, { params }: { params: { id: string } }) {
  try {
    const service = new SlideshowTransferService();
    const payload = await service.exportSlideshow(params.id);
    return ok(payload);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return fail('validation_error', 'Invalid export request', 400, error.flatten());
    }
    console.error('GET /api/slideshows/:id/export', error);
    return fail('server_error', 'Failed to export slideshow', 500);
  }
}

export const dynamic = 'force-dynamic';

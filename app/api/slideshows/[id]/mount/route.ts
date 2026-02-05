import { z } from 'zod';
import { DisplayNotFoundError, DisplayService } from '@/lib/services';
import { mountSlideshowSchema } from '@/lib/validation';
import { fail, ok } from '@/lib/utils/respond';
import { toDisplayDto } from '@/lib/utils/serializers';

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const payload = mountSlideshowSchema.parse(await request.json());
    const service = new DisplayService();
    const mounted = await service.mountSlideshow(payload.displayId, params.id);
    return ok(toDisplayDto(mounted));
  } catch (error) {
    if (error instanceof z.ZodError) {
      return fail('validation_error', 'Invalid mount payload', 400, error.flatten());
    }
    if (error instanceof DisplayNotFoundError) {
      return fail('not_found', error.message, 404);
    }
    console.error('POST /api/slideshows/:id/mount', error);
    return fail('server_error', 'Failed to mount slideshow', 500);
  }
}

export const dynamic = 'force-dynamic';

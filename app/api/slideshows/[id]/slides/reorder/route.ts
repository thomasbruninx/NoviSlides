import { z } from 'zod';
import { SlideService, SlideshowService } from '@/lib/services';
import { reorderSlidesSchema } from '@/lib/validation';
import { fail, ok } from '@/lib/utils/respond';

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const params = await context.params;
  try {
    const payload = reorderSlidesSchema.parse(await request.json());
    const slideshowService = new SlideshowService();
    const screen = await slideshowService.ensureDefaultScreen(params.id);
    if (!screen) {
      return fail('not_found', 'Slideshow not found', 404);
    }
    const service = new SlideService();
    const reordered = await service.reorderSlides(screen.id, payload.orderedIds);
    return ok(reordered);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return fail('validation_error', 'Invalid reorder payload', 400, error.flatten());
    }
    console.error('POST /api/slideshows/:id/slides/reorder', error);
    return fail('server_error', 'Failed to reorder slides', 500);
  }
}

export const dynamic = 'force-dynamic';

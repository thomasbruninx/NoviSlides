import { z } from 'zod';
import { SlideService } from '@/lib/services';
import { updateSlideSchema } from '@/lib/validation';
import { fail, ok } from '@/lib/utils/respond';

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const payload = updateSlideSchema.parse(await request.json());
    const service = new SlideService();
    const updated = await service.updateSlide(params.id, {
      title: payload.title,
      autoSlideMsOverride:
        payload.autoSlideMsOverride === null ? null : payload.autoSlideMsOverride ?? undefined,
      backgroundColor:
        payload.backgroundColor === null ? null : payload.backgroundColor ?? undefined,
      backgroundImagePath:
        payload.backgroundImagePath === null ? null : payload.backgroundImagePath ?? undefined,
      backgroundImageSize:
        payload.backgroundImageSize === null ? null : payload.backgroundImageSize ?? undefined,
      backgroundImagePosition:
        payload.backgroundImagePosition === null ? null : payload.backgroundImagePosition ?? undefined,
      transitionOverride:
        payload.transitionOverride === null ? null : payload.transitionOverride ?? undefined,
      orderIndex: payload.orderIndex
    });
    return ok(updated);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return fail('validation_error', 'Invalid slide payload', 400, error.flatten());
    }
    console.error('PUT /api/slides/:id', error);
    return fail('server_error', 'Failed to update slide', 500);
  }
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  try {
    const service = new SlideService();
    const deleted = await service.deleteSlide(params.id);
    return ok(deleted);
  } catch (error) {
    console.error('DELETE /api/slides/:id', error);
    return fail('server_error', 'Failed to delete slide', 500);
  }
}

export const dynamic = 'force-dynamic';

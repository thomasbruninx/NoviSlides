import { z } from 'zod';
import { SlideshowService } from '@/lib/services';
import { updateSlideshowSchema } from '@/lib/validation';
import { fail, ok } from '@/lib/utils/respond';

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const service = new SlideshowService();
  const slideshow = await service.getSlideshowWithScreens(params.id);
  if (!slideshow) {
    return fail('not_found', 'Slideshow not found', 404);
  }
  return ok(slideshow);
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const payload = updateSlideshowSchema.parse(await request.json());
    const service = new SlideshowService();
    const updated = await service.updateSlideshow(params.id, payload);
    return ok(updated);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return fail('validation_error', 'Invalid slideshow payload', 400, error.flatten());
    }
    console.error('PUT /api/slideshows/:id', error);
    return fail('server_error', 'Failed to update slideshow', 500);
  }
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  try {
    const service = new SlideshowService();
    const deleted = await service.deleteSlideshow(params.id);
    return ok(deleted);
  } catch (error) {
    console.error('DELETE /api/slideshows/:id', error);
    return fail('server_error', 'Failed to delete slideshow', 500);
  }
}

export const dynamic = 'force-dynamic';

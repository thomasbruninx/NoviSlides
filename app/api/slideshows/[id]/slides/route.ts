import { z } from 'zod';
import { SlideRepository } from '@/lib/repositories';
import { SlideService, SlideshowService } from '@/lib/services';
import { toSlideDto, toSlideElementDto } from '@/lib/utils/serializers';
import { createSlideSchema } from '@/lib/validation';
import { fail, ok } from '@/lib/utils/respond';

export async function GET(_: Request, { params }: { params: { id: string } }) {
  try {
    const slideshowService = new SlideshowService();
    const screen = await slideshowService.ensureDefaultScreen(params.id);
    if (!screen) {
      return fail('not_found', 'Slideshow not found', 404);
    }
    const repo = new SlideRepository();
    const slides = await repo.listByScreen(screen.id);
    const dto = slides.map((slide) => ({
      ...toSlideDto(slide),
      elements: slide.elements.map(toSlideElementDto)
    }));
    return ok(dto);
  } catch (error) {
    console.error('GET /api/slideshows/:id/slides', error);
    return fail('server_error', 'Failed to fetch slides', 500);
  }
}

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const payload = createSlideSchema.parse(await request.json());
    const slideshowService = new SlideshowService();
    const screen = await slideshowService.ensureDefaultScreen(params.id);
    if (!screen) {
      return fail('not_found', 'Slideshow not found', 404);
    }
    const service = new SlideService();
    const created = await service.createSlide(screen.id, payload);
    return ok(created, 201);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return fail('validation_error', 'Invalid slide payload', 400, error.flatten());
    }
    console.error('POST /api/slideshows/:id/slides', error);
    return fail('server_error', 'Failed to create slide', 500);
  }
}

export const dynamic = 'force-dynamic';

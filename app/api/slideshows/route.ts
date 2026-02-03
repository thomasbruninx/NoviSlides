import { z } from 'zod';
import { SlideshowService } from '@/lib/services';
import { createSlideshowSchema } from '@/lib/validation';
import { fail, ok } from '@/lib/utils/respond';

export async function GET() {
  const service = new SlideshowService();
  const slideshows = await service.listSlideshows();
  return ok(slideshows);
}

export async function POST(request: Request) {
  try {
    const payload = createSlideshowSchema.parse(await request.json());
    const service = new SlideshowService();
    const slideshow = await service.createSlideshow(payload);
    return ok(slideshow, 201);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return fail('validation_error', 'Invalid slideshow payload', 400, error.flatten());
    }
    console.error('POST /api/slideshows', error);
    return fail('server_error', 'Failed to create slideshow', 500);
  }
}

export const dynamic = 'force-dynamic';

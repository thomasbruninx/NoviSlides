import { SlideshowService } from '@/lib/services';
import { fail, ok } from '@/lib/utils/respond';

export async function POST() {
  try {
    const service = new SlideshowService();
    const slideshow = await service.createDemoSlideshow();
    return ok(slideshow, 201);
  } catch (error) {
    console.error('POST /api/slideshows/demo', error);
    return fail('server_error', 'Failed to create demo slideshow', 500);
  }
}

export const dynamic = 'force-dynamic';

import { SlideshowService } from '@/lib/services';
import { fail, ok } from '@/lib/utils/respond';

export async function GET() {
  const service = new SlideshowService();
  const slideshow = await service.getActiveSlideshow();
  if (!slideshow) {
    return fail('not_found', 'No active slideshow', 404);
  }
  return ok(slideshow);
}

export const dynamic = 'force-dynamic';

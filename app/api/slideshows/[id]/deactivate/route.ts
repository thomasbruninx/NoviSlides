import { SlideshowService } from '@/lib/services';
import { fail, ok } from '@/lib/utils/respond';

export async function POST(_: Request, { params }: { params: { id: string } }) {
  try {
    const service = new SlideshowService();
    const slideshow = await service.deactivateSlideshow(params.id);
    return ok(slideshow);
  } catch (error) {
    console.error('POST /api/slideshows/:id/deactivate', error);
    return fail('server_error', 'Failed to deactivate slideshow', 500);
  }
}

export const dynamic = 'force-dynamic';

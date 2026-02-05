import { SlideshowService } from '@/lib/services';
import { fail, ok } from '@/lib/utils/respond';
import { toScreenDto } from '@/lib/utils/serializers';

export async function GET(_: Request, { params }: { params: { id: string } }) {
  try {
    const service = new SlideshowService();
    const screen = await service.ensureDefaultScreen(params.id);
    if (!screen) {
      return fail('not_found', 'Slideshow not found', 404);
    }
    return ok(toScreenDto(screen));
  } catch (error) {
    console.error('GET /api/slideshows/:id/screen', error);
    return fail('server_error', 'Failed to fetch default screen', 500);
  }
}

export const dynamic = 'force-dynamic';

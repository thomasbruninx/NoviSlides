import { DisplayService } from '@/lib/services';
import { fail, ok } from '@/lib/utils/respond';

export async function POST(_: Request, context: { params: Promise<{ id: string }> }) {
  const params = await context.params;
  try {
    const service = new DisplayService();
    const result = await service.unmountSlideshow(params.id);
    return ok(result);
  } catch (error) {
    console.error('POST /api/slideshows/:id/unmount', error);
    return fail('server_error', 'Failed to unmount slideshow', 500);
  }
}

export const dynamic = 'force-dynamic';

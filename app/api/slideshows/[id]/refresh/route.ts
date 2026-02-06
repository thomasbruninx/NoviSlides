import { ScreenRefreshService, SlideshowService } from '@/lib/services';
import { fail, ok } from '@/lib/utils/respond';

export async function POST(_: Request, context: { params: Promise<{ id: string }> }) {
  const params = await context.params;
  try {
    const slideshowService = new SlideshowService();
    const screen = await slideshowService.ensureDefaultScreen(params.id);
    if (!screen) {
      return fail('not_found', 'Slideshow not found', 404);
    }
    const refreshService = new ScreenRefreshService();
    const revisionInfo = await refreshService.refreshScreen(screen.id);
    return ok({ revision: revisionInfo.revision });
  } catch (error) {
    console.error('POST /api/slideshows/:id/refresh', error);
    return fail('server_error', 'Failed to refresh slideshow', 500);
  }
}

export const dynamic = 'force-dynamic';

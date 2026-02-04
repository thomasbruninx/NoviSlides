import { ScreenRefreshService } from '@/lib/services';
import { fail, ok } from '@/lib/utils/respond';

export async function POST(_: Request, { params }: { params: { id: string } }) {
  try {
    const service = new ScreenRefreshService();
    const revisionInfo = await service.refreshScreen(params.id);
    return ok(revisionInfo);
  } catch (error) {
    console.error('POST /api/screens/:id/refresh', error);
    return fail('server_error', 'Failed to refresh screen', 500);
  }
}

export const dynamic = 'force-dynamic';

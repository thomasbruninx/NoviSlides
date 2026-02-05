import { DisplayService } from '@/lib/services';
import { fail, ok } from '@/lib/utils/respond';

export async function POST() {
  try {
    const service = new DisplayService();
    const result = await service.unmountAllDisplays();
    return ok(result);
  } catch (error) {
    console.error('POST /api/displays/unmount-all', error);
    return fail('server_error', 'Failed to unmount displays', 500);
  }
}

export const dynamic = 'force-dynamic';

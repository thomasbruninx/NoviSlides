import { FontService } from '@/lib/services';
import { fail, ok } from '@/lib/utils/respond';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const query = url.searchParams.get('query') ?? '';
    const limit = Number(url.searchParams.get('limit') ?? '30');
    const service = new FontService();
    const result = await service.listFonts(query, limit);
    return ok(result);
  } catch (error) {
    console.error('GET /api/fonts', error);
    return fail('server_error', 'Failed to fetch fonts', 500);
  }
}

export const dynamic = 'force-dynamic';

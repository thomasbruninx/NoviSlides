import { z } from 'zod';
import { MediaService } from '@/lib/services';
import { mediaListQuerySchema } from '@/lib/validation';
import { fail, ok } from '@/lib/utils/respond';
import { toMediaAssetDto } from '@/lib/utils/serializers';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const parsed = mediaListQuerySchema.parse({
      q: url.searchParams.get('q') ?? undefined,
      kind: url.searchParams.get('kind') ?? undefined,
      page: url.searchParams.get('page') ?? undefined,
      pageSize: url.searchParams.get('pageSize') ?? undefined,
      sort: url.searchParams.get('sort') ?? undefined
    });

    const service = new MediaService();
    const result = await service.list(parsed);

    return ok({
      items: result.items.map(toMediaAssetDto),
      page: result.page,
      pageSize: result.pageSize,
      total: result.total,
      totalPages: result.totalPages
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return fail('validation_error', 'Invalid query parameters', 400, error.flatten());
    }
    console.error('GET /api/media', error);
    return fail('server_error', 'Failed to fetch media', 500);
  }
}

export const dynamic = 'force-dynamic';

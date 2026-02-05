import { z } from 'zod';
import { IconService } from '@/lib/services';
import { iconListQuerySchema } from '@/lib/validation';
import { fail, ok } from '@/lib/utils/respond';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const parsed = iconListQuerySchema.parse({
      query: url.searchParams.get('query') ?? undefined,
      style: url.searchParams.get('style') ?? undefined,
      page: url.searchParams.get('page') ?? undefined,
      pageSize: url.searchParams.get('pageSize') ?? undefined
    });
    const service = new IconService();
    const result = service.listIcons(parsed.style, parsed.query, parsed.page, parsed.pageSize);
    return ok(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return fail('validation_error', 'Invalid icon query', 400, error.flatten());
    }
    console.error('GET /api/icons', error);
    return fail('server_error', 'Failed to fetch icons', 500);
  }
}

export const dynamic = 'force-dynamic';

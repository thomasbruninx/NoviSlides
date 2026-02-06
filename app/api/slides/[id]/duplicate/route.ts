import { SlideService } from '@/lib/services';
import { fail, ok } from '@/lib/utils/respond';
import { toSlideDto } from '@/lib/utils/serializers';

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const params = await context.params;
  try {
    const service = new SlideService();
    const created = await service.duplicateSlide(params.id);
    return ok(toSlideDto(created), 201);
  } catch (error) {
    if (error instanceof Error && error.message === 'Slide not found') {
      return fail('not_found', 'Slide not found', 404);
    }
    console.error('POST /api/slides/:id/duplicate', error);
    return fail('server_error', 'Failed to duplicate slide', 500);
  }
}

export const dynamic = 'force-dynamic';

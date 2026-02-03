import { z } from 'zod';
import { SlideRepository } from '@/lib/repositories';
import { reorderSlidesSchema } from '@/lib/validation';
import { fail, ok } from '@/lib/utils/respond';

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const payload = reorderSlidesSchema.parse(await request.json());
    const repo = new SlideRepository();
    const result = await repo.reorder(params.id, payload.orderedIds);
    return ok(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return fail('validation_error', 'Invalid reorder payload', 400, error.flatten());
    }
    console.error('POST /api/screens/:id/slides/reorder', error);
    return fail('server_error', 'Failed to reorder slides', 500);
  }
}

export const dynamic = 'force-dynamic';

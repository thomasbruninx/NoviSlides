import { z } from 'zod';
import { SlideElementRepository } from '@/lib/repositories';
import { reorderElementsSchema } from '@/lib/validation';
import { fail, ok } from '@/lib/utils/respond';

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const payload = reorderElementsSchema.parse(await request.json());
    const repo = new SlideElementRepository();
    const result = await repo.reorderZ(params.id, payload.orderedIds);
    return ok(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return fail('validation_error', 'Invalid reorder payload', 400, error.flatten());
    }
    console.error('POST /api/slides/:id/elements/reorderZ', error);
    return fail('server_error', 'Failed to reorder elements', 500);
  }
}

export const dynamic = 'force-dynamic';

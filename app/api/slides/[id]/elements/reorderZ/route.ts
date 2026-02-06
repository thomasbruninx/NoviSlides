import { z } from 'zod';
import { ElementService } from '@/lib/services';
import { reorderElementsSchema } from '@/lib/validation';
import { fail, ok } from '@/lib/utils/respond';

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const params = await context.params;
  try {
    const payload = reorderElementsSchema.parse(await request.json());
    const service = new ElementService();
    const result = await service.reorderElements(params.id, payload.orderedIds);
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

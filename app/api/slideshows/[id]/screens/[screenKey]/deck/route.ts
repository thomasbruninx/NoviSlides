import { z } from 'zod';
import { ViewerService } from '@/lib/services';
import { screenKeySchema } from '@/lib/validation';
import { fail, ok } from '@/lib/utils/respond';

const paramsSchema = z.object({
  id: z.string().min(1),
  screenKey: screenKeySchema
});

export async function GET(_: Request, { params }: { params: { id: string; screenKey: string } }) {
  const parsed = paramsSchema.safeParse(params);
  if (!parsed.success) {
    return fail('validation_error', 'Invalid deck params', 400, parsed.error.flatten());
  }

  const service = new ViewerService();
  const deck = await service.getScreenDeckByKey(parsed.data.id, parsed.data.screenKey);
  if (!deck) {
    return fail('not_found', 'Screen deck not found', 404);
  }

  return ok(deck);
}

export const dynamic = 'force-dynamic';

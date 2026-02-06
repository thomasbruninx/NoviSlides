import { z } from 'zod';
import { DisplayNotFoundError, DisplayService, DisplayValidationError } from '@/lib/services';
import { updateDisplaySchema } from '@/lib/validation';
import { fail, ok } from '@/lib/utils/respond';
import { toDisplayDto } from '@/lib/utils/serializers';

export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
  const params = await context.params;
  try {
    const payload = updateDisplaySchema.parse(await request.json());
    const service = new DisplayService();
    const updated = await service.updateDisplay(params.id, payload);
    return ok(toDisplayDto(updated));
  } catch (error) {
    if (error instanceof z.ZodError) {
      return fail('validation_error', 'Invalid display payload', 400, error.flatten());
    }
    if (error instanceof DisplayNotFoundError) {
      return fail('not_found', error.message, 404);
    }
    if (error instanceof DisplayValidationError) {
      return fail('validation_error', error.message, 400);
    }
    console.error('PUT /api/displays/:id', error);
    return fail('server_error', 'Failed to update display', 500);
  }
}

export async function DELETE(_: Request, context: { params: Promise<{ id: string }> }) {
  const params = await context.params;
  try {
    const service = new DisplayService();
    const deleted = await service.deleteDisplay(params.id);
    return ok(toDisplayDto(deleted));
  } catch (error) {
    if (error instanceof DisplayNotFoundError) {
      return fail('not_found', error.message, 404);
    }
    console.error('DELETE /api/displays/:id', error);
    return fail('server_error', 'Failed to delete display', 500);
  }
}

export const dynamic = 'force-dynamic';

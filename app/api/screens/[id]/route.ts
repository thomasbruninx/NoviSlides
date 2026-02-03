import { z } from 'zod';
import { SlideshowService } from '@/lib/services';
import { updateScreenSchema } from '@/lib/validation';
import { fail, ok } from '@/lib/utils/respond';

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const payload = updateScreenSchema.parse(await request.json());
    const service = new SlideshowService();
    const updated = await service.updateScreen(params.id, payload);
    return ok(updated);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return fail('validation_error', 'Invalid screen payload', 400, error.flatten());
    }
    console.error('PUT /api/screens/:id', error);
    return fail('server_error', 'Failed to update screen', 500);
  }
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  try {
    const service = new SlideshowService();
    const deleted = await service.deleteScreen(params.id);
    if (!deleted) {
      return fail('not_found', 'Screen not found', 404);
    }
    return ok(deleted);
  } catch (error) {
    console.error('DELETE /api/screens/:id', error);
    return fail('server_error', 'Failed to delete screen', 500);
  }
}

export const dynamic = 'force-dynamic';

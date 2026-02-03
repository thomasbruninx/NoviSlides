import { z } from 'zod';
import { SlideElementRepository } from '@/lib/repositories';
import { updateElementSchema } from '@/lib/validation';
import { fail, ok } from '@/lib/utils/respond';
import { toSlideElementDto } from '@/lib/utils/serializers';

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const payload = updateElementSchema.parse(await request.json());
    const repo = new SlideElementRepository();
    const updated = await repo.update(params.id, {
      type: payload.type,
      x: payload.x,
      y: payload.y,
      width: payload.width,
      height: payload.height,
      rotation: payload.rotation,
      opacity: payload.opacity,
      zIndex: payload.zIndex,
      animation: payload.animation,
      dataJson: payload.dataJson ? JSON.stringify(payload.dataJson) : undefined
    });
    return ok(toSlideElementDto(updated));
  } catch (error) {
    if (error instanceof z.ZodError) {
      return fail('validation_error', 'Invalid element payload', 400, error.flatten());
    }
    console.error('PUT /api/elements/:id', error);
    return fail('server_error', 'Failed to update element', 500);
  }
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  try {
    const repo = new SlideElementRepository();
    const deleted = await repo.delete(params.id);
    return ok(toSlideElementDto(deleted));
  } catch (error) {
    console.error('DELETE /api/elements/:id', error);
    return fail('server_error', 'Failed to delete element', 500);
  }
}

export const dynamic = 'force-dynamic';

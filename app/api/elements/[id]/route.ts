import { z } from 'zod';
import { ElementService } from '@/lib/services';
import { updateElementSchema } from '@/lib/validation';
import { fail, ok } from '@/lib/utils/respond';
import { toSlideElementDto } from '@/lib/utils/serializers';

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const payload = updateElementSchema.parse(await request.json());
    const service = new ElementService();
    const updated = await service.updateElement(params.id, {
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
    if ((error as { code?: string }).code === 'P2025') {
      return fail('not_found', 'Element not found', 404);
    }
    if (error instanceof z.ZodError) {
      return fail('validation_error', 'Invalid element payload', 400, error.flatten());
    }
    console.error('PUT /api/elements/:id', error);
    return fail('server_error', 'Failed to update element', 500);
  }
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  try {
    const service = new ElementService();
    const deleted = await service.deleteElement(params.id);
    return ok(toSlideElementDto(deleted));
  } catch (error) {
    console.error('DELETE /api/elements/:id', error);
    return fail('server_error', 'Failed to delete element', 500);
  }
}

export const dynamic = 'force-dynamic';

import { z } from 'zod';
import { ElementService } from '@/lib/services';
import { createElementSchema } from '@/lib/validation';
import { fail, ok } from '@/lib/utils/respond';
import { toSlideElementDto } from '@/lib/utils/serializers';

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const payload = createElementSchema.parse(await request.json());
    const service = new ElementService();
    const created = await service.createElement(params.id, {
      type: payload.type,
      x: payload.x,
      y: payload.y,
      width: payload.width,
      height: payload.height,
      rotation: payload.rotation ?? 0,
      opacity: payload.opacity ?? 1,
      zIndex: payload.zIndex ?? 0,
      animation: payload.animation ?? 'none',
      dataJson: JSON.stringify(payload.dataJson)
    });
    return ok(toSlideElementDto(created), 201);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return fail('validation_error', 'Invalid element payload', 400, error.flatten());
    }
    console.error('POST /api/slides/:id/elements', error);
    return fail('server_error', 'Failed to create element', 500);
  }
}

export const dynamic = 'force-dynamic';

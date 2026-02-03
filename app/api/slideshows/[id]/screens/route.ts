import { z } from 'zod';
import { ScreenRepository } from '@/lib/repositories';
import { SlideshowService } from '@/lib/services';
import { createScreenSchema } from '@/lib/validation';
import { fail, ok } from '@/lib/utils/respond';

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const repo = new ScreenRepository();
  const screens = await repo.listBySlideshow(params.id);
  return ok(screens);
}

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const payload = createScreenSchema.parse(await request.json());
    const service = new SlideshowService();
    const created = await service.createScreen(params.id, payload);
    return ok(created, 201);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return fail('validation_error', 'Invalid screen payload', 400, error.flatten());
    }
    console.error('POST /api/slideshows/:id/screens', error);
    return fail('server_error', 'Failed to create screen', 500);
  }
}

export const dynamic = 'force-dynamic';

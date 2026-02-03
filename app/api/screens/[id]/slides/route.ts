import { z } from 'zod';
import { prisma } from '@/lib/db/prisma';
import { SlideRepository } from '@/lib/repositories';
import { toSlideDto, toSlideElementDto } from '@/lib/utils/serializers';
import { createSlideSchema } from '@/lib/validation';
import { fail, ok } from '@/lib/utils/respond';

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const repo = new SlideRepository();
  const slides = await repo.listByScreen(params.id);
  const dto = slides.map((slide) => ({
    ...toSlideDto(slide),
    elements: slide.elements.map(toSlideElementDto)
  }));
  return ok(dto);
}

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const payload = createSlideSchema.parse(await request.json());
    const orderIndex = await prisma.slide.count({ where: { screenId: params.id } });
    const repo = new SlideRepository();
    const created = await repo.create({
      screen: { connect: { id: params.id } },
      orderIndex,
      title: payload.title,
      autoSlideMsOverride: payload.autoSlideMsOverride ?? null,
      backgroundColor: payload.backgroundColor ?? null,
      backgroundImagePath: payload.backgroundImagePath ?? null,
      transitionOverride: payload.transitionOverride ?? null
    });
    return ok(created, 201);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return fail('validation_error', 'Invalid slide payload', 400, error.flatten());
    }
    console.error('POST /api/screens/:id/slides', error);
    return fail('server_error', 'Failed to create slide', 500);
  }
}

export const dynamic = 'force-dynamic';

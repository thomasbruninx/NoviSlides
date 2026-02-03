import type { Prisma, PrismaClient } from '@prisma/client';
import { prisma } from '@/lib/db/prisma';

export type ScreenRevisionInfo = {
  screenId: string;
  revision: number;
  slideshowId: string;
  screenKey: string;
};

type PrismaClientLike = PrismaClient | Prisma.TransactionClient;

export async function bumpScreenRevision(
  screenId: string,
  tx?: PrismaClientLike
): Promise<ScreenRevisionInfo> {
  const client = tx ?? prisma;
  const updated = await client.screen.update({
    where: { id: screenId },
    data: { revision: { increment: 1 } },
    select: {
      id: true,
      revision: true,
      slideshowId: true,
      key: true
    }
  });
  return {
    screenId: updated.id,
    revision: updated.revision,
    slideshowId: updated.slideshowId,
    screenKey: updated.key
  };
}

export async function bumpAllScreensForSlideshow(
  slideshowId: string,
  tx?: PrismaClientLike
): Promise<ScreenRevisionInfo[]> {
  if (tx) {
    const screens = await tx.screen.findMany({
      where: { slideshowId },
      select: { id: true }
    });
    const updates = await Promise.all(
      screens.map((screen) => bumpScreenRevision(screen.id, tx))
    );
    return updates;
  }

  return prisma.$transaction(async (inner) => {
    const screens = await inner.screen.findMany({
      where: { slideshowId },
      select: { id: true }
    });
    const updates = await Promise.all(
      screens.map((screen) => bumpScreenRevision(screen.id, inner))
    );
    return updates;
  });
}

import { prisma } from '../db/prisma';
import type { Prisma } from '@prisma/client';

export class MediaRepository {
  async create(data: Prisma.MediaAssetCreateInput) {
    return prisma.mediaAsset.create({ data });
  }

  async findById(id: string) {
    return prisma.mediaAsset.findUnique({ where: { id } });
  }

  async delete(id: string) {
    return prisma.mediaAsset.delete({ where: { id } });
  }

  async list(params: {
    q?: string;
    kind?: string;
    skip: number;
    take: number;
    orderBy: Prisma.MediaAssetOrderByWithRelationInput;
  }) {
    const where: Prisma.MediaAssetWhereInput = {
      ...(params.q ? { originalName: { contains: params.q } } : {}),
      ...(params.kind ? { kind: params.kind } : {})
    };

    const [items, total] = await Promise.all([
      prisma.mediaAsset.findMany({
        where,
        skip: params.skip,
        take: params.take,
        orderBy: params.orderBy
      }),
      prisma.mediaAsset.count({ where })
    ]);

    return { items, total };
  }
}

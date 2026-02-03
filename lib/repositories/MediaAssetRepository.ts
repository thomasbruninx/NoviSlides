import { prisma } from '../db/prisma';
import type { Prisma } from '@prisma/client';

export class MediaAssetRepository {
  async create(data: Prisma.MediaAssetCreateInput) {
    return prisma.mediaAsset.create({ data });
  }
}

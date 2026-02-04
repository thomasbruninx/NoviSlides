import { randomUUID } from 'crypto';
import { mkdir, unlink, writeFile } from 'fs/promises';
import path from 'path';
import imageSize from 'image-size';
import type { MediaAsset } from '@prisma/client';
import { MediaRepository, SlideElementRepository } from '../repositories';

const uploadRoot = path.join(process.cwd(), 'public', 'uploads');

const mimeToExtension: Record<string, string> = {
  'image/png': '.png',
  'image/jpeg': '.jpg',
  'image/jpg': '.jpg',
  'image/gif': '.gif',
  'image/webp': '.webp',
  'image/svg+xml': '.svg',
  'video/mp4': '.mp4',
  'video/webm': '.webm'
};

const rasterImageTypes = new Set(['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp']);

export function mediaKindFromMime(mimeType: string) {
  if (mimeType.startsWith('image/')) {
    return 'image' as const;
  }
  if (mimeType.startsWith('video/')) {
    return 'video' as const;
  }
  return null;
}

export class MediaAssetInUseError extends Error {
  code = 'ASSET_IN_USE' as const;
}

export class MediaValidationError extends Error {
  code = 'validation_error' as const;
}

export class MediaService {
  private mediaRepo = new MediaRepository();
  private slideElementRepo = new SlideElementRepository();

  async uploadFiles(files: File[]) {
    const assets: MediaAsset[] = [];
    for (const file of files) {
      const asset = await this.storeFile(file);
      assets.push(asset);
    }
    return assets;
  }

  async list(params: {
    q?: string;
    kind?: 'image' | 'video';
    page: number;
    pageSize: number;
    sort: 'createdAt_desc' | 'createdAt_asc';
  }) {
    const orderBy = { createdAt: params.sort === 'createdAt_desc' ? 'desc' : 'asc' } as const;
    const skip = (params.page - 1) * params.pageSize;
    const { items, total } = await this.mediaRepo.list({
      q: params.q,
      kind: params.kind,
      skip,
      take: params.pageSize,
      orderBy
    });

    const totalPages = Math.max(1, Math.ceil(total / params.pageSize));
    return {
      items,
      page: params.page,
      pageSize: params.pageSize,
      total,
      totalPages
    };
  }

  async getById(id: string) {
    return this.mediaRepo.findById(id);
  }

  async deleteAsset(id: string) {
    const asset = await this.mediaRepo.findById(id);
    if (!asset) {
      return null;
    }

    const inUseCount = await this.slideElementRepo.countByMediaAssetId(id);
    if (inUseCount > 0) {
      throw new MediaAssetInUseError('Media asset is in use');
    }

    const absolutePath = path.join(process.cwd(), 'public', asset.path.replace(/^\/+/, ''));
    try {
      await unlink(absolutePath);
    } catch (error) {
      const err = error as NodeJS.ErrnoException;
      if (err.code !== 'ENOENT') {
        throw error;
      }
    }

    await this.mediaRepo.delete(id);
    return asset;
  }

  private async storeFile(file: File) {
    const mimeType = file.type;
    const extension = mimeToExtension[mimeType];
    if (!extension) {
      throw new MediaValidationError(`Unsupported file type: ${mimeType || 'unknown'}`);
    }

    const kind = mediaKindFromMime(mimeType);
    if (!kind) {
      throw new MediaValidationError(`Unsupported media type: ${mimeType || 'unknown'}`);
    }

    const now = new Date();
    const year = String(now.getFullYear());
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const directory = path.join(uploadRoot, year, month);
    const filename = `${randomUUID()}${extension}`;
    const absolutePath = path.join(directory, filename);

    await mkdir(directory, { recursive: true });

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    await writeFile(absolutePath, buffer);

    let width: number | null = null;
    let height: number | null = null;
    if (rasterImageTypes.has(mimeType)) {
      try {
        const dimensions = imageSize(buffer);
        width = dimensions.width ?? null;
        height = dimensions.height ?? null;
      } catch {
        width = null;
        height = null;
      }
    }

    const asset = await this.mediaRepo.create({
      kind,
      path: `/uploads/${year}/${month}/${filename}`,
      originalName: file.name,
      mimeType,
      sizeBytes: buffer.length,
      width,
      height,
      durationMs: null
    });

    return asset;
  }
}

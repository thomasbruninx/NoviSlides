import { z } from 'zod';
import { MediaService, MediaValidationError } from '@/lib/services';
import { mediaUploadFileSchema } from '@/lib/validation';
import { fail, ok } from '@/lib/utils/respond';
import { toMediaAssetDto } from '@/lib/utils/serializers';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const files = formData.getAll('files').filter((item): item is File => item instanceof File);

    if (!files.length) {
      return fail('validation_error', 'At least one file is required', 400);
    }

    const errors: Array<ReturnType<z.ZodError['flatten']>> = [];
    for (const file of files) {
      const parsed = mediaUploadFileSchema.safeParse({ filename: file.name, mimeType: file.type });
      if (!parsed.success) {
        errors.push(parsed.error.flatten());
      }
    }

    if (errors.length) {
      return fail('validation_error', 'Invalid upload payload', 400, errors);
    }

    const service = new MediaService();
    const assets = await service.uploadFiles(files);
    return ok({ assets: assets.map(toMediaAssetDto) }, 201);
  } catch (error) {
    if (error instanceof MediaValidationError) {
      return fail('validation_error', error.message, 400);
    }
    console.error('POST /api/media/upload', error);
    return fail('server_error', 'Failed to upload media', 500);
  }
}

export const dynamic = 'force-dynamic';

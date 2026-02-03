import { UploadService } from '@/lib/services';
import { fail, ok } from '@/lib/utils/respond';

const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');

    if (!file || !(file instanceof File)) {
      return fail('validation_error', 'File is required', 400);
    }

    if (!allowedTypes.includes(file.type)) {
      return fail('validation_error', 'Unsupported file type', 400, { type: file.type });
    }

    const service = new UploadService();
    const result = await service.saveFile(file);
    return ok({
      path: result.path,
      mediaAssetId: result.asset.id,
      width: result.width,
      height: result.height
    }, 201);
  } catch (error) {
    console.error('POST /api/upload', error);
    return fail('server_error', 'Failed to upload file', 500);
  }
}

export const dynamic = 'force-dynamic';

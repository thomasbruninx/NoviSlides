import { MediaAssetInUseError, MediaService } from '@/lib/services';
import { fail, ok } from '@/lib/utils/respond';
import { toMediaAssetDto } from '@/lib/utils/serializers';

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  const params = await context.params;
  try {
    const service = new MediaService();
    const asset = await service.getById(params.id);
    if (!asset) {
      return fail('not_found', 'Media asset not found', 404);
    }
    return ok(toMediaAssetDto(asset));
  } catch (error) {
    console.error('GET /api/media/:id', error);
    return fail('server_error', 'Failed to fetch media asset', 500);
  }
}

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  const params = await context.params;
  try {
    const service = new MediaService();
    const deleted = await service.deleteAsset(params.id);
    if (!deleted) {
      return fail('not_found', 'Media asset not found', 404);
    }
    return ok(toMediaAssetDto(deleted));
  } catch (error) {
    if (error instanceof MediaAssetInUseError) {
      return fail('ASSET_IN_USE', 'Media asset is in use by existing slide elements', 409);
    }
    console.error('DELETE /api/media/:id', error);
    return fail('server_error', 'Failed to delete media asset', 500);
  }
}

export const dynamic = 'force-dynamic';

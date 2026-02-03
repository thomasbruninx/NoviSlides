import { randomUUID } from 'crypto';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import imageSize from 'image-size';
import { MediaAssetRepository } from '../repositories';

const uploadDir = path.join(process.cwd(), 'public', 'uploads');

export class UploadService {
  private mediaRepo = new MediaAssetRepository();

  async saveFile(file: File) {
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const dimensions = imageSize(buffer);
    const ext = path.extname(file.name) || this.inferExtension(file.type);
    const filename = `${randomUUID()}${ext}`;
    const filepath = path.join(uploadDir, filename);

    await mkdir(uploadDir, { recursive: true });
    await writeFile(filepath, buffer);

    const width = dimensions.width ?? 0;
    const height = dimensions.height ?? 0;
    const asset = await this.mediaRepo.create({
      path: `/uploads/${filename}`,
      originalName: file.name,
      mimeType: file.type,
      width,
      height
    });

    return {
      asset,
      path: asset.path,
      width: asset.width,
      height: asset.height
    };
  }

  private inferExtension(mimeType: string) {
    switch (mimeType) {
      case 'image/png':
        return '.png';
      case 'image/jpeg':
        return '.jpg';
      case 'image/webp':
        return '.webp';
      default:
        return '';
    }
  }
}

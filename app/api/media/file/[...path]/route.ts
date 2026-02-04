import { createReadStream } from 'fs';
import { stat } from 'fs/promises';
import path from 'path';
import { NextResponse } from 'next/server';
import { Readable } from 'stream';

const uploadRoot = path.join(process.cwd(), 'public', 'uploads');

const mimeByExtension: Record<string, string> = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm'
};

function getMimeType(filePath: string) {
  const ext = path.extname(filePath).toLowerCase();
  return mimeByExtension[ext] ?? 'application/octet-stream';
}

export async function GET(request: Request, { params }: { params: { path: string[] } }) {
  try {
    const relativePath = params.path.join('/');
    const resolved = path.join(uploadRoot, relativePath.replace(/^[\\/]+/, ''));
    if (!resolved.startsWith(uploadRoot)) {
      return new NextResponse('Not found', { status: 404 });
    }

    const stats = await stat(resolved);
    const range = request.headers.get('range');
    const mimeType = getMimeType(resolved);

    if (range) {
      const match = range.match(/bytes=(\d+)-(\d+)?/);
      if (!match) {
        return new NextResponse('Invalid range', { status: 416 });
      }
      const start = Number(match[1]);
      const end = match[2] ? Number(match[2]) : stats.size - 1;
      if (Number.isNaN(start) || Number.isNaN(end) || start > end) {
        return new NextResponse('Invalid range', { status: 416 });
      }

      const stream = createReadStream(resolved, { start, end });
      const body = Readable.toWeb(stream) as ReadableStream;

      return new NextResponse(body, {
        status: 206,
        headers: {
          'Content-Type': mimeType,
          'Content-Range': `bytes ${start}-${end}/${stats.size}`,
          'Accept-Ranges': 'bytes',
          'Content-Length': String(end - start + 1),
          'Cache-Control': 'no-store'
        }
      });
    }

    const stream = createReadStream(resolved);
    const body = Readable.toWeb(stream) as ReadableStream;

    return new NextResponse(body, {
      headers: {
        'Content-Type': mimeType,
        'Content-Length': String(stats.size),
        'Cache-Control': 'no-store'
      }
    });
  } catch {
    return new NextResponse('Not found', { status: 404 });
  }
}

export const dynamic = 'force-dynamic';

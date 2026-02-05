import { IconService } from '@/lib/services';
import { iconStyleSchema } from '@/lib/validation';
import { fail } from '@/lib/utils/respond';

export async function GET(
  request: Request,
  { params }: { params: { style: string; name: string } }
) {
  try {
    const url = new URL(request.url);
    const color = url.searchParams.get('color') ?? undefined;
    const style = iconStyleSchema.parse(params.style);
    const name = params.name.replace(/\.svg$/i, '');
    const service = new IconService();
    const svg = service.getIconSvg(style, name, color);
    return new Response(svg, {
      headers: {
        'Content-Type': 'image/svg+xml',
        'Cache-Control': 'public, max-age=31536000, immutable'
      }
    });
  } catch (error) {
    console.error('GET /api/icons/:style/:name', error);
    return fail('not_found', 'Icon not found', 404);
  }
}

export const dynamic = 'force-dynamic';

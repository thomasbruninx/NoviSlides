import { z } from 'zod';
import { eventHub } from '@/lib/services/events';
import { fail } from '@/lib/utils/respond';

const querySchema = z.object({
  slideshowId: z.string().min(1),
  screenKey: z.string().min(1)
});

export const runtime = 'nodejs';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const parsed = querySchema.safeParse({
    slideshowId: url.searchParams.get('slideshowId'),
    screenKey: url.searchParams.get('screenKey')
  });

  if (!parsed.success) {
    return fail('validation_error', 'Invalid event stream params', 400, parsed.error.flatten());
  }

  const encoder = new TextEncoder();
  const stream = new TransformStream();
  const writer = stream.writable.getWriter();
  let isClosed = false;

  const sendEvent = async (event: string, data: unknown) => {
    if (isClosed) return;
    await writer.write(encoder.encode(`event: ${event}\n`));
    await writer.write(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
  };

  const unsubscribe = eventHub.subscribe(
    { slideshowId: parsed.data.slideshowId, screenKey: parsed.data.screenKey },
    (event) => {
      if (event.type === 'screenChanged') {
        void sendEvent('screenChanged', event);
      }
    }
  );

  const heartbeat = setInterval(() => {
    void sendEvent('ping', { at: new Date().toISOString() });
  }, 25000);

  void sendEvent('ping', { at: new Date().toISOString() });

  const close = async () => {
    if (isClosed) return;
    isClosed = true;
    clearInterval(heartbeat);
    unsubscribe();
    try {
      await writer.close();
    } catch {
      // Ignore close errors.
    }
  };

  request.signal.addEventListener('abort', () => {
    void close();
  });

  return new Response(stream.readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no'
    }
  });
}

export const dynamic = 'force-dynamic';

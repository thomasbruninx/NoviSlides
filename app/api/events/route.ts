import { z } from 'zod';
import { eventHub } from '@/lib/services/events';
import { fail } from '@/lib/utils/respond';

const screenQuerySchema = z.object({
  slideshowId: z.string().min(1),
  screenKey: z.string().min(1)
});

const activeQuerySchema = z.object({
  scope: z.literal('active')
});

export const runtime = 'nodejs';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const scope = url.searchParams.get('scope');

  const encoder = new TextEncoder();
  const stream = new TransformStream();
  const writer = stream.writable.getWriter();
  let isClosed = false;

  const sendEvent = async (event: string, data: unknown) => {
    if (isClosed) return;
    await writer.write(encoder.encode(`event: ${event}\n`));
    await writer.write(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
  };

  let filter: { eventType: 'activeSlideshowChanged' } | { eventType: 'screenChanged'; slideshowId: string; screenKey: string };

  if (scope === 'active') {
    const parsedActive = activeQuerySchema.safeParse({ scope });
    if (!parsedActive.success) {
      return fail('validation_error', 'Invalid event stream params', 400, parsedActive.error.flatten());
    }
    filter = { eventType: 'activeSlideshowChanged' };
  } else {
    const parsedScreen = screenQuerySchema.safeParse({
      slideshowId: url.searchParams.get('slideshowId'),
      screenKey: url.searchParams.get('screenKey')
    });
    if (!parsedScreen.success) {
      return fail('validation_error', 'Invalid event stream params', 400, parsedScreen.error.flatten());
    }
    filter = {
      eventType: 'screenChanged',
      slideshowId: parsedScreen.data.slideshowId,
      screenKey: parsedScreen.data.screenKey
    };
  }

  const unsubscribe = eventHub.subscribe(filter, (event) => {
    if (event.type === 'screenChanged') {
      void sendEvent('screenChanged', event);
    }
    if (event.type === 'activeSlideshowChanged') {
      void sendEvent('activeSlideshowChanged', event);
    }
  });

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

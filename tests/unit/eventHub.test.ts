import { describe, expect, it } from 'vitest';
import { InMemoryEventHub } from '../../lib/services/events/InMemoryEventHub';
import type { ScreenChangedEvent } from '../../lib/types';

describe('InMemoryEventHub', () => {
  it('filters by slideshow and screen', () => {
    const hub = new InMemoryEventHub();
    const received: ScreenChangedEvent[] = [];

    hub.subscribe({ slideshowId: 'show-1', screenKey: 'main' }, (event) => {
      received.push(event as ScreenChangedEvent);
    });

    hub.publish({
      type: 'screenChanged',
      slideshowId: 'show-1',
      screenKey: 'main',
      revision: 2,
      at: 'now'
    });
    hub.publish({
      type: 'screenChanged',
      slideshowId: 'show-1',
      screenKey: 'side',
      revision: 3,
      at: 'now'
    });
    hub.publish({
      type: 'screenChanged',
      slideshowId: 'show-2',
      screenKey: 'main',
      revision: 4,
      at: 'now'
    });

    expect(received).toHaveLength(1);
    expect(received[0]?.screenKey).toBe('main');
  });

  it('allows subscribing to all screens within a slideshow', () => {
    const hub = new InMemoryEventHub();
    const received: ScreenChangedEvent[] = [];

    hub.subscribe({ slideshowId: 'show-1' }, (event) => {
      received.push(event as ScreenChangedEvent);
    });

    hub.publish({
      type: 'screenChanged',
      slideshowId: 'show-1',
      screenKey: 'main',
      revision: 2,
      at: 'now'
    });
    hub.publish({
      type: 'screenChanged',
      slideshowId: 'show-1',
      screenKey: 'side',
      revision: 3,
      at: 'now'
    });

    expect(received).toHaveLength(2);
  });
});

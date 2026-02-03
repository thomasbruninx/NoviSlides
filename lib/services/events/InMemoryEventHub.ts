import type { EventFilter, EventHubEvent } from '@/lib/types';
import type { EventCallback, IEventHub } from './EventHub';

type Subscriber = {
  id: number;
  filter: EventFilter;
  cb: EventCallback;
};

export class InMemoryEventHub implements IEventHub {
  private subscribers = new Map<number, Subscriber>();
  private nextId = 1;

  publish(event: EventHubEvent) {
    for (const subscriber of this.subscribers.values()) {
      if (this.matches(subscriber.filter, event)) {
        subscriber.cb(event);
      }
    }
  }

  subscribe(filter: EventFilter, cb: EventCallback) {
    const id = this.nextId;
    this.nextId += 1;
    this.subscribers.set(id, { id, filter, cb });
    return () => {
      this.subscribers.delete(id);
    };
  }

  private matches(filter: EventFilter, event: EventHubEvent) {
    if (filter.slideshowId !== event.slideshowId) return false;
    if (filter.screenKey && filter.screenKey !== event.screenKey) return false;
    return true;
  }
}

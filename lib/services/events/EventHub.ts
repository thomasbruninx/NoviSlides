import type { EventFilter, EventHubEvent } from '@/lib/types';

export type EventCallback = (event: EventHubEvent) => void;

export interface IEventHub {
  publish(event: EventHubEvent): void;
  subscribe(filter: EventFilter, cb: EventCallback): () => void;
}

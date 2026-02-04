import { InMemoryEventHub } from './InMemoryEventHub';

type GlobalWithEventHub = typeof globalThis & {
  __noviSlidesEventHub?: InMemoryEventHub;
};

const globalWithEventHub = globalThis as GlobalWithEventHub;

// NOTE: In-memory singleton. In multi-instance deployments, use a shared bus (e.g., Redis pub/sub).
export const eventHub = globalWithEventHub.__noviSlidesEventHub ?? new InMemoryEventHub();
globalWithEventHub.__noviSlidesEventHub = eventHub;

export * from './EventHub';

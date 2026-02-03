import { InMemoryEventHub } from './InMemoryEventHub';

// NOTE: In-memory singleton. In multi-instance deployments, use a shared bus (e.g., Redis pub/sub).
export const eventHub = new InMemoryEventHub();

export * from './EventHub';

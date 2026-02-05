export type ScreenChangedEvent = {
  type: 'screenChanged';
  slideshowId: string;
  screenKey: string;
  revision: number;
  at: string;
};

export type DisplayMountChangedEvent = {
  type: 'displayMountChanged';
  displayName: string;
  slideshowId: string | null;
  at: string;
};

export type EventHubEvent = ScreenChangedEvent | DisplayMountChangedEvent;

export type EventFilter = {
  eventType?: EventHubEvent['type'];
  slideshowId?: string;
  screenKey?: string;
  displayName?: string;
};

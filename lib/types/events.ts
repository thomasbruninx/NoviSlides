export type ScreenChangedEvent = {
  type: 'screenChanged';
  slideshowId: string;
  screenKey: string;
  revision: number;
  at: string;
};

export type ActiveSlideshowChangedEvent = {
  type: 'activeSlideshowChanged';
  slideshowId: string;
  defaultScreenKey: string;
  at: string;
};

export type EventHubEvent = ScreenChangedEvent | ActiveSlideshowChangedEvent;

export type EventFilter = {
  eventType?: EventHubEvent['type'];
  slideshowId?: string;
  screenKey?: string;
};

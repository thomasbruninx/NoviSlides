export type ScreenChangedEvent = {
  type: 'screenChanged';
  slideshowId: string;
  screenKey: string;
  revision: number;
  at: string;
};

export type EventHubEvent = ScreenChangedEvent;

export type EventFilter = {
  slideshowId: string;
  screenKey?: string;
};

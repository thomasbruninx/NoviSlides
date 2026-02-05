export type SlideElementType = 'image' | 'label' | 'video' | 'shape' | 'symbol';
export type SlideElementAnimation = 'none' | 'fade' | 'zoom' | 'appear';
export type SlideBackgroundImageSize = 'cover' | 'contain' | 'center';
export type SlideBackgroundImagePosition =
  | 'top-left'
  | 'top-center'
  | 'top-right'
  | 'center-left'
  | 'center'
  | 'center-right'
  | 'bottom-left'
  | 'bottom-center'
  | 'bottom-right';

export type SlideElementDataBase = {
  animationDurationMs?: number | null;
  animationDelayMs?: number | null;
};

export type SlideElementDataImage = SlideElementDataBase & {
  mediaAssetId?: string;
  path?: string;
  originalName?: string;
  crop?: { x: number; y: number; width: number; height: number };
};

export type SlideElementDataVideo = SlideElementDataBase & {
  mediaAssetId?: string;
  path?: string;
  autoplay?: boolean;
  loop?: boolean;
  muted?: boolean;
  controls?: boolean;
};

export type SlideElementDataLabel = SlideElementDataBase & {
  text: string;
  fontSize: number;
  fontFamily: string;
  color: string;
  align: 'left' | 'center' | 'right';
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
};

export type SlideElementDataShape = SlideElementDataBase & {
  shape: 'rectangle' | 'circle' | 'triangle';
  fill: string;
  stroke?: string;
  strokeWidth?: number;
};

export type SlideElementDataSymbol = SlideElementDataBase & {
  iconName: string;
  iconStyle?: 'filled' | 'outlined' | 'round' | 'sharp' | 'two-tone';
  color?: string;
};

export type SlideElementData =
  | SlideElementDataImage
  | SlideElementDataVideo
  | SlideElementDataLabel
  | SlideElementDataShape
  | SlideElementDataSymbol;

export type SlideElementDto = {
  id: string;
  slideId: string;
  type: SlideElementType;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  opacity: number;
  zIndex: number;
  animation: SlideElementAnimation;
  dataJson: SlideElementData;
  createdAt: string;
  updatedAt: string;
};

export type SlideDto = {
  id: string;
  screenId: string;
  orderIndex: number;
  title?: string | null;
  autoSlideMsOverride?: number | null;
  backgroundColor?: string | null;
  backgroundImagePath?: string | null;
  backgroundImageSize?: SlideBackgroundImageSize | null;
  backgroundImagePosition?: SlideBackgroundImagePosition | null;
  transitionOverride?: string | null;
  createdAt: string;
  updatedAt: string;
  elements?: SlideElementDto[];
};

export type ScreenDto = {
  id: string;
  slideshowId: string;
  key: string;
  width: number;
  height: number;
  revision: number;
  createdAt: string;
  updatedAt: string;
  slides?: SlideDto[];
};

export type SlideshowDto = {
  id: string;
  name: string;
  isActive: boolean;
  defaultAutoSlideMs: number;
  revealTransition: string;
  loop: boolean;
  controls: boolean;
  autoSlideStoppable: boolean;
  defaultScreenKey: string;
  createdAt: string;
  updatedAt: string;
  screens?: ScreenDto[];
};

export type ScreenDeckDto = {
  slideshow: SlideshowDto;
  screen: ScreenDto;
  slides: SlideDto[];
};

export type MediaAssetDto = {
  id: string;
  kind: 'image' | 'video';
  path: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  width: number | null;
  height: number | null;
  durationMs: number | null;
  createdAt: string;
};

export type PaginatedResult<T> = {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

export type TemplateSummary = {
  key: string;
  name: string;
  description: string;
  isDefault?: boolean;
};

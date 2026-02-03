export type SlideElementType = 'image' | 'label';
export type SlideElementAnimation = 'none' | 'fade' | 'zoom' | 'appear';

export type SlideElementDataImage = {
  mediaAssetId?: string;
  path?: string;
  crop?: { x: number; y: number; width: number; height: number };
};

export type SlideElementDataLabel = {
  text: string;
  fontSize: number;
  fontFamily: string;
  color: string;
  align: 'left' | 'center' | 'right';
};

export type SlideElementData = SlideElementDataImage | SlideElementDataLabel;

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
  defaultScreenKey: string;
  createdAt: string;
  updatedAt: string;
  screens?: ScreenDto[];
};

export type MediaAssetDto = {
  id: string;
  path: string;
  originalName: string;
  mimeType: string;
  width: number;
  height: number;
  createdAt: string;
};

export type TemplateSummary = {
  key: string;
  name: string;
  description: string;
  isDefault?: boolean;
};

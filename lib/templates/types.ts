import type {
  SlideBackgroundImagePosition,
  SlideBackgroundImageSize,
  SlideElementAnimation,
  SlideElementType
} from '../types';

export type TemplateElement = {
  type: SlideElementType;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation?: number;
  opacity?: number;
  zIndex?: number;
  animation?: SlideElementAnimation;
  dataJson: Record<string, unknown>;
};

export type TemplateSlide = {
  title?: string;
  autoSlideMsOverride?: number | null;
  backgroundColor?: string | null;
  backgroundImagePath?: string | null;
  backgroundImageSize?: SlideBackgroundImageSize | null;
  backgroundImagePosition?: SlideBackgroundImagePosition | null;
  transitionOverride?: string | null;
  elements: TemplateElement[];
};

export type TemplateScreen = {
  key: string;
  width: number;
  height: number;
  slides: TemplateSlide[];
};

export type TemplateDefinition = {
  key: string;
  name: string;
  description: string;
  isDefault?: boolean;
  build: () => TemplateScreen[];
};

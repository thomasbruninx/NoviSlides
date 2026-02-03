import type { Slideshow, Screen, Slide, SlideElement, MediaAsset } from '@prisma/client';
import type {
  SlideshowDto,
  ScreenDto,
  SlideDto,
  SlideElementDto,
  MediaAssetDto,
  SlideElementAnimation,
  SlideElementType
} from '../types';

export function toSlideshowDto(slideshow: Slideshow): SlideshowDto {
  return {
    ...slideshow,
    createdAt: slideshow.createdAt.toISOString(),
    updatedAt: slideshow.updatedAt.toISOString()
  };
}

export function toScreenDto(screen: Screen): ScreenDto {
  return {
    ...screen,
    createdAt: screen.createdAt.toISOString(),
    updatedAt: screen.updatedAt.toISOString()
  };
}

export function toSlideDto(slide: Slide): SlideDto {
  return {
    ...slide,
    createdAt: slide.createdAt.toISOString(),
    updatedAt: slide.updatedAt.toISOString()
  };
}

export function toSlideElementDto(element: SlideElement): SlideElementDto {
  let parsed: SlideElementDto['dataJson'] = {};
  if (typeof element.dataJson === 'string') {
    try {
      parsed = JSON.parse(element.dataJson) as SlideElementDto['dataJson'];
    } catch {
      parsed = {};
    }
  }

  const type = (['image', 'label'] as const).includes(element.type as SlideElementType)
    ? (element.type as SlideElementType)
    : 'label';
  const animation = (['none', 'fade', 'zoom', 'appear'] as const).includes(
    element.animation as SlideElementAnimation
  )
    ? (element.animation as SlideElementAnimation)
    : 'none';

  return {
    ...element,
    type,
    animation,
    createdAt: element.createdAt.toISOString(),
    updatedAt: element.updatedAt.toISOString(),
    dataJson: parsed
  };
}

export function toMediaAssetDto(asset: MediaAsset): MediaAssetDto {
  return {
    ...asset,
    createdAt: asset.createdAt.toISOString()
  };
}

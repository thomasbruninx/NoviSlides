import type { Slideshow, Screen, Slide, SlideElement, MediaAsset, Display, TenantSettings } from '@prisma/client';
import type {
  SlideshowDto,
  ScreenDto,
  SlideDto,
  SlideElementDto,
  MediaAssetDto,
  DisplayDto,
  TenantSettingsDto,
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
  const backgroundImageSize =
    slide.backgroundImageSize && ['cover', 'contain', 'center'].includes(slide.backgroundImageSize)
      ? (slide.backgroundImageSize as SlideDto['backgroundImageSize'])
      : null;
  const backgroundImagePosition =
    slide.backgroundImagePosition &&
    [
      'top-left',
      'top-center',
      'top-right',
      'center-left',
      'center',
      'center-right',
      'bottom-left',
      'bottom-center',
      'bottom-right'
    ].includes(slide.backgroundImagePosition)
      ? (slide.backgroundImagePosition as SlideDto['backgroundImagePosition'])
      : null;
  return {
    ...slide,
    backgroundImageSize,
    backgroundImagePosition,
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

  const type = (['image', 'label', 'video', 'shape', 'symbol'] as const).includes(element.type as SlideElementType)
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
  const kind = asset.kind === 'video' ? 'video' : 'image';
  return {
    ...asset,
    kind,
    createdAt: asset.createdAt.toISOString()
  };
}

export function toDisplayDto(display: Display): DisplayDto {
  return {
    ...display,
    createdAt: display.createdAt.toISOString(),
    updatedAt: display.updatedAt.toISOString()
  };
}

export function toTenantSettingsDto(
  settings: TenantSettings,
  googleFontsApiKeyManagedByEnv = false
): TenantSettingsDto {
  return {
    googleFontsApiKey: settings.googleFontsApiKey,
    googleFontsApiKeyManagedByEnv,
    createdAt: settings.createdAt.toISOString(),
    updatedAt: settings.updatedAt.toISOString()
  };
}

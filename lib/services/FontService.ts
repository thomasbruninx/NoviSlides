import { TenantSettingsService } from './TenantSettingsService';

type FontListResult = {
  items: string[];
  hasGoogleFonts: boolean;
};

const CACHE_TTL_MS = 1000 * 60 * 60 * 6;
let cachedFonts: string[] = [];
let cachedAt = 0;
let cachedForKey: string | null = null;
let inflight: Promise<string[]> | null = null;

async function fetchGoogleFonts(key: string): Promise<string[]> {
  const url = new URL('https://www.googleapis.com/webfonts/v1/webfonts');
  url.searchParams.set('sort', 'alpha');
  url.searchParams.set('key', key);

  const response = await fetch(url.toString(), { cache: 'no-store' });
  if (!response.ok) {
    throw new Error('Failed to fetch Google Fonts list');
  }

  const payload = (await response.json()) as { items?: Array<{ family?: string }> };
  return (payload.items ?? [])
    .map((item) => item.family)
    .filter((family): family is string => Boolean(family));
}

async function getFontCache(key: string | null): Promise<string[]> {
  const now = Date.now();
  if (cachedForKey !== key) {
    cachedFonts = [];
    cachedAt = 0;
    cachedForKey = key;
    inflight = null;
  }

  if (cachedFonts.length && now - cachedAt < CACHE_TTL_MS) {
    return cachedFonts;
  }

  if (!key) {
    cachedFonts = [];
    cachedAt = now;
    return cachedFonts;
  }

  if (!inflight) {
    inflight = fetchGoogleFonts(key)
      .then((fonts) => {
        cachedFonts = fonts;
        cachedAt = Date.now();
        return fonts;
      })
      .finally(() => {
        inflight = null;
      });
  }

  return inflight;
}

export class FontService {
  private tenantSettingsService = new TenantSettingsService();

  async listFonts(query: string, limit: number): Promise<FontListResult> {
    const trimmed = query.trim().toLowerCase();
    const safeLimit = Math.min(100, Math.max(1, limit || 30));
    const tenantKey = await this.tenantSettingsService.getGoogleFontsApiKey();
    const key = tenantKey ?? process.env.GOOGLE_FONTS_API_KEY ?? null;
    const fonts = await getFontCache(key);
    if (!fonts.length) {
      return { items: [], hasGoogleFonts: false };
    }

    const filtered = trimmed
      ? fonts.filter((font) => font.toLowerCase().includes(trimmed))
      : fonts;

    return {
      items: filtered.slice(0, safeLimit),
      hasGoogleFonts: true
    };
  }
}

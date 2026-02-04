'use client';

import { useEffect, useMemo } from 'react';

const SYSTEM_FONTS = new Set(['sans-serif', 'serif', 'monospace']);
const FONT_USE_COUNT = new Map<string, number>();
const LINK_ID = 'google-fonts-dynamic';

const normalizeFont = (font: string) => {
  const primary = font.split(',')[0]?.trim() ?? '';
  return primary.replace(/^['"]|['"]$/g, '');
};

const buildHref = (families: string[]) => {
  if (!families.length) return null;
  const params = families.map((family) => {
    const encoded = encodeURIComponent(family).replace(/%20/g, '+');
    return `family=${encoded}:ital,wght@0,400;0,700;1,400;1,700`;
  });
  return `https://fonts.googleapis.com/css2?${params.join('&')}&display=swap`;
};

const updateLink = () => {
  const families = Array.from(FONT_USE_COUNT.keys()).sort();
  const href = buildHref(families);
  const existing = document.getElementById(LINK_ID) as HTMLLinkElement | null;

  if (!href) {
    if (existing) {
      existing.remove();
    }
    return;
  }

  if (existing) {
    if (existing.getAttribute('data-href') === href) return;
    existing.setAttribute('data-href', href);
    existing.href = href;
    return;
  }

  const link = document.createElement('link');
  link.id = LINK_ID;
  link.rel = 'stylesheet';
  link.href = href;
  link.setAttribute('data-href', href);
  document.head.appendChild(link);
};

export function useGoogleFonts(families: string[]) {
  const normalized = useMemo(() => {
    const unique = new Set<string>();
    families.forEach((family) => {
      if (!family) return;
      const primary = normalizeFont(family);
      if (!primary || SYSTEM_FONTS.has(primary)) return;
      unique.add(primary);
    });
    return Array.from(unique).sort();
  }, [families]);

  useEffect(() => {
    if (!normalized.length) return;
    normalized.forEach((family) => {
      const count = FONT_USE_COUNT.get(family) ?? 0;
      FONT_USE_COUNT.set(family, count + 1);
    });
    updateLink();

    return () => {
      normalized.forEach((family) => {
        const count = (FONT_USE_COUNT.get(family) ?? 0) - 1;
        if (count <= 0) {
          FONT_USE_COUNT.delete(family);
        } else {
          FONT_USE_COUNT.set(family, count);
        }
      });
      updateLink();
    };
  }, [normalized]);
}

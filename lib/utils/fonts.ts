const SYSTEM_FONTS = new Set(['sans-serif', 'serif', 'monospace']);

export const normalizeFont = (font: string) => {
  const primary = font.split(',')[0]?.trim() ?? '';
  return primary.replace(/^['"]|['"]$/g, '');
};

export const isSystemFont = (font: string) => {
  const primary = normalizeFont(font);
  return SYSTEM_FONTS.has(primary);
};

export const buildFontSpec = (
  fontFamily: string,
  fontSize: number,
  fontWeight: number,
  italic: boolean
) => {
  const primary = normalizeFont(fontFamily);
  if (!primary) return null;
  const escaped = primary.replace(/'/g, "\\'");
  return `${italic ? 'italic' : 'normal'} ${fontWeight} ${fontSize}px '${escaped}'`;
};

export const resolveRenderableFontFamily = (fontFamily: string) => {
  const primary = normalizeFont(fontFamily);
  if (!primary) return 'sans-serif';
  if (isSystemFont(primary)) {
    return primary;
  }
  const escaped = primary.replace(/'/g, "\\'");
  return `'${escaped}', sans-serif`;
};

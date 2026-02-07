export type RgbColor = { r: number; g: number; b: number };

const clamp255 = (value: number) => Math.max(0, Math.min(255, value));

const parseHexColor = (value: string): RgbColor | null => {
  const hex = value.trim().replace('#', '');
  if (![3, 4, 6, 8].includes(hex.length)) return null;
  const normalized = hex.length === 3 || hex.length === 4
    ? hex
        .split('')
        .map((char) => `${char}${char}`)
        .join('')
    : hex;
  const rgbHex = normalized.slice(0, 6);
  if (!/^[0-9a-fA-F]{6}$/.test(rgbHex)) return null;
  return {
    r: Number.parseInt(rgbHex.slice(0, 2), 16),
    g: Number.parseInt(rgbHex.slice(2, 4), 16),
    b: Number.parseInt(rgbHex.slice(4, 6), 16)
  };
};

const parseRgbColor = (value: string): RgbColor | null => {
  const match = value
    .trim()
    .match(/^rgba?\(\s*(-?\d+\.?\d*)\s*,\s*(-?\d+\.?\d*)\s*,\s*(-?\d+\.?\d*)(?:\s*,\s*(-?\d+\.?\d*))?\s*\)$/i);
  if (!match) return null;
  return {
    r: clamp255(Number.parseFloat(match[1])),
    g: clamp255(Number.parseFloat(match[2])),
    b: clamp255(Number.parseFloat(match[3]))
  };
};

const hslToRgb = (h: number, s: number, l: number): RgbColor => {
  const normalizedH = ((h % 360) + 360) % 360 / 360;
  const normalizedS = Math.max(0, Math.min(1, s));
  const normalizedL = Math.max(0, Math.min(1, l));
  if (normalizedS === 0) {
    const gray = Math.round(normalizedL * 255);
    return { r: gray, g: gray, b: gray };
  }
  const q =
    normalizedL < 0.5
      ? normalizedL * (1 + normalizedS)
      : normalizedL + normalizedS - normalizedL * normalizedS;
  const p = 2 * normalizedL - q;
  const hueToRgb = (t: number) => {
    let temp = t;
    if (temp < 0) temp += 1;
    if (temp > 1) temp -= 1;
    if (temp < 1 / 6) return p + (q - p) * 6 * temp;
    if (temp < 1 / 2) return q;
    if (temp < 2 / 3) return p + (q - p) * (2 / 3 - temp) * 6;
    return p;
  };
  return {
    r: Math.round(hueToRgb(normalizedH + 1 / 3) * 255),
    g: Math.round(hueToRgb(normalizedH) * 255),
    b: Math.round(hueToRgb(normalizedH - 1 / 3) * 255)
  };
};

const parseHslColor = (value: string): RgbColor | null => {
  const match = value
    .trim()
    .match(/^hsla?\(\s*(-?\d+\.?\d*)\s*,\s*(-?\d+\.?\d*)%\s*,\s*(-?\d+\.?\d*)%(?:\s*,\s*(-?\d+\.?\d*))?\s*\)$/i);
  if (!match) return null;
  const h = Number.parseFloat(match[1]);
  const s = Number.parseFloat(match[2]) / 100;
  const l = Number.parseFloat(match[3]) / 100;
  return hslToRgb(h, s, l);
};

export const parseColorToRgb = (value: string | null | undefined): RgbColor | null => {
  if (!value) return null;
  return parseHexColor(value) ?? parseRgbColor(value) ?? parseHslColor(value);
};

export const relativeLuminance = ({ r, g, b }: RgbColor) => {
  const toLinear = (channel: number) => {
    const normalized = channel / 255;
    return normalized <= 0.03928 ? normalized / 12.92 : ((normalized + 0.055) / 1.055) ** 2.4;
  };
  const rl = toLinear(r);
  const gl = toLinear(g);
  const bl = toLinear(b);
  return 0.2126 * rl + 0.7152 * gl + 0.0722 * bl;
};

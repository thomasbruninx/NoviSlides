export type IconStyle = 'filled' | 'outlined' | 'round' | 'sharp' | 'two-tone';

export const iconStyles: IconStyle[] = ['filled', 'outlined', 'round', 'sharp', 'two-tone'];

export const getIconUrl = (style: IconStyle, name: string, color?: string) => {
  const encodedColor = color ? encodeURIComponent(color) : '';
  return encodedColor
    ? `/api/icons/${style}/${name}.svg?color=${encodedColor}`
    : `/api/icons/${style}/${name}.svg`;
};

export const normalizeIconName = (name: string) => name.replace(/\.svg$/i, '');

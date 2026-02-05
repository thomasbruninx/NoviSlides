import fs from 'fs';
import path from 'path';
import { iconStyles } from '@/lib/utils/icons';

type IconCache = {
  [style: string]: string[];
};

const cache: IconCache = {};

const getIconsRoot = () =>
  path.join(process.cwd(), 'node_modules', '@material-design-icons', 'svg');

const readIconsForStyle = (style: string) => {
  if (cache[style]) {
    return cache[style];
  }
  const dir = path.join(getIconsRoot(), style);
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const names = entries
    .filter((entry) => entry.isFile() && entry.name.endsWith('.svg'))
    .map((entry) => entry.name.replace(/\.svg$/i, ''))
    .sort();
  cache[style] = names;
  return names;
};

export class IconService {
  listIcons(style: string, query: string, page: number, pageSize: number) {
    if (!iconStyles.includes(style as (typeof iconStyles)[number])) {
      throw new Error('Invalid icon style');
    }
    const all = readIconsForStyle(style);
    const normalized = query.trim().toLowerCase();
    const filtered = normalized
      ? all.filter((name) => name.includes(normalized))
      : all;
    const total = filtered.length;
    const start = (page - 1) * pageSize;
    const items = filtered.slice(start, start + pageSize);
    return {
      items,
      page,
      pageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / pageSize))
    };
  }

  getIconSvg(style: string, name: string, color?: string) {
    if (!iconStyles.includes(style as (typeof iconStyles)[number])) {
      throw new Error('Invalid icon style');
    }
    if (!/^[a-z0-9_]+$/i.test(name)) {
      throw new Error('Invalid icon name');
    }
    const filePath = path.join(getIconsRoot(), style, `${name}.svg`);
    const resolved = path.resolve(filePath);
    if (!resolved.startsWith(path.resolve(getIconsRoot()))) {
      throw new Error('Invalid icon path');
    }
    const raw = fs.readFileSync(resolved, 'utf8');
    if (!color) {
      return raw;
    }
    const safeColor = /^[#a-z0-9(),.\s]+$/i.test(color) ? color : '#ffffff';
    let output = raw.replace(/fill=\"[^\"]*\"/gi, `fill="${safeColor}"`);
    if (!/fill=/.test(output)) {
      output = output.replace(/<svg([^>]*)>/i, `<svg$1 fill="${safeColor}">`);
    }
    return output;
  }
}

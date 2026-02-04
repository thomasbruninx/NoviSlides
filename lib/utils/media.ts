export function resolveMediaPath(path?: string | null) {
  if (!path) return '';
  if (path.startsWith('/api/media/file/')) {
    return path;
  }
  if (path.startsWith('/api/media/file/uploads/')) {
    return path.replace('/api/media/file/uploads/', '/api/media/file/');
  }
  if (path.startsWith('/uploads/')) {
    return `/api/media/file/${path.slice('/uploads/'.length)}`;
  }
  return path;
}

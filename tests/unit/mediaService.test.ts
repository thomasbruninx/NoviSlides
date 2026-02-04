import { describe, expect, it } from 'vitest';
import { mediaKindFromMime } from '../../lib/services/MediaService';

describe('mediaKindFromMime', () => {
  it('returns image for image mime types', () => {
    expect(mediaKindFromMime('image/png')).toBe('image');
    expect(mediaKindFromMime('image/svg+xml')).toBe('image');
  });

  it('returns video for video mime types', () => {
    expect(mediaKindFromMime('video/mp4')).toBe('video');
    expect(mediaKindFromMime('video/webm')).toBe('video');
  });

  it('returns null for unsupported mime types', () => {
    expect(mediaKindFromMime('application/pdf')).toBeNull();
  });
});

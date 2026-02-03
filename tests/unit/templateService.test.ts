import { describe, expect, it } from 'vitest';
import { TemplateService } from '../../lib/services/TemplateService';

const service = new TemplateService();

describe('TemplateService', () => {
  it('builds default template with screens, slides, and elements', () => {
    const screens = service.buildScreens();
    expect(screens.length).toBeGreaterThan(0);
    expect(screens[0].slides.length).toBeGreaterThan(0);
    expect(screens[0].slides[0].elements.length).toBeGreaterThan(0);
  });
});

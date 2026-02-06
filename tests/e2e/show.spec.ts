import { test, expect } from '@playwright/test';

type ApiOk<T> = { ok: true; data: T };
type ApiError = { ok: false; error: { code: string; message: string } };

function expectOk<T>(payload: ApiOk<T> | ApiError): T {
  expect(payload.ok, payload.ok ? '' : payload.error.message).toBe(true);
  return (payload as ApiOk<T>).data;
}

test('mounted display viewer loads', async ({ page, request }) => {
  const suffix = Date.now().toString(36);
  const displayName = `e2e_display_${suffix}`;
  let slideshowId: string | null = null;
  let displayId: string | null = null;

  try {
    const slideshowResponse = await request.post('/api/slideshows', {
      data: {
        name: `E2E Slideshow ${suffix}`,
        initialScreen: {
          key: 'main',
          width: 1920,
          height: 540
        }
      }
    });
    const slideshowBody = (await slideshowResponse.json()) as
      | ApiOk<{ id: string }>
      | ApiError;
    const slideshow = expectOk(slideshowBody);
    slideshowId = slideshow.id;

    const displayResponse = await request.post('/api/displays', {
      data: {
        name: displayName,
        width: 1920,
        height: 540
      }
    });
    const displayBody = (await displayResponse.json()) as
      | ApiOk<{ id: string; name: string }>
      | ApiError;
    const display = expectOk(displayBody);
    displayId = display.id;

    const mountResponse = await request.post(`/api/slideshows/${slideshowId}/mount`, {
      data: { displayId }
    });
    const mountBody = (await mountResponse.json()) as
      | ApiOk<{ mountedSlideshowId: string | null }>
      | ApiError;
    const mountedDisplay = expectOk(mountBody);
    expect(mountedDisplay.mountedSlideshowId).toBe(slideshowId);

    await page.goto('/show');
    const displayLink = page.getByRole('link', { name: `Open /display/${displayName}` });
    await expect(displayLink).toBeVisible();
    await displayLink.click();
    await expect(page.locator('.reveal')).toBeVisible();
  } finally {
    if (displayId) {
      await request.delete(`/api/displays/${displayId}`);
    }
    if (slideshowId) {
      await request.delete(`/api/slideshows/${slideshowId}`);
    }
  }
});

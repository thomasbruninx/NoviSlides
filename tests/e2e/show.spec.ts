import { test, expect } from '@playwright/test';

test('active slideshow viewer loads', async ({ page, request }) => {
  const demo = await request.post('/api/slideshows/demo');
  const demoBody = await demo.json();
  if (demoBody.ok) {
    await request.post(`/api/slideshows/${demoBody.data.id}/activate`);
  }

  await page.goto('/show');
  await expect(page.locator('.reveal')).toBeVisible();
});

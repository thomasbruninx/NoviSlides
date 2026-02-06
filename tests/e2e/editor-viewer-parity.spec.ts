import { expect, test } from '@playwright/test';

type ApiOk<T> = { ok: true; data: T };
type ApiError = { ok: false; error: { code: string; message: string } };

type ApiPayload<T> = ApiOk<T> | ApiError;

type CreatedElement = { id: string };
type SlideWithElements = { id: string; elements?: Array<{ id: string }> };

type NormalizedRect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

function expectOk<T>(payload: ApiPayload<T>): T {
  expect(payload.ok, payload.ok ? '' : payload.error.message).toBe(true);
  return (payload as ApiOk<T>).data;
}

const PARITY_TOLERANCE = 0.015;

test('editor preview and viewer element parity', async ({ page, request }) => {
  test.setTimeout(120_000);
  const suffix = Date.now().toString(36);
  const slideshowName = `E2E Parity ${suffix}`;
  let slideshowId: string | null = null;

  try {
    const existingSlideshowsResponse = await request.get('/api/slideshows');
    const existingSlideshowsBody = (await existingSlideshowsResponse.json()) as ApiPayload<
      Array<{ id: string; name: string }>
    >;
    const existingSlideshows = expectOk(existingSlideshowsBody);
    for (const existing of existingSlideshows) {
      if (existing.name.startsWith('E2E Parity ')) {
        await request.delete(`/api/slideshows/${existing.id}`);
      }
    }

    const createSlideshowResponse = await request.post('/api/slideshows', {
      data: {
        name: slideshowName,
        initialScreen: {
          key: 'main',
          width: 1920,
          height: 540
        }
      }
    });
    const slideshowBody = (await createSlideshowResponse.json()) as ApiPayload<{ id: string }>;
    const slideshow = expectOk(slideshowBody);
    slideshowId = slideshow.id;

    const slidesResponse = await request.get(`/api/slideshows/${slideshowId}/slides`);
    const slidesBody = (await slidesResponse.json()) as ApiPayload<SlideWithElements[]>;
    const slides = expectOk(slidesBody);
    const slideId = slides[0]?.id;
    expect(slideId).toBeTruthy();

    for (const element of slides[0]?.elements ?? []) {
      await request.delete(`/api/elements/${element.id}`);
    }

    const createdIds: string[] = [];

    const createShapeResponse = await request.post(`/api/slides/${slideId}/elements`, {
      data: {
        type: 'shape',
        x: 120,
        y: 80,
        width: 320,
        height: 180,
        rotation: 0,
        opacity: 1,
        zIndex: 1,
        animation: 'none',
        dataJson: {
          shape: 'rectangle',
          fill: '#21324b',
          stroke: '#5e7dac',
          strokeWidth: 2
        }
      }
    });
    const shapeBody = (await createShapeResponse.json()) as ApiPayload<CreatedElement>;
    createdIds.push(expectOk(shapeBody).id);

    const createSymbolResponse = await request.post(`/api/slides/${slideId}/elements`, {
      data: {
        type: 'symbol',
        x: 1320,
        y: 120,
        width: 180,
        height: 180,
        rotation: 0,
        opacity: 1,
        zIndex: 2,
        animation: 'none',
        dataJson: {
          iconName: 'home',
          iconStyle: 'outlined',
          color: '#ffffff'
        }
      }
    });
    const symbolBody = (await createSymbolResponse.json()) as ApiPayload<CreatedElement>;
    createdIds.push(expectOk(symbolBody).id);

    const createLabelResponse = await request.post(`/api/slides/${slideId}/elements`, {
      data: {
        type: 'label',
        x: 540,
        y: 390,
        width: 920,
        height: 88,
        rotation: 0,
        opacity: 1,
        zIndex: 3,
        animation: 'none',
        dataJson: {
          text: 'Parity diagnostics',
          fontSize: 58,
          fontFamily: 'sans-serif',
          color: '#ffffff',
          align: 'left'
        }
      }
    });
    const labelBody = (await createLabelResponse.json()) as ApiPayload<CreatedElement>;
    createdIds.push(expectOk(labelBody).id);

    await page.goto(`/show/${slideshowId}`);
    await expect(page.locator('.slide-layer')).toBeVisible();

    const viewerMetrics = await page.evaluate((elementIds) => {
      const slide = document.querySelector('.slide-layer') as HTMLElement | null;
      if (!slide) return null;
      const slideRect = slide.getBoundingClientRect();

      const normalize = (rect: DOMRect): NormalizedRect => ({
        x: (rect.left - slideRect.left) / slideRect.width,
        y: (rect.top - slideRect.top) / slideRect.height,
        width: rect.width / slideRect.width,
        height: rect.height / slideRect.height
      });

      const elements = Object.fromEntries(
        elementIds.map((id) => {
          const el = document.querySelector(`[data-element-id="${id}"]`) as HTMLElement | null;
          if (!el) return [id, null] as const;
          const wrapperRect = el.getBoundingClientRect();
          const child = el.querySelector('img,video') as HTMLElement | null;
          const childRect = child?.getBoundingClientRect() ?? null;
          return [
            id,
            {
              wrapper: normalize(wrapperRect),
              child: childRect ? normalize(childRect) : null
            }
          ] as const;
        })
      );

      return { elements };
    }, createdIds);

    expect(viewerMetrics).toBeTruthy();

    const password = process.env.E2E_EDITOR_PASSWORD ?? process.env.DEFAULT_PASSWORD ?? 'password';
    const loginResponse = await request.post('/api/auth/login', {
      data: {
        password,
        rememberMe: true
      }
    });
    const loginBody = (await loginResponse.json()) as ApiPayload<{ authenticated: boolean }>;
    test.skip(
      !loginBody.ok,
      loginBody.ok
        ? ''
        : `Editor login failed. Set E2E_EDITOR_PASSWORD to run parity diagnostics. (${loginBody.error.message})`
    );
    const setCookie = loginResponse.headers()['set-cookie'] ?? '';
    const tokenMatch = setCookie.match(/novislides_editor_session=([^;]+)/);
    expect(tokenMatch, 'Editor session cookie missing from login response').toBeTruthy();
    const token = tokenMatch?.[1] ?? '';
    await page.context().addCookies([
      {
        name: 'novislides_editor_session',
        value: token,
        domain: 'localhost',
        path: '/'
      }
    ]);

    await page.goto('/edit');

    const slideshowsDrawer = page.getByRole('dialog', { name: 'Slideshows' });
    if (!(await slideshowsDrawer.isVisible())) {
      await page.getByRole('button', { name: 'Slideshows' }).click({ force: true });
      await expect(slideshowsDrawer).toBeVisible();
    }
    await slideshowsDrawer.getByText(slideshowName, { exact: false }).first().click();
    await expect(page.locator('.editor-canvas canvas').first()).toBeVisible();
    await page.waitForFunction(() => Boolean(document.querySelector('[data-editor-parity-root=\"true\"]')));

    const editorMetrics = await page.evaluate((elementIds) => {
      const slide = document.querySelector('[data-editor-parity-slide=\"true\"]') as HTMLElement | null;
      if (!slide) return null;
      const slideRect = slide.getBoundingClientRect();

      const normalize = (rect: DOMRect): NormalizedRect => ({
        x: (rect.left - slideRect.left) / slideRect.width,
        y: (rect.top - slideRect.top) / slideRect.height,
        width: rect.width / slideRect.width,
        height: rect.height / slideRect.height
      });

      const elements = Object.fromEntries(
        elementIds.map((id) => {
          const el = document.querySelector(`[data-editor-parity-element-id=\"${id}\"]`) as HTMLElement | null;
          if (!el) return [id, null] as const;
          return [id, normalize(el.getBoundingClientRect())] as const;
        })
      );

      return { elements };
    }, createdIds);

    expect(editorMetrics).toBeTruthy();

    for (const elementId of createdIds) {
      const viewerEntry = viewerMetrics?.elements[elementId];
      const editorEntry = editorMetrics?.elements[elementId];
      expect(viewerEntry).toBeTruthy();
      expect(editorEntry).toBeTruthy();
      if (!viewerEntry || !editorEntry) continue;

      expect(Math.abs(viewerEntry.wrapper.x - editorEntry.x)).toBeLessThanOrEqual(PARITY_TOLERANCE);
      expect(Math.abs(viewerEntry.wrapper.y - editorEntry.y)).toBeLessThanOrEqual(PARITY_TOLERANCE);
      expect(Math.abs(viewerEntry.wrapper.width - editorEntry.width)).toBeLessThanOrEqual(PARITY_TOLERANCE);
      expect(Math.abs(viewerEntry.wrapper.height - editorEntry.height)).toBeLessThanOrEqual(PARITY_TOLERANCE);

      if (viewerEntry.child) {
        expect(Math.abs(viewerEntry.child.x - viewerEntry.wrapper.x)).toBeLessThanOrEqual(0.002);
        expect(Math.abs(viewerEntry.child.y - viewerEntry.wrapper.y)).toBeLessThanOrEqual(0.002);
        expect(Math.abs(viewerEntry.child.width - viewerEntry.wrapper.width)).toBeLessThanOrEqual(0.002);
        expect(Math.abs(viewerEntry.child.height - viewerEntry.wrapper.height)).toBeLessThanOrEqual(0.002);
      }
    }
  } finally {
    if (slideshowId) {
      try {
        await request.delete(`/api/slideshows/${slideshowId}`);
      } catch {
        // Ignore cleanup failures in diagnostics test teardown.
      }
    }
  }
});

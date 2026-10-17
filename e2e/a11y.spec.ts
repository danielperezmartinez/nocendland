import AxeBuilder from '@axe-core/playwright';
import {expect, test} from '@playwright/test';

// Rutas públicas que se analizan con AXE. Las rutas tras inicio de sesión están en
// a11y-authenticated.spec.ts y se ejecutan con `pnpm run test:a11y:local`.
const publicRoutes = [
  {path: '/auth', ready: 'button'},
  {path: '/privacy', ready: 'h1'},
  {path: '/legal-notice', ready: 'h1'},
  {path: '/share/training/token-de-prueba-inexistente', ready: 'main, h1, h2, p'},
];

test.beforeEach(async ({page}) => {
  // Ninguna prueba de accesibilidad puede llegar al Supabase remoto compartido.
  await page.route(/\.supabase\.co\//, (route) =>
    route.fulfill({status: 404, contentType: 'application/json', body: '{"message":"not_found"}'}),
  );
});

for (const {path, ready} of publicRoutes) {
  test(`WCAG AA sin infracciones: ${path}`, async ({page}) => {
    await page.goto(path);
    await page.locator(ready).first().waitFor();
    await page.waitForLoadState('networkidle');

    const {violations} = await new AxeBuilder({page})
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
      .analyze();

    expect(violations).toEqual([]);
  });
}

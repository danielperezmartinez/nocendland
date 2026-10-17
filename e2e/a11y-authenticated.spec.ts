import AxeBuilder from '@axe-core/playwright';
import {expect, Page, test} from '@playwright/test';

// AXE sobre las rutas tras inicio de sesión. Solo se ejecuta con
// `pnpm run test:a11y:local`, que levanta una pila local de Supabase y pasa sus
// claves de demostración. Todas las peticiones que la app dirige al proyecto
// remoto se redirigen a esa pila; cualquier otra petición a supabase.co se aborta.
const localUrl = process.env['E2E_SUPABASE_URL'];
const localAnonKey = process.env['E2E_SUPABASE_ANON_KEY'];
const localServiceRoleKey = process.env['E2E_SUPABASE_SERVICE_ROLE_KEY'];
const remoteHost = 'zckqbrwdgxohdymiwbfz.supabase.co';
const storageKey = 'sb-zckqbrwdgxohdymiwbfz-auth-token';

const authenticatedRoutes = [
  '/',
  '/llimbro/nutrition/ingredients',
  '/llimbro/nutrition/intakes',
  '/llimbro/nutrition/objectives',
  '/llimbro/training/exercises',
  '/llimbro/training/schedule',
  '/llimbro/training/tracking',
  '/llimbro/training/measurements',
  '/finances/summary',
  '/finances/movements',
  '/finances/recurring',
  '/finances/plan',
  '/finances/goals',
  '/miscellaneous',
  '/data',
];

test.describe('rutas autenticadas', () => {
  test.skip(!localUrl || !localAnonKey || !localServiceRoleKey, 'Requiere la pila local: pnpm run test:a11y:local');

  let session: Record<string, unknown>;

  test.beforeAll(async ({request}) => {
    const email = `a11y-${Date.now()}@test.local`;
    const password = `A11y-${crypto.randomUUID()}`;
    const created = await request.post(`${localUrl}/auth/v1/admin/users`, {
      headers: {apikey: localServiceRoleKey!, authorization: `Bearer ${localServiceRoleKey}`},
      data: {email, password, email_confirm: true, user_metadata: {user_name: 'Prueba AXE'}},
    });
    expect(created.ok()).toBe(true);
    const signedIn = await request.post(`${localUrl}/auth/v1/token?grant_type=password`, {
      headers: {apikey: localAnonKey!},
      data: {email, password},
    });
    expect(signedIn.ok()).toBe(true);
    session = await signedIn.json();
  });

  test.beforeEach(async ({page}) => {
    await routeSupabaseToLocalStack(page);
    await page.addInitScript(([key, value]) => localStorage.setItem(key, value), [storageKey, JSON.stringify(session)]);
  });

  for (const path of authenticatedRoutes) {
    test(`WCAG AA sin infracciones: ${path}`, async ({page}) => {
      await page.goto(path);
      await page.waitForURL(url => !url.pathname.startsWith('/auth'));
      // La página solo cuenta como cargada si la shell y su contenido se han pintado;
      // así AXE no analiza una pantalla en blanco o atascada cargando.
      await expect(page.locator('.app-shell')).toBeVisible();
      await expect(page.locator('.app-shell :is(h1, h2)').first()).toBeVisible();
      if (path === '/') await expect(page.locator('app-user-info')).toContainText('Prueba AXE');
      await page.waitForLoadState('networkidle');

      const {violations} = await new AxeBuilder({page})
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
        .analyze();

      expect(violations).toEqual([]);
    });
  }
});

/** Redirige al Supabase local todas las peticiones dirigidas al proyecto remoto. */
async function routeSupabaseToLocalStack(page: Page): Promise<void> {
  await page.route(/\.supabase\.co\//, async route => {
    const original = new URL(route.request().url());
    if (original.host !== remoteHost) return route.abort();
    const headers = {...route.request().headers(), apikey: localAnonKey!};
    if (!headers['authorization']?.startsWith('Bearer ey')) headers['authorization'] = `Bearer ${localAnonKey}`;
    const response = await route.fetch({url: `${localUrl}${original.pathname}${original.search}`, headers});
    await route.fulfill({response});
  });
}

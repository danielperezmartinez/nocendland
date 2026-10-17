import {defineConfig, devices} from '@playwright/test';

// Configuración de las pruebas e2e de accesibilidad (AXE). Sirve la app con el
// servidor de desarrollo de Angular; las pruebas bloquean cualquier petición a
// Supabase para no tocar nunca el proyecto remoto compartido.
const port = 4310;

export default defineConfig({
  testDir: './e2e',
  forbidOnly: !!process.env['CI'],
  retries: 0,
  reporter: process.env['CI'] ? 'github' : 'list',
  use: {
    baseURL: `http://localhost:${port}`,
    locale: 'es-ES',
  },
  projects: [{name: 'chromium', use: {...devices['Desktop Chrome']}}],
  webServer: {
    command: `pnpm exec ng serve --port ${port}`,
    url: `http://localhost:${port}/auth`,
    // Siempre arranca su propio servidor desde este directorio: reutilizar uno
    // existente podría servir otra copia del repo.
    reuseExistingServer: false,
    timeout: 180_000,
  },
});

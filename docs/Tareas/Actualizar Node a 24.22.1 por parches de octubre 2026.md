---
Nombre: Actualizar Node a 24.22.1 por parches de octubre 2026
Estado: En curso
Resumen: Node pasa de 24.19.0 a 24.22.1, que corrige los fallos de seguridad del 21 de octubre de 2026, en pnpm, en el CI y en engines. Producción no estaba afectada porque es estática; el build y el CI sí usaban la versión vulnerable.
Decisiones: Se aplica la política común de versión de Node de las webs del usuario, decidida el 2026-10-23: versión exacta en setup-node, el mismo número en useNodeVersion y nodeVersion, y engines.node ">=24.22.1 <25". La CLI de Supabase (binario de Bun con su propio almacén de raíces) no se actualiza hasta que haya una versión corregida.
Bloqueada: []
Fecha de creación: 2026-10-23
Última modificación: 2026-10-23
---

# Actualizar Node a 24.22.1 por parches de octubre 2026

## Contexto

El 21 de octubre de 2026, Node publicó parches de seguridad para la 24.x (corregidos en 24.22.1): descompresión Brotli, verificación del nombre de host TLS, `dns.resolve`, sockets keep-alive y retirada de CA intermedias de eMudhra/emSign comprometidas. [[Migrar runtime a Node 24]] había dejado fijado 24.19.0 en `pnpm-workspace.yaml` y en el CI. Como pnpm descarga esa versión para ejecutar los scripts, el build de Vercel la usaba aunque el proyecto tenga configurado Node 24.x.

La aplicación publicada es una SPA estática, sin SSR ni funciones de Vercel, así que no ejecuta Node en producción. Las versiones afectadas solo se usaban en el build, el CI y los scripts locales.

## Cambios

- `pnpm-workspace.yaml`: `useNodeVersion` y `nodeVersion` en `24.22.1`.
- `.github/workflows/seguridad.yml`: `node-version: 24.22.1` en `verificar`, `rls` y `a11y`.
- `package.json`: `engines.node` en `">=24.22.1 <25"` y versión 0.10.1.

## Pendiente

- La CLI de Supabase 2.110.0 se distribuye compilada con Bun 1.3.13, que trae su propio almacén de raíces. Se actualizará cuando haya una versión que retire las CA de emSign.

## Verificación

- `pnpm exec node -v`: `v24.22.1` (pnpm descarga la versión sin problemas).
- `pnpm install --frozen-lockfile`: correcto.
- `pnpm exec ng test --watch=false`: 57 archivos y 204 pruebas correctas.
- `pnpm run build`: correcto, con los mismos avisos de presupuesto de siempre. `pnpm run check:bundle-secrets`: sin secretos.
- `pnpm run test:security:db:local`: 3 archivos y 133 pruebas correctas.
- Falta anotar: la PR, los checks del CI y la versión de Node en el log del build de producción de Vercel.

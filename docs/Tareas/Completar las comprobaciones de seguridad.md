---
Nombre: Completar las comprobaciones de seguridad
Estado: En curso
Resumen: Las comprobaciones del sistema de seguridad ya están montadas, pero el test de catálogo falla en local por pg_net (preinstalado en la imagen local y ausente en el remoto) y por el bucket no versionado, AXE solo cubre las rutas públicas y el workflow de CI todavía no es obligatorio en la rama principal.
Decisiones: "pg_net se retira solo de la base local de pruebas, porque una migración ejecutada como postgres no puede revocar los permisos que concede supabase_admin; a cambio, los scripts fallan si una migración instala pg_net o http. Para cumplir WCAG AA, los botones principales y los estados activos con texto usan el tono fuerte del área; el acento base queda para decoración."
Bloqueada: []
Fecha de creación: 2026-10-16T23:23:13+02:00
Última modificación: 2026-10-17T14:40:00+02:00
---

# Completar las comprobaciones de seguridad

## Contexto

Las comprobaciones se montaron el 2026-10-16 con el sistema «Seguridad, coste y cumplimiento». Primera ejecución en local (Supabase CLI 2.110.0, Docker):

- `supabase/tests/10_aislamiento_usuarios.test.sql`: 107/107 correctas. Una prueba de mutación (política `SELECT USING (true)` temporal en `finance_goal`) la hace fallar, como se esperaba.
- `supabase/tests/00_seguridad_catalogo.test.sql`: 7/9. Fallan:
  - **6 (pg_net):** la imagen local de Supabase trae `pg_net` instalado con `EXECUTE` para `anon` y `authenticated`. En `devappsdpm-db` no está instalado (consulta de extensiones de solo lectura del 2026-10-16). Hay que decidir si una migración lo retira o revoca sus permisos para que la base local se parezca al remoto, teniendo en cuenta que el proyecto es compartido con gift-card y Outify.
  - **8 (bucket versionado):** el bucket `nocendland` no está en ninguna migración. Se resuelve con [[Limitar tamaño y cuota del bucket de Nocendland]].
- `e2e/a11y.spec.ts`: 2/2 en `/auth` y `/share/training/:token`, con las peticiones a Supabase bloqueadas.
- `scripts/check-bundle-secrets.mjs`: sin secretos en `dist/` (61 archivos); una prueba de mutación con un JWT `service_role` lo detecta.

## Criterios de finalización

- El test de catálogo está en verde en local y en CI sin rebajar ninguna comprobación.
- AXE cubre también las rutas tras inicio de sesión (shell, Llimbro, Finanzas, Datos, Miscelánea) con un usuario de prueba de una pila local de Supabase (`storageState`), sin llegar nunca al remoto.
- Hay instrucciones o un script para ejecutar `pnpm run test:security:db` en local sin chocar con otras pilas de Supabase en los puertos por defecto (la primera ejecución usó un directorio de trabajo temporal con puertos propios).
- Con los jobs `rls` y `a11y` de `.github/workflows/seguridad.yml` en verde, se marcan como obligatorios en la protección de la rama principal.

## Verificación

- `pnpm run test:security:db`, `pnpm run test:a11y`, `pnpm run build` y `pnpm run check:bundle-secrets` en verde, en local y en CI.

## Resultado (2026-10-17)

- `scripts/local-supabase.mjs`, `scripts/test-security-db-local.mjs` y `scripts/test-a11y-local.mjs` levantan pilas locales con proyecto y puertos propios. Las usan `pnpm run test:security:db:local`, `pnpm run test:a11y:local` y el CI.
- La pila de AXE ajusta en local `pgrst.db_schemas`, que la migración principal fija con `gift_card` (inexistente en local), y Playwright redirige a ella todas las peticiones de la app al proyecto remoto.
- AXE en 15 rutas autenticadas. Se corrigieron la navegación lateral cerrada (`inert` en lugar de `aria-hidden` con foco dentro), el contraste de botones y estados activos en Llimbro, Miscelánea y Finanzas, y la cifra decorativa de Seguimiento.

## Verificación local

- `pnpm run test:security:db:local`: 133/133.
- `pnpm run test:a11y:local`: 19/19 (4 públicas y 15 autenticadas, con espera a que la shell y el perfil se pinten).
- `pnpm run build` y `pnpm run check:bundle-secrets`: correctos.
- `pnpm test`: 179/179.

## Pendiente

El workflow `Seguridad` pasó en GitHub en la PR y en `main` (2026-10-17). `main` no tiene protección de rama: falta que el usuario decida activarla y marcar `rls` y `a11y` como obligatorios.

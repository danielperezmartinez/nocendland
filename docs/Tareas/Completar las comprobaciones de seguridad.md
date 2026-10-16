---
Nombre: Completar las comprobaciones de seguridad
Estado: Pendiente
Resumen: Las comprobaciones del sistema de seguridad ya están montadas, pero el test de catálogo falla en local por pg_net (preinstalado en la imagen local y ausente en el remoto) y por el bucket no versionado, AXE solo cubre las rutas públicas y el workflow de CI todavía no es obligatorio en la rama principal.
Decisiones: Los tests SQL se ejecutan solo contra la base local construida con las migraciones, nunca contra devappsdpm-db.
Bloqueada: ["[[Limitar tamaño y cuota del bucket de Nocendland]]"]
Fecha de creación: 2026-10-16T23:23:13+02:00
Última modificación: 2026-10-16T23:23:13+02:00
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

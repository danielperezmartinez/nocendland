---
Nombre: Retirar restos de Railway
Estado: Hecha
Resumen: Eliminados los artefactos y referencias activas de Railway; Supabase conserva únicamente las redirects usadas por Vercel y Angular local.
Decisiones: Vercel es la única plataforma de despliegue del frontend; la allowlist de Supabase conserva producción y los callbacks locales de Angular en el puerto 4200.
Bloqueada: []
Fecha de creación: 2026-08-06T17:49:32
Última modificación: 2026-08-22
---

# Retirar restos de Railway

## Contexto

El repositorio todavía contiene `nixpacks.toml` y `Caddyfile`, asociados al despliegue anterior en Railway. La configuración de autenticación de Supabase conserva además un redirect para `http://localhost:3000`, mientras que el desarrollo actual usa el puerto `4200`.

## Alcance

- Confirmar que Vercel no depende de los archivos heredados.
- Eliminar `nixpacks.toml` y `Caddyfile`.
- Retirar de Supabase el redirect obsoleto de `localhost:3000` si no tiene otro consumidor.
- Comprobar desarrollo local, build y despliegue después de la limpieza.

## Criterios de finalización

- No quedan artefactos de Railway en el repositorio ni en la documentación activa.
- Los redirects de Supabase solo contienen los entornos realmente utilizados.
- La aplicación funciona en local y en Vercel.

## Resultado

- Eliminados `nixpacks.toml` y `Caddyfile`.
- Retiradas del `README.md` raíz la URL de Railway y la referencia obsoleta a `localhost:3000`.
- Eliminada de Supabase la redirect exacta `http://localhost:3000`; se conservaron producción y los callbacks locales de Angular.
- Publicada la versión `0.5.2` mediante el commit `8cd3f4d`.

## Verificación

- `pnpm run build`: correcto; permanecen los avisos de presupuesto ya conocidos.
- `pnpm test -- --watch=false`: 47 archivos y 122 tests correctos.
- Desarrollo local en `127.0.0.1:4200`: contenido renderizado sin overlay ni errores de consola.
- Vercel: deployment de producción `dpl_5kaUNPQyBCXpEojHXNUn69f4oPCA` en estado `READY`; `https://nocendland.vercel.app/` responde `200 OK` y no hay errores de runtime registrados en la última hora.

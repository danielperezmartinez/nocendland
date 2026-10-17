---
Nombre: No confiar en email y avatar del perfil
Estado: Hecha
Resumen: Las políticas user_insert_own y user_update_own permiten que el propio usuario escriba cualquier email o avatar_url en nocendland.user, porque no hay trigger que los copie de auth.users; hay que rellenarlos desde Auth o dejar de usarlos como dato fiable.
Decisiones: "El trigger se pone sobre nocendland.user, no sobre auth.users (compartido): email y avatar se copian de Auth en cada inserción o actualización, y el cliente puede seguir enviándolos sin efecto."
Bloqueada: []
Fecha de creación: 2026-10-16T23:23:13+02:00
Última modificación: 2026-10-17T14:40:00+02:00
---

# No confiar en email y avatar del perfil

## Contexto

Hallazgo de gravedad baja de la auditoría del 2026-10-16. `nocendland."user"` lo inicializa el cliente con un `upsert` (véase `AuthService`), y las políticas de `supabase/migrations/20260823194409_migrate_to_nocendland_schema.sql` (alrededor de la línea 330) solo comprueban `auth.uid() = id`. Un usuario puede escribir un `email` distinto al suyo o un `avatar_url` que apunte a cualquier dominio. Hoy solo afecta a su propio perfil, pero cualquier uso futuro de estas columnas (compartir, avisos) heredaría el problema.

No se puede añadir un trigger sobre `auth.users`, que es compartido, sin valorar el impacto en las otras apps (véase [[Tareas/Revisar bajas en Supabase compartido]]).

## Criterios de finalización

- `email` y `avatar_url` se rellenan desde `auth.users` en el servidor (trigger `BEFORE INSERT/UPDATE` en `nocendland."user"` con `SECURITY DEFINER` y `search_path = ''`) o se dejan de guardar y se leen de la sesión.
- El cliente ya no puede escribir esas columnas (grants por columna o trigger que las sobrescribe).
- Test en `supabase/tests/` de que un usuario no puede fijar un email ajeno.

## Verificación

- `pnpm run test:security:db` y tests de `AuthService` en verde.

## Resultado (2026-10-17)

`nocendland_private.sync_user_identity()` (`SECURITY DEFINER`, `search_path` vacío) sobrescribe `email` y `avatar_url` con los de `auth.users` antes de cada inserción o actualización de `nocendland."user"`. No cambia `AuthService`.

## Verificación local

- `supabase/tests/20_limites_coste.test.sql`: crear o actualizar el perfil con un email y un avatar falsos conserva los de Auth.
- AXE autenticado: la shell muestra el perfil creado por la app contra la pila local.

## Aplicado en remoto (2026-10-17)

- Migración aplicada en `devappsdpm-db` con la versión `20261017123157` del ledger compartido: `20261017090000` ya la usaba `outify_security_limits`, así que el archivo del repo se renombró a `20261017123157_nocendland_security_cost_limits.sql`.
- Comprobado en remoto: bucket a 2 MB con PNG/JPEG/WebP, cinco funciones `SECURITY DEFINER` con `search_path` vacío y sin `EXECUTE` para `anon`, triggers de topes y de identidad, 21 restricciones de longitud y políticas de Storage de Outify intactas.
- `training-share` desplegada como versión 2 (`verify_jwt = false`, igual que antes); responde `share_not_found` (404), `authentication_required` (401) y `method_not_allowed` (405) con llamadas anónimas.
- Frontend 0.9.0 en producción en Vercel (`READY`, commit `073a0e7`) y workflow `Seguridad` en verde en GitHub.

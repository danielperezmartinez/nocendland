---
Nombre: No confiar en email y avatar del perfil
Estado: En curso
Resumen: Las políticas user_insert_own y user_update_own permiten que el propio usuario escriba cualquier email o avatar_url en nocendland.user, porque no hay trigger que los copie de auth.users; hay que rellenarlos desde Auth o dejar de usarlos como dato fiable.
Decisiones: "El trigger se pone sobre nocendland.user, no sobre auth.users (compartido): email y avatar se copian de Auth en cada inserción o actualización, y el cliente puede seguir enviándolos sin efecto."
Bloqueada: []
Fecha de creación: 2026-10-16T23:23:13+02:00
Última modificación: 2026-10-17T09:46:56+02:00
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


## Pendiente de aplicar en remoto

El cambio está en la rama `feat/seguridad-coste-cumplimiento`, sin push. Falta aplicar `supabase/migrations/20261017090000_security_cost_limits.sql` en `devappsdpm-db` y, cuando corresponda, desplegar la función `training-share` y el frontend, con aprobación explícita del usuario. La tarea pasa a `Hecha` cuando el resultado se verifique en remoto.

---
Nombre: Restringir el acceso a la API de Nocendland
Estado: En curso
Resumen: Cualquier cuenta del Auth compartido de devappsdpm-db (también las creadas para gift-card u Outify) obtiene el rol authenticated y puede usar toda la API de Nocendland pese a ser una app personal; hay que limitarla a una lista de usuarios permitidos sin romper las otras apps.
Decisiones: "La app queda abierta a cualquier cuenta del Auth compartido, sin lista de permitidos: aunque es personal, quien la encuentre debe poder usarla. El abuso se limita con topes por usuario (Storage, filas, textos, enlaces) en lugar de cerrar el acceso; no se toca la configuración global de Auth."
Bloqueada: []
Fecha de creación: 2026-10-16T23:23:13+02:00
Última modificación: 2026-10-17T09:46:56+02:00
---

# Restringir el acceso a la API de Nocendland

## Contexto

Hallazgo de gravedad media de la auditoría de solo lectura del 2026-10-16. Auth es un recurso compartido de `devappsdpm-db`. Un inicio de sesión OAuth en cualquiera de las apps da el rol `authenticated`, y con él se puede crear el perfil en `nocendland.user`, escribir en todas las tablas propias, llamar a las RPC, subir archivos al bucket `nocendland` e invocar `training-share`. RLS impide ver los datos de otros usuarios, pero no impide usar ni abusar del servicio (filas, Storage, invocaciones) en un plan gratuito que comparten tres apps.

Cerrar el registro de Auth no es una opción por sí sola, porque afectaría a gift-card y a Outify.

## Criterios de finalización

- Existe una lista de usuarios permitidos de Nocendland en `nocendland_private`, sin exponer y gestionada solo por migración o `service_role`.
- Las políticas de las tablas de `nocendland`, de Storage del bucket `nocendland` y las RPC exigen pertenecer a esa lista, por ejemplo con una función `SECURITY DEFINER` con `search_path = ''` y sin `EXECUTE` para `anon`.
- `training-share` rechaza las acciones autenticadas de usuarios no permitidos.
- El frontend muestra un estado claro de «sin acceso» y no inicializa el perfil de un usuario no permitido.
- Todo el cambio está en migraciones del repo, y un test en `supabase/tests/` comprueba que un usuario autenticado no permitido no lee, no escribe ni sube archivos.
- Se valora con el usuario si conviene, además, un Auth Hook de proyecto, y su impacto en las otras apps queda escrito.

## Verificación

- `pnpm run test:security:db` en verde, en local.
- Tests, build y prueba manual de inicio de sesión con un usuario permitido y otro no permitido.

## Resultado (2026-10-17)

Se descartó la lista de permitidos por decisión del usuario. El riesgo de abuso se cubre con los topes de [[Limitar tamaño y cuota del bucket de Nocendland]] y [[Endurecer la función training-share]] y con los de la misma migración `supabase/migrations/20261017090000_security_cost_limits.sql`: 2.000 ingredientes, 50.000 ingestas, 500 ejercicios, 50 horarios, 2.000 elementos de horario, 50.000 sesiones y series, y entre 200 y 20.000 filas en las tablas de Finanzas, además de longitudes máximas en los textos libres. Como hay terceros, se publican las páginas legales ([[Publicar política de privacidad y aviso legal]]).

## Verificación local

- `pnpm run test:security:db:local`: 133/133 (incluye el tope de horarios y la longitud de textos en `supabase/tests/20_limites_coste.test.sql`).


## Pendiente de aplicar en remoto

El cambio está en la rama `feat/seguridad-coste-cumplimiento`, sin push. Falta aplicar `supabase/migrations/20261017090000_security_cost_limits.sql` en `devappsdpm-db` y, cuando corresponda, desplegar la función `training-share` y el frontend, con aprobación explícita del usuario. La tarea pasa a `Hecha` cuando el resultado se verifique en remoto.

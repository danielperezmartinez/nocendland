---
Nombre: Restringir el acceso a la API de Nocendland
Estado: Pendiente
Resumen: Cualquier cuenta del Auth compartido de devappsdpm-db (también las creadas para gift-card u Outify) obtiene el rol authenticated y puede usar toda la API de Nocendland pese a ser una app personal; hay que limitarla a una lista de usuarios permitidos sin romper las otras apps.
Decisiones: ""
Bloqueada: []
Fecha de creación: 2026-10-16T23:23:13+02:00
Última modificación: 2026-10-16T23:23:13+02:00
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

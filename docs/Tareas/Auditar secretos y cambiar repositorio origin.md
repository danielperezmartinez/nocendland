---
Nombre: Auditar secretos y cambiar repositorio origin
Estado: Hecha
Resumen: El repositorio está saneado y preparado para publicar main en el nuevo origin público con la versión 0.6.1; el enlace y la verificación de Vercel quedan a cargo del usuario cuando cree el proyecto.
Decisiones: La clave JWT versionada es la clave anon pública de Supabase; producción aplica RLS y mínimos privilegios; el seed identifica al propietario mediante UUID reservados sin PII; el repositorio público partirá de un único commit raíz con identidad noreply y la historia privada se conservará solo como respaldo recuperable.
Bloqueada: []
Fecha de creación: 2026-08-22T21:15:36+02:00
Última modificación: 2026-08-22T22:01:00+02:00
---

# Auditar secretos y cambiar repositorio origin

## Objetivo

Comprobar que un push del historial y del estado versionado no expondría claves, tokens, credenciales, datos privados ni configuración sensible. Solo después de una auditoría satisfactoria se cambiará `origin` a `git@github.com:danielperezmartinez/nocendland.git`.

## Criterios de aceptación

- Se revisan el árbol versionado actual, el historial completo alcanzable, los nombres de archivo sensibles y la configuración de Git.
- Se distinguen secretos reales de identificadores públicos o valores de ejemplo.
- El primer push solo se realiza tras completar el saneamiento y revisar explícitamente el contenido staged.
- `origin` solo se cambia si la revisión no detecta exposición sensible que requiera limpieza previa.
- El remoto final queda verificado mediante una consulta de solo lectura.

## Resultado de la auditoría

- El árbol versionado y el historial alcanzable no contienen claves privadas PEM, credenciales en URLs ni tokens reconocibles de GitHub, GitLab, AWS, Google, Slack, Stripe, OpenAI, npm o Supabase con rol privilegiado.
- `src/environments/environment.ts` y `src/environments/environment.prod.ts` contienen el mismo JWT de Supabase. Su payload declara `role: anon`; es una clave pública de cliente, no una credencial `service_role`.
- La Edge Function obtiene `SUPABASE_ANON_KEY` y `SUPABASE_SERVICE_ROLE_KEY` mediante `Deno.env`; no hay valores privilegiados fijados en el código.
- `supabase/seeds/devappsdpm_visual_training.sql` contiene un Gmail personal en dos líneas. La misma dirección figura en la configuración global de Git y como email de autor en 30 de los 31 commits alcanzables desde `main`.
- No existen `.env`, certificados, almacenes de claves, volcados de base de datos ni archivos de credenciales dentro del workspace fuera de dependencias. El `.npmrc` versionado de la Edge Function solo contiene comentarios.
- Las imágenes versionadas no contienen etiquetas EXIF de ubicación, cámara, autor o fecha; los PNG de ingredientes solo declaran Inkscape como software.
- El repositorio público de destino responde correctamente y todavía no contiene referencias ni commits.
- La revisión remota de solo lectura confirma RLS en las once tablas de `public`, vistas de Nutrición con `security_invoker=true` y un bucket privado con políticas por propietario.
- Producción conservaba una política `select_user_info` aplicable a `public` con `USING (true)`. Junto con el permiso `SELECT` de `anon`, exponía sin autenticación las columnas `id`, `created_at`, `email`, `user_name` y `avatar_url` de `public.user`.
- El asesor de seguridad también marca la función trigger `public.insert_user_in_public_table_for_new_user()` como `SECURITY DEFINER`, ejecutable por `anon` y `authenticated`, y sin `search_path` fijado. Los roles de aplicación mantienen además privilegios de tabla mucho más amplios de lo necesario en el dominio de Nutrición.
- La política y la función anteriores no aparecen en las migraciones locales, por lo que existe deriva entre el esquema remoto y el historial reproducible del repositorio.

## Bloqueo inicial

Publicar el `main` anterior habría expuesto el Gmail tanto en el seed como en los metadatos del historial y habría facilitado localizar una API que permitía leer perfiles sin autenticación. El cambio de `origin` se mantuvo detenido hasta corregir y verificar la política remota, registrar la corrección en una migración, crear una instantánea limpia sin el historial anterior y configurar una identidad `noreply`.

## Saneamiento aplicado

- La migración `20260822194554_harden_public_api_access.sql` elimina el acceso de `anon`, limita los privilegios de las tablas a las operaciones usadas, restringe cada perfil a su propietario autenticado y cierra la función trigger al acceso por API con `search_path` vacío.
- La migración quedó aplicada y registrada en Supabase. La comprobación posterior confirma que `anon` no puede leer `public.user` ni ejecutar el trigger, mientras un usuario autenticado puede consultar exclusivamente su propio perfil.
- El seed ya no contiene email ni UUID de usuario. Reutiliza el único propietario de sus UUID reservados y solo permite inicializar desde cero cuando existe un único perfil.
- La ejecución completa del seed se validó dentro de una transacción revertida, sin persistir cambios.
- `.gitignore` excluye archivos de entorno, metadatos locales de enlace de Supabase, claves privadas, certificados y almacenes de credenciales comunes.
- Las 124 pruebas terminan correctamente y el build de producción finaliza con los avisos de presupuesto ya conocidos.

## Primera publicación

- La historia pública de `main` contiene un único commit raíz con identidad `319049409+danielperezmartinez@users.noreply.github.com` y no tiene relación de parentesco con los commits privados anteriores.
- El historial privado previo se conserva en un bundle verificado fuera del repositorio y mediante el remoto `private-origin`; ninguna de esas referencias forma parte de `main`.
- `origin` apunta a `git@github.com:danielperezmartinez/nocendland.git` y `main` queda configurada para seguir `origin/main` cuando exista.
- La versión se incrementó de `0.6.0` a `0.6.1` antes del primer push, conforme a la regla SemVer del proyecto.
- El usuario creará y enlazará posteriormente el proyecto de Vercel, por lo que en esta publicación no existe todavía un despliegue que pueda verificarse.

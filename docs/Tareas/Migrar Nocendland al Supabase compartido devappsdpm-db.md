---
Nombre: Migrar Nocendland al Supabase compartido devappsdpm-db
Estado: Hecha
Resumen: Estructura, datos, Storage, usuarios, Edge Function y frontend están migrados, verificados y desplegados en el esquema nocendland de devappsdpm-db; los flujos interactivos de Google y GitHub funcionan en producción y la migración queda completada.
Decisiones: El esquema expuesto es nocendland y nocendland_private aloja solo el trigger interno no expuesto; no se publica ninguna tabla de Nocendland en Realtime porque la aplicación no lo usa; el trigger global de Auth se sustituye por creación de perfil desde el cliente bajo RLS; gift_card queda intacto; el proyecto antiguo permanece activo hasta confirmación explícita del usuario.
Bloqueada: []
Fecha de creación: 2026-08-23T00:00:00+02:00
Última modificación: 2026-08-24T01:27:25+02:00
---

# Migrar Nocendland al Supabase compartido devappsdpm-db

## Objetivo

Trasladar la estructura, los datos y las integraciones de Nocendland al proyecto Supabase compartido `devappsdpm-db` (`zckqbrwdgxohdymiwbfz`) dentro de un esquema propio `nocendland`, sin modificar el esquema `gift_card` ni ampliar accidentalmente los privilegios de otras aplicaciones.

## Alcance

- Inventariar base de datos, Auth, Storage, Realtime, funciones, triggers, políticas, permisos y Edge Functions del proyecto de origen.
- Diseñar y aplicar una migración reproducible hacia `nocendland` que conserve claves, relaciones, restricciones, índices y datos.
- Configurar grants mínimos, RLS, PostgREST y Realtime sin reemplazar ni alterar la configuración de otras aplicaciones.
- Adaptar el cliente Angular, las suscripciones Realtime y los tipos TypeScript al nuevo proyecto y esquema.
- Verificar tests, build, asesores de Supabase y flujos reales de autenticación, datos, Storage y funciones utilizadas.

## Restricciones

- No modificar, renombrar ni eliminar `gift_card` ni sus objetos.
- Conservar expuestos en PostgREST `public`, `graphql_public` y `gift_card` al añadir `nocendland`.
- No conceder privilegios globales ni privilegios por defecto que alcancen otros esquemas.
- No pausar ni eliminar el proyecto anterior sin confirmación explícita del usuario.
- Documentar los recursos compartidos que no puedan aislarse por esquema, en especial Auth, Storage, Edge Functions, secretos, roles y límites del proyecto.

## Verificación prevista

- Comparación de inventarios y recuentos entre origen y destino.
- Pruebas de acceso negativo y positivo para `anon`, `authenticated` y `service_role`.
- Comprobación de publicaciones Realtime y esquemas expuestos por PostgREST.
- Regeneración de tipos, tests y build de producción.
- Flujos reales principales contra `devappsdpm-db` y revisión final de los asesores de seguridad y rendimiento.

## Resultado

### Migración aplicada

- `devappsdpm-db` contiene las once tablas y las dos vistas de Nocendland dentro de `nocendland`; las cuatro RPC públicas usan `security invoker` y la función del trigger de horarios vive en `nocendland_private` sin grants para roles de API.
- Las once tablas tienen RLS. `anon` no posee `USAGE` del esquema ni grants de tabla; `authenticated` conserva solo las operaciones que usa el frontend y `service_role` carece de privilegios `TRUNCATE`, `REFERENCES`, `TRIGGER` o `CREATE` innecesarios.
- PostgREST expone `public, graphql_public, gift_card, nocendland`. La publicación `supabase_realtime` mantiene exclusivamente `gift_card.shared_cards` y `gift_card.shared_expenses`, porque Nocendland no contiene suscripciones ni usaba Realtime en el origen.
- Se migraron y compararon 589 filas: 7 perfiles, 51 ingredientes, 400 ingestas, 6 objetivos, 17 ejercicios, 9 horarios, 20 elementos de horario, 32 seguimientos, 91 series y 1 recurso compartido.
- Se conservaron los siete UUID de Auth. Las ocho identidades OAuth del origen no se copiaron directamente: los usuarios se precrearon con email confirmado y Google y GitHub se reenlazaron automáticamente por email verificado al volver a iniciar sesión. Las 15 sesiones antiguas no se migraron porque el destino utiliza otro secreto JWT.
- El bucket privado `nocendland` contiene los 48 objetos originales, 133.399.006 bytes verificados por SHA-256. También se restauraron `owner` y `owner_id`: 38 objetos conservan propietario y 10 permanecen sin él, con los mismos conjuntos de rutas por usuario que en el origen. Las políticas permiten al usuario operar solo en su carpeta y leer además las ocho imágenes genéricas de `nutrition_ingredient/default`.
- `training-share` está desplegada y activa en el destino, con los clientes de usuario y administración fijados a `nocendland`.
- El cliente Angular usa la URL y la clave publishable de `devappsdpm-db`, declara `db: {schema: 'nocendland'}` y los tipos TypeScript se regeneraron para ese esquema. El perfil ya no se crea mediante un trigger global sobre todos los usuarios del proyecto compartido, sino desde `AuthService` bajo RLS.
- Las migraciones incrementales antiguas que operaban sobre `public` se conservan en `supabase/legacy-migrations/nocendland-public` y ya no pueden ejecutarse accidentalmente contra el proyecto compartido. El ledger activo contiene un marcador sin SQL para la migración externa de `gift_card` y la migración base de `nocendland`, ambas alineadas con el remoto.

### Verificación

- Dos ejecuciones reales con usuarios efímeros comprobaron Auth, denegación de acceso anónimo, aislamiento RLS entre usuarios, Nutrición, vistas, Entrenamiento, RPC, Storage y el ciclo crear, previsualizar y revocar de `training-share`. La limpieza final deja cero usuarios o filas temporales.
- Google y GitHub aparecen habilitados en `/auth/v1/settings`. Los dos endpoints de autorización responden con `302` hacia sus proveedores y envían `https://zckqbrwdgxohdymiwbfz.supabase.co/auth/v1/callback` como callback del proyecto.
- La versión `0.6.2`, commit `f09b00b`, está desplegada en producción con estado `READY` y alias `https://nocendland.vercel.app`. El artefacto contiene la URL y la clave publishable del destino, no contiene la referencia antigua, no registra errores de consola ni errores de runtime en Vercel.
- Desde la aplicación desplegada se completaron en un dispositivo móvil los flujos interactivos de Google y GitHub, incluido el intercambio PKCE y el retorno correcto a producción. Auth conserva 7 usuarios y 10 identidades (`email`: 7, `github`: 1 y `google`: 2); `nocendland.profiles` conserva 7 perfiles y no existe ningún usuario sin perfil, por lo que los accesos no crearon usuarios duplicados.
- `pnpm test -- --watch=false`: 47 archivos y 125 tests correctos.
- `pnpm run build`: correcto; permanecen únicamente los avisos de presupuesto ya registrados en tareas separadas.
- El asesor de seguridad no detecta problemas de tablas, RLS, funciones o vistas de Nocendland. Solo mantiene el aviso compartido `auth_leaked_password_protection`.
- El asesor de rendimiento solo informa índices todavía sin uso por tratarse de un esquema recién creado; se conservan porque cubren claves foráneas o consultas reales.
- Los recuentos y hashes de `gift_card.shared_cards` y `gift_card.shared_expenses`, así como sus funciones, políticas, grants y definición de esquema, coinciden antes y después de la migración.
- Tanto el proyecto antiguo `nocendland` como `devappsdpm-db` permanecen `ACTIVE_HEALTHY`.

### Configuración compartida final

- Auth es compartido por proyecto y no se aísla por esquema. GitHub y Google ya están activos en `devappsdpm-db`; sus secretos permanecen correctamente fuera de PostgreSQL y del repositorio.
- La lista de redirecciones de Nocendland queda cubierta por `https://nocendland.vercel.app/auth/callback*`, `http://localhost:4200/auth/callback*` y `http://127.0.0.1:4200/auth/callback*`. El comodín cubre tanto el callback exacto como el sufijo de consulta `returnUrl`, así que las tres entradas exactas equivalentes sin asterisco pueden eliminarse sin tocar las redirecciones de otras aplicaciones.
- La protección contra contraseñas filtradas es una opción global de Auth. Debe decidirse y habilitarse a nivel de `devappsdpm-db`; Nocendland utiliza OAuth, pero el proveedor email continúa habilitado para todo el proyecto.
- Storage, Auth, Edge Functions, secretos, cuotas, límites de conexiones, tamaño, egress, MAU y Realtime son recursos compartidos del proyecto. Los buckets y nombres prefijados evitan colisiones operativas, pero la frontera efectiva continúa siendo grants mínimos, RLS y autenticación.
- El proyecto Supabase antiguo no se ha pausado ni eliminado y seguirá disponible hasta que el usuario confirme explícitamente el corte definitivo.
- El frontend está desplegado contra `devappsdpm-db` y los principales flujos, incluidos ambos proveedores OAuth, han quedado verificados en producción.

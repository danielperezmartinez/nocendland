---
Nombre: Revisar bajas en Supabase compartido
Estado: Hecha
Resumen: La auditoría confirmó que Nocendland no tiene flujo de baja, que la identidad Auth continúa compartida y que el cierre de sesión global podía afectar a otras aplicaciones; el logout queda limitado al cliente local y el borrado administrativo del verificador solo admite sus identidades desechables.
Decisiones: Nocendland no eliminará auth.users para una futura baja; no se ofrecerá una eliminación parcial del perfil porque dejaría datos o archivos sin limpiar; el ciclo completo requerirá estado persistente privado, bloqueo de acceso, limpieza reintentable de Storage y confirmación explícita del alcance antes de añadir una interfaz de baja.
Bloqueada: []
Fecha de creación: 2026-09-22T08:23:11+02:00
Última modificación: 2026-10-18
---

# Revisar bajas en Supabase compartido

## Contexto

El proyecto `devappsdpm-db` (`zckqbrwdgxohdymiwbfz`) comparte `auth.users` entre varias aplicaciones. La eliminación central de una identidad puede activar cascadas hacia todos los esquemas que referencien ese usuario, aunque cada aplicación mantenga sus tablas separadas.

## Criterios de finalización

- Localizar el flujo real de baja, cierre de sesión e inicialización de Nocendland, incluidas funciones Edge, APIs de servidor y scripts administrativos.
- Revisar las subidas y retiradas de archivos y determinar cómo condicionan una eventual baja.
- Contrastar las migraciones locales con los metadatos remotos actuales de `nocendland`, `nocendland_private`, Auth y Storage.
- Delimitar un ciclo de cuenta propio de Nocendland que no elimine `auth.users` ni objetos de otras aplicaciones.
- Añadir o actualizar pruebas cuando el cambio altere lógica, estados o contratos.
- Verificar las pruebas relevantes, la suite y el build antes de completar la tarea.

## Restricciones

- No eliminar identidades reales para probar el problema.
- No modificar objetos de otras aplicaciones.
- No deshabilitar cascadas, RLS ni triggers globalmente.
- Preparar y verificar cualquier cambio con cuentas desechables.

## Resultado de la auditoría

### Flujo de aplicación

- No existe botón, página, API, RPC ni función Edge que solicite una baja o elimine la identidad Auth. El frontend solo ofrece cierre de sesión.
- `AuthService` validaba al usuario con `getUser()` e inicializaba `nocendland.user` mediante `upsert` cuando faltaba el perfil. Este comportamiento es correcto para el alta actual, pero una futura baja deberá conservar un estado privado o tombstone que impida recrear automáticamente el espacio con una sesión antigua.
- El cierre de sesión explícito usaba el alcance global por defecto de Supabase Auth. Se ha cambiado a `scope: 'local'` para no revocar sesiones de otras aplicaciones que comparten la identidad.
- El único `auth.admin.deleteUser()` del repositorio pertenece a `scripts/verify-supabase-migration.mjs`. Crea cuentas aleatorias bajo `@example.invalid`; su limpieza comprueba ahora que UUID y correo corresponden exactamente a la identidad desechable creada por esa ejecución antes de permitir el borrado.
- `training-share` es la única función Edge remota. Valida los tokens para las acciones privadas y no elimina usuarios. Las copias de imágenes compartidas viven bajo `training_share/{shareId}/...`, por lo que una futura baja no puede limitarse a borrar carpetas que contengan el UUID del usuario.

### Metadatos remotos del 22/09/2026

- El proyecto conserva 7 identidades Auth, 7 perfiles de Nocendland, 1 perfil de Outify y 1 perfil de Outify Dev. No se consultaron correos ni otros datos personales.
- Siguen existiendo las tres FK con `ON DELETE CASCADE` desde `auth.users`: `nocendland.user`, `outify.profiles` y `outify_dev.profiles`. No hay triggers de aplicación sobre `auth.users`.
- La cadena interna de Nocendland mezcla cascadas con restricciones: Entrenamiento y Finanzas enlazan mayoritariamente por cascada desde `nocendland.user`, mientras `nutrition_ingredient`, `nutrition_intake` y `nutrition_objetive_level` conservan `NO ACTION`. Por ello el borrado central puede eliminar datos o quedar bloqueado según las filas concretas de la cuenta; no es una operación válida para una baja de Nocendland.
- El bucket privado `nocendland` contiene 48 objetos, 38 con propietario Auth. Sus prefijos actuales son `nutrition_ingredient`, `training_exercise` y el marcador técnico del bucket; las instantáneas de `training_share` aparecen cuando existen recursos compartidos activos.
- Las cuatro políticas de Storage de Nocendland son permisivas y autorizan por el UUID en el segundo segmento de la ruta. No existe todavía un estado de ciclo de cuenta que cierre lecturas o escrituras durante una limpieza.
- El trigger diferido `training_schedule_requires_active` continúa instalado sobre horarios. No sustituye una limpieza ordenada de todas las tablas y objetos.
- La única advertencia del asesor de seguridad es la protección global contra contraseñas filtradas, ya documentada como configuración compartida.

## Límite recomendado para una futura baja

La implementación debe conservar `auth.users` y eliminar únicamente el espacio de Nocendland. Necesita, como una sola unidad funcional:

- estado privado `active`, `pending` y `deleted` sin FK de cascada hacia Auth;
- RPC autenticada que registre la solicitud y bloquee inmediatamente nuevas lecturas y escrituras mediante políticas restrictivas y guardas;
- worker con `service_role`, concesiones y reintentos que retire imágenes de ingredientes y ejercicios, además de instantáneas de recursos compartidos obtenidas desde sus manifiestos;
- borrado ordenado de las tablas de Nocendland antes de retirar `nocendland.user`, respetando las FK `NO ACTION` y el trigger de horarios;
- tombstone que impida al `upsert` de inicialización recrear el espacio hasta una confirmación explícita y una sesión posterior;
- interfaz que explique que se eliminan solo los datos de Nocendland y que la identidad y los datos de otras aplicaciones se conservan.

No se ha creado una baja parcial durante esta revisión: sin todos esos elementos, exponer una acción de eliminación produciría resultados inconsistentes.

## Verificación

- Consulta remota de FK, triggers, funciones, migraciones, políticas, recuentos agregados y Storage: completada sin mutaciones.
- Revisión de la función Edge remota `training-share`: completada; no contiene llamadas de baja Auth.
- `node --check scripts/verify-supabase-migration.mjs`: correcto.
- `pnpm test -- --watch=false`: 51 archivos y 164 pruebas correctas.
- `pnpm run check:technical-catalog`: correcto, 58 piezas sincronizadas.
- `pnpm run build`: correcto; permanecen únicamente los avisos de presupuesto registrados en tareas independientes.

## Publicación

- 2026-10-18: el trabajo seguía sin commitear en el workspace local. Se publica sobre `main` actualizado en la rama `feat/email-auth` (PR única con [[Revisar bajas en Supabase compartido]] y [[Implementar registro y autenticación por correo]], versión 0.10.0). La tarea pasa a `Hecha` cuando la PR esté integrada y el despliegue verificado, según [[README#Publicación]].
- Verificación de la publicación: PR #5 integrada con squash en `main` (commit `e8592b1`), checks en verde y despliegue de producción en Vercel `READY` el 2026-10-18.

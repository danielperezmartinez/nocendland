---
Nombre: Corregir recuperación de sesiones inconsistentes
Estado: Hecha
Resumen: Las sesiones cuyo perfil no puede recuperarse se limpian localmente y redirigen al login; los esquemas requeridos quedan persistidos en la configuración gestionada de la Data API.
Decisiones: La consulta de perfil no exigirá una respuesta singular de PostgREST; un fallo de recuperación limpiará solo la sesión local; el guard convertirá cualquier excepción de autenticación en una redirección segura; la lista de esquemas expuestos se gestionará desde la configuración del proyecto y no mediante un override del rol `authenticator`.
Bloqueada: []
Fecha de creación: 2026-09-03T19:35:00+02:00
Última modificación: 2026-09-03T20:02:00+02:00
---

# Corregir recuperación de sesiones inconsistentes

## Contexto

Una sesión antigua almacenada en Android renovaba correctamente su token y validaba el usuario, pero la lectura posterior de `nocendland.user` devolvía HTTP 406. La excepción escapaba del guard, cancelaba la navegación inicial y dejaba vacío el `router-outlet`, aunque la aplicación y su aviso global de actualización sí se habían iniciado.

## Criterios de finalización

- Una sesión sin perfil accesible se limpia únicamente en el dispositivo actual y redirige al login.
- La lectura de un perfil opcional no utiliza una representación singular que convierta cero filas en HTTP 406.
- Una excepción inesperada durante la autenticación no cancela la navegación dejando la aplicación en blanco.
- Las pruebas cubren la recuperación del perfil y el rechazo de la promesa del guard.
- La suite y el build de producción verifican el resultado.

## Resultado

- La consulta del perfil utiliza una lista limitada a una fila y evita la respuesta singular 406 observada en producción.
- Si el usuario está autenticado pero su perfil no puede recuperarse, se elimina únicamente la sesión local y el guard continúa hacia `/auth`.
- El guard captura errores inesperados de autenticación y conserva la URL de retorno sin dejar vacío el `router-outlet`.
- Las pruebas incorporan los casos de perfil inaccesible y promesa de autenticación rechazada.

## Verificación

- Pruebas específicas de autenticación: 9 pruebas correctas.
- Suite completa: 49 archivos y 129 pruebas correctas.
- Build de producción: correcto; permanecen únicamente los avisos de presupuesto ya registrados en tareas independientes.
- Versión `0.7.1` preparada para el despliegue de producción.

## Incidencia posterior al despliegue

- La versión `0.7.1`, commit `bc03f53`, alcanzó `READY` en producción y sustituyó la pantalla blanca por una recuperación hacia el login.
- Los intentos OAuth con Google completan autorización, callback y validación de usuario con respuestas correctas.
- La Data API responde `PGRST106` porque actualmente solo expone `public` y `graphql_public`; han desaparecido de la configuración externa tanto `gift_card` como `nocendland`.
- Mientras `nocendland` no vuelva a exponerse, la lectura del perfil falla y la recuperación local redirige correctamente al login, provocando el bucle observado.
- Se restauró `pgrst.db_schemas` con `public, graphql_public, gift_card, nocendland`, se recargaron configuración y caché de PostgREST y se verificaron los privilegios mínimos de `authenticated` sobre `nocendland`.
- Los logs sitúan la pérdida tras una recarga de configuración y reinicio de Auth a las 14:42 del 3 de septiembre. No hay acciones de rama registradas; la causa probable es que la configuración gestionada conservaba los valores por defecto y sobrescribió el ajuste SQL durante esa recarga.
- La configuración gestionada de la Data API se actualizó mediante la Management API para exponer `public, graphql_public, gift_card, nocendland`.
- La misma lista queda declarada en `supabase/config.toml`, evitando que una futura sincronización de configuración desde el repositorio restaure los valores por defecto.
- Se eliminó el override temporal `pgrst.db_schemas` del rol `authenticator` y se forzó una nueva recarga de configuración y esquema.
- Tras la recarga, `gift_card.shared_cards` responde HTTP 200 con el rol público y `nocendland.user` responde HTTP 401/`42501` con el rol anónimo, confirmando que ambos esquemas están expuestos y que se mantienen sus permisos previstos.

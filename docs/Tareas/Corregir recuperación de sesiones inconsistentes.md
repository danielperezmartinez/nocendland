---
Nombre: Corregir recuperación de sesiones inconsistentes
Estado: En curso
Resumen: Las sesiones cuyo perfil no puede recuperarse se limpian localmente y redirigen al login; ninguna excepción del guard puede dejar la aplicación en blanco.
Decisiones: La consulta de perfil no exigirá una respuesta singular de PostgREST; un fallo de recuperación limpiará solo la sesión local; el guard convertirá cualquier excepción de autenticación en una redirección segura.
Bloqueada: []
Fecha de creación: 2026-09-03T19:35:00+02:00
Última modificación: 2026-09-03T19:43:00+02:00
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

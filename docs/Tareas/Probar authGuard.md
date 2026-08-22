---
Nombre: Probar authGuard
Estado: Hecha
Resumen: Añadir pruebas reales del guard de autenticación para sesiones válidas, usuarios anónimos y redirección a /auth.
Decisiones: La ruta protegida debe rechazar usuarios anónimos y redirigirlos a /auth; las pruebas ejercitan el guard mediante el Router real de Angular y un AuthService controlable.
Bloqueada: []
Fecha de creación: 2026-08-06T17:49:32
Última modificación: 2026-08-22
---

# Probar authGuard

## Alcance

Cubrir al menos estos escenarios:

- Una sesión autenticada puede continuar hacia la ruta solicitada.
- Un usuario anónimo no puede acceder a una ruta protegida.
- El resultado para un usuario anónimo redirige a `/auth`.
- La resolución asíncrona de la sesión no abre temporalmente la ruta protegida.

## Criterios de finalización

- Las pruebas reproducen el comportamiento real del router y del servicio de autenticación.
- Los tres escenarios principales pasan de forma determinista.
- La implementación continúa siendo zoneless y usa Signals como estado principal.

## Verificación

- `pnpm test -- --include src/app/platform/auth/auth.guard.spec.ts --watch=false`: 4 pruebas superadas.
- `pnpm test -- --watch=false`: 47 archivos y 122 pruebas superadas.
- `git diff --check`: sin errores de whitespace; solo avisos de normalización LF/CRLF ya presentes en el workspace.

## Resultado

La prueba superficial de existencia se sustituyó por pruebas de navegación con `RouterTestingHarness`. Quedan cubiertos el acceso autenticado, el rechazo sin activar el componente protegido, la redirección a `/auth` con `returnUrl` y la espera segura mientras `isAuthenticated()` continúa pendiente.

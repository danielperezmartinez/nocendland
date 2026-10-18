---
Nombre: "authGuard"
Tipo: "Guard"
Área: "Plataforma"
Feature: "Autenticación"
Estado: "Vigente"
Ámbito: "Aplicación"
Fuente: "src/app/platform/auth/auth.guard.ts"
Entrada pública: "@platform/auth/auth.guard"
Resumen: "Protege la shell validando remotamente cada navegación; pasa su identificador a AuthService para compartir la comprobación entre guards y devuelve un UrlTree seguro hacia autenticación cuando procede."
Última modificación: "2026-10-01"
---

# authGuard

Después de descubrir esta pieza en el catálogo, consulta [su implementación](../../src/app/platform/auth/auth.guard.ts) como fuente de verdad de su contrato detallado.

Cuando el correo está habilitado y existe una recuperación pendiente, redirige al establecimiento de contraseña antes de abrir la shell.

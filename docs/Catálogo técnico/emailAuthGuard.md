---
Nombre: "emailAuthGuard"
Tipo: "Guard"
Área: "Plataforma"
Feature: "Autenticación"
Estado: "Vigente"
Ámbito: "Aplicación"
Fuente: "src/app/platform/auth/email-auth.guard.ts"
Entrada pública: "@platform/auth/email-auth.guard"
Resumen: "Bloquea rutas por correo si su configuración está desactivada y exige un flujo de recuperación verificado para mostrar el establecimiento de contraseña."
Última modificación: "2026-10-01"
---

# emailAuthGuard

Implementación y guard de recuperación: [fuente](../../src/app/platform/auth/email-auth.guard.ts).

La configuración solo controla la disponibilidad de Nocendland. No cambia los proveedores globales de Supabase. El guard de recuperación controla navegación; Supabase sigue autorizando el cambio de contraseña.

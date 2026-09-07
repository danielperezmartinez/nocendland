---
Nombre: "AuthService"
Tipo: "Servicio"
Área: "Plataforma"
Feature: "Autenticación"
Estado: "Vigente"
Ámbito: "Aplicación"
Fuente: "src/app/platform/auth/auth.service.ts"
Entrada pública: "@platform/auth/auth.service"
Resumen: "Valida remotamente cada navegación, comparte la comprobación entre sus guards y reutiliza el perfil Signal del mismo usuario; invalida cambios de sesión y rechaza respuestas antiguas, manteniendo OAuth y creación de perfil bajo RLS."
Última modificación: "2026-09-07"
---

# AuthService

Después de descubrir esta pieza en el catálogo, consulta [su implementación](../../src/app/platform/auth/auth.service.ts) como fuente de verdad de su contrato detallado.

`isAuthenticated(navigationId?)` comparte la promesa pendiente o resuelta solo para el identificador de navegación proporcionado por el guard. Sin identificador, siempre inicia una comprobación nueva, como requieren el callback OAuth y la vista de enlaces compartidos. El perfil es una caché en memoria para presentación e identidad local, no una autorización de datos ni una caché de autenticación entre navegaciones. La política se define en [[README#Autenticación]].

---
Nombre: "AuthService"
Tipo: "Servicio"
Área: "Plataforma"
Feature: "Autenticación"
Estado: "Vigente"
Ámbito: "Aplicación"
Fuente: "src/app/platform/auth/auth.service.ts"
Entrada pública: "@platform/auth/auth.service"
Resumen: "Espera la restauración inicial de Supabase, valida remotamente cada navegación y comparte la comprobación entre sus guards; reutiliza el perfil Signal, invalida cambios de sesión y rechaza respuestas antiguas sin confundir restauración con cambio de cuenta."
Última modificación: "2026-09-07"
---

# AuthService

Después de descubrir esta pieza en el catálogo, consulta [su implementación](../../src/app/platform/auth/auth.service.ts) como fuente de verdad de su contrato detallado.

`isAuthenticated(navigationId?)` comparte la promesa pendiente o resuelta solo para el identificador de navegación proporcionado por el guard. Sin identificador, siempre inicia una comprobación nueva, como requieren el callback OAuth y la vista de enlaces compartidos. El perfil es una caché en memoria para presentación e identidad local, no una autorización de datos ni una caché de autenticación entre navegaciones. La política se define en [[README#Autenticación]].

La primera comprobación espera `INITIAL_SESSION` antes de llamar a `getUser()`. Los eventos de restauración no publican un perfil ni autorizan una ruta: esa decisión sigue dependiendo de la respuesta remota. La promesa inicial se libera también al destruir el servicio, conservando el rechazo de peticiones obsoletas.

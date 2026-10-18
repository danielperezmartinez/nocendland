---
Nombre: "AuthService"
Tipo: "Servicio"
Área: "Plataforma"
Feature: "Autenticación"
Estado: "Vigente"
Ámbito: "Aplicación"
Fuente: "src/app/platform/auth/auth.service.ts"
Entrada pública: "@platform/auth/auth.service"
Resumen: "Encapsula OAuth PKCE y métodos por correo configurables, conserva la validación remota por navegación y el logout local, y coordina la recuperación de contraseña antes de autorizar la shell."
Última modificación: "2026-10-01"
---

# AuthService

Después de descubrir esta pieza en el catálogo, consulta [su implementación](../../src/app/platform/auth/auth.service.ts) como fuente de verdad de su contrato detallado.

`isAuthenticated(navigationId?)` comparte la promesa pendiente o resuelta solo para el identificador de navegación proporcionado por el guard. Sin identificador, siempre inicia una comprobación nueva, como requieren el callback OAuth y la vista de enlaces compartidos. El perfil es una caché en memoria para presentación e identidad local, no una autorización de datos ni una caché de autenticación entre navegaciones. La política se define en [[README#Autenticación]].

La primera comprobación espera `INITIAL_SESSION` antes de llamar a `getUser()`. Los eventos de restauración no publican un perfil ni autorizan una ruta: esa decisión sigue dependiendo de la respuesta remota. La promesa inicial se libera también al destruir el servicio, conservando el rechazo de peticiones obsoletas.

`signOut()` utiliza el alcance `local` de Supabase Auth. El proyecto Auth es compartido con otras aplicaciones y cerrar Nocendland no debe revocar sus sesiones activas en otros dispositivos o clientes.

Los métodos `signUpWithPassword`, `signInWithPassword`, `sendEmailCode`, `resendConfirmation`, `verifyEmailCode`, `requestPasswordReset` y `resetPassword` comprueban `emailAuthEnabled` antes de llamar a Supabase. Pedir un código no publica un usuario ni crea el perfil de Nocendland. `sendEmailCode` diferencia registro e inicio de sesión mediante `shouldCreateUser`.

`recoveryUserId` es un Signal de solo lectura para navegación, no una prueba de autorización. `hasPasswordRecovery()` espera restauración antes de resolver el guard. `resetPassword` revalida el usuario remoto y rechaza cambios de identidad durante la comprobación. La persistencia temporal por pestaña falla de forma segura a memoria cuando `sessionStorage` está bloqueado.

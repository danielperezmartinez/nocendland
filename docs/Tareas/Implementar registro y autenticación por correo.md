---
Nombre: Implementar registro y autenticación por correo
Estado: Hecha
Resumen: Registro, contraseña, código, confirmación y recuperación implementados; 189 pruebas y build correctos, flujos verificados contra Supabase local y correo productivo pendiente de SMTP.
Decisiones: Mantener Google y GitHub; probar correo contra Supabase local aislado; configurar PKCE explícitamente; aplazar MFA y no modificar Auth global del proyecto compartido.
Bloqueada: []
Fecha de creación: 2026-09-30
Última modificación: 2026-10-19
---

# Implementar registro y autenticación por correo

## Alcance

Registro y acceso con contraseña o código, confirmación y reenvío, recuperación por código y establecimiento de contraseña. Estado Signal y UI Atlas modular. Conservar validación remota por navegación, restauración PWA, UUID de perfiles y logout local.

## Verificación prevista

Tests de servicio, rutas, formularios, SDK y backend local; casos de expiración, reutilización, red y límites. Suite completa, catálogo y build. Producción debe conservar solo OAuth mientras el correo esté deshabilitado.

La activación externa se sigue en [[Activar correo de autenticación en producción]]. MFA se sigue en [[Implementar doble factor y recuperación de acceso]].

## Entorno local reproducible

Requiere Docker disponible. No se vincula a Supabase remoto ni ejecuta las migraciones productivas.

```sh
pnpm run auth:local:start
pnpm run auth:local:configure
pnpm run auth:local:verify
pnpm run auth:local:serve
```

- Aplicación: `http://localhost:4200/auth`; buzón de pruebas: `http://127.0.0.1:55434`.
- Configuración aislada en `tests/auth-local/supabase`; perfil mínimo con RLS para verificar Auth. No contiene tablas de Nutrición, Entrenamiento ni Finanzas; para esas áreas se utiliza el entorno habitual.
- `auth:local:configure` genera el archivo ignorado `environment.auth-local.ts` exclusivamente con URL local y clave pública. El desarrollo habitual sigue usando OAuth contra el backend compartido con correo deshabilitado.
- Las plantillas locales emiten códigos de seis cifras con validez de diez minutos y reenvío mínimo de un minuto.
- El verificador crea y limpia cuentas desechables, comprueba confirmación y recuperación reales, contraseña y OTP sobre un mismo UUID, RLS, códigos erróneos, usados y caducados, y límites de reenvío. La caducidad se simula únicamente en la cuenta efímera del contenedor local.
- Para detener este entorno: `pnpm exec supabase stop --workdir tests/auth-local`.

## Limitaciones de verificación

- No hay navegador conectado y `agent-browser` no está instalado: no se ha realizado inspección visual real; los formularios y rutas se verifican con Angular RouterTestingHarness y DOM.
- Google y GitHub se verifican con el SDK real y transporte simulado para PKCE; no se han utilizado cuentas sociales reales ni modificado la configuración del proyecto compartido.
- El envío real a usuarios queda pendiente de SMTP. No se ha desplegado.

## Resultado y verificación

- Rutas lazy `/auth/email`, `/auth/register`, `/auth/verify`, `/auth/recover` y `/auth/reset-password`; métodos protegidos también en el servicio cuando `emailAuthEnabled` está desactivado.
- Confirmación pendiente con reenvío desde login, recuperación persistida por pestaña, protección frente a cambio de cuenta y errores de almacenamiento, y errores de callback visibles sin conservar el código en el historial.
- `pnpm test -- --watch=false`: 54 archivos, 189 pruebas correctas, incluidas 66 de autenticación.
- `pnpm run auth:local:verify`: flujos de correo y aislamiento comprobados contra Auth, PostgREST y buzón locales; cuentas y mensajes de la ejecución limpiados.
- `pnpm run build`: correcto. Catálogo sincronizado con 59 piezas y estilos válidos. Persisten avisos de presupuestos del bundle inicial y estilos de componentes ajenos a esta entrega.
- `git diff --check`: correcto. Se conservaron los cambios previos del workspace y no se actualizaron dependencias.

## Publicación

- 2026-10-18: el trabajo seguía sin commitear en el workspace local. Se publica sobre `main` actualizado en la rama `feat/email-auth` (PR única con [[Revisar bajas en Supabase compartido]] y [[Implementar registro y autenticación por correo]], versión 0.10.0). La tarea pasa a `Hecha` cuando la PR esté integrada y el despliegue verificado, según [[README#Publicación]].
- Verificación de la publicación: PR #5 integrada con squash en `main` (commit `e8592b1`), checks en verde y despliegue de producción en Vercel `READY` el 2026-10-18.

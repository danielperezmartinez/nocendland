---
Nombre: Activar correo de autenticación en producción
Estado: Pendiente
Resumen: Configurar SMTP y un remitente verificado antes de activar los métodos por correo en Nocendland.
Decisiones: El proveedor y dominio quedan pendientes; conservar plantillas, redirecciones y flujos de las otras aplicaciones del Supabase compartido.
Bloqueada: []
Fecha de creación: 2026-09-30
Última modificación: 2026-10-01
---

# Activar correo de autenticación en producción

La implementación está completada en [[Implementar registro y autenticación por correo]]. Falta disponer de SMTP y realizar la activación externa.

- Elegir SMTP y verificar dominio/remitente y DNS; secretos únicamente en Supabase.
- Inventariar configuración compartida de Auth, límites, contraseñas, CAPTCHA y plantillas antes de cambiarla.
- Añadir códigos a las plantillas de confirmación, magic link y recuperación conservando los enlaces que utilizan otras aplicaciones; no reemplazar Site URL global por la de Nocendland.
- Mantener confirmación de correo obligatoria y autorizar destinos locales y productivos concretos.
- Verificar entrega real, confirmación, acceso, recuperación y vinculación con Google/GitHub usando cuentas desechables.
- Activar emailAuthEnabled solo después de comprobar esos flujos y la compatibilidad entre aplicaciones.
- Desplegar según [[README#3. Todo push debe incrementar la versión y todo deploy debe verificarse]].

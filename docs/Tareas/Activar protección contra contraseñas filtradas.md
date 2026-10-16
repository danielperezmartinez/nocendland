---
Nombre: Activar protección contra contraseñas filtradas
Estado: Pendiente
Resumen: El Security Advisor de devappsdpm-db avisa de que la protección contra contraseñas filtradas de Auth está desactivada; es una opción global del proyecto compartido y debe activarse, previo acuerdo con gift-card y Outify, antes de habilitar el acceso por correo en producción.
Decisiones: ""
Bloqueada: []
Fecha de creación: 2026-10-16T23:23:13+02:00
Última modificación: 2026-10-16T23:23:13+02:00
---

# Activar protección contra contraseñas filtradas

## Contexto

Aviso `auth_leaked_password_protection`, ya anotado en [[Tareas/Migrar Nocendland al Supabase compartido devappsdpm-db]] y confirmado en la auditoría del 2026-10-16. Nocendland usa OAuth, pero el proveedor de email sigue activo en todo el proyecto y el acceso por contraseña está implementado detrás de `emailAuthEnabled` (véase [[Tareas/Activar correo de autenticación en producción]]).

## Criterios de finalización

- Se comprueba qué apps del proyecto usan contraseñas y que activar la opción no rompe sus flujos de registro o cambio de contraseña.
- Se activa la protección en Auth de `devappsdpm-db` con el OK del usuario y se anota en la checklist de lanzamiento.
- El Security Advisor deja de mostrar el aviso.

## Verificación

- Captura o consulta del Advisor sin el aviso, y prueba de registro con una contraseña filtrada conocida en el entorno `auth-local`.

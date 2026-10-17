---
Nombre: Comprobar que Vercel omite los cambios de solo bóveda
Estado: En curso
Resumen: Verificar en producción que un push directo a main que solo cambia docs/ no genera build ni despliegue en Vercel gracias al ignoreCommand de vercel.json, y que un cambio de código sí despliega.
Decisiones: La propia publicación de esta tarea, que solo toca docs/, sirve de primera prueba.
Bloqueada: []
Fecha de creación: 2026-10-17T15:15:38+02:00
Última modificación: 2026-10-17T15:15:38+02:00
---

# Comprobar que Vercel omite los cambios de solo bóveda

## Contexto

La regla 3 del `README.md` establece que los cambios de solo bóveda se publican con push directo a `main`, sin subir la versión y sin despliegue. Para lograrlo, `vercel.json` incluye `"ignoreCommand": "git diff --quiet HEAD^ HEAD -- . ':(exclude)docs'"`: termina con 0, y Vercel omite el build, cuando el commit no cambia nada fuera de `docs/`.

En local, el comando devolvió 0 para un commit solo de `docs/` (`bfc29f1`) y 1 para uno de código (`b98e7ad`). Falta verlo en Vercel.

## Criterios de finalización

- Un push directo a `main` que solo cambia `docs/` aparece en Vercel como build omitido o cancelado, sin un despliegue `READY` nuevo en producción.
- El último despliegue de producción sigue siendo el del último cambio de código.
- La protección de `main` (`rls` y `a11y` obligatorios, sin obligar a administradores) permite el push directo de la bóveda.

## Verificación

- Consultar en Vercel los despliegues del commit publicado y el estado de producción.

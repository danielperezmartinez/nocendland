---
Nombre: Comprobar que Vercel omite los cambios de solo bóveda
Estado: Hecha
Resumen: Verificado en producción: un push directo a main que solo cambia docs/ crea el deployment en Vercel pero lo cancela el Ignored Build Step, sin build ni despliegue; producción sigue en el último cambio de código.
Decisiones: La propia publicación de esta tarea, que solo toca docs/, sirve de primera prueba.
Bloqueada: []
Fecha de creación: 2026-10-17T15:15:38+02:00
Última modificación: 2026-10-17T15:25:00+02:00
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

## Resultado (2026-10-17)

- Commit `11e32cb` (solo `docs/`) con push directo a `main`. GitHub permitió el push con la excepción de administrador (`Bypassed rule violations … 2 of 2 required status checks are expected`), como prevé la regla 3.
- Vercel creó el deployment `dpl_HEiSE1ki3VfhFZJgT7FNeUAtk6d1` y lo dejó en `CANCELED` unos 2 s después de empezar el build: estado de GitHub «Canceled by Ignored Build Step».
- Producción siguió sirviendo `bf28a99` (PR #3, `READY`).
- El cambio de código ya estaba cubierto: las PR #2 y #3 desplegaron con normalidad.
- El cierre de esta tarea también es un push de solo `docs/` y repite la comprobación.

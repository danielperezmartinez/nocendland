---
Nombre: Sincronizar la bóveda con agentic-knowledge-vault 1.7.0
Estado: Hecha
Resumen: Seguridad, coste y cumplimiento pasa de v1 a v3 (gitleaks en hooks y CI, hallazgos sensibles en avisos privados) y se monta el sistema Publicación con la política común de las cuatro webs, que sustituye a la antigua regla 3.
Decisiones: La política común de publicación (2026-10-17) vive solo en la sección Publicación del README; la regla 3 y la sección de Seguridad la enlazan. Tras un despliegue en ERROR el agente se detiene e informa. Los commits del historial con anon/publishable se permiten en .gitleaks.toml porque son claves públicas.
Bloqueada: []
Fecha de creación: 2026-10-17T16:40:00+02:00
Última modificación: 2026-10-17T17:05:00+02:00
---

# Sincronizar la bóveda con agentic-knowledge-vault 1.7.0

## Objetivo

Aplicar en la bóveda las migraciones v1 → v2 → v3 del sistema Seguridad, coste y cumplimiento y montar el sistema Publicación por ampliación, adoptando el flujo de PR que el repo ya seguía.

## Alcance

- README: sección de Seguridad en v3 (Repositorio y publicación, Vulnerabilidades y hallazgos sensibles, compuerta de commits revisados); sección Publicación nueva; regla 3 y sección Despliegue convertidas en enlaces.
- `Seguridad.base` con la vista de hallazgos privados y la checklist con su sección de GitHub.
- Repo: `.gitleaks.toml`, `.githooks/` (gitleaks y guarda de la rama principal), `.gitattributes`, `scripts/check-version.mjs`, script `prepare` y jobs `cambios`, `verificar` y `fugas` en `seguridad.yml`.
- GitHub, con confirmación del usuario: solo squash, borrado de rama al integrar, PR obligatoria sin aprobaciones, historial lineal y checks nuevos en la protección de `main`.

## Verificación

- PR [#4](https://github.com/danielperezmartinez/nocendland/pull/4), integrada con squash en `f263405` (versión 0.9.3). Checks `cambios`, `verificar`, `rls`, `a11y` y `fugas` en verde, tanto en el push como en la PR.
- Despliegue de producción `dpl_8QCXUFafC7bCr49NrZYzfJA6GpN8` en `READY`.
- En local: tests unitarios 179/179. Los hooks bloquean una fuga preparada y una ruta personal en el mensaje. La guarda rechaza un push de código a `main` y deja pasar uno de solo `docs/`. Revisión del historial con gitleaks: limpia.
- GitHub (con el OK del usuario), releído después de aplicarlo: solo squash, merge commit, rebase y auto-merge desactivados, borrado de rama al integrar. Protección de `main`: PR con 0 aprobaciones, checks strict `cambios`, `verificar`, `rls`, `a11y` y `fugas`, historial lineal, sin exigir resolver conversaciones, sin force push ni borrado, `enforce_admins=false`.
- Pendiente fuera de esta tarea: el private vulnerability reporting y las alertas de Dependabot (ver la checklist).

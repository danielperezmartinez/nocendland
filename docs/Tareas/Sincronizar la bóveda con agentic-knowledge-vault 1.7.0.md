---
Nombre: Sincronizar la bóveda con agentic-knowledge-vault 1.7.0
Estado: En curso
Resumen: Seguridad, coste y cumplimiento pasa de v1 a v3 (gitleaks en hooks y CI, hallazgos sensibles en avisos privados) y se monta el sistema Publicación con la política común de las cuatro webs, que sustituye a la antigua regla 3.
Decisiones: La política común de publicación (2026-10-17) vive solo en la sección Publicación del README; la regla 3 y la sección de Seguridad la enlazan. Tras un despliegue en ERROR el agente se detiene e informa. Los commits del historial con anon/publishable se permiten en .gitleaks.toml porque son claves públicas.
Bloqueada: []
Fecha de creación: 2026-10-17T16:40:00+02:00
Última modificación: 2026-10-17T16:40:00+02:00
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

<!-- Se completa al integrar la PR y verificar el despliegue. -->

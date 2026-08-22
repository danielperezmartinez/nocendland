---
Nombre: Migrar runtime a Node 24
Estado: Hecha
Resumen: El proyecto declara Node 24, fija el runtime local en 24.19.0 y completa instalación, pruebas y build sin avisos de incompatibilidad de engine.
Decisiones: Se reutiliza Node 24 ya instalado; la versión del proyecto seguirá fijada mediante pnpm para mantener entornos locales y CI reproducibles.
Bloqueada: []
Fecha de creación: 2026-08-12T17:41:00+02:00
Última modificación: 2026-08-12T17:42:37+02:00
---

# Migrar runtime a Node 24

## Objetivo

Dejar de mantener Node 22 como runtime adicional y alinear el proyecto con Node 24, conservando la versión exacta de pnpm y las políticas de instalación segura del workspace.

## Criterios de finalización

- `package.json` declara una versión Node 24 soportada por Angular 22.
- `pnpm-workspace.yaml` fija la misma versión Node para desarrollo, CI y despliegue.
- La instalación con lockfile congelado se completa correctamente.
- Todas las pruebas y el build de producción terminan correctamente bajo Node 24.

## Resultado

- `package.json` declara `node: 24.x`, compatible con Angular 22 y con el runtime LTS disponible en Vercel.
- pnpm fija `useNodeVersion` y `nodeVersion` en `24.19.0`, coincidiendo con el runtime local instalado.
- `pnpm install --frozen-lockfile`: correcto con pnpm 10.33.2.
- `pnpm test -- --watch=false`: 72 pruebas correctas bajo Node 24.19.0.
- `pnpm run build`: correcto; permanecen únicamente los avisos de presupuesto conocidos.
- `pnpm audit --audit-level high` mantiene avisos transitivos ya cubiertos por [[Revisar vulnerabilidades transitivas]]; no se aplicaron correcciones automáticas.
- `pnpm ignored-builds` continúa sin localizar `node_modules`, discrepancia ya registrada en la misma tarea de seguridad.

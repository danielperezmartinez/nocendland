---
Estado: Hecha
Resumen: Las 107 pruebas unitarias se ejecutan con Vitest y jsdom mediante el builder de Angular; Karma y Jasmine se han retirado del proyecto.
Decisiones: Se utiliza Vitest 4.1.10 por corregir la vulnerabilidad crítica de la rama 4.0.x y respetar la cuarentena; jsdom se completa con dobles de APIs de navegador; Zone.js solo se declara como dependencia de desarrollo para que el inicializador generado por Angular pueda resolver su importación opcional, sin cargarlo en la aplicación zoneless; pnpm no autoinstala peers para evitar runners opcionales no declarados.
Bloqueada: []
Fecha de creación: 2026-08-08
Última modificación: 2026-08-21
---

## Alcance

- Sustituir el builder de Karma por el builder unit-test de Angular con Vitest.
- Retirar las dependencias y los tipos de Karma y Jasmine.
- Migrar spies, temporizadores y matchers específicos de Jasmine.
- Verificar la suite completa sin abrir un navegador visible.

## Resultado

- `pnpm test -- --watch=false`: 41 archivos y 107 pruebas correctas con Vitest 4.1.10.
- `pnpm run build`: compilación de producción correcta; se mantienen los avisos de presupuesto ya existentes.
- `pnpm audit --audit-level high`: 0 vulnerabilidades críticas; permanecen 19 altas, 10 moderadas y 2 bajas en transitivas cubiertas por [[Revisar vulnerabilidades transitivas]].
- `pnpm ignored-builds`: ejecutado correctamente, aunque conserva la incidencia conocida de no identificar `node_modules`.

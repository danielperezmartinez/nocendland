---
Nombre: Migrar gráficos a ApexCharts
Estado: Hecha
Resumen: Chart.js y ng2-charts se sustituyeron por ApexCharts en un chunk diferido, preservando el gráfico nutricional, el funcionamiento zoneless y la actualización mediante Signals.
Decisiones: Se fijaron versiones exactas compatibles con Angular 22 y la cuarentena; ApexCharts se carga en la ruta lazy del formulario, y su MCP se mantiene como herramienta de agentes separada de la dependencia de runtime.
Bloqueada: []
Fecha de creación: 2026-08-06T23:18:25
Última modificación: 2026-08-06T23:38:46
---

# Migrar gráficos a ApexCharts

## Objetivo

Reemplazar la pila de gráficos basada en Chart.js, ng2-charts y chartjs-plugin-datalabels por ApexCharts y ng-apexcharts sin cambiar la información nutricional mostrada al usuario.

## Alcance

- Retirar las tres dependencias de Chart.js y su configuración global.
- Instalar versiones exactas y compatibles de `apexcharts` y `ng-apexcharts` respetando la cuarentena de siete días.
- Migrar el gráfico semicircular del formulario de alimentos.
- Mantener la actualización reactiva ante cambios de datos y tema mediante Signals.
- Verificar pruebas, build, scripts de instalación ignorados y auditoría de seguridad.

## Criterios de finalización

- No quedan imports ni dependencias de Chart.js.
- El gráfico nutricional se renderiza con ApexCharts y conserva sus datos, colores y etiquetas.
- Las pruebas unitarias y el build de producción terminan correctamente.
- Las comprobaciones de seguridad de dependencias no presentan bloqueos nuevos.

## Resultado y verificación

- `chart.js`, `chartjs-plugin-datalabels` y `ng2-charts` se retiraron del manifiesto, lockfile, configuración y código.
- El formulario de alimentos utiliza `ChartComponent` de `ng-apexcharts`; series, colores de tokens y borde reactivo se actualizan con Signals.
- ApexCharts se carga de forma diferida con el formulario y no se incorpora al bundle inicial.
- El build de producción y las 27 pruebas unitarias finalizan correctamente.
- `pnpm audit --prod --audit-level high` no encuentra vulnerabilidades conocidas. La auditoría completa mantiene únicamente incidencias transitivas de herramientas de desarrollo ya inventariadas.


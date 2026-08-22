---
Nombre: Instalar MCP de ApexCharts
Estado: Hecha
Resumen: El MCP oficial de ApexCharts quedó instalado como dependencia de desarrollo y configurado por proyecto para generar, validar y documentar gráficos desde Codex sin afectar al bundle de producción.
Decisiones: Se fija apexcharts-mcp 0.4.0 porque usa conocimiento verificado contra ApexCharts 5.15.2, compatible con el runtime 5.16.0 del proyecto; Codex carga solo las cinco herramientas del producto charts desde .codex/config.toml y las preaprueba por ser operaciones locales sin efectos externos.
Bloqueada: []
Fecha de creación: 2026-08-06T23:38:46
Última modificación: 2026-08-22
---

# Instalar MCP de ApexCharts

## Objetivo

Incorporar el MCP oficial de ApexCharts al entorno de agentes del proyecto para mejorar la creación, validación y mantenimiento de configuraciones de gráficos.

## Enfoque

1. Revisar el paquete oficial, su licencia, sus scripts de instalación y la versión exacta elegible según la cuarentena del workspace.
2. Confirmar el mecanismo de configuración de MCP compatible con Codex sin utilizar `npx`, `pnpm dlx` ni ejecución efímera no autorizada.
3. Instalarlo como herramienta de desarrollo con pnpm y configuración reproducible cuando corresponda.
4. Verificar que el servidor expone generación, validación, tipos de gráfico y acceso a la base de conocimiento.
5. Documentar su uso sin convertirlo en una dependencia de runtime de la aplicación.

## Criterios de finalización

- El MCP oficial funciona desde Codex en este proyecto.
- La configuración es reproducible y respeta la política de dependencias.
- No aumenta el bundle de producción ni se despliega con la aplicación.
- Se ha probado al menos la validación de la configuración del gráfico nutricional existente.

## Resultado

- `apexcharts-mcp@0.4.0` está fijado como `devDependency`; su licencia es MIT, requiere Node 18 o posterior y el artefacto publicado incluye firma y procedencia.
- `.codex/config.toml` inicia el binario mediante `pnpm exec apexcharts-mcp`, limita la carga a `APEXCHARTS_MCP_PRODUCTS=charts` y permite únicamente las cinco herramientas oficiales de ApexCharts.
- Un proceso nuevo de Codex descubrió el servidor y ejecutó `apexcharts_validate_config` sobre el donut nutricional existente. El resultado fue `ok: true`, sin errores, avisos ni incidencias.
- También se verificaron mediante el protocolo MCP el catálogo de tipos, la generación de una configuración donut y el acceso al índice de la base de conocimiento.
- `pnpm install --frozen-lockfile` y `pnpm run build` terminan correctamente. El MCP permanece fuera de los chunks de la aplicación porque solo es dependencia de desarrollo.
- `pnpm audit --audit-level high` conserva incidencias transitivas ya presentes en otras ramas del grafo; ninguna ruta informada atraviesa `apexcharts-mcp`.

## Uso

Codex carga el servidor automáticamente al abrir una tarea nueva dentro de este proyecto. Se puede comprobar con `codex mcp get apexcharts`; los agentes pueden invocar directamente las herramientas de generación, validación, catálogo de tipos y referencia oficial.

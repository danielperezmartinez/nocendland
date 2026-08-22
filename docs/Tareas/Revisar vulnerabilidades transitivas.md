---
Nombre: Revisar vulnerabilidades transitivas
Estado: Hecha
Resumen: La auditoría completa y la de producción quedan sin vulnerabilidades conocidas tras actualizar Angular 22 y fijar overrides transitivos exactos, conservando la política estricta de pnpm.
Decisiones: Angular se actualiza dentro de la versión 22; las versiones vulnerables arrastradas por Tailwind y el tooling se sustituyen mediante overrides exactos de la misma línea compatible; esbuild 0.28.2 se autoriza de forma exacta tras revisar su postinstall; el mensaje incorrecto de pnpm 10.33.2 en ignored-builds se documenta y se contrasta con pendingBuilds vacío sin relajar la configuración.
Bloqueada: []
Fecha de creación: 2026-08-06T19:21:20
Última modificación: 2026-08-22
---

# Revisar vulnerabilidades transitivas

## Contexto

La ejecución de `pnpm audit --audit-level high` del 6 de agosto de 2026 encontró 53 vulnerabilidades: 5 bajas, 16 moderadas y 32 altas. Entre las rutas afectadas aparecen dependencias transitivas de Karma, Tailwind/Sucrase y Angular CLI, como `glob`, `minimatch`, `brace-expansion`, `flatted`, `socket.io-parser`, `fast-uri` e `ip-address`.

La comprobación repetida el 12 de agosto de 2026, durante la migración a Node 24, encontró 59 vulnerabilidades: 6 bajas, 18 moderadas y 35 altas. Se mantienen concentradas en dependencias transitivas y se conserva este trabajo separado para revisar cada actualización sin correcciones automáticas.

La migración a Vitest del 21 de agosto de 2026 retiró las rutas de Karma. La primera versión evaluada de Vitest tenía una vulnerabilidad crítica, por lo que se actualizó a la versión 4.1.10, ya fuera de cuarentena. La auditoría final quedó en 31 vulnerabilidades: 2 bajas, 10 moderadas y 19 altas, sin vulnerabilidades críticas.

`pnpm ignored-builds` indicó que no podía identificar scripts ignorados porque no encontraba `node_modules`, aunque la compilación y las pruebas sí resolvieron las dependencias mediante el runtime del workspace. Esta discrepancia también debe aclararse antes de cambiar la configuración.

## Enfoque

1. Clasificar cada ruta por dependencia de producción o de desarrollo y por exposición real.
2. Comprobar qué actualizaciones directas eliminan transitivas vulnerables respetando la cuarentena de siete días.
3. Usar overrides exactos solo cuando sean compatibles y estén justificados.
4. No ejecutar correcciones automáticas de auditoría.
5. Repetir instalación congelada, scripts ignorados, auditoría, build y pruebas después de cada grupo de cambios.

## Criterios de finalización

- No quedan vulnerabilidades altas conocidas o cada excepción tiene riesgo, alcance y decisión documentados.
- La política estricta de `pnpm-workspace.yaml` continúa activa.
- `pnpm ignored-builds` inspecciona correctamente la instalación utilizada por el proyecto.
- La compilación y las pruebas continúan pasando.

## Resultado

- El runtime Angular y CDK se actualizaron a 22.1.2; Angular CLI, builder y schematics CLI se actualizaron a 22.1.4.
- Se fijaron overrides exactos para las versiones vulnerables de `glob`, `minimatch`, `brace-expansion`, `postcss` y `yaml`. Todas las versiones llevaban más de siete días publicadas.
- `pnpm audit --audit-level low` y `pnpm audit --prod --audit-level low`: sin vulnerabilidades conocidas.
- `pnpm install --frozen-lockfile`: correcto.
- `pnpm run build`: correcto; conserva únicamente los avisos de presupuesto ya existentes.
- `pnpm test -- --watch=false`: 47 archivos y 122 pruebas correctas.
- `pnpm-workspace.yaml` mantiene activas las restricciones de integridad, cuarentena, dependencias exóticas y scripts. `esbuild@0.28.2` se añadió a `allowBuilds` tras revisar que su `postinstall` valida y enlaza el binario específico de plataforma requerido por Angular.
- `pnpm ignored-builds` en pnpm 10.33.2 muestra `Cannot identify as no node_modules found` cuando `.modules.yaml` existe pero omite la clave opcional `ignoredBuilds`. La instalación sí existe, `.modules.yaml` declara `pendingBuilds: []` y todos los paquetes con scripts están clasificados en `allowBuilds`; se conserva la política estricta en vez de modificar metadatos internos o actualizar pnpm fuera de cuarentena.

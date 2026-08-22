---
Nombre: Crear catálogo técnico reutilizable
Estado: Hecha
Resumen: El catálogo técnico ofrece una vista estructurada de UI, primitivas CSS, utilidades, plataforma y fachadas de feature; el build comprueba sus propiedades, fuentes, entrypoints y cobertura.
Decisiones: Cada pieza reutilizable dispone de una nota estructurada filtrable por tipo, área, feature y estado; las piezas heredadas inestables permanecen En revisión y no se recomiendan para código nuevo; NutritionStore y TrainingStore se catalogan como fachadas de sus propias features; los entrypoints @shared/ui/* permanecen separados para conservar los límites lazy; el código sigue siendo la fuente de verdad.
Bloqueada: []
Fecha de creación: 2026-08-06T19:36:26
Última modificación: 2026-08-22T14:00:00+02:00
---

# Crear catálogo técnico reutilizable

## Objetivo

Permitir que una persona o agente descubra rápidamente qué piezas puede reutilizar antes de buscar por todo el repositorio o crear una implementación nueva. Después de localizar una candidata en el catálogo, deberá abrir el código fuente antes de modificarla o depender de su comportamiento detallado.

## Alcance propuesto

- Crear un sistema de la bóveda enlazado desde [[../Inicio|Inicio]].
- Indexar únicamente APIs, servicios, stores, utilidades y componentes que formen parte de la superficie reutilizable del proyecto.
- Resumir por entrada: nombre, tipo, propósito, ruta fuente, ámbito, contrato público, estado y posibles sustituciones o deprecaciones.
- Proporcionar una vista `.base` que permita filtrar por tipo, área, feature y estado.
- Enlazar al código y a decisiones relevantes sin copiar la implementación ni documentación extensa.
- Definir una comprobación o protocolo de actualización para evitar que el catálogo quede obsoleto cuando cambie una superficie pública.

## Principios

- El catálogo sirve para descubrimiento; el código es la fuente de verdad técnica.
- No se documentan detalles privados ni piezas triviales que no deban reutilizarse.
- Antes de crear código reutilizable, se consulta primero el catálogo y después la implementación candidata.
- Una entrada desactualizada debe corregirse o marcarse explícitamente; no se mantiene información dudosa como si fuera vigente.

## Criterios de finalización

- El sistema y su vista están accesibles desde [[../Inicio|Inicio]].
- Un agente puede identificar de una pasada las superficies reutilizables relevantes y su ubicación.
- Existe una política verificable para mantener sincronizados catálogo y código.
- El contenido evita duplicar detalles que ya pertenecen al código fuente.

## Resultado

- [[../Catálogo técnico|El catálogo técnico]] actúa como portada y enlaza la vista [[../Catálogo técnico/Catálogo técnico.base|Catálogo técnico.base]].
- 56 notas estructuradas permiten filtrar por tipo, área, feature, estado y ámbito.
- El inventario cubre componentes, servicios, directivas, contratos y primitivas CSS de UI, utilidades compartidas, servicios y guard de plataforma, `NutritionStore` y `TrainingStore`.
- `IntervalService`, `UtilService`, `Debounce`, `DeviceService` y `LoggerService` permanecen explícitamente `En revisión`; descubrirlas no equivale a recomendarlas para código nuevo.
- `check:technical-catalog` valida propiedades obligatorias, estados, fuentes, cobertura, entrypoints públicos, primitivas CSS y las restricciones de UI. `check:shared-ui` se conserva como alias compatible y el build ejecuta la comprobación completa.

## Verificación

- `pnpm run check:technical-catalog`: 56 piezas sincronizadas.
- `pnpm run check:shared-ui`: pasa mediante el alias compatible.
- `pnpm test -- --watch=false`: 47 archivos y 124 pruebas superadas.
- `pnpm run build`: build de producción completado; conserva avisos no bloqueantes de presupuesto existentes.
- `git diff --check`: sin errores de whitespace.

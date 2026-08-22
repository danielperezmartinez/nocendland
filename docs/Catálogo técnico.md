# Catálogo técnico

Este sistema permite descubrir la superficie reutilizable de Nocendland antes de buscar por todo el repositorio o crear una implementación nueva. Cada fila representa una pieza vigente, en revisión u obsoleta y enlaza con su nota estructurada; después de localizar una candidata se abre su implementación, que continúa siendo la fuente de verdad técnica.

[[Catálogo técnico/Catálogo técnico.base|Abrir la vista completa del catálogo]]

![[Catálogo técnico/Catálogo técnico.base#Todo]]

## Cómo utilizarlo

1. Filtrar la vista por tipo, área, feature o estado.
2. Evitar las piezas `En revisión` salvo que el trabajo incluya estabilizarlas.
3. Abrir la fuente antes de depender de los detalles del contrato o modificarla.
4. Añadir o actualizar la entrada estructurada en el mismo cambio que altere una superficie reutilizable.

## Política de evolución

- Se amplía una pieza existente cuando el nuevo caso conserva su responsabilidad y un contrato claro.
- Se crea una pieza nueva solo cuando representa un patrón estable diferente y se registra en el catálogo en el mismo cambio.
- Las adaptaciones de datos de dominio se realizan en el consumidor; las primitivas compartidas no conocen modelos de un área.
- Las clases `.ui-*` se declaran exclusivamente en `src/styles/components.scss`.
- Una abstracción no puede introducir `any` para aparentar reutilización. Si una pieza heredada todavía lo usa, permanece `En revisión` hasta corregirse o retirarse.
- Los stores se catalogan como fachadas de su propia feature, no como APIs globales ni como stores genéricos.

## Verificación automática

`pnpm run check:technical-catalog` comprueba las propiedades y fuentes de las entradas, los módulos reutilizables de UI, utilidades, plataforma y stores, los entrypoints `@shared/ui/*`, las primitivas `.ui-*` y las restricciones de tipado e imports de la interfaz compartida. La misma comprobación forma parte de `pnpm run build`.

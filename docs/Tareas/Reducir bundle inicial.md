---
Nombre: Reducir bundle inicial
Estado: Pendiente
Resumen: Reducir el bundle inicial total de 589,08 kB frente al presupuesto de 500 kB; contiene 566,34 kB de JavaScript y 22,74 kB de estilos, con transferencia total estimada de 147,21 kB.
Decisiones: La limpieza previa de CSS ya redujo los estilos globales; esta tarea se centra en el JavaScript inicial.
Bloqueada: []
Fecha de creación: 2026-08-06T17:49:32
Última modificación: 2026-09-07
---

# Reducir bundle inicial

## Contexto

La referencia histórica del 6 de agosto situaba el bundle inicial de JavaScript en torno a `1,09 MB`, por encima del presupuesto configurado de `500 kB`. Los estilos globales se habían reducido aproximadamente de `169,68 kB` a `72,11 kB` y no formaban parte principal de esta tarea. Estas cifras no son una medición del código actual.

La auditoría [[Analizar rendimiento de navegación y carga de datos]] del 7 de septiembre intentó `pnpm run build --stats-json`, pero pnpm detuvo la operación con `ERR_PNPM_VERIFY_DEPS_BEFORE_RUN`. La medición sigue pendiente; no se ha modificado la instalación ni implementado una reducción de bundle.

Durante la posterior optimización de autenticación del mismo día, `pnpm install --frozen-lockfile` sincronizó la instalación sin cambiar versiones. `pnpm run build --stats-json` completó correctamente: **589,08 kB iniciales** (566,34 kB de JavaScript y 22,74 kB de CSS), con **147,21 kB de transferencia estimada**. Supera el presupuesto inicial en **89,08 kB**. Esta es la referencia vigente; todavía no se han analizado las contribuciones de dependencias ni implementado una reducción de bundle.

## Enfoque inicial

- Medir qué dependencias y rutas contribuyen al bundle inicial.
- Revisar lazy loading, imports y código que pueda aplazarse.
- Evitar optimizaciones especulativas sin una medición antes y después.

## Criterios de finalización

- El origen principal del peso está documentado.
- El bundle inicial cumple el presupuesto acordado o existe una nueva cifra justificada.
- Las rutas críticas siguen funcionando y las pruebas pasan.

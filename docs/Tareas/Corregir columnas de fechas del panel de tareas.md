---
Nombre: Corregir columnas de fechas del panel de tareas
Estado: Hecha
Resumen: Todas las vistas muestran «Creada» y «Modificada» en formato legible, conservando las fechas ISO para ordenar con precisión.
Decisiones: Las columnas visibles deben usar fórmulas de formato, mientras la ordenación conserva las propiedades de fecha originales.
Bloqueada: []
Fecha de creación: 2026-08-07T09:05:51
Última modificación: 2026-08-07T09:56:05
---

# Corregir columnas de fechas del panel de tareas

## Objetivo

Restaurar las columnas «Creada» y «Modificada» del panel de tareas en Bases.

## Resultado

Las configuraciones de columnas, orden y ordenación usan los nombres directos de las propiedades `Fecha de creación` y `Última modificación`, en lugar de expresiones `note[...]`.

Todas las tareas incluyen ahora hora, minuto y segundo en ambas propiedades. Para conservar su orden histórico, se usaron las marcas de creación y modificación de cada archivo.

Las columnas visibles usan fórmulas de Bases que presentan los valores como `DD-MM-YYYY HH:mm`; las propiedades ISO originales se mantienen como criterio de ordenación.

Las dos columnas de fecha están incluidas en las vistas Todo, Planificando, Pendiente, En curso, Hecha y Archivada.

## Verificación

- No quedan expresiones `note[...]` en `Tareas.base`.
- El diff no contiene errores de espacio.

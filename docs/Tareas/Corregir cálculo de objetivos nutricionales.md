---
Nombre: Corregir cálculo de objetivos nutricionales
Estado: Hecha
Resumen: El cálculo nutricional ya no desborda; Supabase sanea y restringe los valores, las vistas respetan RLS y Angular valida entradas y evita mostrar totales obsoletos.
Decisiones: La solución combina aritmética numeric antes de volver a bigint, límites físicos compartidos entre PostgreSQL y formularios, vistas security_invoker y un estado Signal explícito para los errores de totales.
Bloqueada: []
Fecha de creación: 2026-08-06T17:49:32
Última modificación: 2026-08-22
---

# Corregir cálculo de objetivos nutricionales

## Contexto

Durante la verificación local de la ruta de nutrición se observó un error en el flujo que parte de `getIntakeJoinIngredientOnlyValues()` y termina en `loadObjectiveSumByDate()`.

## Diagnóstico

La causa raíz está en Supabase, antes de la transformación del store. La vista `nutrition_intake_with_totals` calcula las calorías con esta expresión:

```sql
ingredient.calories_per_100 * intake.quantity_in_grams / 100
```

Ambas columnas son `bigint`, por lo que PostgreSQL ejecuta primero la multiplicación como `bigint`. Los datos reales contienen un alimento con `3.000.000.000.000.000.000` calorías por 100 gramos. Cuatro ingestas de ese alimento generan productos superiores al máximo de `bigint` (`9.223.372.036.854.775.807`) y la consulta falla con `22003: bigint out of range`. Las cuatro ingestas pertenecen a un usuario y afectan a tres fechas.

El dato anómalo pudo guardarse porque `nutrition_ingredient` y `nutrition_intake` no tienen restricciones de rango para los valores nutricionales o las cantidades, y el formulario tampoco declara validadores ni límites máximos para esos campos. Además, los tipos generados representan el `bigint` como `number`, aunque valores de esta magnitud exceden también el rango entero seguro de JavaScript.

`nutrition_objectives_totals` agrega la vista anterior, de modo que `getIntakeJoinIngredientOnlyValues()` recibe el error y no devuelve datos. `loadObjectiveSumByDate()` no alcanza su `reduce()` ni actualiza `objectivesState`. Como la recarga iniciada por el `effect()` descarta la promesa y no captura el error, puede producirse un rechazo no gestionado; si antes había totales de otra fecha, el Signal conserva esos valores y la interfaz puede mostrar información obsoleta.

La corrección debe cubrir conjuntamente:

- sanear el alimento y las ingestas anómalas con una decisión explícita sobre sus valores correctos;
- evitar el desbordamiento de la aritmética de la vista mediante tipos adecuados antes de multiplicar;
- añadir restricciones de dominio en PostgreSQL y validación equivalente en los formularios para calorías, macronutrientes, gramos por unidad, cantidades y unidades;
- limpiar o marcar el estado de totales y gestionar el error cuando una recarga falla, evitando conservar valores de otra fecha;
- probar fechas sin ingestas, valores nulos permitidos, límites válidos y entradas fuera de rango.

## Implementación

- La migración `20260822093009_fix_nutrition_totals_overflow.sql` eliminó el alimento de prueba corrupto y sus siete ingestas asociadas. Cuatro de esas ingestas eran las que provocaban el desbordamiento; las otras tres pertenecían al mismo registro inválido.
- `nutrition_intake_with_totals` convierte los operandos de calorías a `numeric` antes de multiplicar y vuelve a `bigint` al final, conservando el contrato publicado sin riesgo de desbordamiento intermedio dentro de los límites admitidos.
- Las dos vistas nutricionales usan `security_invoker`, por lo que respetan las políticas RLS de las tablas subyacentes.
- PostgreSQL rechaza calorías fuera de `0..1000`, macronutrientes fuera de `0..100`, gramos por unidad fuera de `0..32767`, cantidades fuera de `0..100000` y unidades fuera de `0..10000`.
- Los formularios aplican los mismos límites antes de guardar.
- `NutritionStore` limpia los totales anteriores antes de recargar, expone el fallo mediante un Signal de solo lectura y evita rechazos no gestionados desde el efecto de fecha. Objetivos muestra un aviso accesible si el cálculo falla.

## Verificación

- La migración se validó primero dentro de una transacción revertida y después se aplicó al proyecto Supabase `nocendland`.
- Las tres fechas que devolvían `22003: bigint out of range` responden correctamente después de la migración.
- La base de datos contiene cero alimentos e ingestas fuera de los nuevos límites y ambas vistas declaran `security_invoker=true`.
- Las 112 pruebas unitarias pasan, incluidas las regresiones de suma, fecha sin ingestas, eliminación de totales obsoletos y rechazo de entradas fuera de rango.
- El build de producción termina correctamente; conserva únicamente los avisos de presupuesto ya registrados en tareas independientes.
- Los advisors no atribuyen nuevos avisos a esta migración; permanecen avisos preexistentes de privilegios GraphQL, políticas RLS, índices, configuración de Auth y versión de PostgreSQL.

## Criterios de finalización

- La causa raíz está identificada y documentada.
- El cálculo funciona con datos reales y con los casos límite relevantes.
- Existen pruebas que evitan una regresión.
- La interfaz se actualiza mediante Signals y sigue funcionando sin Zone.js.

---
Nombre: Diseñar e implementar finanzas personales
Estado: Hecha
Resumen: Finanzas personales está implementada como una feature responsive de cinco páginas, con periodos configurables, movimientos, recurrentes, planificación y objetivos persistidos en siete tablas aisladas por usuario en devappsdpm-db.
Decisiones: Finanzas es individual y tiene cinco páginas; los recurrentes crean movimientos pendientes editables por ocurrencia; el periodo empieza el día 1 por defecto, admite del 1 al 31 y usa el último día cuando el configurado no existe; el progreso de objetivos agrega todas las aportaciones completadas del historial; las tablas pertenecen al esquema nocendland de devappsdpm-db.
Bloqueada: []
Fecha de creación: 2026-09-07T10:26:56+02:00
Última modificación: 2026-09-07T13:31:12+02:00
---

# Diseñar e implementar finanzas personales

## Objetivo

Transformar los scopes identificados en la hoja de cálculo mensual en una feature de Finanzas cohesionada para un único usuario. Antes de modificar la aplicación o Supabase deben acordarse la arquitectura de información, el aspecto responsive de cada página y el modelo de persistencia.

## Resultado

- Se sustituyó la pantalla temporal por cinco rutas lazy: Resumen, Movimientos, Recurrentes, Plan mensual y Objetivos.
- La interfaz comparte un layout de Finanzas con navegación inferior, selector de periodo y composición responsive para escritorio y móvil.
- Las altas y ediciones se realizan en diálogos; una aportación a un objetivo reutiliza el formulario de movimiento.
- `FinanceStore` coordina el estado con Signals privados, derivados con `computed()` y los valores editables del plan con `linkedSignal()`.
- Se crearon y aplicaron las siete tablas acordadas en el esquema `nocendland` de `devappsdpm-db`, junto con sus restricciones, índices, permisos, políticas RLS y funciones idempotentes de apertura y materialización de periodos.
- Las ocurrencias recurrentes pendientes se generan una sola vez por regla y fecha original; editar una ocurrencia no modifica la regla ni provoca su regeneración.
- El progreso de objetivos agrega el saldo inicial y todas las aportaciones completadas del historial del usuario.

## Diseño y decisiones aprobadas

- Cinco páginas primarias: Resumen, Movimientos, Recurrentes, Plan mensual y Objetivos.
- Los flujos de alta y edición se resuelven con diálogos o paneles contextuales, no con rutas adicionales.
- Los recurrentes generan automáticamente movimientos pendientes. Cada ocurrencia generada es editable sin alterar por ello la regla recurrente ni las demás ocurrencias.
- El periodo financiero empieza el día 1 por defecto, pero cada usuario puede configurar otro día de inicio. Cada periodo conserva sus fechas explícitas para que un cambio de preferencia no reescriba el historial.
- El día configurable admite valores del 1 al 31. Si no existe en un mes, el periodo empieza el último día de ese mes; su final es el día anterior al comienzo del periodo siguiente.
- Modelo base de siete tablas: configuración financiera, categorías, periodos, asignaciones presupuestarias, movimientos, reglas recurrentes y objetivos.
- Las aportaciones a objetivos se representan como movimientos vinculados al objetivo para no duplicar el libro contable.
- Los totales mensuales y equivalentes recurrentes son valores derivados; no se persisten como copias susceptibles de quedar desincronizadas.
- Todo el modelo se creará dentro de `nocendland`, el esquema de la aplicación en el proyecto Supabase compartido `devappsdpm-db`; no se modificarán los esquemas de otras aplicaciones.

## Propuesta técnica del modelo

- `finance_settings`: una fila por usuario; moneda y día preferido de inicio del periodo.
- `finance_category`: categorías archivables de ingreso, gasto o ahorro.
- `finance_period`: intervalo financiero con `starts_on`, `ends_on`, saldo inicial y estado; las fechas quedan congeladas al crearlo.
- `finance_budget_allocation`: presupuesto del periodo por categoría, separado de la ejecución real.
- `finance_recurring_item`: regla periódica con importe, fecha de anclaje, intervalo en meses y vigencia.
- `finance_movement`: movimiento pendiente, completado o cancelado; una ocurrencia recurrente conserva una clave original inmutable y fechas e importe editables.
- `finance_goal`: objetivo con importe, fecha opcional, saldo inicial y estado; el progreso posterior se deriva de movimientos vinculados.

Todas las tablas pertenecen a un usuario, usan importes `numeric`, fechas civiles `date`, auditoría `timestamptz`, claves foráneas compuestas para impedir referencias entre propietarios, índices para las relaciones y consultas por periodo, y políticas RLS separadas por operación con `(select auth.uid())`.

Los totales, el equivalente mensual, el remanente y el progreso de objetivos son derivados. La apertura idempotente de un periodo materializará sus ocurrencias recurrentes sin necesitar un cron global del proyecto compartido.

## Criterios de finalización

- El usuario ha revisado y aprobado todas las páginas en escritorio y móvil.
- La navegación y los casos de uso de cada página están definidos sin duplicidades.
- El esquema de Supabase, sus relaciones y su aislamiento por usuario están acordados.
- La implementación Angular conserva el funcionamiento zoneless y utiliza Signals como estado principal.
- Las nuevas tablas tienen RLS y políticas verificadas para el usuario autenticado.
- Las pruebas y comprobaciones proporcionales al comportamiento afectado terminan correctamente.

## Verificación

- `pnpm run build`: correcto; permanecen avisos no bloqueantes de presupuesto del bundle y estilos, incluidos avisos históricos de otras features.
- `pnpm test -- --watch=false`: 50 archivos y 134 pruebas correctas.
- Pruebas específicas: resumen mensual sin doble conteo, progreso histórico de objetivos, materialización al abrir un periodo y apertura de los tres formularios de alta sin datos de edición.
- Migraciones local/remoto sincronizadas: `20260907104802` y `20260907105801`.
- Prueba transaccional remota con rollback: materialización idempotente y conservación de la edición de una ocurrencia recurrente.
- Advisor de seguridad: ninguna observación sobre las tablas o políticas de Finanzas; queda un aviso global del proyecto compartido sobre protección de contraseñas filtradas.
- Advisor de rendimiento: solo informa índices todavía sin uso, esperable al tratarse de tablas recién creadas; no se eliminan antes de disponer de tráfico representativo.
- La comprobación visual directa alcanza correctamente el guard y la pantalla de autenticación; la inspección de páginas privadas requiere una sesión autenticada del usuario y no se ha introducido ningún bypass de desarrollo.

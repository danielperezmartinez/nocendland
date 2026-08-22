---
Nombre: Mejorar edición del horario de entrenamiento
Estado: Hecha
Resumen: La nueva experiencia de horario está implementada y verificada; la RPC transaccional está desplegada en Supabase, sus tipos están sincronizados y el guardado autenticado se validó sin persistir datos de prueba.
Decisiones: El catálogo se edita en un modo exclusivo con borrador cancelable y guardado transaccional; los enlaces mantienen efecto inmediato; los ejercicios nuevos parten de 12 repeticiones; el selector de presets es exclusivo de Horario y Seguimiento muestra inputs numéricos precargados; el orden existente se manipula mediante una primitiva compartida accesible.
Bloqueada: []
Fecha de creación: 2026-08-11T18:38:34
Última modificación: 2026-08-22T14:33:00
---

# Mejorar edición del horario de entrenamiento

## Objetivo

Hacer que la operativa diaria del horario priorice la asignación y configuración de ejercicios, relegando la administración del catálogo a un modo explícito y añadiendo atajos y ordenación accesible.

## Criterios de finalización

- El botón para añadir ejercicios pertenece a la cabecera del día seleccionado.
- El catálogo colapsado solo muestra selector, estado y acceso a edición.
- Los cambios del catálogo se guardan de forma atómica o se cancelan sin efectos.
- Los ejercicios nuevos parten de 12 repeticiones y admiten presets 8, 10 y 12 además de entrada manual.
- Las tarjetas se pueden ordenar con puntero, tacto y teclado, persistiendo `sort_order` al guardar el día.
- Los cambios sin guardar se protegen antes de abandonar el día o entrar en edición del catálogo.
- Pruebas, comprobaciones compartidas y build quedan verificados.

## Resultado actual

- El catálogo dispone de un modo exclusivo con borrador Signal y guardado atómico preparado mediante `save_training_schedule_catalog`.
- Las tarjetas incluyen presets de repeticiones y una lista reordenable accesible compartida.
- `RepetitionsInputComponent` es una pieza de UI propia de Horario; Seguimiento usa un input numérico precargado con el objetivo del horario para mantener cada serie en una sola fila, editable solo cuando el resultado real cambia.
- Los cambios del día se protegen y restauran al confirmar un descarte.
- La suite completa pasa con 124 pruebas y el build de producción finaliza correctamente.
- La interfaz se verificó en la ruta local con viewport móvil, sin persistir los datos usados durante la comprobación.
- El ajuste de Seguimiento pasa sus 10 pruebas específicas y el build; se comprobó con 17 series a 1280 px y 390 px, sin desbordamiento horizontal ni errores de consola y sin guardar los borradores visuales.

## Verificación de cierre

- La migración quedó registrada en el proyecto remoto como `20260822123046_save_training_schedule_catalog` y el archivo local usa la misma versión.
- `database.types.ts` se regeneró mediante `pnpm run generate-types` y se retiró el contrato local transitorio de la RPC.
- La RPC se ejecutó con el rol `authenticated` sobre el catálogo real dentro de una transacción revertida; devolvió un mapa de horarios y un horario seleccionado válidos sin persistir cambios.
- Los advisors conservaron la línea base previa: 27 hallazgos de seguridad y 22 de rendimiento, sin hallazgos asociados a `save_training_schedule_catalog`.
- La regresión final superó 124 pruebas en 47 archivos y el build de producción terminó correctamente; permanecen avisos de presupuesto ya existentes.

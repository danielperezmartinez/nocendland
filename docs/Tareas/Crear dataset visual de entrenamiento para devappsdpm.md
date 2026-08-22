---
Nombre: Crear dataset visual de entrenamiento para devappsdpm
Estado: Hecha
Resumen: La cuenta devappsdpm dispone de un dataset reproducible que cubre las variantes visuales de ejercicios, horarios, seguimiento y fichas de progreso.
Decisiones: El dataset se identifica mediante UUID portátiles reservados, conserva los datos ajenos al seed y usa fechas relativas para mantener visibles las gráficas y recomendaciones al volver a aplicarlo.
Bloqueada: []
Fecha de creación: 2026-08-14T19:39:01+02:00
Última modificación: 2026-08-14T19:42:01+02:00
---

# Crear dataset visual de entrenamiento para devappsdpm

## Objetivo

Poblar la cuenta de desarrollo `devappsdpm` con ejercicios, horarios y sesiones que permitan revisar las variantes visuales de Entrenamiento con datos reales de Supabase.

## Criterios de finalización

- El catálogo contiene ejercicios sin descripción, con descripción larga, sin clasificación y con suficientes badges para mostrar el resumen `+N`.
- Las fichas cubren ausencia de historial, sesiones sin métricas, progreso basado solo en repeticiones y las cuatro métricas ponderadas.
- Seguimiento muestra sesiones anteriores, series completas e incompletas y al menos una recomendación de subida de carga.
- Horario contiene un catálogo activo e inactivo, días con distinta densidad y al menos un día vacío.
- El seed puede repetirse sin duplicar sus datos y conserva los registros que no le pertenecen.

## Resultado

- `supabase/seeds/devappsdpm_visual_training.sql` crea nueve ejercicios identificados mediante UUID portátiles reservados y conserva el ejercicio anterior de la cuenta, incluida su imagen de Storage.
- El catálogo cubre ausencia de descripción y clasificación, cuatro badges exactos, desbordamiento `+N`, vídeo, tips vacíos y múltiples y cards con y sin imagen.
- Se crean dos horarios de QA: uno activo con diez asignaciones distribuidas en seis días y otro inactivo con dos asignaciones. El sábado permanece vacío en la fecha de creación del dataset.
- Se crean 26 seguimientos y 82 series con fechas relativas, incluidas seis cards en la fecha actual, historial sin métricas, progreso solo por repeticiones y progreso ponderado.
- Press banca cumple las dos sesiones anteriores necesarias para mostrar la recomendación de subida; Sentadilla conserva un historial que no la activa y la sesión actual incluye valores incompletos.

## Verificación

- El seed se ejecutó dos veces seguidas sin errores ni duplicados.
- La consulta de cobertura confirmó nueve ejercicios del seed, un caso sin badges, uno con cuatro, seis con desbordamiento, uno con vídeo y seis con varios tips.
- Las fichas disponen de tres ejercicios sin historial, uno con historial sin métricas, dos con historial solo de repeticiones y tres con historial ponderado.
- Existe exactamente un horario activo para la cuenta y la recomendación de Press banca encuentra dos sesiones anteriores completas.
- El ejercicio previo con imagen sigue activo y su objeto continúa presente en Storage.

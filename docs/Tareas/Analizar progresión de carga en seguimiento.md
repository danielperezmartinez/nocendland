---
Nombre: Analizar progresión de carga en seguimiento
Estado: Hecha
Resumen: Seguimiento analiza las dos últimas sesiones de cada ejercicio visible y señala cuándo conviene subir el peso mediante un tooltip accesible.
Decisiones: La recomendación exige cumplir todas las series, repeticiones y peso objetivo en las dos últimas sesiones; la carga más reciente debe ser igual o superior; sin objetivos completos no se recomienda; el indicador será una flecha con un tooltip compartido compatible con toque.
Bloqueada: []
Fecha de creación: 2026-08-14T18:52:45+02:00
Última modificación: 2026-08-14T19:06:41+02:00
---

# Analizar progresión de carga en seguimiento

## Objetivo

Ayudar al usuario a decidir cuándo aumentar la carga de cada ejercicio visible en Seguimiento mediante una regla de doble progresión conservadora y explicable.

## Criterios de finalización

- Solo se recomienda subir el peso cuando las dos últimas sesiones anteriores cumplen todos los objetivos configurados.
- Los ejercicios sin objetivos completos, historial suficiente o datos válidos no muestran recomendación.
- La señal aparece como una flecha ascendente con una explicación accesible mediante hover, foco, clic y toque.
- El tooltip queda disponible como primitiva compartida y registrado en el catálogo técnico.
- Los fallos del historial no bloquean el seguimiento y las respuestas de fechas antiguas se descartan.
- Pruebas, comprobaciones de Shared UI, estilos y build verifican el resultado zoneless y responsive.

## Resultado

- `TrackingRepository` carga las dos sesiones anteriores y `TrainingStore` conserva el historial reciente mediante un Signal privado, derivando de él el recordatorio de última sesión existente.
- Una función pura aplica la regla acordada sobre las series previstas y solo recomienda cuando ambas sesiones cumplen los objetivos sin reducir la carga mínima de trabajo.
- Seguimiento presenta una flecha positiva únicamente para recomendaciones válidas y explica el criterio aplicado sin calcular un incremento concreto.
- `TooltipDirective` queda disponible desde `@shared/ui/tooltip` con hover diferido, foco, clic, toque, cierre exterior y por Escape, posicionamiento adaptativo y atributos accesibles.
- La primitiva se integró en Atlas, en el sprite de iconos y en [[Catálogo técnico]].

## Verificación

- `pnpm test -- --watch=false --browsers=ChromeHeadless`: 96 pruebas superadas.
- `pnpm run build`: compilación de producción correcta y comprobaciones de estilos y Shared UI superadas; permanecen únicamente los avisos de presupuesto ya conocidos.
- `git diff --check`: sin errores de espacios.
- La aplicación local arranca sin errores de consola y el guard redirige correctamente a autenticación; la sesión aislada del navegador no permitió abrir Seguimiento con datos reales sin iniciar OAuth.

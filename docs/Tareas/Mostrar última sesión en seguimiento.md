---
Nombre: Mostrar última sesión en seguimiento
Estado: Hecha
Resumen: Cada ejercicio de Seguimiento muestra su sesión anterior más reciente con fecha y series, sin bloquear la edición si el recordatorio falla.
Decisiones: La referencia será la última sesión anterior a la fecha seleccionada, aunque no pertenezca a la semana inmediatamente anterior; si no existe historial, no se mostrará ningún recordatorio.
Bloqueada: []
Fecha de creación: 2026-08-12T17:00:00+02:00
Última modificación: 2026-08-12T17:03:22+02:00
---

# Mostrar última sesión en seguimiento

## Objetivo

Ayudar a preparar cada ejercicio del diario mostrando lo realizado en su sesión anterior sin modificar ni precargar automáticamente las series actuales.

## Criterios de finalización

- Cada tarjeta muestra la fecha y las series de la sesión anterior más reciente.
- La búsqueda excluye la fecha seleccionada y cualquier fecha posterior.
- Los ejercicios sin historial previo no muestran el recordatorio.
- Los ejercicios añadidos durante la edición también cargan su recordatorio.
- Las respuestas antiguas y los fallos aislados no alteran ni bloquean el seguimiento activo.
- Las pruebas y el build verifican el comportamiento zoneless basado en Signals.

## Resultado

- `TrackingRepository` consulta una única sesión anterior por ejercicio y ordena sus series por posición.
- `TrainingStore` conserva recordatorios por fecha mediante un Signal de solo lectura, comparte peticiones concurrentes y descarta respuestas que ya no pertenecen a la fecha activa.
- Seguimiento muestra el recordatorio literal tanto para registros existentes como para ejercicios añadidos durante la edición; los historiales vacíos y los fallos permanecen ocultos.

## Verificación

- `pnpm test -- --watch=false --browsers=ChromeHeadless`: 72 pruebas superadas.
- `pnpm run build`: compilación de producción correcta, con los avisos de presupuesto ya presentes y el aviso local por ejecutar Node 24 frente a Node 22 declarado.
- `git diff --check`: sin errores de espacios.

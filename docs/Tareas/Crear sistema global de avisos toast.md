---
Nombre: Crear sistema global de avisos toast
Estado: Hecha
Resumen: Nocendland dispone de avisos globales compactos y accesibles para guardados correctos y errores transitorios, integrados en los flujos explícitos de Nutrición y Entrenamiento.
Decisiones: El sistema sigue Atlas modular, mantiene una cola máxima de tres avisos mediante un Signal privado, usa cuatro segundos para éxitos y seis para errores, pausa el cierre durante hover o foco y conserva junto al formulario los errores persistentes de validación o recuperación; los autoguardados silenciosos no muestran éxitos repetitivos.
Bloqueada: []
Fecha de creación: 2026-08-14T19:04:35+02:00
Última modificación: 2026-08-14T19:13:18+02:00
---

# Crear sistema global de avisos toast

## Contexto

La aplicación comunica algunos fallos junto al control que los provoca, pero no dispone de una respuesta global coherente cuando una operación termina correctamente o falla de forma transitoria. El usuario ha aprobado una propuesta visual compacta con variantes de éxito y error.

## Alcance

- Crear una primitiva compartida global con servicio Signal y outlet accesible.
- Limitar la cantidad de avisos visibles y retirarlos automáticamente sin bloquear la interfaz.
- Permitir cierre manual y pausar el temporizador mientras el usuario interactúa con el aviso.
- Integrar los guardados principales de Nutrición y Entrenamiento.
- Mantener los mensajes persistentes cuando sean necesarios para corregir datos o recuperar una operación parcial.
- Verificar pruebas, build, tema oscuro y claro, escritorio y móvil.

## Criterios de finalización

- Los guardados correctos generan un aviso breve de éxito.
- Los fallos transitorios generan un aviso de error accesible.
- La UI funciona con detección zoneless y Signals, sin dependencias nuevas.
- Los avisos no tapan la navegación inferior ni desbordan un viewport móvil de 390 × 844.
- El catálogo técnico registra la nueva superficie pública compartida.

## Resultado

- `ToastService` expone una cola Signal de solo lectura, limita los avisos visibles, coordina sus temporizadores y permite pausa, reanudación y cierre manual.
- `ToastOutletComponent` se monta una sola vez en la raíz y presenta variantes de éxito y error con roles `status` y `alert`, progreso temporal y posición segura respecto a la navegación móvil.
- Horario, catálogo de horarios, Seguimiento, fichas de ejercicios, alimentos, imágenes, ingestas y objetivos notifican sus guardados explícitos y fallos transitorios.
- Los errores de formulario y operaciones parciales continúan visibles en su contexto para no perder información accionable.

## Verificación

- 101 pruebas unitarias correctas, incluidas cinco pruebas nuevas de cola, cierre automático, límite, pausa, roles y cierre manual.
- Build de producción correcto; permanecen únicamente los avisos de presupuesto preexistentes y la nueva hoja del toast queda por debajo del límite de componente.
- Comprobaciones de estilos y catálogo compartido correctas; `git diff --check` sin errores.
- Aplicación comprobada en navegador a 1280 px y 390 × 844, sin errores de consola ni desbordamiento horizontal; el outlet móvil ocupa 358 px entre márgenes de 16 px y queda por encima del dock inferior.

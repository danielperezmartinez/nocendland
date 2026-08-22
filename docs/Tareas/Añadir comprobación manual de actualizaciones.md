---
Nombre: Añadir comprobación manual de actualizaciones
Estado: Hecha
Resumen: La versión del side nav incorpora un control discreto para solicitar manualmente una comprobación de actualizaciones de la PWA y mostrar su progreso.
Decisiones: Se reutiliza AppUpdateService, que expone la comprobación en curso mediante un Signal de solo lectura; el control aprobado utiliza el modificador reutilizable .ui-icon-button--subtle y aria-busy para su estado.
Bloqueada: []
Fecha de creación: 2026-08-22T13:50:46+02:00
Última modificación: 2026-08-22T14:03:00+02:00
---

# Añadir comprobación manual de actualizaciones

## Contexto

La aplicación ya comprueba actualizaciones al arrancar, al recuperar visibilidad y cada seis horas. El usuario quiere poder iniciar también una comprobación manual desde el lugar donde se muestra la versión, sin convertir esa acción secundaria en un elemento prominente de la navegación.

## Enfoque propuesto

- Mantener la versión como información principal de la línea inferior.
- Añadir una acción compacta con icono de sincronización y etiqueta accesible.
- Reservar el énfasis visual para los estados de interacción y comprobación.
- Validar primero la sutileza mediante una previsualización aislada.

## Criterios de finalización

- El usuario aprueba la apariencia antes de implementar el cambio.
- El botón permite solicitar una comprobación sin recargar automáticamente la aplicación.
- El estado de comprobación es perceptible y accesible.
- El comportamiento conserva Signals y el funcionamiento zoneless.
- Las pruebas existentes se actualizan para cubrir la comprobación manual.

## Resultado

- La línea de versión conserva su jerarquía y añade a la derecha el control de actualización aprobado.
- Durante la comprobación, el texto cambia a `Comprobando…`, el icono gira y el botón impide solicitudes concurrentes.
- El control dispone de etiqueta accesible, tooltip, `aria-busy` y respeta la preferencia de movimiento reducido mediante los tokens de duración.
- `AppUpdateService` expone `checking` como Signal de solo lectura y mantiene privado su estado escribible.
- El modificador reutilizable `.ui-icon-button--subtle` queda registrado en el catálogo técnico.

## Verificación

- `pnpm test -- --watch=false`: 47 archivos y 124 pruebas correctas.
- `pnpm run build`: compilación de producción correcta, comprobación cromática correcta y catálogo técnico sincronizado con 57 piezas.
- La shell no incorpora un nuevo aviso de presupuesto; permanecen únicamente los avisos preexistentes del bundle y otros componentes ya cubiertos por tareas independientes.

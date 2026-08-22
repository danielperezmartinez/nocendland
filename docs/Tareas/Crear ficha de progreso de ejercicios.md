---
Nombre: Crear ficha de progreso de ejercicios
Estado: Hecha
Resumen: Los ejercicios disponen de una ficha responsive con acceso desde catálogo y seguimiento, navegación protegida hacia edición y gráficas derivadas del historial de series.
Decisiones: La ficha será la entrada principal de ejercicios existentes; priorizará 1RM estimado, volumen y peso máximo con periodos 4S, 12S, 6M, 1A y Todo; 12S será el periodo inicial; sin peso se mostrará la evolución de repeticiones.
Bloqueada: []
Fecha de creación: 2026-08-12T16:04:23+02:00
Última modificación: 2026-08-12T16:42:48+02:00
---

# Crear ficha de progreso de ejercicios

## Objetivo

Incorporar una página de visualización para cada ejercicio que reúna su información guardada y represente el progreso obtenido desde Seguimiento, conservando la experiencia zoneless, el estado con Signals y el lenguaje visual Atlas.

## Criterios de finalización

- Los ejercicios existentes abren su ficha desde el catálogo y desde cada bloque de Seguimiento.
- La ficha y el formulario permiten alternar entre resumen y edición conservando el origen y la fecha de retorno.
- El historial ofrece 1RM estimado, volumen, peso máximo o repeticiones según los datos disponibles.
- Los periodos 4S, 12S, 6M, 1A y Todo filtran la visualización, con 12S seleccionado inicialmente.
- Las sesiones incompletas, los estados vacíos, la selección de puntos y la navegación con cambios pendientes se resuelven de forma accesible.
- Pruebas, build y experiencia responsive quedan verificados.

## Resultado

- La ruta lazy `exercises/:id` presenta imagen, clasificación, descripción, vídeo, tips y el resumen del periodo.
- ApexCharts representa 1RM estimado, volumen, peso máximo o repeticiones con intervalos 4S, 12S, 6M, 1A y Todo; cada sesión permite consultar sus series literales.
- El catálogo y los bloques de Seguimiento abren la ficha, mientras Resumen y Editar conservan el origen y la fecha de retorno.
- Un guard compartido protege los cambios pendientes del formulario y Seguimiento ante cualquier navegación.
- El calendario compartido recibe una fecha controlada mediante Signal y ya no sustituye la selección restaurada al inicializarse.
- El historial se consulta por usuario y ejercicio en páginas de 500 entradas, conservando el orden de sesiones y series sin cambios de esquema.

## Verificación

- `pnpm test -- --watch=false`: 61 pruebas correctas.
- `pnpm build`: correcto; permanecen los avisos conocidos de presupuesto inicial y estilos, sin superar sus máximos de error.
- La ficha se verificó con datos reales en escritorio y 390 × 844, sin desbordamiento horizontal ni errores de consola.
- Se comprobaron en navegador catálogo → ficha, Seguimiento → ficha → fecha original, Resumen ↔ Editar y el diálogo de cambios sin guardar sin persistir los datos de prueba.
- El acceso desde cada bloque de Seguimiento se refinó como botón iconográfico independiente junto a Eliminar; el encabezado vuelve a ser contenido informativo y el botón conserva un nombre accesible específico del ejercicio.

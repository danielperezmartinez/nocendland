---
Nombre: Mantener visibles los controles de data-list
Estado: Hecha
Resumen: DataList desplaza internamente sus elementos; Horario y Seguimiento desplazan la página completa y mantienen su footer sticky sobre el dock, aprovechando el viewport sin solaparse con la navegación.
Decisiones: DataList conserva toolbar y footer en filas fijas y desplaza solo sus elementos; las páginas normales de Horario y Seguimiento comparten scroll exterior y footer sticky; se conserva la API pública y se limita la altura al viewport cuando el consumidor no la acota.
Bloqueada: []
Fecha de creación: 2026-08-12T16:58:00+02:00
Última modificación: 2026-08-14T20:25:48+02:00
---

# Mantener visibles los controles de data-list

## Objetivo

Mejorar la experiencia de las listas largas haciendo que la barra de herramientas y el botón de confirmación permanezcan visibles mientras los elementos se desplazan dentro de la lista.

## Criterios de finalización

- En `DataListComponent`, solo el contenedor de elementos gestiona el desplazamiento vertical.
- La barra de herramientas y el pie de confirmación permanecen dentro del área visible.
- La lista aprovecha la altura disponible en Nutrición y Entrenamiento y dispone de un límite seguro basado en el viewport.
- Horario y Seguimiento desplazan su página completa y mantienen el footer sticky sobre el dock.
- El comportamiento se verifica con listas largas, cortas y vacías, tanto en escritorio como en móvil.
- La API `DataListConfig` y su estado basado en Signals no cambian.

## Verificación

- `pnpm test -- --watch=false`: 106 pruebas correctas.
- `pnpm run build`: correcto; permanecen los avisos conocidos de presupuesto inicial y estilos sin superar sus máximos de error.
- Verificación real en escritorio y 390 × 844 de Alimentos, Ingestas, Ejercicios, Horario y Seguimiento.
- En Horario, el layout se desplaza al abrir el selector y mantiene la toolbar y Confirmar por encima de la navegación inferior.
- No se observaron errores de consola durante la comprobación visual.
- Revalidación de Seguimiento en 692 × 920 y 390 × 844: el layout exterior recibe el desplazamiento y el listado conserva `scrollTop` 0; el footer permanece sticky como en Horario.
- La separación entre footer y navegación se reduce de 73,7 px a 10 px en 692 × 920 y se mantiene en 10 px a 390 × 844, sin solapamiento.

## Resultado

- `DataListComponent` compone toolbar, contenido desplazable y footer en tres filas, con un límite basado en el viewport y las áreas seguras.
- La cadena de alturas se completa en la shell de contenido, los layouts de Nutrición/Entrenamiento y las páginas que alojan listas a pantalla completa.
- Los layouts de feature gestionan el scroll de las páginas normales; solo los componentes `DataList` desplazan exclusivamente sus elementos.
- Horario alinea automáticamente el selector al entrar en modo selección para evitar que la navegación inferior tape la confirmación.
- La API `DataListConfig` y el estado basado en Signals permanecen intactos.
- Los pies sticky de Horario y Seguimiento comparten el mismo comportamiento y conservan únicamente la separación mínima respecto a la navegación inferior.
- Se verificó en navegador que Horario y Seguimiento mantienen 20 px de separación respecto al contenido anterior y 0 px de solapamiento.
- Seguimiento desplaza fecha, cabecera y registros como una página continua mientras el footer permanece accesible sobre el dock, igual que en Horario.
- El layout de Entrenamiento descuenta el padding ya aportado por el marco central y por la página al reservar el dock; así aprovecha el espacio vertical sin duplicar separaciones.
- Revalidación final: 106 pruebas correctas, build de producción correcto y consola sin errores en los viewports comprobados.

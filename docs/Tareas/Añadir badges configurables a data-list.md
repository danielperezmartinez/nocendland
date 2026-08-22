---
Nombre: Añadir badges configurables a data-list
Estado: Hecha
Resumen: Extender el uso de BadgeComponent a todas las etiquetas y contadores informativos que todavía duplican esta primitiva en la interfaz.
Decisiones: Los badges admitirán variantes label, count y dot; usarán estados semánticos con primary por defecto; DataList mostrará cuatro por defecto y resumirá el exceso con +N; las clasificaciones de ejercicios usarán el acento único de Llimbro; los controles interactivos con aspecto de chip conservarán su propia primitiva.
Bloqueada: []
Fecha de creación: 2026-08-14T18:54:10+02:00
Última modificación: 2026-08-14T19:29:26+02:00
---

# Añadir badges configurables a data-list

## Objetivo

Incorporar una primitiva visual de badge compatible con Atlas y permitir que las listas genéricas presenten colecciones de badges sin conocer el dominio consumidor.

## Criterios de finalización

- El badge dispone de variantes de etiqueta, contador y punto con estados visuales, truncado y pulso accesible.
- DataList recibe configuraciones de badge tipadas, limita su presentación y mantiene todos sus valores en la búsqueda.
- El catálogo de ejercicios conserva la descripción como subtítulo y presenta su clasificación mediante badges.
- Las pruebas, las comprobaciones de shared UI y estilos, el build y la experiencia responsive quedan verificados.

## Resultado

- `BadgeComponent` expone configuraciones discriminadas para etiqueta, contador y punto, cinco estados visuales, truncado numérico y pulso respetuoso con movimiento reducido.
- `DataListItem` acepta directamente `BadgeConfig[]`; la lista muestra cuatro por defecto, permite otro límite o todos, genera `+N` y conserva los badges ocultos en la búsqueda.
- Ejercicios mantiene la descripción como único detalle textual y transforma toda su taxonomía en badges con el acento de Llimbro.
- La ficha de ejercicio reutiliza los mismos badges para su taxonomía; Horario y Seguimiento los usan también en estados y contadores de posición, y Medidas en su estado de desarrollo.
- Los chips de selección del formulario continúan como controles propios porque son interactivos, no indicadores informativos.
- El catálogo técnico y el entrypoint `@shared/ui/badge` documentan la nueva superficie pública.

## Verificación

- 28 pruebas focalizadas y 106 pruebas unitarias completas superadas en Chrome Headless.
- Build de producción, comprobación cromática y contrato de shared UI superados.
- Ficha real revisada sin errores de consola en escritorio con tema oscuro y a 390 × 844 con tema claro; los badges mantienen contraste, espaciado y wrap sin desbordamiento.

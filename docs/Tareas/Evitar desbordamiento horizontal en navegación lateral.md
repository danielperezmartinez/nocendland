---
Nombre: Evitar desbordamiento horizontal en navegación lateral
Estado: Hecha
Resumen: Mantener el desplazamiento horizontal de las tarjetas de feature al hacer hover sin crear una barra de desplazamiento ni recortar su borde.
Decisiones: Reservar en el contenedor lateral el espacio equivalente al desplazamiento del hover y bloquear únicamente el overflow horizontal.
Bloqueada: []
Fecha de creación: 2026-08-14T00:00:00
Última modificación: 2026-08-22T00:00:00
---

# Evitar desbordamiento horizontal en navegación lateral

## Contexto

Las tarjetas de feature de la navegación lateral se desplazan a la derecha al hacer hover. Ese desplazamiento visual extiende el área desplazable del contenedor y muestra una barra horizontal.

## Criterios de finalización

- El efecto de hover se conserva completo, sin bordes recortados.
- La navegación lateral no muestra una barra de desplazamiento horizontal.
- El desplazamiento vertical continúa disponible cuando el contenido lo requiere.

## Resultado

- El contenedor reserva a la derecha el mismo espacio que utiliza el desplazamiento del hover.
- El eje horizontal queda recortado sin afectar al desplazamiento vertical.
- `pnpm run check:styles` se completó correctamente.
- La comprobación autenticada en ejecución confirmó que el hover conserva sus 4 px de desplazamiento y que el contenedor mantiene `scrollWidth` igual a `clientWidth`, sin desbordamiento horizontal.
- Los encabezados del menú se simplificaron para mostrar únicamente el nombre de cada área con el estilo de eyebrow, sin repetir el rótulo «Área».
- Las áreas conservan su separación espacial sin divisores horizontales entre secciones.
- Miscelánea ocupa la última posición del menú, después de las áreas con dominio propio.

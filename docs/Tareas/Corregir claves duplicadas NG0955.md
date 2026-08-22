---
Nombre: Corregir claves duplicadas NG0955
Estado: Pendiente
Resumen: Localizar el bloque @for que genera claves de seguimiento duplicadas y sustituirlo por una identidad única y estable.
Decisiones: ""
Bloqueada: []
Fecha de creación: 2026-08-06T17:49:32
Última modificación: 2026-08-06T17:49:32
---

# Corregir claves duplicadas NG0955

## Contexto

Angular ha emitido el error `NG0955`, que indica que la expresión `track` de un bloque `@for` produce claves duplicadas. Esto puede provocar recreaciones innecesarias o una asociación incorrecta entre datos y elementos de la interfaz.

## Criterios de finalización

- El bloque responsable está identificado.
- Cada elemento usa una clave única, estable y ligada a su identidad real.
- El error no aparece durante el flujo que lo reproducía.
- Una prueba cubre colecciones con valores potencialmente repetidos.

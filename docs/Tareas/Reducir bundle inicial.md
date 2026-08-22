---
Nombre: Reducir bundle inicial
Estado: Pendiente
Resumen: Reducir el JavaScript inicial, actualmente alrededor de 1,09 MB frente a un presupuesto de 500 kB, sin degradar la experiencia.
Decisiones: La limpieza previa de CSS ya redujo los estilos globales; esta tarea se centra en el JavaScript inicial.
Bloqueada: []
Fecha de creación: 2026-08-06T17:49:32
Última modificación: 2026-08-06T17:49:32
---

# Reducir bundle inicial

## Contexto

El build sigue avisando de que el bundle inicial de JavaScript ronda `1,09 MB`, por encima del presupuesto configurado de `500 kB`. Los estilos globales ya se redujeron aproximadamente de `169,68 kB` a `72,11 kB` y no forman parte principal de esta tarea.

## Enfoque inicial

- Medir qué dependencias y rutas contribuyen al bundle inicial.
- Revisar lazy loading, imports y código que pueda aplazarse.
- Evitar optimizaciones especulativas sin una medición antes y después.

## Criterios de finalización

- El origen principal del peso está documentado.
- El bundle inicial cumple el presupuesto acordado o existe una nueva cifra justificada.
- Las rutas críticas siguen funcionando y las pruebas pasan.

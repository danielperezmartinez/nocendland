---
Estado: Pendiente
Resumen: Crear un sistema de almacenamiento local genérico por si el usuario pierde la conexión que no de error.
Decisiones:
Bloqueada:
Fecha de creación: 2026-08-07T10:51:00
Última modificación: 2026-08-07T10:51:00
---
Es necesaria la creación de un sistema de almacenamiento local que se sincronice con supabase. Esta aplicación se usa generalmente desde el móvil y hay zonas en que la cobertura es de mala calidad o directamente se pierde. Así que hay que inventar un sistema general aplicable a cualquier llamada a la API para que si el usuario intenta crear/editar algún registro en cualquier feature de la aplicación y este no tiene una buena conexión y la petición falla se almacene sí o sí.
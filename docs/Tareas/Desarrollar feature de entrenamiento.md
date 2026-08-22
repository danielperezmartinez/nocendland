---
Nombre: Desarrollar feature de entrenamiento
Estado: Hecha
Resumen: Entrenamiento dispone de catálogo de ejercicios, horario semanal, seguimiento diario, Medidas en desarrollo y un modelo aislado por usuario en Supabase.
Decisiones: El horario será una plantilla semanal recurrente; cada ejercicio tendrá objetivos uniformes por serie; Seguimiento permitirá cualquier fecha y un registro por ejercicio y día; los ejercicios se archivarán para conservar el historial; las imágenes seguirán en el bucket privado con acceso restringido por usuario.
Bloqueada: []
Fecha de creación: 2026-08-07T11:04:53
Última modificación: 2026-08-07T12:37:00
---

# Desarrollar feature de entrenamiento

## Objetivo

Construir la feature de Entrenamiento de Llimbro con catálogo de ejercicios, plantilla semanal, seguimiento diario y una pantalla provisional de Medidas, respetando la arquitectura modular, Angular zoneless, Signals y el sistema visual Atlas.

## Criterios de finalización

- Las cuatro rutas se navegan mediante la tab bar compartida en el orden Ejercicios, Horario, Seguimiento y Medidas.
- Los ejercicios pueden crearse, editarse y archivarse con imagen, descripción y tips.
- El horario semanal permite asignar ejercicios y configurar series, repeticiones y peso.
- Seguimiento precarga el horario del día, permite ajustar series y guarda un único registro por ejercicio y fecha.
- Las tablas, relaciones y políticas RLS aíslan los datos de cada usuario.
- Las imágenes del bucket quedan restringidas por propietario sin romper las imágenes existentes de Nutrición.
- Tipos, pruebas, build, advisors y experiencia responsive quedan verificados.

## Resultado

- Se añadieron las cuatro rutas y la navegación inferior reutilizable en el orden acordado.
- Ejercicios permite crear, editar y archivar fichas con imagen, descripción y tips.
- Horario guarda una plantilla recurrente de lunes a domingo con objetivos uniformes por ejercicio.
- Seguimiento permite elegir fecha, precarga el horario correspondiente y edita bloques con series dinámicas.
- Supabase incorpora cuatro tablas con claves de propietario compuestas, checks, índices, RLS por operación y acceso anónimo revocado.
- El bucket `nocendland` conserva su estructura y restringe cada objeto a la carpeta del usuario autenticado.
- La prueba transaccional de dos usuarios confirmó una fila propia visible, cero actualizaciones ajenas y cero objetos ajenos visibles.
- Las 35 pruebas unitarias y el build de producción finalizaron correctamente; permanece únicamente la advertencia conocida del presupuesto inicial cubierta por [[Reducir bundle inicial]].
- Las cuatro pantallas se comprobaron en navegador con el tema activo, en escritorio y 390 × 844, sin desbordamiento horizontal ni errores de consola; sus estilos consumen exclusivamente tokens compatibles con ambos temas.
- Se corrigió la persistencia de Horario y Seguimiento: los `upsert` ya no envían un `id` vacío para registros nuevos y resuelven conflictos mediante sus claves naturales. Horario muestra además un error accesible si el guardado falla.
- El arreglo se verificó guardando el ejercicio «Rompe tetas» el viernes, recargando la página y consultando la fila resultante en Supabase; las 35 pruebas y el build de producción continúan correctos.

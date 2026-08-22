---
Nombre: Mejorar formulario de ejercicios e imágenes
Estado: Hecha
Resumen: Los ejercicios incorporan vídeo, clasificación estructurada y gestión completa de fotos mediante un recortador configurable y documentado como API pública reutilizable.
Decisiones: La clasificación separa modalidad, zonas musculares y patrones de movimiento; el vídeo se almacena sin reproducción; el recortador será una primitiva pública de shared/ui configurable y documentada en el catálogo técnico; las imágenes se encuadran antes de guardarse.
Bloqueada: []
Fecha de creación: 2026-08-11T18:31:53+02:00
Última modificación: 2026-08-11T18:50:37+02:00
---

# Mejorar formulario de ejercicios e imágenes

## Objetivo

Completar la ficha de ejercicio con vídeo, clasificaciones coherentes y gestión integral de imágenes, extrayendo el encuadre a una API visual reutilizable por cualquier formulario de la aplicación.

## Criterios de finalización

- Los ejercicios guardan vídeo HTTPS opcional, modalidades, zonas musculares y patrones de movimiento.
- La clasificación utiliza opciones tipadas, multiselección y etiquetas visibles en español.
- La foto puede elegirse pulsando su vista previa, encuadrarse, reeditarse, sustituirse y eliminarse.
- El recortador admite relaciones de aspecto y salidas configurables, funciona con ratón, tacto y teclado y está registrado en el catálogo técnico.
- Los enlaces compartidos nuevos conservan los metadatos añadidos y los anteriores siguen siendo importables.
- Migración, tipos, pruebas, build, advisors y experiencia responsive quedan verificados.

## Resultado

- `ImageCropperComponent` se publicó desde `@shared/ui/image-cropper` con relación de aspecto, tamaño, formato y calidad configurables, controles de puntero, tacto, teclado y zoom, y contrato independiente de la persistencia.
- El catálogo técnico documenta la API y un ejemplo de consumo para que otras áreas la reutilicen.
- La ficha permite seleccionar la foto pulsando su vista previa, recortar imágenes nuevas o existentes, cancelar, reemplazar y quitar la imagen de forma diferida hasta guardar.
- Los ejercicios guardan vídeo HTTPS, modalidades, zonas musculares y patrones de movimiento mediante valores tipados y restricciones de base de datos.
- El catálogo muestra e indexa las etiquetas y `training-share/v1` conserva los nuevos datos sin dejar de importar manifiestos anteriores.
- La eliminación utiliza la API de Storage y actualiza `image_path` únicamente después de retirar el objeto.

## Verificación

- Migración `20260811163358_extend_training_exercise_metadata` aplicada y tipos regenerados; restricciones de URL y taxonomía probadas en una transacción revertida.
- Manifiestos `training-share/v1` antiguos y nuevos importados correctamente dentro de una transacción revertida; Edge Function `training-share` versión 4 activa.
- `pnpm test -- --watch=false`: 45 pruebas correctas tras incorporar las pruebas del formulario y del recortador.
- `pnpm build`: correcto; permanecen los avisos conocidos de presupuesto. Las comprobaciones de estilos y catálogo compartido también finalizan correctamente.
- Formulario, encuadre, zoom, teclado, cancelación y eliminación diferida verificados en navegador; escritorio y 390 × 844 sin desbordamiento ni errores de consola.
- Los advisors no atribuyen avisos nuevos a esta migración; continúan los avisos preexistentes de Nutrición, exposición GraphQL, versión de Postgres e índices sin uso.
- Una repetición posterior del test/build global quedó interferida por la tarea simultánea [[Mejorar edición del horario de entrenamiento]], que todavía no había sincronizado su RPC y sus tipos; no se modificaron sus archivos para ocultar ese estado transitorio.

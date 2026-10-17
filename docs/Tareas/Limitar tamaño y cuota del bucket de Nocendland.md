---
Nombre: Limitar tamaño y cuota del bucket de Nocendland
Estado: En curso
Resumen: El bucket nocendland no está versionado en ninguna migración, no tiene file_size_limit (127 MB en 48 objetos el 2026-10-16) y no tiene cuota por usuario; cualquier cuenta autenticada puede subir archivos sin límite a su carpeta y agotar el Storage que comparten las apps de devappsdpm-db.
Decisiones: "Límite de 2 MB por archivo con compresión en el cliente (WebP, lado mayor de 1024 px) y cuota de 200 objetos por usuario; se admiten PNG, JPEG y WebP porque el recortador de ejercicios produce WebP. Las imágenes existentes se conservan."
Bloqueada: []
Fecha de creación: 2026-10-16T23:23:13+02:00
Última modificación: 2026-10-17T09:46:56+02:00
---

# Limitar tamaño y cuota del bucket de Nocendland

## Contexto

Hallazgo de gravedad media de la auditoría del 2026-10-16. En remoto, el bucket es privado y admite `image/png` e `image/jpeg`, pero `file_size_limit` es `NULL` (hereda el límite global del proyecto, normalmente 50 MB). La política `nocendland_insert_own_objects` (`supabase/migrations/20260823194409_migrate_to_nocendland_schema.sql`, alrededor de la línea 960) permite subir a cualquier `nocendland/<carpeta>/<uid>/...`, sin restringir el primer segmento ni la cantidad.

Además, el bucket existe solo en el proyecto remoto: ninguna migración lo crea. Por eso la base local de los tests no lo tiene, y el test de catálogo «Todo bucket tiene file_size_limit» no puede detectar el problema hasta que se versione.

## Criterios de finalización

- Una migración crea o actualiza el bucket `nocendland` de forma idempotente, con `file_size_limit` (p. ej. 2 MB, a decidir según las imágenes reales) y `allowed_mime_types`.
- La política de inserción limita el primer segmento a las carpetas reales (`nutrition_ingredient`, `training_exercise`; `training_share` solo por `service_role`).
- Existe una cuota por usuario (número de objetos o bytes), comprobada en la política de Storage o en un trigger.
- Antes de aplicarlo en remoto se comprueba que ningún objeto existente supera el límite nuevo y que gift-card y Outify no se ven afectados.
- `supabase/tests/` incluye un test de que el bucket existe con límite y de que la cuota se aplica.

## Verificación

- `pnpm run test:security:db` en verde, en local.
- Prueba manual de subida de imagen de ingrediente y de ejercicio.

## Resultado (2026-10-17)

- `supabase/migrations/20261017090000_security_cost_limits.sql` versiona el bucket `nocendland` (privado, 2 MB, PNG/JPEG/WebP), limita la subida a `nutrition_ingredient/` y `training_exercise/` en la carpeta propia, y comprueba la cuota de 200 objetos con `nocendland.storage_object_count()` (una función, porque una política que se consulta a sí misma da recursión infinita).
- `training-share` copia imágenes con `service_role`, así que la importación comprueba la cuota por su cuenta y deja de copiar al alcanzarla.
- Las fotos de ingredientes se reducen con [[Catálogo técnico/compressImage|compressImage]] antes de subir. Además, `IngredientRepository` ya no da por guardada una subida fallida.
- El bucket remoto no tiene WebP entre sus tipos admitidos, así que es probable que hoy fallen las subidas de imágenes de ejercicios recortadas; la migración lo corrige.

## Verificación local

- `pnpm run test:security:db:local`: 133/133. Los tests 7 y 8 del catálogo y los de Storage de `20_limites_coste.test.sql` cubren límite, carpetas y cuota.
- `pnpm test`: 179/179.


## Pendiente de aplicar en remoto

El cambio está en la rama `feat/seguridad-coste-cumplimiento`, sin push. Falta aplicar `supabase/migrations/20261017090000_security_cost_limits.sql` en `devappsdpm-db` y, cuando corresponda, desplegar la función `training-share` y el frontend, con aprobación explícita del usuario. La tarea pasa a `Hecha` cuando el resultado se verifique en remoto.

---
Nombre: Endurecer la función training-share
Estado: Pendiente
Resumen: La Edge Function training-share acepta preview anónimo sin límite de peticiones, permite crear enlaces de compartir sin tope ni caducidad (cada uno copia imágenes al bucket) y devuelve al cliente mensajes de error internos; hay que añadir límites, caducidad y errores genéricos.
Decisiones: ""
Bloqueada: []
Fecha de creación: 2026-10-16T23:23:13+02:00
Última modificación: 2026-10-16T23:23:13+02:00
---

# Endurecer la función training-share

## Contexto

Hallazgos de gravedad baja de la auditoría del 2026-10-16, en `supabase/functions/training-share/index.ts` (desplegada con `verify_jwt = false`):

- **Preview anónimo sin límite:** cada llamada cuesta una invocación, una consulta y N URLs firmadas. Los tokens son de 256 bits y se guardan con hash, así que no se pueden enumerar; el riesgo es de coste.
- **`create` sin tope ni caducidad:** no hay límite de enlaces activos por usuario, cada enlace copia imágenes a `training_share/{shareId}/...` y los no revocados duran para siempre. Va en contra de lo acordado en [[Tareas/Compartir ejercicios y horarios]] («los enlaces no caducan automáticamente»), así que la caducidad hay que decidirla con el usuario.
- **Errores internos al cliente:** el `catch` devuelve `error.message` (incluidos mensajes de RPC y nombres de ejercicios).

## Criterios de finalización

- Límite de peticiones en `preview` (por IP o por token) o una caché que acote el coste.
- Tope de enlaces activos por usuario y, si el usuario lo aprueba, `expires_at` con limpieza de las copias de imágenes caducadas.
- Las respuestas de error usan códigos genéricos; el detalle solo va a los logs.
- Tests del contrato de errores y del tope de enlaces.

## Verificación

- Tests de la función y `pnpm run test:security:db` en verde, en local.
- Prueba manual de crear, previsualizar, importar y revocar un enlace.

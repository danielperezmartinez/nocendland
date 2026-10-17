---
Nombre: Endurecer la función training-share
Estado: En curso
Resumen: La Edge Function training-share acepta preview anónimo sin límite de peticiones, permite crear enlaces de compartir sin tope ni caducidad (cada uno copia imágenes al bucket) y devuelve al cliente mensajes de error internos; hay que añadir límites, caducidad y errores genéricos.
Decisiones: "Los enlaces siguen sin caducar (se mantiene lo acordado en Compartir ejercicios y horarios); se añaden un tope de 20 enlaces activos por usuario y un límite de 60 previsualizaciones por enlace y hora, contadas en nocendland_private. La función devuelve solo códigos públicos y registra el detalle en sus logs."
Bloqueada: []
Fecha de creación: 2026-10-16T23:23:13+02:00
Última modificación: 2026-10-17T09:46:56+02:00
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

## Resultado (2026-10-17)

- `nocendland.register_training_share_preview(text)` (solo `service_role`) cuenta las visitas por ventana de una hora y devuelve `allowed`, `rate_limited` o `not_found`.
- Un trigger rechaza el enlace activo número 21 (`share_limit_reached`); los revocados no cuentan.
- `supabase/functions/training-share/index.ts` responde `{code}` con estados 400/401/404/409/429 y un genérico `training_share_failed` con estado 500; ya no devuelve mensajes de Postgres ni nombres de ejercicios.
- El cliente lee el código (`TrainingShareError`) y muestra mensajes concretos en Ejercicios, Horario y la previsualización.

## Verificación local

- `pnpm run test:security:db:local`: 133/133.
- Función servida con `supabase functions serve` en la pila local: previsualización válida 200, inexistente 404, 60 previsualizaciones permitidas y la 61.ª con 429, acción sin sesión 401, `create` válido 200, enlace 21 con 409 y ejercicio ajeno con 400 genérico.
- `pnpm test`: 179/179 (incluye `share.repository.spec.ts`).


## Pendiente de aplicar en remoto

El cambio está en la rama `feat/seguridad-coste-cumplimiento`, sin push. Falta aplicar `supabase/migrations/20261017090000_security_cost_limits.sql` en `devappsdpm-db` y, cuando corresponda, desplegar la función `training-share` y el frontend, con aprobación explícita del usuario. La tarea pasa a `Hecha` cuando el resultado se verifique en remoto.

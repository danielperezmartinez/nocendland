---
Nombre: Compartir ejercicios y horarios
Estado: Hecha
Resumen: Incorporar un catálogo de horarios nombrados y permitir compartir e importar ejercicios y horarios autocontenidos mediante enlaces públicos revocables.
Decisiones: Los horarios compartidos incluirán sus ejercicios; cada usuario tendrá varios horarios y uno activo persistente; los enlaces serán instantáneas públicas revocables; las imágenes viajarán con la instantánea; los conflictos se resolverán mediante identificadores portátiles, nunca solo por nombre.
Bloqueada: []
Fecha de creación: 2026-08-08T11:12:50
Última modificación: 2026-08-08T11:42:00
---

# Compartir ejercicios y horarios

## Objetivo

Permitir que los usuarios mantengan varios horarios semanales y compartan ejercicios u horarios completos mediante enlaces seguros que puedan previsualizarse públicamente e importarse tras iniciar sesión.

## Criterios de finalización

- Cada usuario dispone de un catálogo de horarios nombrados y exactamente uno activo.
- Los horarios existentes migran a «Horario 1» sin perder contenido.
- Seguimiento utiliza únicamente el horario activo.
- Los paquetes de horario incluyen todos los ejercicios referenciados y no contienen identificadores internos ni datos del propietario.
- Los enlaces son instantáneas no enumerables, revocables y compatibles con imágenes privadas.
- La importación detecta procedencia, remapea ejercicios y pregunta si debe activar el horario importado.
- Migración, RLS, experiencia responsive, pruebas y build quedan verificados.

## Alcance acordado

- Se comparte un horario por enlace; Ejercicios admite selección múltiple.
- Los enlaces no caducan automáticamente y no cambian al editar el contenido original.
- Seguimiento, medidas e historial no forman parte de la exportación.

## Resultado

- Se añadió el catálogo de horarios con migración de los datos existentes, creación atómica del horario inicial e invariante diferida que exige conservar un horario activo.
- `TrainingStore` separa el horario seleccionado del activo; Horario permite crear, renombrar, duplicar, activar, eliminar y compartir, mientras Seguimiento consume exclusivamente el activo.
- Se implementó `training-share/v1`, la Edge Function pública con autenticación propia para las operaciones protegidas, tokens almacenados mediante hash, instantáneas de imágenes y revocación.
- La importación es atómica para los datos, remapea IDs internos, resuelve conflictos por `portable_id`, avisa por nombres coincidentes y deja la activación como elección explícita.
- La ruta pública conserva un `returnUrl` interno validado durante OAuth y no muestra datos del autor.

## Verificación

- Migraciones `20260808093011` y `20260808093947` aplicadas al proyecto Supabase y tipos regenerados.
- Prueba transaccional de importación autocontenida, remapeo y horario inactivo superada; los datos sintéticos fueron revertidos/eliminados.
- Invariante de horario activo probada dentro de una transacción y advisors de claves foráneas nuevos resueltos.
- Vista pública, importación autenticada, catálogo y responsive a 390 px verificados en navegador sin errores de consola ni desbordamiento horizontal.
- `pnpm test -- --watch=false`: 39 pruebas correctas.
- `pnpm build`: correcto; permanecen avisos no bloqueantes de presupuesto del bundle global y estilos de las dos vistas nuevas.

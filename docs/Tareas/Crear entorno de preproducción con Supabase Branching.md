---
Nombre: Crear entorno de preproducción con Supabase Branching
Estado: Pendiente
Resumen: Crear en el futuro un entorno persistente de preproducción que empareje la rama staging de Vercel con una rama aislada de Supabase, cuando se contrate un plan compatible con Branching.
Decisiones: Se prefiere Supabase Branching frente a mantener manualmente dos proyectos; staging no copiará ni fusionará datos reales y se poblará con datos de prueba reproducibles; la tarea se aplaza mientras Branching requiera un plan de pago.
Bloqueada: []
Fecha de creación: 2026-08-14T19:30:04
Última modificación: 2026-08-14T19:30:04
---

# Crear entorno de preproducción con Supabase Branching

## Objetivo

Disponer de un entorno estable de preproducción en el que se puedan validar conjuntamente el frontend Angular, la base de datos, Auth, Storage y las Edge Functions antes de desplegar los mismos cambios en producción.

El flujo objetivo empareja los entornos por rama:

```text
Git/Vercel staging → Supabase staging persistente → pruebas
Git/Vercel main    → Supabase main de producción     → usuarios reales
```

## Motivo del aplazamiento

A fecha de creación de esta tarea, Supabase Branching no está incluido en el plan Free y requiere al menos el plan Pro. El plan Pro parte de 25 USD al mes y el cómputo de las ramas se factura adicionalmente por uso; las horas de Branching Compute no están cubiertas por el Spend Cap.

Antes de iniciar la tarea se deberá revisar de nuevo la disponibilidad, el precio vigente y el coste estimado de mantener una rama persistente de staging. Estas cifras son contexto temporal, no una regla permanente del proyecto.

## Decisiones acordadas

- Utilizar una rama persistente de Supabase para staging en lugar de mantener cambios de esquema manualmente en dos proyectos independientes.
- Mantener `main` como rama productiva y crear una rama Git persistente `staging` para integrar y validar desarrollos antes de promoverlos.
- Tratar las migraciones versionadas en `supabase/migrations` como fuente de verdad del esquema y aplicarlas primero en staging y después en producción.
- No copiar ni fusionar datos reales de producción hacia staging. Los usuarios, registros, archivos y sesiones de prueba permanecerán aislados.
- Poblar staging mediante datos semilla reproducibles y no sensibles.
- Conservar credenciales, secretos, callbacks OAuth y configuración externa separados por entorno.

## Preparación necesaria

El repositorio contiene actualmente migraciones recientes, pero antes de habilitar Branching se debe confirmar que `supabase/migrations` representa el esquema remoto completo y que su historial coincide con el del proyecto productivo. Supabase Branching crea los entornos desde las migraciones disponibles y una historia incompleta puede producir una rama vacía o parcial.

Se deberá:

1. Auditar el esquema y el historial de migraciones del Supabase productivo.
2. Capturar y versionar una migración base completa cuando falten objetos existentes.
3. Verificar que un entorno Supabase limpio puede reconstruirse exclusivamente con las migraciones del repositorio.
4. Definir semillas idempotentes con usuarios y datos ficticios suficientes para probar Nutrición y Entrenamiento sin exponer información real.
5. Revisar RLS, funciones, buckets y políticas de Storage en el entorno reconstruido.

## Implementación prevista

1. Contratar o habilitar un plan de Supabase compatible con Branching después de revisar el coste vigente.
2. Conectar el repositorio mediante la integración de GitHub de Supabase y habilitar Branching.
3. Crear una rama persistente `staging` y asociarla con la rama Git homónima.
4. Crear la rama Git `staging` y asignarle un dominio estable de preproducción en Vercel.
5. Sustituir las credenciales de Supabase fijadas en los archivos Angular por configuración de build procedente de variables de entorno de Vercel.
6. Configurar Vercel Production para usar Supabase `main` y Vercel Preview/staging para usar las credenciales de la rama Supabase correspondiente.
7. Autorizar por separado los dominios y callbacks OAuth locales, de staging y de producción.
8. Configurar secretos y desplegar la Edge Function `training-share` en ambos entornos sin exponer claves privilegiadas al frontend.
9. Probar el flujo completo en staging: autenticación, base de datos, RLS, Storage, Edge Functions y PWA.
10. Documentar el procedimiento de promoción `feature/*` → `staging` → `main`, incluida la verificación de los deployments de Vercel.

## Criterios de finalización

- Los pushes a `staging` despliegan un frontend estable que utiliza exclusivamente la rama Supabase de staging.
- Los pushes a `main` continúan desplegando producción y utilizan exclusivamente Supabase de producción.
- El esquema de staging se reconstruye y actualiza mediante migraciones versionadas, sin cambios manuales divergentes.
- Los datos, usuarios, sesiones, archivos y secretos de ambos entornos están aislados.
- Las migraciones se validan en staging antes de aplicarse a producción.
- Auth, RLS, Storage y `training-share` se han probado de extremo a extremo en staging.
- El coste y las alertas de consumo de la rama persistente están revisados y documentados.
- El flujo de promoción y recuperación ante un despliegue fallido está documentado.

## Referencias

- [Deployment & Branching](https://supabase.com/docs/guides/deployment)
- [Supabase Branching](https://supabase.com/docs/guides/deployment/branching)
- [Uso y coste de Branching](https://supabase.com/docs/guides/platform/manage-your-usage/branching)
- [Integración de Branching con Vercel](https://supabase.com/docs/guides/deployment/branching/integrations)

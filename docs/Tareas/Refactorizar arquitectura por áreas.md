---
Nombre: Refactorizar arquitectura por áreas
Estado: Hecha
Resumen: Nocendland está reorganizado como monolito modular por áreas y features; Llimbro contiene Nutrición y Entrenamiento con rutas standalone y límites explícitos.
Decisiones: Se adoptó un monolito modular por áreas y features, con shell, platform y shared; las páginas usan una fachada Signal de feature y se conservan redirects desde las rutas antiguas.
Bloqueada: []
Fecha de creación: 2026-08-06T18:15:27
Última modificación: 2026-08-06T19:19:09
---

# Refactorizar arquitectura por áreas

## Objetivo

Hacer que la estructura real del código exprese la jerarquía de producto y permita añadir áreas como Finanzas sin que dependan de Llimbro ni de los modelos de Alimentación.

## Arquitectura propuesta

```text
app/
├── app.config.ts
├── app.routes.ts
├── shell/
│   ├── layout/
│   └── navigation/
├── platform/
│   ├── auth/
│   └── supabase/
├── shared/
│   ├── ui/
│   └── utilities/
└── areas/
    ├── llimbro/
    │   ├── llimbro.routes.ts
    │   ├── nutrition/
    │   │   ├── nutrition.routes.ts
    │   │   ├── data-access/
    │   │   ├── state/
    │   │   ├── ingredients/
    │   │   ├── intakes/
    │   │   └── objectives/
    │   └── training/
    └── finances/
```

La estructura y la taxonomía han sido aprobadas. La estructura representa:

- `shell`: marco global de la aplicación y navegación.
- `platform`: integraciones técnicas compartidas, sin conocimiento de los dominios.
- `shared`: piezas realmente reutilizables y sin reglas de negocio.
- `areas`: dominios de alto nivel aislados entre sí.

## Reglas de dependencia propuestas

- Un área no importa código interno de otra área.
- `platform` no conoce modelos de Llimbro, Alimentación ni Finanzas.
- `shared` no accede a Supabase ni contiene reglas de negocio.
- El acceso a datos específico de Nutrición vive dentro de Nutrición; solo el cliente genérico de Supabase es infraestructura global.
- Las páginas orquestan casos de uso mediante stores o fachadas; no llaman simultáneamente a un store y a varios servicios API.
- El estado escribible se mantiene privado y se expone como Signals de solo lectura.
- Los providers de una feature se limitan a su ruta cuando no deban vivir durante toda la aplicación.

## Migración propuesta

1. Definir rutas standalone y la jerarquía `/llimbro/nutrition/...`, conservando redirects temporales desde `/nutrition/...`.
2. Crear los límites `shell`, `platform`, `shared` y `areas` sin cambiar comportamiento.
3. Mover tipos y acceso a datos de Nutrición dentro de su feature.
4. Dividir el estado global de `NutritionService` por responsabilidades y alcance de ruta.
5. Reemplazar la navegación basada en búsquedas de URL por rutas, metadata y enlaces tipados.
6. Eliminar `NgModule`, rutas comentadas, servicios duplicados y código muerto.
7. Verificar cada migración como una porción vertical antes de continuar.

## Criterios de finalización

- La jerarquía de producto se refleja en rutas y carpetas.
- Llimbro puede contener Alimentación y Entrenamiento sin dependencias circulares.
- Se puede añadir Finanzas como área aislada.
- Cada feature posee su estado, modelos y acceso a datos específicos.
- No quedan `NgModule` sin una necesidad demostrable ni capas globales que conozcan dominios concretos.
- La aplicación continúa zoneless, basada en Signals y con su comportamiento cubierto por pruebas.

## Resultado

- Se sustituyeron los `NgModule` por rutas standalone y lazy loading por página.
- Se creó la jerarquía `/llimbro/nutrition/...` y `/llimbro/training/...`, manteniendo redirects desde `/nutrition/...`.
- Autenticación y cliente Supabase quedaron en `platform`; las consultas específicas se movieron a Nutrición.
- `NutritionStore` quedó limitado a la ruta de la feature y actúa como fachada Signal entre páginas y repositorios.
- La shell, la navegación, las utilidades compartidas y las features quedaron separadas por aliases y responsabilidades.
- Se retiraron servicios duplicados, el servicio global de conveniencia, rutas comentadas y componentes sin uso.
- La compilación de producción y las pruebas unitarias verifican el resultado.

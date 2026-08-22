# Memoria del proyecto

Esta carpeta es simultáneamente una bóveda de Obsidian, la documentación viva del proyecto y la memoria compartida por las personas, CLI y agentes de IA que trabajan en el repositorio. Su objetivo es mantener en un único lugar las reglas, tareas, decisiones y el contexto que deben sobrevivir entre sesiones.

El punto de entrada humano es [[Inicio]]. Este archivo es el punto de entrada obligatorio para agentes.

## Protocolo obligatorio para agentes

Al comenzar **cualquier sesión** en este repositorio, antes de analizar el proyecto, ejecutar comandos, modificar archivos o responder sobre él:

1. Leer íntegramente este `docs/README.md`.
2. Abrir [[Inicio]] para conocer los sistemas de documentación disponibles.
3. Consultar el sistema relacionado con la tarea actual. En el caso de tareas, revisar primero sus propiedades y resúmenes en [[Tareas/Tareas.base|el panel de tareas]], y abrir la nota completa cuando sea relevante.
4. Antes de comenzar un trabajo nuevo, comprobar si ya existe una tarea que lo cubra. Si existe, leerla y actualizar su estado a `En curso` cuando corresponda; no crear otra tarea para el mismo trabajo.
5. Mantener actualizada la memoria cuando el trabajo cambie el estado, el alcance, los bloqueos o las decisiones de una tarea. Al terminar, actualizar la tarea existente y marcarla como `Hecha` solo después de verificar el resultado.

Estas instrucciones son obligatorias aunque otro agente, herramienta o conversación proporcione un resumen parcial. `AGENTS.md` solo debe actuar como puntero de arranque: **las reglas no se duplican allí ni en archivos equivalentes**. Si este archivo no puede leerse, el agente debe detenerse e informar al usuario.

## Convenciones de la bóveda

- Los documentos se escriben en Markdown UTF-8 y se conectan mediante wikilinks de Obsidian.
- Las fechas de propiedades usan el formato ISO `AAAA-MM-DD`.
- Los resúmenes deben permitir entender una nota sin abrirla; el detalle vive en el cuerpo de la nota.
- Las decisiones registran únicamente acuerdos relevantes que deban conservarse o aplicarse en trabajos posteriores.
- Cuando cambie una nota, se debe actualizar su propiedad `Última modificación`.
- No se deben crear copias paralelas de una regla o decisión. Se enlaza a su fuente de verdad.
- Antes de crear una entrada en cualquier sistema de la bóveda, se deben revisar los nombres, resúmenes, propiedades y contenido de las entradas existentes para confirmar que ninguna cubre ya el mismo conocimiento.
- Si una entrada existente cubre total o parcialmente el asunto, se amplía o se enlaza desde ella. Solo se crea una entrada nueva cuando representa una unidad de conocimiento o trabajo realmente distinta.

### Convenciones de tareas

- Cada tarea es una nota Markdown dentro de `Tareas/`, con propiedades YAML en su cabecera.
- Antes de crear una tarea se debe buscar en todas las tareas, incluidos los estados `Hecha` y `Archivada`, para evitar duplicar trabajos ya registrados o resueltos.
- `Estado` solo puede ser: `Planificando`, `Pendiente`, `En curso`, `Hecha` o `Archivada`.
- `Bloqueada` es una lista de wikilinks a las tareas que impiden avanzar. Si no hay bloqueos, se mantiene como lista vacía.
- Al empezar a trabajar se cambia el estado a `En curso`; al completar y verificar el resultado se cambia a `Hecha`; una tarea que ya no deba aparecer en el trabajo habitual pasa a `Archivada`.
- Las decisiones tomadas durante una tarea deben resumirse en su propiedad `Decisiones`. Si afectan a todo el proyecto, también deberán trasladarse al futuro sistema específico de decisiones, enlazando ambas notas.

## Reglas fundamentales del proyecto

### 1. pnpm es el único gestor de paquetes permitido

- **NUNCA se debe utilizar `npm` ni `npx`, bajo ninguna circunstancia.**
- **SIEMPRE se debe utilizar `pnpm`** para instalar, eliminar o actualizar dependencias, ejecutar scripts, invocar binarios y gestionar el workspace.
- Los comandos y ejemplos escritos en código, documentación, comentarios, CI o respuestas al usuario deben usar exclusivamente `pnpm` o `pnpm exec`.
- No se debe ejecutar ningún comando que genere o actualice `package-lock.json`.
- Si `pnpm` no está instalado, no funciona o no permite completar una operación, hay que detenerse e informar al usuario. **Está prohibido recurrir a `npm` o `npx` como alternativa.**
- Antes de modificar dependencias o la configuración del gestor de paquetes, se debe respetar la política definida en `pnpm-workspace.yaml`.
- Las versiones nuevas permanecen en cuarentena durante 7 días mediante `minimumReleaseAge`. Una excepción solo puede añadirse para una versión exacta, después de revisar el motivo y con autorización del usuario; nunca se debe excluir un paquete completo o un scope completo por comodidad.
- Los scripts de instalación de dependencias están denegados por defecto. Solo pueden ejecutarlos versiones exactas incluidas con valor `true` en `allowBuilds`, después de revisar el paquete y justificar por qué necesita construir durante la instalación.
- **NUNCA** se debe activar `dangerouslyAllowAllBuilds`, desactivar `strictDepBuilds`, usar `ignoreScripts` como sustituto de la allowlist, ni relajar `blockExoticSubdeps`, `trustPolicy`, `verifyStoreIntegrity` o `strictStorePkgContentCheck` sin autorización expresa del usuario.
- Después de cambiar dependencias se deben ejecutar `pnpm ignored-builds` y `pnpm audit --audit-level high`. No se deben aplicar correcciones automáticas de auditoría sin revisar primero los cambios propuestos.
- `pnpm dlx`, `pnpm create` y la ejecución efímera de paquetes quedan prohibidos salvo autorización expresa y una versión exacta previamente revisada; esos comandos ejecutan código fuera del grafo fijado por `pnpm-lock.yaml`.
- En CI y despliegues se debe instalar siempre con `pnpm install --frozen-lockfile`.

### 2. Angular debe ser zoneless y utilizar Signals

- La aplicación debe funcionar **sin Zone.js**. Todo código nuevo o modificado debe ser compatible con Angular zoneless y no puede depender de Zone.js, `NgZone` ni de ciclos de detección de cambios provocados implícitamente por Zone.js.
- **Signals son el mecanismo obligatorio para gestionar estado reactivo.** No se debe introducir estado reactivo nuevo basado en `BehaviorSubject`, `Subject`, stores externos o patrones que dependan de detección de cambios global.
- Se debe utilizar:
  - `signal()` para estado escribible.
  - `computed()` para estado derivado.
  - `linkedSignal()` cuando un estado escribible dependa de otro y necesite reiniciarse o reconciliarse.
  - `effect()` únicamente para efectos secundarios; no para propagar o duplicar estado que pueda expresarse mediante `computed()`.
- En servicios, los `WritableSignal` deben mantenerse privados siempre que sea posible y exponerse públicamente mediante `asReadonly()`.
- Las actualizaciones de colecciones y objetos almacenados en Signals deben ser inmutables, usando `set()` o `update()`; no se debe mutar silenciosamente el valor actual.
- RxJS solo debe utilizarse cuando el problema sea realmente un flujo de eventos o una API basada en Observables. En los límites con RxJS se deben usar las utilidades oficiales de interoperabilidad, como `toSignal()` y `toObservable()`, manteniendo Signals como representación principal del estado de la aplicación.
- Toda modificación de componentes, servicios, formularios, navegación o acceso a datos debe revisarse expresamente para asegurar que conserva el funcionamiento zoneless y actualiza la interfaz mediante Signals.

### 3. Todo push debe incrementar la versión y todo deploy debe verificarse

- **Antes de cada `git push` se debe incrementar obligatoriamente la versión de `package.json`. No se puede hacer push si la versión no ha cambiado desde el último push.**
- El incremento debe seguir Semantic Versioning y elegirse según el alcance real del cambio:
  - `patch` para correcciones, mantenimiento, refactors compatibles y cambios internos sin nuevas capacidades públicas.
  - `minor` para funcionalidades nuevas compatibles con versiones anteriores.
  - `major` para cambios incompatibles, eliminaciones o migraciones que requieran adaptación.
- **Un incremento `major` requiere siempre autorización previa y explícita del usuario.** Antes de ejecutar el comando, el agente debe explicar qué incompatibilidades justifican el `major` y qué impacto tendrá. Una petición genérica de commit, push o despliegue no cuenta como autorización para un `major`.
- Se debe utilizar exclusivamente `pnpm version patch|minor|major --no-git-tag-version`; siguen prohibidos `npm version` y cualquier uso de npm.
- El cambio de versión debe incluirse en el mismo commit o conjunto de commits que se va a desplegar y verificarse antes del push.
- Si un push anterior falló antes de llegar al remoto y no generó despliegue, no es necesario volver a incrementar la versión para reintentar exactamente el mismo conjunto de commits.
- Cuando el usuario pida «desplegar», «hacer deploy» o una formulación equivalente, está solicitando el flujo completo de publicación: elegir y aplicar el incremento SemVer correspondiente, crear un `git commit` con los cambios previstos y ejecutar `git push` directamente al remoto y rama actuales. No se crea una rama ni una pull request salvo que el usuario lo solicite expresamente, y GitHub CLI no es un requisito cuando el remoto Git ya está configurado y autenticado.
- Cada agente o sesión solo puede incluir en su commit los archivos y cambios que haya realizado dentro de su propio alcance. La existencia de otras modificaciones sin commit en el mismo workspace no autoriza a incorporarlas: pertenecen a sus sesiones responsables y deben conservarse para commits separados.
- Antes de crear el commit se deben preparar rutas explícitas y revisar el diff staged. No se permiten comandos de staging indiscriminado como `git add .`, `git add -A` o equivalentes en un workspace compartido. Si un mismo archivo contiene cambios mezclados de varias sesiones, se preparan únicamente los hunks propios; si no es posible atribuirlos con seguridad, se detiene el commit y se informa del conflicto.
- El mensaje del commit debe describir de forma concreta y apropiada los cambios de esa sesión; no se utilizan mensajes genéricos que oculten o amplíen el alcance real.
- Un `git push` correcto no completa por sí solo una petición de despliegue. Después del push se debe localizar en Vercel el deployment asociado al commit publicado y supervisarlo hasta que alcance un estado terminal.
- El despliegue solo se considera completado correctamente cuando Vercel informa el estado `READY`. Si termina en `ERROR`, se deben inspeccionar sus detalles o logs, informar de la causa y continuar con la corrección cuando esté dentro del alcance autorizado; cada nuevo push correctivo vuelve a estar sujeto al incremento de versión. Si no existe acceso para consultar Vercel, se debe comunicar el bloqueo y no asumir que el despliegue ha terminado correctamente.

### 4. Código en inglés y comentarios en español

- **Todo el código fuente debe escribirse en inglés:** nombres de carpetas y archivos, clases, interfaces, tipos, funciones, métodos, variables, propiedades, constantes, rutas internas y cualquier identificador técnico nuevo o modificado.
- Los nombres visibles para el usuario pueden estar en español cuando formen parte de la interfaz o del contenido del producto.
- La documentación de esta bóveda y los comentarios de código, incluidos JSDoc y explicaciones técnicas dentro del código, deben escribirse en español.
- Al modificar código heredado con nombres en otro idioma o erratas, se debe valorar corregirlo dentro del alcance del cambio, manteniendo compatibilidad cuando sea necesario.
- No se deben introducir abreviaturas opacas ni mezclar inglés y español en un mismo identificador.

### 5. Todo cambio de código debe evaluar sus tests

- Cada vez que se genere o modifique código se debe revisar expresamente si el comportamiento afectado necesita pruebas nuevas o la actualización de pruebas existentes.
- Se deben añadir o actualizar tests cuando el cambio introduzca lógica, corrija un defecto, altere un contrato, modifique estados o interacciones, o cubra un caso de regresión relevante.
- No se deben crear pruebas sin valor que se limiten a repetir detalles internos de implementación. Si no conviene añadir tests, la decisión debe poder justificarse por el alcance del cambio y por la cobertura existente.
- La evaluación de tests forma parte del trabajo y debe realizarse antes de considerar el cambio verificado o completado.

## Propósito del proyecto

Nocendland es una aplicación personal orientada a monitorizar y ayudar al usuario en diferentes aspectos de su vida. El primer ámbito desarrollado es **Llimbro**, nombre jocoso derivado de «gym bro», que agrupa capacidades relacionadas con salud y entrenamiento. La aplicación incorpora además **Miscelánea**, destinada a utilidades que aún no justifican un dominio propio, y **Finanzas**, destinada a la economía personal; ambas permanecen inicialmente como áreas en desarrollo sin features definidas.

## Arquitectura objetivo

Nocendland utiliza un **monolito modular frontend orientado a áreas y features**. Se mantiene una sola aplicación Angular; los límites modulares se expresan mediante rutas, carpetas, providers y reglas de dependencia, no mediante microfrontends ni `NgModule`.

### Taxonomía funcional

- **Aplicación:** Nocendland.
- **Área:** aspecto vital de alto nivel y límite de dominio, como Llimbro o Finanzas.
- **Feature:** capacidad cohesiva dentro de un área, como Alimentación o Entrenamiento.
- **Caso de uso o página:** operación concreta dentro de una feature, como Ingestas, Alimentos u Objetivos.

### Estructura

```text
src/app/
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
    ├── miscellaneous/
    └── finances/
```

### Responsabilidades

- `shell` contiene el marco global de la aplicación: layout, navegación principal y composición de las áreas.
- `platform` contiene integraciones técnicas compartidas, como autenticación y el cliente de Supabase. No contiene reglas ni modelos de un área concreta.
- `shared` contiene primitivas de interfaz y utilidades realmente reutilizables. No accede a Supabase ni conoce reglas de negocio.
- `areas` contiene los dominios de alto nivel. Cada área posee sus features y no importa implementaciones internas de otras áreas.
- Cada feature posee sus rutas, modelos, acceso a datos, estado y casos de uso específicos.

### Implementación Angular

- La aplicación usa Angular 22 con componentes standalone; no se crean `NgModule` para organizar features.
- `app.routes.ts` compone las áreas y cada archivo `*.routes.ts` define el límite lazy de su área o feature.
- `provideZonelessChangeDetection()` activa la detección de cambios zoneless en la raíz.
- Los stores basados en Signals son la fuente principal de estado de interfaz. Las páginas expresan intención mediante sus métodos y no escriben directamente en Signals ni repositorios.
- Los aliases de TypeScript (`@areas`, `@platform`, `@shared`, `@shell`, entre otros) expresan la capa propietaria y evitan imports relativos que atraviesen límites.
- La navegación entre páginas primarias de una feature pertenece a su layout de ruta. Se configura con primitivas tipadas de `shared/ui`; la shell no conoce ni replica las rutas hijas de cada feature.

### Datos y estado

- Supabase es el backend administrado para base de datos, autenticación y almacenamiento de imágenes.
- `platform/supabase` crea un único cliente tipado y ofrece únicamente capacidades técnicas genéricas.
- Las consultas de un dominio viven en los repositorios de `data-access` de su feature. Actualmente Nutrición contiene repositorios de alimentos, ingestas, objetivos y totales.
- `NutritionStore`, proporcionado en el límite de ruta de Nutrición, actúa como fachada: conserva el estado Signal, coordina repositorios y expone operaciones de negocio a las páginas.
- Los tipos generados de la base de datos viven en `platform/supabase/database.types.ts`. Se regeneran con `pnpm run generate-types`; no se corrigen manualmente nombres heredados del esquema remoto.

### Autenticación

- `AuthService` encapsula Supabase Auth y expone el perfil autenticado como Signal de solo lectura.
- El acceso a la shell está protegido por un guard que valida el usuario con Supabase y devuelve un `UrlTree` hacia `/auth` cuando no existe sesión válida.
- El inicio de sesión OAuth admite GitHub y Google. La URL de callback se construye con `location.origin`, de modo que el mismo código funciona en local y producción.
- Supabase debe mantener autorizadas tanto la URL local de callback como las URLs desplegadas en Vercel. Esta allowlist es configuración externa y no debe sustituirse por URLs de producción fijadas en el código.
- El callback intercambia el código PKCE por una sesión, vuelve a validar el usuario y solo entonces permite entrar en la aplicación.

### Despliegue

- Vercel es la plataforma de despliegue del frontend. `vercel.json` declara Angular, instala con `corepack pnpm install --frozen-lockfile` y construye con `corepack pnpm run build`.
- Los pushes al repositorio enlazado disparan el despliegue desde Vercel. Antes de cualquier push se aplica obligatoriamente la regla de incremento de versión definida arriba.
- La configuración antigua de Railway y Nixpacks se eliminó; no debe reintroducirse salvo una decisión explícita futura.
- Supabase continúa siendo un servicio externo a Vercel: no se despliega ni se replica como parte del frontend.

### Reglas de dependencia

- Un área no puede importar código interno de otra área.
- `platform` no puede conocer modelos de Llimbro, Alimentación, Entrenamiento o Finanzas.
- `shared` no puede acceder a Supabase ni contener reglas de negocio.
- El cliente genérico de Supabase vive en `platform/supabase`; las consultas específicas viven en `data-access` de la feature propietaria.
- Las páginas consumen stores o fachadas de su feature y no coordinan simultáneamente varios repositorios o servicios API.
- El estado global debe reducirse al mínimo. El estado específico se proporciona en el límite de ruta de su área o feature cuando no necesite sobrevivir fuera de ella.
- Los Signals escribibles de servicios y stores son privados; se exponen Signals de solo lectura y métodos con intención de negocio.
- Las rutas de áreas y features se cargan de forma diferida. La shell y la página inicial pueden cargarse de forma inmediata.

### Rutas

La jerarquía de URL refleja la jerarquía funcional:

```text
/llimbro/nutrition/ingredients
/llimbro/nutrition/intakes
/llimbro/nutrition/objectives
/llimbro/training/...
/miscellaneous
/finances/...
```

Cuando se sustituya una ruta publicada, se mantendrá un redirect temporal desde la ruta anterior para proteger enlaces guardados y clientes PWA desactualizados.

### Criterios para evolucionar la arquitectura

- Se priorizan porciones verticales y cambios verificables frente a migraciones masivas sin puntos de control.
- No se introducen capas, abstracciones, stores genéricos o sistemas de plugins sin un caso de uso real.
- Antes de crear una utilidad, componente, servicio o API se debe buscar una implementación existente que pueda reutilizarse o ampliarse sin forzar responsabilidades ajenas.
- La reutilización no justifica componentes genéricos basados en `any`, rutas de propiedades como texto o configuraciones difíciles de entender. Se prefiere duplicación mínima y explícita antes que una abstracción incorrecta; cuando el patrón sea estable, se extrae una pieza tipada y cohesionada.

### Estado actual y siguientes límites

La primera migración estructural ya refleja esta arquitectura: rutas standalone, shell, plataforma, shared y Llimbro dividido en Nutrición y Entrenamiento. Miscelánea y Finanzas existen como límites lazy con páginas temporales hasta que se definan sus primeras features. Miscelánea utiliza una identidad ámbar y terracota, flexible y lúdica; Finanzas utiliza azul petróleo y cian, con una expresión precisa y estructurada. Las URLs antiguas de Nutrición conservan redirects de compatibilidad. El acceso a datos específico ya no vive en servicios globales y las páginas escriben mediante la fachada de Nutrición.

La retirada de componentes Angular Material y la definición del lenguaje visual son un trabajo posterior e independiente. El presupuesto del bundle inicial también continúa como tarea de rendimiento; no se debe mezclar su resolución con cambios arquitectónicos sin medir antes el origen del peso.

## Evolución de la memoria

Esta arquitectura es la dirección aprobada. Durante el refactor, cualquier ajuste necesario debe registrarse como decisión antes de convertirlo en una nueva regla estructural.

Además de Tareas, esta bóveda incorporará sistemas equivalentes para decisiones visuales y de estilos, decisiones de arquitectura y otros conocimientos duraderos. [[Inicio]] seguirá siendo el nexo de navegación entre todos ellos.

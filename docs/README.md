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

## Sistemas disponibles

[[Inicio]] enlaza el punto de entrada de cada sistema. Cada sistema indica la versión instalada de sus instrucciones, que el skill de la bóveda usa para sincronizarlo.

### Tareas

_Versión del sistema: 1._

Notas en [[Tareas/Tareas.base|Tareas/]]. Sus reglas son las de «Convenciones de tareas», arriba.

### Catálogo técnico

_Versión del sistema: 1._

Notas en `Catálogo técnico/`, indexadas por [[Catálogo técnico]], que contiene su uso y su política de evolución. `pnpm run check:technical-catalog` comprueba que el catálogo y las fuentes están sincronizados.

### Seguridad, coste y cumplimiento

_Versión del sistema: 3._

Carpeta [[Seguridad/Seguridad.base|Seguridad/]]: excepciones justificadas a estas reglas, la [[Seguridad/Checklist de lanzamiento|checklist de lanzamiento]] y, como el repo es público, las referencias opacas a hallazgos privados.
Estas reglas aplican a todo cambio, lo haga una persona o un agente, y también a lo que se haga con MCP, CLI o panel.

#### Backend y datos (Supabase)

- **RLS activado no basta.** Cada política expresa quién puede hacer qué sobre qué filas; lo normal es `id_user = (select auth.uid())`.
- Prohibido `USING (true)` o `WITH CHECK (true)` en políticas de `INSERT`, `UPDATE`, `DELETE` o `ALL`. En `SELECT` solo con una excepción escrita en `Seguridad/` y referenciada en la política (`comment on policy … is 'excepcion: <nombre de la nota>'`).
- Los datos compartidos por enlace se sirven con una función RPC que recibe el token y devuelve solo esa fila. La tabla nunca es listable por `anon`.
- Las funciones `SECURITY DEFINER` llevan `set search_path = ''` y nombres cualificados con esquema, y se revoca `EXECUTE` a `anon` (y a `public`) salvo excepción escrita. Si no necesitan saltarse RLS, se usa `SECURITY INVOKER`.
- Las extensiones con efectos fuera de la base de datos (`pg_net`, `http`) quedan fuera del alcance de `anon` y `authenticated`.
- Los esquemas expuestos por la API son los mínimos. Lo interno vive en el esquema no expuesto `nocendland_private`.
- **Todo el DDL** (tablas, políticas, funciones, grants, buckets y sus límites) vive en migraciones versionadas del repo. Nada se hace solo en el panel ni solo por MCP; si se hizo, se vuelca a una migración en el mismo cambio.
- "El Security Advisor no da avisos" **no** cuenta como verificación. La verificación son los tests de `supabase/tests/` (ver "Comprobaciones").

#### Coste y abuso

- Todo lo que un usuario puede crear tiene **tope de tamaño y de cantidad**: buckets con `file_size_limit` y `allowed_mime_types`, cuota por usuario (comprobada en la política de Storage o en un trigger), `CHECK` de longitud en columnas de texto y tope de filas por usuario en tablas que crecen.
- Nada de llamadas recursivas ni bucles sin tope: triggers que llaman a funciones HTTP, funciones que se invocan a sí mismas, reintentos sin límite, efectos del cliente que se disparan en bucle. Todo reintento tiene un máximo y espera entre intentos.
- Los endpoints públicos (funciones serverless, Edge Functions, RPC accesibles a `anon`) tienen límite de peticiones.
- Este proyecto comparte el proyecto Supabase `devappsdpm-db` (plan gratuito: Auth, Storage, Edge Functions, conexiones y cuota del plan) con gift-card (`gift_card`) y Outify (`outify`, `outify_dev`). Agotar Auth, Storage o la cuota del plan aquí deja sin servicio a todas: cualquier límite se diseña pensando en el conjunto.

#### Secretos

- La clave publicable (`anon` / `sb_publishable_…`) puede ir en el cliente.
- La clave secreta (`service_role` / `sb_secret_…`) y cualquier otro secreto solo viven en el servidor o en el CI, nunca en el código del cliente ni en el repo.
- Cada secreto está solo en los entornos que lo necesitan (p. ej. Production y no Preview si las previews no lo usan), marcado como sensible donde la plataforma lo permita.
- Los ficheros de secretos locales (`.env*` salvo `.env.example`, keystores, claves) están en `.gitignore`.

#### Repositorio y publicación

- Todo lo que se sube queda expuesto y **no se puede retirar**: el código, esta bóveda `docs/`, los mensajes de commit, los nombres de rama, los títulos y cuerpos de PR, las issues, los workflows, los logs y artefactos de CI. Borrarlo después no lo quita del historial, de los forks ni de las cachés.
- **Nunca se sube:**
  - Secretos: claves, contraseñas, tokens, ficheros `.env`, keystores.
  - Datos del entorno personal: nombres de host, de máquina o de dispositivo, usuarios del sistema operativo, IP (de red local, VPN o públicas), dominios y redes propios, rutas personales (`C:\Users\<nombre>`, `/home/<nombre>`, unidades y carpetas propias) y correos personales.
  - Vulnerabilidades sin corregir (ver "Vulnerabilidades y hallazgos sensibles").
- En la documentación se usan **marcadores genéricos** (`<usuario>`, `<host-de-pruebas>`, `<ruta-al-proyecto>`). Los valores reales viven fuera del repo: variables de entorno, la memoria local del agente (que no se versiona) o el fichero de patrones personales.
- **Antes de cada commit y de cada push** se revisan el diff y los mensajes. Los hooks versionados en `.githooks/` lo comprueban con gitleaks (patrones genéricos de `.gitleaks.toml` y patrones personales fuera del repo, en `~/.config/gitleaks/personal.toml` o en la ruta de `GITLEAKS_PERSONAL_CONFIG`), y el CI lo repite. `pnpm install` los activa (`core.hooksPath`) mediante el script `prepare`. Los hooks no se saltan (`--no-verify`) sin permiso explícito del usuario. Un falso positivo se resuelve ajustando el patrón o con `gitleaks:allow` en esa línea, nunca desactivando la revisión.
- Los logs de CI no imprimen secretos ni datos personales. Los secretos de CI van en los secretos de la plataforma (GitHub Secrets), y el CI no depende de máquinas, redes ni cuentas personales del usuario.
- **Si algo sensible llega a subirse:** se avisa al usuario **de inmediato**. No se reescribe el historial ni se fuerza un push sin su permiso explícito. Si era un secreto, se da por comprometido y se revoca o se rota, aunque se borre del repo.

#### Vulnerabilidades y hallazgos sensibles

- **Criterio.** Un hallazgo es sensible si describe cómo dañar, espiar o engañar a usuarios de la versión publicada y todavía no hay una versión publicada que lo corrija. Ante la duda, es sensible.
- **Dónde vive.** Cada hallazgo sensible es un **aviso privado de GitHub** (*Security Advisory* en borrador, pestaña *Security* del repo), uno por hallazgo. Es su única fuente de verdad mientras no se publique.
- **Qué nunca lo cuenta** mientras no se publique el arreglo: esta bóveda, los mensajes de commit, los nombres de rama, los títulos y cuerpos de PR, las issues, los comentarios de código y los nombres de test.
- **En la bóveda** solo hay una referencia opaca: una nota `SEC-AAAA-NN` (correlativo por año, no se reutiliza) de tipo `Hallazgo` en `Seguridad/`, con severidad, estado, el ID `GHSA-…` del aviso y la versión que lo corrige. Nunca un título ni una descripción.
- **El arreglo** se prepara en local, con mensajes de commit, nombres de rama y nombres de test neutros que no expliquen el fallo, y se sube junto con la publicación de la versión que lo corrige. Entonces se publica el aviso y la nota pasa a `Publicado`; desde ese momento ya se puede describir.
- **Los agentes no crean, publican ni cierran avisos por su cuenta.** Preparan el borrador del aviso y el usuario lo da de alta, o lo autoriza en esa sesión. Publicar un aviso es irreversible.
- Lo no sensible (endurecimiento, CVE públicos de dependencias) se gestiona con tareas normales.
- Estados de una nota `Hallazgo`: `Abierto` · `Corregido` · `Publicado` · `Descartado`. `Corregido` significa que el arreglo está listo pero aún no publicado: sigue siendo sensible. Al pasar a `Publicado` (arreglo publicado y aviso publicado por el usuario), la nota ya puede enlazar el aviso y describir el fallo.

#### Legal y privacidad (UE / España)

> Estas reglas resumen obligaciones habituales y no son asesoramiento legal. Ante dudas concretas, consulta a un profesional.

- Antes de publicar: **aviso legal** (LSSI-CE, art. 10) y **política de privacidad** (RGPD, art. 13), enlazados desde todas las páginas.
- No se envían datos personales ni la ubicación a terceros (APIs de mapas, de analítica, de IA…) sin avisar antes en la interfaz y sin una acción explícita del usuario que lo dispare. Cada tercero que reciba datos aparece en la política de privacidad.
- Las comunicaciones comerciales (emails, notificaciones push) requieren consentimiento expreso, separado de aceptar los términos, y una forma sencilla de darse de baja.
- El banner de cookies solo es necesario si hay cookies o almacenamiento no técnicos (analítica, publicidad, terceros). Si existe, rechazar es tan fácil como aceptar y nada no técnico se carga antes del consentimiento.

#### Accesibilidad

- Objetivo: **WCAG 2.2 nivel AA**. AXE en el CI sin infracciones; además, revisión manual de teclado y foco en los flujos nuevos (AXE no detecta todo).

#### Comprobaciones y compuerta de "Hecha"

- Comprobaciones del proyecto: `pnpm run test:security:db:local` (pgTAP sobre una base local de Docker construida solo con las migraciones, con puertos propios; tests en `supabase/tests/`), `pnpm run test:a11y:local` (AXE con Playwright en las rutas públicas y en las autenticadas, contra una pila local de Supabase a la que se redirigen todas las peticiones de la app; specs en `e2e/`), `pnpm run check:bundle-secrets` tras `pnpm run build` y gitleaks en `.githooks/` y en el job `fugas`. Todas se ejecutan en `.github/workflows/seguridad.yml` y ninguna contra el proyecto remoto compartido.
- La base local de pruebas retira `pg_net`, que la imagen de Supabase trae con permisos para `anon` y que `devappsdpm-db` no tiene instalado. Por eso ninguna migración puede instalar `pg_net` o `http`: los scripts locales fallan si lo detectan, y hay que revisar sus permisos antes.
- **Una tarea que toque backend o UI no pasa a `Hecha`** hasta que esas comprobaciones estén en verde, y su sección "Verificación" lo deja escrito (qué se ejecutó y dónde). Si el cambio añade tablas, políticas, funciones o rutas, añade también su test en el mismo cambio.
- **Ninguna tarea pasa a `Hecha` con commits sin revisar:** los hooks de gitleaks han pasado en cada commit y push, y el job de fugas del CI está en verde.
- Una excepción a estas reglas es una nota `Excepción` en `Seguridad/` con su justificación. Sin nota, no hay excepción.
- Sus jobs son checks obligatorios para integrar en la rama principal; el flujo de publicación está en la sección [[#Publicación]] y no se repite aquí.

### Publicación

_Versión del sistema: 1._

Esta es la única regla de publicación del proyecto; las demás secciones la enlazan en vez de repetirla. Aplica la política común de publicación de las cuatro webs del usuario, decidida el 2026-10-17.

| Cambio | Cómo se publica | Versión | Despliegue |
| --- | --- | --- | --- |
| **Código**: cualquier archivo fuera de `docs/` | Rama corta y pull request contra `main`, integrada con squash | Sube en la propia PR | Production al integrar en `main`, verificado en Vercel |
| **Solo bóveda**: todo dentro de `docs/` | Commit y push directo a `main` | No cambia | Ninguno: el `ignoreCommand` de `vercel.json` omite la build |

- Un commit o una PR que mezcle bóveda y código cuenta como **código**.
- **Nunca se hace push directo de código a `main`**, aunque GitHub lo permita a administradores (`enforce_admins=false`, para que la bóveda pueda publicarse con la cuenta compartida). `main` exige PR (sin aprobaciones) y los checks `cambios`, `verificar`, `rls`, `a11y` y `fugas`, actualizados con `main`, para integrar; un push directo se desplegaría sin esperarlos. La guarda de `.githooks/pre-push` lo impide en local; no se salta (`--no-verify`) sin permiso explícito del usuario.
- **Integración solo por squash.** El repo tiene desactivados el merge commit, el rebase y el auto-merge, y borra la rama al integrar.
- **Cada PR de código sube la versión** de `package.json` con `pnpm version patch|minor|major --no-git-tag-version` y no se integra si no supera la de `main` (lo comprueba el job `verificar`). El agente propone el incremento según los commits (Conventional Commits: `major` para cambios incompatibles, `minor` para funcionalidades compatibles, `patch` para correcciones, mantenimiento y cambios internos) y **el usuario lo aprueba antes de abrir la PR**, sin inferirlo del silencio; el acuerdo queda en la PR. Un `major` requiere siempre autorización expresa, después de explicar qué incompatibilidades lo justifican. Si la PR recibe más commits antes de integrarse, no se vuelve a subir.
- **Las PR de Dependabot son código:** el agente añade la subida `patch` y la integra con autorización, como cualquier otra.
- **Publicar código** (o «desplegar», «hacer deploy») significa: rama corta (`feat/*`, `fix/*`, `chore/*`, `docs/*`), PR con GitHub CLI contra `main`, esperar los checks, integrarla con squash solo si el usuario lo autorizó para esa PR (si no, detenerse con la PR abierta) y verificar el despliegue.
- **Publicar la bóveda** significa: commit y push directo a `main`, sin PR, sin subir la versión y sin despliegue.
- **Verificar el despliegue**: localizar en Vercel el despliegue de producción del commit exacto de `main` y supervisarlo hasta su estado final; solo `READY` lo da por completado. Ante `ERROR`, revisar sus logs, **avisar al usuario con un reporte y detenerse**: no reintentar, redesplegar ni hacer rollback por iniciativa propia. La corrección es una PR nueva con su propia versión. Sin acceso a Vercel, se comunica el bloqueo y no se da el despliegue por bueno.
- Los commits, incluidos los squash que hace GitHub, usan el correo privado de la forja (`…@users.noreply.github.com`), nunca uno personal. El historial ya publicado no se reescribe.
- Cada agente o sesión solo incluye en su commit lo que hizo dentro de su alcance; otras modificaciones sin commit del workspace pertenecen a sus sesiones. Se preparan rutas explícitas (nunca `git add .` ni `git add -A`) y se revisa el diff staged; si un archivo mezcla cambios de varias sesiones, solo se preparan los hunks propios o se detiene el commit e informa. El mensaje describe de forma concreta el cambio de esa sesión.
- Las migraciones y funciones Edge del backend compartido `devappsdpm-db` (con outify y gift-card) se aplican aparte, con autorización expresa, antes de integrar el código que las necesita. El fichero de migración del repo lleva la misma versión que el historial remoto; si la herramienta asigna otra, se renombra el fichero.
- Una tarea de código no pasa a `Hecha` hasta que su PR está integrada y el despliegue verificado; su sección "Verificación" anota la PR, el commit y el estado del despliegue. Si la PR espera autorización, la tarea sigue `En curso`.
- Configuración: protección de `main` con PR obligatoria sin aprobaciones, checks estrictos, historial lineal, sin exigir resolver conversaciones, sin force push ni borrado y `enforce_admins=false`; en el repo, solo squash, borrado de rama al integrar y auto-merge desactivado; `ignoreCommand` en `vercel.json`; job `cambios` en el CI, del que dependen `verificar`, `rls` y `a11y` (`fugas` corre siempre); guarda en `.githooks/pre-push`. Su estado está en la [[Seguridad/Checklist de lanzamiento|checklist de lanzamiento]].

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

### 3. Publicación

Cómo se publica el código y la bóveda, la versión y la verificación del despliegue están en la sección [[#Publicación]] de «Sistemas disponibles», que es la única fuente de esa regla.

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

Nocendland es una aplicación personal orientada a monitorizar y ayudar al usuario en diferentes aspectos de su vida. El primer ámbito desarrollado es **Llimbro**, nombre jocoso derivado de «gym bro», que agrupa capacidades relacionadas con salud y entrenamiento. La aplicación incorpora además **Miscelánea**, destinada a utilidades que aún no justifican un dominio propio; **Finanzas**, que ya ofrece control financiero personal por periodos; y **Datos**, destinada a reunir registros e información personal. Miscelánea y Datos permanecen inicialmente como áreas en desarrollo sin features definidas.

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
    ├── finances/
    └── data/
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
- El backend productivo activo no es un proyecto Supabase llamado Nocendland: es el proyecto compartido `devappsdpm-db` (`zckqbrwdgxohdymiwbfz`), donde conviven varias aplicaciones separadas por esquemas. La migración y sus comprobaciones están documentadas en [[Tareas/Migrar Nocendland al Supabase compartido devappsdpm-db]].
- Nocendland es propietario exclusivamente del esquema expuesto `nocendland` y del esquema interno no expuesto `nocendland_private`. Las migraciones, consultas, tipos, funciones, privilegios y políticas de esta aplicación deben quedar acotados a esos esquemas y no pueden modificar esquemas de otras aplicaciones, como `gift_card`.
- Auth, Storage, Edge Functions, secretos, cuotas, conexiones y configuraciones de proyecto son recursos compartidos entre las aplicaciones de `devappsdpm-db`; cualquier cambio sobre ellos exige comprobar su impacto global. El proyecto Supabase antiguo llamado `nocendland` es legado y no es el backend activo del frontend.
- `platform/supabase` crea un único cliente tipado y ofrece únicamente capacidades técnicas genéricas.
- Las consultas de un dominio viven en los repositorios de `data-access` de su feature. Actualmente Nutrición contiene repositorios de alimentos, ingestas, objetivos y totales; Finanzas contiene repositorios de configuración, categorías, periodos, presupuestos, movimientos, recurrentes y objetivos.
- `NutritionStore` y `FinanceStore`, proporcionados en los límites de ruta de sus respectivas features, actúan como fachadas: conservan el estado Signal, coordinan repositorios y exponen operaciones de negocio a las páginas.
- Los tipos generados de la base de datos viven en `platform/supabase/database.types.ts`. Se regeneran con `pnpm run generate-types`; no se corrigen manualmente nombres heredados del esquema remoto.

### Autenticación

- `AuthService` encapsula Supabase Auth y expone el perfil autenticado como Signal de solo lectura.
- El acceso a la shell está protegido por un guard que valida el usuario con Supabase y devuelve un `UrlTree` hacia `/auth` cuando no existe sesión válida.
- Cada navegación protegida realiza una validación remota con `getUser()`; los guards de sus rutas anidadas comparten el resultado mediante el identificador de navegación del Router. No se reutiliza la autenticación entre navegaciones. El perfil del mismo usuario se conserva en memoria y se invalida al cerrar o cambiar de sesión, recibir `USER_UPDATED` o fallar la validación; las respuestas antiguas no pueden restaurarlo. Las políticas RLS siguen autorizando el acceso a datos en Supabase.
- Antes de la primera validación se espera `INITIAL_SESSION` para completar la recuperación de la sesión persistida por el SDK. El `SIGNED_IN` de esa restauración no se trata como cambio de cuenta. La sesión recuperada no autoriza por sí sola el acceso: después se valida con `getUser()` y, cuando corresponde, se carga el perfil. Se conservan la persistencia y renovación automática de Supabase para reabrir o actualizar la PWA sin repetir OAuth mientras la sesión siga siendo válida.
- El inicio de sesión OAuth admite GitHub y Google. La URL de callback se construye con `location.origin`, de modo que el mismo código funciona en local y producción.
- Supabase debe mantener autorizadas tanto la URL local de callback como las URLs desplegadas en Vercel. Esta allowlist es configuración externa y no debe sustituirse por URLs de producción fijadas en el código.
- El callback intercambia el código PKCE por una sesión, vuelve a validar el usuario y solo entonces permite entrar en la aplicación.
- El cliente configura `flowType: 'pkce'` y `detectSessionInUrl: false`; el callback es el único responsable del intercambio y espera la restauración inicial del SDK. Un código rechazado no permite reutilizar una sesión antigua para dar el flujo por válido.
- Registro y acceso por contraseña o código, confirmación y recuperación están implementados detrás de `emailAuthEnabled`. La opción permanece desactivada tanto en producción como en el desarrollo que apunta al proyecto compartido; solo el entorno `auth-local` la activa. Véase [[Tareas/Implementar registro y autenticación por correo]].
- La recuperación por código debe terminar en el formulario de nueva contraseña antes de entrar en la shell; el estado temporal se conserva por pestaña cuando el navegador permite `sessionStorage`. Las credenciales y códigos nunca se guardan en URLs ni en el estado de navegación. La autorización real permanece en Supabase.
- La activación del correo productivo depende de [[Tareas/Activar correo de autenticación en producción]]. Todo MFA queda aplazado en [[Tareas/Implementar doble factor y recuperación de acceso]].

### Despliegue

- Vercel es la plataforma de despliegue del frontend. `vercel.json` declara Angular, instala con `corepack pnpm install --frozen-lockfile` y construye con `corepack pnpm run build`.
- Vercel despliega cada commit de `main` en producción y cada rama en una preview. Su `ignoreCommand` omite el build cuando el commit no cambia nada fuera de `docs/`; si la comprobación falla (por ejemplo, sin commit anterior), se construye igualmente. El flujo de publicación está en [[#Publicación]].
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
/data/...
```

Cuando se sustituya una ruta publicada, se mantendrá un redirect temporal desde la ruta anterior para proteger enlaces guardados y clientes PWA desactualizados.

### Criterios para evolucionar la arquitectura

- Se priorizan porciones verticales y cambios verificables frente a migraciones masivas sin puntos de control.
- No se introducen capas, abstracciones, stores genéricos o sistemas de plugins sin un caso de uso real.
- Antes de crear una utilidad, componente, servicio o API se debe buscar una implementación existente que pueda reutilizarse o ampliarse sin forzar responsabilidades ajenas.
- La reutilización no justifica componentes genéricos basados en `any`, rutas de propiedades como texto o configuraciones difíciles de entender. Se prefiere duplicación mínima y explícita antes que una abstracción incorrecta; cuando el patrón sea estable, se extrae una pieza tipada y cohesionada.

### Estado actual y siguientes límites

La arquitectura ya se refleja en rutas standalone, shell, plataforma, shared y áreas lazy. Llimbro se divide en Nutrición y Entrenamiento; Finanzas contiene su primera feature completa con Resumen, Movimientos, Recurrentes, Plan mensual y Objetivos; Miscelánea y Datos mantienen páginas temporales. Miscelánea utiliza una identidad ámbar y terracota, flexible y lúdica; Finanzas utiliza azul petróleo y cian, con una expresión precisa y estructurada; Datos utiliza violeta mineral y una expresión de archivo técnico. Las URLs antiguas de Nutrición conservan redirects de compatibilidad. El acceso a datos específico vive en repositorios de cada feature y las páginas escriben mediante sus fachadas.

La retirada de componentes Angular Material y la definición del lenguaje visual son un trabajo posterior e independiente. El presupuesto del bundle inicial también continúa como tarea de rendimiento; no se debe mezclar su resolución con cambios arquitectónicos sin medir antes el origen del peso.

## Evolución de la memoria

Esta arquitectura es la dirección aprobada. Durante el refactor, cualquier ajuste necesario debe registrarse como decisión antes de convertirlo en una nueva regla estructural.

Además de Tareas, esta bóveda incorporará sistemas equivalentes para decisiones visuales y de estilos, decisiones de arquitectura y otros conocimientos duraderos. [[Inicio]] seguirá siendo el nexo de navegación entre todos ellos.

---
Nombre: Analizar rendimiento de navegación y carga de datos
Estado: Hecha
Resumen: Validación remota única por navegación y reutilización del perfil implementadas; corregida la regresión de login al restaurar la PWA con pruebas del SDK real; 164 pruebas y build correctos; las otras optimizaciones siguen pendientes.
Decisiones: Mantener getUser remoto por navegación sin vigencia entre recorridos; reutilizar solo el perfil del mismo usuario e invalidar cambios de sesión y respuestas antiguas; el resto de optimizaciones permanece propuesto y el JavaScript se sigue en Reducir bundle inicial.
Bloqueada: []
Fecha de creación: 2026-09-07
Última modificación: 2026-09-07
---

# Analizar rendimiento de navegación y carga de datos

## Alcance

Revisión solicitada tras observar retraso entre pulsar un botón y navegar en la PWA instalada en móvil. Incluye autenticación, rutas, consultas, imágenes, caché y carga de código. La implementación de mejoras queda fuera de esta auditoría.

## Ampliación aprobada: autenticación por navegación

El usuario autoriza implementar la opción conservadora: mantener `getUser()` remoto en cada navegación protegida, compartir su resultado entre guards del mismo recorrido y reutilizar el perfil del mismo usuario. No se introduce una vigencia de autenticación entre navegaciones. Las otras optimizaciones continúan como propuestas.

La instalación se ha sincronizado correctamente con `pnpm install --frozen-lockfile`, sin cambios de versiones ni del lockfile; ya es posible ejecutar la verificación local.

### Implementación y verificación completadas

- El guard pasa `router.currentNavigation()?.id` a `AuthService`. Los guards del mismo recorrido comparten la promesa pendiente o resuelta; una navegación posterior valida de nuevo, aunque vuelva a la misma URL. Sin identificador se conserva la validación independiente usada por OAuth y enlaces compartidos.
- Tras `getUser()`, se reutiliza el perfil si pertenece al mismo usuario. `SIGNED_OUT`, un cambio de usuario, `USER_UPDATED` y los errores de validación invalidan la caché. Eventos repetidos del mismo usuario y la renovación normal del token conservan el perfil.
- El cierre explícito bloquea nuevas comprobaciones mientras termina. Identificadores de petición y versión de sesión impiden que respuestas antiguas publiquen perfiles o limpien una sesión más reciente. La suscripción a Auth se libera al destruir el servicio.
- La política aprobada queda registrada en [[README#Autenticación]]. Se mantienen ambos guards de la shell, RLS, OAuth y la recuperación local de perfiles inaccesibles; no se ha modificado Supabase.
- `pnpm test --watch=false`: **50 archivos y 158 pruebas correctas**. Incluye Router real con varios niveles, validación por navegación, regreso a la misma URL, cancelación, usuario anónimo, sesión rechazada, reutilización e invalidación de perfil, logout y respuestas tardías.
- `pnpm run build --stats-json`: correcto. Bundle inicial total **589,08 kB**, transferencia estimada **147,21 kB**; permanecen avisos de presupuesto inicial y estilos de componentes. No se atribuye una reducción de bytes a este cambio sin una medición previa comparable.
- Revisión zoneless: el perfil sigue siendo un Signal privado expuesto mediante `asReadonly()`; el callback de Auth es síncrono y no llama a Supabase bajo su bloqueo. La deduplicación y los contadores son coordinación interna de peticiones, sin estado reactivo duplicado.
- No se ha desplegado ni medido la latencia en el móvil. Las otras optimizaciones siguen pendientes.

## Regresión al restaurar la PWA

Tras desplegar por su cuenta, el usuario confirma la mejora de navegación, pero informa de login repetido al actualizar y reabrir la PWA. El SDK 2.111.0 emite `SIGNED_IN` durante `_recoverAndRefresh()` al recuperar una sesión persistida; la primera validación podía capturar la versión de sesión antes de ese evento e interpretarse después como obsoleta. Se reabre esta tarea para corregir el arranque conservando la validación remota y añadir pruebas con el SDK real y almacenamiento persistido simulado.

- Se reprodujo antes de modificar el servicio: la prueba de arranques consecutivos con el SDK real devolvió `false` para una sesión guardada válida; falló 1 de los 4 casos nuevos.
- `AuthService` espera `INITIAL_SESSION` antes de validar remotamente. El primer `SIGNED_IN` de recuperación establece la identidad inicial y no invalida la navegación pendiente. Los cambios posteriores de cuenta, logout y respuestas antiguas siguen protegidos.
- La persistencia y renovación automática ya estaban activas por defecto en el cliente de Supabase; no se cambian ni se añaden copias manuales de tokens o claves de almacenamiento.
- Las nuevas pruebas usan `createClient` real, con transporte HTTP y almacenamiento aislados de producción. Cubren reabrir dos veces conservando la sesión, renovar un token de acceso caducado con el refresh token persistido, rechazo remoto y ausencia de sesión. Comprueban una validación remota por navegación y una carga de perfil por arranque.
- Se añaden pruebas de restauración pendiente y logout durante el arranque. Las pruebas específicas de autenticación pasan: **5 archivos y 41 casos**. No se ha probado directamente el teléfono ni se ha desplegado la corrección.
- Verificación final: `pnpm test --watch=false`, **51 archivos y 164 pruebas correctas**; `pnpm run build`, correcto con los avisos de presupuesto ya conocidos (589,38 kB iniciales y 147,27 kB de transferencia estimada). Se mantiene el estado mediante Signals y el callback de Auth continúa síncrono. La instalación se resincronizó con el lockfile sin actualizar dependencias.

## Relacionadas

- [[Reducir bundle inicial]]
- [[Sistema anti pérdida de datos]]
- [[Corregir recuperación de sesiones inconsistentes]]

## Hallazgos de la auditoría inicial

Esta sección describe el código anterior a la optimización de autenticación. Su implementación y las comprobaciones posteriores se detallan arriba; el resto de hallazgos continúa vigente.

La explicación más directa del retraso previo al cambio de pantalla es la validación remota repetida del guard. El código confirma el camino bloqueante; no se ha capturado una traza del móvil y, por tanto, no se atribuye una duración ni un porcentaje de mejora a cada hallazgo.

### 1. Prioridad alta: autenticación bloqueante en cada navegación

- `src/app/app.routes.ts:19` registra el mismo guard en `canActivate` y `canActivateChild`.
- `src/app/platform/auth/auth.guard.ts` espera `isAuthenticated()` antes de activar la ruta.
- `src/app/platform/auth/auth.service.ts:21` hace `auth.getUser()` y, a continuación, una lectura de `nocendland.user`; no reutiliza la validación ni el perfil ya disponible en el Signal.
- Son dos peticiones secuenciales por ejecución normal del guard con perfil existente. Al activar varios niveles nuevos, el guard de hijos puede ejecutarse varias veces: la implementación instalada de Angular recorre las comprobaciones secuencialmente y consulta los guards de los ancestros para cada nivel. No debe suponerse que toda navegación cuesta exactamente dos peticiones.
- La prueba existente `keeps the current route active while authentication is unresolved` describe precisamente la pantalla anterior retenida durante esa espera; se ha leído, no ejecutado en esta sesión.

Propuesta: inicialización de autenticación compartida, perfil reutilizable por usuario y deduplicación de solicitudes. Para el mismo recorrido de navegación, reutilizar también el resultado ya resuelto: deduplicar únicamente promesas simultáneas no elimina comprobaciones secuenciales. Después, definir una vigencia breve y revalidación en los momentos adecuados, con invalidación al cerrar o cambiar de sesión. Mantener la recuperación de perfiles inconsistentes, los redirects y RLS. Esto requiere acordar y documentar el cambio de política de validación de la arquitectura; no basta con retirar el guard.

`getClaims()` es una alternativa a evaluar, no una sustitución automática: la verificación local depende de las claves de firma y no equivale a consultar el estado actual del usuario en Auth. [Documentación de Supabase](https://supabase.com/docs/reference/javascript/auth-getclaims).

### 2. Prioridad alta: las fotos retrasan los datos y se vuelven a solicitar

- `TrainingStore.loadExercises()` (`src/app/areas/llimbro/training/state/training.store.ts:101`) espera `Promise.all` de todas las imágenes antes de publicar el catálogo. Con N ejercicios con foto, solicita el catálogo más N descargas; una imagen lenta retrasa toda la lista.
- Guardar un ejercicio, subir o quitar su imagen vuelve a cargar el catálogo y todas sus imágenes. Abrir el detalle vuelve a solicitar el ejercicio y su foto incluso cuando están en el catálogo.
- `NutritionStore.loadIngredientList()` publica primero el texto, pero mantiene loading hasta listar Storage y resolver todas las fotos. Su caché de blobs evita algunas descargas, aunque `updateIngredientListWithImages()` genera nuevas URLs de objeto sin revocarlas. Hay riesgo de crecimiento de memoria tras actualizaciones repetidas.
- `SupabaseStorageService.readImage()` descarga el blob de forma imperativa. Añadir solo `loading="lazy"` al `<img>` no aplazaría esas descargas ya iniciadas.

Propuesta: mostrar texto y marcadores de imagen de inmediato; descargar fotos visibles con concurrencia limitada, reutilizar imágenes por ruta y versión e invalidar solo la modificada. Revocar las URLs de objeto al sustituirlas o destruir su propietario. Valorar miniaturas y URLs firmadas reutilizables manteniendo el bucket privado. Medir bytes transferidos: una nueva llamada del SDK puede encontrar caché HTTP y no implica necesariamente retransmitir todo el archivo.

### 3. Prioridad alta: Finanzas encadena trabajo independiente

`src/app/areas/finances/state/finance.store.ts:259` ejecuta:

1. `ensure_finance_period`.
2. `materialize_finance_period`.
3. Cinco lecturas paralelas: configuración, categorías, recurrentes, objetivos y aportaciones.
4. Dos lecturas paralelas adicionales: movimientos y asignaciones.

Son nueve solicitudes en cuatro tandas, sin contar autenticación. Los movimientos y asignaciones esperan a consultas que no necesitan. Cambiar de periodo repite también todos los datos generales. Varias mutaciones recargan siete colecciones aunque solo cambie una.

Propuesta inmediata: después de materializar, cargar en paralelo todos los recursos independientes y conservar configuración y catálogos con invalidación explícita. Para Resumen, priorizar periodo, categorías, movimientos y asignaciones; diferir recursos exclusivos de otras pestañas. Una RPC de apertura/materialización podría reducir otra ida y vuelta, después de revisar su transacción e idempotencia.

La invalidación debe contemplar dependencias reales: actualmente guardar o borrar movimientos solo recarga movimientos y asignaciones, aunque las aportaciones de objetivos se obtienen por otra consulta. La futura optimización debe mantener también ese saldo actualizado.

### 4. Prioridad media-alta: cargas de feature y consultas por ejercicio

- Al instanciar `TrainingStore` se cargan ejercicios, horarios, enlaces compartidos y entradas del día, aunque la página consuma solo una parte. `NutritionStore` inicia alimentos, objetivos, ingestas y totales al crearse.
- No se afirma que los stores se reconstruyan en cada pestaña: están proporcionados en las rutas y su ciclo de vida debe medirse. El exceso descrito ocurre al inicializarlos y en sus recargas explícitas.
- `loadPreviousSessions()` lanza una consulta por ejercicio para las últimas dos sesiones. Ya existen deduplicación de solicitudes en curso y caché por fecha/ejercicio; conviene conservarlas. Una consulta/RPC por lote reduciría el número de peticiones sin descargar el historial completo.
- `TrackingRepository.replaceDate()` realiza una lectura inicial y al menos tres operaciones secuenciales por ejercicio con series, más borrados cuando proceden. Una RPC transaccional para guardar el día reduciría viajes de red y escrituras parciales.

Propuesta: métodos explícitos de carga según la página, cachés acotadas por usuario/recurso/fecha y actualizaciones selectivas tras guardar. Evitar un store global genérico y conservar Signals y límites de feature.

### 5. Prioridad media: historial, paginación y respuestas obsoletas

- `TrackingRepository.readByExercise()` (`src/app/areas/llimbro/training/data-access/tracking.repository.ts:30`) pagina de 500 en 500, pero descarga todo el historial antes de mostrar el detalle. La página empieza en 12 semanas y filtra después en el cliente. Pedir el intervalo visible y ampliar bajo demanda reduce carga al crecer el historial; los indicadores que necesiten datos anteriores requieren una consulta específica.
- Alimentos, ejercicios y varias consultas de Finanzas usan `select('*')` sin paginación. `readGoalContributions()` recupera todas las aportaciones históricas para sumarlas en el cliente. Conviene proyectar columnas y agregar por objetivo en servidor. Supabase documenta un límite por defecto de 1.000 filas; el límite productivo de este proyecto no se ha verificado. No debe confundirse ausencia de paginación con descarga garantizada de todas las filas. [Referencia de select](https://supabase.com/docs/reference/javascript/select).
- Nutrición consulta por separado ingestas con ingredientes y valores nutricionales que luego suma. Evaluar una respuesta conjunta o derivación con `computed()` preservando las reglas y precisión nutricionales existentes.
- Nutrición y Finanzas pueden aceptar respuestas de una fecha/periodo anterior después de una selección más reciente. Usar identidad de solicitud, comprobación de clave seleccionada y cancelación cuando sea viable. Entrenamiento ya comprueba la fecha al publicar entradas y sesiones recientes, pero el detalle del ejercicio necesita protección equivalente.

### 6. Prioridad media: código diferido y experiencia de navegación

- `app.config.ts` no configura precarga del Router; áreas y páginas sí tienen límites lazy.
- `ngsw-config.json` ya precarga `/*.js` y `/*.css`: una PWA instalada y controlada puede disponer de esos archivos localmente. Eso no equivale a evaluar los módulos JavaScript por anticipado.
- No hay `dataGroups` para las consultas o fotos privadas de Supabase. La instalación de la PWA no proporciona por sí sola una caché de datos de negocio.
- ApexCharts se importa desde las páginas de detalle de ejercicio y formulario de alimento; su coste se asocia a esas rutas diferidas. Evaluar un componente de gráfica con `@defer` y precarga selectiva cuando el navegador esté libre. No precargar indiscriminadamente todas las features: sus stores pueden tener efectos de inicialización y hay que comprobar el impacto de red/CPU.
- La tab bar actualiza su pestaña activa tras `NavigationEnd`. Un estado de navegación pendiente daría respuesta al toque mientras se resuelve la navegación, sin dar por activado un destino cuyo guard puede cancelar.

La precarga de rutas y los eventos para medirla están descritos en [Angular Router](https://angular.dev/guide/routing/customizing-route-behavior) y [su ciclo de navegación](https://angular.dev/guide/routing/lifecycle-and-events). El análisis del tamaño y las dependencias del bundle continúa en [[Reducir bundle inicial]].

### 7. Prioridad secundaria: trabajo de interfaz

La aplicación ya es zoneless y usa Signals, pero numerosos componentes declaran `ChangeDetectionStrategy.Eager`. `DataList` renderiza toda la colección, normaliza el texto de cada elemento al buscar y hace búsquedas de selección y creación de badges durante la evaluación del template. Medir primero listas grandes; considerar OnPush, texto normalizado precalculado, selección con Set y paginación/virtualización cuando el volumen lo justifique. [Angular recomienda componentes compatibles con OnPush](https://angular.dev/guide/zoneless).

`FinanceStore.formatMoney()` y varios formateadores construyen `Intl` en cada llamada desde los templates; pueden reutilizarse por moneda/locale. `LoggerService` y repositorios nutricionales imprimen registros completos sin discriminar producción; limitar logs de diagnóstico evita trabajo y retención innecesarios, especialmente durante profiling. Son mejoras secundarias frente a las esperas por red confirmadas.

## Backend observado

Se consultaron en modo lectura el asesor de rendimiento y estadísticas de tablas del proyecto activo `zckqbrwdgxohdymiwbfz`. En `nocendland`, los avisos devueltos son únicamente índices sin uso; no señalan un cuello de botella concreto. No se recomienda borrarlos como solución de la navegación. [Interpretación del aviso](https://supabase.com/docs/guides/database/database-linter?lint=0005_unused_index).

Las estimaciones de filas y contadores de uso no sustituyen latencias HTTP ni planes bajo RLS. No se ejecutó `EXPLAIN ANALYZE` de los flujos autenticados ni se midió la red del teléfono. No se modificó ningún esquema ni recurso compartido.

## Orden propuesto y criterios de comprobación

1. Medir pulsación → NavigationStart → GuardsCheckEnd → NavigationEnd → primeros datos utilizables, con primeras visitas y visitas repetidas en el móvil.
2. Reutilizar validación/perfil según la política acordada y eliminar repeticiones del mismo recorrido. Comprobar conteo de llamadas, logout, cambio de usuario, expiración y perfil inaccesible.
3. Publicar catálogos antes de las imágenes. Comprobar con una foto lenta/fallida, recarga, modificación de una foto y liberación de blobs.
4. Paralelizar Finanzas y aplicar invalidación selectiva. Comprobar periodos nuevos/existentes, recurrentes sin duplicados, saldos y respuestas fuera de orden.
5. Reducir consultas por ejercicio, paginar/agregar datos y medir código diferido. Comparar solicitudes, bytes, p50/p95 de navegación y memoria con datos representativos; no prometer una mejora porcentual antes de medir.

## Verificación y límites de la auditoría inicial

- El intento de `pnpm run build --stats-json` se detuvo con `ERR_PNPM_VERIFY_DEPS_BEFORE_RUN`: la estructura del workspace ha cambiado desde la instalación. No se ha instalado ni modificado ninguna dependencia.
- No se ha generado un bundle actual ni ejecutado la suite; no se presenta la antigua cifra de 1,09 MB como medición vigente.
- Se verificaron los hallazgos mediante lectura del código, implementación instalada del Router, documentación oficial y consultas de metadatos a Supabase. No se ha reproducido ni cronometrado la PWA del móvil.
- Solo se ha modificado documentación. No corresponden tests nuevos para esta auditoría; las pruebas de regresión necesarias para cada futura optimización quedan indicadas arriba.
- La auditoría inicial terminó sin implementación. La posterior optimización de autenticación está completada y verificada en la ampliación anterior; el profiling en móvil y las otras mejoras siguen pendientes.

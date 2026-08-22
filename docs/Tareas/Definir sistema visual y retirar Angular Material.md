---
Nombre: Definir sistema visual y retirar Angular Material
Estado: Hecha
Resumen: Sistema visual «Atlas modular» y navegación inferior reutilizable implementados, sin Angular Material y con temas, perfiles de área y controles automáticos centralizados.
Decisiones: La dirección aprobada es «Atlas modular», con una gramática visual global y una expresión diferenciada por área; todos los colores se centralizan como tokens semánticos con variantes clara y oscura, sin valores hexadecimales dispersos; Angular Material y Angular Animations se retiraron; Angular CDK se conserva exclusivamente para overlay, portales y gestión accesible del foco en la primitiva de diálogo; la navegación principal de una feature utilizará una tab bar inferior flotante común cuya configuración y estado activo pertenecen a la feature.
Bloqueada: []
Fecha de creación: 2026-08-06T18:15:27
Última modificación: 2026-08-06T23:29:32
---

# Definir sistema visual y retirar Angular Material

## Contexto

Angular Material está presente en 24 archivos TypeScript y en el theming global. No es únicamente un cambio de dependencia: formularios, diálogos, drawer, listas, botones, iconos, tarjetas, progreso, selección, tooltips y navegación dependen de sus componentes.

El trabajo se retomó con el usuario el 2026-08-06. La inspección de la aplicación actual confirma una interfaz Material oscura, con poca jerarquía visual y sin una identidad propia que pueda distinguir áreas presentes y futuras.

El inventario actualizado encuentra 21 archivos TypeScript con imports de Angular Material, 19 plantillas con elementos o directivas Material y 5 hojas SCSS acopladas a sus estilos. La dependencia abarca 16 paquetes de componentes: botones, tarjetas, diálogos, divisores, expansión, campos de formulario, iconos, inputs, listas, progreso, selección, navegación lateral, toolbar y tooltips.

Angular CDK solo tiene un consumidor directo: `OverlayService`, basado en `portal` y `overlay`. Su conservación se decidirá al diseñar la primitiva de diálogo; no existe por ahora otro uso que justifique mantener toda la dependencia.

## Enfoque propuesto

1. Buscar referencias visuales junto con el usuario y acordar una dirección.
2. Crear tokens propios para color, tipografía, espaciado, tamaños, radios, elevación, movimiento y densidad.
3. Construir una capa pequeña de primitivas de interfaz accesibles.
4. Migrar primero el shell y después una porción vertical de Alimentación para validar el sistema.
5. Sustituir progresivamente el resto de componentes Material.
6. Eliminar `@angular/material` y su theming cuando ya no haya consumidores.

## Dirección visual aprobada

Nocendland utilizará un sistema «Atlas modular»: una gramática compartida mantiene reconocible la aplicación, mientras cada área adapta su acento, ritmo, geometría y recursos visuales al carácter de su dominio. La diferenciación no se limitará al color ni duplicará componentes; se expresará mediante tokens de área y variantes controladas de las primitivas comunes.

Llimbro tendrá una expresión energética y orgánica, con mayor contraste, formas tensas y recursos inspirados en recorridos, progreso y movimiento. Las áreas futuras podrán declarar su propio perfil —por ejemplo, Finanzas con una composición más precisa, tabular y estructurada— dentro de la misma tipografía, escala espacial, accesibilidad y comportamiento de interacción.

Los estilos se centralizarán mediante variables CSS en dos capas:

1. Tokens base privados del sistema, con escalas tipográficas, espaciales, geométricas, de movimiento y paletas sin valores hexadecimales.
2. Tokens semánticos consumidos por componentes, con variantes clara y oscura y sobrescrituras acotadas por área.

Los componentes y páginas no podrán introducir colores literales. Una comprobación automática impedirá añadir valores hexadecimales fuera de la definición central del sistema.

## Consideración técnica

La recomendación inicial es no conservar el sistema de theming de Material si se eliminan todos sus componentes. Los tokens propios mediante variables CSS evitan mantener la dependencia y permiten tematizar componentes propios. Angular CDK sí puede conservarse selectivamente para comportamientos sin estilos —por ejemplo overlay, gestión de foco o accesibilidad— si aporta valor y no condiciona la identidad visual.

## Resultado

- `tokens.scss` centraliza temas, paletas semánticas, tipografía, espacio, radios, tamaños, movimiento y perfiles de área mediante variables CSS.
- La aplicación persiste la preferencia clara u oscura y actualiza también el color del navegador de la PWA.
- Llimbro declara un perfil energético y orgánico; Finanzas dispone de un perfil estructurado de referencia para su futura implementación.
- Bricolage Grotesque y Archivo se distribuyen localmente. La iconografía se sirve como sprite SVG propio y no depende de fuentes remotas.
- Shell, autenticación, navegación, listas, formularios, calendario, tarjetas, progreso y diálogos utilizan primitivas propias.
- `check:styles` impide valores hexadecimales y utilidades cromáticas directas fuera del sistema de tokens, y se ejecuta antes del build de producción.
- `@angular/material`, su theming y `@angular/animations` se eliminaron. Angular CDK se mantiene porque la primitiva de diálogo usa overlay, portales y trampa de foco sin heredar apariencia visual.
- `FeatureTabBarComponent` y `FeatureSwipeNavigationDirective` forman la primitiva tipada para navegar entre páginas primarias de una feature; Nutrición la configura desde su propio layout y la shell deja de conocer esas rutas hijas.
- La barra utiliza posición flotante, área segura, estado activo accesible y los mismos tokens de tema y área que el resto del sistema.

## Verificación

- Build de producción correcto; la única advertencia restante es el presupuesto del bundle inicial, cubierto por la tarea independiente [[Reducir bundle inicial]].
- 27 pruebas unitarias correctas en Chrome Headless, incluido el estado activo y el gesto horizontal de la navegación de feature.
- No existen imports, elementos, directivas, estilos ni dependencia de Angular Material.
- Temas claro y oscuro comprobados en ejecución.
- Shell, navegación y diálogos comprobados en escritorio y en un viewport móvil de 390 × 844, sin desbordamiento horizontal.
- La navegación Alimentos/Ingesta/Objetivos se comprobó en claro y oscuro, escritorio y 390 × 844; conserva el destino activo en el formulario y no registra errores de consola.
- El diálogo conserva los providers del límite lazy, atrapa el foco y lo devuelve al control que lo abrió al cerrarse.
- `pnpm audit --audit-level high` continúa informando vulnerabilidades transitivas ya cubiertas por [[Revisar vulnerabilidades transitivas]]; no se aplicaron correcciones automáticas.

## Incidencia de despliegue

El primer despliegue del commit `dbad2e8` falló porque el script `build` lanzaba un segundo proceso `pnpm`. Vercel ejecutó la instalación con la versión fijada 10.33.2, pero ese proceso anidado resolvió el binario global 10.28.0 y `engineStrict` rechazó la diferencia. La comprobación de estilos se invoca directamente con Node para mantener el control sin relajar la política de versiones.

El comando de producción exacto configurado en Vercel, `corepack pnpm run build`, se verificó localmente con la versión 0.1.14.

## Criterios de finalización

- La dirección visual y sus referencias están documentadas.
- Los tokens y primitivas forman un sistema consistente y accesible.
- No quedan componentes ni estilos internos de Angular Material.
- La decisión de conservar o retirar cada parte de Angular CDK está justificada.
- La identidad funciona en escritorio, móvil y como PWA.

## Ampliación: navegación de feature

El usuario aprobó sustituir el footer específico de Nutrición por una tab bar inferior flotante y reutilizable. La primitiva compartida no conocerá dominios ni rutas concretas: cada feature proporcionará sus destinos y resolverá el estado activo desde su configuración de rutas. Su geometría y expresión visual se adaptarán mediante los tokens del área sin duplicar el componente.

La ampliación quedó implementada en el layout de ruta de Nutrición. Entrenamiento y futuras features de Finanzas podrán reutilizar el mismo contrato proporcionando su lista tipada de destinos, mientras sus perfiles visuales se resuelven exclusivamente con tokens de área.

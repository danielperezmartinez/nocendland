---
Nombre: Definir el refactor pendiente
Estado: Hecha
Resumen: Evaluar la arquitectura heredada y acordar una estructura escalable para las áreas vitales de Nocendland antes de ejecutar los refactors estructural y visual.
Decisiones: Nocendland será un monolito modular por áreas y features; Llimbro y Finanzas son áreas, Alimentación y Entrenamiento son features, y el refactor visual se mantiene como una línea separada.
Bloqueada: []
Fecha de creación: 2026-08-06T17:49:32
Última modificación: 2026-08-06T18:48:42
---

# Definir el refactor pendiente

## Contexto

Nocendland nació para monitorizar y ayudar al usuario en distintos aspectos de su vida. El primer ámbito desarrollado fue **Llimbro** —una forma jocosa de escribir «gym bro»—, comenzando por alimentación y reservando espacio para ejercicios. La aplicación debe poder crecer hacia ámbitos diferentes, como finanzas, sin mezclar sus modelos ni su funcionamiento.

La arquitectura heredada intentó representar esa jerarquía, pero debe evaluarse antes de consolidarla. El trabajo se divide en dos líneas relacionadas:

1. [[Refactorizar arquitectura por áreas]]: estructura del código, rutas, límites de dominio, estado y acceso a datos.
2. [[Definir sistema visual y retirar Angular Material]]: referencias, decisiones visuales, primitivas de interfaz y retirada de los componentes Material.

## Hallazgos de la arquitectura actual

- La intención `Llimbro → Alimentación / Ejercicios` aparece en el menú y en archivos antiguos, pero no en las rutas activas: `nutrition` cuelga directamente de la raíz y `llimbro` tiene sus rutas comentadas.
- La aplicación usa bootstrap standalone, pero conserva siete `NgModule` que actúan principalmente como envoltorios de rutas.
- Nutrición está repartida entre `modules/nutrition`, servicios globales de `api/` y tipos globales llamados `llimbro`, por lo que no tiene un límite de dominio autosuficiente.
- `NutritionService` mezcla el estado y la carga de ingredientes, ingestas, fecha y objetivos, y se proporciona globalmente.
- Los componentes acceden tanto al servicio de estado como a servicios API concretos, de modo que la orquestación y el acceso a datos no tienen una frontera única.
- Navegación, footer y gestos dependen de búsquedas de texto sobre URLs y configuraciones duplicadas.
- Angular Material está profundamente acoplado a la interfaz: aparece en 24 archivos TypeScript de componentes o servicios, además del theming global.

## Propuesta pendiente de aprobación

Usar una arquitectura de **monolito modular orientado a dominios y features**, con esta taxonomía:

- **Aplicación:** Nocendland.
- **Área:** un aspecto vital de alto nivel, como Llimbro o Finanzas.
- **Feature:** una capacidad dentro de un área, como Alimentación o Entrenamiento.
- **Caso de uso o página:** una operación concreta de la feature, como Ingestas, Alimentos u Objetivos.

La propuesta evita usar «módulo» como término de producto, porque se confunde con `NgModule` y no expresa un nivel de negocio concreto. El usuario aprobó esta taxonomía y la arquitectura el 2026-08-06.

## Siguiente paso

La definición está cerrada. Las decisiones se han trasladado al `README` de la bóveda y comienza [[Refactorizar arquitectura por áreas]].

## Criterios de finalización

- El objetivo del refactor está documentado.
- La taxonomía y la arquitectura objetivo han sido aprobadas por el usuario.
- El alcance y el orden de las dos líneas de trabajo están claros.
- Las tareas necesarias y sus bloqueos están identificados.
- Las decisiones duraderas se han registrado en la bóveda.

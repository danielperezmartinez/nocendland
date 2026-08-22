---
Nombre: Crear áreas de Miscelánea y Finanzas
Estado: Hecha
Resumen: Incorporar Miscelánea y Finanzas como áreas lazy con navegación, páginas temporales y perfiles cromáticos propios.
Decisiones: Miscelánea utiliza un perfil ámbar y terracota de carácter flexible y lúdico; Finanzas consolida el perfil azul petróleo y cian, preciso y estructurado; ambas áreas permanecen como páginas En desarrollo hasta definir sus features.
Bloqueada: []
Fecha de creación: 2026-08-22T12:16:09
Última modificación: 2026-08-22T12:21:19
---

# Crear áreas de Miscelánea y Finanzas

## Objetivo

Crear los límites iniciales de las áreas **Miscelánea** y **Finanzas** sin anticipar todavía sus features. Cada área debe disponer de ruta lazy, acceso desde la navegación principal, identidad cromática en claro y oscuro y una página temporal accesible que comunique que continúa en desarrollo.

## Criterios de finalización

- Las rutas `/miscellaneous` y `/finances` cargan sus áreas de forma diferida.
- La navegación principal permite abrir ambas áreas y conserva sus identidades cromáticas.
- Miscelánea usa un perfil ámbar y terracota, diferenciado del verde de Llimbro.
- Finanzas usa un perfil azul petróleo y cian de composición estructurada.
- Las páginas temporales funcionan con ambos temas y en móvil.
- Las rutas, el tema de área y las páginas temporales cuentan con pruebas proporcionadas al comportamiento.
- Las comprobaciones de estilos, tests y build terminan correctamente.

## Resultado

- `/miscellaneous` y `/finances` cargan páginas temporales mediante límites lazy independientes.
- La navegación principal presenta Llimbro, Miscelánea y Finanzas como áreas diferenciadas y permite acceder a las dos nuevas.
- El tema de área reconoce ambas rutas y propaga sus tokens a la shell y a los elementos globales.
- Miscelánea adopta ámbar y terracota con trama de puntos y geometría flexible.
- Finanzas consolida azul petróleo y cian con retícula y geometría estructurada.
- Cada página muestra el estado «En desarrollo» mediante el badge compartido, sin convertir esta solución temporal en una nueva primitiva.

## Verificación

- `pnpm run check:styles` correcto.
- 118 pruebas correctas en 47 archivos.
- Build de producción correcto; mantiene únicamente los avisos de presupuesto ya registrados en tareas independientes.
- Miscelánea y Finanzas comprobadas en ejecución con tema claro y oscuro, sin errores de consola.
- Ambas páginas comprobadas a 390 × 844 sin desbordamiento horizontal.

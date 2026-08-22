---
Nombre: Aplicar tema de área a elementos globales
Estado: Hecha
Resumen: Diálogos, avisos PWA y demás elementos globales heredan los colores del área activa mediante un perfil sincronizado con la navegación.
Decisiones: El área se deriva una sola vez de la navegación mediante Signals y se refleja en body para que alcance tanto la aplicación como los overlays de Angular CDK.
Bloqueada: []
Fecha de creación: 2026-08-22T12:05:56
Última modificación: 2026-08-22T12:13:00
---

# Aplicar tema de área a elementos globales

## Contexto

El atributo `data-area` estaba limitado al contenedor interior de la shell. Los diálogos se renderizan en el contenedor global de Angular CDK y el aviso de actualización es hermano de la shell, por lo que ambos heredaban los tokens azules de la aplicación aunque el usuario estuviera dentro de Llimbro.

## Alcance

- Derivar el área activa desde la navegación como estado Signal.
- Aplicar `data-area` a `body` para cubrir la shell, avisos globales y overlays.
- Mantener los perfiles claro y oscuro existentes.
- Añadir pruebas de resolución y sincronización al navegar.

## Verificación

- Las 114 pruebas unitarias pasan, incluidas la resolución del área y su actualización después de navegar.
- El build de producción termina correctamente y supera los controles de tokens y shared UI; conserva únicamente los avisos de presupuesto ya registrados en el proyecto.
- En navegador, un diálogo real de cambios sin guardar dentro de Llimbro oscuro hereda en `body`, overlay y botón el mismo acento verde, sin errores de consola.

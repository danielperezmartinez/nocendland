---
Nombre: Publicar política de privacidad y aviso legal
Estado: En curso
Resumen: Nocendland guarda datos de salud (nutrición, entrenamiento) y de finanzas, además de email y avatar, pero no tiene aviso legal ni política de privacidad; hay que publicarlos y enlazarlos desde todas las páginas, o justificar por escrito que la app es solo de uso personal.
Decisiones: "La app es personal, pero quien la encuentre puede usarla, así que se publican la política de privacidad y el aviso legal. Responsable: Daniel Pérez Martínez; contacto: dlperezmartinez@gmail.com; sin dirección postal porque no hay actividad económica. Encargados: Supabase (UE, Fráncfort) y Vercel."
Bloqueada: []
Fecha de creación: 2026-10-16T23:23:13+02:00
Última modificación: 2026-10-17T09:46:56+02:00
---

# Publicar política de privacidad y aviso legal

## Contexto

Hallazgo legal de la auditoría del 2026-10-16. Las reglas de «Legal y privacidad» del sistema Seguridad, coste y cumplimiento (véase `README.md`) exigen aviso legal (LSSI-CE, art. 10) y política de privacidad (RGPD, art. 13) antes de publicar. Los datos de salud son categoría especial del RGPD (art. 9) si la app la usa alguien además de su propietario. Hoy cualquier cuenta del Auth compartido puede usarla (véase [[Tareas/Restringir el acceso a la API de Nocendland]]).

Solo hay `localStorage` funcional (tema, navegación), así que no hace falta banner de cookies.

## Criterios de finalización

- Se decide con el usuario si la app es estrictamente personal (con el acceso cerrado) o si la usarán terceros, y la decisión se registra.
- Si la usarán terceros: hay rutas públicas de aviso legal y de privacidad, enlazadas desde todas las páginas (también desde `/auth`), y la política lista los encargados del tratamiento (Supabase, Vercel) con su región.
- Las rutas nuevas se añaden a `e2e/a11y.spec.ts`.
- La checklist de lanzamiento queda actualizada.

## Verificación

- `pnpm run test:a11y` en verde con las rutas nuevas; build correcto.

## Resultado (2026-10-17)

- Rutas públicas `/privacy` y `/legal-notice` (`src/app/shell/legal/`), enlazadas desde la tarjeta de inicio de sesión, desde el menú de inicio y entre sí.
- La política recoge los datos de cuenta y los registros de nutrición, entrenamiento y finanzas, avisa de que los datos de salud son una categoría especial y cita como base legal el consentimiento explícito al registrarlos. También lista los encargados, explica los enlaces compartidos, el almacenamiento técnico sin cookies y los derechos (con la AEPD).
- No es asesoramiento legal. La app no tiene todavía un paso de consentimiento explícito para los datos de salud ni una baja autoservicio; las bajas se atienden por email.

## Verificación local

- `pnpm run test:a11y:local`: `/privacy` y `/legal-notice` sin infracciones.
- `pnpm test`: `legal-pages.spec.ts` comprueba el contenido, los enlaces y que las rutas no exigen sesión.

## Pendiente

Se publica con el próximo despliegue del frontend, tras el push aprobado por el usuario.

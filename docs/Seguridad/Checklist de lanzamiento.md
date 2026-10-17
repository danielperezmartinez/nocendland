---
Nombre: Checklist de lanzamiento
Tipo: Checklist
Estado: Pendiente
Resumen: Estado de la configuración fuera del código (gasto, Auth, firewall, secretos, plan, GitHub y legal) que ningún test del repo comprueba. Pendiente de la primera revisión en los paneles; los valores ya conocidos proceden de la auditoría de solo lectura del 2026-10-16.
Última revisión: 2026-10-16
Última modificación: 2026-10-17T17:05:00+02:00
---

# Checklist de lanzamiento

Marca cada punto al revisarlo en el panel y anota el valor real. Al terminar, `Estado: Revisada` y actualiza `Última revisión`. Se revisa antes de abrir la app a otras personas, al cambiar de plan y, como mínimo, una vez por trimestre, junto con las checklists de gift-card y Outify porque comparten el proyecto Supabase.

## Supabase (`devappsdpm-db`, `zckqbrwdgxohdymiwbfz`)

- [ ] Plan actual y sus límites anotados (BD, Storage, egress, MAU). En el plan gratuito, superar un límite restringe **todo** el proyecto, no solo esta app. Apps que lo comparten: gift-card (`gift_card`) y Outify (`outify`, `outify_dev`).
      Conocido: plan gratuito; el bucket `nocendland` ocupa 127 MB en 48 objetos (2026-10-16).
- [ ] Tope de gasto (Spend Cap) activado o, si se desactiva, decisión escrita.
- [ ] Alertas de uso o de facturación configuradas y con destinatario real.
- [ ] Auth: el registro abierto/cerrado es intencionado; solo están activos los proveedores que se usan; URLs de redirección limitadas a los dominios propios.
      Decidido (2026-10-17): la app queda abierta a cualquier cuenta del Auth compartido, con topes por usuario en lugar de lista de permitidos. Véase [[Tareas/Restringir el acceso a la API de Nocendland]].
- [ ] Auth: confirmación de email, protección contra contraseñas filtradas, CAPTCHA y límites de envío de emails/OTP revisados.
      Conocido: la protección contra contraseñas filtradas está desactivada. Véase [[Tareas/Activar protección contra contraseñas filtradas]].
- [ ] Auth: SMTP propio si se envían correos a usuarios reales. Véase [[Tareas/Activar correo de autenticación en producción]].
- [ ] Extensiones: `pg_net` y `http` no están instaladas en `devappsdpm-db` (2026-10-17). Si alguna app las instala, revocar antes el acceso de `anon` y `authenticated`; los tests locales retiran `pg_net` porque la imagen local lo trae.
- [ ] Esquemas expuestos por la API: solo los necesarios.
      Conocido: `public`, `graphql_public`, `gift_card` y `nocendland` (de Nocendland solo `nocendland`; `nocendland_private` no se expone).
- [ ] Copias de seguridad: lo que incluye el plan y si basta.

## Vercel (proyecto de Nocendland)

- [ ] Plan adecuado al uso (Hobby no admite uso comercial).
- [ ] Spend Management: tope y alertas configurados, y acción al superarlo.
- [ ] Firewall: reglas de límite de peticiones en rutas públicas y de API.
- [ ] Deployment Protection en Preview si las previews no deben ser públicas.
- [ ] Variables secretas solo en los entornos que las usan (no en Preview si no hace falta) y marcadas como sensibles.

## GitHub (`danielperezmartinez/nocendland`)

- [x] Visibilidad del repo conocida y coherente con las reglas de "Repositorio y publicación": público (2026-10-17).
- [x] Secret scanning activado (2026-10-17).
- [x] Push protection activado (2026-10-17).
- [ ] Private vulnerability reporting activado. Desactivado a 2026-10-17.
- [x] Protección de la rama principal según [[README#Publicación|Publicación]], con los jobs de seguridad (incluido `fugas`) como obligatorios. Aplicada el 2026-10-17.
- [x] Hooks activos en cada clon de trabajo (`git config core.hooksPath` apunta a `.githooks`) y gitleaks instalado; fichero de patrones personales creado fuera del repo. Comprobado el 2026-10-17 en el clon de trabajo del agente; `pnpm install` los activa en cada clon.
- [ ] Alertas de Dependabot activadas. Desactivadas a 2026-10-17.

## Legal y privacidad

- [ ] Aviso legal y política de privacidad publicados y enlazados. Hechos en la rama `feat/seguridad-coste-cumplimiento` (`/privacy`, `/legal-notice`); falta el despliegue. Véase [[Tareas/Publicar política de privacidad y aviso legal]].
- [ ] Terceros que reciben datos (Supabase, Vercel, APIs) listados en la política, con región de los datos.
- [ ] Banner de cookies solo si hay cookies no técnicas, y funciona sin cargar nada antes del consentimiento. Conocido: solo hay `localStorage` funcional (tema y navegación), así que no hace falta banner.

## Accesibilidad

- [ ] Revisión manual con teclado y lector de pantalla de los flujos principales.

## Revisiones

| Fecha | Quién | Notas |
| --- | --- | --- |
| 2026-10-16 | Agente (auditoría de solo lectura) | Valores conocidos anotados; paneles de Supabase (Spend Cap, alertas, Auth) y Vercel sin revisar. |
| 2026-10-17 | Agente | Decisión de acceso abierto con topes, páginas legales y pg_net anotados; paneles sin revisar. |
| 2026-10-17 | Agente | Sección GitHub añadida; protección de `main` y ajustes del repo aplicados con el OK del usuario. Siguen pendientes el private vulnerability reporting y Dependabot. |

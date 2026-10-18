---
Nombre: Implementar doble factor y recuperación de acceso
Estado: Planificando
Resumen: Doble factor opcional con autenticador TOTP y códigos de recuperación nativos, aplazado para una entrega posterior.
Decisiones: No habilitar MFA en la entrega de autenticación por correo; evaluar soporte experimental de códigos, recuperación y efectos sobre las sesiones compartidas antes de implementarlo.
Bloqueada: []
Fecha de creación: 2026-09-30
Última modificación: 2026-09-30
---

# Implementar doble factor y recuperación de acceso

## Alcance pendiente

- Alta, desafío y retirada de autenticadores TOTP, de activación voluntaria.
- Generación, descarga, regeneración y consumo de códigos de recuperación nativos de Supabase; no construir almacenamiento criptográfico propio.
- Exigir segundo factor en guards, RLS, Storage y operaciones privadas de Edge Functions para cuentas que lo hayan activado.
- Comprobar soporte del servidor y SDK: los códigos requieren actualmente una API experimental ausente en la versión instalada 2.111.0.
- Revisar el impacto global: los factores y la identidad son compartidos; algunas operaciones pueden revocar otras sesiones.
- Probar recuperación, factores perdidos, bloqueo de acceso directo y compatibilidad con las otras aplicaciones antes de activar producción.

Relacionado: [[Implementar registro y autenticación por correo]], [[Revisar bajas en Supabase compartido]].

---
Nombre: Crear área de Datos
Estado: Hecha
Resumen: Datos existe como área lazy independiente con navegación, página temporal e identidad visual propia, sin anticipar todavía sus features.
Decisiones: Datos nace como un límite de dominio independiente; su primera versión será una landing En desarrollo con una identidad de archivo técnico en violeta mineral.
Bloqueada: []
Fecha de creación: 2026-09-03T14:16:52+02:00
Última modificación: 2026-09-03T14:21:05+02:00
---

# Crear área de Datos

## Objetivo

Crear el límite inicial del área **Datos** sin anticipar todavía sus features. El área debe disponer de ruta lazy, acceso desde la navegación principal, identidad cromática en claro y oscuro y una página temporal accesible que comunique que continúa en desarrollo.

## Criterios de finalización

- La ruta `/data` carga el área de forma diferida.
- La navegación principal permite abrir Datos y conserva su identidad cromática.
- Datos utiliza un perfil violeta mineral con una expresión de archivo técnico, diferenciado del resto de áreas.
- La página temporal funciona con ambos temas y en móvil.
- La ruta, el tema de área y la página temporal cuentan con pruebas proporcionadas al comportamiento.
- Las comprobaciones de estilos, tests y build terminan correctamente.

## Resultado

- `/data` carga una landing temporal mediante un límite lazy independiente.
- La navegación principal incorpora Datos con icono propio y conserva el último destino mediante el servicio tipado existente.
- El tema global reconoce la nueva ruta y aplica un perfil violeta mineral en claro y oscuro.
- La landing reutiliza el badge compartido y adopta una composición de archivo técnico con índice, regla y símbolo de base de datos.
- La arquitectura documentada incluye Datos como área oficial en desarrollo.

## Verificación

- Pruebas focalizadas: 4 archivos y 6 casos correctos.
- Suite completa: 49 archivos y 127 pruebas correctas.
- Build de producción correcto, incluidas las comprobaciones de estilos y catálogo técnico; permanecen únicamente los avisos de presupuesto ya conocidos.
- `git diff --check`: sin errores de espacios; solo avisos de normalización LF/CRLF ya presentes en el workspace.
- La ruta local protegida redirige correctamente a autenticación y no genera errores de consola. La sesión aislada del navegador no permitió revisar la landing autenticada sin iniciar OAuth.

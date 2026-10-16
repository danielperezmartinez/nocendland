---
Nombre: "compressImage"
Tipo: "Utilidad"
Área: "Global"
Feature: "Shared utilities"
Estado: "Vigente"
Ámbito: "Aplicación"
Fuente: "src/app/shared/utilities/image-compression.utils.ts"
Entrada pública: "@shared/utilities/image-compression.utils"
Resumen: "Redimensiona y recomprime una imagen en el navegador (WebP por defecto) hasta que cabe en un tamaño máximo; devuelve el original si ya cabe y rechaza si no lo consigue."
Última modificación: "2026-10-17T10:00:00+02:00"
---

# compressImage

Después de descubrir esta pieza en el catálogo, consulta [su implementación](../../src/app/shared/utilities/image-compression.utils.ts) como fuente de verdad de su contrato detallado.

Se usa antes de subir imágenes al bucket `nocendland`, que admite archivos de hasta 2 MB (véase «Coste y abuso» en el sistema Seguridad, coste y cumplimiento del `README.md`). Las imágenes que pasan por `ImageCropperComponent` ya salen reducidas y no la necesitan.

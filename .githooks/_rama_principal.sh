# Guarda de publicación: el código no se sube directo a la rama principal.
# Reglas en docs/README.md, sección "Publicación". La carga .githooks/pre-push.

RAMA_PRINCIPAL="main"
RUTA_BOVEDA="docs"
CERO=0000000000000000000000000000000000000000

# comprobar_rama_principal <ref local> <sha local> <ref remota> <sha remota>
comprobar_rama_principal() {
  [ "$3" = "refs/heads/$RAMA_PRINCIPAL" ] || return 0
  [ "$2" = "$CERO" ] && return 0 # borrado de la rama: lo impide la protección del servidor
  [ "$4" = "$CERO" ] && return 0 # la rama aún no existe en el remoto (primer push del repo)
  if ! git cat-file -e "$4^{commit}" 2>/dev/null; then
    echo "No tengo el commit remoto de $RAMA_PRINCIPAL. Haz git fetch y repite." >&2
    exit 1
  fi
  if ! git diff --quiet "$4" "$2" -- . ":(exclude)$RUTA_BOVEDA"; then
    echo "Este push cambia archivos fuera de $RUTA_BOVEDA/ directamente en $RAMA_PRINCIPAL." >&2
    echo "El código se publica por pull request (docs/README.md, sección Publicación)." >&2
    exit 1
  fi
}

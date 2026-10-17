# Funciones comunes de los hooks de gitleaks (no es un hook: lo cargan los demás).
# Reglas en docs/README.md, sección "Repositorio y publicación".

if ! command -v gitleaks >/dev/null 2>&1; then
  echo "gitleaks no está instalado: no se puede revisar lo que se va a subir." >&2
  echo "Instálalo (https://github.com/gitleaks/gitleaks) y repite." >&2
  exit 1
fi

# Patrones personales: fuera del repo, nunca versionados.
PERSONAL="${GITLEAKS_PERSONAL_CONFIG:-$HOME/.config/gitleaks/personal.toml}"

# escanear <args de gitleaks>: revisa con los patrones del repo y con los personales.
escanear() {
  gitleaks "$@" --redact --no-banner --config .gitleaks.toml || exit 1
  if [ -f "$PERSONAL" ]; then
    gitleaks "$@" --redact --no-banner --config "$PERSONAL" || exit 1
  else
    echo "Aviso: no hay patrones personales en $PERSONAL; solo se han revisado los genéricos." >&2
  fi
}

# escanear_texto: revisa un texto recibido por stdin (mensajes, nombres de rama).
escanear_texto() {
  tmp=$(mktemp)
  cat > "$tmp"
  gitleaks stdin --redact --no-banner --config .gitleaks.toml < "$tmp" || { rm -f "$tmp"; exit 1; }
  if [ -f "$PERSONAL" ]; then
    gitleaks stdin --redact --no-banner --config "$PERSONAL" < "$tmp" || { rm -f "$tmp"; exit 1; }
  fi
  rm -f "$tmp"
}

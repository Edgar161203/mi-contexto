#!/usr/bin/env bash
set -euo pipefail

DESDE="${1:-1 day ago}"
FACTS_GUARDADOS=0

extraer_commits() {
  while IFS= read -r linea; do
    [ -z "$linea" ] && continue
    if guardar_memoria "Edgar hizo un commit en mi-contexto: \"$linea\"" "commits"; then
      FACTS_GUARDADOS=$((FACTS_GUARDADOS + 1))
    fi
  done < <(git log --since="$DESDE" --pretty=format:"%s")
}

guardar_memoria() {
  local texto="$1"
  local fuente="$2"
  local texto_escapado
  texto_escapado=$(printf '%s' "$texto" | sed -e 's/\\/\\\\/g' -e 's/"/\\"/g')
  local respuesta
  respuesta=$(curl -s -w '\n%{http_code}' -X POST "https://api.mem0.ai/v1/memories/" \
    -H "Authorization: Token ${MEM0_API_KEY}" \
    -H "Content-Type: application/json" \
    -d "{\"messages\":[{\"role\":\"user\",\"content\":\"${texto_escapado}\"}],\"user_id\":\"edgar\",\"source\":\"${fuente}\"}")
  local status="${respuesta##*$'\n'}"
  if [ "$status" != "200" ]; then
    echo "ERROR (${fuente}, HTTP ${status}): ${texto}" >&2
    return 1
  fi
  echo "guardado (${fuente}): ${texto}"
}

extraer_commits

echo "--- facts guardados: ${FACTS_GUARDADOS} ---"

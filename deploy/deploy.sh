#!/usr/bin/env bash
# Deploy blue/green de ganf (SGRSI) con systemd + Nginx.
#
#   deploy/deploy.sh deploy [sha]   publica dist/ en el slot inactivo y cambia el tráfico
#   deploy/deploy.sh rollback       vuelve al slot anterior (sigue corriendo, no se reconstruye)
#   deploy/deploy.sh status         slot activo y estado de las dos unidades
#
# Flujo de `deploy`:
#   1. copia dist/ a $APP_DIR/<slot inactivo>
#   2. systemctl restart ganf@<slot inactivo>
#   3. health check en el slot (/ → 200 y /api/auth.php?accion=sesion → 200|401, o sea DB alcanzable)
#   4. reescribe el upstream de Nginx, nginx -t, reload
#   5. health check en el dominio real (HEALTH_URL); si falla, vuelve atrás solo
# El slot anterior queda corriendo para el rollback.
#
# Variables (todas con default):
#   APP_DIR       /home/hermes/apps/ganf
#   PORT_BLUE     4161   (mantener en sync con ganf@.service)
#   PORT_GREEN    4162
#   UPSTREAM_INC  /etc/nginx/snippets/ganf-upstream.conf
#   HEALTH_URL    URL real del dominio; vacío = se omite ese check
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
APP_DIR="${APP_DIR:-/home/hermes/apps/ganf}"
PORT_BLUE="${PORT_BLUE:-4161}"
PORT_GREEN="${PORT_GREEN:-4162}"
UPSTREAM_INC="${UPSTREAM_INC:-/etc/nginx/snippets/ganf-upstream.conf}"
HEALTH_URL="${HEALTH_URL:-}"
SYSTEMCTL=(sudo /usr/bin/systemctl)
NGINX=(sudo /usr/sbin/nginx)
STATE="$APP_DIR/active"

die() { printf '\nERROR: %s\n' "$*" >&2; exit 1; }
ok()  { printf '    ok    %s\n' "$*"; }

puerto() { if [ "$1" = blue ]; then echo "$PORT_BLUE"; else echo "$PORT_GREEN"; fi; }
otro()   { if [ "$1" = blue ]; then echo green; else echo blue; fi; }
activo() { if [ -f "$STATE" ]; then cat "$STATE"; else echo none; fi; }

# Espera hasta ~30 s a que la URL responda con alguno de los códigos dados (default 200).
esperar() {
  local url="$1" codigos="${2:-200}" i code
  for i in $(seq 1 30); do
    code="$(curl -s -o /dev/null -w '%{http_code}' --max-time 3 "$url" || true)"
    case " $codigos " in *" $code "*) return 0 ;; esac
    sleep 1
  done
  return 1
}

# Slot sano = el HTML sale (200) y la API alcanza la DB: auth.php abre la conexión en cada
# request, así que ?accion=sesion da 401 sin sesión (DB ok) o 200; 500 = DB caída.
health_slot() {
  local p; p="$(puerto "$1")"
  esperar "http://127.0.0.1:$p/" && esperar "http://127.0.0.1:$p/api/auth.php?accion=sesion" "200 401"
}

# Apunta Nginx al slot y recarga. Restaura el upstream anterior si nginx -t falla.
cambiar_trafico() {
  local slot="$1" previo=""
  [ -f "$UPSTREAM_INC" ] && previo="$(cat "$UPSTREAM_INC")"
  printf 'server 127.0.0.1:%s;\n' "$(puerto "$slot")" | sudo /usr/bin/tee "$UPSTREAM_INC" >/dev/null
  if ! "${NGINX[@]}" -t 2>&1; then
    [ -n "$previo" ] && printf '%s\n' "$previo" | sudo /usr/bin/tee "$UPSTREAM_INC" >/dev/null
    die "nginx -t falló; upstream restaurado."
  fi
  "${SYSTEMCTL[@]}" reload nginx
  ok "tráfico → $slot (:$(puerto "$slot"))"
}

marcar_activo() { echo "$1" > "$STATE.tmp" && mv -f "$STATE.tmp" "$STATE"; }

health_dominio() {
  [ -n "$HEALTH_URL" ] || { ok "HEALTH_URL vacío: check del dominio omitido"; return 0; }
  esperar "$HEALTH_URL"
}

CMD="${1:-deploy}"
case "$CMD" in
  deploy)
    sha="${2:-$(git -C "$ROOT" rev-parse HEAD 2>/dev/null || date -u +%Y%m%d%H%M%S)}"
    [ -f "$ROOT/dist/index.html" ] || die "No hay dist/index.html: corré bun run build antes."
    [ -n "$APP_DIR" ] && [ "$APP_DIR" != "/" ] || die "APP_DIR inválido."
    mkdir -p "$APP_DIR"
    actual="$(activo)"
    if [ "$actual" = none ]; then destino=blue; else destino="$(otro "$actual")"; fi
    printf 'deploy %s: %s → %s\n' "${sha:0:12}" "$actual" "$destino"

    # El slot destino está inactivo: se detiene, se vacía y se vuelve a llenar.
    "${SYSTEMCTL[@]}" stop "ganf@$destino" 2>/dev/null || true
    mkdir -p "$APP_DIR/$destino"
    find "$APP_DIR/$destino" -mindepth 1 -delete
    cp -a "$ROOT/dist/." "$APP_DIR/$destino/"
    echo "$sha" > "$APP_DIR/$destino.sha"   # fuera del docroot, no se sirve
    ok "dist/ copiado a $destino"

    "${SYSTEMCTL[@]}" restart "ganf@$destino"
    if ! health_slot "$destino"; then
      sudo /usr/bin/journalctl -u "ganf@$destino" -n 30 --no-pager || true
      "${SYSTEMCTL[@]}" stop "ganf@$destino" || true
      die "health check del slot $destino falló; el activo ($actual) no se tocó."
    fi
    ok "slot $destino sano"

    cambiar_trafico "$destino"
    if ! health_dominio; then
      if [ "$actual" != none ]; then
        cambiar_trafico "$actual"
        die "el dominio no respondió 200 tras el switch; vuelto a $actual."
      fi
      die "el dominio no respondió 200 y no hay slot anterior."
    fi
    ok "dominio responde 200"
    marcar_activo "$destino"
    ok "activo: $destino (anterior $actual sigue corriendo para rollback)"
    ;;
  rollback)
    actual="$(activo)"
    [ "$actual" != none ] || die "No hay slot activo registrado."
    previo="$(otro "$actual")"
    "${SYSTEMCTL[@]}" is-active --quiet "ganf@$previo" || die "ganf@$previo no está corriendo; no hay a qué volver."
    health_slot "$previo" || die "ganf@$previo no pasa el health check."
    cambiar_trafico "$previo"
    marcar_activo "$previo"
    ok "rollback: $actual → $previo"
    ;;
  status)
    printf 'activo: %s\n' "$(activo)"
    for s in blue green; do
      printf '%-6s %-10s %s\n' "$s" "$("${SYSTEMCTL[@]}" is-active "ganf@$s" 2>&1 || true)" "$(cut -c1-12 "$APP_DIR/$s.sha" 2>/dev/null || true)"
    done
    ;;
  *) die "Comando desconocido: $CMD (deploy | rollback | status)" ;;
esac

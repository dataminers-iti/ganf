# Deploy blue/green

Push a `main` → `.github/workflows/deploy.yml` (runner self-hosted) → `bun run check` → `bun run build` → `deploy/deploy.sh`.

```
Nginx (upstream "ganf") ──► 127.0.0.1:4161  ganf@blue   php -S sobre /home/hermes/apps/ganf/blue
                        └─► 127.0.0.1:4162  ganf@green  php -S sobre /home/hermes/apps/ganf/green
```

El tráfico apunta a un solo slot. Cada deploy llena el **inactivo**, lo arranca, verifica y recién
entonces cambia el upstream de Nginx. El slot anterior queda corriendo: rollback = volver a cambiar
el upstream, sin reconstruir.

## Archivos

| Archivo           | Para qué                                          |
| ----------------- | ------------------------------------------------- |
| `deploy.sh`       | `deploy [sha]` · `rollback` · `status`            |
| `ganf@.service`   | Unidad systemd plantilla (una instancia por slot) |
| `nginx/ganf.conf` | Vhost de ejemplo con `upstream ganf`              |

CI (`checks.yml`, `format.yml`) corre en runner de GitHub (`ubuntu-latest`) en PR y push a `main`:
`bun run check` = `lint` (oxlint) + `format:check` (oxfmt) + `test`.

## Setup único en el VPS

1. `mkdir -p /home/hermes/data/ganf/sessions` (la unidad lo exige: sin este directorio falla con `226/NAMESPACE`).
2. `sudo cp deploy/ganf@.service /etc/systemd/system/ && sudo systemctl daemon-reload`
3. `sudo systemctl enable ganf@blue ganf@green`
4. Crear `/home/hermes/deploy/env/ganf.env` (fuera del repo, `chmod 600`) con `DB_HOST`, `DB_NAME`, `DB_USER`, `DB_PASS`.
5. Cargar `setup.sql` en MySQL (`sgrsi_db`).
6. Instalar `deploy/nginx/ganf.conf`, crear `/etc/nginx/snippets/ganf-upstream.conf` con `server 127.0.0.1:4161;` y recargar Nginx.
7. Sudoers para el usuario del runner (sin password), solo estos comandos: `/usr/bin/systemctl`, `/usr/sbin/nginx`, `/usr/bin/tee /etc/nginx/snippets/ganf-upstream.conf`, `/usr/bin/journalctl`.
8. En GitHub: variable de repo `GANF_HEALTH_URL` con la URL real (ej. `https://ganf.example.com/`) y un runner con el label `vps-nexus` (o cambiar `runs-on` en `deploy.yml`).

## Health checks

- Slot: `GET /` → 200 y `GET /api/auth.php?accion=sesion` → 200 o 401 (la API abrió la conexión a la DB; 500 = DB caída).
- Dominio real: `GET $GANF_HEALTH_URL` → 200 después del switch. Si falla, el script vuelve al slot anterior solo.
- Si el slot nuevo no pasa el check, no se toca el tráfico.

## Operación

```bash
bash deploy/deploy.sh status
bash deploy/deploy.sh rollback          # o Actions → Deploy → Run workflow → rollback
sudo journalctl -u ganf@green -n 50
```

## Notas

- Los puertos (4161/4162) están en `deploy.sh`, `ganf@.service` y `nginx/ganf.conf`: cambiarlos en los tres.
- Las sesiones PHP viven en `/home/hermes/data/ganf/sessions`, compartidas entre slots: el login sobrevive al switch.
- Las migraciones de DB deben ser expand/contract: ambos slots comparten la base durante el switch.
- `php -S` (con `PHP_CLI_SERVER_WORKERS=4`) es suficiente para esta carga; si crece, migrar a php-fpm detrás del mismo Nginx sin tocar el flujo de slots.

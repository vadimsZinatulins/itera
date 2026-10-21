#!/bin/bash
# Host wrapper: every Node/Supabase/browser command executes in Docker.
set -euo pipefail
cd "$(dirname "$0")/.."
ROOT=$(pwd -P)
TOOLS=itera-owner-supabase-tools
SOCKET=${LOCAL_DOCKER_SOCKET:-/var/run/docker.sock}
COMMAND=${1:-help}
[[ $# -eq 0 ]] || shift
mkdir -p .local
umask 077
cli() {
  docker run --rm --add-host host.docker.internal:host-gateway \
    -v "$SOCKET:/var/run/docker.sock" -v "$ROOT:$ROOT" -w "$WORKDIR" \
    -e SUPABASE_SERVICES_HOSTNAME=host.docker.internal -e LOCAL_MAIL_CHAOS="${LOCAL_MAIL_CHAOS:-0}" "$TOOLS" "$@"
}
network() {
  docker network inspect "$PROJECT" >/dev/null 2>&1 || docker network create "$PROJECT" >/dev/null
}
# The tools image contains only dependencies and the Docker adapter; mount source for helpers.
make_env() {
  cli status -o json > "$WORKDIR/status.json" 2>"$WORKDIR/status.log"
  docker run --rm -v "$ROOT:$ROOT" -w "$ROOT" --entrypoint node "$TOOLS" \
    "$ROOT/scripts/local-env.mjs" "$WORKDIR/status.json" "$WORKDIR" "$PROJECT" "$ORIGIN"
  rm -f "$WORKDIR/status.json"
}
case "$COMMAND" in
  start)
    docker build --target supabase-tools -t "$TOOLS" .
    WORKDIR=$ROOT PROJECT=itera-owner-local ORIGIN=http://localhost:3100
    network
    cli start --network-id "$PROJECT" > .local/start.log 2>&1 || { echo 'Start failed; inspect .local/start.log (may contain local keys).'; exit 1; }
    # Keep generated environment outside the source root.
    cli status -o json > .local/status.json 2>.local/status.log
    docker run --rm -v "$ROOT:$ROOT" --entrypoint node "$TOOLS" \
      "$ROOT/scripts/local-env.mjs" "$ROOT/.local/status.json" "$ROOT/.local" "$PROJECT" "$ORIGIN"
    rm -f .local/status.json
    echo 'Local Supabase started. Inbox: http://localhost:55424. Run scripts/local.sh dev.'
    ;;
  stop)
    WORKDIR=$ROOT
    cli stop --project-id itera-owner-local > .local/stop.log 2>&1
    echo 'Local Supabase stopped; development data preserved.'
    ;;
  dev)
    [[ -f .local/app.env ]] || { echo 'Run scripts/local.sh start first.'; exit 1; }
    docker build --target development -t itera-owner-development .
    docker run --rm --name itera-owner-development --network itera-owner-local \
      --env-file .local/app.env -p 127.0.0.1:3100:3000 \
      -v "$ROOT:/app" -v itera-owner-dev-modules:/app/node_modules -v itera-owner-dev-next:/app/.next \
      itera-owner-development
    ;;
  test)
    # Fixed test ports require serial runs. Never reset the developer's local project.
    mkdir .local/test-lock 2>/dev/null || { echo 'A local test run is active (.local/test-lock).'; exit 1; }
    LOCAL_MAIL_CHAOS=1
    PROJECT="itera-owner-test-$$"
    WORKDIR="$ROOT/.local/$PROJECT"
    ORIGIN=http://app.test:3000
    APP="$PROJECT-app"
    cleanup() {
      code=$?
      trap - EXIT
      docker rm -f "$APP" >/dev/null 2>&1 || true
      if docker image inspect "$TOOLS" >/dev/null 2>&1; then
        cli stop --no-backup --project-id "$PROJECT" > "$WORKDIR/stop.log" 2>&1 || echo "Warning: cleanup failed for $PROJECT; see $WORKDIR/stop.log" >&2
      fi
      docker network rm "$PROJECT" >/dev/null 2>&1 || true
      rm -f "$WORKDIR/app.env" "$WORKDIR/test.env" "$WORKDIR/status.json"
      if [[ "$code" -eq 0 ]]; then
        rm -rf "$WORKDIR"
      else
        echo "Private diagnostic files retained in $WORKDIR; do not publish raw logs."
      fi
      rmdir .local/test-lock
      exit "$code"
    }
    mkdir -p "$WORKDIR/supabase"
    trap cleanup EXIT
    cp -R supabase/migrations supabase/templates "$WORKDIR/supabase/"
    awk -v id="$PROJECT" '{ gsub(/itera-owner-local/, id); gsub(/5542/, "5552"); print }' supabase/config.toml > "$WORKDIR/supabase/config.toml"
    docker build --target supabase-tools -t "$TOOLS" .
    docker build --target test -t itera-owner-test .
    docker build --target production -t itera-owner-production .
    network
    cli start --network-id "$PROJECT" > "$WORKDIR/start.log" 2>&1 || { echo "Start failed; inspect $WORKDIR/start.log before cleanup."; exit 1; }
    cli db reset --local --network-id "$PROJECT" > "$WORKDIR/reset.log" 2>&1
    make_env
    docker run -d --name "$APP" --network "$PROJECT" --network-alias app.test \
      --env-file "$WORKDIR/app.env" itera-owner-production >/dev/null
    docker run --rm --network "$PROJECT" --env-file "$WORKDIR/test.env" \
      itera-owner-test npm test -- "$@"
    ;;
  check)
    docker build --target dependencies -t itera-owner-check .
    docker run --rm -v "$ROOT:/app" -v itera-owner-check-modules:/app/node_modules \
      -v itera-owner-check-next:/app/.next itera-owner-check \
      sh -ec 'npm ci && npm run typecheck && npm run lint'
    ;;
  *) echo 'Usage: scripts/local.sh start|stop|dev|test [Playwright arguments]|check'; exit 2 ;;
esac

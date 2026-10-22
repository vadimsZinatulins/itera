#!/bin/bash
# Host entry point; all Supabase/Node tooling executes inside Docker.
set -euo pipefail
cd "$(dirname "$0")/.."
ROOT=$(pwd -P)
PROJECT=itera-owner-local
TOOLS=itera-owner-supabase-tools
SOCKET=${LOCAL_DOCKER_SOCKET:-/var/run/docker.sock}
FORCE=0

usage() {
  printf '%s\n' 'Usage: bash scripts/migrate.sh [--force]' \
    '  Default: apply pending migrations to the running local development database.' \
    '  --force: DELETE local accounts/content/keys and replay every migration.' \
    '           Requires typing RESET itera-owner-local. No hosted database support.'
}
case "${1:-}" in
  '') [[ $# -eq 0 ]] || { usage >&2; exit 2; } ;;
  --force) [[ $# -eq 1 ]] || { usage >&2; exit 2; }; FORCE=1 ;;
  --help|-h) [[ $# -eq 1 ]] || { usage >&2; exit 2; }; usage; exit 0 ;;
  *) usage >&2; exit 2 ;;
esac

# Do not accept arbitrary projects, connection strings, linked targets or CLI flags.
if ! grep -Eq '^project_id[[:space:]]*=[[:space:]]*"itera-owner-local"[[:space:]]*$' supabase/config.toml; then
  echo 'Refusing migration: supabase/config.toml must target itera-owner-local.' >&2
  exit 1
fi
command -v docker >/dev/null 2>&1 || { echo 'Docker is required. No host Node/Supabase fallback.' >&2; exit 1; }
docker info >/dev/null 2>&1 || { echo 'Docker is unavailable. Start Docker and try again.' >&2; exit 1; }
if [[ "$(docker inspect --format '{{.State.Running}}' "supabase_db_$PROJECT" 2>/dev/null || true)" != true ]]; then
  echo 'Local database is not running. Run bash scripts/local.sh start first.' >&2
  exit 1
fi

umask 077
mkdir -p .local
mkdir .local/migrate-lock 2>/dev/null || { echo 'Another migration is active (.local/migrate-lock). Inspect before removing a stale lock.' >&2; exit 1; }
trap 'rmdir "$ROOT/.local/migrate-lock"' EXIT

if [[ "$FORCE" == 1 ]]; then
  if [[ "$(docker inspect --format '{{.State.Running}}' itera-owner-development 2>/dev/null || true)" == true ]]; then
    echo 'Stop the local application with Ctrl-C before resetting its database.' >&2
    exit 1
  fi
  printf '\nWARNING: This resets ONLY the local itera-owner-local database.\n'
  printf 'All local accounts, Subjects, documents, conversations and saved API keys will be deleted.\n'
  printf 'No app-provided undo or recovery. Hosted databases are not targeted.\n'
  printf 'Type RESET itera-owner-local to continue: '
  confirmation=''
  if ! IFS= read -r confirmation || [[ "$confirmation" != "RESET $PROJECT" ]]; then
    echo 'Cancelled. No migrations or reset were run.' >&2
    exit 1
  fi
fi

docker build --target supabase-tools -t "$TOOLS" .
cli() {
  docker run --rm --add-host host.docker.internal:host-gateway \
    -v "$SOCKET:/var/run/docker.sock" -v "$ROOT:$ROOT" -w "$ROOT" \
    -e SUPABASE_SERVICES_HOSTNAME=host.docker.internal \
    "$TOOLS" "$@" --local --network-id "$PROJECT"
}
if [[ "$FORCE" == 1 ]]; then
  cli db reset --no-seed --yes
  echo 'Local database rebuilt from all migrations. Recreate your learner account and re-enter AI settings.'
else
  if ! cli migration up; then
    echo 'Migration failed. No reset or automatic history repair was attempted.' >&2
    echo 'If objects already exist, review schema/history before repairing records.' >&2
    echo 'Use --force ONLY if you intend to delete all local data and rebuild.' >&2
    exit 1
  fi
fi
cli migration list
echo 'Done. Start/restart the application with bash scripts/local.sh dev.'

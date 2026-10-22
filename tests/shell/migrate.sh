#!/bin/bash
# Exercise the host orchestration boundary without touching any real database.
set -euo pipefail
REPO=$(cd "$(dirname "$0")/../.." && pwd -P)
TEMP=$(mktemp -d)
trap 'rm -rf "$TEMP"' EXIT
ROOT="$TEMP/repo with spaces"
mkdir -p "$ROOT/scripts" "$ROOT/supabase" "$TEMP/bin"
cp "$REPO/scripts/migrate.sh" "$ROOT/scripts/migrate.sh"
printf 'project_id = "itera-owner-local"\n' > "$ROOT/supabase/config.toml"
export DOCKER_CALLS="$TEMP/calls" SCENARIO=ok
cat > "$TEMP/bin/docker" <<'MOCK'
#!/bin/bash
set -euo pipefail
printf '%s\n' "$*" >> "$DOCKER_CALLS"
case "$1" in
  info) [[ "$SCENARIO" != unavailable ]] ;;
  inspect)
    case "${*: -1}" in
      supabase_db_itera-owner-local) [[ "$SCENARIO" != stopped ]] && echo true ;;
      itera-owner-development) [[ "$SCENARIO" == app-running ]] && echo true || echo false ;;
      *) exit 1 ;;
    esac ;;
  build) exit 0 ;;
  run)
    [[ "$SCENARIO" != migration-failed || "$*" != *'migration up'* ]] ;;
  *) exit 1 ;;
esac
MOCK
chmod +x "$TEMP/bin/docker"
export PATH="$TEMP/bin:$PATH"
run() {
  : > "$DOCKER_CALLS"
  bash "$ROOT/scripts/migrate.sh" "$@" > "$TEMP/output" 2>&1
}
fail() { echo "FAIL: $*" >&2; exit 1; }
reject() { if run "$@"; then fail "Unexpected success: $*"; fi; }
no_mutation() {
  if grep -Eq '^build |^run ' "$DOCKER_CALLS"; then fail 'Unexpected build/migration/reset'; fi
}

run --help
[[ ! -s "$DOCKER_CALLS" ]] || fail 'Help contacted Docker'
reject --linked; no_mutation
reject --force --yes; no_mutation
reject ''; no_mutation
SCENARIO=unavailable; reject; no_mutation
SCENARIO=stopped; reject; no_mutation
SCENARIO=ok
run
grep -Fq 'migration up --local --network-id itera-owner-local' "$DOCKER_CALLS" || fail 'Default did not migrate locally'
grep -Fq 'migration list --local --network-id itera-owner-local' "$DOCKER_CALLS" || fail 'History not listed'
! grep -Fq 'db reset' "$DOCKER_CALLS" || fail 'Default reset data'
SCENARIO=migration-failed; reject
! grep -Eq 'db reset|migration repair' "$DOCKER_CALLS" || fail 'Failure triggered destructive fallback'
SCENARIO=ok
if run --force </dev/null; then fail 'EOF confirmed reset'; fi
no_mutation
if run --force <<< 'RESET another-project'; then fail 'Wrong confirmation reset data'; fi
no_mutation
SCENARIO=app-running
if run --force <<< 'RESET itera-owner-local'; then fail 'Reset while application running'; fi
no_mutation
SCENARIO=ok
run --force <<< 'RESET itera-owner-local'
grep -Fq 'db reset --no-seed --yes --local --network-id itera-owner-local' "$DOCKER_CALLS" || fail 'Force did not use local reset'
! grep -Fq 'migration repair' "$DOCKER_CALLS" || fail 'Force faked history instead of rebuilding'
[[ ! -d "$ROOT/.local/migrate-lock" ]] || fail 'Lock not cleaned up'
mkdir "$ROOT/.local/migrate-lock"
reject; no_mutation
rmdir "$ROOT/.local/migrate-lock"
printf 'project_id = "some-other-project"\n' > "$ROOT/supabase/config.toml"
reject; no_mutation
[[ ! -s "$DOCKER_CALLS" ]] || fail 'Unexpected project contacted Docker'
echo 'PASS: migration script defaults, force confirmation, local-only scope, failure handling and locks'

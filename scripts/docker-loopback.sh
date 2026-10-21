#!/bin/bash
# The CLI's unqualified published ports must never expose local Auth/admin/email
# services to the LAN. This adapter runs only in the trusted Supabase tools image.
set -euo pipefail
args=()
qualify() {
  if [[ "$1" =~ ^[0-9]+:[0-9]+(/tcp|/udp)?$ ]]; then
    printf '127.0.0.1:%s' "$1"
  else
    printf '%s' "$1"
  fi
}
while (($#)); do
  case "$1" in
    -p|--publish)
      args+=("$1" "$(qualify "$2")")
      shift 2
      ;;
    --publish=*)
      args+=("--publish=$(qualify "${1#--publish=}")")
      shift
      ;;
    *) args+=("$1"); shift ;;
  esac
done
# Enable SMTP fault injection only in isolated synthetic test stacks. No such
# environment variable or control endpoint exists in the production application.
if [[ "${LOCAL_MAIL_CHAOS:-0}" == 1 && "${args[0]:-}" == create ]]; then
  for ((i=0; i<${#args[@]}-1; i++)); do
    if [[ "${args[i]}" == --name && "${args[i+1]}" == supabase_inbucket_itera-owner-test-* ]]; then
      args=(create --env MP_ENABLE_CHAOS=true "${args[@]:1}")
      break
    fi
  done
fi
exec /usr/local/bin/docker-real "${args[@]}"

#!/usr/bin/env bash
# Throwaway design study. All Node tooling stays inside Docker.
set -euo pipefail
cd "$(dirname "$0")/.."
name=itera-learning-profile-prototype
if docker container inspect "$name" >/dev/null 2>&1; then
  docker start "$name" >/dev/null
else
  docker build -t itera-learning-profile-prototype .
  docker run -d --name "$name" -p 3001:3000 \
    -v "$PWD:/app" -v /app/node_modules \
    itera-learning-profile-prototype npm run dev >/dev/null
fi
printf '\nLearning profile study: http://localhost:3001/?variant=B\nOne Learning Trail. Knowledge views: A: Topic landscape · B: Connected concepts · C: Evidence trail\nStop: docker stop %s\n' "$name"

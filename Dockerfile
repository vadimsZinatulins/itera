FROM docker:29-cli@sha256:2a146f3eb1ee1015c482756624bbff3a94a1b0531cad6fca03be55943373cf95 AS docker-cli

FROM node:24-bookworm AS dependencies
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM dependencies AS supabase-tools
COPY --from=docker-cli /usr/local/bin/docker /usr/local/bin/docker-real
COPY scripts/docker-loopback.sh /usr/local/bin/docker
RUN chmod 755 /usr/local/bin/docker
ENV DOCKER_HOST=unix:///var/run/docker.sock SUPABASE_EXPERIMENTAL_STACK=0 SUPABASE_TELEMETRY_DISABLED=1
ENTRYPOINT ["/app/node_modules/.bin/supabase"]

FROM dependencies AS browser-dependencies
RUN npx playwright install --with-deps chromium

FROM dependencies AS development
COPY . .
EXPOSE 3000
CMD ["npm", "run", "dev"]

FROM dependencies AS build
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

FROM browser-dependencies AS test
COPY . .
COPY --from=build /app/.next ./.next
CMD ["npm", "test"]

FROM node:24-bookworm-slim AS production
WORKDIR /app
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 HOSTNAME=0.0.0.0 PORT=3000
COPY --from=build --chown=node:node /app/.next/standalone ./
COPY --from=build --chown=node:node /app/.next/static ./.next/static
COPY --from=build --chown=node:node /app/public ./public
USER node
EXPOSE 3000
CMD ["node", "server.js"]

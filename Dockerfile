FROM node:24.1.0-slim AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
# pre-install pnpm
RUN pnpm version

FROM base AS deps
RUN --mount=type=cache,id=pnpm,target=/root/.local/share/pnpm/store pnpm fetch --frozen-lockfile
RUN --mount=type=cache,id=pnpm,target=/root/.local/share/pnpm/store pnpm install --frozen-lockfile --prod

FROM base
COPY src ./src
COPY public ./public
COPY --from=deps /app/node_modules /app/node_modules
EXPOSE 3000
CMD [ "pnpm", "start" ]

FROM node:20 AS base
WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.base.json ./
COPY lib ./lib
COPY artifacts/api-server ./artifacts/api-server

RUN corepack enable && pnpm install --no-frozen-lockfile

WORKDIR /app/artifacts/api-server
RUN pnpm run build

ENV NODE_ENV=production
EXPOSE 4000
CMD ["node", "--enable-source-maps", "./dist/index.mjs"]

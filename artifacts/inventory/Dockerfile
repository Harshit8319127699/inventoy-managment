FROM node:20 AS base
WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.base.json ./
COPY artifacts/inventory ./artifacts/inventory
COPY lib ./lib

RUN corepack enable && pnpm install --no-frozen-lockfile

WORKDIR /app/artifacts/inventory

ARG PORT=5173
ARG BASE_PATH=/
ARG VITE_API_BASE_URL=http://localhost:4000/api
ENV PORT=$PORT
ENV BASE_PATH=$BASE_PATH
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

RUN pnpm run build

EXPOSE 5173
CMD ["pnpm", "run", "serve"]

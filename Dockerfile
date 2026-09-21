# Build stage
FROM node:22-alpine AS builder

WORKDIR /app

# Enable pnpm via corepack
RUN corepack enable && corepack prepare pnpm@latest --activate

COPY package.json pnpm-lock.yaml* tsconfig.json ./
RUN pnpm install --frozen-lockfile || pnpm install

COPY src/ ./src/
RUN pnpm run build

# Runtime stage
FROM node:22-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production
ENV DATAMINT_TRANSPORT=sse
ENV PORT=3001
ENV HOST=0.0.0.0

RUN corepack enable && corepack prepare pnpm@latest --activate

COPY package.json ./
RUN pnpm install --prod

COPY --from=builder /app/dist ./dist
COPY bin/ ./bin/
RUN chmod +x bin/datamint-mcp.js

EXPOSE 3001

CMD ["node", "bin/datamint-mcp.js", "--transport", "sse"]

# Build stage
FROM node:22-alpine AS builder

WORKDIR /app

RUN npm install -g pnpm@10

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

RUN npm install -g pnpm@10

COPY package.json pnpm-lock.yaml* ./
RUN pnpm install --prod --ignore-scripts

COPY --from=builder /app/dist ./dist
COPY bin/ ./bin/
RUN chmod +x bin/datamint-mcp.js

EXPOSE 3001

CMD ["node", "bin/datamint-mcp.js", "--transport", "sse"]

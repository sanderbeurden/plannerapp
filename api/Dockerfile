FROM oven/bun:1.1.38

WORKDIR /app

COPY package.json bun.lock ./
RUN bun install --production

COPY src ./src
COPY migrations ./migrations

ENV NODE_ENV=production
ENV PORT=8080

CMD ["bun", "src/index.ts"]

FROM node:22-alpine

RUN npm install -g pnpm@10

WORKDIR /app

COPY artifacts/discord-bot/package.json ./package.json

RUN pnpm install --include=optional

COPY artifacts/discord-bot/src ./src
COPY artifacts/discord-bot/tsconfig.json ./tsconfig.json

CMD ["pnpm", "run", "dev"]

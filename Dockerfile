FROM node:22-alpine

WORKDIR /app

COPY artifacts/discord-bot/package.json ./package.json

RUN npm install

COPY artifacts/discord-bot/src ./src
COPY artifacts/discord-bot/tsconfig.json ./tsconfig.json

CMD ["npx", "tsx", "src/index.ts"]

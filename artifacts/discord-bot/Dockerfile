FROM node:22-alpine

WORKDIR /app

COPY package.json ./

RUN npm install

COPY src ./src
COPY tsconfig.json ./tsconfig.json

CMD ["npx", "tsx", "src/index.ts"]

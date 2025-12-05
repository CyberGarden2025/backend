FROM node:20 AS builder

WORKDIR /app

COPY package*.json ./
RUN yarn install --verbose

COPY . .

RUN yarn build

CMD yarn db:setup && node dist/main.js
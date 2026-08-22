# syntax=docker/dockerfile:1.7

FROM node:26-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

RUN --mount=type=secret,id=env \
    cp /run/secrets/env .env.production && \
    npm run build 

FROM nginx:1.27-alpine

COPY --from=builder /app/dist /usr/share/nginx/html

COPY ./nginx/conf.d/default.conf /etc/nginx/conf.d/default.conf

EXPOSE 3000

CMD ["nginx", "-g", "daemon off;"]
# Stage 1: Build
FROM node:20-alpine as build

WORKDIR /app

COPY ./frontend ./frontend
COPY ./backend/src/types.ts ./backend/src/types.ts

WORKDIR /app/frontend

RUN npm install
RUN npm run build

# Stage 2: Serve
FROM nginx:alpine

COPY --from=build /app/frontend/dist /usr/share/nginx/html
COPY ./frontend/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]

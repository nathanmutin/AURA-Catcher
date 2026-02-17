# Stage 1: Build
FROM node:alpine AS build

WORKDIR /app

# Copy root package files
COPY package*.json ./

# Copy workspace package files
COPY backend/package.json ./backend/
COPY frontend/package.json ./frontend/
COPY shared/package.json ./shared/

# Install dependencies at root level
RUN npm install

# Copy source code
COPY ./frontend ./frontend
COPY ./shared ./shared

# Build shared workspace
RUN npm run build --workspace=@aura-catcher/shared

# Build frontend
WORKDIR /app/frontend
RUN npm run build

# Stage 2: Serve
FROM nginx:alpine

COPY --from=build /app/frontend/dist /usr/share/nginx/html
COPY ./frontend/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]

FROM node:alpine

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
COPY ./backend ./backend
COPY ./shared ./shared

# Build shared workspace
RUN npm run build --workspace=@aura-catcher/shared

# Build backend
WORKDIR /app/backend
RUN npm run build

EXPOSE 3000

CMD ["node", "dist/backend/src/index.js"]

FROM node:23-alpine as builder

WORKDIR /app

# Copy root package.json for workspace setup
COPY package.json ./

# Copy shared package
COPY shared/ ./shared/

# Copy client package files
COPY client/package*.json ./client/

# Install all dependencies (including dev dependencies for build)
RUN npm install

# Copy client source code (excluding tests)
COPY client/src/ ./client/src/
COPY client/public/ ./client/public/
COPY client/index.html ./client/
COPY client/vite.config.ts ./client/
COPY client/tsconfig*.json ./client/

WORKDIR /app/client

RUN npm run build

FROM nginx:alpine

COPY --from=builder /app/client/dist /usr/share/nginx/html

COPY client/nginx.conf /etc/nginx/nginx.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
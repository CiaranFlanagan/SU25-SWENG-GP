FROM node:23-alpine

WORKDIR /app

# Copy root package.json for workspace setup
COPY package.json ./

# Copy shared package
COPY shared/ ./shared/

# Copy client package files
COPY client/package*.json ./client/

# Copy server package files
COPY server/package*.json ./server/

# Install dependencies from root
RUN npm install

# Copy client source code and build
COPY client/src/ ./client/src/
COPY client/public/ ./client/public/
COPY client/tsconfig*.json ./client/
COPY client/vite.config.ts ./client/
COPY client/eslint.config.mjs ./client/
COPY client/index.html ./client/
RUN npm run build -w=client

# Copy server source code
COPY server/src/ ./server/src/
COPY server/tsconfig.json ./server/

WORKDIR /app/server

EXPOSE 8000

CMD ["npm", "start"]
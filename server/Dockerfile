FROM node:23-alpine

WORKDIR /app

# Copy root package.json for workspace setup
COPY package.json ./

# Copy shared package
COPY shared/ ./shared/

# Copy server package files
COPY server/package*.json ./server/

# Install dependencies from root
RUN npm install

# Copy server source code
COPY server/src/ ./server/src/
COPY server/tsconfig.json ./server/

WORKDIR /app/server

EXPOSE 8000

CMD ["npm", "start"]
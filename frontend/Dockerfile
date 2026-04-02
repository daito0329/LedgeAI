FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm install

COPY . .

# Entrypoint: always ensure deps are installed, then start dev server
CMD ["sh", "-c", "npm install && npm run dev -- --host 0.0.0.0 --port 3000"]

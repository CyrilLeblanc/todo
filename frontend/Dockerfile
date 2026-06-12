# ---- Étape 1 : Build ----
FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# ---- Étape 2 : Serveur statique (nginx) ----
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
# Proxy inverse : redirige /api vers le backend
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]

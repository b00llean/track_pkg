# Multi-stage Dockerfile for track_pkg
# Stage 1: Build static web bundle
FROM node:20-alpine AS builder
WORKDIR /app

COPY package*.json ./
RUN npm ci

ARG VITE_17TRACK_API_KEY
ENV VITE_17TRACK_API_KEY=$VITE_17TRACK_API_KEY

COPY . .
RUN mkdir -p public dist && echo "window.__ENV__ = window.__ENV__ || {}; window.__ENV__.VITE_17TRACK_API_KEY = \"${VITE_17TRACK_API_KEY}\";" > public/env-config.js
RUN npm run build
RUN echo "window.__ENV__ = window.__ENV__ || {}; window.__ENV__.VITE_17TRACK_API_KEY = \"${VITE_17TRACK_API_KEY}\";" > dist/env-config.js

# Stage 2: Serve with lightweight Nginx server (~25MB image)
FROM nginx:alpine AS runner
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]

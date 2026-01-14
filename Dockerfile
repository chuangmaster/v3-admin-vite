# 建構階段
FROM node:lts AS builder
WORKDIR /app
COPY . .
RUN corepack enable && corepack prepare pnpm@latest --activate
RUN CI=true pnpm install --frozen-lockfile
ENV VITE_PUBLIC_PATH=/
RUN pnpm exec vite build

# 運行階段
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY ./nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]

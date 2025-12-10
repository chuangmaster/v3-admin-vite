# 建構階段
FROM node:lts AS builder
WORKDIR /app
COPY . .
RUN corepack enable && corepack prepare pnpm@latest --activate
RUN CI=true pnpm install --frozen-lockfile

# 可在 build 時傳入環境變數覆寫預設值
ARG VITE_BASE_URL=/api
ARG VITE_PUBLIC_PATH=/
ENV VITE_BASE_URL=${VITE_BASE_URL}
ENV VITE_PUBLIC_PATH=${VITE_PUBLIC_PATH}

RUN pnpm run build

# 運行階段
FROM nginx:alpine

# 安裝 envsubst 用於替換環境變數（alpine 預設已包含）
COPY --from=builder /app/dist /usr/share/nginx/html
COPY ./nginx.conf /etc/nginx/templates/default.conf.template

# 設定預設的後端 URL（可在 Railway 中覆寫）
ENV BACKEND_URL=https://your-backend-url.railway.app

EXPOSE 80

# 使用 envsubst 替換 nginx 配置中的環境變數，然後啟動 nginx
CMD ["/bin/sh", "-c", "envsubst '${BACKEND_URL}' < /etc/nginx/templates/default.conf.template > /etc/nginx/conf.d/default.conf && nginx -g 'daemon off;'"]

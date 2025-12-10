# Railway 部署指南

## 配置說明

此專案已配置為透過 Nginx 反向代理來解決 CORS 問題。

### 架構說明

```
前端請求: /api/Auth/login
    ↓
Nginx 反向代理
    ↓
後端: ${BACKEND_URL}/api/Auth/login
```

## Railway 環境變數設定

在 Railway 專案中設定以下環境變數：

### 必要環境變數

```
BACKEND_URL=https://你的後端服務.railway.app
```

**重要：** `BACKEND_URL` 應該是後端服務的根 URL，**不要**包含 `/api` 路徑。

例如：
- ✅ 正確：`https://real-you-backend.up.railway.app`
- ❌ 錯誤：`https://real-you-backend.up.railway.app/api`

## 部署步驟

1. **推送代碼到 GitHub**
   ```bash
   git add .
   git commit -m "Configure Nginx reverse proxy"
   git push
   ```

2. **在 Railway 設定環境變數**
   - 進入 Railway 專案
   - 點擊 Variables 標籤
   - 新增環境變數：`BACKEND_URL=https://你的後端服務.railway.app`

3. **重新部署**
   - Railway 會自動偵測更改並重新部署
   - 或手動觸發重新部署

## 本地測試

### 測試 Docker 容器

```bash
# 建構映像
docker build -t real-you-frontend .

# 運行容器（替換成你的後端 URL）
docker run -p 8080:80 -e BACKEND_URL=https://你的後端服務.railway.app real-you-frontend

# 在瀏覽器開啟
# http://localhost:8080
```

### 驗證配置

1. 開啟瀏覽器開發者工具（F12）
2. 切換到 Network 標籤
3. 嘗試登入
4. 檢查請求 URL 應該是：`https://你的前端域名/api/Auth/login`
5. 檢查 Response Headers 應該來自你的後端

## 故障排除

### 404 錯誤

如果登入時遇到 404 錯誤，檢查：

1. **BACKEND_URL 是否正確設定**
   ```bash
   # 在 Railway 容器中檢查環境變數
   echo $BACKEND_URL
   ```

2. **後端 API 路徑是否正確**
   - 確認後端 API 路徑格式：`${BACKEND_URL}/api/Auth/login`

3. **檢查 Nginx 配置**
   ```bash
   # 進入容器查看 nginx 配置
   docker exec -it <container-id> cat /etc/nginx/conf.d/default.conf
   ```

### CORS 錯誤

如果仍然遇到 CORS 錯誤：

1. 確認前端使用相對路徑 `/api`
2. 確認 Nginx 正確轉發請求
3. 檢查後端日誌，確認請求有到達

### 502 Bad Gateway

這表示 Nginx 無法連接到後端：

1. 檢查 `BACKEND_URL` 是否可訪問
2. 檢查後端服務是否正在運行
3. 檢查後端 URL 是否包含 HTTPS（Railway 預設使用 HTTPS）

## 檔案說明

- `.env.production` - 生產環境配置，`VITE_BASE_URL=/api` 使用相對路徑
- `nginx.conf` - Nginx 配置，將 `/api/*` 轉發到 `${BACKEND_URL}/api/*`
- `Dockerfile` - Docker 配置，支援動態環境變數

## 注意事項

1. **環境變數必須在建構時注入** - Railway 會自動處理
2. **不需要在後端設定 CORS** - 因為請求來自同源（透過 Nginx 代理）
3. **BACKEND_URL 不要包含結尾斜線** - Nginx 配置會自動處理路徑

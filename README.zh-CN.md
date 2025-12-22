<div align="center">
  <img alt="logo" width="120" height="120" src="./src/common/assets/images/layouts/logo.png">
  <h1>V3 Admin Vite - 快速後台搭建方案</h1>
</div>

<b><a href="./README.md">English</a> | 中文</b>

## 簡介

本專案基於 [V3 Admin Vite](https://github.com/un-pany/v3-admin-vite) 進行深度客製化調整，專注於提供**開箱即用的前後端後台管理系統解決方案**。透過整合完整的業務模組與標準化的 API 契約，實現快速搭配後端專案、快速上線的目標。

### 核心特色

✨ **業務模組完整**：內建用戶管理、角色管理、權限管理等核心後台功能
🔗 **後端契約對接**：嚴格遵循 OpenAPI 規格，與後端 API 無縫整合
🚀 **快速搭建**：清晰的目錄結構與規範化開發流程，降低學習成本
📦 **開箱即用**：完整的 CRUD 範例、權限控制、Excel 匯出等常用功能
🎨 **企業級品質**：基於 Vue 3 + TypeScript + Element Plus 的現代化技術棧

> [!IMPORTANT]
> 本專案適合需要快速搭建企業級後台管理系統的團隊使用，特別是與配套後端專案配合使用時效果最佳。

## 後端專案

> [!IMPORTANT]
> **配套後端專案**：[V3.Admin.Backend](https://github.com/chuangmaster/V3.Admin.Backend)
>
> 本前端專案專為與配套後端無縫協作而設計。後端專案提供：
>
> - 遵循 OpenAPI 規格的 RESTful APIs
> - JWT 身份驗證與授權機制
> - 用戶、角色、權限管理端點
> - 完整的 API 文件與契約

> [!TIP]
> 為獲得最佳開發體驗，建議同時克隆並運行前後端專案。前端已預先配置為連接後端位址 `http://localhost:5176`。

## 快速開始

### 環境要求

- **Node.js**: 20.19+ 或 22.12+
- **pnpm**: 10+
- **IDE**: Visual Studio Code (推薦安裝 `.vscode/extensions.json` 中的推薦插件)

### 本地開發

```bash
# 1. 克隆專案
git clone <your-repository-url>

# 2. 進入專案目錄
cd v3-admin-vite

# 3. 安裝依賴
pnpm i

# 4. 配置環境變數（可選）
# 編輯 .env.development 設定後端 API 位址
# VITE_BASE_URL = http://localhost:5176

# 5. 啟動開發伺服器
pnpm dev
```

啟動成功後瀏覽器會自動開啟 `http://localhost:3333`

### 後端對接

本專案預設配置為對接後端 API 位於 `http://localhost:5176`，所有 API 請求都遵循 OpenAPI 規格文件定義：

1. **設定 API Base URL**：在 `.env.development` 中調整 `VITE_BASE_URL`
2. **API 代理配置**：開發環境已配置 `/api` 路徑的反向代理，見 `vite.config.ts`
3. **API 契約文件**：參考 `specs/` 目錄下各模組的 API 契約文件

**後端啟動順序**：

1. 先啟動後端專案（預設 5176 埠）
2. 再啟動前端專案（預設 3333 埠）

### 打包建置

```bash
# 打包預發布環境
pnpm build:staging

# 打包生產環境
pnpm build
```

### 本地預覽

```bash
# 先執行打包命令生成 dist 目錄，再執行預覽
pnpm preview
```

### 程式碼檢查與測試

```bash
# 程式碼校驗與格式化
pnpm lint

# 單元測試
pnpm test
```

## 專案特色

### 📦 內建業務模組

本專案已整合完整的後台管理核心功能：

#### 1. 用戶管理模組

- ✅ 用戶列表查詢（分頁、搜尋、篩選）
- ✅ 新增用戶（密碼強度驗證、角色指派）
- ✅ 編輯用戶資訊
- ✅ 刪除用戶（軟刪除機制）
- ✅ 匯出 Excel 報表
- ✅ 完整的權限控制（路由級 + 按鈕級）
- ✅ 密碼變更功能

#### 2. 角色管理模組

- ✅ 角色列表查詢
- ✅ 新增/編輯/刪除角色
- ✅ 角色權限指派
- ✅ 並發更新衝突處理
- ✅ 角色使用狀態檢查

#### 3. 權限管理模組

- ✅ 權限列表查詢
- ✅ 新增/編輯/刪除權限
- ✅ 權限代碼格式驗證
- ✅ 權限使用狀態檢查
- ✅ 層級權限結構

### 🔗 標準化 API 整合

- **OpenAPI 規格遵循**：所有 API 呼叫嚴格遵循後端 OpenAPI 規格文件
- **統一回應格式**：`ApiResponse<T>` 標準化回應結構（success, code, message, data, timestamp, traceId）
- **完整錯誤處理**：涵蓋驗證錯誤、授權錯誤、並發衝突等業務邏輯錯誤碼
- **JWT 認證**：自動攜帶 Bearer Token，統一攔截處理未授權情況
- **API 契約文件**：每個模組都有詳細的 API 契約文件（`specs/*/contracts/api-contracts.md`）

### 🎯 開發規範化

- **清晰的目錄結構**：按業務模組劃分，公私資源分離
- **型別安全**：完整的 TypeScript 型別定義
- **組合式函式**：可重用的業務邏輯封裝
- **單元測試**：核心功能都有對應的測試案例
- **開發文件**：每個模組都有完整的 spec、quickstart、tasks 等文件

## 專案結構

```
v3-admin-vite
├─ specs/                    # 功能規格文件
│  ├─ 001-user-management/   # 用戶管理模組規格
│  ├─ 002-permission-management/  # 權限管理模組規格
│  └─ 003-role-management/   # 角色管理模組規格
├─ src/
│  ├─ common/                # 通用目錄（@@別名）
│  │  ├─ apis/               # 通用 API（用戶資訊等）
│  │  ├─ components/         # 通用元件
│  │  ├─ composables/        # 通用組合式函式
│  │  ├─ constants/          # 通用常數（API 錯誤碼等）
│  │  └─ utils/              # 通用工具函式
│  ├─ pages/                 # 業務頁面
│  │  ├─ user-management/    # 用戶管理模組
│  │  │  ├─ apis/            # 模組私有 API
│  │  │  ├─ components/      # 模組私有元件
│  │  │  ├─ composables/     # 模組私有組合式函式
│  │  │  ├─ types/           # 模組型別定義
│  │  │  └─ index.vue        # 模組頁面
│  │  ├─ role-management/    # 角色管理模組
│  │  ├─ permission-management/  # 權限管理模組
│  │  ├─ dashboard/          # 儀表板
│  │  └─ login/              # 登入頁面
│  ├─ http/                  # 網路請求配置
│  ├─ router/                # 路由配置
│  ├─ pinia/                 # 狀態管理
│  ├─ layouts/               # 版型配置
│  └─ plugins/               # 插件配置
├─ tests/                    # 單元測試
├─ types/                    # 全域型別定義
└─ ...配置檔案
```

### 核心目錄說明

- **`specs/`**：每個功能模組的完整規格文件，包含需求分析、API 契約、開發任務等
- **`src/common/`**：跨模組共用的資源，透過 `@@` 別名引用
- **`src/pages/[module]/`**：按業務模組劃分，每個模組自包含 API、元件、邏輯
- **`src/http/axios.ts`**：統一的 HTTP 客戶端，處理認證、錯誤攔截、回應格式化

## 技術棧

**核心框架**

- Vue 3.5+ (Composition API + `<script setup>`)
- TypeScript 5.9+
- Vite 6.3+

**UI 與樣式**

- Element Plus 2.11+ (企業級元件庫)
- UnoCSS (原子化 CSS)
- Scss (CSS 預處理器)

**狀態與路由**

- Vue Router 4.5+
- Pinia 3.0+ (狀態管理)

**開發工具**

- ESLint 9+ (程式碼檢查與格式化)
- Vitest (單元測試)
- pnpm (套件管理)

**其他套件**

- Axios (HTTP 請求)
- VXE Table (高效能表格)
- XLSX (Excel 匯出)
- dayjs (日期處理)

## 核心功能

### 🔐 權限控制系統

- **路由級權限**：基於角色的動態路由，無權限自動導向 403
- **按鈕級權限**：自訂指令與權限函式，細粒度控制操作按鈕顯示
- **路由守衛**：全域守衛自動驗證 JWT Token 與權限

### 📦 業務模組

#### 用戶管理
- 用戶列表查詢、新增、編輯、刪除
- 批次匯入與匯出
- 密碼變更與重置
- 角色指派

#### 角色管理
- 角色 CRUD 操作
- 權限指派與管理
- 角色層級控制

#### 權限管理
- 權限 CRUD 操作
- 權限代碼管理
- 權限分組

#### 🆕 服務單管理
- **收購單管理**：客戶資訊、商品項目、身分證明上傳、AI 辨識、線上/線下簽名
- **寄賣單管理**：包含收購單功能，額外支援配件選擇、瑕疵記錄、寄賣日期、續約設定
- **客戶管理**：多維度搜尋（姓名、電話、Email、身分證字號）、支援台灣與外籍人士格式
- **查詢與管理**：列表查詢、詳細資訊、附件管理、修改歷史追蹤、Excel 匯出
- **簽名功能**：觸控簽名板（signature_pad）、Dropbox Sign 線上簽名整合
- **OCR 辨識**：身分證 AI 辨識（後端 Azure Vision + Google Gemini）

### 🎨 版型與主題

- **三種版型模式**：左側、頂部、混合版型可切換
- **三種主題模式**：普通、深色、深藍主題
- **響應式設計**：完整支援移動端瀏覽

### 📊 表格與資料

- **高效能表格**：使用 VXE Table 處理大量資料
- **分頁控制**：標準化分頁元件與邏輯封裝
- **Excel 匯出**：一鍵匯出查詢結果為 Excel 檔案
- **搜尋與篩選**：完整的查詢條件組合

### 🛡️ 錯誤處理

- **統一錯誤攔截**：Axios 攔截器處理所有 HTTP 與業務錯誤
- **錯誤碼對應**：後端錯誤碼自動對應多語系錯誤訊息
- **友善錯誤提示**：ElMessage 顯示清晰的錯誤訊息
- **錯誤頁面**：403、404 等錯誤頁面

### 🌐 國際化

- **多語系支援**：中英文切換（vue-i18n）
- **動態語系載入**：按需載入語系檔案

### 🧪 測試與品質

- **單元測試**：核心業務邏輯與元件測試
- **程式碼檢查**：ESLint 自動格式化與錯誤檢測
- **Git Hooks**：Husky + lint-staged 提交前自動檢查

## 開發指南

### 新增業務模組

本專案採用**模組化開發**，每個業務模組自包含所有資源。參考現有模組（如 `user-management`）：

1. **建立模組目錄**：`src/pages/[module-name]/`
2. **定義 API 與型別**：
   - `apis/[module].ts` - API 函式
   - `types/index.ts` - 型別定義
3. **建立組合式函式**：`composables/use[Module].ts` - 業務邏輯
4. **建立元件**：`components/` - 表格、表單等
5. **建立頁面**：`index.vue` - 頁面入口
6. **配置路由**：在 `src/router/` 新增路由定義

### API 呼叫規範

所有 API 呼叫必須使用 `@/http/axios` 的 `request` 函式：

```typescript
import type { ApiResponse } from "types/api"
import { request } from "@/http/axios"

export async function getUserList(params: UserQuery): Promise<ApiResponse<UserListResponse>> {
  return request({
    url: "/api/accounts",
    method: "GET",
    params
  })
}
```

### 權限控制使用

**路由權限**：在路由 meta 中定義

```typescript
{
  path: "/user-management",
  meta: {
    title: "用戶管理",
    permissions: ["user:view"]  // 需要的權限代碼
  }
}
```

**按鈕權限**：使用 `v-permission` 指令

```text
<el-button v-permission="['user:create']">新增用戶</el-button>
```

### 組合式函式開發

將可重用的業務邏輯抽取為組合式函式：

```typescript
// composables/useUserManagement.ts
export function useUserManagement() {
  const tableData = ref<User[]>([])
  const loading = ref(false)

  async function fetchUsers() {
    loading.value = true
    try {
      const res = await getUserList(queryParams)
      tableData.value = res.data.items
    } finally {
      loading.value = false
    }
  }

  return { tableData, loading, fetchUsers }
}
```

## Git 提交規範

本專案使用 Conventional Commits 規範：

- `feat`: 新增功能
- `fix`: 修復錯誤
- `perf`: 效能優化
- `refactor`: 程式碼重構
- `docs`: 文件與註解
- `types`: 型別相關變更
- `test`: 測試相關
- `ci`: CI/CD 相關
- `revert`: 撤銷變更
- `chore`: 雜項（更新依賴、修改配置等）

**範例**：

```bash
git commit -m "feat: 新增用戶批次刪除功能"
git commit -m "fix: 修復角色權限指派並發衝突問題"
```

## 常見問題

### 如何配置後端 API 位址？

編輯對應環境的 `.env` 檔案：

- 開發環境：`.env.development`
- 預發環境：`.env.staging`
- 生產環境：`.env.production`

修改 `VITE_BASE_URL` 變數：

```bash
VITE_BASE_URL = http://your-backend-api-url
```

### 如何新增新的權限？

1. 在後端新增權限定義
2. 在前端 `src/router/` 中對應路由的 `meta.permissions` 新增權限代碼
3. 在按鈕上使用 `v-permission` 指令控制顯示

### API 回應格式是什麼？

所有 API 遵循統一的回應格式：

```typescript
{
  success: boolean // 是否成功
  code: string // 業務狀態碼（如 "SUCCESS", "VALIDATION_ERROR"）
  message: string // 訊息說明
  data: T | null // 實際資料
  timestamp: string // 時間戳記
  traceId: string // 追蹤 ID
}
```

### 如何處理並發更新衝突？

本專案已實作樂觀鎖機制（RowVersion），當發生並發衝突時：

1. 後端回傳 `CONCURRENT_UPDATE_CONFLICT` 錯誤碼
2. 前端攔截器自動顯示錯誤訊息
3. 提示使用者重新載入最新資料後再操作

### 如何匯出 Excel？

使用已封裝的 `useExportExcel` 組合式函式：

```typescript
import { useExportExcel } from "@@/composables/useExportExcel"

const { exportExcel } = useExportExcel()

// 匯出當前表格資料
exportExcel({
  data: tableData.value,
  filename: "用戶列表",
  headers: ["用戶名稱", "角色", "狀態"]
})
```

## 專案架構設計

### 為什麼使用模組化結構？

- **業務內聚**：同一模組的程式碼集中管理，降低認知負擔
- **減少衝突**：多人協作時減少檔案衝突機率
- **清晰邊界**：公共資源（`common/`）與私有資源（`pages/[module]/`）明確分離
- **易於維護**：修改或移除模組時不影響其他功能

### 為什麼採用組合式函式？

- **邏輯重用**：跨元件共享業務邏輯
- **可測試性**：純函式易於單元測試
- **型別安全**：完整的 TypeScript 支援
- **關注點分離**：元件專注於 UI，邏輯抽取到 composables

### 為什麼嚴格遵循 OpenAPI 規格？

- **契約優先**：前後端基於契約並行開發，減少溝通成本
- **型別安全**：自動生成型別定義，減少執行時錯誤
- **文件即程式碼**：API 文件始終保持最新
- **可測試性**：基於契約的 Mock 與測試

## 相關連結

- **原始專案**：[V3 Admin Vite](https://github.com/un-pany/v3-admin-vite) by [@un-pany](https://github.com/un-pany)
- **Vue 3 官方文件**：[https://vuejs.org/](https://vuejs.org/)
- **Element Plus 官方文件**：[https://element-plus.org/](https://element-plus.org/)
- **Vite 官方文件**：[https://vitejs.dev/](https://vitejs.dev/)

## 致謝

本專案基於 [V3 Admin Vite](https://github.com/un-pany/v3-admin-vite) 進行客製化開發，感謝原作者 [@pany](https://github.com/pany-ang) 及所有貢獻者的辛勤付出！

## 授權

[MIT](./LICENSE) License

---

**專案目標**：提供開箱即用的企業級前後端後台管理系統解決方案，讓開發團隊專注於業務邏輯而非基礎架構搭建。

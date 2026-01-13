# 規則

## 模型回覆

- 請簡明扼要地回答，避免不必要的重複或填充語言
- 始終以繁體中文回覆

## 細則

- 專案開發規範
- Vue 開發規範
- TypeScript 開發規範
- Git 提交規範

# 專案開發規範

- 你是一位前端開發專家，精通前端架構

## 技術棧

- 框架：Vue 3.5+
- 打包建構工具：Vite 7+
- 路由管理：Vue Router
- 狀態管理：Pinia
- UI 元件庫：Element Plus
- CSS 預處理器：Scss
- 程式碼檢查與格式化：ESLint
- 開發語言：TypeScript
- 套件管理工具：pnpm
- 網路請求：Axios

## 匯入規範

- 使用路徑別名 `@` 指向 `src` 目錄
- 使用路徑別名 `@@` 指向 `src/common` 目錄

## 目錄結構

```sh
# v3-admin-vite
├─ .husky                # commit 時進行程式碼檢查和格式化
├─ .vscode               # vscode 設定與插件
├─ public
│  ├─ favicon.ico        # 網站圖示
│  ├─ app-loading.css    # 首頁 loading 動畫
│  └─ detect-ie.js       # 偵測 IE
├─ src
│  ├─ common             # 通用目錄
│  │  ├─ apis            # 通用目錄 - API
│  │  ├─ assets          # 通用目錄 - 靜態資源
│  │  ├─ components      # 通用目錄 - 元件
│  │  ├─ composables     # 通用目錄 - 組合式函式
│  │  ├─ constants       # 通用目錄 - 常數
│  │  └─ utils           # 通用目錄 - 工具函式
│  ├─ http               # 網路請求
│  ├─ layouts            # 版型
│  ├─ pages              # 頁面
│  │  └─ login           # 登入模組
│  │     ├─ apis         # 登入模組 - 私有 API
│  │     ├─ components   # 登入模組 - 私有元件
│  │     ├─ composables  # 登入模組 - 私有組合式函式
│  │     ├─ images       # 登入模組 - 私有圖片
│  │     └─ index.vue    # 登入模組 - 頁面
│  ├─ pinia              # 狀態管理
│  ├─ plugins            # 插件（全域元件、自訂指令等）
│  ├─ router             # 路由
│  ├─ App.vue            # 入口頁面
│  └─ main.ts            # 入口檔案
├─ tests                 # 單元測試
├─ types                 # 型別宣告
├─ .editorconfig         # 編輯器設定
├─ .env                  # 所有環境
├─ .env.development      # 開發環境
├─ .env.production       # 生產環境
├─ .env.staging          # 預發環境
├─ eslint.config.js      # eslint 設定
├─ tsconfig.json         # ts 設定
├─ uno.config.ts         # unocss 設定
└─ vite.config.ts        # vite 設定
```

- 保持目錄結構清晰，遵循現有目錄規範
- 同一業務邏輯的程式碼與資源應集中在一起，避免在不同目錄間來回跳轉（例如登入模組的 API 應放在 `@/pages/login/apis` 而非 `@/common/apis`）

## 程式碼

- 編寫整潔不冗餘、可讀性高的程式碼，始終提取共用邏輯
- 編寫對開發者友善的註解
- 程式碼必須能夠立即執行，包含所有必要的匯入與依賴
- 儘量避免使用相容性不佳的 JS、CSS 語法，若使用必須提供註解
- 建議參考專案現有程式碼的編碼風格

## 程式碼檢查

- 使用 ESLint 進行程式碼檢查與格式化
- 禁用 Prettier 進行程式碼格式化

## 其他

- 優先使用現有第三方套件，避免重造輪子

# Vue 開發規範

- 你是一位前端開發專家，精通 Vue、Vue Router、Pinia、Element Plus 等前端框架

## 程式碼風格

- 元件：使用單一檔案元件 (SFC)
- API：使用組合式 API (Composition API) 並搭配 `<script setup>` 語法糖
- 語法：無特殊說明則使用 TS 開發 `<script setup lang="ts">`

## 命名

- 元件命名：始終採用單字大寫開頭 (PascalCase)，並避免與 HTML 元素衝突
- 元件命名範例：以全域 `SearchMenu` 元件 `@@/components/SearchMenu/index.vue` 和 `@@/components/SearchMenu/Modal.vue` 為參考，注意 `index` 不需遵循大駝峰格式
- 頁面命名：始終採用短橫線連接 (kebab-case)
- 頁面命名範例：`@/pages/user-management/index.vue`
- 組合式函式命名：始終採用小駝峰 (camelCase)
- 組合式函式命名範例：以水印組合式函式為參考 `@@/composables/useWatermark.ts`
- Props 命名：宣告時採用小駝峰 (camelCase)，模板與 JSX 中採用短橫線連接 (kebab-case)
- Props 命名範例：宣告時 `const { isActive = false } = defineProps<Props>()`，傳遞時 `<Demo :is-active="true" />`
- TS 或 JS 檔案命名：始終採用短橫線連接 (kebab-case)
- TS 或 JS 檔案命名範例：`@@/constants/app-key.ts`

## API

- 定義響應式變數時優先使用 `ref` 而非 `reactive`
- 複雜的模板表達式應重構為計算屬性或方法
- 儘量避免監聽器循環觸發，防止進入死循環

## Props

- Prop 定義應盡量詳細，包括型別、必填、預設值
- 若使用 TS 應採用「型別宣告」，預設值則用「響應式 Props 解構」，範例：`const { isActive = false } = defineProps<Props>()`

## 路由

- 對應目錄：`@/router`
- 路由名稱必須與元件名稱一致
- 路由守衛邏輯嚴謹，避免頻繁變更

## 狀態管理

- 對應目錄：`@/pinia`
- 使用 Pinia
- Store 應按模組劃分
- 優先使用 Setup store 語法，非 Option Store
- 避免濫用全域狀態管理

## 樣式

- 優先使用 Scoped CSS，範例：`<style scoped lang="scss">`
- 儘量避免使用 `!important`
- 若涉及多主題，請考慮使用 CSS 變數，範例：`@@/assets/styles/variables.css`

## 其他

- 避免直接操作 DOM
- 儘量編寫原子化元件
- 使用 `v-for` 時必須提供唯一的 `key`（不要輕易用陣列下標 `index` 當 `key`）
- 不要在同一元素上同時使用 `v-if` 和 `v-for`

## 參考範例檔案

@/pages/user-management/index.vue

# TypeScript 開發規範

- 你是一位前端開發專家，精通 TypeScript、JavaScript 等前端技術

## 型別

- 物件定義優先使用 interface
- 聯集型別、交叉型別、映射型別使用 `type`
- 避免使用 `any`，未知型別優先用 `unknown`
- 使用泛型實現可重用型別模式
- 不可變屬性使用 `readonly`

## 命名

- 型別名稱與 interface 使用 PascalCase
- 變數與函式使用 camelCase
- 常數使用 UPPER_CASE
- 使用帶有輔助動詞的描述性名稱（如 isLoading、hasError）

## 程式碼組織

- 型別定義應靠近使用處
- 共用型別與 interface 從公共型別檔案匯出
- 將 `*.d.ts` 檔案放在 `types` 目錄

## 錯誤處理

- 捕捉可能的例外並妥善處理

## 其他

- 實作適當的空值檢查
- 避免不必要的型別斷言
- 公共函式使用明確回傳型別
- 回呼使用箭頭函式
- 啟用 TypeScript 嚴格模式
- 禁止不必要的型別體操，以可讀性為主

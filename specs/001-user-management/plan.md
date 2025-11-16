# Implementation Plan: [FEATURE]

**Branch**: `[###-feature-name]` | **Date**: [DATE] | **Spec**: [link]
**Input**: Feature specification from `/specs/[###-feature-name]/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

實現用戶管理功能模組，提供完整的 CRUD 操作（新增、修改、刪除、查詢用戶），具備路由級與按鈕級權限控制，以及 Excel 報表匯出功能。採用前端 Vue3 + TypeScript + Element Plus 技術棧，整合後端 API（V3.Admin.Backend.API.yaml），使用前端套件（如 xlsx）處理報表匯出，避免後端參與。

## Technical Context

**Language/Version**: TypeScript 5.9+ (Vue 3.5+)
**Primary Dependencies**: Vue 3.5.21, Element Plus 2.11.2, Pinia 3.0.3, Vue Router 4.5.1, Axios 1.12.2, VXE Table 4.6.25, xlsx (用於前端匯出 Excel)
**Storage**: 後端 API (RESTful, 遵循 V3.Admin.Backend.API.yaml 契約)
**Testing**: Vitest 3.2.4, @vue/test-utils 2.4.6
**Target Platform**: 現代瀏覽器 (Chrome, Firefox, Edge, Safari)
**Project Type**: Web (Single Page Application - SPA)
**Performance Goals**:

- 用戶列表首次載入時間 < 2 秒（1,000 筆資料）
- 搜尋/篩選回應時間 < 1 秒
- 匯出 500 筆用戶資料為 Excel < 5 秒
  **Constraints**:
- 前端匯出報表，不調用後端 API
- 符合現有專案目錄結構與編碼規範
- 必須通過 ESLint 檢查
- 支援響應式設計（桌面與移動設備）
  **Scale/Scope**:
- 支援最多 10,000+ 用戶資料（分頁查詢）
- 預設每頁 20 筆
- 同時支援至少 50 位管理員並發操作

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

### Initial Check (Phase 0) ✅ PASS

### I. Documentation Language ✅ PASS

- 所有規格文件（spec.md、plan.md）均使用繁體中文撰寫
- 程式碼註解將使用繁體中文
- API 文件參考後端 V3.Admin.Backend.API.yaml（繁體中文）

### II. Simplified Architecture ✅ PASS

- 採用現有專案架構，不引入額外抽象層
- 遵循現有目錄結構（@/pages/user-management）
- 使用 Vue3 Composition API 與 `<script setup>` 語法糖，保持程式碼簡潔
- 避免過度設計，每個檔案單一職責

### III. Latest Tech Stack ✅ PASS

- 使用專案現有最新穩定版本：Vue 3.5.21, TypeScript 5.9.2, Vite 6.3.6, Element Plus 2.11.2
- 所有依賴項已在 package.json 中定義，無需額外更新
- 遵循現代 Vue3 Composition API 最佳實踐

### IV. Code Quality & Testing ✅ PASS

- 所有程式碼必須通過 ESLint 檢查（@antfu/eslint-config）
- 為關鍵功能（用戶驗證、權限檢查、資料處理）編寫單元測試（Vitest）
- 遵循專案統一命名規範（元件 PascalCase、檔案 kebab-case、組合式函式 camelCase）
- 提供詳細註解說明業務邏輯與設定項目

### V. User Experience First ✅ PASS

- 使用 Element Plus 元件庫提供一致的使用者體驗
- 實現路由級與按鈕級權限控制，提升安全性與易用性
- 提供清晰的錯誤提示與成功反饋訊息（繁體中文）
- 支援響應式設計，確保移動設備相容性
- 優化載入效能（分頁、虛擬滾動）

### VI. Brownfield Project Protection ✅ PASS

- 本功能為**新增模組**，不修改現有程式碼
- 僅在以下位置新增檔案：
  - `@/pages/user-management/` （新增用戶管理頁面與相關檔案）
  - `@/router/` （新增路由定義）
  - `@/pinia/stores/` （可能新增用戶管理 store，視需求而定）
- 遵循現有架構風格與編碼慣例
- 所有變更將記錄在 git commit 中，可追溯

### VII. Backend API Contract Compliance ✅ PASS

- 嚴格遵循 V3.Admin.Backend.API.yaml 規格
- API 請求使用定義的端點：`/api/accounts`（GET, POST, PUT, DELETE）
- 回應處理遵循 `ApiResponseModel<T>` 格式（success, code, message, data, timestamp, traceId）
- 身份驗證使用 JWT Bearer Token（Authorization header）
- 錯誤處理涵蓋所有業務邏輯代碼（VALIDATION_ERROR, UNAUTHORIZED, NOT_FOUND, CONCURRENT_UPDATE_CONFLICT, etc.）
- 分頁參數：pageNumber（從 1 開始）, pageSize（1-100）
- 資料型別嚴格匹配 schema 定義

---

### Post-Design Check (Phase 1) ✅ PASS

**設計審查結果**：

1. **Architecture Simplicity** ✅
   - 使用 Composables 管理狀態與邏輯，無過度抽象
   - 元件職責清晰：UserTable（展示）、UserForm（表單）、index.vue（主頁面）
   - API 封裝簡潔，直接呼叫 Axios，無額外中介層

2. **Technology Stack** ✅
   - 新增依賴：xlsx（Excel 匯出），符合需求且社群活躍
   - 無其他新增第三方套件，充分利用現有技術棧

3. **Code Quality** ✅
   - 型別定義完整（types.ts），符合 TypeScript 最佳實踐
   - 測試計畫明確（useUserManagement.test.ts），涵蓋核心邏輯

4. **User Experience** ✅
   - 即時表單驗證、友善錯誤提示、二次確認刪除
   - 分頁與搜尋功能提升大量資料瀏覽體驗
   - Excel 匯出包含時間戳，檔名清晰

5. **Brownfield Protection** ✅
   - 所有新增檔案集中在 `@/pages/user-management/`
   - 僅在 `@/router/index.ts` 和 `@/common/constants/permissions.ts` 新增少量設定
   - 無修改現有元件或工具函式

6. **API Contract Compliance** ✅
   - API 封裝（apis/user.ts）嚴格遵循契約文件
   - 錯誤處理涵蓋所有業務邏輯代碼
   - 分頁參數與回應格式完全匹配後端規格

**結論**: Phase 1 設計完全符合所有憲章原則，無違反情況，可繼續進行實作階段。

## Project Structure

### Documentation (this feature)

```text
specs/001-user-management/
├── plan.md              # 實施計畫（本檔案）
├── research.md          # Phase 0 研究成果
├── data-model.md        # Phase 1 資料模型
├── quickstart.md        # Phase 1 快速開始指南
├── contracts/           # Phase 1 API 契約（參考 V3.Admin.Backend.API.yaml）
└── checklists/          # 需求檢查清單（已存在）
    └── requirements.md
```

### Source Code (repository root)

```text
# Web Application (Vue3 SPA)
src/
├── pages/
│   └── user-management/          # 用戶管理模組（新增）
│       ├── index.vue             # 用戶管理主頁面
│       ├── apis/                 # 私有 API（用戶相關）
│       │   └── user.ts           # 用戶 API 封裝（呼叫 /api/accounts）
│       ├── components/           # 私有元件
│       │   ├── UserForm.vue      # 新增/編輯用戶表單
│       │   ├── UserTable.vue     # 用戶列表表格
│       │   └── DeleteConfirm.vue # 刪除確認對話框
│       ├── composables/          # 私有組合式函式
│       │   ├── useUserManagement.ts  # 用戶管理邏輯
│       │   ├── useUserForm.ts        # 表單驗證與提交
│       │   └── useExportExcel.ts     # Excel 匯出邏輯（前端）
│       └── types.ts              # 用戶相關型別定義
│
├── router/
│   └── index.ts                  # 路由設定（新增用戶管理路由）
│
├── pinia/
│   └── stores/
│       └── user.ts               # 用戶管理 store（可選，視需求而定）
│
├── common/
│   └── utils/
│       └── excel.ts              # Excel 工具函式（共用，新增）
│
└── http/
    └── axios.ts                  # Axios 設定（已存在，確保 JWT 攔截器）

tests/
├── pages/
│   └── user-management/
│       ├── composables/
│       │   ├── useUserManagement.test.ts
│       │   └── useExportExcel.test.ts
│       └── components/
│           └── UserForm.test.ts
└── utils/
    └── excel.test.ts
```

**Structure Decision**: 採用現有 Web Application 結構，遵循專案目錄規範（@/pages/{module-name}），將用戶管理模組集中在 `@/pages/user-management/` 目錄下。所有業務邏輯與資源（API、元件、組合式函式）放在該模組內，保持高內聚性。共用工具函式（如 Excel 匯出）放在 `@/common/utils/`。

## Complexity Tracking

無違反憲章的情況，無需說明。

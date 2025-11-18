# Implementation Plan: 權限管理系統

**Branch**: `002-permission-management` | **Date**: 2025-11-19 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/002-permission-management/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

建立一個完整的權限管理功能，提供權限的新增、刪除、修改、查詢功能，包含管理介面。此功能是存取控制體系的基礎層，定義系統中所有可執行的操作，這些權限會被角色管理功能引用，最終透過角色分配給使用者。技術實現採用 Vue 3 Composition API + Element Plus + Pinia，遵循專案既有架構模式。

## Technical Context

**Language/Version**: TypeScript 5.9+ / Vue 3.5+
**Primary Dependencies**: Vue 3, Element Plus 2.11+, Pinia 3.0+, Axios 1.12+, Vite 6.3+
**Storage**: 透過 RESTful API 與後端資料庫互動（根據 V3.Admin.Backend.API.yaml 規範）
**Testing**: Vitest 3.2+ (Vue Test Utils 2.4+)
**Target Platform**: 現代瀏覽器（Chrome/Edge/Firefox/Safari 最新版本）
**Project Type**: Web 應用程式（單一前端專案）
**Performance Goals**: 
  - 權限清單載入時間 < 2 秒（1000 筆以內）
  - 搜尋回應時間 < 500ms
  - 新增/編輯操作完成時間 < 5 秒
**Constraints**: 
  - p95 回應時間 < 200ms（API 層面）
  - 支援並行 20 位管理員操作
  - 使用樂觀鎖定處理並行編輯衝突
**Scale/Scope**: 
  - 預期支援 100-500 個權限項目
  - 單一頁面元件（含子元件、組合式函式）
  - 約 500-800 行程式碼（不含測試）

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

### 初始檢查（Phase 0 前）

✅ **I. Documentation Language** - 所有規格文件和計畫均使用繁體中文撰寫
✅ **II. Simplified Architecture** - 遵循專案既有架構，不引入不必要的抽象層
✅ **III. Latest Tech Stack** - 使用最新穩定版本的 Vue 3.5、TypeScript 5.9、Element Plus 2.11
✅ **IV. Code Quality & Testing** - 將為關鍵功能編寫單元測試，確保通過 ESLint 檢查
✅ **V. User Experience First** - 提供清晰的錯誤訊息、載入狀態、即時搜尋等優化使用者體驗的功能
✅ **VI. Brownfield Project Protection** - 新增權限管理功能，不修改現有程式碼，遵循專案既有模式
✅ **VII. Backend API Contract Compliance** - 嚴格遵循 V3.Admin.Backend.API.yaml 中的 API 規範
  - 使用標準 ApiResponseModel<T> 格式處理回應
  - 使用 JWT Bearer Token 進行身份驗證
  - 處理所有規範中定義的錯誤代碼（VALIDATION_ERROR, UNAUTHORIZED, NOT_FOUND, CONCURRENT_UPDATE_CONFLICT）
  - 使用標準分頁參數（pageNumber 從 1 開始，pageSize 1-100）

**結論**: 無違規項目，可進入 Phase 0 研究階段。

### Phase 1 設計後再檢查

✅ **I. Documentation Language** - 已完成文件：
  - ✅ plan.md（繁體中文）
  - ✅ research.md（繁體中文）
  - ✅ data-model.md（繁體中文）
  - ✅ api-contracts.md（繁體中文）
  - ✅ quickstart.md（繁體中文）

✅ **II. Simplified Architecture** - 設計符合簡化架構原則：
  - 採用與 `user-management` 一致的模組化結構
  - 不引入額外的抽象層或設計模式
  - 組合式函式職責清晰，無過度設計
  - 元件拆分適當（Table、Form、主頁面）

✅ **III. Latest Tech Stack** - 技術棧選擇：
  - TypeScript 5.9+ / Vue 3.5+ ✅
  - Element Plus 2.11+ ✅
  - Pinia 3.0+ ✅
  - Axios 1.12+ ✅
  - Vite 6.3+ ✅
  - Vitest 3.2+ ✅

✅ **IV. Code Quality & Testing** - 品質保證計畫：
  - 已規劃單元測試範圍（組合式函式、元件、工具函式）
  - 所有程式碼將通過 ESLint 檢查
  - 表單驗證規則明確定義
  - API 錯誤處理完整

✅ **V. User Experience First** - UX 考量：
  - 即時搜尋與過濾
  - 載入狀態指示器
  - 友善的錯誤訊息（含具體原因）
  - 確認對話框（刪除操作）
  - 樂觀鎖定衝突提示
  - 分頁與排序支援
  - Excel 匯出功能

✅ **VI. Brownfield Project Protection** - 保護現有程式碼：
  - 新增獨立模組於 `src/pages/permission-management/`
  - 僅更新 `@@/constants/permissions.ts`（新增權限常數）
  - 僅更新 `src/router/index.ts`（新增路由）
  - 不修改現有模組程式碼
  - 遵循專案既有架構與命名規範

✅ **VII. Backend API Contract Compliance** - API 契約遵循：
  - 所有 API 端點遵循 RESTful 設計
  - 使用統一的 `ApiResponse<T>` 格式
  - JWT Bearer Token 身份驗證
  - 完整錯誤代碼處理：
    - `SUCCESS` - 操作成功
    - `VALIDATION_ERROR` - 驗證錯誤
    - `UNAUTHORIZED` - 未授權
    - `FORBIDDEN` - 無權限
    - `NOT_FOUND` - 資源不存在
    - `DUPLICATE_CODE` - 權限代碼重複
    - `PERMISSION_IN_USE` - 權限使用中
    - `SYSTEM_PERMISSION_PROTECTED` - 系統權限保護
    - `CONCURRENT_UPDATE_CONFLICT` - 並行更新衝突
  - 標準分頁參數（pageNumber, pageSize）
  - 完整的請求/回應範例

**最終結論**: ✅ 所有憲法原則均已遵守，設計完整且符合專案規範，可以進入實作階段。

## Project Structure

### Documentation (this feature)

```text
specs/002-permission-management/
├── plan.md              # 本文件 (/speckit.plan 指令輸出)
├── research.md          # Phase 0 輸出 (/speckit.plan 指令)
├── data-model.md        # Phase 1 輸出 (/speckit.plan 指令)
├── quickstart.md        # Phase 1 輸出 (/speckit.plan 指令)
├── contracts/           # Phase 1 輸出 (/speckit.plan 指令)
│   └── api-contracts.md # API 契約定義
├── spec.md              # 功能規格（已存在）
└── tasks.md             # Phase 2 輸出 (/speckit.tasks 指令 - 不由 /speckit.plan 建立)
```

### Source Code (repository root)

```text
src/
├── pages/
│   └── permission-management/          # 權限管理頁面模組
│       ├── index.vue                   # 主頁面元件
│       ├── types.ts                    # TypeScript 型別定義
│       ├── apis/                       # 私有 API
│       │   └── permission.ts           # 權限 API 請求
│       ├── components/                 # 私有元件
│       │   ├── PermissionTable.vue     # 權限表格元件
│       │   └── PermissionForm.vue      # 權限表單元件
│       └── composables/                # 私有組合式函式
│           ├── usePermissionManagement.ts  # 權限管理邏輯
│           ├── usePermissionForm.ts        # 表單邏輯
│           └── useExportExcel.ts           # Excel 匯出邏輯
│
├── common/
│   ├── constants/
│   │   └── permissions.ts              # 更新：新增權限管理相關常數
│   └── utils/
│       └── permission.ts               # 既有：權限檢查工具
│
├── pinia/
│   └── stores/
│       └── permission.ts               # 可能需要：權限狀態管理（視需求而定）
│
└── router/
    └── index.ts                        # 更新：新增權限管理路由

tests/
├── pages/
│   └── permission-management/
│       ├── components/
│       │   ├── PermissionTable.test.ts
│       │   └── PermissionForm.test.ts
│       └── composables/
│           ├── usePermissionManagement.test.ts
│           └── usePermissionForm.test.ts
└── utils/
    └── validate.test.ts                # 更新：新增權限代碼格式驗證測試
```

**Structure Decision**: 採用單一 Web 專案結構。權限管理功能作為獨立模組放置在 `src/pages/permission-management/` 目錄下，遵循專案既有的模組化組織方式（參考 `user-management` 模組）。此結構將所有相關程式碼（頁面、元件、API、組合式函式）集中管理，便於維護且符合專案規範。

## Complexity Tracking

> 無違規項目，此區段不適用。

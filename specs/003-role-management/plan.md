# Implementation Plan: 角色管理系統

**Branch**: `003-role-management` | **Date**: 2025-11-21 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/003-role-management/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

建立一個完整的角色管理功能，提供角色的新增、編輯、刪除、查詢、匯出功能，以及角色權限設定與用戶角色分配。此功能是 RBAC（角色基礎存取控制）的核心層，連結權限管理與用戶管理，透過角色將權限批次分配給用戶。技術實現採用 Vue 3 Composition API + Element Plus + Pinia，並嚴格遵循後端 OpenAPI 規格（`V3.Admin.Backend.API.yaml`）進行 API 整合。

## Technical Context

**Language/Version**: TypeScript 5.9+ / Vue 3.5+
**Primary Dependencies**: Vue 3, Element Plus 2.11+, Pinia 3.0+, Axios 1.12+, Vite 6.3+, xlsx (SheetJS)
**Storage**: 透過 RESTful API 與後端資料庫互動（根據 V3.Admin.Backend.API.yaml 規範）
**Testing**: Vitest 3.2+ (Vue Test Utils 2.4+)
**Target Platform**: 現代瀏覽器（Chrome/Edge/Firefox/Safari 最新版本）
**Project Type**: Web 應用程式（單一前端專案）
**Performance Goals**: 
  - 角色列表載入時間 < 2 秒（100 個角色）
  - 搜尋回應時間 < 1 秒
  - 角色建立與權限配置完成時間 < 30 秒
  - Excel 匯出 100 筆角色資料 < 10 秒
**Constraints**: 
  - p95 回應時間 < 200ms（API 層面）
  - 支援至少 50 位並發管理員操作
  - 使用樂觀鎖定（版本號）處理並行編輯衝突
  - 所有 API 需 JWT Bearer Token 認證
**Scale/Scope**: 
  - 預期支援 100+ 角色項目（分頁載入）
  - 包含主頁面、表格元件、表單元件、權限選擇器
  - 整合既有用戶管理頁面（用戶角色分配功能）
  - 約 800-1200 行程式碼（不含測試）

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

### 初始檢查（Phase 0 前）

✅ **I. Documentation Language** - 所有規格文件和計畫均使用繁體中文撰寫
✅ **II. Simplified Architecture** - 遵循專案既有架構（參考 user-management 與 permission-management 模組），不引入不必要的抽象層
✅ **III. Latest Tech Stack** - 使用最新穩定版本的 Vue 3.5、TypeScript 5.9、Element Plus 2.11、Vite 6.3
✅ **IV. Code Quality & Testing** - 將為關鍵功能編寫單元測試，確保通過 ESLint 檢查
✅ **V. User Experience First** - 提供 30 秒內完成角色建立與權限配置、清晰的錯誤訊息、樂觀鎖衝突提示、3 次點擊內完成用戶角色分配
✅ **VI. Brownfield Project Protection** - 新增角色管理功能，僅擴展既有用戶管理頁面的用戶角色分配區域，不修改其他現有程式碼
⚠️ **VII. Backend API Contract Compliance** - 需確認以下 gating 項目：
  - 後端 API 規格（V3.Admin.Backend.API.yaml）已完整定義角色管理相關端點
  - 需確認權限代碼命名規範（`role.create` / `role.update` / `role.delete` / `role.read` / `role.assign` / `permission.assign` / `permission.remove`）
  - Excel 匯出採前端實作（SheetJS），若資料量超過 1000 筆需評估後端匯出 API

**結論**: 憲章檢查無阻礙性違反，但有兩項需在 Phase 0 研究中確認（權限代碼命名與大量匯出策略）。

---

### Phase 1 設計後再檢查

✅ **I. Documentation Language** - 已完成所有文件：
  - ✅ plan.md（繁體中文）
  - ✅ research.md（繁體中文）
  - ✅ data-model.md（繁體中文）
  - ✅ api-contracts.md（繁體中文）
  - ✅ quickstart.md（繁體中文）

✅ **II. Simplified Architecture** - 設計符合簡化架構原則：
  - 採用與 `user-management` 和 `permission-management` 一致的模組化結構
  - 不引入額外的抽象層或設計模式
  - 組合式函式職責清晰：useRoleManagement（列表管理）、useRoleForm（表單處理）、usePermissionTree（權限樹轉換）、useExportExcel（匯出）
  - 元件拆分適當（RoleTable、RoleForm、PermissionSelector）
  - 用戶管理模組採用最小侵入式擴展（新增 RoleSelector 元件與 useUserRoles 組合式函式）

✅ **III. Latest Tech Stack** - 技術棧選擇：
  - TypeScript 5.9+ / Vue 3.5+ ✅
  - Element Plus 2.11+ ✅
  - Pinia 3.0+（僅必要時使用，優先採用組合式函式） ✅
  - Axios 1.12+ ✅
  - Vite 6.3+ ✅
  - xlsx (SheetJS) ✅
  - Vitest 3.2+ ✅

✅ **IV. Code Quality & Testing** - 品質保證計畫：
  - 已規劃完整的單元測試範圍（useRoleManagement、useRoleForm、usePermissionTree、元件測試）
  - 所有程式碼將通過 ESLint 檢查
  - 表單驗證規則明確定義（角色名稱 1-100 字元、描述最大 500 字元）
  - API 錯誤處理完整（統一的錯誤代碼處理器）

✅ **V. User Experience First** - UX 考量：
  - 30 秒內完成角色建立與基本權限配置（折疊面板 + 樹狀選擇器）
  - 3 次點擊內完成用戶角色分配（用戶管理頁面 → 編輯 → 選擇角色 → 保存）
  - 樂觀鎖衝突提供清晰的錯誤提示與「重新載入」按鈕
  - 載入狀態指示器
  - 友善的錯誤訊息（含具體原因）
  - 確認對話框（刪除操作）
  - 分頁與排序支援
  - Excel 匯出功能（< 10 秒匯出 100 筆資料）

✅ **VI. Brownfield Project Protection** - 保護現有程式碼：
  - 新增獨立模組於 `src/pages/role-management/`
  - 僅更新 `@@/constants/permissions.ts`（新增角色管理權限常數）
  - 僅更新 `src/router/index.ts`（新增角色管理路由）
  - 用戶管理模組採用最小侵入式擴展：
    - 新增 `RoleSelector.vue` 元件（獨立檔案）
    - 新增 `useUserRoles.ts` 組合式函式（獨立檔案）
    - 新增 `user-roles.ts` API 封裝（獨立檔案）
    - 僅在 `UserForm.vue` 中新增一個表單欄位（< 5 行程式碼）
  - 不修改其他現有模組程式碼
  - 遵循專案既有架構與命名規範

✅ **VII. Backend API Contract Compliance** - API 契約遵循：
  - 所有 API 端點嚴格遵循 V3.Admin.Backend.API.yaml 規範
  - 使用統一的 `ApiResponse<T>` 格式（success, code, message, data, timestamp, traceId）
  - JWT Bearer Token 身份驗證（Authorization 標頭）
  - 完整錯誤代碼處理：
    - `SUCCESS` - 操作成功
    - `VALIDATION_ERROR` - 驗證錯誤
    - `UNAUTHORIZED` - 未授權
    - `FORBIDDEN` - 無權限
    - `NOT_FOUND` - 資源不存在
    - `CONCURRENT_UPDATE_CONFLICT` - 樂觀鎖衝突
    - `DUPLICATE_NAME` - 角色名稱重複
    - `ROLE_IN_USE` - 角色使用中
  - 標準分頁參數（pageNumber 從 1 開始，pageSize 1-100）
  - 樂觀鎖版本號驗證（更新與刪除操作）
  - 完整的請求/回應範例與型別定義

**最終結論**: ✅ 所有憲法原則均已遵守，設計完整且符合專案規範，可以進入實作階段（Phase 2: Tasks）。

## Project Structure

### Documentation (this feature)

```text
specs/003-role-management/
├── plan.md              # 本文件 (/speckit.plan 指令輸出)
├── research.md          # Phase 0 輸出 (/speckit.plan 指令)
├── data-model.md        # Phase 1 輸出 (/speckit.plan 指令)
├── quickstart.md        # Phase 1 輸出 (/speckit.plan 指令)
├── contracts/           # Phase 1 輸出 (/speckit.plan 指令)
│   └── api-contracts.md # API 契約定義
├── checklists/          # 檢查清單
│   └── requirements.md  # 需求檢查清單（已存在）
└── spec.md              # 功能規格（已存在）
```

### Source Code (repository root)

```text
src/
├── pages/
│   ├── role-management/                # 【新增】角色管理頁面模組
│   │   ├── index.vue                   # 主頁面元件
│   │   ├── types.ts                    # TypeScript 型別定義
│   │   ├── apis/                       # 私有 API
│   │   │   └── role.ts                 # 角色相關 API 請求
│   │   ├── components/                 # 私有元件
│   │   │   ├── RoleTable.vue           # 角色表格元件
│   │   │   ├── RoleForm.vue            # 角色表單元件（含權限設定區域）
│   │   │   └── PermissionSelector.vue  # 權限選擇器元件（樹狀結構）
│   │   └── composables/                # 私有組合式函式
│   │       ├── useRoleManagement.ts    # 角色管理邏輯
│   │       ├── useRoleForm.ts          # 角色表單邏輯
│   │       ├── usePermissionTree.ts    # 權限樹狀結構邏輯
│   │       └── useExportExcel.ts       # Excel 匯出邏輯
│   │
│   └── user-management/                # 【擴展】既有用戶管理模組
│       ├── index.vue                   # 【更新】新增用戶角色分配 UI
│       ├── components/
│       │   ├── UserForm.vue            # 【更新】新增角色選擇器欄位
│       │   └── RoleSelector.vue        # 【新增】多選角色選擇器元件
│       ├── composables/
│       │   └── useUserRoles.ts         # 【新增】用戶角色分配邏輯
│       └── apis/
│           └── user-roles.ts           # 【新增】用戶角色相關 API
│
├── common/
│   ├── constants/
│   │   └── permissions.ts              # 【更新】新增角色管理相關權限常數
│   └── utils/
│       └── permission.ts               # 既有：權限檢查工具
│
└── router/
    └── index.ts                        # 【更新】新增角色管理路由

tests/
├── pages/
│   ├── role-management/
│   │   ├── components/
│   │   │   ├── RoleTable.test.ts
│   │   │   ├── RoleForm.test.ts
│   │   │   └── PermissionSelector.test.ts
│   │   └── composables/
│   │       ├── useRoleManagement.test.ts
│   │       ├── useRoleForm.test.ts
│   │       └── usePermissionTree.test.ts
│   └── user-management/
│       ├── components/
│       │   └── RoleSelector.test.ts
│       └── composables/
│           └── useUserRoles.test.ts
```

**Structure Decision**: 採用單一 Web 專案結構。角色管理功能作為獨立模組放置在 `src/pages/role-management/` 目錄下，遵循專案既有的模組化組織方式（參考 `user-management` 與 `permission-management` 模組）。同時需要擴展既有的 `user-management` 模組以支援用戶角色分配功能，但遵循 Brownfield 保護原則，僅在必要處新增檔案與最小化修改現有元件。

## Complexity Tracking

> 無違規項目，所有設計選擇遵循「簡化架構」原則，不引入不必要的複雜性。

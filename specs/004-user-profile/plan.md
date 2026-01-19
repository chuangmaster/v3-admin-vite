# Implementation Plan: 用戶個人資料與密碼管理

**Branch**: `004-user-profile` | **Date**: 2026-01-19 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/004-user-profile/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

建立用戶個人資料頁面，讓用戶可以查看個人帳號資訊並修改密碼。頁面透過右上角 NavigationBar 下拉選單進入。實作包括：(1) 在 NavigationBar 新增「個人資訊」選單項目 (2) 建立個人資料頁面顯示用戶帳號、顯示名稱、角色 (3) 整合密碼修改功能，支援併發控制 (4) 修正選單權限顯示邏輯。採用現有 API `/api/Account/me` 取得用戶資訊，並使用 `/api/Account/{id}/password` 更新密碼，確保併發控制透過 version 欄位實現。

## Technical Context

**Language/Version**: TypeScript 5.7+ / Vue 3.5+  
**Primary Dependencies**: Vue 3.5, Vite 7, Vue Router, Pinia, Element Plus, Axios  
**Storage**: 無需前端儲存（依賴後端 API）  
**Testing**: Vitest（單元測試）、Playwright（端對端測試）  
**Target Platform**: 現代瀏覽器（Chrome, Firefox, Safari, Edge 最新版本）
**Project Type**: Web 單頁應用 (SPA)  
**Performance Goals**: 頁面載入時間 < 3 秒，表單互動回應 < 500ms  
**Constraints**: 併發更新控制（version 欄位）、session 管理（密碼修改後其他裝置 session 失效）  
**Scale/Scope**: 單一功能頁面，約 3-5 個元件，預計 500-800 行程式碼

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Initial Check (Before Phase 0)

✅ **I. Documentation Language**: 所有規格、計畫與文件使用繁體中文  
✅ **II. Simplified Architecture**: 保持架構簡單，避免過度工程化（新增單一功能頁面，無複雜抽象層）  
✅ **III. Latest Tech Stack**: 使用最新穩定版本（Vue 3.5+, Vite 7+, TypeScript 5.7+）  
✅ **IV. Code Quality & Testing**: 確保程式碼品質與測試覆蓋率（將為關鍵功能編寫單元測試）  
✅ **V. User Experience First**: 以使用者體驗為核心（單頁設計，減少跳轉，提供清晰錯誤訊息）  
✅ **VI. Brownfield Project Protection**: 禁止未經授權修改現有程式碼（僅擴展 NavigationBar 選單，新增頁面與元件）  
✅ **VII. Backend API Contract Compliance**: 嚴格遵循後端 API 規格（使用現有 `/api/Account/me` 與 `/api/Account/{id}/password`，處理 `ApiResponseModel<T>` 格式與併發控制）

**初始結論**: 所有憲法原則均符合，無違規項目需要額外說明。

---

### Re-check (After Phase 1 Design)

✅ **I. Documentation Language**: 
- ✅ 所有文件（plan.md, research.md, data-model.md, api-contracts.md, quickstart.md）均使用繁體中文
- ✅ 技術術語適當保留英文（如 API, Token, Session）

✅ **II. Simplified Architecture**: 
- ✅ 採用組合式函式模式（`useUserProfile`, `useChangePasswordForm`），遵循 Vue 3 最佳實踐
- ✅ 元件結構扁平（僅兩個子元件：`UserInfoCard`, `ChangePasswordForm`）
- ✅ 無過度抽象層，無 Repository Pattern 或 Service Layer

✅ **III. Latest Tech Stack**: 
- ✅ Vue 3.5+ (Composition API + `<script setup>`)
- ✅ TypeScript 5.7+ (嚴格模式)
- ✅ Vite 7+ (建構工具)
- ✅ Element Plus (最新版本 UI 框架)

✅ **IV. Code Quality & Testing**: 
- ✅ 已規劃單元測試（`useUserProfile.test.ts`, `useChangePassword.test.ts`）
- ✅ 已規劃元件測試（`UserInfoCard.test.ts`, `ChangePasswordForm.test.ts`）
- ✅ 程式碼遵循 ESLint 規範（TypeScript 嚴格模式）

✅ **V. User Experience First**: 
- ✅ 單頁設計，減少頁面跳轉（資訊顯示與密碼修改在同一頁面）
- ✅ 響應式佈局（桌面並排，移動端堆疊）
- ✅ 清晰的錯誤訊息與併發衝突處理
- ✅ Loading 狀態與提交狀態顯示

✅ **VI. Brownfield Project Protection**: 
- ✅ 僅擴展現有元件（`NavigationBar/index.vue`），新增選單項目
- ✅ 僅擴展現有路由配置（`router/index.ts`），新增個人資料路由
- ✅ 重用現有 API 函式（`changePassword` 從 user-management 匯入）
- ✅ 所有新程式碼集中在 `@/pages/profile` 模組，無跨模組侵入

✅ **VII. Backend API Contract Compliance**: 
- ✅ 嚴格遵循 `ApiResponseModel<T>` 格式（success, code, message, data, timestamp, traceId）
- ✅ 使用 JWT Bearer Token 認證（Authorization Header）
- ✅ 處理所有定義的錯誤代碼（VALIDATION_ERROR, UNAUTHORIZED, CONCURRENT_UPDATE_CONFLICT）
- ✅ 併發控制使用 `version` 欄位（樂觀鎖機制）
- ✅ API 請求與回應型別與 Schema 定義一致
- ✅ 無假設或發明未在規格中的 API 行為

**最終結論**: ✅ Phase 1 設計完全符合所有憲法原則，無違規項目，可進入實作階段。

## Project Structure

### Documentation (this feature)

```text
specs/[###-feature]/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
src/
├── pages/
│   └── profile/                    # 個人資料頁面模組（新增）
│       ├── index.vue               # 主頁面元件
│       ├── components/             # 頁面私有元件
│       │   ├── UserInfoCard.vue    # 用戶資訊卡片元件
│       │   └── ChangePasswordForm.vue  # 密碼修改表單元件
│       ├── composables/            # 頁面私有組合式函式
│       │   ├── useUserProfile.ts   # 用戶資料管理邏輯
│       │   └── useChangePassword.ts # 密碼修改邏輯
│       └── types.ts                # 頁面私有型別定義
│
├── layouts/
│   └── components/
│       └── NavigationBar/
│           └── index.vue           # 修改：新增個人資訊選單項目
│
├── common/
│   ├── apis/
│   │   └── users/
│   │       ├── index.ts            # 修改：擴展 API（若需要）
│   │       └── type.ts             # 修改：新增型別定義（id, version）
│   └── utils/
│       └── error-handler.ts        # 修改：新增併發錯誤處理工具（若需要）
│
└── router/
    └── index.ts                    # 修改：新增個人資料頁面路由

tests/
├── pages/
│   └── profile/                    # 個人資料頁面測試（新增）
│       ├── profile.test.ts         # 頁面整合測試
│       └── components/             # 元件單元測試
│           ├── UserInfoCard.test.ts
│           └── ChangePasswordForm.test.ts
└── composables/
    ├── useUserProfile.test.ts      # 組合式函式測試
    └── useChangePassword.test.ts
```

**Structure Decision**: 採用 Web SPA 架構，遵循專案現有目錄規範。個人資料功能集中在 `@/pages/profile` 模組，包含頁面、私有元件與組合式函式。擴展現有 NavigationBar 元件以新增選單項目，並更新路由配置。所有業務邏輯與資源集中管理，避免跨目錄跳轉。

## Complexity Tracking

> **無違規項目** - 本功能符合所有憲法原則，無需額外複雜度說明。

---

## Phase Execution Summary

### ✅ Phase 0: Outline & Research (Complete)

**Output**: `research.md`

**Achievements**:
- 解決 Technical Context 中的所有 NEEDS CLARIFICATION
- 研究 API 整合策略（擴展現有型別，重用 changePassword API）
- 確定 Session 管理策略（後端負責，前端提示）
- 定義表單驗證策略（Element Plus 原生驗證 + 組合式函式）
- 明確選單權限控制實作（個人資料無特殊權限）
- 設計 UI/UX 佈局（雙卡片響應式設計）

**Key Decisions**:
| 決策項目 | 選擇 | 原因 |
|---------|------|------|
| API 整合 | 擴展現有 API 型別 | 避免重複，遵循 DRY 原則 |
| 併發控制 | version 欄位 + 409 錯誤處理 | 遵循後端 API 規格 |
| Session 管理 | 後端負責，前端僅提示 | 職責分離，架構合理 |
| 表單驗證 | Element Plus 原生驗證 | 充分利用現有工具 |
| UI 佈局 | 雙卡片響應式設計 | 平衡桌面與移動端體驗 |

---

### ✅ Phase 1: Design & Contracts (Complete)

**Outputs**:
- `data-model.md` - 資料實體與狀態管理定義
- `contracts/api-contracts.md` - API 介面合約規格
- `quickstart.md` - 開發者快速上手指南
- `.github/agents/copilot-instructions.md` - AI Agent 上下文更新

**Achievements**:

**1. Data Model 定義**:
- 核心實體：`UserProfile`（用戶資料）、`ChangePasswordRequest`（密碼修改請求）
- 狀態管理：Pinia `useUserStore` 擴展、組合式函式 `useUserProfile` 與 `useChangePasswordForm`
- 併發控制：樂觀鎖機制（version 欄位）、409 Conflict 錯誤處理
- 資料驗證：前端格式驗證 + 後端業務邏輯驗證

**2. API Contracts 規範**:
- **GET /api/Account/me**: 取得當前用戶資訊（包含 id, account, displayName, roles, permissions, version）
- **PUT /api/Account/{id}/password**: 修改密碼（包含 oldPassword, newPassword, version）
- 錯誤處理矩陣：定義所有錯誤代碼（401, 409, 400, 500）與前端處理方式
- TypeScript 型別定義：完整的 `ApiResponse<T>`, `UserProfile`, `ChangePasswordRequest` 型別

**3. Quickstart Guide 完成**:
- 8 步驟開發流程（型別定義 → 組合式函式 → 元件 → 頁面 → 路由）
- 完整程式碼範例（所有關鍵檔案）
- 測試指南與常見問題解決方案
- API 整合檢查清單

**4. AI Agent Context 更新**:
- 新增技術棧：TypeScript 5.7+ / Vue 3.5+
- 新增框架：Vue 3.5, Vite 7, Vue Router, Pinia, Element Plus, Axios
- 新增資料庫：無需前端儲存（依賴後端 API）

---

### 📋 Phase 2: Task Breakdown (Not Started)

**Note**: Phase 2 由 `/speckit.tasks` 命令執行，不包含在 `/speckit.plan` 範圍內。

**Planned Output**: `tasks.md` - 詳細任務分解與實作步驟

---

## Implementation Readiness

**狀態**: ✅ **Ready for Implementation**

**已完成**:
- ✅ 技術研究與決策（Phase 0）
- ✅ 資料模型設計（Phase 1）
- ✅ API 合約定義（Phase 1）
- ✅ 開發指南撰寫（Phase 1）
- ✅ 憲法合規檢查（Initial & Re-check）
- ✅ AI Agent 上下文更新

**待執行**:
- ⏳ 任務分解（Phase 2 - `/speckit.tasks` 命令）
- ⏳ 程式碼實作（依據 quickstart.md）
- ⏳ 單元測試編寫（Vitest）
- ⏳ 整合測試（E2E）
- ⏳ Code Review 與部署

**建議下一步**:
```bash
# 執行 Phase 2 任務分解
/speckit.tasks

# 或直接開始實作
# 1. 建立型別定義 (@/pages/profile/types.ts)
# 2. 建立組合式函式 (useUserProfile, useChangePasswordForm)
# 3. 建立元件 (UserInfoCard, ChangePasswordForm)
# 4. 建立主頁面 (@/pages/profile/index.vue)
# 5. 更新 NavigationBar 與路由配置
```

---

**Plan Complete** ✅  
**Branch**: `004-user-profile`  
**Date**: 2026-01-19  
**Status**: Ready for Phase 2 (Task Breakdown) or Direct Implementation

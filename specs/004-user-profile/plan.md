# Implementation Plan: 用戶個人資料與選單權限管理

**Branch**: `004-user-profile` | **Date**: 2026-01-16 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/004-user-profile/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

實作用戶個人資料查看、密碼修改功能，以及修復選單權限顯示問題。主要包含三個核心功能：(1) 在右上角 profile 選單顯示用戶基本資訊（顯示名稱、帳號、角色），(2) 提供獨立的密碼修改頁面，支援舊密碼驗證、新密碼確認，並在成功修改後使其他裝置 session 失效，(3) 根據用戶權限動態顯示/隱藏選單項目，提升用戶體驗。技術方案採用 Vue 3 Composition API，整合後端 `/api/Account/me` 與 `/api/Account/{id}/password` API，並優化路由權限守衛邏輯。

## Technical Context

**Language/Version**: TypeScript 5.3+ / Vue 3.5+  
**Primary Dependencies**: Vue 3, Vue Router 4, Pinia 2, Element Plus 2, Axios  
**Storage**: N/A (後端 PostgreSQL)  
**Testing**: Vitest  
**Target Platform**: 現代瀏覽器 (Chrome, Firefox, Safari, Edge 最新兩個版本)  
**Project Type**: Web Application (SPA)  
**Performance Goals**: 頁面載入 < 2s, 密碼修改提交 < 1s, 選單渲染 < 500ms  
**Constraints**: 前端不儲存敏感資料, 遵循現有專案架構規範, 相容既有權限系統  
**Scale/Scope**: 小型功能增強 (~3 個新元件, ~2 個 API 整合, ~200 LOC)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### ✅ I. Documentation Language
- [x] 所有規格文件使用繁體中文撰寫
- [x] 程式碼註解採用繁體中文或英文

### ✅ II. Simplified Architecture
- [x] 不引入額外抽象層，使用既有 Pinia stores 與組合式函式模式
- [x] 保持程式碼結構簡單，優先可讀性
- [x] 複用現有元件庫 (Element Plus)

### ✅ III. Latest Tech Stack
- [x] 使用 Vue 3.5+ Composition API 與 script setup
- [x] 依賴最新穩定版本套件
- [x] 遵循專案既有技術選型

### ✅ IV. Code Quality & Testing
- [x] 所有程式碼通過 ESLint 檢查
- [x] 關鍵功能 (密碼修改、權限檢查) 將編寫單元測試
- [x] 使用 Vitest 測試框架

### ✅ V. User Experience First
- [x] Profile 選單設計清晰易用
- [x] 密碼修改流程簡潔明確
- [x] 選單權限動態顯示提升體驗
- [x] 提供明確的錯誤訊息與成功回饋

### ✅ VI. Brownfield Project Protection
- [x] 不修改現有用戶管理、角色權限核心邏輯
- [x] 擴充現有 layout 元件，不破壞既有結構
- [x] 路由守衛僅優化選單顯示邏輯

### ✅ VII. Backend API Contract Compliance
- [x] 嚴格遵循 `/api/Account/me` 與 `/api/Account/{id}/password` API 規格
- [x] 使用標準 `ApiResponseModel<T>` 處理回應
- [x] JWT Bearer Token 認證
- [x] 處理所有業務邏輯錯誤碼 (VALIDATION_ERROR, UNAUTHORIZED, CONCURRENT_UPDATE_CONFLICT 等)

## Project Structure

### Documentation (this feature)

```text
specs/004-user-profile/
├── spec.md              # 功能規格
├── plan.md              # 本文件 (實作計畫)
├── research.md          # Phase 0 輸出 (技術研究)
├── data-model.md        # Phase 1 輸出 (資料模型)
├── quickstart.md        # Phase 1 輸出 (快速開始指南)
├── contracts/           # Phase 1 輸出 (API 契約)
│   └── api-contracts.md
└── checklists/          # 需求檢查清單
    └── requirements.md
```

### Source Code (repository root)

```text
src/
├── common/
│   ├── apis/
│   │   └── account/         # 帳號相關 API (新增)
│   │       └── profile.ts   # 個人資料 API
│   ├── components/
│   │   └── UserProfile/     # 用戶資料元件 (新增)
│   │       ├── index.vue    # Profile 顯示元件
│   │       └── ChangePasswordDialog.vue  # 密碼修改對話框
│   └── composables/
│       └── useProfile.ts    # Profile 組合式函式 (新增)
├── layouts/
│   └── components/
│       └── Header.vue       # 修改：加入 Profile 選單
├── pages/
│   └── profile/             # 個人資料頁面 (新增，可選)
│       └── change-password.vue  # 密碼修改獨立頁面
├── pinia/
│   └── stores/
│       └── user.ts          # 修改：加入 profile 相關 state
└── router/
    ├── guard.ts             # 修改：優化選單權限邏輯
    └── helper.ts            # 修改：選單過濾邏輯

tests/
├── composables/
│   └── useProfile.test.ts   # Profile 組合式函式測試 (新增)
└── components/
    └── UserProfile.test.ts  # Profile 元件測試 (新增)
```

**Structure Decision**: 
採用 Web Application 架構，功能模組化。個人資料功能放置於 `common/` (通用) 與 `pages/profile/` (頁面)，以符合專案既有目錄規範。API 呼叫統一透過 `@/common/apis/account/`，狀態管理使用既有 Pinia store (`user.ts`)，組合式函式放置於 `@/common/composables/`。選單權限邏輯優化於 router 層級。

## Complexity Tracking

> **無需填寫** - 本功能未違反 Constitution 任何條款，屬於簡單功能擴充

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| N/A       | N/A        | N/A                                 |

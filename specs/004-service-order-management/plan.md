# Implementation Plan: [FEATURE]

**Branch**: `[###-feature-name]` | **Date**: [DATE] | **Spec**: [link]
**Input**: Feature specification from `/specs/[###-feature-name]/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

服務單管理模組為精品收購與寄賣業務的核心功能，提供店員建立、查詢、修改收購單與寄賣單的完整流程。主要功能包含：AI 辨識身分證自動填入客戶資料、客戶搜尋與選擇、商品項目管理、線上/線下簽名、附件管理、服務單狀態追蹤、Excel 匯出與草稿自動儲存。系統支援權限控制，確保敏感資料（如身分證明文件）的安全存取。

## Technical Context

**Language/Version**: TypeScript 5.x, Vue 3.5+  
**Primary Dependencies**: Vue 3.5+, Vite 7+, Vue Router, Pinia, Element Plus, Axios, VueUse, Lodash-es, UnoCSS  
**Storage**: 瀏覽器 localStorage (草稿自動儲存), 後端 API (服務單資料與附件)  
**Testing**: Vitest (單元測試), Vue Test Utils (元件測試)  
**Target Platform**: 現代瀏覽器 (Chrome, Edge, Safari), 支援觸控螢幕與桌面  
**Project Type**: Web application (single-page application, SPA)  
**Performance Goals**: 列表查詢 < 2 秒 (50,000 筆資料), 客戶搜尋 < 1 秒 (10,000 筆), 建單流程 < 3 分鐘 (不含簽名), Excel 匯出 < 5 秒 (1,000 筆)  
**Constraints**: AI 辨識準確率 ≥ 85%, 線上簽名寄送成功率 ≥ 95%, 支援 50 位店員同時使用, 草稿自動儲存間隔 30 秒, 身分證明文件加密儲存  
**Scale/Scope**: 預估 50+ 位店員使用, 服務單資料量 100,000+ 筆/年, 客戶資料量 20,000+ 筆, 支援 1-4 件商品項目/服務單

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### ✅ I. Documentation Language
- **Status**: PASS
- **Evidence**: spec.md 以繁體中文撰寫，plan.md 技術背景以繁體中文說明，程式碼註解將遵循專案慣例

### ✅ II. Simplified Architecture
- **Status**: PASS
- **Evidence**: 採用標準 Vue 3 + Element Plus 模組化架構，遵循專案既有的 pages/[module]/components/composables 目錄結構，不引入額外抽象層

### ✅ III. Latest Tech Stack
- **Status**: PASS
- **Evidence**: 使用最新穩定版本 Vue 3.5+, Vite 7+, TypeScript 5.x, Element Plus, Pinia，與專案現有技術棧一致

### ✅ IV. Code Quality & Testing
- **Status**: PASS
- **Evidence**: 將使用 ESLint 檢查，Vitest 進行單元測試，關鍵組合式函式（useServiceOrderManagement, useServiceOrderForm）將包含測試用例

### ✅ V. User Experience First
- **Status**: PASS
- **Evidence**: 提供 AI 辨識身分證、草稿自動儲存、清晰錯誤提示、觸控簽名、Excel 匯出等功能，支援權限控制以隱藏無權限操作按鈕

### ✅ VI. Brownfield Project Protection
- **Status**: PASS  
- **Evidence**: 此為新功能模組，將遵循既有的目錄結構與命名規範（參考 user-management, permission-management, role-management 模組），不修改現有程式碼

### ✅ VII. Backend API Contract Compliance
- **Status**: PASS
- **Evidence**: 將嚴格遵循 V3.Admin.Backend.API.yaml 定義的 API 規範，使用標準 ApiResponseModel<T> 格式、JWT Bearer Token 認證、標準分頁參數（pageNumber, pageSize）、處理所有定義的業務邏輯錯誤碼

**Overall Gate Status**: ✅ PASS - 符合所有憲章原則，無需例外說明

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
src/pages/service-order-management/
├── index.vue                          # 主頁面：服務單列表、查詢、篩選、Excel 匯出
├── types.ts                           # 型別定義：ServiceOrder, ProductItem, CreateServiceOrderRequest, etc.
├── apis/
│   └── service-order.ts               # API 服務：getServiceOrderList, createServiceOrder, updateServiceOrder, etc.
├── components/
│   ├── ServiceOrderForm.vue           # 服務單表單元件（建立/編輯）
│   ├── ServiceOrderTable.vue          # 服務單表格元件
│   ├── ProductItemForm.vue            # 商品項目表單元件（1-4 件）
│   ├── CustomerSearchDialog.vue       # 客戶搜尋對話框元件
│   ├── IdCardUploader.vue             # 身分證明文件上傳與 AI 辨識元件
│   ├── SignaturePad.vue               # 觸控簽名板元件（線下簽名）
│   └── AttachmentViewer.vue           # 附件查看與下載元件
├── composables/
│   ├── useServiceOrderManagement.ts   # 列表查詢、刪除、分頁、篩選、Excel 匯出邏輯
│   ├── useServiceOrderForm.ts         # 表單邏輯：驗證、提交、狀態管理
│   ├── useCustomerSearch.ts           # 客戶搜尋與選擇邏輯
│   ├── useIdCardRecognition.ts        # AI 辨識身分證邏輯（重試機制、錯誤處理）
│   ├── useSignature.ts                # 線上/線下簽名邏輯（Dropbox Sign API、Base64 簽名處理）
│   ├── useDraftAutosave.ts            # 草稿自動儲存邏輯（localStorage、30秒間隔）
│   └── useExportExcel.ts              # Excel 匯出邏輯
└── images/                            # 模組私有圖片資源（如佔位圖、圖示等）

tests/pages/service-order-management/
├── composables/
│   ├── useServiceOrderManagement.test.ts
│   ├── useServiceOrderForm.test.ts
│   ├── useCustomerSearch.test.ts
│   ├── useIdCardRecognition.test.ts
│   ├── useDraftAutosave.test.ts
│   └── useExportExcel.test.ts
└── components/
    ├── ServiceOrderForm.test.ts
    ├── ProductItemForm.test.ts
    └── CustomerSearchDialog.test.ts
```

**Structure Decision**: 採用專案既有的頁面模組結構（參考 user-management, permission-management, role-management），將所有服務單管理相關的邏輯、元件、API 集中於 `src/pages/service-order-management` 目錄。測試檔案對應放置於 `tests/pages/service-order-management`。此結構符合 Brownfield Project Protection 原則，保持與現有模組一致性。

## Complexity Tracking

> **無需填寫** - 所有憲章檢查項目均通過，無違反需要說明。

Phase 1 設計完成後重新評估結果：

### ✅ I. Documentation Language
- **Post-Design Status**: PASS
- **Evidence**: 所有產出文件（research.md, data-model.md, quickstart.md, contracts/api-contracts.md）均以繁體中文撰寫

### ✅ II. Simplified Architecture
- **Post-Design Status**: PASS
- **Evidence**: 資料模型簡潔清晰，API 合約遵循 RESTful 規範，組合式函式職責單一，無過度設計

### ✅ III. Latest Tech Stack
- **Post-Design Status**: PASS
- **Evidence**: 使用最新穩定版 Vue 3.5+, Vite 7+, Element Plus, TypeScript 5.x，新增套件 signature_pad 與 xlsx 均為業界主流

### ✅ IV. Code Quality & Testing
- **Post-Design Status**: PASS
- **Evidence**: quickstart.md 包含完整的測試指南，規劃單元測試與元件測試，關鍵組合式函式將包含測試用例

### ✅ V. User Experience First
- **Post-Design Status**: PASS
- **Evidence**: 設計包含 AI 辨識、草稿自動儲存、觸控簽名、錯誤提示、權限控制等使用者友善功能

### ✅ VI. Brownfield Project Protection
- **Post-Design Status**: PASS
- **Evidence**: 目錄結構完全遵循既有規範，不修改現有程式碼，僅新增 service-order-management 模組

### ✅ VII. Backend API Contract Compliance
- **Post-Design Status**: PASS
- **Evidence**: contracts/api-contracts.md 定義完整的 API 規範，遵循 ApiResponseModel<T> 格式、JWT 認證、標準分頁參數、錯誤碼處理

**Overall Gate Status (Post-Design)**: ✅ PASS - 設計階段完成，所有憲章原則持續符合，無新增違反項目

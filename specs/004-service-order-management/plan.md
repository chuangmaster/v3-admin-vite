# Implementation Plan: 服務單管理

**Branch**: `004-service-order-management` | **Date**: 2025-12-14 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/004-service-order-management/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

服務單管理模組使店員能夠建立、查詢、修改寄賣單與收購單。核心功能包含：客戶搜尋與選擇、服務單表單填寫、身分證明文件上傳與自動辨識、線上/線下簽名流程、服務單狀態管理、Excel 匯出等。技術實作採用 Vue 3 + TypeScript + Element Plus，遵循專案既有架構規範，整合 Dropbox Sign API 處理線上簽名，使用 OCR 技術辨識身分證文件。

## Technical Context

**Language/Version**: TypeScript 5.x + Vue 3.5+  
**Primary Dependencies**: Vue 3.5+, Vite 7+, Element Plus, Pinia, Vue Router, Axios, VueUse, Lodash-es  
**Storage**: 後端 API（PostgreSQL），前端使用 Pinia 狀態管理  
**Testing**: Vitest + Vue Test Utils  
**Target Platform**: 現代瀏覽器（Chrome、Firefox、Safari、Edge 最新版本）+ 支援行動裝置瀏覽器
**Project Type**: Web（單一前端專案，連接既有後端 API）  
**Performance Goals**: 
  - 服務單建立表單提交 < 1 秒（不含檔案上傳）
  - 客戶搜尋結果返回 < 1 秒
  - 服務單列表查詢 < 2 秒
  - Excel 匯出 1000 筆 < 5 秒  
**Constraints**: 
  - 必須支援行動裝置觸控簽名
  - 檔案上傳限制 10MB（身分證明文件）
  - 支援離線草稿儲存（LocalStorage）
  - 相容既有權限系統  
**Scale/Scope**: 
  - 預計 50+ 位店員同時使用
  - 服務單資料量預計 50,000+ 筆/年
  - 客戶資料量預計 10,000+ 筆

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### ✅ I. Documentation Language
- **Status**: PASS
- **Evidence**: 本計畫使用繁體中文撰寫，符合規範

### ✅ II. Simplified Architecture
- **Status**: PASS
- **Evidence**: 遵循既有專案架構，不引入額外抽象層，使用標準 Vue 3 Composition API + Pinia

### ✅ III. Latest Tech Stack
- **Status**: PASS
- **Evidence**: 使用最新穩定版本 Vue 3.5+、Vite 7+、Element Plus 等

### ✅ IV. Code Quality & Testing
- **Status**: PASS
- **Evidence**: 將使用 ESLint 檢查，並為關鍵功能（表單驗證、資料轉換）撰寫單元測試

### ✅ V. User Experience First
- **Status**: PASS
- **Evidence**: 
  - 支援客戶快速搜尋與自動填入
  - 身分證自動辨識減少手動輸入
  - 觸控簽名支援行動裝置
  - 提供清楚的錯誤訊息與提示

### ✅ VI. Brownfield Project Protection
- **Status**: PASS
- **Evidence**: 新功能模組獨立於 `src/pages/service-order-management/`，不修改既有程式碼

### ✅ VII. Backend API Contract Compliance
- **Status**: PASS
- **Evidence**: 已在 Phase 1 定義完整的 API 契約（contracts/api-contracts.md），包含所有端點、請求/回應格式、錯誤處理，遵循 ApiResponse<T> 統一回應格式

## Project Structure

### Documentation (this feature)

```text
specs/004-service-order-management/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
│   └── api-contracts.md # 前後端 API 契約定義
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
src/pages/service-order-management/
├── index.vue                      # 服務單列表查詢主頁面
├── create.vue                     # 服務單建立頁面
├── detail.vue                     # 服務單詳細頁面
├── types.ts                       # 型別定義
├── apis/
│   └── service-order.ts           # 服務單 API
├── components/
│   ├── ServiceOrderForm.vue       # 服務單表單元件
│   ├── ServiceOrderTable.vue      # 服務單列表元件
│   ├── CustomerSearch.vue         # 客戶搜尋元件
│   ├── CustomerForm.vue           # 客戶表單元件
│   ├── IDCardUpload.vue           # 身分證明上傳與辨識元件
│   ├── SignaturePad.vue           # 觸控簽名板元件
│   └── AccessoriesSelector.vue    # 商品配件選擇器元件
└── composables/
    ├── useServiceOrderManagement.ts  # 服務單列表管理
    ├── useServiceOrderForm.ts        # 服務單表單邏輯
    ├── useCustomerSearch.ts          # 客戶搜尋邏輯
    ├── useIDCardOCR.ts               # 身分證辨識邏輯
    ├── useSignature.ts               # 簽名處理邏輯
    └── useExportExcel.ts             # Excel 匯出邏輯

src/common/
├── apis/
│   └── customer/                  # 客戶相關 API（可能需新增）
└── constants/
    └── permissions.ts             # 新增服務單權限常數

tests/
├── pages/
│   └── service-order-management/
│       ├── ServiceOrderForm.test.ts
│       ├── CustomerSearch.test.ts
│       └── IDCardUpload.test.ts
└── composables/
    ├── useServiceOrderManagement.test.ts
    └── useIDCardOCR.test.ts
```

**Structure Decision**: 採用標準 Web 單一前端專案結構，遵循既有專案架構規範（參考 user-management、permission-management 模組），將所有服務單相關功能集中在 `src/pages/service-order-management/` 目錄，私有元件與組合式函式封裝在模組內部，通用功能（如客戶 API）放置於 `src/common/`。

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| N/A | N/A | N/A |

**Note**: 目前無違反憲章的項目，唯需在 Phase 0 確認後端 API 契約是否已存在。

# Implementation Plan: 訂單管理模組

**Branch**: `009-order-management` | **Date**: 2026-02-06 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/009-order-management/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

訂單管理模組提供完整的銷售訂單生命週期管理功能,包含訂單建立、修改、查詢、付款記錄管理、狀態追蹤、Excel 匯出與出貨單列印。系統支援多種收件方式(自取、宅配、超商取貨、平台物流)、付款方式(門市現金、現金匯款、線上刷卡、無卡分期)與訂單類型(代購現貨、預購)。技術架構採用 Vue 3.5+ Composition API、TypeScript 5.x、Element Plus 2.11.2、Axios 處理後端 API(ApiResponseModel<T> 格式)、xlsx 實作 Excel 匯出、樂觀鎖定(version 欄位)處理並發衝突。

## Technical Context

**Language/Version**: TypeScript 5.x, Vue 3.5+  
**Primary Dependencies**: Element Plus 2.11.2, Vite 7+, Pinia 3.0.3, Axios, xlsx, UnoCSS  
**Storage**: 後端 API 統一處理(RESTful, ApiResponseModel<T> 格式)  
**Testing**: Vitest(單元測試)、Playwright(E2E 測試)  
**Target Platform**: 現代瀏覽器(Chrome 90+, Firefox 88+, Safari 14+, Edge 90+)  
**Project Type**: Web Application(前端單體專案)  
**Performance Goals**: 列表查詢 <500ms, 表單提交 <1s, Excel 匯出 <3s(1000 筆資料)  
**Constraints**: 響應式設計(最小寬度 1280px), 樂觀鎖定防止並發衝突, 訂單編號每日上限 9999 筆  
**Scale/Scope**: 預估 500 筆訂單/日, 單筆訂單最多 20 項商品, 前端程式碼約 3000 LOC

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Evidence/Notes |
|-----------|--------|----------------|
| **I. Documentation Language** | ✅ PASS | spec.md、plan.md、research.md、data-model.md、api-contracts.md、quickstart.md 皆使用繁體中文撰寫 |
| **II. Simplified Architecture** | ✅ PASS | 採用 Composition API 直接管理狀態,避免過度抽象。Composables 封裝業務邏輯,單一職責明確(useOrderList, useOrderForm, usePaymentRecords 等) |
| **III. Latest Tech Stack** | ✅ PASS | Vue 3.5+, TypeScript 5.x, Vite 7+, Element Plus 2.11.2, Pinia 3.0.3, UnoCSS - 全部使用最新穩定版本 |
| **IV. Code Quality & Testing** | ✅ PASS | ESLint 檢查強制執行、關鍵功能(CRUD、付款驗證、樂觀鎖定)規劃單元測試、型別定義完整、JSDoc 註解(繁體中文) |
| **V. User Experience First** | ✅ PASS | 支援搜尋篩選、分頁、即時驗證、樂觀鎖定衝突友善提示、Excel 匯出、出貨單列印、響應式設計(最小寬度 1280px) |
| **VI. Brownfield Project Protection** | ✅ PASS | 新功能獨立於 `src/pages/order-management/` 目錄,僅擴充 `src/common/apis/order.ts` 與 `src/router/index.ts`,不修改既有模組 |
| **VII. Backend API Contract Compliance** | ✅ PASS | 嚴格遵循 OpenAPI 規範(`http://localhost:5176/swagger/v1/swagger.json`),ApiResponseModel<T> 格式、JWT Bearer Token、業務邏輯錯誤碼(VALIDATION_ERROR, CONCURRENT_UPDATE_CONFLICT, DAILY_ORDER_LIMIT_REACHED)、標準分頁(pageNumber 從 1 開始,pageSize 1-100)、樂觀鎖定(version 欄位) |

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
src/pages/order-management/
├── index.vue                    # 訂單列表主頁面
├── types.ts                     # 所有型別定義(interfaces, enums, constants)
├── components/
│   ├── OrderListTable.vue      # 訂單列表表格元件
│   ├── OrderSearchForm.vue     # 搜尋篩選表單元件
│   ├── OrderFormDialog.vue     # 新增/編輯訂單對話框
│   ├── OrderItemsForm.vue      # 訂單項目子表單
│   ├── DeliveryInfoForm.vue    # 收件資訊子表單
│   ├── PaymentRecordsPanel.vue # 付款記錄管理面板
│   └── ShippingLabelPreview.vue # 出貨單預覽/列印元件
└── composables/
    ├── useOrderList.ts         # 訂單列表邏輯(查詢、分頁、篩選)
    ├── useOrderForm.ts         # 訂單表單邏輯(新增、編輯、驗證)
    ├── useOrderDetail.ts       # 訂單詳情邏輯(取得、刪除)
    ├── usePaymentRecords.ts    # 付款記錄邏輯(新增、修改、刪除、超額驗證)
    ├── useOrderExport.ts       # 訂單匯出邏輯(Excel 生成)
    └── useDeliveryValidation.ts # 收件資訊動態驗證邏輯

src/common/apis/
└── order.ts                     # 訂單模組 API 請求函式(13 個端點)

src/common/constants/
└── permissions.ts               # 新增權限常數(sales-order:create/read/update/delete/export)

src/router/
└── index.ts                     # 新增訂單管理路由(path: /order-management)

tests/pages/order-management/
├── composables/
│   ├── useOrderList.test.ts    # 訂單列表邏輯單元測試
│   ├── useOrderForm.test.ts    # 訂單表單邏輯單元測試
│   └── usePaymentRecords.test.ts # 付款記錄邏輯單元測試
└── e2e/
    └── order-management.spec.ts # E2E 測試(建立、編輯、刪除、匯出流程)
```

**Structure Decision**: 選擇 Option 2(Web application, frontend 專案)。此為既有前端單體專案擴充,訂單管理模組獨立於 `src/pages/order-management/` 目錄,遵循專案既有目錄結構規範(pages/[module]/components/composables 模式)。API 整合函式集中於 `src/common/apis/order.ts`,路由註冊於 `src/router/index.ts`,權限常數新增至 `src/common/constants/permissions.ts`。測試檔案對應於 `tests/pages/order-management/` 目錄結構。

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| [e.g., 4th project] | [current need] | [why 3 projects insufficient] |
| [e.g., Repository pattern] | [specific problem] | [why direct DB access insufficient] |

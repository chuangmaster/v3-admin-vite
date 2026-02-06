# Implementation Plan: 訂單管理模組

**Branch**: `009-order-management` | **Date**: 2026-02-06 | **Spec**: [spec.md](./spec.md)  
**Input**: Feature specification from `/specs/009-order-management/spec.md`

## Summary

訂單管理模組為銷售業務的核心功能,提供銷售人員建立、管理、查詢以及追蹤銷售訂單的完整流程。主要功能包含：訂單建立(含客戶選擇/新增、商品項目管理、收件方式與付款方式配置)、付款記錄管理(逐筆記錄付款、自動計算累積金額、付款狀態更新)、訂單狀態追蹤(訂單成立/已完成/已取消)、出貨狀態管理、多條件搜尋篩選、訂單詳情查看、出貨單列印/下載以及報表匯出。系統採用樂觀鎖定機制防止並發衝突,使用既有權限機制控制功能存取,並透過 Audit Log 記錄所有關鍵操作以滿足財務稽核需求。

**訂單編號規則**: RYO + YYYYMMDD + 流水號(001-999),例如：RYO20260204001。單日訂單達 900 筆顯示警告,超過 999 筆阻止建立。

## Technical Context

**Language/Version**: TypeScript 5.x, Vue 3.5+  
**Primary Dependencies**: Vue 3.5+, Vite 7+, Vue Router, Pinia, Element Plus, Axios, VueUse, Lodash-es, UnoCSS, xlsx  
**Storage**: 後端 API (訂單資料、付款記錄、收件資訊)  
**Testing**: Vitest (單元測試), Vue Test Utils (元件測試)  
**Target Platform**: 現代瀏覽器 (Chrome, Edge, Safari), 支援桌面環境  
**Project Type**: Web application (single-page application, SPA)  
**Performance Goals**: 列表查詢 < 2 秒 (50,000 筆訂單), 訂單建立/修改 < 1 秒 (不含網路延遲), 報表匯出 < 5 秒 (1,000 筆), Excel 匯出由前端實作  
**Constraints**: 支援 10-20 並發使用者, 年度訂單量 10,000-50,000 筆, 付款金額驗證即時顯示錯誤, 訂單編號生成單日最多 999 筆, 收件資訊前後端雙重驗證  
**Scale/Scope**: 預估 10-20 位業務人員使用, 訂單資料量 10,000-50,000 筆/年, 客戶資料量複用既有客戶管理模組, 支援 1-N 件商品項目/訂單

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### ✅ I. Documentation Language
- **Status**: PASS
- **Evidence**: spec.md 以繁體中文撰寫，plan.md 技術背景以繁體中文說明，程式碼註解將遵循專案慣例(繁體中文)

### ✅ II. Simplified Architecture
- **Status**: PASS
- **Evidence**: 採用標準 Vue 3 + Element Plus 模組化架構，遵循專案既有的 pages/[module]/components/composables 目錄結構，不引入額外抽象層

### ✅ III. Latest Tech Stack
- **Status**: PASS
- **Evidence**: 使用最新穩定版本 Vue 3.5+, Vite 7+, TypeScript 5.x, Element Plus 2.11.2, Pinia 3.0.3，與專案現有技術棧一致

### ✅ IV. Code Quality & Testing
- **Status**: PASS
- **Evidence**: 將使用 ESLint 檢查，Vitest 進行單元測試，關鍵組合式函式（useOrderManagement, useOrderForm, usePaymentRecords）將包含測試用例

### ✅ V. User Experience First
- **Status**: PASS
- **Evidence**: 提供客戶快速搜尋/新增、付款金額即時驗證、累積金額自動計算、清晰錯誤提示、訂單狀態視覺化、權限控制按鈕隱藏、Excel 匯出等使用者友善功能

### ✅ VI. Brownfield Project Protection
- **Status**: PASS  
- **Evidence**: 此為新功能模組，將遵循既有的目錄結構與命名規範（參考 user-management, service-order-management, customer-management 模組），不修改現有程式碼

### ✅ VII. Backend API Contract Compliance
- **Status**: PASS
- **Evidence**: 將嚴格遵循後端 API 規範定義的格式，使用標準 ApiResponse<T> 格式、JWT Bearer Token 認證、標準分頁參數（pageNumber, pageSize）、處理所有定義的業務邏輯錯誤碼、樂觀鎖定版本號機制

**Overall Gate Status**: ✅ PASS - 符合所有憲章原則，無需例外說明

## Project Structure

### Documentation (this feature)

```text
specs/009-order-management/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
│   └── api-contracts.md # API 契約定義
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
src/pages/order-management/
├── index.vue                          # 主頁面：訂單列表、查詢、篩選、Excel 匯出
├── types.ts                           # 型別定義：SalesOrder, OrderItem, PaymentRecord, CreateOrderRequest, etc.
├── apis/
│   └── sales-order.ts                 # API 服務：getOrderList, createOrder, updateOrder, deleteOrder, etc.
├── components/
│   ├── OrderForm.vue                  # 訂單表單元件（建立/編輯）
│   ├── OrderTable.vue                 # 訂單表格元件
│   ├── OrderItemForm.vue              # 商品項目表單元件（動態新增/移除）
│   ├── CustomerSelector.vue           # 客戶選擇器元件（含搜尋與新增客戶功能）
│   ├── ShippingInfoForm.vue           # 收件資訊表單元件（依收件方式動態顯示欄位）
│   ├── PaymentRecordDialog.vue        # 付款記錄新增對話框元件
│   ├── PaymentRecordList.vue          # 付款歷程列表元件
│   └── ShippingLabelViewer.vue        # 出貨單查看與列印元件
├── composables/
│   ├── useOrderManagement.ts          # 列表查詢、刪除、分頁、篩選、Excel 匯出邏輯
│   ├── useOrderForm.ts                # 訂單表單邏輯：驗證、提交、狀態管理、樂觀鎖定
│   ├── useOrderItems.ts               # 商品項目管理邏輯：新增、移除、驗證、總金額計算
│   ├── usePaymentRecords.ts           # 付款記錄管理：新增、修改、累積金額計算、狀態自動更新
│   ├── useShippingInfo.ts             # 收件資訊管理：依收件方式動態驗證、預設運費載入
│   ├── useCustomerSearch.ts           # 客戶搜尋與選擇邏輯（複用既有客戶管理模組 API）
│   └── useExportExcel.ts              # Excel 匯出邏輯（使用 xlsx 套件）
└── constants/
    └── shipping-config.ts             # 收件方式與預設運費配置

src/common/constants/permissions.ts   # 新增訂單管理權限常數定義
src/router/index.ts                    # 新增訂單管理路由配置

tests/pages/order-management/
├── composables/
│   ├── useOrderManagement.test.ts
│   ├── useOrderForm.test.ts
│   ├── useOrderItems.test.ts
│   ├── usePaymentRecords.test.ts
│   └── useShippingInfo.test.ts
└── components/
    ├── OrderForm.test.ts
    ├── OrderItemForm.test.ts
    ├── CustomerSelector.test.ts
    └── PaymentRecordDialog.test.ts
```

**Structure Decision**: 採用專案既有的頁面模組結構（參考 user-management, service-order-management, customer-management），將所有訂單管理相關的邏輯、元件、API 集中於 `src/pages/order-management` 目錄。測試檔案對應放置於 `tests/pages/order-management`。權限常數新增至 `src/common/constants/permissions.ts`，路由配置新增至 `src/router/index.ts`。此結構符合 Brownfield Project Protection 原則，保持與現有模組一致性。

## Complexity Tracking

> **無需填寫** - 所有憲章檢查項目均通過，無違反需要說明。

# Implementation Plan: 服務單管理

**Branch**: `004-service-order-management` | **Date**: 2025-12-14 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/004-service-order-management/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

實作服務單管理模組（寄賣單與收購單），包含完整的建立、查詢、修改、簽名與客戶管理功能。核心技術包括：前端表單管理、Element Plus UI 元件庫、觸控簽名板（signature_pad）、線上簽名整合（Dropbox Sign API）、Excel 匯出（SheetJS）、身分證 OCR 處理（後端 Azure Vision + Google Gemini）。

## Technical Context

**Language/Version**: TypeScript 5.x、Vue 3.5+  
**Primary Dependencies**: Element Plus（UI 元件庫）、Pinia（狀態管理）、Vue Router（路由）、Axios（HTTP 客戶端）、signature_pad（觸控簽名）、SheetJS（Excel 匯出）  
**Storage**: 後端 API（RESTful），前端使用 LocalStorage 作為草稿暫存  
**Testing**: Vitest（單元測試）、Vue Test Utils（元件測試）  
**Target Platform**: Web 應用程式（支援桌面與行動裝置瀏覽器）  
**Project Type**: Web 應用程式（前端單頁應用）  
**Performance Goals**: 服務單列表查詢 < 2 秒（50,000 筆資料內）、建立服務單 < 3 分鐘（不含簽名時間）、OCR 辨識由後端處理（前端僅負責上傳）  
**Constraints**: 身分證檔案上傳限制 10MB、Excel 匯出限制 10,000 筆、分頁每頁最多 100 筆  
**Scale/Scope**: 支援 50 位店員同時使用、預估 50,000+ 服務單資料量、10,000+ 客戶資料

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| 原則 | 狀態 | 說明 |
|------|------|------|
| I. 文件語言（Traditional Chinese） | ✅ PASS | 所有規格文件、計劃文件均使用繁體中文 |
| II. 簡化架構 | ✅ PASS | 無過度工程設計，遵循「剛剛好」原則，複用既有模組架構（參考 user-management） |
| III. 最新技術棧 | ✅ PASS | 使用 Vue 3.5+、TypeScript 5.x、Vite 7+、Element Plus 最新穩定版 |
| IV. 程式碼品質與測試 | ✅ PASS | 將提供單元測試與元件測試，遵循 ESLint 規範 |
| V. 使用者體驗優先 | ✅ PASS | 支援觸控簽名、自動辨識身分證（後端處理）、草稿儲存、Excel 匯出等 UX 優化功能 |
| VI. 既有專案保護 | ✅ PASS | 新增功能模組，不修改既有程式碼（僅新增權限常數與路由） |
| VII. 後端 API 契約遵循 | ✅ PASS | 已定義完整 API 契約（contracts/api-contracts.md），遵循 `ApiResponse<T>` 格式與標準錯誤代碼 |

**結論**: 無違反憲章原則，可進入 Phase 0 研究階段。

## Project Structure

### Documentation (this feature)

```text
specs/004-service-order-management/
├── plan.md              # 此文件（實作計劃）
├── spec.md              # 功能規格
├── research.md          # Phase 0 技術研究（已完成）
├── data-model.md        # Phase 1 資料模型（已完成）
├── quickstart.md        # Phase 1 快速入門指南（已完成）
├── contracts/           # Phase 1 API 契約
│   └── api-contracts.md # API 契約定義（已完成）
├── checklists/          # 檢查清單
│   └── requirements.md  # 需求檢查清單
└── tasks.md             # Phase 2 任務拆分（待執行 /speckit.tasks）
```

### Source Code (repository root)

```text
src/pages/service-order-management/
├── index.vue                         # 服務單列表查詢主頁面
├── create.vue                        # 服務單建立頁面
├── detail.vue                        # 服務單詳細頁面
├── types.ts                          # 型別定義
├── apis/
│   └── service-order.ts              # 服務單 API
├── components/
│   ├── ServiceOrderForm.vue          # 服務單表單元件
│   ├── ServiceOrderTable.vue         # 服務單列表元件
│   ├── CustomerSearch.vue            # 客戶搜尋元件
│   ├── CustomerForm.vue              # 客戶表單元件
│   ├── IDCardUpload.vue              # 身分證明上傳元件（OCR 由後端處理）
│   ├── SignaturePad.vue              # 觸控簽名板元件
│   └── AccessoriesSelector.vue       # 商品配件選擇器元件
└── composables/
    ├── useServiceOrderManagement.ts  # 服務單列表管理
    ├── useServiceOrderForm.ts        # 服務單表單邏輯
    ├── useCustomerSearch.ts          # 客戶搜尋邏輯
    ├── useSignature.ts               # 簽名處理邏輯
    └── useExportExcel.ts             # Excel 匯出邏輯（參考 user-management）

tests/pages/service-order-management/
├── components/
│   ├── ServiceOrderForm.test.ts
│   ├── ServiceOrderTable.test.ts
│   ├── CustomerSearch.test.ts
│   └── SignaturePad.test.ts
└── composables/
    ├── useServiceOrderManagement.test.ts
    ├── useServiceOrderForm.test.ts
    └── useCustomerSearch.test.ts

src/common/constants/
└── permissions.ts               # 新增服務單權限常數

src/router/
└── index.ts                     # 新增服務單路由
```

**Structure Decision**: 採用既有專案的模組化結構（參考 `user-management` 模組），將服務單管理作為獨立頁面模組置於 `src/pages/service-order-management/`，遵循「簡化架構」原則，避免過度抽象。測試檔案對應至 `tests/pages/service-order-management/` 目錄。

## Complexity Tracking

> **此專案無違反憲章原則，無需填寫此表**

本專案遵循所有憲章原則：
- ✅ 文件使用繁體中文
- ✅ 採用簡化架構，無過度設計
- ✅ 使用最新穩定技術棧
- ✅ 包含測試計劃
- ✅ 優先考量使用者體驗
- ✅ 不修改既有程式碼
- ✅ 完整定義 API 契約

---

## Phase 0: Research & Clarification ✅ COMPLETED

**Status**: 已完成  
**Output**: [research.md](./research.md)

### 已解決的技術不明確項目

1. ✅ **後端 API 契約定義**: Phase 1 已定義完整 OpenAPI 規格（contracts/api-contracts.md）
2. ✅ **身分證自動辨識技術**: 採用後端處理（Azure Vision + Google Gemini），前端僅負責檔案上傳
3. ✅ **線上簽名整合**: 使用 Dropbox Sign API（後端整合，前端提供介面）
4. ✅ **觸控簽名功能**: 使用 signature_pad 套件
5. ✅ **Excel 匯出功能**: 使用 SheetJS（參考既有 user-management 實作）
6. ✅ **檔案上傳與拍照**: 使用 Element Plus el-upload + HTML5 capture
7. ✅ **表單草稿儲存**: 使用 LocalStorage
8. ✅ **服務單狀態管理**: 明確定義狀態轉換規則
9. ✅ **分頁與大量資料處理**: 後端分頁 + 匯出限制 10,000 筆
10. ✅ **權限控制整合**: 整合既有權限系統，新增服務單權限常數

### 技術決策摘要

| 技術領域 | 決策 | 理由 |
|---------|------|------|
| OCR 辨識 | 後端處理（Azure Vision + Google Gemini） | 前端不需要額外處理，降低複雜度與客戶端負載 |
| 線上簽名 | Dropbox Sign API（後端整合） | 符合規格需求，前端僅提供 UI 操作 |
| 觸控簽名 | signature_pad | 輕量、成熟、跨平台支援 |
| Excel 匯出 | SheetJS（前端執行） | 參考既有實作，降低後端負載 |
| 檔案上傳 | Element Plus el-upload | 既有技術棧，無需額外套件 |
| 草稿儲存 | LocalStorage | 簡單實作，提升使用者體驗 |
| 狀態管理 | 明確轉換規則 + 前端驗證 | 避免無效請求 |
| 分頁 | 後端分頁（每頁最多 100 筆） | 效能優化 |

---

## Phase 1: Design & Contracts ✅ COMPLETED

**Status**: 已完成  
**Outputs**: 
- [data-model.md](./data-model.md) - 資料模型定義
- [contracts/api-contracts.md](./contracts/api-contracts.md) - API 契約定義
- [quickstart.md](./quickstart.md) - 開發快速入門指南

### 資料模型

已定義 5 個核心實體：

1. **ServiceOrder（服務單）**: 核心實體，包含服務單編號、類型、來源、客戶資料、商品資訊、金額、狀態等
2. **Customer（客戶）**: 客戶基本資訊（姓名、電話、Email、身分證字號）
3. **Attachment（附件）**: 身分證明、合約文件等附件
4. **SignatureRecord（簽名記錄）**: 線下或線上簽名記錄
5. **ModificationHistory（修改歷史）**: 服務單變更追蹤

### API 契約

已定義 17 個 API 端點：

**服務單相關** (7 個):
- GET `/service-orders` - 查詢列表
- GET `/service-orders/{id}` - 查詢單一服務單
- POST `/service-orders` - 建立服務單
- PUT `/service-orders/{id}` - 更新服務單
- PATCH `/service-orders/{id}/status` - 更新狀態
- DELETE `/service-orders/{id}` - 刪除服務單
- GET `/service-orders/{id}/history` - 查詢修改歷史

**客戶相關** (3 個):
- GET `/customers/search` - 搜尋客戶
- POST `/customers` - 新增客戶
- GET `/customers/{id}` - 查詢客戶

**附件相關** (3 個):
- POST `/service-orders/{id}/attachments` - 上傳附件
- GET `/service-orders/{id}/attachments` - 取得附件列表
- GET `/attachments/{id}/download` - 下載附件

**簽名相關** (4 個):
- POST `/service-orders/{id}/signatures/offline` - 儲存線下簽名
- POST `/service-orders/{id}/signatures/online` - 發送線上簽名邀請
- POST `/service-orders/{id}/signatures/resend` - 重新發送簽名邀請
- GET `/service-orders/{id}/signatures` - 取得簽名記錄

**OCR 相關** (1 個):
- POST `/ocr/id-card` - 辨識身分證（後端處理）

### Constitution Check（Phase 1 後重新檢查）

| 原則 | 狀態 | 說明 |
|------|------|------|
| I. 文件語言 | ✅ PASS | 所有設計文件使用繁體中文 |
| II. 簡化架構 | ✅ PASS | 資料模型簡潔，無過度抽象 |
| III. 最新技術棧 | ✅ PASS | 使用最新穩定版套件 |
| IV. 程式碼品質與測試 | ✅ PASS | 已規劃測試策略 |
| V. 使用者體驗優先 | ✅ PASS | 設計包含 UX 優化功能（草稿、自動填入、Excel 匯出等） |
| VI. 既有專案保護 | ✅ PASS | 僅新增模組，不修改既有程式碼 |
| VII. 後端 API 契約遵循 | ✅ PASS | 完整定義 API 契約，遵循 `ApiResponse<T>` 格式 |

**結論**: Phase 1 設計符合所有憲章原則，可進入 Phase 2 任務拆分階段。

---

## Phase 2: Task Planning ⏳ PENDING

**Status**: 待執行  
**Next Command**: `/speckit.tasks`

Phase 2 將產生詳細的開發任務清單（`tasks.md`），包含：
- 細部任務拆分（元件、API、測試等）
- 任務優先順序與依賴關係
- 時程規劃（預估 14 天完成）
- 驗收標準

**執行指令**:
```bash
/speckit.tasks
```

---

## 開發時程預估

基於 quickstart.md 的開發順序建議：

| 階段 | 天數 | 說明 |
|------|------|------|
| Phase 1: 基礎架構 | 2 天 | 型別定義、API 服務層、權限常數 |
| Phase 2: 核心元件 | 3 天 | 客戶搜尋、身分證上傳、簽名板、配件選擇器 |
| Phase 3: 表單頁面 | 3 天 | 服務單表單、建立頁面 |
| Phase 4: 列表與詳細頁 | 3 天 | 列表查詢、詳細頁面、Excel 匯出 |
| Phase 5: 測試與優化 | 3 天 | 單元測試、整合測試、效能優化 |
| **總計** | **14 天** | 預估工作天數 |

---

## 風險與緩解策略

| 風險 | 影響 | 機率 | 緩解策略 |
|------|------|------|----------|
| 後端 OCR API 延遲 | 無法測試自動辨識功能 | 中 | 前端先實作手動輸入，後端 API 完成後再整合測試 |
| Dropbox Sign API 不穩定 | 線上簽名功能失效 | 低 | 提供線下簽名替代方案，實作重試機制 |
| 大量資料查詢效能問題 | 查詢速度慢於 2 秒 | 中 | 後端索引優化、前端分頁、限制查詢範圍 |
| 觸控簽名在特定裝置失效 | 線下簽名功能無法使用 | 低 | 裝置相容性測試、提供降級方案 |
| 檔案上傳失敗（網路不穩） | 服務單建立失敗 | 中 | 實作重試機制、提示使用者檢查網路 |

---

## 參考文件

### 內部文件
- [spec.md](./spec.md) - 功能規格
- [research.md](./research.md) - 技術研究
- [data-model.md](./data-model.md) - 資料模型
- [contracts/api-contracts.md](./contracts/api-contracts.md) - API 契約
- [quickstart.md](./quickstart.md) - 快速入門指南
- [.specify/memory/constitution.md](../../.specify/memory/constitution.md) - 專案憲章

### 參考模組
- `src/pages/user-management/` - 參考既有模組架構
- `src/common/constants/permissions.ts` - 權限定義範例

---

## 下一步行動

1. ✅ Phase 0 研究已完成
2. ✅ Phase 1 設計已完成
3. ⏳ 執行 `/speckit.tasks` 進入 Phase 2 任務拆分
4. ⏳ 開始開發（依照 tasks.md 的任務清單）

---

**實作計劃版本**: 1.0.0  
**最後更新**: 2025-12-14

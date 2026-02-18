# Implementation Plan: 商品訂購單文件產生

**Branch**: `010-order-document` | **Date**: 2026-02-18 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/010-order-document/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

本功能實現商品訂購單文件的前端產生與預覽功能。業務人員可從商品訂單管理頁面點擊「產生訂購單」按鈕，系統將從訂單資料中組裝訂購人資訊、商品明細、付款紀錄和定金須知，在 ElDialog 彈出視窗中預覽完整文件，並支援瀏覽器列印或儲存為 PDF。實作方式參考現有的 ShippingLabelPreview.vue 元件，遵循相同的排版格式與列印樣式。

## Technical Context

**Language/Version**: TypeScript 5.x + Vue 3.5+  
**Primary Dependencies**: Vue 3 (Composition API), Element Plus, Vite 7+, UnoCSS, SCSS  
**Storage**: N/A（純前端文件產生，無資料持久化）  
**Testing**: Vitest（單元測試）  
**Target Platform**: 現代瀏覽器（Chrome、Edge、Firefox、Safari）  
**Project Type**: Web（單頁應用程式）  
**Performance Goals**: 訂購單產生與預覽在 5 秒內完成  
**Constraints**: 
- 列印格式為 A4 紙張（210mm × 297mm）
- 商品明細過長時需自動分頁，確保項目完整不跨頁（CSS break-inside: avoid）
- 排版格式與現有出貨單（ShippingLabelPreview.vue）保持一致
- 預覽使用 ElDialog 彈出視窗，響應式支援桌機與平板  
**Scale/Scope**: 單一功能模組，包含 1 個預覽元件、相關型別定義與組合式函式

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### 初始檢查（Phase 0 前）

| 原則 | 狀態 | 說明 |
|------|------|------|
| I. 文件語言（Traditional Chinese） | ✅ PASS | 所有規格與計畫文件皆使用繁體中文 |
| II. 簡化架構 | ✅ PASS | 複用現有 ShippingLabelPreview 模式，無額外抽象層 |
| III. 最新技術堆疊 | ✅ PASS | 使用 Vue 3.5+、Element Plus、Vite 7+ 最新穩定版 |
| IV. 程式碼品質與測試 | ✅ PASS | 將包含單元測試，遵循 ESLint 規範 |
| V. 使用者體驗優先 | ✅ PASS | 遵循現有出貨單 UI/UX 模式，確保一致性 |
| VI. 既有專案保護 | ✅ PASS | 新增功能模組，不修改現有程式碼 |
| VII. 後端 API 合約遵循 | ✅ PASS | 純前端功能，無需呼叫後端 API |

**Phase 0 結論**: 所有憲章原則皆符合，無違規項目，已進入 Phase 0 研究階段。

---

### 設計後重新檢查（Phase 1 後）

| 原則 | 狀態 | 說明 |
|------|------|------|
| I. 文件語言（Traditional Chinese） | ✅ PASS | 所有設計文件（research.md、data-model.md、quickstart.md）皆使用繁體中文 |
| II. 簡化架構 | ✅ PASS | 設計確認：僅新增 1 個元件、1 個組合式函式、擴充型別定義，無過度設計 |
| III. 最新技術堆疊 | ✅ PASS | 設計確認：使用專案現有技術堆疊，無引入新依賴 |
| IV. 程式碼品質與測試 | ✅ PASS | 設計包含完整單元測試計畫（quickstart.md Step 5） |
| V. 使用者體驗優先 | ✅ PASS | 設計確認：ElDialog 預覽、響應式佈局、A4 列印格式，符合使用者期望 |
| VI. 既有專案保護 | ✅ PASS | 設計確認：僅擴充 types.ts，不修改現有邏輯 |
| VII. 後端 API 合約遵循 | ✅ PASS | 設計確認：資料轉換邏輯完全在前端，無 API 呼叫 |

**Phase 1 結論**: 設計階段所有憲章原則持續符合，無新增違規項目，可進入實作階段（Phase 2 - Tasks）。

## Project Structure

### Documentation (this feature)

```text
specs/010-order-document/
├── plan.md              # 本檔案（實作計畫）
├── research.md          # Phase 0 輸出（技術研究）
├── data-model.md        # Phase 1 輸出（資料模型）
├── quickstart.md        # Phase 1 輸出（快速開始）
├── contracts/           # Phase 1 輸出（API 合約，本功能無需）
└── tasks.md             # Phase 2 輸出（任務清單，由 /speckit.tasks 指令產生）
```

### Source Code (repository root)

```text
src/pages/order-management/
├── index.vue                           # 訂單管理主頁面（現有，需新增「產生訂購單」按鈕）
├── types.ts                            # 型別定義（現有，需擴充 OrderDocument 相關型別）
├── components/
│   ├── ShippingLabelPreview.vue       # 出貨單預覽（現有，作為參考範本）
│   ├── OrderDocumentPreview.vue       # 訂購單預覽（新增）⭐
│   └── BrandBanner.vue                # 品牌標的（現有，複用）
└── composables/
    └── useOrderDocumentPreview.ts     # 訂購單預覽邏輯（新增）⭐

src/common/assets/fonts/
└── fonts.css                           # 字型樣式（現有，複用）

tests/pages/order-management/
└── components/
    └── OrderDocumentPreview.test.ts   # 單元測試（新增）⭐
```

**結構決策**: 
- 本功能屬於訂單管理模組的擴充，將新元件與邏輯放置於 `order-management` 目錄
- 複用現有的 `BrandBanner.vue`、`types.ts` 和字型樣式
- 參考 `ShippingLabelPreview.vue` 的實作模式，確保排版與列印邏輯一致
- 組合式函式 `useOrderDocumentPreview.ts` 封裝訂購單產生與格式化邏輯
- 標記 ⭐ 的檔案為本次開發需新增或修改的檔案

## Complexity Tracking

**無複雜度違規項目** - 本功能遵循所有憲章原則，無需額外說明。

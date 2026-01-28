# Implementation Plan: 客戶管理模組

**Branch**: `006-customer-management` | **Date**: 2026-01-28 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/006-customer-management/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

實作客戶管理模組，提供客戶資料的 CRUD 操作，整合 AI 辨識技術（Gemini AI）從身分證照片提取資料，支援樂觀鎖定、權限控制、大量資料匯出（**原生 Web Worker + 專案現有 Notify 元件**）和軟刪除功能。後端 API 已完成，前端需實作列表檢視、表單驗證、AI 辨識整合、並發控制和權限管理。

**背景處理技術棧**: 使用原生 `Worker` API 進行非阻塞式 Excel 生成，完成後透過專案現有的 `Notify` 元件（`src/common/components/Notify`）推送通知至使用者，無需額外引入第三方通知套件。

## Technical Context

**Language/Version**: Vue 3.5+, TypeScript 5.0+, Vite 7+  
**Primary Dependencies**: Element Plus (UI), Pinia (狀態管理), Vue Router (路由), Axios (HTTP 請求), Vitest (測試), UnoCSS (樣式)  
**Storage**: 後端 RESTful API (OpenAPI 3.0 規格已提供)  
**Testing**: Vitest + Vue Test Utils  
**Target Platform**: Web 瀏覽器 (Chrome, Firefox, Safari, Edge 最新兩個主要版本)  
**Project Type**: Web application (frontend only, 前後端分離架構)  
**Performance Goals**: 初始載入 < 3秒, 路由轉換 < 500ms, 搜尋回應 < 1秒, Excel 匯出 5000 筆 < 15秒  
**Constraints**: 支援 100 位管理員並行存取, 單檔上傳 ≤ 5MB, 總上傳 ≤ 10MB, AI 辨識逾時 30秒  
**Scale/Scope**: 單一模組 (客戶管理), 預估 4-6 個元件, 3-5 個 composables, 1 個 API 整合層, 完整權限控制與錯誤處理

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Pre-Phase 0 Check (✅ PASSED)

| Principle | Check | Status | Notes |
|-----------|-------|--------|-------|
| I. Documentation Language | 所有規格與計畫使用繁體中文 | ✅ | spec.md 與 plan.md 皆使用繁體中文 |
| II. Simplified Architecture | 避免過度設計與複雜型別體操 | ✅ | 採用標準 CRUD 模式，遵循現有專案結構 |
| III. Latest Tech Stack | 使用最新穩定版本 | ✅ | Vue 3.5+, TypeScript 5.0+, Vite 7+ |
| IV. Code Quality & Testing | 建立測試覆蓋率 | ✅ | 規劃使用 Vitest 進行單元測試 |
| V. User Experience First | 以使用者體驗為核心 | ✅ | 提供 AI 辨識、即時搜尋、友善錯誤訊息 |
| VI. Brownfield Protection | 不修改現有程式碼 | ✅ | 新功能模組，不影響現有功能 |
| VII. Backend API Compliance | 嚴格遵循後端 API 規格 | ✅ | 已提供完整 OpenAPI 3.0 規格 |

**Decision**: 無違規項目，可進入 Phase 0 研究階段。

### Post-Phase 1 Check (✅ PASSED)

| Principle | Check | Status | Notes |
|-----------|-------|--------|-------|
| I. Documentation Language | 所有設計文件使用繁體中文 | ✅ | data-model.md, contracts/, quickstart.md 皆使用繁體中文 |
| II. Simplified Architecture | 設計避免過度複雜 | ✅ | 遵循標準 Vue 3 Composition API 模式，無不必要的抽象層 |
| III. Latest Tech Stack | 技術棧符合最新實務 | ✅ | TypeScript strict mode, Element Plus v2, Pinia Setup Store |
| IV. Code Quality & Testing | 測試規劃完整 | ✅ | quickstart.md 包含測試策略，覆蓋表單驗證、API 整合、AI 辨識 |
| V. User Experience First | 設計重視使用者體驗 | ✅ | AI 辨識 UX 流程、樂觀鎖定友善提示、搜尋防抖優化 |
| VI. Brownfield Protection | 不影響現有功能 | ✅ | 全新模組，權限常數採用命名空間隔離（CUSTOMER_PERMISSIONS） |
| VII. Backend API Compliance | API 合約完全符合後端規格 | ✅ | contracts/customer-api.md 嚴格對應 OpenAPI 3.0 規格 |

**Decision**: Phase 1 設計符合所有憲法原則，可進入 Phase 2（任務分解）。

## Project Structure

### Documentation (this feature)

```text
specs/006-customer-management/
├── spec.md              # 功能規格（已完成）
├── plan.md              # 本檔案（實作計畫）
├── research.md          # Phase 0 輸出（技術研究）
├── data-model.md        # Phase 1 輸出（資料模型）
├── quickstart.md        # Phase 1 輸出（快速開始指南）
├── contracts/           # Phase 1 輸出（API 合約文件）
│   └── customer-api.md  # 客戶 API 整合規格
└── tasks.md             # Phase 2 輸出（由 /speckit.tasks 指令生成）
```

### Source Code (repository root)

```text
src/pages/customer-management/
├── index.vue                      # 客戶列表主頁面
├── types.ts                       # TypeScript 型別定義
├── apis/                          # API 服務層
│   └── customer.ts                # 客戶 API 請求函式
├── components/                    # 私有元件
│   ├── CustomerForm.vue           # 客戶表單元件（新增/編輯）
│   ├── CustomerTable.vue          # 客戶列表表格元件
│   ├── IdCardUpload.vue           # 身分證上傳元件
│   └── OcrResultDisplay.vue       # OCR 辨識結果顯示元件
├── composables/                   # 組合式函式
│   ├── useCustomerManagement.ts   # 客戶列表管理邏輯
│   ├── useCustomerForm.ts         # 客戶表單邏輯
│   ├── useIdCardOcr.ts            # AI 辨識邏輯
│   └── useExportExcel.ts          # Excel 匯出邏輯
└── workers/                       # Web Workers
    └── excel-export.worker.ts     # Excel 背景匯出 Worker

tests/pages/customer-management/   # 測試檔案（鏡像結構）
├── components/
│   ├── CustomerForm.test.ts
│   ├── CustomerTable.test.ts
│   ├── IdCardUpload.test.ts
│   └── OcrResultDisplay.test.ts
└── composables/
    ├── useCustomerManagement.test.ts
    ├── useCustomerForm.test.ts
    ├── useIdCardOcr.test.ts
    └── useExportExcel.test.ts

src/common/                        # 通用目錄（若需共用邏輯）
├── constants/
│   └── permissions.ts             # 權限常數（新增 CUSTOMER_PERMISSIONS）
└── utils/
    └── id-number-validator.ts     # 身分證字號驗證工具（若不存在則新增）
```

**Structure Decision**: 
- 採用 **Web application (frontend only)** 結構
- 遵循專案現有的功能模組化目錄結構 (src/pages/[module-name])
- 每個模組包含 index.vue（主頁面）、types.ts（型別）、apis/（API）、components/（私有元件）、composables/（組合式函式）
- 測試檔案採用鏡像結構放置於 tests/ 目錄
- 通用邏輯（權限常數、工具函式）放置於 src/common/
- 參考現有模組結構：src/pages/user-management/, src/pages/permission-management/, src/pages/role-management/

---

**Phase 0 開始**: 技術研究與決策記錄

---

## Phase 0: Outline & Research (✅ COMPLETED)

**Deliverable**: `research.md` - 技術決策記錄與未知項解決方案

**Completed Date**: 2026-01-28

**Summary**: 
- 解析 10 個技術未知項
- 定義 API 整合 pattern（ApiResponseModel<T>）
- 研究 AI OCR 整合策略（Gemini AI multipart/form-data）
- 確立樂觀鎖定實作方式（version 欄位 + 409 Conflict 處理）
- 定義權限控制模式（v-permission 指令 + CUSTOMER_PERMISSIONS 常數）
- 規劃 Excel 匯出策略（**原生 Worker API + 專案 Notify 元件** + xlsx 套件 + 5000 筆警告）
- 制定檔案上傳驗證規則（JPG/PNG + 5MB 限制）
- 實作台灣身分證檢查碼演算法
- 建立錯誤處理對照表（HTTP Status + Business Code）
- 確立效能優化方針（搜尋防抖 500ms）

**Reference**: [research.md](./research.md)

---

## Phase 1: Design & Contracts (✅ COMPLETED)

**Deliverables**: 
- `data-model.md` - TypeScript 資料模型定義
- `contracts/customer-api.md` - API 整合規格與錯誤處理
- `quickstart.md` - 開發者快速入門指南
- `.github/agents/copilot-instructions.md` - Agent 上下文更新

**Completed Date**: 2026-01-28

**Summary**:
- Define 8 TypeScript interfaces (Customer, CreateCustomerRequest, UpdateCustomerRequest, CustomerListParams, PaginatedApiResponse<T>, IdCardRecognitionResponse, OcrResultResponse, ApiResponseModel<T>)
- Document 5 API endpoints with request/response examples, error codes, and permission mappings
- Document Gemini AI OCR API endpoint with timeout handling
- Create developer setup guide with project structure walkthrough, testing commands, and troubleshooting
- Update GitHub Copilot agent context with Vue 3.5+, TypeScript, Element Plus, Pinia, Vitest technologies
- Re-verify Constitution Check: all 7 principles passed

**References**: 
- [data-model.md](./data-model.md)
- [contracts/customer-api.md](./contracts/customer-api.md)
- [quickstart.md](./quickstart.md)

---

## Phase 2: Tasks (🔜 NEXT)

**Command**: `/speckit.tasks`

**Prerequisites**: Phase 0 & Phase 1 完成

**Expected Output**: `tasks.md` - 詳細任務分解與檢查清單

**Status**: 待執行 - 使用者需手動執行 `/speckit.tasks` 指令以生成任務清單

---

## Completion Report

### Phase 1 完成狀態

| 檔案 | 狀態 | 說明 |
|------|------|------|
| spec.md | ✅ | 功能規格（使用者提供，已移除 Azure OCR） |
| plan.md | ✅ | 實作計畫（本檔案，已補充原生 Worker + Notify 元件） |
| research.md | ✅ | 技術研究文件（706 行，11 個決策主題，含 Worker + Notify 整合） |
| data-model.md | ✅ | 資料模型定義（8 個介面 + 驗證規則） |
| contracts/customer-api.md | ✅ | API 合約文件（7 個端點 + 錯誤處理 + 權限驗證） |
| contracts/notify-integration.md | ✅ | Notify 元件整合規格（Pinia store 方案） |
| quickstart.md | ✅ | 快速入門指南（11 個章節） |
| tasks.md | ✅ | 任務清單（89 個任務，含 Worker 實作細節） |

### 關鍵指標

- **Branch**: `006-customer-management`
- **Complexity**: 中等（8 個元件 + 4 個 composables + 1 個 Worker + 7 個 API 端點）
- **Test Coverage Target**: 80%+ (關鍵邏輯：表單驗證、樂觀鎖定、AI 辨識、Worker 匯出)
- **Performance Targets**: 初始載入 < 3s, 路由轉換 < 500ms, 搜尋 < 1s, Excel 匯出 5000 筆 < 15s
- **Constitution Violations**: 0

### 技術亮點

✨ **原生 Worker API**: 使用 Vite 支援的原生 Worker,無需第三方套件  
✨ **Notify 元件整合**: 複用專案現有 Notify 元件,保持 UI 一致性  
✨ **Transferable Objects**: 優化大數據傳輸效能  
✨ **完整錯誤處理**: Worker onmessage/onerror + 分類通知推送
- **Performance Targets**: 初始載入 < 3s, 路由轉換 < 500ms, 搜尋 < 1s, Excel 匯出 < 15s
- **Constitution Violations**: 0

### 下一步行動

1. **執行任務分解**: ✅ 已完成 - tasks.md 已生成（89 個任務）
2. **檢視技術規格**: 
   - 📖 [contracts/notify-integration.md](./contracts/notify-integration.md) - Notify 元件整合方案
   - 📖 [research.md](./research.md) 第 10.4 節 - Worker 背景處理完整實作
3. **開始實作**: 按照 tasks.md 的任務順序進行開發
   - **Phase 1** (T001-T005): Setup - 建立目錄結構（含 workers/）
   - **Phase 2** (T006-T022c): Foundational - 型別、API、工具、Audit Log ⚠️ **阻塞點**
   - **Phase 3** (T023-T037): User Story 1 - 查看與搜尋（含背景匯出 T031a-T031c）
   - **Phase 4** (T038-T049): User Story 2 - 新增客戶
   - **Phase 5** (T050-T061): User Story 3 - AI 辨識
   - **Phase 6** (T062-T069): User Story 4 - 更新客戶
   - **Phase 7** (T070-T074): User Story 5 - 刪除客戶
   - **Phase 8** (T075-T085): Polish - 最終優化
4. **撰寫測試**: 同步撰寫單元測試（Vitest）
5. **Code Review**: 提交 PR 前確認所有檢查清單項目

**推薦 MVP 路徑** (52 tasks):
```bash
Phase 1 (Setup) → Phase 2 (Foundational) → Phase 3 (US1, 含完整背景匯出) → Phase 4 (US2)
```

**關鍵任務提醒**:
- ⭐ **T031a-T031c**: Worker + Notify 整合（技術亮點）
- ⭐ **T022a-T022b**: Audit Log 整合（業務需求）
- ⭐ **T064-T065**: 樂觀鎖定（並發控制）

---

**End of Plan Document**

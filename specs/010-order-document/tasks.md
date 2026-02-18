# Tasks: 商品訂購單文件產生

**Feature Branch**: `010-order-document`  
**Input**: Design documents from `/specs/010-order-document/`  
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, quickstart.md ✅  
**Tests**: 包含單元測試任務 (根據 quickstart.md 第 5 步驟)

**Organization**: 任務按 User Story 組織,確保每個 Story 可以獨立實作與測試

## Format: `[ID] [P?] [Story] Description`

- **[P]**: 可並行執行 (不同檔案、無依賴)
- **[Story]**: 任務所屬的 User Story (US1, US2)
- 描述中包含精確的檔案路徑

---

## Phase 1: Setup (專案結構)

**Purpose**: 確認專案結構與工具鏈

**Note**: 本功能為現有專案擴充,無需建立新專案

- [ ] T001 確認 Vue 3.5+、TypeScript 5+、Element Plus、Vite 7+ 環境正常運作
- [ ] T002 確認 ESLint 與 Vitest 配置可用
- [ ] T003 建立功能分支 `010-order-document`

---

## Phase 2: Foundational (基礎類型與資料結構)

**Purpose**: 建立所有 User Stories 需要的核心型別定義與常數

**⚠️ CRITICAL**: 必須完成此階段才能開始任何 User Story 實作

- [ ] T004 擴充 `OrderDocumentData` 介面至 src/pages/order-management/types.ts
- [ ] T005 [P] 擴充 `OrderDocumentItem` 介面至 src/pages/order-management/types.ts
- [ ] T006 [P] 新增 `DEPOSIT_TERMS` 常數至 src/pages/order-management/types.ts

**Checkpoint**: 型別定義完成 - User Story 實作可以開始

---

## Phase 3: User Story 1 - 產生並預覽訂購單 (Priority: P1) 🎯 MVP

**Goal**: 業務人員可以從訂單管理頁面點擊按鈕,在 ElDialog 中預覽包含訂購人資訊、商品明細、付款紀錄和定金須知的完整訂購單

**Independent Test**: 選擇任一筆訂單,點擊「產生訂購單」按鈕,檢查預覽對話框是否正確顯示所有必要欄位(訂購人姓名、電話、商品明細、付款記錄列表、定金須知),且預購訂單不顯示配件欄位

### 實作 User Story 1

- [ ] T007 [P] [US1] 建立組合式函式 useOrderDocumentPreview.ts 於 src/pages/order-management/composables/useOrderDocumentPreview.ts
- [ ] T008 [US1] 實作 transformToOrderDocument 函式於 src/pages/order-management/composables/useOrderDocumentPreview.ts
- [ ] T009 [US1] 實作 openPreview、closePreview 函式於 src/pages/order-management/composables/useOrderDocumentPreview.ts
- [ ] T010 [P] [US1] 建立 OrderDocumentPreview.vue 元件骨架於 src/pages/order-management/components/OrderDocumentPreview.vue
- [ ] T011 [US1] 實作 OrderDocumentPreview 元件的品牌標的(整合 BrandBanner.vue)與訂單基本資訊區塊於 src/pages/order-management/components/OrderDocumentPreview.vue
- [ ] T012 [US1] 實作 OrderDocumentPreview 元件的商品明細區塊(含動態配件欄位邏輯)於 src/pages/order-management/components/OrderDocumentPreview.vue
- [ ] T013 [US1] 實作 OrderDocumentPreview 元件的付款紀錄列表區塊(無紀錄時顯示「尚無付款紀錄」)於 src/pages/order-management/components/OrderDocumentPreview.vue
- [ ] T014 [US1] 實作 OrderDocumentPreview 元件的定金須知區塊於 src/pages/order-management/components/OrderDocumentPreview.vue
- [ ] T015 [US1] 新增格式化函式於 src/pages/order-management/components/OrderDocumentPreview.vue:複用 formatDateTime(來自 @@/utils/datetime.ts)、參考 useOrderExport.ts 實作 formatCurrency 與 formatAccessories(含空值與異常處理)
- [ ] T016 [US1] 實作 OrderDocumentPreview 元件的 scoped 樣式(參考 ShippingLabelPreview.vue)於 src/pages/order-management/components/OrderDocumentPreview.vue
- [ ] T017 [US1] 在 src/pages/order-management/index.vue 匯入 OrderDocumentPreview 元件與 useOrderDocumentPreview 組合式函式
- [ ] T018 [US1] 在 src/pages/order-management/index.vue 初始化組合式函式並新增事件處理函式(handleGenerateOrderDocument 呼叫 openPreview 開啟預覽對話框)
- [ ] T019 [US1] 在 src/pages/order-management/index.vue 表格操作欄新增「產生訂購單」按鈕(參考出貨單按鈕位置,點擊後開啟預覽對話框而非直接列印)
- [ ] T020 [US1] 在 src/pages/order-management/index.vue 模板底部加入 OrderDocumentPreview 對話框元件(使用 v-model:visible 與 :data props,參考 ShippingLabelPreview 結構)

### 測試 User Story 1

- [ ] T021 [P] [US1] 建立單元測試檔案 tests/pages/order-management/components/OrderDocumentPreview.test.ts
- [ ] T022 [P] [US1] 撰寫測試案例: 正確渲染訂購人資訊於 tests/pages/order-management/components/OrderDocumentPreview.test.ts
- [ ] T023 [P] [US1] 撰寫測試案例: 預購訂單不顯示配件欄位於 tests/pages/order-management/components/OrderDocumentPreview.test.ts
- [ ] T024 [P] [US1] 撰寫測試案例: 現貨訂單顯示配件欄位於 tests/pages/order-management/components/OrderDocumentPreview.test.ts
- [ ] T025 [P] [US1] 撰寫測試案例: Line ID 與銀行帳號為空時顯示「-」於 tests/pages/order-management/components/OrderDocumentPreview.test.ts
- [ ] T026 [US1] 執行所有 User Story 1 單元測試並確保通過

**Checkpoint**: User Story 1 完成 - 訂購單預覽功能已可獨立運作並測試

---

## Phase 4: User Story 2 - 列印訂購單 (Priority: P2)

**Goal**: 業務人員可以在預覽訂購單後點擊列印按鈕,觸發瀏覽器列印對話框,輸出符合 A4 紙張規格、版面清晰且商品項目不跨頁的列印文件

**Independent Test**: 產生訂購單預覽後,點擊列印按鈕,檢查是否正確觸發列印對話框,且預覽版面適合 A4 紙張、品牌標的與表格框線清晰、商品項目完整不跨頁

### 實作 User Story 2

- [ ] T027 [US2] 在 useOrderDocumentPreview.ts 新增 printDocument 函式(呼叫 window.print)於 src/pages/order-management/composables/useOrderDocumentPreview.ts
- [ ] T028 [US2] 實作 OrderDocumentPreview 元件的列印按鈕事件處理於 src/pages/order-management/components/OrderDocumentPreview.vue
- [ ] T029 [US2] 新增列印專用樣式(@media print)於 src/pages/order-management/components/OrderDocumentPreview.vue
- [ ] T030 [US2] 設定 @page 規則(A4 紙張、邊界 15mm)於 src/pages/order-management/components/OrderDocumentPreview.vue
- [ ] T031 [US2] 隱藏非必要元素(dialog header/footer)於列印樣式於 src/pages/order-management/components/OrderDocumentPreview.vue
- [ ] T032 [US2] 實作商品項目與定金須知的 break-inside: avoid 樣式於 src/pages/order-management/components/OrderDocumentPreview.vue
- [ ] T033 [US2] 設定品牌標的與區段標題的 print-color-adjust: exact 樣式於 src/pages/order-management/components/OrderDocumentPreview.vue
- [ ] T034 [US2] 確保列印時只顯示訂購單對話框(使用 :has() 選擇器)於 src/pages/order-management/components/OrderDocumentPreview.vue

### 測試 User Story 2

- [ ] T035 [P] [US2] 撰寫測試案例: 點擊列印按鈕觸發 print 事件於 tests/pages/order-management/components/OrderDocumentPreview.test.ts
- [ ] T036 [US2] 手動測試: 在 Chrome 中驗證列印預覽符合 A4 格式
- [ ] T037 [US2] 手動測試: 在 Edge 中驗證列印預覽符合 A4 格式
- [ ] T038 [US2] 手動測試: 驗證商品明細過長時自動分頁且項目不跨頁
- [ ] T039 [US2] 手動測試: 驗證列印輸出中品牌標的、表格框線清晰可見

**Checkpoint**: User Story 2 完成 - 列印功能已可正常運作且輸出格式正確

---

## Phase 5: Polish & Cross-Cutting Concerns

**Purpose**: 跨 User Story 的優化與最終驗證

- [ ] T040 [P] 確認所有程式碼符合 ESLint 規範(執行 pnpm lint)
- [ ] T041 [P] 確認 TypeScript 編譯無錯誤(執行 pnpm type-check)
- [ ] T042 執行完整測試套件(執行 pnpm test)
- [ ] T043 [P] 執行 quickstart.md 手動測試檢查清單(基本顯示、動態欄位、列印功能、響應式、邊界案例,含 SC-006 排版一致性六項檢查清單)
- [ ] T044 程式碼審查: 確認所有 JSDoc 註解完整
- [ ] T045 程式碼審查: 確認元件與檔案命名符合專案規範
- [ ] T046 [P] 在平板裝置(768x1024)測試預覽視窗響應式顯示
- [ ] T047 [P] 在桌機裝置(1920x1080)測試預覽視窗顯示
- [ ] T048 執行邊界案例測試: 無付款紀錄(顯示「尚無付款紀錄」)、必要欄位缺失(錯誤訊息)、長商品名稱、超過 10 項商品明細
- [ ] T049 文件更新: 確認 plan.md、spec.md、data-model.md、research.md、quickstart.md 與實作一致
- [ ] T050 準備 Pull Request 並填寫檢查清單

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: 無依賴 - 可立即開始
- **Foundational (Phase 2)**: 依賴 Setup 完成 - 阻塞所有 User Stories
- **User Story 1 (Phase 3)**: 依賴 Foundational 完成 - 為 MVP
- **User Story 2 (Phase 4)**: 依賴 User Story 1 完成 (列印功能建立在預覽元件之上)
- **Polish (Phase 5)**: 依賴所有 User Stories 完成

### User Story Dependencies

- **User Story 1 (P1)**: 可在 Foundational 完成後開始 - 無其他 Story 依賴
- **User Story 2 (P2)**: 必須在 User Story 1 完成後開始 (需要預覽元件)

### Within Each User Story

#### User Story 1 內部順序:
1. T007-T009: 組合式函式 (可與 T010 並行)
2. T010-T016: 預覽元件實作 (依序執行,T011-T014 需依賴 T010)
3. T017-T020: 頁面整合 (依賴元件與組合式函式完成)
4. T021-T026: 測試 (T021-T025 可並行,T026 最後執行)

#### User Story 2 內部順序:
1. T027: printDocument 函式 (依賴 US1 完成)
2. T028-T034: 列印樣式實作 (T029-T034 依賴 T028,但內部可快速迭代)
3. T035-T039: 測試 (T035 可與 T036-T037 並行,T038-T039 需實際列印測試)

### Parallel Opportunities

- **Phase 1**: T001-T003 可依序快速執行(驗證性質)
- **Phase 2**: T004-T006 可並行執行 (不同型別定義,但建議在同一檔案中依序新增)
- **User Story 1**:
  - T007-T009 與 T010 可並行 (組合式函式與元件骨架)
  - T021-T025 可完全並行 (不同測試案例)
- **User Story 2**:
  - T036-T037 可並行 (不同瀏覽器測試)
  - T038-T039 可並行 (不同列印場景)
- **Phase 5**:
  - T040-T041 可並行
  - T043、T046-T047 可並行 (不同裝置測試)

---

## Parallel Example: User Story 1

```bash
# 階段 1: 並行建立骨架
Task: T007 [P] [US1] 建立組合式函式檔案
Task: T010 [P] [US1] 建立預覽元件骨架

# 階段 2: 並行執行測試
Task: T022 [P] [US1] 測試訂購人資訊渲染
Task: T023 [P] [US1] 測試預購訂單不顯示配件
Task: T024 [P] [US1] 測試現貨訂單顯示配件
Task: T025 [P] [US1] 測試空值欄位顯示
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (快速驗證,約 15 分鐘)
2. Complete Phase 2: Foundational (型別定義,約 15 分鐘)
3. Complete Phase 3: User Story 1 (核心功能,約 3-4 小時)
4. **STOP and VALIDATE**: 獨立測試 User Story 1 預覽功能
5. 可選擇先部署/展示 MVP (純預覽功能)

### Incremental Delivery

1. **Setup + Foundational (30 分鐘)** → 型別基礎就緒
2. **Add User Story 1 (3-4 小時)** → 獨立測試預覽功能 → 可展示/部署 MVP
3. **Add User Story 2 (1-2 小時)** → 獨立測試列印功能 → 完整功能部署
4. **Polish (1 小時)** → 最終驗證與優化

### Sequential Team Strategy (單人開發建議)

1. 依序完成 Phase 1 → Phase 2 → Phase 3 → Phase 4 → Phase 5
2. User Story 1 完成後立即驗證預覽功能
3. User Story 2 完成後驗證列印輸出品質
4. 總開發時間估計: **6-8 小時**

### Parallel Team Strategy (雙人開發可選)

1. 共同完成 Phase 1 + Phase 2 (30 分鐘)
2. 分工:
   - **Developer A**: T007-T016 (組合式函式 + 預覽元件)
   - **Developer B**: T021-T025 (測試案例準備)
3. 合併後共同完成 T017-T020 (頁面整合)
4. Developer A 完成 User Story 2 實作
5. Developer B 完成 User Story 2 測試與 Phase 5

---

## Notes

- **[P] 任務**: 不同檔案、無依賴,可並行執行
- **[Story] 標籤**: 任務追溯至特定 User Story
- **測試策略**: 包含單元測試與手動測試,確保跨瀏覽器相容性
- **列印樣式**: 參考現有 ShippingLabelPreview.vue 實作模式
- **配件欄位**: 使用 `v-if` 根據訂單類型動態顯示
- **分頁控制**: 使用 CSS `break-inside: avoid` 由瀏覽器自動處理
- **權限控制**: 按鈕需加上 `v-permission="[ORDER_PERMISSIONS.READ]"`
- **Commit 建議**: 每完成一個任務或邏輯群組即提交
- **Checkpoint**: 在每個 User Story 完成後獨立驗證功能
- **避免**: 含糊任務描述、相同檔案衝突、破壞 Story 獨立性的跨 Story 依賴

---

## Task Count Summary

- **Phase 1 (Setup)**: 3 tasks (約 15 分鐘)
- **Phase 2 (Foundational)**: 3 tasks (約 15 分鐘)
- **Phase 3 (User Story 1)**: 20 tasks (約 3-4 小時)
  - Implementation: 14 tasks
  - Testing: 6 tasks
- **Phase 4 (User Story 2)**: 13 tasks (約 1-2 小時)
  - Implementation: 8 tasks
  - Testing: 5 tasks
- **Phase 5 (Polish)**: 11 tasks (約 1 小時)

**Total: 50 tasks** (預估 6-8 小時完成)

---

## MVP Scope Recommendation

**建議 MVP**: 僅實作 User Story 1 (Phase 1 + Phase 2 + Phase 3)

**理由**:
- User Story 1 提供核心價值: 預覽訂購單內容
- 可獨立驗證資料轉換與顯示邏輯是否正確
- User Story 2 (列印功能) 可作為第二階段增強功能
- MVP 可在 4-4.5 小時內完成並展示

**完整功能**: Phase 1-5 全部完成 (6-8 小時)

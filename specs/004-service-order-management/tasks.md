---

description: "Task list for Service Order Management feature implementation"
---

# Tasks: 服務單管理

**Input**: Design documents from `/specs/004-service-order-management/`
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/api-contracts.md ✅

**Tests**: 本專案包含測試任務(已規劃單元測試與元件測試)

**Organization**: 任務依用戶故事分組，確保每個故事可獨立實作與測試

## Format: `[ID] [P?] [Story] Description`

- **[P]**: 可並行執行(不同檔案、無依賴關係)
- **[Story]**: 任務所屬用戶故事(如 US1, US2, US3)
- 包含完整檔案路徑

---

## Phase 1: Setup (專案初始化)

**Purpose**: 建立專案基礎結構與套件安裝

- [ ] T001 安裝新增套件(signature_pad 與 xlsx)至 package.json
- [ ] T002 新增服務單權限常數至 src/common/constants/permissions.ts
- [ ] T003 新增服務單路由至 src/router/index.ts

---

## Phase 2: Foundational (基礎建設 - 阻塞性前置任務)

**Purpose**: 核心基礎設施,必須在任何用戶故事實作前完成

**⚠️ CRITICAL**: 此階段未完成前,任何用戶故事都無法開始

- [ ] T004 定義 TypeScript 型別於 src/pages/service-order-management/types.ts
- [ ] T005 [P] 建立 API 服務層於 src/pages/service-order-management/apis/service-order.ts (註:服務單編號由後端自動生成,前端無需處理編號生成邏輯)
- [ ] T006 [P] 建立客戶 API 服務層於 src/pages/service-order-management/apis/customer.ts
- [ ] T007 [P] 建立附件 API 服務層於 src/pages/service-order-management/apis/attachment.ts
- [ ] T008 [P] 建立簽名 API 服務層於 src/pages/service-order-management/apis/signature.ts
- [ ] T009 [P] 建立 OCR API 服務層於 src/pages/service-order-management/apis/ocr.ts

**Checkpoint**: 基礎建設完成 - 用戶故事實作可並行開始

---

## Phase 3: User Story 1 - 建立收購單 (Priority: P1) 🎯 MVP

**Goal**: 店員可快速建立收購單以記錄客戶的精品收購交易,包含客戶資訊、商品詳情與收購金額,並確保收購合約完整簽署

**Independent Test**: 可透過建立一筆完整的收購單(包含客戶選擇、商品資訊填寫、身分證明上傳、線下簽名)並驗證資料儲存與合約產生來獨立測試

### Implementation for User Story 1

#### Core Components (可並行)

- [ ] T010 [P] [US1] 建立客戶搜尋元件於 src/pages/service-order-management/components/CustomerSearch.vue
- [ ] T011 [P] [US1] 建立客戶表單元件於 src/pages/service-order-management/components/CustomerForm.vue
- [ ] T012 [P] [US1] 建立身分證上傳元件(OCR 整合)於 src/pages/service-order-management/components/IDCardUpload.vue
- [ ] T013 [P] [US1] 建立觸控簽名板元件於 src/pages/service-order-management/components/SignaturePad.vue

#### Composables (依賴 Components)

- [ ] T014 [US1] 建立客戶搜尋組合式函式於 src/pages/service-order-management/composables/useCustomerSearch.ts
- [ ] T015 [US1] 建立簽名處理組合式函式於 src/pages/service-order-management/composables/useSignature.ts
- [ ] T016 [US1] 建立服務單表單組合式函式於 src/pages/service-order-management/composables/useServiceOrderForm.ts

#### Main Components (依賴 Core Components 與 Composables)

- [ ] T017 [US1] 建立服務單表單元件於 src/pages/service-order-management/components/ServiceOrderForm.vue
- [ ] T018 [US1] 建立服務單建立頁面於 src/pages/service-order-management/create.vue

#### Tests for User Story 1 (可並行)

- [ ] T019 [P] [US1] 撰寫 CustomerSearch 元件測試於 tests/pages/service-order-management/components/CustomerSearch.test.ts
- [ ] T020 [P] [US1] 撰寫 CustomerForm 元件測試於 tests/pages/service-order-management/components/CustomerForm.test.ts
- [ ] T021 [P] [US1] 撰寫 SignaturePad 元件測試於 tests/pages/service-order-management/components/SignaturePad.test.ts
- [ ] T022 [P] [US1] 撰寫 ServiceOrderForm 元件測試於 tests/pages/service-order-management/components/ServiceOrderForm.test.ts
- [ ] T023 [P] [US1] 撰寫 useCustomerSearch 組合式函式測試於 tests/pages/service-order-management/composables/useCustomerSearch.test.ts
- [ ] T024 [P] [US1] 撰寫 useServiceOrderForm 組合式函式測試於 tests/pages/service-order-management/composables/useServiceOrderForm.test.ts

**Checkpoint**: 用戶故事 1 應完全可用且可獨立測試

---

## Phase 4: User Story 2 - 建立寄賣單 (Priority: P1) 🎯 MVP

**Goal**: 店員可快速建立寄賣單以記錄客戶的精品寄賣交易,包含客戶資訊、商品詳情、寄賣金額、寄賣期間與續約設定,並確保寄賣合約完整簽署

**Independent Test**: 可透過建立一筆完整的寄賣單(包含客戶選擇、商品資訊、配件、寄賣日期、瑕疵說明、續約設定、身分證明上傳、線下簽名)並驗證資料儲存與合約產生來獨立測試

### Implementation for User Story 2

#### Components (可並行,依賴 US1 元件)

- [ ] T025 [P] [US2] 建立商品配件選擇器元件於 src/pages/service-order-management/components/AccessoriesSelector.vue
- [ ] T026 [P] [US2] 建立商品瑕疵選擇器元件於 src/pages/service-order-management/components/DefectsSelector.vue

#### Enhancement (擴展 US1 元件支援寄賣單)

- [ ] T027 [US2] 擴展 ServiceOrderForm 元件支援寄賣單欄位(配件、日期、瑕疵、續約)於 src/pages/service-order-management/components/ServiceOrderForm.vue
- [ ] T028 [US2] 擴展 useServiceOrderForm 組合式函式支援寄賣單邏輯於 src/pages/service-order-management/composables/useServiceOrderForm.ts

#### Tests for User Story 2 (可並行)

- [ ] T029 [P] [US2] 撰寫 AccessoriesSelector 元件測試於 tests/pages/service-order-management/components/AccessoriesSelector.test.ts
- [ ] T030 [P] [US2] 撰寫 DefectsSelector 元件測試於 tests/pages/service-order-management/components/DefectsSelector.test.ts

**Checkpoint**: 用戶故事 1 與 2 均應獨立運作

---

## Phase 5: User Story 3 - 客戶搜尋與選擇 (Priority: P2)

**Goal**: 店員可快速搜尋並選擇既有客戶資料,或在找不到客戶時新增客戶資料,以提升服務單建立效率

**Independent Test**: 可透過搜尋既有客戶(姓名、電話、Email、身分證字號)、選擇客戶並驗證資料自動填入,或搜尋不到時新增客戶來獨立測試

**Note**: 此功能核心元件已在 US1 實作(CustomerSearch、CustomerForm),本階段主要為優化與增強

### Implementation for User Story 3

#### Enhancement (優化搜尋功能)

- [ ] T031 [US3] 優化 CustomerSearch 元件支援多條件搜尋(姓名、電話、Email、身分證字號)於 src/pages/service-order-management/components/CustomerSearch.vue
- [ ] T032 [US3] 優化 useCustomerSearch 組合式函式支援進階搜尋邏輯於 src/pages/service-order-management/composables/useCustomerSearch.ts

#### Tests for User Story 3 (可並行)

- [ ] T033 [P] [US3] 撰寫客戶搜尋進階功能測試於 tests/pages/service-order-management/composables/useCustomerSearch.test.ts
- [ ] T033-1 [P] [US3] 撰寫獨立新增客戶流程整合測試於 tests/pages/service-order-management/components/CustomerForm.test.ts

**Checkpoint**: 所有客戶管理功能應完全可用

---

## Phase 6: User Story 4 - 服務單查詢與管理 (Priority: P2)

**Goal**: 店員可查詢、瀏覽、修改已建立的收購單與寄賣單,並管理服務單狀態與附件

**Independent Test**: 可透過搜尋服務單(依類型、客戶名稱、日期範圍等條件)、查看詳細資訊、修改服務單、更新狀態、下載附件來獨立測試

### Implementation for User Story 4

#### Core Components (可並行)

- [ ] T034 [P] [US4] 建立服務單列表元件於 src/pages/service-order-management/components/ServiceOrderTable.vue
- [ ] T035 [P] [US4] 建立服務單篩選元件於 src/pages/service-order-management/components/ServiceOrderFilter.vue
- [ ] T036 [P] [US4] 建立狀態更新元件於 src/pages/service-order-management/components/StatusUpdateDialog.vue
- [ ] T037 [P] [US4] 建立修改歷史元件於 src/pages/service-order-management/components/ModificationHistory.vue

#### Composables (依賴 Components)

- [ ] T038 [US4] 建立服務單列表管理組合式函式於 src/pages/service-order-management/composables/useServiceOrderManagement.ts
- [ ] T039 [US4] 建立 Excel 匯出組合式函式於 src/pages/service-order-management/composables/useExportExcel.ts

#### Main Pages (依賴 Components 與 Composables)

- [ ] T040 [US4] 建立服務單列表查詢主頁面於 src/pages/service-order-management/index.vue
- [ ] T041 [US4] 建立服務單詳細頁面於 src/pages/service-order-management/detail.vue

#### Tests for User Story 4 (可並行)

- [ ] T042 [P] [US4] 撰寫 ServiceOrderTable 元件測試於 tests/pages/service-order-management/components/ServiceOrderTable.test.ts
- [ ] T043 [P] [US4] 撰寫 ServiceOrderFilter 元件測試於 tests/pages/service-order-management/components/ServiceOrderFilter.test.ts
- [ ] T044 [P] [US4] 撰寫 useServiceOrderManagement 組合式函式測試於 tests/pages/service-order-management/composables/useServiceOrderManagement.test.ts
- [ ] T045 [P] [US4] 撰寫 useExportExcel 組合式函式測試於 tests/pages/service-order-management/composables/useExportExcel.test.ts

**Checkpoint**: 所有用戶故事應獨立運作

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: 跨用戶故事的改進與優化

- [ ] T046 [P] 新增草稿儲存功能至 ServiceOrderForm(LocalStorage,表單變更後 2 秒自動儲存)於 src/pages/service-order-management/components/ServiceOrderForm.vue
- [ ] T046-1 [P] 撰寫草稿儲存功能測試於 tests/pages/service-order-management/components/ServiceOrderForm.test.ts
- [ ] T047 [P] 優化錯誤處理與使用者提示訊息
- [ ] T048 [P] 優化載入狀態與骨架屏
- [ ] T049 [P] 新增國際化支援(i18n)
- [ ] T050 程式碼審查與重構
- [ ] T051 效能優化(大量資料處理、分頁優化)
- [ ] T052 安全性加固(權限檢查、資料驗證)
- [ ] T053 執行 quickstart.md 驗證流程

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: 無依賴 - 可立即開始
- **Foundational (Phase 2)**: 依賴 Setup 完成 - **阻塞所有用戶故事**
- **User Stories (Phase 3-6)**: 全部依賴 Foundational 階段完成
  - 用戶故事可並行進行(如有足夠人力)
  - 或按優先順序依序進行(P1 → P2)
- **Polish (Phase 7)**: 依賴所有預期用戶故事完成

### User Story Dependencies

- **User Story 1 (P1) - 建立收購單**: Foundational 完成後即可開始 - 無其他故事依賴
- **User Story 2 (P1) - 建立寄賣單**: 依賴 US1 核心元件(CustomerSearch, CustomerForm, IDCardUpload, SignaturePad),但擴展獨立實作
- **User Story 3 (P2) - 客戶搜尋**: 依賴 US1 客戶元件,主要為功能優化
- **User Story 4 (P2) - 查詢管理**: 依賴 US1 與 US2 的資料模型,但查詢功能獨立實作

### Within Each User Story

- 核心元件(Components) → 組合式函式(Composables) → 主頁面(Pages)
- 測試可與實作並行(標記 [P] 的任務)
- 故事完成後再移至下一優先順序

### Parallel Opportunities

- Setup 階段所有標記 [P] 的任務可並行
- Foundational 階段所有標記 [P] 的任務可並行
- Foundational 完成後,US1 與 US2 可部分並行(US2 依賴 US1 元件)
- 每個故事內標記 [P] 的元件可並行開發
- 每個故事內標記 [P] 的測試可並行執行
- 不同團隊成員可同時處理不同用戶故事

---

## Parallel Example: User Story 1

```bash
# US1 核心元件可並行開發:
Task T010: "建立客戶搜尋元件 CustomerSearch.vue"
Task T011: "建立客戶表單元件 CustomerForm.vue"
Task T012: "建立身分證上傳元件 IDCardUpload.vue"
Task T013: "建立觸控簽名板元件 SignaturePad.vue"

# US1 測試可並行執行:
Task T019: "CustomerSearch 元件測試"
Task T020: "CustomerForm 元件測試"
Task T021: "SignaturePad 元件測試"
Task T022: "ServiceOrderForm 元件測試"
Task T023: "useCustomerSearch 測試"
Task T024: "useServiceOrderForm 測試"
```

---

## Parallel Example: User Story 4

```bash
# US4 核心元件可並行開發:
Task T034: "建立服務單列表元件 ServiceOrderTable.vue"
Task T035: "建立服務單篩選元件 ServiceOrderFilter.vue"
Task T036: "建立狀態更新元件 StatusUpdateDialog.vue"
Task T037: "建立修改歷史元件 ModificationHistory.vue"

# US4 測試可並行執行:
Task T042: "ServiceOrderTable 元件測試"
Task T043: "ServiceOrderFilter 元件測試"
Task T044: "useServiceOrderManagement 測試"
Task T045: "useExportExcel 測試"
```

---

## Implementation Strategy

### MVP First (僅 User Story 1 與 2 - 核心建單功能)

1. 完成 Phase 1: Setup
2. 完成 Phase 2: Foundational (**CRITICAL** - 阻塞所有故事)
3. 完成 Phase 3: User Story 1 - 建立收購單
4. 完成 Phase 4: User Story 2 - 建立寄賣單
5. **STOP and VALIDATE**: 獨立測試 US1 與 US2
6. 準備部署/展示

### Incremental Delivery (漸進式交付)

1. 完成 Setup + Foundational → 基礎就緒
2. 新增 User Story 1 → 獨立測試 → 部署/展示 (MVP - 收購單!)
3. 新增 User Story 2 → 獨立測試 → 部署/展示 (MVP - 寄賣單!)
4. 新增 User Story 3 → 獨立測試 → 部署/展示 (優化客戶搜尋)
5. 新增 User Story 4 → 獨立測試 → 部署/展示 (完整查詢管理)
6. 每個故事增加價值而不破壞先前故事

### Parallel Team Strategy (並行團隊策略)

若有多位開發者:

1. 團隊共同完成 Setup + Foundational
2. Foundational 完成後:
   - Developer A: User Story 1 (收購單)
   - Developer B: User Story 2 核心元件 (配件選擇器、瑕疵選擇器)
   - Developer C: User Story 4 核心元件 (列表、篩選)
3. 故事獨立完成並整合

---

## Task Summary

### 總任務數: 55

- **Phase 1 (Setup)**: 3 任務
- **Phase 2 (Foundational)**: 6 任務
- **Phase 3 (US1 - 建立收購單)**: 15 任務 (9 實作 + 6 測試)
- **Phase 4 (US2 - 建立寄賣單)**: 6 任務 (4 實作 + 2 測試)
- **Phase 5 (US3 - 客戶搜尋)**: 4 任務 (2 實作 + 2 測試)
- **Phase 6 (US4 - 查詢管理)**: 12 任務 (8 實作 + 4 測試)
- **Phase 7 (Polish)**: 9 任務

### 並行機會: 26 任務標記為 [P]

- Setup: 0
- Foundational: 5
- US1: 10 (4 元件 + 6 測試)
- US2: 2 (2 測試)
- US3: 2 (2 測試)
- US4: 6 (4 元件 + 2 測試)
- Polish: 4

### 獨立測試標準

- **US1**: 可建立完整收購單(客戶選擇、商品填寫、身分證上傳、簽名)
- **US2**: 可建立完整寄賣單(包含配件、日期、瑕疵、續約設定)
- **US3**: 可搜尋客戶並自動填入資料或新增客戶
- **US4**: 可查詢、查看、修改、匯出服務單

### 建議 MVP 範圍

**僅 User Story 1 與 2** (P1 優先級):
- Phase 1 (Setup): 3 任務
- Phase 2 (Foundational): 6 任務
- Phase 3 (US1): 15 任務
- Phase 4 (US2): 6 任務
- **Total MVP**: 30 任務

**預估時程**: 8-10 天 (1 位開發者全職)

---

## Format Validation ✅

所有任務遵循嚴格的檢查清單格式:
- ✅ 所有任務以 `- [ ]` 開頭(Markdown checkbox)
- ✅ 所有任務包含 Task ID (T001-T053)
- ✅ 並行任務標記 [P]
- ✅ 用戶故事階段任務標記 [Story] (US1, US2, US3, US4)
- ✅ 所有任務包含清楚的檔案路徑
- ✅ Setup 與 Foundational 階段無 [Story] 標記
- ✅ Polish 階段無 [Story] 標記

---

## Notes

- [P] 任務 = 不同檔案、無依賴關係,可並行執行
- [Story] 標記將任務映射至特定用戶故事,便於追蹤
- 每個用戶故事應可獨立完成與測試
- 在每個檢查點停下來驗證故事獨立性
- 避免: 模糊任務、相同檔案衝突、破壞獨立性的跨故事依賴
- 提交: 每完成任務或邏輯群組後提交
- 測試優先: 標記 [P] 的測試可與實作並行或先行編寫

---

**開發快樂! 🚀**

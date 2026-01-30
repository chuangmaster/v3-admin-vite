# Tasks: 收購單瑕疵欄位

**Branch**: `007-buyback-defect`
**Feature**: 為收購單新增瑕疵欄位，完全仿效寄賣單實作
**Input**: Design documents from `/specs/007-buyback-defect/`
**Prerequisites**: plan.md, spec.md, data-model.md, contracts/api-updates.md, research.md, quickstart.md

**Tests**: 此功能包含可選的單元測試任務。單元測試為選填項目，如有需要可執行。

**Organization**: 任務依 user story 分組，使每個 story 可獨立實作與測試。

---

## Format: `[ID] [P?] [Story?] Description`

- **[P]**: 可平行執行（不同檔案，無依賴關係）
- **[Story]**: 所屬 user story（如 US1, US2, US3）
- 檔案路徑為絕對路徑，從專案根目錄開始

---

## Phase 1: Setup（專案初始化）

**Purpose**: 確認開發環境與專案結構準備就緒

- [X] T001 確認 Node.js 18+ 與 pnpm 8+ 已安裝
- [X] T002 執行 `pnpm install` 確認所有依賴正常安裝
- [X] T003 執行 `pnpm dev` 確認開發伺服器可正常啟動
- [X] T004 確認專案結構符合 plan.md 定義

**Checkpoint**: 開發環境就緒，可開始實作

---

## Phase 2: Foundational（阻塞性前置工作）

**Purpose**: 核心型別定義更新，所有後續任務依賴此階段完成

**⚠️ CRITICAL**: 此階段必須完成後，所有 user story 才能開始實作

- [X] T005 更新 `CreateBuybackProductItemRequest` 介面新增 `defects?: string[]` 屬性 in `src/pages/service-order-management/types.ts`
- [X] T006 確認 `DEFECT_OPTIONS` 常數定義正確且包含所有四種瑕疵選項 in `src/pages/service-order-management/types.ts`
- [X] T007 確認 `ProductItem` 介面的 `defects?: string[]` 屬性註釋移除「僅寄賣單」限制 in `src/pages/service-order-management/types.ts`
- [X] T008 執行 `pnpm type-check` 確認 TypeScript 編譯無錯誤

**Checkpoint**: 型別定義更新完成，user story 實作可開始

---

## Phase 3: User Story 1 - 收購單商品項目填寫瑕疵資訊 (Priority: P1) 🎯 MVP

**Goal**: 店員在建立收購單時，可針對每件商品記錄瑕疵狀況，並成功提交至後端

**Independent Test**: 建立一筆收購單，選擇多個瑕疵項目（如五金刮痕、皮質磨損），儲存後驗證資料正確提交至後端，並在查詢頁面確認瑕疵資訊正確顯示

### Implementation for User Story 1

**Note**: `DefectsSelector.vue` 元件與 `getDefectLabel()` 函式已存在，無需新增。主要工作是移除 `ProductItemForm.vue` 中限制瑕疵欄位僅用於寄賣單的條件判斷。

- [X] T009 [P] [US1] 修改 `ProductItemForm.vue` 移除瑕疵欄位的 `v-if="isConsignment"` 條件判斷（約 Line 135-145）in `src/pages/service-order-management/components/ProductItemForm.vue`
- [X] T010 [P] [US1] 修改 `ProductItemForm.vue` 的提交邏輯，移除瑕疵欄位的條件包裹（Line 140-142：將 `...(isConsignment.value && { defects: ... })` 改為直接包含 defects）in `src/pages/service-order-management/components/ProductItemForm.vue`
- [X] T011 [US1] 更新 `useServiceOrderForm.ts` 收購單請求映射，新增 `defects: item.defects` 欄位（約 Line 223-240）in `src/pages/service-order-management/composables/useServiceOrderForm.ts`
- [ ] T011a [P] [US1] 實作前端瑕疵欄位驗證邏輯：確保 defects 為陣列、項目為有效代碼（hardwareRustScratchLoss/leatherWearScratchDent/liningDirty/cornerWear），格式不符時顯示錯誤訊息 in `src/pages/service-order-management/components/ProductItemForm.vue` 或相關驗證檔案
- [ ] T012 [US1] 驗證表單元件：開啟建立收購單頁面，確認瑕疵欄位 Checkbox 群組正確顯示，包含「不勾選任何瑕疵」的空白提交情境
- [ ] T013 [US1] 驗證表單互動：勾選/取消勾選瑕疵選項，確認表單資料即時更新
- [ ] T014 [US1] 驗證 API 請求：提交收購單表單，檢查 Network 請求 payload 包含 `defects` 欄位且格式正確（陣列格式，代碼值有效）
- [ ] T015 [US1] 驗證後端整合：確認後端 API 成功接收並儲存瑕疵資訊，測試後端拒絕無效瑕疵代碼的情境（如非預期選項值、超長字串），確認錯誤訊息格式符合 ApiResponseModel 規範
- [X] T016 [US1] 驗證 `create.vue` 的 `getDefectLabel()` 函式（Line 294）能正確轉換收購單瑕疵代碼為顯示名稱 in `src/pages/service-order-management/create.vue`
- [X] T017 [US1] 驗證 `detail.vue` 的瑕疵顯示邏輯（Line 407）在收購單詳細頁面正確顯示瑕疵 Tag in `src/pages/service-order-management/detail.vue`

**Checkpoint**: User Story 1 完成，收購單可記錄與顯示瑕疵資訊

---

## Phase 4: User Story 2 - 查詢與匯出包含瑕疵資訊 (Priority: P2)

**Goal**: 店員可查詢收購單瑕疵記錄，並在 Excel 匯出時包含瑕疵欄位

**Independent Test**: 查詢包含瑕疵資訊的收購單，確認詳細頁面正確顯示瑕疵清單，並匯出 Excel 檔案驗證瑕疵欄位正確呈現

### Implementation for User Story 2

- [ ] T018 [P] [US2] 建立 `formatDefectsForExcel()` 工具函式，將瑕疵代碼轉換為頓號分隔的顯示文字。函式簽名：`formatDefectsForExcel(defects?: string[]): string`，回傳範例：「五金生鏽/刮痕/掉、皮質磨損/刮痕/壓痕」或空字串 in `src/pages/service-order-management/utils/export-excel.ts` (或相關匯出檔案)
- [ ] T019 [US2] 修改 Excel 匯出邏輯，在商品項目工作表標題列新增「商品瑕疵處」欄位 in `src/pages/service-order-management/utils/export-excel.ts` (或相關匯出檔案)
- [ ] T020 [US2] 修改 Excel 匯出資料列對應，呼叫 `formatDefectsForExcel()` 填充瑕疵資訊 in `src/pages/service-order-management/utils/export-excel.ts` (或相關匯出檔案)
- [ ] T021 [US2] 驗證查詢功能：查詢收購單詳細頁面，確認瑕疵資訊以 Tag 形式正確顯示
- [ ] T022 [US2] 驗證既有記錄相容性：查詢功能上線前的既有收購單，確認瑕疵欄位顯示「-」或「無」，無錯誤或崩潰
- [ ] T022a [P] [US2] 驗證異常資料容錯：測試後端回傳異常格式（空值 null、非陣列格式、無效代碼等），確認前端正確處理並顯示「資料格式錯誤」或留空，避免崩潰 in `src/pages/service-order-management/detail.vue` 或相關元件
- [ ] T023 [US2] 驗證 Excel 匯出：匯出包含瑕疵資訊的收購單清單，確認「商品瑕疵處」欄位存在且格式正確
- [ ] T024 [US2] 驗證 Excel 空值處理：匯出無瑕疵記錄的收購單，確認該欄位顯示為空白或「無」

**Checkpoint**: User Story 2 完成，可查詢與匯出瑕疵資訊

---

## Phase 5: User Story 3 - 修改收購單的瑕疵資訊 (Priority: P3)

**Goal**: 店員可修改已儲存收購單的瑕疵資訊，確保記錄準確性

**Independent Test**: 進入已儲存的收購單詳細頁面，修改商品項目的瑕疵選項（新增或刪除），儲存後驗證修改記錄並確認後端資料更新

**⚠️ Note**: 此階段需確認系統是否支援收購單編輯功能，若不支援則可跳過

### Prerequisite Check for User Story 3

- [X] T025 [US3] 確認系統是否支援收購單編輯功能（查看是否有編輯按鈕、編輯路由、編輯 API）→ **結果：不支援**

### Implementation for User Story 3 (條件性：僅當系統支援編輯時)

- [ ] T026 [US3] 確認編輯頁面或編輯模式中的商品項目表單包含瑕疵欄位（應已透過 US1 的 ProductItemForm 修改完成）
- [ ] T027 [US3] 確認編輯 API 請求包含 `defects` 欄位更新支援 in `src/pages/service-order-management/composables/useServiceOrderForm.ts` 或編輯相關檔案
- [ ] T028 [US3] 驗證編輯功能：進入收購單編輯模式，修改瑕疵選項（新增/移除），確認表單資料正確更新
- [ ] T029 [US3] 驗證更新 API：提交編輯表單，確認 API 請求包含更新的瑕疵資訊
- [ ] T030 [US3] 驗證修改歷史記錄：確認系統記錄瑕疵欄位的修改歷史（修改者、修改時間、修改內容）

**Checkpoint**: User Story 3 完成（若適用），可修改瑕疵資訊

---

## Phase 6: Polish & Cross-Cutting Concerns（收尾與優化）

**Purpose**: 程式碼品質提升、測試覆蓋與文件完善

### Unit Tests (Optional 可選)

**Note**: 單元測試為可選項目，專案已有足夠的整合測試覆蓋（T012-T024 驗證任務）。若需要更嚴格的測試覆蓋，可執行以下單元測試任務。

- [ ] T031 [P] 建立 `formatDefectsForExcel()` 單元測試 in `tests/pages/service-order-management/utils/export-excel.test.ts`
- [X] T032 [P] 建立 `getDefectLabel()` 單元測試（瑕疵代碼轉換） in `tests/pages/service-order-management/utils/defect-utils.test.ts`
- [ ] T033 [P] 建立瑕疵欄位驗證邏輯單元測試 in `tests/pages/service-order-management/validation/defects.test.ts` (若有獨立驗證邏輯)

### Code Quality & Documentation

- [X] T034 [P] 執行 `pnpm lint` 確認程式碼符合 ESLint 規範，修正所有錯誤與警告
- [X] T035 [P] 執行 `pnpm type-check` 確認 TypeScript 編譯無錯誤
- [X] T036 [P] 執行 `pnpm build` 確認生產建置成功
- [X] T037 [P] 審查所有修改的檔案，確認程式碼註解完整且為繁體中文
- [X] T038 [P] 審查程式碼可讀性，移除冗餘或調試用程式碼
- [ ] T039 執行 quickstart.md 中的完整測試檢查清單，確認所有功能正常運作
- [ ] T040 更新專案 CHANGELOG 或相關文件，記錄此功能變更

### Performance Validation (效能驗證)

- [ ] T040a [P] 測量瑕疵欄位互動響應時間：勾選/取消勾選操作，確認 < 100ms (使用 Chrome DevTools Performance 工具)
- [ ] T040b [P] 測量收購單詳細頁面載入時間：包含瑕疵資訊顯示，確認 < 1 秒 (使用 Chrome DevTools Network + Performance)
- [ ] T040c [P] 測量 Excel 匯出時間：100 筆收購單記錄（包含瑕疵資訊），確認 < 3 秒

### Validation & Deployment Readiness

- [ ] T041 與後端團隊確認 API 契約版本一致性，檢查項目包含：(1) POST /api/service-orders/buyback 端點支援 defects 欄位、(2) GET /api/service-orders/{id} 回應包含 defects 欄位、(3) 既有收購單記錄的 defects 欄位回傳格式（null/undefined/不存在）、(4) 錯誤回應格式符合 ApiResponseModel 規範（參考 contracts/api-updates.md）
- [ ] T042 與後端團隊確認既有收購單記錄的 `defects` 欄位回傳格式（null / undefined / 不存在）
- [ ] T043 進行 UAT（使用者驗收測試），請店員實際操作並收集反饋
- [ ] T044 準備部署文件，包含功能說明、已知問題與 rollback 計劃

**Checkpoint**: 所有任務完成，功能準備就緒可部署

---

## Dependencies & Execution Order

### Phase Dependencies

```
Phase 1 (Setup)
    ↓
Phase 2 (Foundational) ⚠️ BLOCKS ALL USER STORIES
    ↓
    ├─→ Phase 3 (User Story 1 - P1) 🎯 MVP ← Start Here
    ├─→ Phase 4 (User Story 2 - P2)
    └─→ Phase 5 (User Story 3 - P3)
    ↓
Phase 6 (Polish)
```

**Critical Path**: Phase 1 → Phase 2 → Phase 3 (US1) → Phase 6 (基本測試) → 部署 MVP

### Phase Details

- **Setup (Phase 1)**: 無依賴，立即開始
- **Foundational (Phase 2)**: 依賴 Phase 1 完成，**阻塞所有 user stories**
- **User Stories (Phase 3-5)**: 全部依賴 Phase 2 完成
  - User Story 1 (P1): 可獨立實作與測試，**建議優先完成作為 MVP**
  - User Story 2 (P2): 依賴 US1（需要瑕疵資料可查詢），但可獨立測試
  - User Story 3 (P3): 依賴 US1（需要瑕疵欄位可編輯），可選（取決於系統是否支援編輯）
- **Polish (Phase 6)**: 依賴至少 US1 完成，建議所有目標 user stories 完成後執行

### User Story Dependencies

- **User Story 1 (P1)**:
  - **依賴**: Phase 2 (Foundational) 完成
  - **阻塞**: 無（可獨立運作）
  - **建議**: 優先完成，作為 MVP 基線

- **User Story 2 (P2)**:
  - **依賴**: Phase 2 完成，US1 實作（需要瑕疵資料可查詢與顯示）
  - **阻塞**: 無（可獨立測試查詢與匯出）
  - **建議**: US1 完成並驗證後開始

- **User Story 3 (P3)**:
  - **依賴**: Phase 2 完成，US1 實作（需要瑕疵欄位已存在）
  - **阻塞**: 無（可獨立測試編輯功能）
  - **條件**: 系統支援收購單編輯功能
  - **建議**: 確認 T025 後再決定是否實作

### Within Each User Story

**User Story 1**:
1. T009-T010 (ProductItemForm 修改) 可平行執行
2. T011 (useServiceOrderForm 修改) 可與 T009-T010 平行
3. T012-T017 (驗證任務) 需等待 T009-T011 完成後執行

**User Story 2**:
1. T018 (formatDefectsForExcel 函式) 可獨立開始
2. T019-T020 (Excel 匯出修改) 依賴 T018
3. T021-T024 (驗證任務) 需等待 T018-T020 完成

**User Story 3** (條件性):
1. T025 (前置檢查) 必須先執行
2. T026-T027 (實作) 依條件執行
3. T028-T030 (驗證) 依賴 T026-T027

### Parallel Opportunities

#### Phase 1 (Setup)
- T001-T004 可由不同人員平行執行（確認環境）

#### Phase 2 (Foundational)
- T005-T007 可在同一檔案中一次完成（types.ts 修改）
- T008 需等待 T005-T007 完成

#### Phase 3 (User Story 1)
```bash
# 可平行執行的任務組：
T009 + T010  # ProductItemForm.vue 修改（同一檔案，但可同時完成）
T011         # useServiceOrderForm.ts 修改（不同檔案，可平行）

# 驗證任務（需等待上述完成）：
T012-T017    # 可依序或平行執行（不同測試情境）
```

#### Phase 4 (User Story 2)
```bash
# 獨立任務：
T018  # 建立工具函式（可獨立開始）

# 依賴 T018：
T019 + T020  # Excel 匯出修改（同一檔案）

# 驗證任務：
T021-T024    # 可依序或平行執行
```

#### Phase 6 (Polish)
```bash
# 可平行執行：
T031 + T032 + T033  # 單元測試（不同檔案）
T034 + T035 + T036  # 程式碼檢查（獨立命令）
T037 + T038         # 程式碼審查（可平行）
```

---

## Implementation Strategy

### 🎯 MVP First (Recommended 建議策略)

**目標**: 最快交付核心價值，User Story 1 即為完整可用的 MVP

```
Phase 1 (Setup)
  →
Phase 2 (Foundational) ⚠️ Critical
  →
Phase 3 (User Story 1 - P1) 🎯 MVP
  →
Phase 6 (Basic Polish: T034-T036, T039)
  →
✅ Deploy MVP & Validate
```

**MVP 交付標準**:
- ✅ 收購單建立表單包含瑕疵欄位
- ✅ 瑕疵資訊成功提交至後端
- ✅ 收購單詳細頁面正確顯示瑕疵資訊
- ✅ 既有記錄向後相容（顯示「無」或「-」）
- ✅ 通過基本測試檢查清單

**時間估算**: 2-3 個工作天（1 位開發者）

---

### 📈 Incremental Delivery (遞增交付策略)

**適用情境**: 團隊資源充足，可同步開發多個 user stories

```
Phase 1 + Phase 2 (Foundation Ready)
  ↓
Phase 3 (US1) → Test → ✅ Deploy MVP
  ↓
Phase 4 (US2) → Test → ✅ Deploy v1.1 (查詢與匯出)
  ↓
Phase 5 (US3) → Test → ✅ Deploy v1.2 (編輯功能，可選)
  ↓
Phase 6 (Polish) → ✅ Final Release
```

**優點**:
- 每個版本增量交付價值
- 降低單次部署風險
- 使用者可逐步適應新功能

**時間估算**:
- MVP (US1): 2-3 天
- v1.1 (US1+US2): +1-2 天
- v1.2 (US1+US2+US3): +1 天（若適用）
- **總計**: 4-6 個工作天（1 位開發者）

---

### 🚀 Parallel Team Strategy (平行團隊策略)

**適用情境**: 多位開發者同時投入

```
Developer A: Phase 1 + Phase 2 (Foundation)
  ↓
  ├─→ Developer A: Phase 3 (US1)
  ├─→ Developer B: Phase 4 (US2) ← 等待 US1 基本完成
  └─→ Developer C: Phase 5 (US3) ← 等待 US1 基本完成
  ↓
All: Phase 6 (Polish & Integration Testing)
```

**注意事項**:
- Phase 2 (Foundational) 必須先完成，才能開始 user stories
- US2 和 US3 需要 US1 的基本實作（瑕疵欄位可用）
- 建議 US1 完成 T009-T011 後，US2/US3 可平行開始
- 最終需整合測試確保所有功能正常運作

**時間估算**: 2-3 個工作天（3 位開發者）

---

## Validation Checklist (驗證檢查清單)

### Before Deployment (部署前必檢)

#### Functional Testing (功能測試)
- [ ] ✅ 建立收購單 - 含瑕疵：選擇多個瑕疵項目，提交成功，後端正確接收
- [ ] ✅ 建立收購單 - 無瑕疵：不勾選瑕疵項目，提交成功，後端處理正確
- [ ] ✅ 查詢收購單詳細：瑕疵資訊以 Tag 形式正確顯示
- [ ] ✅ 查詢既有收購單：無瑕疵欄位記錄顯示「-」或「無」，無錯誤
- [ ] ✅ Excel 匯出：包含「商品瑕疵處」欄位，資料格式正確
- [ ] ✅ Excel 匯出 - 空值：無瑕疵記錄顯示空白或「無」
- [ ] ✅ 編輯收購單（若適用）：可修改瑕疵選項，更新成功

#### Technical Testing (技術測試)
- [ ] ✅ ESLint 檢查通過：`pnpm lint` 無錯誤
- [ ] ✅ TypeScript 編譯通過：`pnpm type-check` 無錯誤
- [ ] ✅ 生產建置成功：`pnpm build` 無錯誤
- [ ] ✅ 單元測試通過（若有）：`pnpm test` 無失敗
- [ ] ✅ 瀏覽器相容性：Chrome, Firefox, Safari, Edge 測試正常
- [ ] ✅ 響應式設計：手機、平板、桌機版面正常

#### Integration Testing (整合測試)
- [ ] ✅ 後端 API 版本一致：確認前後端契約同步
- [ ] ✅ 完整建單流程：從選擇客戶 → 填寫商品 → 選擇瑕疵 → 提交 → 查詢 → 匯出
- [ ] ✅ 錯誤處理：後端驗證錯誤、網路異常等情境正常處理
- [ ] ✅ 效能驗證：表單互動 < 100ms，頁面載入 < 1 秒，Excel 匯出（100筆）< 3 秒

#### User Acceptance (使用者驗收)
- [ ] ✅ UAT 測試：店員實際操作無困難
- [ ] ✅ UI/UX 一致性：與寄賣單瑕疵欄位完全一致
- [ ] ✅ 使用者反饋：收集並處理使用者意見

---

## Rollback Plan (回退計劃)

### 若部署後發現重大問題

**Level 1 - 前端問題（建議回退）**:
```bash
# 切回上一個穩定版本
git revert <commit-hash>
pnpm build
# 重新部署
```

**Level 2 - 後端不相容（建議降級）**:
- 前端瑕疵欄位繼續顯示（向後相容）
- 暫時移除瑕疵資料提交（條件性發送）
- 與後端團隊協調修復 API

**Level 3 - 資料損壞（緊急回退）**:
- 立即回退前端與後端至上一版本
- 檢查資料庫瑕疵資料完整性
- 若需要執行資料修復腳本

### Feature Flag (功能開關，可選)

若系統支援功能開關，可考慮：
```typescript
// 環境變數控制瑕疵功能啟用
const ENABLE_DEFECT_FIELD = import.meta.env.VITE_ENABLE_DEFECT_FIELD === 'true'

// 條件性渲染
<template v-if="ENABLE_DEFECT_FIELD">
  <!-- 瑕疵欄位 -->
</template>
```

---

## Notes & Best Practices

### Task Execution Guidelines

- **[P] 任務**: 不同檔案，無依賴關係，可平行執行
- **[Story] 標籤**: 映射任務至特定 user story，便於追蹤
- **檢查點 (Checkpoint)**: 在關鍵階段停下驗證，確保功能正常
- **提交頻率**: 每完成一個任務或邏輯組合即提交，保持提交歷史清晰
- **測試先行**: 若包含測試，先寫測試確保其失敗，再實作功能

### Code Quality Standards

- ✅ 遵循專案既有程式碼風格與命名規範
- ✅ 所有註解使用繁體中文
- ✅ 避免過度設計，保持程式碼簡潔
- ✅ 重用既有邏輯，避免重複程式碼
- ✅ 確保向後相容，不破壞既有功能

### Common Pitfalls to Avoid

- ❌ 跳過 Phase 2 (Foundational) 直接實作 user stories
- ❌ 同時修改同一檔案的不同部分導致衝突
- ❌ 未確認後端 API 版本即部署前端
- ❌ 未測試既有記錄相容性即上線
- ❌ 過度依賴跨 story 的共用邏輯，導致 stories 無法獨立測試

### Troubleshooting Quick Reference

詳細疑難排解請參考 [quickstart.md](quickstart.md#troubleshooting)

**常見問題快速連結**:
- 瑕疵欄位未顯示 → [Quick Fix](quickstart.md#問題-1-瑕疵欄位未顯示)
- API 請求未包含 defects → [Quick Fix](quickstart.md#問題-2-api-請求未包含-defects-欄位)
- 後端 API 錯誤 → [Quick Fix](quickstart.md#問題-3-後端-api-回傳錯誤)
- Excel 匯出空白 → [Quick Fix](quickstart.md#問題-4-excel-匯出瑕疵欄位空白)

---

## Summary Statistics

### Task Breakdown

| Phase | Task Count | Estimated Time | Priority |
|-------|-----------|----------------|----------|
| Phase 1: Setup | 4 | 0.5 天 | High |
| Phase 2: Foundational | 4 | 0.5 天 | **Critical** |
| Phase 3: User Story 1 (P1) 🎯 | 10 | 2-2.5 天 | **MVP** |
| Phase 4: User Story 2 (P2) | 8 | 1-1.5 天 | High |
| Phase 5: User Story 3 (P3) | 6 | 0.5-1 天 (條件性) | Medium |
| Phase 6: Polish | 17 | 1.5-2.5 天 | Medium |
| **Total** | **49 tasks** | **5-7 天** | - |

### Parallel Opportunities

- **Phase 1**: 4 tasks (可平行)
- **Phase 2**: 3 tasks (可同時完成 types.ts)
- **Phase 3**: T009-T011a (4 tasks 可平行)
- **Phase 4**: T018 可獨立開始，T022a 可平行
- **Phase 6**: T031-T033, T034-T038, T040a-c (約 12 tasks 大部分可平行)

**最大平行度**: 約 18-22 個任務可在適當時機平行執行

### Critical Path (關鍵路徑)

```
T001-T004 (Setup) → T005-T008 (Foundational) → T009-T017 (US1 MVP) → T040a-c (Performance) → T039 (Validation) → Deploy
```

**最短交付時間**: 2.5-3 天（1 位開發者，僅 MVP + 效能驗證）

---

## Related Documents

- 📄 [Feature Spec](spec.md) - 完整功能規格
- 📄 [Implementation Plan](plan.md) - 實作計劃
- 📄 [Research](research.md) - 技術研究
- 📄 [Data Model](data-model.md) - 資料模型
- 📄 [API Contracts](contracts/api-updates.md) - API 契約
- 📄 [Quickstart](quickstart.md) - 快速上手指南
- 📄 [Constitution](../../.specify/memory/constitution.md) - 專案憲章

---

**Tasks Status**: ✅ Complete
**Total Tasks**: 49
**MVP Tasks (Phase 1-3)**: 18
**Ready for Implementation**: ✅ Yes

**Generated**: 2026-01-30 by `/speckit.tasks` command
**Last Updated**: 2026-01-30 (Added validation, performance, and error handling tasks)

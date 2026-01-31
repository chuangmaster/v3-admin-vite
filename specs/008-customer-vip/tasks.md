# Tasks: 客戶 VIP 會員管理

**Feature**: 008-customer-vip  
**Generated**: 2026-01-31  
**Input**: Design documents from `/specs/008-customer-vip/`  
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/customer-level-api.yaml

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3, US4)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: 確保開發環境與相依套件就緒

- [ ] T001 驗證 Node.js 18+ 和 pnpm 8+ 已安裝
- [ ] T002 [P] 安裝 dayjs 套件: `pnpm add dayjs`
- [ ] T003 [P] 驗證 Element Plus 與 @element-plus/icons-vue 已安裝
- [ ] T004 [P] 驗證後端 API 可存取: http://localhost:5176/swagger

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: 核心基礎設施，所有用戶故事的前置條件

**⚠️ CRITICAL**: 此階段完成前，無法開始任何用戶故事的實作

- [ ] T005 [P] 在 src/pages/customer-management/types.ts 新增 VIP 相關型別定義（CustomerLevelPeriodResponse, CreateLevelRequest, UpdateLevelRequest, CustomerLevelStatus, CustomerLevel）
- [ ] T006 驗證並擴展專案現有日期工具 src/common/utils/datetime.ts (確認 toUTC0ISOString 函式可滿足需求,若需要可新增 fromUTCToLocal 輔助函式)
- [ ] T007 建立 VIP 等級 API 服務 src/pages/customer-management/apis/customer-level.ts (封裝所有 HTTP 請求:createLevel, getLevelHistory, getActiveLevel, updateLevel, terminateLevel,使用 datetime.ts 的 toUTC0ISOString 處理日期轉換)

**Checkpoint**: 基礎設施就緒 - 用戶故事實作現在可以並行開始

---

## Phase 3: User Story 1 - 設定客戶 VIP 等級與效期 (Priority: P1) 🎯 MVP

**Goal**: 管理員能透過彈窗表單為客戶設定 VIP 等級、開始與結束日期，系統驗證並儲存效期資訊

**Independent Test**: 登入具 `customer.level.create` 權限的管理員帳號，進入客戶詳細頁面，點擊「設定會員等級」按鈕，填寫等級（VIP）、開始日期（2026-02-01）、結束日期（2026-12-31），提交後驗證客戶顯示 VIP 狀態

### Implementation for User Story 1

- [ ] T008 [P] [US1] 建立 VIP 管理組合式函式 src/pages/customer-management/composables/useCustomerLevel.ts（響應式狀態：levelList, activeLevel, loading, error；方法：createLevel, fetchLevelHistory, fetchActiveLevel）
- [ ] T009 [US1] 建立 VIP 設定彈窗元件 src/pages/customer-management/components/CustomerLevelDialog.vue（支援新增模式，包含等級選擇、日期選擇器、表單驗證、v-permission="customer.level.create"）
- [ ] T010 [US1] 在 CustomerLevelDialog.vue 整合日期時區轉換邏輯 (使用 datetime.ts 的 toUTC0ISOString,el-date-picker 綁定本地時區,提交時轉換為 UTC ISO 8601)
- [ ] T011 [US1] 在 CustomerLevelDialog.vue 實作表單驗證規則（必填欄位、startDate < endDate、等級名稱長度 <= 50）
- [ ] T012 [US1] 在 CustomerLevelDialog.vue 實作錯誤處理（顯示 400 Bad Request、409 Conflict 錯誤訊息）
- [ ] T013 [US1] 修改客戶管理主頁面 src/pages/customer-management/index.vue（引用 CustomerLevelDialog 元件，新增「設定會員等級」按鈕）

**Checkpoint**: 此時應可完整測試 US1 - 管理員能成功設定客戶 VIP 等級與效期

---

## Phase 4: User Story 2 - 查詢客戶 VIP 狀態 (Priority: P1)

**Goal**: 系統在客戶列表與詳細頁面即時顯示 VIP 徽章，根據後端回傳的 status 欄位（Active）判定 VIP 身份

**Independent Test**: 設定客戶 A 的 VIP 效期為當前有效（startDate <= today <= endDate），設定客戶 B 的 VIP 效期為已過期，查看客戶列表與詳細頁面，驗證客戶 A 顯示 VIP 徽章（皇冠圖示 + "VIP"），客戶 B 不顯示

### Implementation for User Story 2

- [ ] T014 [P] [US2] 在 useCustomerLevel.ts 新增 fetchActiveLevel 方法（呼叫 GET /api/customers/{customerId}/levels/active，更新 activeLevel 狀態）
- [ ] T015 [US2] 修改客戶列表元件 src/pages/customer-management/components/CustomerTable.vue（新增「VIP 狀態」el-table-column，使用 el-tag 顯示 VIP 徽章，條件：row.activeLevel?.status === 'Active'）
- [ ] T016 [US2] 在 CustomerTable.vue 整合 Element Plus Icon（引用 Crown 圖示，設定 el-tag 的 :icon 屬性）
- [ ] T017 [US2] 修改客戶管理主頁面 src/pages/customer-management/index.vue（在載入客戶列表時同時查詢每位客戶的 activeLevel，儲存至客戶物件的 activeLevel 屬性）
- [ ] T018 [US2] 在客戶詳細頁面區塊顯示當前 VIP 狀態與有效期間（若 activeLevel 存在，顯示「當前 VIP：{level}，有效期至 {endDate}」）

**Checkpoint**: 此時 US1 和 US2 應同時運作 - 設定 VIP 後立即在列表與詳細頁面顯示徽章

---

## Phase 5: User Story 3 - 終止客戶 VIP 會籍 (Priority: P2)

**Goal**: 管理員能透過「終止會員」按鈕立即終止客戶的當前有效 VIP，系統將 endDate 設為當前時刻前 1 秒

**Independent Test**: 設定客戶的當前有效 VIP（startDate: 2026-01-01, endDate: 2026-12-31），點擊「終止會員」按鈕並確認，驗證客戶的 VIP 徽章立即消失，VIP 記錄的 endDate 更新為當前時刻前 1 秒

### Implementation for User Story 3

- [ ] T019 [P] [US3] 在 useCustomerLevel.ts 新增 terminateLevel 方法（呼叫 POST /api/customers/{customerId}/levels/terminate，處理 404 Not Found 錯誤）
- [ ] T020 [US3] 修改 CustomerLevelDialog.vue 支援終止模式（mode prop 新增 'terminate'，顯示確認對話框而非表單，v-permission="customer.level.terminate"）
- [ ] T021 [US3] 在 CustomerLevelDialog.vue 實作終止確認對話框（顯示警告訊息「此操作將立即終止 VIP 資格」，提供確認與取消按鈕）
- [ ] T022 [US3] 在 CustomerLevelDialog.vue 實作終止成功後的 UI 更新（顯示成功訊息，重新載入客戶 VIP 狀態，關閉彈窗）
- [ ] T023 [US3] 在客戶管理主頁面或詳細頁面新增「終止會員」按鈕（v-permission="customer.level.terminate"，:disabled="!activeLevel || activeLevel.status !== 'Active'"）

**Checkpoint**: 此時 US1、US2、US3 應同時運作 - 可設定、顯示、終止 VIP 會籍

---

## Phase 6: User Story 4 - 查看客戶 VIP 歷程記錄 (Priority: P3)

**Goal**: 管理員能在客戶詳細頁面查看該客戶所有 VIP 歷程記錄（包括已過期、當前有效、未來生效），以表格形式展示

**Independent Test**: 為客戶 C 建立 3 筆 VIP 記錄（已過期、當前有效、未來生效），進入客戶 C 的詳細頁面，驗證「VIP 歷程」區塊使用 el-table 顯示所有 3 筆記錄，並正確標示每筆記錄的 status（Active/Expired/Upcoming）

### Implementation for User Story 4

- [ ] T024 [P] [US4] 在 useCustomerLevel.ts 新增 fetchLevelHistory 方法（呼叫 GET /api/customers/{customerId}/levels?includeExpired=true，更新 levelList 狀態）
- [ ] T025 [US4] 建立 VIP 歷程表格元件 src/pages/customer-management/components/CustomerLevelTable.vue（使用 el-table 展示 levelList，欄位：等級、開始日期、結束日期、狀態、建立時間、操作）
- [ ] T026 [US4] 在 CustomerLevelTable.vue 實作日期格式化顯示（使用 formatDate 將 ISO 8601 UTC 轉換為本地時區日期）
- [ ] T027 [US4] 在 CustomerLevelTable.vue 實作狀態標籤顯示（根據 status 欄位使用不同顏色的 el-tag：Active=success, Expired=info, Upcoming=warning）
- [ ] T028 [US4] 在 CustomerLevelTable.vue 實作預設排序（:default-sort="{ prop: 'startDate', order: 'descending' }"）
- [ ] T029 [US4] 在 CustomerLevelTable.vue 新增操作欄（編輯按鈕：v-permission="customer.level.update"，:disabled="row.status === 'Expired'"；終止按鈕：v-permission="customer.level.terminate"，:disabled="row.status !== 'Active'"）
- [ ] T030 [US4] 修改 CustomerLevelDialog.vue 支援編輯模式（mode prop 新增 'edit'，表單預填 data prop 的值，提交時呼叫 updateLevel 並傳遞 version 欄位）
- [ ] T031 [US4] 在 useCustomerLevel.ts 新增 updateLevel 方法（呼叫 PUT /api/customers/{customerId}/levels/{levelId}，處理 409 Conflict 樂觀鎖錯誤）
- [ ] T032 [US4] 在 useCustomerLevel.ts 實作樂觀鎖衝突處理（409 錯誤時顯示警告訊息「資料已被其他使用者更新，請重新載入後再試」，自動呼叫 fetchLevelHistory 重新載入）
- [ ] T033 [US4] 在客戶詳細頁面新增「VIP 歷程」區塊（整合 CustomerLevelTable 元件，v-permission="customer.level.view"，載入時呼叫 fetchLevelHistory）
- [ ] T034 [US4] 在 CustomerLevelTable.vue 處理空資料狀態（若 levelList 為空陣列，顯示「尚無 VIP 會員記錄」）

**Checkpoint**: 所有 4 個用戶故事應獨立運作 - 完整的 VIP 會員管理功能

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: 跨多個用戶故事的改進與優化

- [ ] T035 [P] 新增 JSDoc 註解至所有 API 服務函式（src/pages/customer-management/apis/customer-level.ts）
- [ ] T036 [P] 新增 JSDoc 註解至所有組合式函式方法（src/pages/customer-management/composables/useCustomerLevel.ts）
- [ ] T037 驗證所有元件符合 Vue 3 開發規範（PascalCase 命名、Composition API、`<script setup lang="ts">`）
- [ ] T038 驗證所有檔案符合命名規範（kebab-case for pages/apis, PascalCase for components）
- [ ] T039 [P] 執行 ESLint 檢查並修正所有錯誤：`pnpm lint`
- [ ] T040 [P] 驗證無 TypeScript 型別錯誤：`pnpm type-check`
- [ ] T041 效能優化：驗證客戶列表載入時間 < 2 秒（包含 VIP 狀態查詢）
- [ ] T042 驗證 quickstart.md 中的所有範例可執行
- [ ] T043 更新 README.md（若需要），記錄 VIP 功能的使用方式
- [ ] T044 執行手動測試清單（參考 quickstart.md）

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: 無相依性 - 可立即開始
- **Foundational (Phase 2)**: 相依於 Setup 完成 - 阻塞所有用戶故事
- **User Stories (Phase 3-6)**: 全部相依於 Foundational 完成
  - 用戶故事可並行進行（若有足夠人力）
  - 或依優先級順序執行（P1 → P1 → P2 → P3）
- **Polish (Phase 7)**: 相依於所有預期的用戶故事完成

### User Story Dependencies

- **User Story 1 (P1)**: Foundational 完成後可開始 - 無其他故事相依性
- **User Story 2 (P1)**: Foundational 完成後可開始 - 需 US1 完成以驗證整合（設定 VIP → 顯示徽章），但可獨立實作
- **User Story 3 (P2)**: Foundational 完成後可開始 - 需 US1 和 US2 完成以驗證整合（設定 VIP → 終止 VIP → 徽章消失），但可獨立實作
- **User Story 4 (P3)**: Foundational 完成後可開始 - 需 US1 完成以建立測試資料，US3 的編輯功能會重用 US4 的 Dialog 元件編輯模式

### Within Each User Story

- **US1**: T008 → T009 → T010/T011/T012（並行）→ T013
- **US2**: T014 → T015/T016（並行）→ T017 → T018
- **US3**: T019 → T020 → T021/T022（並行）→ T023
- **US4**: T024 → T025 → T026/T027/T028（並行）→ T029 → T030 → T031/T032（並行）→ T033 → T034

### Parallel Opportunities

- Phase 1: T002, T003, T004 可並行
- Phase 2: T005, T006, T007 可依序（T007 相依於 T005 的型別定義）
- US1: T010, T011, T012 可並行（同一檔案內不同功能區塊）
- US2: T014, T015, T016 可並行（不同檔案）
- US3: T020, T021, T022 在同一檔案，但可視為邏輯獨立的功能區塊
- US4: T026, T027, T028 可並行（同一檔案內不同功能）；T031, T032 可並行
- Phase 7: T035, T036, T039, T040 可並行（不同檔案或工具）

---

## Parallel Example: User Story 1

```bash
# Phase 2 Foundational - 依序執行（T007 相依於 T005）
Task T005: 定義型別（types.ts）
Task T006: 日期轉換工具（date-conversion.ts）
Task T007: API 服務（customer-level.ts，使用 T005 定義的型別）

# Phase 3 US1 - 並行機會
Task T008: 組合式函式（useCustomerLevel.ts）
Task T009: 彈窗元件（CustomerLevelDialog.vue）
# 然後 T010, T011, T012 在同一檔案內不同區塊，可並行開發
Task T010 + T011 + T012: Dialog 日期轉換 + 表單驗證 + 錯誤處理
# 最後整合
Task T013: 主頁面整合（index.vue）
```

---

## Implementation Strategy

### MVP First (User Story 1 + User Story 2 Only)

1. ✅ Complete Phase 1: Setup（T001-T004）
2. ✅ Complete Phase 2: Foundational（T005-T007）— **CRITICAL BLOCKER**
3. ✅ Complete Phase 3: User Story 1（T008-T013）— 管理員能設定 VIP
4. ✅ Complete Phase 4: User Story 2（T014-T018）— 客戶列表顯示 VIP 徽章
5. **STOP and VALIDATE**: 獨立測試 US1 和 US2
6. 若就緒可部署/示範（MVP 達成！）

**MVP 交付內容**：
- ✅ 管理員可設定客戶 VIP 等級與效期
- ✅ 客戶列表與詳細頁面自動顯示 VIP 徽章
- ✅ 日期時區自動轉換（本地顯示 → UTC 儲存）
- ✅ 表單驗證與錯誤處理

### Incremental Delivery

1. Complete Setup + Foundational（T001-T007）→ Foundation ready
2. Add User Story 1（T008-T013）→ 獨立測試 → 部署/示範
3. Add User Story 2（T014-T018）→ 獨立測試 → 部署/示範（**MVP 達成**）
4. Add User Story 3（T019-T023）→ 獨立測試 → 部署/示範
5. Add User Story 4（T024-T034）→ 獨立測試 → 部署/示範（**完整功能**）
6. Polish（T035-T044）→ 最終驗證 → 生產部署

每個故事新增價值且不破壞已完成的故事

### Parallel Team Strategy

若有多位開發者：

1. 團隊一起完成 Setup + Foundational（T001-T007）
2. Foundational 完成後：
   - **Developer A**: User Story 1（T008-T013）
   - **Developer B**: User Story 2（T014-T018，需 US1 的型別定義）
   - **Developer C**: 可提前準備 User Story 3 的測試場景
3. US1 和 US2 完成後：
   - **Developer A**: User Story 3（T019-T023）
   - **Developer B**: User Story 4（T024-T034）
4. 所有故事完成後一起進行 Polish（T035-T044）

故事獨立完成並整合

---

## Task Summary

### Total Tasks: 44

- **Phase 1 (Setup)**: 4 tasks（T001-T004）
- **Phase 2 (Foundational)**: 3 tasks（T005-T007）— **BLOCKS ALL STORIES**
- **Phase 3 (US1 - P1)**: 6 tasks（T008-T013）
- **Phase 4 (US2 - P1)**: 5 tasks（T014-T018）
- **Phase 5 (US3 - P2)**: 5 tasks（T019-T023）
- **Phase 6 (US4 - P3)**: 11 tasks（T024-T034）
- **Phase 7 (Polish)**: 10 tasks（T035-T044）

### Task Count by User Story

- **US1 (設定 VIP)**: 6 tasks
- **US2 (查詢狀態)**: 5 tasks
- **US3 (終止會籍)**: 5 tasks
- **US4 (查看歷程)**: 11 tasks

### Parallel Opportunities Identified

- Phase 1: 3 並行任務（T002, T003, T004）
- Phase 3: 3 並行任務（T010, T011, T012）
- Phase 4: 2 並行任務（T015, T016）
- Phase 6: 3 並行任務（T026, T027, T028）
- Phase 7: 4 並行任務（T035, T036, T039, T040）

### Independent Test Criteria

- **US1**: 管理員能成功設定客戶 VIP 等級與效期，表單驗證運作正常
- **US2**: 客戶列表與詳細頁面正確顯示 VIP 徽章，根據 status 欄位判定
- **US3**: 管理員能成功終止當前有效的 VIP，客戶徽章立即消失
- **US4**: 客戶詳細頁面正確顯示所有 VIP 歷程記錄，包含不同狀態的標示

### Suggested MVP Scope

**MVP = Phase 1 + Phase 2 + Phase 3 (US1) + Phase 4 (US2)**

最小可行產品應包含：
- ✅ 設定客戶 VIP 等級與效期（核心功能）
- ✅ 客戶列表與詳細頁面顯示 VIP 狀態（可見性）
- ✅ 日期時區自動轉換（使用者體驗）
- ✅ 表單驗證與錯誤處理（資料完整性）

後續增量交付：
- Phase 5 (US3): 終止 VIP 會籍（管理功能）
- Phase 6 (US4): 查看 VIP 歷程（稽核與追蹤）
- Phase 7: 程式碼品質與效能優化

---

## Format Validation

✅ **All tasks follow the checklist format**:
- Checkbox: `- [ ]`
- Task ID: T001, T002, T003...
- [P] marker: Present for parallelizable tasks
- [Story] label: US1, US2, US3, US4 (for user story phases only)
- Description: Clear action with exact file path

✅ **Example valid tasks**:
- `- [ ] T001 驗證 Node.js 18+ 和 pnpm 8+ 已安裝`
- `- [ ] T002 [P] 安裝 dayjs 套件: pnpm add dayjs`
- `- [ ] T008 [P] [US1] 建立 VIP 管理組合式函式 src/pages/customer-management/composables/useCustomerLevel.ts`

---

## Notes

- [P] 標記 = 不同檔案，無相依性，可並行執行
- [Story] 標記 = 將任務映射至特定用戶故事，便於追蹤
- 每個用戶故事應可獨立完成與測試
- 在任何檢查點停下來獨立驗證故事
- 避免：模糊任務、相同檔案衝突、破壞獨立性的跨故事相依性
- 規格未明確要求測試，因此本任務清單未包含測試任務（符合 "Tests are OPTIONAL" 指導原則）
- 每個任務完成後應提交（commit），或按邏輯群組提交

---

**Generated by**: `/speckit.tasks` command  
**Last updated**: 2026-01-31  
**Total estimated time**: 35-40 hours（約 5-6 個工作天）

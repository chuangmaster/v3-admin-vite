# Tasks: 用戶管理系統

**Input**: Design documents from `/specs/001-user-management/`
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/api-contracts.md ✅, quickstart.md ✅

**Tests**: 測試任務已包含在各 User Story 中，遵循 TDD 原則。

**Organization**: 任務按 User Story 分組，每個 Story 可獨立實作與測試。

## Format: `[ID] [P?] [Story] Description`

- **[P]**: 可並行執行（不同檔案，無依賴）
- **[Story]**: 任務所屬的 User Story（如 US1, US2, US3）
- 所有任務包含明確的檔案路徑

---

## Phase 1: Setup（專案初始化）

**目的**: 安裝依賴套件與建立基礎目錄結構

- [x] T001 安裝 xlsx 套件（`pnpm add xlsx`）
- [x] T002 安裝 xlsx 型別定義（`pnpm add -D @types/xlsx`）
- [x] T003 建立目錄結構 `src/pages/user-management/{components,composables,apis}`
- [x] T004 建立測試目錄結構 `tests/{components,composables}`

---

## Phase 2: Foundational（基礎設施 - BLOCKING）

**目的**: 所有 User Story 的前置必要工作

**⚠️ CRITICAL**: 此階段完成前，所有 User Story 無法開始

- [x] T005 [P] 定義型別檔案 `src/pages/user-management/types.ts`（User, CreateUserRequest, UpdateUserRequest, DeleteUserRequest, UserListParams, UserListResponse, ApiResponse）
- [x] T006 [P] 定義權限常數 `src/common/constants/permissions.ts`（USER_PERMISSIONS.READ/CREATE/UPDATE/DELETE）
- [x] T007 [P] 實作 API 封裝 `src/pages/user-management/apis/user.ts`（getUserList, getUserById, createUser, updateUser, deleteUser）
- [x] T008 [P] 建立 Excel 匯出組合式函式 `src/pages/user-management/composables/useExportExcel.ts`
- [x] T009 [P] 建立用戶管理組合式函式 `src/pages/user-management/composables/useUserManagement.ts`（列表查詢、刪除、分頁）
- [x] T010 [P] 建立表單組合式函式 `src/pages/user-management/composables/useUserForm.ts`（新增/編輯表單、驗證規則）
- [x] T011 設定路由 `src/router/index.ts`（新增 /user-management 路由，meta.permissions: [USER_PERMISSIONS.READ]）
- [x] T012 驗證路由守衛生效（確認無 account.read 權限時無法訪問）

**Checkpoint**: 基礎設施就緒 - User Story 實作可以開始

---

## Phase 3: User Story 1 - 查看用戶列表（Priority: P1）🎯 MVP

**Goal**: 管理員可以查看當前系統中所有用戶的基本資訊，包括用戶名稱、狀態等，並支援分頁、搜尋功能。

**Independent Test**: 登入系統 → 導航至用戶管理頁面 → 驗證用戶列表正確顯示（包含分頁、搜尋功能）

### Tests for User Story 1

> **NOTE: 先寫測試，確保測試 FAIL 後再實作**

- [x] T013 [P] [US1] 單元測試 `tests/composables/useUserManagement.test.ts`（測試 fetchUsers 成功場景）
- [x] T014 [P] [US1] 元件測試 `tests/components/UserTable.test.ts`（測試表格渲染與欄位顯示）

### Implementation for User Story 1

- [x] T015 [P] [US1] 建立 UserTable 元件 `src/pages/user-management/components/UserTable.vue`（顯示用戶列表、狀態標籤、無操作按鈕）
- [x] T016 [US1] 建立主頁面 `src/pages/user-management/index.vue`（整合 UserTable、分頁元件、搜尋列）
- [x] T017 [US1] 實作分頁邏輯（Element Plus Pagination 整合至 useUserManagement）
- [x] T018 [US1] 實作搜尋功能（searchKeyword 與 resetSearch）
- [x] T019 [US1] 測試權限控制（account.read 權限）- 驗證無權限時拒絕訪問並顯示提示

**Checkpoint**: User Story 1 功能完整且可獨立測試

---

## Phase 4: User Story 2 - 新增用戶（Priority: P2）

**Goal**: 管理員可以為系統新增新用戶，填寫用戶的基本資訊，並通過完整的表單驗證。

**Independent Test**: 點擊「新增用戶」按鈕 → 填寫表單 → 提交 → 驗證新用戶出現在列表中

### Tests for User Story 2

- [x] T020 [P] [US2] 單元測試 `tests/composables/useUserForm.test.ts`（測試表單驗證規則、submitForm）
- [x] T021 [P] [US2] 元件測試 `tests/components/UserForm.test.ts`（測試表單渲染、驗證錯誤顯示）

### Implementation for User Story 2

- [x] T022 [P] [US2] 建立 UserForm 元件 `src/pages/user-management/components/UserForm.vue`（新增模式，包含 username, password, displayName 欄位）
- [x] T023 [US2] 在主頁面新增「新增用戶」按鈕與對話框（v-permission="[USER_PERMISSIONS.CREATE]"）
- [x] T024 [US2] 整合 UserForm 至對話框，實作提交成功後重新整理列表
- [x] T025 [US2] 實作密碼複雜度驗證（最少 8 字元、包含大小寫字母與數字）
- [x] T026 [US2] 測試權限控制（account.create 權限）- 驗證無權限時按鈕隱藏

**Checkpoint**: User Stories 1 AND 2 都能獨立運作

---

## Phase 5: User Story 3 - 修改用戶資訊（Priority: P2）

**Goal**: 管理員可以更新現有用戶的資訊（如顯示名稱），以反映組織變化或修正錯誤資料。

**Independent Test**: 選擇現有用戶 → 點擊「編輯」按鈕 → 修改資訊 → 保存 → 驗證更新成功

### Tests for User Story 3

- [x] T027 [P] [US3] 單元測試擴充 `tests/composables/useUserForm.test.ts`（測試編輯模式、updateUser API 呼叫）
- [x] T028 [P] [US3] 元件測試擴充 `tests/components/UserForm.test.ts`（測試編輯模式表單預填）

### Implementation for User Story 3

- [x] T029 [P] [US3] 擴充 UserForm 元件支援編輯模式（接收 editUser prop，預填表單資料）
- [x] T030 [P] [US3] 擴充 useUserForm 支援編輯邏輯（根據 editUser 呼叫 updateUser API）
- [x] T031 [US3] 在 UserTable 新增「編輯」按鈕（v-permission="[USER_PERMISSIONS.UPDATE]"）
- [x] T032 [US3] 實作編輯用戶流程（點擊編輯 → 開啟對話框 → 預填資料 → 提交更新）
- [x] T033 [US3] 處理並發更新衝突（409 錯誤顯示「資料已被其他使用者更新」提示）
- [x] T034 [US3] 測試權限控制（account.update 權限）- 驗證無權限時按鈕隱藏

**Checkpoint**: User Stories 1, 2, AND 3 都能獨立運作

---

## Phase 6: User Story 4 - 刪除用戶（Priority: P3）

**Goal**: 管理員可以刪除不再需要的用戶帳號（軟刪除），以維護系統安全。

**Independent Test**: 選擇用戶 → 點擊「刪除」按鈕 → 確認操作 → 驗證用戶從列表中移除

### Tests for User Story 4

- [ ] T035 [P] [US4] 單元測試擴充 `tests/composables/useUserManagement.test.ts`（測試 handleDelete 成功場景、二次確認取消場景）
- [ ] T036 [P] [US4] 整合測試（測試刪除自己帳號時顯示 403 錯誤）

### Implementation for User Story 4

- [ ] T037 [US4] 在 UserTable 新增「刪除」按鈕（v-permission="[USER_PERMISSIONS.DELETE]"）
- [ ] T038 [US4] 實作刪除二次確認邏輯（ElMessageBox.confirm）
- [ ] T039 [US4] 整合 handleDelete 至表格操作欄
- [ ] T040 [US4] 處理刪除錯誤（403 CANNOT_DELETE_SELF、422 LAST_ACCOUNT_CANNOT_DELETE）
- [ ] T041 [US4] 測試權限控制（account.delete 權限）- 驗證無權限時按鈕隱藏
- [ ] T042 [US4] 驗證已停用用戶無法登入（後端驗證，前端顯示錯誤訊息）

**Checkpoint**: User Stories 1-4 都能獨立運作

---

## Phase 7: User Story 5 - 匯出用戶報表（Priority: P3）

**Goal**: 管理員可以匯出當前查詢的用戶資料為 Excel 報表文件，以便進行離線分析。

**Independent Test**: 執行查詢 → 點擊「匯出報表」按鈕 → 驗證下載的文件包含正確資料

### Tests for User Story 5

- [ ] T043 [P] [US5] 單元測試 `tests/composables/useExportExcel.test.ts`（測試 exportUsers 資料格式化、XLSX 生成）

### Implementation for User Story 5

- [ ] T044 [US5] 在主頁面新增「匯出報表」按鈕（無 v-permission，所有用戶可用）
- [ ] T045 [US5] 整合 useExportExcel 至主頁面（點擊按鈕觸發 exportUsers(users.value)）
- [ ] T046 [US5] 驗證匯出資料格式（用戶名、顯示名稱、狀態、建立時間、最後更新時間）
- [ ] T047 [US5] 測試大量資料匯出（500 筆 < 5 秒）

**Checkpoint**: 所有 User Stories 都能獨立運作

---

## Phase 8: Polish & Cross-Cutting Concerns（打磨與跨功能改善）

**目的**: 影響多個 User Story 的改善工作

- [ ] T048 [P] 程式碼格式化與 ESLint 檢查（執行 `pnpm run lint`）
- [ ] T049 [P] 新增空狀態提示（用戶列表為空時顯示友善提示）
- [ ] T050 [P] 錯誤處理優化（統一 Axios 攔截器錯誤訊息對應）
- [ ] T051 [P] Loading 狀態優化（全屏 loading 使用 useFullscreenLoading）
- [ ] T052 執行 quickstart.md 驗證清單（手動測試所有場景）
- [ ] T053 更新 README.md（新增用戶管理功能說明）
- [ ] T054 提交至 Git（遵循 Conventional Commits）

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: 無依賴 - 可立即開始
- **Foundational (Phase 2)**: 依賴 Setup 完成 - **BLOCKS** 所有 User Stories
- **User Stories (Phase 3-7)**: 全部依賴 Foundational 完成
  - 若有多人團隊，可並行開發各 User Story
  - 若單人開發，建議按優先級順序（P1 → P2 → P3）
- **Polish (Phase 8)**: 依賴所有期望的 User Stories 完成

### User Story Dependencies

- **User Story 1 (P1)**: 可在 Foundational 完成後立即開始 - 無其他 Story 依賴
- **User Story 2 (P2)**: 可在 Foundational 完成後立即開始 - 與 US1 整合但可獨立測試
- **User Story 3 (P2)**: 可在 Foundational 完成後立即開始 - 與 US1, US2 整合但可獨立測試
- **User Story 4 (P3)**: 可在 Foundational 完成後立即開始 - 與 US1 整合但可獨立測試
- **User Story 5 (P3)**: 可在 Foundational 完成後立即開始 - 與 US1 整合但可獨立測試

### Within Each User Story

- 測試 MUST 先寫並確保 FAIL 後再實作
- 元件實作 → 整合至主頁面 → 權限測試
- Story 完成後再移至下一優先級

### Parallel Opportunities

- **Phase 1**: T001-T004 可並行（不同指令與目錄）
- **Phase 2**: T005-T010 可並行（不同檔案）
- **Phase 2 完成後**: 所有 User Stories 可並行開發（若團隊允許）
- **每個 Story 內**: 標記 [P] 的測試可並行、[P] 的元件可並行

**Total Parallel Opportunities**: 14 個任務可並行執行

---

## Parallel Example: User Story 1

```bash
# 並行執行 User Story 1 的測試（T013, T014）:
Task: "單元測試 tests/composables/useUserManagement.test.ts"
Task: "元件測試 tests/components/UserTable.test.ts"

# 並行執行 User Story 1 的元件（T015 與後續可獨立完成的部分）:
Task: "建立 UserTable 元件 src/pages/user-management/components/UserTable.vue"
# 完成後再串接 T016-T019
```

---

## Implementation Strategy

### MVP First（僅 User Story 1）

1. 完成 Phase 1: Setup
2. 完成 Phase 2: Foundational（CRITICAL - 阻塞所有 Stories）
3. 完成 Phase 3: User Story 1
4. **STOP and VALIDATE**: 獨立測試 User Story 1
5. 若就緒則部署/展示

### Incremental Delivery（增量交付）

1. 完成 Setup + Foundational → 基礎就緒
2. 新增 User Story 1 → 獨立測試 → 部署/展示（MVP！）
3. 新增 User Story 2 → 獨立測試 → 部署/展示
4. 新增 User Story 3 → 獨立測試 → 部署/展示
5. 新增 User Story 4 → 獨立測試 → 部署/展示
6. 新增 User Story 5 → 獨立測試 → 部署/展示
7. 每個 Story 都增加價值而不破壞先前的 Stories

### Parallel Team Strategy（多人並行策略）

若有多位開發者：

1. 團隊一起完成 Setup + Foundational
2. Foundational 完成後：
   - 開發者 A: User Story 1
   - 開發者 B: User Story 2
   - 開發者 C: User Story 3
3. Stories 獨立完成與整合

---

## Summary

- **Total Tasks**: 54 個任務
- **User Stories**: 5 個（P1: 1, P2: 2, P3: 2）
- **Parallel Opportunities**: 14 個任務
- **MVP Scope**: User Story 1 - 查看用戶列表（7 個任務，約 0.5-1 天）
- **Full Implementation**: 所有 5 個 User Stories（預估 2-3 天）

### Independent Test Criteria

- **US1**: 可查看用戶列表、分頁、搜尋，無需其他功能
- **US2**: 可新增用戶並在列表中顯示，無需修改/刪除功能
- **US3**: 可修改用戶資訊並更新列表，無需刪除功能
- **US4**: 可刪除用戶並從列表移除，無需匯出功能
- **US5**: 可匯出當前查詢結果為 Excel，無需 CRUD 操作

### Format Validation

✅ 所有任務遵循 `- [ ] [TaskID] [P?] [Story?] Description with file path` 格式
✅ Task ID 從 T001 開始，順序編號至 T054
✅ [P] 標記用於可並行任務（14 個）
✅ [Story] 標記用於 User Story 任務（US1-US5）
✅ 所有實作任務包含明確的檔案路徑

---

## Notes

- [P] 任務 = 不同檔案，無依賴，可並行
- [Story] 標籤將任務映射至特定 User Story，便於追蹤
- 每個 User Story 應可獨立完成與測試
- 實作前驗證測試失敗
- 每個任務或邏輯組完成後提交
- 在任何 Checkpoint 停下來獨立驗證 Story
- 避免：模糊任務、相同檔案衝突、破壞獨立性的跨 Story 依賴
- 主頁面整合需等待元件完成
- 測試可在實作完成後進行

### 並行機會

- Phase 1 所有標記 [P] 的任務可並行
- Phase 2 所有標記 [P] 的任務可並行
- Phase 2 完成後，所有用戶故事（US1-US5）可並行（如團隊有足夠人力）
- 每個故事內標記 [P] 的任務可並行
- Phase 8 所有標記 [P] 的任務可並行

---

## Parallel Example: User Story 1

```bash
# 並行啟動 US1 的 Composable 與元件
Task T009: "實作 useUserManagement.ts Composable"
Task T010: "實作 UserTable.vue 元件"

# 完成後依序進行整合與測試
Task T011: "實作主頁面 index.vue"
Task T012: "新增路由設定"
Task T013: "測試路由權限控制"
```

---

## Parallel Example: User Story 2

```bash
# 並行啟動 US2 的 Composable 與元件
Task T014: "實作 useUserForm.ts Composable"
Task T015: "實作 UserForm.vue 元件"

# 完成後依序進行整合與測試
Task T016: "整合新增功能至主頁面"
Task T017: "測試表單驗證"
Task T018: "測試按鈕權限控制"
```

---

## Implementation Strategy

### MVP First（僅 User Story 1）

1. 完成 Phase 1: Setup
2. 完成 Phase 2: Foundational（**關鍵 - 阻擋所有故事**）
3. 完成 Phase 3: User Story 1
4. **停止並驗證**: 獨立測試 User Story 1
5. 如已就緒，部署/展示 MVP

### 遞增交付

1. 完成 Setup + Foundational → 基礎建設就緒
2. 新增 User Story 1 → 獨立測試 → 部署/展示（MVP！）
3. 新增 User Story 2 → 獨立測試 → 部署/展示
4. 新增 User Story 3 → 獨立測試 → 部署/展示
5. 新增 User Story 4 → 獨立測試 → 部署/展示
6. 新增 User Story 5 → 獨立測試 → 部署/展示
7. 每個故事都增加價值且不破壞先前故事

### 並行團隊策略

多位開發者：

1. 團隊共同完成 Setup + Foundational
2. Foundational 完成後：
   - 開發者 A: User Story 1 + 2
   - 開發者 B: User Story 3 + 4
   - 開發者 C: User Story 5 + Polish
3. 故事獨立完成與整合

---

## Task Summary

- **總任務數**: 43
- **Phase 1 (Setup)**: 3 tasks
- **Phase 2 (Foundational)**: 5 tasks
- **Phase 3 (US1 - 查看列表)**: 5 tasks
- **Phase 4 (US2 - 新增用戶)**: 5 tasks
- **Phase 5 (US3 - 修改用戶)**: 6 tasks
- **Phase 6 (US4 - 刪除用戶)**: 6 tasks
- **Phase 7 (US5 - 匯出報表)**: 4 tasks
- **Phase 8 (Polish)**: 9 tasks

### 並行機會識別

- **Phase 1**: 2 個並行任務（T002, T003）
- **Phase 2**: 3 個並行任務（T005, T006, T008）
- **User Story 1**: 2 個並行任務（T009, T010）
- **User Story 2**: 2 個並行任務（T014, T015）
- **User Story 5**: 1 個並行任務（T031）
- **Phase 8**: 6 個並行任務（T036, T037, T038, T039, T042）

### 獨立測試準則

- **US1**: 用戶列表顯示正確、分頁與搜尋功能正常、路由權限控制生效（需要 account.read 權限）
- **US2**: 新增用戶成功、表單驗證生效、按鈕權限控制生效（需要 account.create 權限）
- **US3**: 修改用戶成功、並發衝突處理正確、按鈕權限控制生效（需要 account.update 權限）
- **US4**: 刪除用戶成功、二次確認顯示、刪除限制生效、按鈕權限控制生效（需要 account.delete 權限）
- **US5**: Excel 匯出成功、資料與格式正確（無需特殊權限）

### 建議 MVP 範圍

**僅 User Story 1（查看用戶列表）** - 包含分頁、搜尋、路由權限控制，展示核心功能價值。

---

## Notes

- **[P] 任務**: 不同檔案，無依賴關係，可並行執行
- **[Story] 標籤**: 任務映射至特定用戶故事，便於追蹤
- 每個用戶故事應可獨立完成與測試
- 在每個 Checkpoint 停止並驗證故事獨立運作
- 避免：模糊任務、相同檔案衝突、破壞獨立性的跨故事依賴
- 所有任務遵循專案編碼規範與憲章原則
- 遇到問題參考 quickstart.md 的 FAQ 章節

---
description: "Task list for permission management feature implementation"
---

# Tasks: 權限管理系統

**Branch**: `002-permission-management`
**Input**: Design documents from `/specs/002-permission-management/`
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/ ✅, quickstart.md ✅

**Tests**: Tests are INCLUDED as this is a critical security feature requiring comprehensive test coverage.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## 格式：`[ID] [P?] [Story] 描述`

- **[P]**：可並行執行（不同檔案、無相依性）
- **[Story]**：此任務屬於哪個使用者故事（例如：US1、US2、US3）
- 描述中包含確切的檔案路徑

## 路徑慣例

單一專案結構，`src/` 和 `tests/` 位於專案根目錄。

---

## Phase 1: 設定（共用基礎建設）

**目的**：專案初始化與權限管理模組的基本結構

- [x] T001 建立目錄結構 `src/pages/permission-management/{apis,components,composables}`
- [x] T002 根據 data-model.md 在 `src/pages/permission-management/types.ts` 建立 TypeScript 型別定義
- [x] T003 [P] 在 `@@/constants/permissions.ts` 更新權限常數，新增 PERMISSION_PERMISSIONS 常數
- [x] T004 [P] 建立測試目錄結構 `tests/pages/permission-management/{components,composables}`

---

## Phase 2: 基礎建設（阻擋性前置條件）

**目的**：在任何使用者故事實作前必須完成的核心基礎建設

**⚠️ 關鍵**：在此階段完成前，不能開始任何使用者故事的工作

- [x] T005 在 `src/pages/permission-management/apis/permission.ts` 實作 API 客戶端基礎設定與 Axios 攔截器
- [x] T006 [P] 在 `@@/utils/validate.ts` 建立工具函式 `validatePermissionCode` 用於權限代碼格式驗證
- [x] T007 [P] 在 `src/pages/permission-management/types.ts` 建立 Element Plus 表單驗證規則
- [x] T008 在 `src/router/index.ts` 新增權限管理路由，包含 meta 權限檢查
- [x] T009 [P] 在 `tests/pages/permission-management/test-utils.ts` 建立測試工具函式，用於模擬 API 回應

**檢查點**：基礎建設完成 - 可以開始並行實作使用者故事

---

## Phase 3: User Story 1 - 瀏覽與查詢權限 (Priority: P1) 🎯 MVP

**Goal**: 管理員可以查看系統中所有權限的清單，支援搜尋和分頁功能

**Independent Test**: 管理員登入系統後進入權限管理頁面，能看到完整的權限列表並使用搜尋功能，即可驗證此功能獨立運作。

### 使用者故事 1 的測試

> **注意：先撰寫這些測試，確保實作前測試會失敗**

- [x] T010 [P] [US1] 在 `tests/pages/permission-management/composables/usePermissionManagement.test.ts` 建立 `usePermissionManagement` 組合式函式的單元測試
- [x] T011 [P] [US1] 在 `tests/pages/permission-management/components/PermissionTable.test.ts` 建立 PermissionTable 元件測試

### 使用者故事 1 的實作

- [x] T012 [US1] 在 `src/pages/permission-management/apis/permission.ts` 實作 `getPermissions` API 函式，對應 GET /api/permissions
- [x] T013 [US1] 在 `src/pages/permission-management/apis/permission.ts` 實作 `getPermission` API 函式，對應 GET /api/permissions/{id}
- [x] T014 [US1] 在 `src/pages/permission-management/apis/permission.ts` 實作 `getPermissionUsage` API 函式，對應 GET /api/permissions/{id}/usage
- [x] T015 [US1] 在 `src/pages/permission-management/composables/usePermissionManagement.ts` 實作 `usePermissionManagement` 組合式函式，包含狀態管理、fetchPermissions、搜尋與分頁邏輯
- [x] T016 [P] [US1] 在 `src/pages/permission-management/components/PermissionTable.vue` 建立 PermissionTable 元件，使用 el-table，包含 id/name/code/description/usage/actions 欄位
- [x] T017 [US1] 在 `src/pages/permission-management/index.vue` 建立主頁面版型，整合搜尋輸入、PermissionTable 與 el-pagination
- [x] T018 [US1] 在 usePermissionManagement 組合式函式中新增錯誤處理與載入狀態
- [x] T019 [US1] 在 PermissionTable 元件中新增權限使用狀態顯示（roleCount 徽章）

**檢查點**：此時使用者故事 1 應該完全可用 - 使用者可以檢視、搜尋與分頁瀏覽權限

---

## Phase 4: User Story 2 - 新增權限 (Priority: P2)

**Goal**: 系統管理員可以建立新的權限項目，輸入權限名稱、權限代碼、描述等基本資訊

**Independent Test**: 管理員在權限管理介面點擊「新增權限」按鈕，填寫完整資訊並儲存，檢查新權限是否成功建立並出現在清單中。

### 使用者故事 2 的測試

- [x] T020 [P] [US2] 在 `tests/pages/permission-management/composables/usePermissionForm.test.ts` 建立 `usePermissionForm` 組合式函式的單元測試
- [x] T021 [P] [US2] 在 `tests/pages/permission-management/components/PermissionForm.test.ts` 建立 PermissionForm 元件測試
- [x] T022 [P] [US2] 在 `tests/utils/validate.test.ts` 建立 `validatePermissionCode` 工具函式的單元測試

### 使用者故事 2 的實作

- [x] T023 [US2] 在 `src/pages/permission-management/apis/permission.ts` 實作 `createPermission` API 函式，對應 POST /api/permissions
- [x] T024 [US2] 在 `src/pages/permission-management/composables/usePermissionForm.ts` 實作 `usePermissionForm` 組合式函式，包含表單狀態、驗證與新增模式的提交邏輯
- [x] T025 [US2] 在 `src/pages/permission-management/components/PermissionForm.vue` 建立 PermissionForm 元件，使用 el-form、el-input 欄位（name/code/description）與驗證規則
- [x] T026 [US2] 在 `src/pages/permission-management/index.vue` 新增「新增權限」按鈕與 el-dialog，以新增模式開啟 PermissionForm
- [x] T027 [US2] 在 usePermissionForm 中處理 DUPLICATE_CODE 錯誤回應，並顯示使用者友善的錯誤訊息
- [x] T028 [US2] 在 PermissionForm 元件中新增表單重置與取消功能
- [x] T029 [US2] 在主頁面中，於成功建立後重新整理權限清單

**檢查點**：此時使用者故事 1 與 2 應該都能獨立運作 - 使用者可以檢視權限並建立新權限

---

## Phase 5: User Story 3 - 編輯權限 (Priority: P2)

**Goal**: 系統管理員可以修改現有權限的資訊，包括權限名稱、描述等屬性

**Independent Test**: 管理員選擇一個現有權限，修改其資訊並儲存，檢查修改是否成功套用。

### 使用者故事 3 的測試

- [x] T030 [P] [US3] 在 `tests/pages/permission-management/composables/usePermissionForm.test.ts` 新增編輯模式測試
- [x] T031 [P] [US3] 在 `tests/pages/permission-management/composables/usePermissionForm.test.ts` 新增樂觀鎖定衝突測試

### 使用者故事 3 的實作

- [x] T032 [US3] 在 `src/pages/permission-management/apis/permission.ts` 實作 `updatePermission` API 函式，對應 PUT /api/permissions/{id}
- [x] T033 [US3] 在 `src/pages/permission-management/composables/usePermissionForm.ts` 擴充 `usePermissionForm` 組合式函式，支援編輯模式與版本追蹤
- [x] T034 [US3] 在 `src/pages/permission-management/components/PermissionTable.vue` 的 PermissionTable 元件操作欄位中新增編輯按鈕
- [x] T035 [US3] 在 `src/pages/permission-management/components/PermissionForm.vue` 擴充 PermissionForm 元件，處理編輯模式與預填資料
- [x] T036 [US3] 在 usePermissionForm 中實作 CONCURRENT_UPDATE_CONFLICT 錯誤處理，通知使用者重新載入
- [x] T037 [US3] 實作 SYSTEM_PERMISSION_PROTECTED 檢查，停用系統權限的編輯功能（isSystem=true）
- [x] T038 [US3] 在主頁面中，於成功更新後重新整理權限清單

**檢查點**：所有 CRUD 的讀取/新增/更新操作應該都能獨立運作

---

## Phase 6: User Story 4 - 刪除權限 (Priority: P3)

**Goal**: 系統管理員可以刪除不再需要的權限，刪除前系統會提示確認

**Independent Test**: 管理員選擇一個未被使用的權限並執行刪除操作，確認該權限從清單中消失。

### 使用者故事 4 的測試

- [x] T039 [P] [US4] 在 `tests/pages/permission-management/composables/usePermissionManagement.test.ts` 新增刪除操作測試
- [x] T040 [P] [US4] 在 `tests/pages/permission-management/composables/usePermissionManagement.test.ts` 新增權限使用中驗證測試

### 使用者故事 4 的實作

- [x] T041 [US4] 在 `src/pages/permission-management/apis/permission.ts` 實作 `deletePermission` API 函式，對應 DELETE /api/permissions/{id}
- [x] T042 [US4] 在 `src/pages/permission-management/composables/usePermissionManagement.ts` 的 `usePermissionManagement` 組合式函式中新增 `handleDelete` 函式
- [x] T043 [US4] 在 `src/pages/permission-management/components/PermissionTable.vue` 的 PermissionTable 元件操作欄位中新增刪除按鈕
- [x] T044 [US4] 實作 ElMessageBox 確認對話框，在刪除前顯示警告訊息
- [x] T045 [US4] 處理 PERMISSION_IN_USE 錯誤回應，並顯示哪些角色正在使用該權限
- [x] T046 [US4] 處理 SYSTEM_PERMISSION_PROTECTED 錯誤，防止刪除系統權限（isSystem=true）
- [x] T047 [US4] 在成功刪除後重新整理權限清單

**檢查點**：完整的 CRUD 操作（新增、讀取、更新、刪除）應該都能獨立運作並處理邊界情況

---

## Phase 7: User Story 5 - 批次操作權限 (Priority: P4)

**Goal**: 系統管理員可以同時選擇多個權限進行批次操作，如批次刪除、批次匯出等

**Independent Test**: 管理員在權限清單中勾選多個權限項目，執行批次刪除操作，確認所有選中的權限都被刪除。

### 使用者故事 5 的測試

- [x] T048 [P] [US5] 在 `tests/pages/permission-management/composables/usePermissionManagement.test.ts` 新增批次刪除測試
- [x] T049 [P] [US5] 在 `tests/pages/permission-management/composables/useExportExcel.test.ts` 建立 Excel 匯出的單元測試

### 使用者故事 5 的實作

- [x] T050 [US5] 在 `src/pages/permission-management/components/PermissionTable.vue` 的 PermissionTable 中新增選取變更處理器，使用 el-table type="selection"
- [x] T051 [US5] 在 `src/pages/permission-management/composables/usePermissionManagement.ts` 的 `usePermissionManagement` 組合式函式中新增 `handleBatchDelete` 函式
- [x] T052 [US5] 在 `src/pages/permission-management/index.vue` 的主頁面工具列中建立批次刪除按鈕（當選取項目 > 0 時顯示）
- [x] T053 [US5] 實作批次刪除確認對話框，列出選取的權限
- [x] T054 [US5] 處理部分成功的情況（部分權限使用中、部分可刪除），提供詳細回饋
- [x] T055 [P] [US5] 在 `src/pages/permission-management/composables/useExportExcel.ts` 實作 `useExportExcel` 組合式函式，用於 Excel 匯出功能
- [x] T056 [US5] 在 `src/pages/permission-management/index.vue` 的主頁面工具列中新增匯出按鈕
- [x] T057 [US5] 實作匯出邏輯，產生包含所有權限資料的 Excel 檔案

**檢查點**：所有使用者故事（包含批次操作）應該都能獨立運作

---

## Phase 8: 優化與跨領域關注點

**目的**：影響多個使用者故事的改善與最終品質保證

- [x] T058 [P] 在 PermissionTable 元件中新增載入骨架，提升資料載入期間的使用者體驗
- [x] T059 [P] 在 PermissionTable 元件中新增空狀態 UI，當無權限存在時顯示
- [x] T060 [P] 在主頁面的搜尋輸入中實作防抖，減少 API 呼叫次數
- [x] T061 [P] 在 PermissionTable 與 PermissionForm 中新增行動裝置檢視的響應式設計調整
- [x] T062 程式碼清理與重構：移除 console.logs，確保命名一致性
- [x] T063 [P] 在組合式函式與 API 檔案的所有公開函式中新增 JSDoc 註解
- [x] T064 效能優化：若權限數量 > 1000 則實作虛擬捲動（選擇性增強）
- [x] T065 [P] 執行 ESLint 檢查並修正所有 linting 錯誤：`pnpm lint`
- [x] T066 [P] 執行所有測試並確保 100% 通過率：`pnpm test permission-management`
- [x] T067 安全性檢查：確保所有路由與操作的權限檢查都已就位
- [x] T068 手動執行 quickstart.md 驗證情境，確認所有驗收標準
- [x] T069 若需要則更新文件（README 更新、行內程式碼註解）
- [x] T070 最終整合測試：測試從登入 → 檢視 → 新增 → 編輯 → 刪除 → 批次操作的完整工作流程

---

## 相依性與執行順序

### 階段相依性

- **設定（Phase 1）**：無相依性 - 可立即開始
- **基礎建設（Phase 2）**：相依於設定完成 - 阻擋所有使用者故事
- **使用者故事（Phase 3-7）**：全部相依於基礎建設階段完成
  - 使用者故事可按優先順序進行（P1 → P2 → P2 → P3 → P4）
  - 或若有多位開發者可並行處理
- **優化（Phase 8）**：相依於所有期望的使用者故事完成

### 使用者故事相依性

- **使用者故事 1（P1）**：可在基礎建設（Phase 2）後開始 - 不相依於其他故事
- **使用者故事 2（P2）**：可在基礎建設（Phase 2）後開始 - 獨立但使用 US1 的相同表格元件
- **使用者故事 3（P2）**：可在基礎建設（Phase 2）後開始 - 重用 US2 的表單元件
- **使用者故事 4（P3）**：可在基礎建設（Phase 2）後開始 - 獨立的刪除邏輯
- **使用者故事 5（P4）**：可在使用者故事 4 後開始 - 擴充刪除功能為批次能力

### 每個使用者故事內部

- 測試必須先撰寫且在實作前失敗
- API 函式在組合式函式之前
- 組合式函式在元件之前
- 元件在主頁面整合之前
- 故事完成後才移至下一個優先級

### 並行執行機會

**Phase 1 - 所有任務可並行執行：**
- T001、T002、T003、T004（不同檔案）

**Phase 2 - 並行群組：**
- 群組 A：T005（API 基礎）
- 群組 B：T006、T007、T009（工具與測試 - 可並行執行）
- 群組 C：T008（路由 - 相依於 T003）

**Phase 3 - 使用者故事 1：**
- 測試 T010、T011 可並行執行
- API 函式 T012、T013、T014 可並行執行
- T016（表格元件）可與 T015（組合式函式）並行執行

**Phase 4 - 使用者故事 2：**
- 測試 T020、T021、T022 可並行執行

**Phase 5 - 使用者故事 3：**
- 測試 T030、T031 可並行執行

**Phase 6 - 使用者故事 4：**
- 測試 T039、T040 可並行執行

**Phase 7 - 使用者故事 5：**
- 測試 T048、T049 可並行執行
- T055（匯出組合式函式）可與 T050-T054 並行執行

**Phase 8 - 大部分優化任務可並行執行：**
- T058、T059、T060、T061、T063、T064（不同關注點）
- T065、T066（測試任務）

---

## 並行範例：使用者故事 1

```bash
# 同時啟動使用者故事 1 的所有測試：
任務 T010：「在 tests/pages/permission-management/composables/usePermissionManagement.test.ts 中的 usePermissionManagement 單元測試」
任務 T011：「在 tests/pages/permission-management/components/PermissionTable.test.ts 中的 PermissionTable 元件測試」

# 同時啟動使用者故事 1 的所有 API 函式：
任務 T012：「在 src/pages/permission-management/apis/permission.ts 中的 getPermissions API」
任務 T013：「在 src/pages/permission-management/apis/permission.ts 中的 getPermission API」
任務 T014：「在 src/pages/permission-management/apis/permission.ts 中的 getPermissionUsage API」

# 並行啟動組合式函式與元件（不同檔案）：
任務 T015：「在 src/pages/permission-management/composables/usePermissionManagement.ts 中的 usePermissionManagement 組合式函式」
任務 T016：「在 src/pages/permission-management/components/PermissionTable.vue 中的 PermissionTable 元件」
```

---

## 實作策略

### MVP 優先（僅使用者故事 1）

1. 完成 Phase 1：設定 → 基本結構就緒
2. 完成 Phase 2：基礎建設 → API 客戶端、驗證、路由就緒
3. 完成 Phase 3：使用者故事 1 → 檢視與搜尋權限
4. **停止並驗證**：使用 quickstart 情境獨立測試使用者故事 1
5. 若就緒則部署/展示 → 使用者可以瀏覽權限

### 增量交付

1. 完成設定 + 基礎建設 → 基礎就緒（T001-T009）
2. 新增使用者故事 1（T010-T019）→ 獨立測試 → 部署/展示（MVP！瀏覽與搜尋）
3. 新增使用者故事 2（T020-T029）→ 獨立測試 → 部署/展示（建立權限）
4. 新增使用者故事 3（T030-T038）→ 獨立測試 → 部署/展示（編輯權限）
5. 新增使用者故事 4（T041-T047）→ 獨立測試 → 部署/展示（刪除權限）
6. 新增使用者故事 5（T048-T057）→ 獨立測試 → 部署/展示（批次操作）
7. 完成 Phase 8：優化 → 最終品質保證與優化
8. 每個故事都增加價值且不破壞先前的故事

### 並行團隊策略

若有多位開發者：

1. **團隊一起完成設定 + 基礎建設**（T001-T009）
2. 基礎建設完成後：
   - **開發者 A**：使用者故事 1（T010-T019）- 讀取操作
   - **開發者 B**：使用者故事 2（T020-T029）- 建立操作
   - **開發者 C**：工具與測試（T022、驗證器）
3. US1 與 US2 完成後：
   - **開發者 A**：使用者故事 3（T030-T038）- 更新操作
   - **開發者 B**：使用者故事 4（T041-T047）- 刪除操作
4. US3 與 US4 完成後：
   - **任一開發者**：使用者故事 5（T048-T057）- 批次操作
5. **團隊一起完成 Phase 8：優化**（T058-T070）

---

## 總結

- **總任務數**：70
- **任務分布**：
  - Phase 1（設定）：4 個任務
  - Phase 2（基礎建設）：5 個任務（阻擋所有故事）
  - Phase 3（US1 - 瀏覽與查詢）：10 個任務（2 測試 + 8 實作）
  - Phase 4（US2 - 新增權限）：10 個任務（3 測試 + 7 實作）
  - Phase 5（US3 - 編輯權限）：9 個任務（2 測試 + 7 實作）
  - Phase 6（US4 - 刪除權限）：9 個任務（2 測試 + 7 實作）
  - Phase 7（US5 - 批次操作）：10 個任務（2 測試 + 8 實作）
  - Phase 8（優化）：13 個任務
- **並行執行機會**：約 30% 的任務可並行執行（標記 [P]）
- **獨立測試標準**：每個使用者故事都有來自 spec.md 的明確驗收標準
- **MVP 範圍**：使用者故事 1（Phase 1 + Phase 2 + Phase 3 = 19 個任務）
- **格式驗證**：✅ 所有任務遵循檢查清單格式，包含 checkbox、ID、標籤、檔案路徑

---

## 注意事項

- [P] 任務 = 不同檔案、無相依性
- [Story] 標籤將任務對應到特定使用者故事以便追蹤（US1-US5）
- 每個使用者故事應該可以獨立完成與測試
- 測試已包含，因為這是安全性關鍵功能
- 在實作前驗證測試會失敗（建議採用 TDD 方法）
- 在每個任務或邏輯群組後提交
- 在任何檢查點停止以獨立驗證故事
- 遵循 user-management 模組的既有模式以保持一致性
- 所有 API 契約遵循 V3.Admin.Backend.API.yaml 規範
- 樂觀鎖定（版本號）對於並行編輯安全性至關重要
- 權限代碼驗證模式：`^[a-zA-Z0-9_]+:[a-zA-Z0-9_]+(:[a-zA-Z0-9_]+)?$`

# Tasks: 角色管理系統

**Input**: Design documents from `/specs/003-role-management/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/api-contracts.md, quickstart.md

**Tests**: 本專案不包含測試任務（功能規格未明確要求 TDD 方法）

**Organization**: 任務依用戶故事分組，使每個故事能夠獨立實作與測試

## Format: `[ID] [P?] [Story] Description`

- **[P]**: 可平行執行（不同檔案、無依賴關係）
- **[Story]**: 任務所屬用戶故事（如 US1, US2, US3）
- 描述中包含確切的檔案路徑

---

## Phase 1: Setup（共用基礎設施）

**目的**: 專案初始化與基本結構建立

- [ ] T001 建立角色管理模組目錄結構 src/pages/role-management/{apis,components,composables}
- [ ] T002 [P] 定義角色管理 TypeScript 型別介面 src/pages/role-management/types.ts
- [ ] T003 [P] 建立角色管理 API 客戶端封裝 src/pages/role-management/apis/role.ts
- [ ] T004 [P] 更新權限常數定義 src/common/constants/permissions.ts（新增 ROLE_PERMISSIONS）
- [ ] T005 新增角色管理路由配置 src/router/index.ts（新增 /role-management 路由）

---

## Phase 2: Foundational（阻塞性先決條件）

**目的**: 必須完成的核心基礎設施，任何用戶故事實作前都需完成

**⚠️ 關鍵**: 在此階段完成前，無法開始任何用戶故事的工作

- [ ] T006 實作角色管理核心邏輯組合式函式 src/pages/role-management/composables/useRoleManagement.ts
- [ ] T007 [P] 實作角色表單邏輯組合式函式 src/pages/role-management/composables/useRoleForm.ts
- [ ] T008 [P] 擴展全域 Axios 錯誤處理器 src/http/axios.ts（新增角色管理錯誤代碼處理：CONCURRENT_UPDATE_CONFLICT、DUPLICATE_NAME、ROLE_IN_USE）

**Checkpoint**: 基礎就緒 - 用戶故事實作現在可以平行開始

---

## Phase 3: User Story 1 - 角色基本管理 (Priority: P1) 🎯 MVP

**目標**: 提供角色的新增、編輯、刪除、查詢功能，讓管理員能建立和管理組織內的角色

**獨立測試**: 建立新角色「編輯者」→ 修改其名稱/描述 → 刪除該角色，無需依賴其他功能

### 實作 User Story 1

- [ ] T009 [P] [US1] 建立角色表格元件 src/pages/role-management/components/RoleTable.vue
- [ ] T010 [P] [US1] 建立角色表單對話框元件 src/pages/role-management/components/RoleForm.vue（基本資訊區域：角色名稱、描述）
- [ ] T011 [US1] 建立角色管理主頁面 src/pages/role-management/index.vue（整合 RoleTable、RoleForm、工具列、分頁）
- [ ] T012 [US1] 實作角色建立功能（表單驗證、API 呼叫、成功回饋）
- [ ] T013 [US1] 實作角色編輯功能（載入角色資料、版本號處理、樂觀鎖衝突處理）
- [ ] T014 [US1] 實作角色刪除功能（確認對話框、版本號驗證、使用中角色阻止刪除）
- [ ] T015 [US1] 實作角色列表查詢功能（分頁、排序、載入狀態）

**Checkpoint**: 此時 User Story 1 應完全可運作並可獨立測試

---

## Phase 4: User Story 2 - 角色權限設定 (Priority: P2)

**目標**: 為每個角色設定具體的權限，讓管理員能控制角色的操作範圍

**獨立測試**: 建立測試角色，為其分配「查看用戶」和「編輯用戶」權限，驗證權限正確保存和顯示

### 實作 User Story 2

- [ ] T016 [P] [US2] 建立權限選擇器元件 src/pages/role-management/components/PermissionSelector.vue（使用 el-tree 展示權限樹狀結構）
- [ ] T017 [P] [US2] 實作權限樹狀結構轉換邏輯 src/pages/role-management/composables/usePermissionTree.ts
- [ ] T018 [US2] 擴展角色表單元件 src/pages/role-management/components/RoleForm.vue（新增權限設定折疊面板區域）
- [ ] T019 [US2] 實作角色權限分配 API 整合（在 useRoleForm 中整合 assignPermissions API）
- [ ] T020 [US2] 實作權限樹載入與勾選狀態同步（載入角色詳細資訊、顯示已分配權限）
- [ ] T021 [US2] 實作父子節點聯動與搜尋過濾功能（el-tree 配置）

**Checkpoint**: 此時 User Stories 1 和 2 應都能獨立運作

---

## Phase 5: User Story 3 - 用戶角色分配 (Priority: P2)

**目標**: 在用戶管理頁面為用戶分配角色，使用戶繼承角色的權限

**獨立測試**: 在用戶管理頁面編輯用戶，為其分配「管理員」角色，保存後驗證用戶資訊中正確顯示該角色

### 實作 User Story 3

- [ ] T022 [P] [US3] 建立角色選擇器元件 src/pages/user-management/components/RoleSelector.vue（多選下拉選擇器，支援搜尋）
- [ ] T023 [P] [US3] 建立用戶角色 API 封裝 src/pages/user-management/apis/user-roles.ts
- [ ] T024 [P] [US3] 實作用戶角色邏輯組合式函式 src/pages/user-management/composables/useUserRoles.ts
- [ ] T025 [US3] 擴展 UserForm 元件 src/pages/user-management/components/UserForm.vue（新增角色選擇器欄位，最小侵入式修改）
- [ ] T026 [US3] 實作用戶角色分配功能（整合 assignUserRoles API）
- [ ] T027 [US3] 實作用戶角色移除功能（整合 removeUserRole API）
- [ ] T028 [US3] 在用戶列表表格新增角色顯示欄位（使用 el-tag 顯示多個角色）

**Checkpoint**: 所有用戶故事現在應都能獨立運作

---

## Phase 6: User Story 4 - 角色資料匯出 (Priority: P3)

**目標**: 將角色列表匯出為 Excel 報表，便於離線分析與備份

**獨立測試**: 在角色管理頁面點擊「匯出報表」按鈕，驗證成功下載包含所有角色資訊的 Excel 檔案

### 實作 User Story 4

- [ ] T029 [P] [US4] 實作 Excel 匯出邏輯組合式函式 src/pages/role-management/composables/useExportExcel.ts（使用 SheetJS）
- [ ] T030 [US4] 整合匯出按鈕至角色管理主頁面 src/pages/role-management/index.vue（工具列新增「匯出報表」按鈕）
- [ ] T031 [US4] 實作當前篩選資料匯出功能（匯出當前顯示的角色資料）
- [ ] T032 [US4] 實作匯出資料筆數提示（顯示「即將匯出 N 筆資料」）

**Checkpoint**: 所有功能現在應完整可用

---

## Phase 7: Polish & Cross-Cutting Concerns（潤飾與跨切面關注點）

**目的**: 影響多個用戶故事的改進

- [ ] T033 [P] 更新專案 README.md（新增角色管理功能說明、路由資訊）
- [ ] T034 程式碼清理與重構（移除未使用的匯入、統一命名風格）
- [ ] T035 效能優化（檢查角色列表載入時間 < 2 秒、匯出 100 筆資料 < 10 秒）
- [ ] T036 安全性強化（確認所有 API 端點權限檢查、XSS 防護）
- [ ] T037 執行 quickstart.md 驗證（按照開發指南完整測試所有功能）
- [ ] T038 ESLint 檢查（執行 pnpm lint 確保無錯誤）
- [ ] T039 [P] 新增程式碼註解（為複雜邏輯新增開發者友善註解）

---

## Dependencies & Execution Order

### 階段依賴關係

- **Setup (Phase 1)**: 無依賴 - 可立即開始
- **Foundational (Phase 2)**: 依賴 Setup 完成 - 阻塞所有用戶故事
- **User Stories (Phase 3-6)**: 全部依賴 Foundational 階段完成
  - 用戶故事之後可平行進行（若有人力）
  - 或按優先順序依序進行（P1 → P2 → P3）
- **Polish (Final Phase)**: 依賴所有期望的用戶故事完成

### 用戶故事依賴關係

- **User Story 1 (P1)**: 可在 Foundational (Phase 2) 後開始 - 無其他故事依賴
- **User Story 2 (P2)**: 可在 Foundational (Phase 2) 後開始 - 需要 US1 的角色表單元件但可擴展
- **User Story 3 (P2)**: 可在 Foundational (Phase 2) 後開始 - 與 US1 獨立，僅擴展用戶管理模組
- **User Story 4 (P3)**: 可在 Foundational (Phase 2) 後開始 - 與 US1 整合但不影響核心功能

### 故事內部依賴

- 元件建立優先於整合
- API 封裝優先於組合式函式
- 組合式函式優先於頁面整合
- 核心實作優先於擴展功能
- 故事完成後才移至下一優先級

### 平行執行機會

- Setup 階段所有標記 [P] 的任務可平行執行（T002, T003, T004）
- Foundational 階段所有標記 [P] 的任務可平行執行（T007, T008）
- Foundational 階段完成後，所有用戶故事可平行開始（若團隊容量允許）
- User Story 2 內的 T016 和 T017 可平行執行
- User Story 3 內的 T022、T023、T024 可平行執行
- Polish 階段的 T033 和 T039 可平行執行

---

## Parallel Example: User Story 2

```bash
# User Story 2 的平行任務範例：
Task T016: "建立權限選擇器元件 src/pages/role-management/components/PermissionSelector.vue"
Task T017: "實作權限樹狀結構轉換邏輯 src/pages/role-management/composables/usePermissionTree.ts"

# 這兩個任務可以同時進行，因為它們操作不同的檔案且無直接依賴
```

---

## Implementation Strategy

### MVP 優先（僅 User Story 1）

1. 完成 Phase 1: Setup（T001-T005）
2. 完成 Phase 2: Foundational（T006-T008）- **關鍵 - 阻塞所有故事**
3. 完成 Phase 3: User Story 1（T009-T015）
4. **停止並驗證**: 獨立測試 User Story 1
5. 若準備好則部署/展示

### 漸進式交付

1. 完成 Setup + Foundational → 基礎就緒
2. 新增 User Story 1 → 獨立測試 → 部署/展示（MVP！）
3. 新增 User Story 2 → 獨立測試 → 部署/展示
4. 新增 User Story 3 → 獨立測試 → 部署/展示
5. 新增 User Story 4 → 獨立測試 → 部署/展示
6. 每個故事在不破壞先前故事的情況下增加價值

### 平行團隊策略

若有多位開發者：

1. 團隊共同完成 Setup + Foundational
2. Foundational 完成後：
   - 開發者 A: User Story 1（角色基本管理）
   - 開發者 B: User Story 2（角色權限設定）
   - 開發者 C: User Story 3（用戶角色分配）
   - 開發者 D: User Story 4（角色資料匯出）
3. 故事獨立完成並整合

---

## Summary

### 任務統計

- **總任務數**: 39 個任務
- **Setup 階段**: 5 個任務
- **Foundational 階段**: 3 個任務
- **User Story 1**: 7 個任務
- **User Story 2**: 6 個任務
- **User Story 3**: 7 個任務
- **User Story 4**: 4 個任務
- **Polish 階段**: 7 個任務

### 各用戶故事任務分佈

- **US1（角色基本管理 P1）**: 7 個任務 - MVP 核心
- **US2（角色權限設定 P2）**: 6 個任務 - 增強功能
- **US3（用戶角色分配 P2）**: 7 個任務 - 整合功能
- **US4（角色資料匯出 P3）**: 4 個任務 - 輔助功能

### 平行執行機會

- Setup 階段: 3 個任務可平行（T002, T003, T004）
- Foundational 階段: 2 個任務可平行（T007, T008）
- User Story 2: 2 個任務可平行（T016, T017）
- User Story 3: 3 個任務可平行（T022, T023, T024）
- Polish 階段: 2 個任務可平行（T033, T039）
- **總計約 12 個任務可平行執行**

### 獨立測試標準

- **US1**: 建立/編輯/刪除角色，無需權限設定或用戶分配
- **US2**: 為角色分配權限，驗證權限正確保存
- **US3**: 為用戶分配角色，驗證用戶資訊更新
- **US4**: 匯出角色列表為 Excel，驗證檔案內容

### 建議 MVP 範圍

建議首次交付僅包含 **User Story 1**（角色基本管理）：
- 提供核心的角色 CRUD 功能
- 約 15 個任務（Setup + Foundational + US1）
- 預估開發時間: 3-4 天
- 可獨立測試與部署

---

## Format Validation

✅ 所有任務遵循檢查清單格式（`- [ ] [TaskID] [P?] [Story?] Description`）
✅ 所有任務包含明確的檔案路徑
✅ [P] 標記正確標示可平行執行的任務（不同檔案、無依賴）
✅ [Story] 標籤正確標示用戶故事所屬（US1-US4）
✅ Setup 和 Foundational 階段無 [Story] 標籤
✅ Polish 階段無 [Story] 標籤

---

## Notes

- **[P] 任務**: 不同檔案、無依賴關係
- **[Story] 標籤**: 將任務對應到特定用戶故事以便追蹤
- 每個用戶故事應能獨立完成與測試
- 在任何 Checkpoint 停止以獨立驗證故事
- 每個任務或邏輯群組後提交
- 避免：模糊任務、同檔案衝突、破壞獨立性的跨故事依賴

---

**開發愉快！ 🚀**

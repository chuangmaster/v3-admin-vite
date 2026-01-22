# Tasks: 密碼修改 API 調整

**Feature Branch**: `005-password-api-adjustment`  
**Input**: Design documents from `/specs/005-password-api-adjustment/`  
**Prerequisites**: plan.md, spec.md, data-model.md, research.md

## Format: `- [ ] [ID] [P?] [Story] Description`

- **[P]**: 可並行執行（不同檔案，無相依性）
- **[Story]**: 所屬用戶故事（US1, US2）
- 包含完整檔案路徑

---

## Phase 1: Setup（專案設定）

**目的**: 專案初始化與基礎架構

- [ ] T001 確認功能分支已建立並切換至 005-password-api-adjustment
- [ ] T002 確認後端 API 端點已實作（PUT /api/Account/{id}/reset-password 和 PUT /api/Account/me/password）
- [ ] T002-A 確認後端已實作 account.password.reset 權限檢查與審計日誌記錄

---

## Phase 2: Foundational（基礎建設）

**目的**: 型別定義與 API 層實作，為兩個用戶故事奠定基礎

**⚠️ 關鍵**: 此階段必須完成後，用戶故事才能開始實作

- [X] T003 [P] 新增 ResetPasswordRequest 型別定義於 src/pages/user-management/types.ts
- [X] T004 [P] 新增 resetPassword API 函式於 src/pages/user-management/apis/user.ts
- [X] T005 修改 changePassword API 端點路徑為 /account/me/password 於 src/pages/user-management/apis/user.ts

**檢查點**: API 層與型別定義完成 - 用戶故事實作可以開始

---

## Phase 3: User Story 1 - 管理者重設用戶密碼 (Priority: P1) 🎯 MVP

**目標**: 管理者能夠直接為用戶重設密碼，無需知道舊密碼

**獨立測試**: 管理者登入系統 → 選擇用戶 → 輸入新密碼 → 提交重設 → 用戶使用新密碼登入成功

### 實作 User Story 1

- [X] T006 [US1] 更新 useChangePasswordForm 組合式函式的 import 為 resetPassword 於 src/pages/user-management/composables/useChangePasswordForm.ts
- [X] T007 [US1] 移除 FormData 介面中的 oldPassword 欄位於 src/pages/user-management/composables/useChangePasswordForm.ts
- [X] T008 [US1] 移除 formData reactive 物件中的 oldPassword 初始值於 src/pages/user-management/composables/useChangePasswordForm.ts
- [X] T009 [US1] 移除 rules 中的 oldPassword 驗證規則於 src/pages/user-management/composables/useChangePasswordForm.ts
- [X] T010 [US1] 更新 submitForm 函式呼叫 resetPassword API 並移除 oldPassword 參數於 src/pages/user-management/composables/useChangePasswordForm.ts
- [X] T011 [US1] 更新 handleApiError 移除 INVALID_OLD_PASSWORD 處理，新增 403 和 404 錯誤處理於 src/pages/user-management/composables/useChangePasswordForm.ts
- [X] T012 [US1] 檢查並更新 ChangePasswordModal 元件，移除舊密碼輸入欄位（如果存在）於 src/pages/user-management/components/ChangePasswordModal.vue

**檢查點**: 管理者應能成功重設用戶密碼，無需提供舊密碼

---

## Phase 4: User Story 2 - 用戶自行修改密碼 (Priority: P1)

**目標**: 用戶能夠自行修改密碼，必須提供舊密碼驗證

**獨立測試**: 用戶登入系統 → 進入個人設定 → 輸入舊密碼與新密碼 → 提交修改 → 使用新密碼重新登入成功

### 實作 User Story 2

- [X] T013 [US2] 確認 useChangePasswordForm 組合式函式保持 oldPassword 欄位不變於 src/pages/profile/composables/useChangePassword.ts
- [X] T014 [US2] 確認 ChangePasswordForm 元件包含舊密碼輸入欄位於 src/pages/profile/components/ChangePasswordForm.vue
- [X] T015 [US2] 確認 changePassword API 使用 /account/me/password 端點且包含 oldPassword 參數

**檢查點**: 用戶應能成功修改密碼，且必須提供正確的舊密碼

---

## Phase 5: 測試更新

**目的**: 更新測試以反映新的 API 行為

- [X] T016 [P] 更新 useChangePasswordForm 測試的 mock 函式為 resetPassword 於 tests/composables/useChangePasswordForm.test.ts
- [X] T017 [P] 更新管理者密碼重設測試案例，移除 oldPassword 相關驗證於 tests/composables/useChangePasswordForm.test.ts
- [X] T018 [P] 新增管理者權限錯誤測試（403 Forbidden）於 tests/composables/useChangePasswordForm.test.ts
- [X] T019 [P] 新增用戶不存在錯誤測試（404 Not Found）於 tests/composables/useChangePasswordForm.test.ts
- [X] T020 [P] 新增 resetPassword API 單元測試於 tests/apis/user.test.ts
- [X] T021 [P] 確認 useChangePassword 測試保持不變，包含 oldPassword 驗證於 tests/composables/useChangePassword.test.ts
- [X] T022 執行所有測試確保通過：pnpm test

---

## Phase 6: 文件更新

**目的**: 建立完整的 API 規格與開發指南

- [X] T023 [P] 建立 API Contracts 文件於 specs/005-password-api-adjustment/contracts/api-contracts.md
- [X] T024 [P] 建立 Data Model 文件於 specs/005-password-api-adjustment/data-model.md
- [X] T025 [P] 建立 Quickstart 文件於 specs/005-password-api-adjustment/quickstart.md

---

## Phase 7: 最終檢查與部署準備

**目的**: 確保所有功能正常運作

- [X] T026 執行完整測試套件：pnpm test
- [X] T027 執行 TypeScript 類型檢查：pnpm type-check
- [X] T028 執行 ESLint 檢查：pnpm lint
- [ ] T029 手動測試管理者重設密碼功能（無需舊密碼）
- [ ] T030 手動測試用戶自行修改密碼功能（需提供舊密碼）
- [ ] T031 測試密碼驗證規則（長度、複雜度）
- [ ] T032 測試舊密碼錯誤處理（僅用戶修改）
- [ ] T033 測試版本衝突處理（樂觀鎖）
- [ ] T034 測試密碼修改成功後 JWT 失效
- [ ] T035 測試非管理者嘗試重設密碼被拒絕（403 Forbidden，驗證後端權限檢查）
- [ ] T036 準備 Pull Request 描述與 checklist

---

## Dependencies & Execution Order

### 階段相依性

- **Setup (Phase 1)**: 無相依 - 可立即開始
- **Foundational (Phase 2)**: 依賴 Setup 完成 - 阻擋所有用戶故事
- **User Stories (Phase 3-4)**: 都依賴 Foundational 階段完成
  - US1 與 US2 可並行實作（不同檔案）
  - 或依優先順序序列執行（P1 → P1）
- **測試更新 (Phase 5)**: 可在用戶故事實作期間並行進行
- **文件更新 (Phase 6)**: 可在實作完成後並行進行
- **最終檢查 (Phase 7)**: 依賴所有實作與測試完成

### 用戶故事相依性

- **User Story 1 (P1)**: 在 Foundational (Phase 2) 完成後可開始 - 無其他故事相依
- **User Story 2 (P1)**: 在 Foundational (Phase 2) 完成後可開始 - 無其他故事相依
- US1 與 US2 可由不同開發者並行實作

### 各用戶故事內部順序

**User Story 1**:
1. 更新 import (T006)
2. 移除 FormData.oldPassword (T007)
3. 移除 formData 初始值 (T008)
4. 移除驗證規則 (T009)
5. 更新 API 呼叫 (T010)
6. 更新錯誤處理 (T011)
7. 更新元件 (T012)

**User Story 2**:
- 所有任務為確認型任務，可並行執行 (T013-T015)

### 並行執行機會

- Phase 2 的所有任務可並行執行 (T003-T005) - 不同檔案區域
- Phase 5 的所有測試更新可並行執行 (T016-T021) - 不同測試檔案
- Phase 6 的所有文件更新可並行執行 (T023-T025) - 不同文件檔案
- US1 與 US2 可由不同開發者並行實作（Phase 3 與 Phase 4）

---

## Parallel Example: Foundational Phase

```bash
# 同時執行所有基礎建設任務：
Task T003: "新增 ResetPasswordRequest 型別定義於 src/pages/user-management/types.ts"
Task T004: "新增 resetPassword API 函式於 src/pages/user-management/apis/user.ts"
Task T005: "修改 changePassword API 端點路徑於 src/pages/user-management/apis/user.ts"
```

## Parallel Example: User Stories

```bash
# Developer A 實作 User Story 1:
Task T006-T012: 管理者重設密碼功能

# Developer B 同時實作 User Story 2:
Task T013-T015: 用戶自行修改密碼功能確認
```

---

## Implementation Strategy

### MVP First (兩個 P1 故事都包含)

1. 完成 Phase 1: Setup
2. 完成 Phase 2: Foundational（關鍵 - 阻擋所有故事）
3. 完成 Phase 3: User Story 1（管理者重設密碼）
4. 完成 Phase 4: User Story 2（用戶自行修改密碼）
5. **停止並驗證**: 測試兩個故事獨立運作
6. 如準備就緒可部署/展示

### 增量交付

1. 完成 Setup + Foundational → 基礎就緒
2. 加入 User Story 1 → 獨立測試 → 部署/展示
3. 加入 User Story 2 → 獨立測試 → 部署/展示
4. 完成測試更新 → 確保品質
5. 完成文件更新 → 方便維護
6. 最終檢查 → 準備上線

### 並行團隊策略

若有多位開發者：

1. 團隊一起完成 Setup + Foundational
2. Foundational 完成後：
   - Developer A: User Story 1（管理者功能）
   - Developer B: User Story 2（用戶功能）
   - Developer C: 測試更新 (Phase 5)
3. 故事獨立完成並整合

---

## Notes

- [P] 標記的任務可並行執行（不同檔案，無相依性）
- [Story] 標籤將任務映射到特定用戶故事，方便追蹤
- 每個用戶故事應能獨立完成與測試
- 每個任務完成後提交 commit
- 在每個檢查點停下來驗證故事獨立運作
- 避免：模糊任務、同檔案衝突、跨故事相依性破壞獨立性

---

## Estimated Time

- **Phase 1**: 5 分鐘
- **Phase 2**: 30 分鐘（基礎建設）
- **Phase 3**: 30 分鐘（User Story 1）
- **Phase 4**: 10 分鐘（User Story 2 - 主要為確認）
- **Phase 5**: 45 分鐘（測試更新）
- **Phase 6**: 20 分鐘（文件更新）
- **Phase 7**: 30 分鐘（最終檢查與手動測試）

**總計**: 約 2.5-3 小時

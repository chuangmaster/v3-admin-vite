# Tasks: 用戶個人資料與密碼管理

**Feature**: 004-user-profile  
**Branch**: `004-user-profile`  
**Generated**: 2026-01-19  
**Input**: Design documents from `/specs/004-user-profile/`

**Tests**: ✅ 包含測試任務（為關鍵組合式函式與元件編寫單元測試）

**Organization**: 任務按用戶故事分組，每個故事可獨立實作與驗證

---

## Format: `- [ ] [ID] [P?] [Story?] Description`

- **Checkbox**: `- [ ]` 標記任務狀態
- **[P]**: 可平行執行（不同檔案，無依賴）
- **[Story]**: 所屬用戶故事（US1, US2, US3）
- 描述包含完整檔案路徑

---

## Phase 1: Setup（專案初始化）

**目的**: 建立專案基礎結構與目錄

- [ ] T001 建立個人資料模組目錄結構 `src/pages/profile/`（包含 components, composables 子目錄）

---

## Phase 2: Foundational（基礎前置作業）

**目的**: 核心基礎設施，所有用戶故事的前置需求

**⚠️ 關鍵**: 此階段必須完成，才能開始任何用戶故事

- [ ] T002 [P] 擴展 API 型別定義，新增 UserProfile 相關型別至 `src/common/apis/users/type.ts`
- [ ] T003 [P] 建立頁面私有型別定義檔案 `src/pages/profile/types.ts`（定義 UserProfile, ChangePasswordFormData, ChangePasswordRequest）
- [ ] T004 更新 getCurrentUserApi 函式，確保回傳完整 UserProfile（包含 id, version）於 `src/common/apis/users/index.ts`
- [ ] T004.1 [P] 檢查並統一 Pinia store (useUserStore) 中的欄位命名，將 username 改為 account 於 `src/pinia/stores/user.ts`（對齊後端 API 欄位名稱）
- [ ] T004.2 [P] 檢查專案中所有使用 username 的地方，統一改為 account（搜尋 `src/` 目錄）

**檢查點**: 基礎設施就緒 - 用戶故事現在可以開始平行實作

---

## Phase 3: User Story 1 - 查看個人資訊頁面 (Priority: P1) 🎯 MVP

**目標**: 用戶可透過 NavigationBar 進入個人資訊頁面，查看帳號、顯示名稱、角色資訊

**獨立測試**: 用戶登入後點擊右上角「個人資訊」選單項目，進入頁面，能看到完整帳號資訊（顯示名稱、帳號、角色），即驗證此功能獨立運作

### 實作 User Story 1

- [ ] T005 [P] [US1] 建立用戶資料組合式函式 `src/pages/profile/composables/useUserProfile.ts`（包含 fetchUserProfile, refreshProfile）
- [ ] T006 [P] [US1] 建立用戶資訊卡片元件 `src/pages/profile/components/UserInfoCard.vue`（使用 el-descriptions 顯示資訊）
- [ ] T007 [US1] 建立個人資料主頁面 `src/pages/profile/index.vue`（整合 UserInfoCard，呼叫 useUserProfile）
- [ ] T008 [US1] 新增個人資料路由至 `src/router/index.ts`（path: "/profile", name: "UserProfile", meta.hidden: true）
- [ ] T009 [US1] 更新 NavigationBar 選單，新增「個人資訊」項目至 `src/layouts/components/NavigationBar/index.vue`（使用 router-link to="/profile"）
- [ ] T010 [US1] 新增頁面樣式與響應式佈局至 `src/pages/profile/index.vue`（使用 el-row, el-col 實作雙卡片佈局）

### 測試 User Story 1

- [ ] T010.1 [P] [US1] 編寫 useUserProfile 組合式函式單元測試 `tests/composables/useUserProfile.test.ts`（測試 fetchUserProfile, refreshProfile）
- [ ] T010.2 [P] [US1] 編寫 UserInfoCard 元件測試 `tests/pages/profile/components/UserInfoCard.test.ts`（測試資料顯示、loading 狀態）

**檢查點**: 此時 User Story 1 應完全可用且可獨立測試

---

## Phase 4: User Story 2 - 在個人資訊頁面修改密碼 (Priority: P1)

**目標**: 用戶可在個人資訊頁面內直接修改密碼，包含表單驗證、併發控制、錯誤處理

**獨立測試**: 用戶進入個人資訊頁面，在密碼修改區塊輸入舊密碼和新密碼後成功儲存，下次使用新密碼登入成功，即驗證此功能獨立運作

### 實作 User Story 2

- [ ] T011 [P] [US2] 建立密碼修改組合式函式 `src/pages/profile/composables/useChangePassword.ts`（包含表單驗證、提交邏輯、錯誤處理）
- [ ] T012 [P] [US2] 建立密碼修改表單元件 `src/pages/profile/components/ChangePasswordForm.vue`（使用 el-form，包含舊密碼、新密碼、確認密碼欄位）
- [ ] T013 [US2] 整合密碼修改表單至主頁面 `src/pages/profile/index.vue`（傳遞 userId 與 version props，監聽 password-changed 與 refresh-required 事件）
- [ ] T014 [US2] 實作表單驗證規則於 `src/pages/profile/composables/useChangePassword.ts`（必填、最小長度、確認密碼一致性）
- [ ] T015 [US2] 實作併發衝突處理邏輯於 `src/pages/profile/composables/useChangePassword.ts`（捕捉 409 Conflict，觸發 refresh-required 事件）
- [ ] T016 [US2] 實作密碼修改錯誤處理於 `src/pages/profile/composables/useChangePassword.ts`（401 舊密碼錯誤、400 驗證錯誤、500 伺服器錯誤）
- [ ] T017 [US2] 新增密碼修改成功提示與表單重置邏輯至 `src/pages/profile/composables/useChangePassword.ts`

### 測試 User Story 2

- [ ] T017.1 [P] [US2] 編寫 useChangePassword 組合式函式單元測試 `tests/composables/useChangePassword.test.ts`（測試表單驗證、提交邏輯、錯誤處理）
- [ ] T017.2 [P] [US2] 編寫 ChangePasswordForm 元件測試 `tests/pages/profile/components/ChangePasswordForm.test.ts`（測試表單輸入、驗證規則、提交流程）

**檢查點**: 此時 User Story 1 與 User Story 2 應同時可用且可獨立測試

---

## Phase 5: User Story 3 - 選單權限正確顯示 (Priority: P2)

**目標**: 根據用戶權限，僅顯示有權存取的選單項目，無權限項目不顯示

**獨立測試**: 以不同權限的用戶帳號登入，檢查顯示的選單項目是否僅包含該用戶有權限存取的項目

### 實作 User Story 3

- [ ] T018 [US3] 檢查並確認 Sidebar 元件的權限過濾邏輯正確實作於 `src/layouts/components/Sidebar/`
- [ ] T019 [US3] 確認路由配置的 permissions 與 roles 屬性正確使用於 `src/router/index.ts`
- [ ] T020 [US3] 驗證路由守衛的權限檢查邏輯於 `src/router/guard.ts`（確保無權限用戶無法透過 URL 直接存取）
- [ ] T021 [US3] 測試多種權限組合（管理員、一般用戶、無權限用戶）的選單顯示結果

**注意**: User Story 3 主要為驗證與測試工作，因現有系統已實作基本權限機制

**檢查點**: 所有用戶故事應現在獨立可用

---

## Phase 6: Polish & Cross-Cutting Concerns（優化與跨領域關注）

**目的**: 影響多個用戶故事的改進

- [ ] T022 [P] 新增用戶資訊卡片元件樣式優化至 `src/pages/profile/components/UserInfoCard.vue`（調整間距、字體大小、卡片陰影）
- [ ] T023 [P] 新增密碼修改表單元件樣式優化至 `src/pages/profile/components/ChangePasswordForm.vue`（按鈕對齊、輸入框寬度）
- [ ] T024 [P] 新增 Loading 狀態顯示至 `src/pages/profile/components/UserInfoCard.vue`（使用 v-loading 指令）
- [ ] T025 [P] 新增密碼修改提交中狀態至 `src/pages/profile/components/ChangePasswordForm.vue`（按鈕 loading 狀態）
- [ ] T026 [P] 新增錯誤狀態處理與重試機制至 `src/pages/profile/composables/useUserProfile.ts`
- [ ] T027 程式碼重構：提取共用邏輯與常數至 `src/pages/profile/` 相關檔案
- [ ] T028 [P] 新增 JSDoc 註解至所有組合式函式與公開方法
- [ ] T029 效能優化：確認 useUserProfile 僅在 mounted 時呼叫一次 fetchUserProfile API（避免重複載入）
- [ ] T030 執行 quickstart.md 驗證流程（按照 Step 1-8 測試完整功能）
- [ ] T031 [P] 執行所有單元測試並確保通過率 100%（`pnpm test`）

---

## Dependencies & Execution Order（依賴關係與執行順序）

### 階段依賴

- **Setup (Phase 1)**: 無依賴 - 可立即開始
- **Foundational (Phase 2)**: 依賴 Setup 完成 - 阻擋所有用戶故事
- **User Stories (Phase 3-5)**: 所有故事依賴 Foundational 完成
  - 用戶故事可平行進行（若有足夠人力）
  - 或按優先順序依序進行（P1 → P1 → P2）
- **Polish (Phase 6)**: 依賴所有期望的用戶故事完成

### 用戶故事依賴

- **User Story 1 (P1)**: Foundational 完成後可開始 - 無其他故事依賴
- **User Story 2 (P1)**: Foundational 完成後可開始 - 需 US1 的頁面結構，建議 US1 完成後開始
- **User Story 3 (P2)**: Foundational 完成後可開始 - 主要為驗證現有系統，可獨立進行

### 每個用戶故事內部

- 組合式函式與元件可平行開發（標記 [P]）
- 主頁面整合需等待元件與組合式函式完成
- 路由與選單配置需等待頁面完成
- 故事完成後再進入下一優先級

### 平行執行機會

- Setup 階段的所有任務可平行執行
- Foundational 階段標記 [P] 的任務可平行執行
- User Story 1 的 T005、T006 可平行執行（組合式函式與元件）
- User Story 2 的 T011、T012 可平行執行（組合式函式與元件）
- Polish 階段大部分任務可平行執行（不同檔案）

---

## Parallel Example: User Story 1

```bash
# 平行啟動 User Story 1 的元件與邏輯
Task T005: "建立用戶資料組合式函式 src/pages/profile/composables/useUserProfile.ts"
Task T006: "建立用戶資訊卡片元件 src/pages/profile/components/UserInfoCard.vue"

# 兩者完成後，依序執行
Task T007: "建立個人資料主頁面 src/pages/profile/index.vue"
Task T008: "新增個人資料路由至 src/router/index.ts"
Task T009: "更新 NavigationBar 選單 src/layouts/components/NavigationBar/index.vue"
```

---

## Parallel Example: User Story 2

```bash
# 平行啟動 User Story 2 的元件與邏輯
Task T011: "建立密碼修改組合式函式 src/pages/profile/composables/useChangePassword.ts"
Task T012: "建立密碼修改表單元件 src/pages/profile/components/ChangePasswordForm.vue"

# 兩者完成後，依序執行
Task T013: "整合密碼修改表單至主頁面 src/pages/profile/index.vue"
Task T014-T017: "實作表單驗證、錯誤處理、併發控制邏輯"
```

---

## Implementation Strategy（實作策略）

### MVP 優先（僅 User Story 1）

1. 完成 Phase 1: Setup
2. 完成 Phase 2: Foundational（關鍵 - 阻擋所有故事）
3. 完成 Phase 3: User Story 1
4. **停止並驗證**: 獨立測試 User Story 1
5. 準備好則部署/展示

### 漸進式交付

1. 完成 Setup + Foundational → 基礎就緒
2. 新增 User Story 1 → 獨立測試 → 部署/展示（MVP！）
3. 新增 User Story 2 → 獨立測試 → 部署/展示
4. 新增 User Story 3 → 獨立測試 → 部署/展示
5. 每個故事都在不破壞先前故事的情況下增加價值

### 平行團隊策略

若有多位開發者：

1. 團隊共同完成 Setup + Foundational
2. Foundational 完成後：
   - 開發者 A: User Story 1（查看個人資訊）
   - 開發者 B: User Story 2（修改密碼）- 建議等 US1 完成
   - 開發者 C: User Story 3（權限驗證）- 可獨立進行
3. 故事獨立完成並整合

---

## Summary（摘要）

**總任務數**: 37 個任務

**任務分佈**:
- Phase 1 (Setup): 1 個任務
- Phase 2 (Foundational): 5 個任務（包含 account 欄位統一）
- Phase 3 (US1 - 查看個人資訊): 6 個實作任務 + 2 個測試任務 = 8 個任務
- Phase 4 (US2 - 修改密碼): 7 個實作任務 + 2 個測試任務 = 9 個任務
- Phase 5 (US3 - 選單權限): 4 個任務
- Phase 6 (Polish): 10 個任務（包含測試執行）

**平行執行機會**: 
- Foundational: 4 個平行任務（T002, T003, T004.1, T004.2）
- User Story 1: 4 個平行任務（T005, T006, T010.1, T010.2）
- User Story 2: 4 個平行任務（T011, T012, T017.1, T017.2）
- Polish: 7 個平行任務（T022-T028, T031）

**獨立測試標準**:
- **US1**: 用戶可進入頁面並查看完整個人資訊
- **US2**: 用戶可在同一頁面修改密碼，下次登入使用新密碼成功
- **US3**: 不同權限用戶看到的選單項目符合權限配置

**建議 MVP 範圍**: 
- **最小範圍**: Phase 1 + Phase 2 + Phase 3（User Story 1）- 約 14 個任務
- **推薦範圍**: Phase 1 + Phase 2 + Phase 3 + Phase 4（User Story 1 & 2 含測試）- 約 23 個任務
- **完整範圍**: 所有 Phase（包含 User Story 3、Polish 與完整測試）- 37 個任務

---

## Notes（注意事項）

- ✅ 所有任務遵循 checklist 格式（`- [ ] [TaskID] [P?] [Story?] Description + file path`）
- ✅ [P] 任務表示不同檔案、無依賴關係
- ✅ [Story] 標籤將任務映射至特定用戶故事以便追蹤
- ✅ 每個用戶故事可獨立完成與測試
- ✅ 包含單元測試任務確保程式碼品質
- ✅ FR-012 account 欄位統一已整合至 Phase 2（前端範圍）
- ✅ FR-005-1 錯誤密碼日誌由後端處理，前端無需額外任務
- ⚠️ 避免：模糊任務、同檔案衝突、破壞獨立性的跨故事依賴
- 📝 每個任務或邏輯群組後提交 commit
- 🔍 在任何檢查點停下來獨立驗證故事
- 🧪 測試任務應在對應實作完成後立即執行
- 🎯 優先完成 User Story 1 與 2（P1 優先級），再考慮 User Story 3

---

**Phase 2 Complete** ✅  
**Generated By**: `/speckit.tasks` command  
**Ready for Implementation**: 按照 Phase 順序或 quickstart.md 指南開始實作

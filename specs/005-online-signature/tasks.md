# Tasks: 線上簽章請求

**Input**: Design documents from `/specs/005-online-signature/`  
**Prerequisites**: plan.md, spec.md  
**Organization**: Tasks are grouped by user story to enable independent implementation and testing

---

## Format: `- [ ] [ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3, US4)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: 專案初始化和基本結構

- [ ] T001 確認專案依賴已安裝 (Vue 3.5+, Element Plus, Axios, TypeScript)
- [ ] T002 確認現有目錄結構符合計劃 (src/pages/service-order-management/)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: 核心基礎設施，所有用戶故事開始前必須完成

**⚠️ 重要**: 在此階段完成前，不能開始任何用戶故事的實作

- [X] T003 [P] 新增 OnlineSignatureStatus 列舉到 src/pages/service-order-management/types.ts
- [X] T004 [P] 新增 DocumentType 列舉到 src/pages/service-order-management/types.ts（匹配後端規格）
- [X] T005 [P] 擴展 SignatureRecord 介面，新增線上簽章相關欄位到 src/pages/service-order-management/types.ts
- [X] T006 [P] 新增 SendOnlineSignatureRequest 介面到 src/pages/service-order-management/types.ts
- [X] T007 [P] 新增 SendOnlineSignatureResponse 介面到 src/pages/service-order-management/types.ts
- [X] T008 創建 src/pages/service-order-management/apis/online-signature.ts API 服務檔案
- [X] T009 實作 sendOnlineSignature API 函式在 src/pages/service-order-management/apis/online-signature.ts（註：後端會根據 serviceOrderId 自動判斷文件類型）
- [X] T010 實作 resendOnlineSignature API 函式在 src/pages/service-order-management/apis/online-signature.ts

**Checkpoint**: 基礎完成 - 用戶故事實作現在可以並行開始

---

## Phase 3: User Story 1 - 發送簽章請求給線上客戶 (Priority: P1) 🎯 MVP

**Goal**: 讓服務人員可以在服務單詳情頁面發送線上簽章請求給客戶，並查看簽章狀態

**Independent Test**: 服務人員可以在服務單詳情頁面點擊「發送簽章請求」按鈕，系統會生成簽章連結並發送給客戶，服務人員可以看到簽章狀態更新為「已發送」

### Implementation for User Story 1

- [X] T011 [P] [US1] 創建 src/pages/service-order-management/composables/useOnlineSignature.ts 組合式函式檔案
- [X] T012 [US1] 實作 sendSignatureRequest 函式在 src/pages/service-order-management/composables/useOnlineSignature.ts
- [X] T013 [US1] 實作 getStatusText 輔助函式在 src/pages/service-order-management/composables/useOnlineSignature.ts
- [X] T014 [US1] 實作 getStatusType 輔助函式在 src/pages/service-order-management/composables/useOnlineSignature.ts
- [X] T015 [US1] 創建 src/pages/service-order-management/components/OnlineSignatureSection.vue 元件
- [X] T016 [US1] 實作 OnlineSignatureSection 元件的基本結構和 Props/Emits 在 src/pages/service-order-management/components/OnlineSignatureSection.vue
- [X] T017 [US1] 實作「發送簽章請求」按鈕和處理邏輯在 src/pages/service-order-management/components/OnlineSignatureSection.vue
- [X] T018 [US1] 實作簽章紀錄列表顯示在 src/pages/service-order-management/components/OnlineSignatureSection.vue
- [X] T019 [US1] 實作簽章狀態顯示 (NOT_SENT, PENDING, COMPLETED, TERMINATED) 在 src/pages/service-order-management/components/OnlineSignatureSection.vue
- [X] T020 [US1] 新增 OnlineSignatureSection 元件樣式 (SCSS scoped) 在 src/pages/service-order-management/components/OnlineSignatureSection.vue
- [X] T021 [US1] 整合 OnlineSignatureSection 元件到 src/pages/service-order-management/detail.vue
- [X] T022 [US1] 實作 handleOnlineSignatureSuccess 處理函式在 src/pages/service-order-management/detail.vue
- [X] T023 [US1] 新增錯誤處理和載入狀態顯示（包含 API 錯誤處理）

**Checkpoint**: 此時 User Story 1 應該完全功能正常並可獨立測試

---

## Phase 4: User Story 2 - 重新發送簽章請求 (Priority: P2)

**Goal**: 讓服務人員可以重新發送簽章請求給客戶（處理連結遺失或過期情況）

**Independent Test**: 在已發送但未完成簽署的服務單中，點擊「重新發送簽章請求」按鈕，系統會重新生成並發送新的簽章連結

### Implementation for User Story 2

- [X] T024 [US2] 實作 resendSignatureRequest 函式在 src/pages/service-order-management/composables/useOnlineSignature.ts
- [X] T025 [US2] 實作 canResend 檢查函式在 src/pages/service-order-management/composables/useOnlineSignature.ts
- [X] T026 [US2] 新增「重新發送簽章請求」按鈕到 src/pages/service-order-management/components/OnlineSignatureSection.vue
- [X] T027 [US2] 實作 handleResend 處理函式在 src/pages/service-order-management/components/OnlineSignatureSection.vue
- [X] T028 [US2] 實作後端錯誤處理（包括頻率限制錯誤）在 src/pages/service-order-management/composables/useOnlineSignature.ts
- [X] T029 [US2] 實作按鈕禁用邏輯（僅 PENDING 狀態顯示）在 src/pages/service-order-management/components/OnlineSignatureSection.vue

**Checkpoint**: 此時 User Stories 1 和 2 應該都能獨立運作

---

## Phase 5: User Story 3 - 複製簽章連結 (Priority: P2)

**Goal**: 讓服務人員可以複製簽章連結，透過其他管道分享給客戶

**Independent Test**: 點擊「複製簽章連結」按鈕後，連結被複製到剪貼簿，可以貼到其他應用程式中

### Implementation for User Story 3

- [X] T030 [US3] 實作 copySignatureUrl 函式在 src/pages/service-order-management/composables/useOnlineSignature.ts
- [X] T031 [US3] 實作 canCopyUrl 檢查函式在 src/pages/service-order-management/composables/useOnlineSignature.ts
- [X] T032 [US3] 新增「複製簽章連結」按鈕到 src/pages/service-order-management/components/OnlineSignatureSection.vue
- [X] T033 [US3] 實作 handleCopyUrl 處理函式在 src/pages/service-order-management/components/OnlineSignatureSection.vue
- [X] T034 [US3] 新增複製成功提示訊息
- [X] T035 [US3] 處理瀏覽器不支援 clipboard API 的降級方案

**Checkpoint**: 此時 User Stories 1、2 和 3 應該都能獨立運作

---

## Phase 6: User Story 4 - 查看簽章狀態 (Priority: P1)

**Goal**: 讓服務人員可以即時查看客戶的簽章狀態

**Independent Test**: 在服務單詳情頁面的簽名紀錄區塊，可以清楚看到簽章狀態（待簽署、已簽署等）

### Implementation for User Story 4

- [X] T036 [US4] 實作簽章紀錄篩選邏輯（僅顯示 ONLINE 類型）在 src/pages/service-order-management/components/OnlineSignatureSection.vue
- [X] T037 [US4] 實作簽章狀態即時顯示（NOT_SENT、PENDING、COMPLETED、TERMINATED）
- [X] T038 [US4] 實作發送時間和到期時間顯示（使用 formatDateTime 工具）
- [X] T039 [US4] 實作簽名時間顯示（當狀態為 COMPLETED 時）
- [X] T040 [US4] 實作狀態變更時的按鈕顯示/隱藏邏輯（COMPLETED 時隱藏「重新發送」按鈕）

**Checkpoint**: 所有用戶故事現在應該都能獨立運作

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: 影響多個用戶故事的改進

- [X] T041 [P] 新增 JSDoc 註解到所有函式（如尚未完成）
- [X] T042 [P] 確認 TypeScript 編譯無錯誤
- [X] T043 [P] 執行 ESLint 檢查並修正所有錯誤
- [X] T044 驗證所有 Edge Cases 處理
- [X] T045 驗證訂單來源判斷邏輯（僅線上訂單顯示功能）
- [X] T046 驗證後端自動處理文件類型的邏輯
- [X] T047 驗證 UTC 時間轉換為本地時間顯示
- [X] T048 [P] 測試各種錯誤情況的錯誤訊息顯示（包含後端頻率限制錯誤）
- [X] T049 測試 UI 在不同簽章狀態下的顯示
- [X] T050 測試複製連結功能在主流瀏覽器的相容性
- [ ] T051 執行 quickstart.md 驗證（如有提供）

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: 無依賴 - 可立即開始
- **Foundational (Phase 2)**: 依賴 Setup 完成 - 阻塞所有用戶故事
- **User Stories (Phase 3-6)**: 所有依賴 Foundational 完成
  - 用戶故事可以並行進行（如有足夠人力）
  - 或按優先級順序進行（P1 → P2）
- **Polish (Phase 7)**: 依賴所有需要的用戶故事完成

### User Story Dependencies

- **User Story 1 (P1)**: 可在 Foundational 完成後開始 - 無其他故事依賴
- **User Story 4 (P1)**: 可在 Foundational 完成後開始 - 無其他故事依賴（與 US1 可並行）
- **User Story 2 (P2)**: 可在 Foundational 完成後開始 - 依賴 US1 的 useOnlineSignature.ts 但可並行開發
- **User Story 3 (P2)**: 可在 Foundational 完成後開始 - 依賴 US1 的 useOnlineSignature.ts 但可並行開發

### Within Each User Story

- 組合式函式在元件之前
- 元件基本結構在功能實作之前
- 核心實作在整合之前
- 故事完成後再移到下一個優先級

### Parallel Opportunities

- Phase 1: T001 和 T002 可並行
- Phase 2: T003-T006 (型別定義) 可並行；T008 和 T009 (API 函式) 可並行
- Phase 3: T010 可與其他任務並行開始
- Phase 4-6: 不同用戶故事可由不同團隊成員並行開發
- Phase 7: T040、T041、T042、T047 可並行執行

---

## Parallel Example: Foundational Phase

```bash
# 並行啟動所有型別定義任務:
Task T003: "新增 OnlineSignatureStatus 列舉"
Task T004: "擴展 SignatureRecord 介面"
Task T005: "新增 SendOnlineSignatureRequest 介面"
Task T006: "新增 SendOnlineSignatureResponse 介面"

# 然後並行啟動 API 函式:
Task T008: "實作 sendOnlineSignature API 函式"
Task T009: "實作 resendOnlineSignature API 函式"
```

---

## Implementation Strategy

### MVP First (User Stories 1 & 4 Only)

1. 完成 Phase 1: Setup
2. 完成 Phase 2: Foundational (重要 - 阻塞所有故事)
3. 完成 Phase 3: User Story 1
4. 完成 Phase 6: User Story 4
5. **停止並驗證**: 獨立測試 User Stories 1 和 4
6. 如準備就緒則部署/展示

### Incremental Delivery

1. 完成 Setup + Foundational → 基礎就緒
2. 新增 User Story 1 → 獨立測試 → 部署/展示 (MVP!)
3. 新增 User Story 4 → 獨立測試 → 部署/展示
4. 新增 User Story 2 → 獨立測試 → 部署/展示
5. 新增 User Story 3 → 獨立測試 → 部署/展示
6. 每個故事都能在不破壞先前故事的情況下增加價值

### Parallel Team Strategy

多位開發者時:

1. 團隊一起完成 Setup + Foundational
2. Foundational 完成後:
   - 開發者 A: User Story 1
   - 開發者 B: User Story 4
   - 開發者 C: User Story 2
   - 開發者 D: User Story 3
3. 故事獨立完成並整合

---

## Summary

- **Total Tasks**: 51 (+1 for DocumentType enum)
- **Setup Phase**: 2 tasks
- **Foundational Phase**: 8 tasks (+1)
- **User Story 1 (P1)**: 13 tasks
- **User Story 2 (P2)**: 6 tasks
- **User Story 3 (P2)**: 6 tasks
- **User Story 4 (P1)**: 5 tasks
- **Polish Phase**: 11 tasks
- **Parallel Opportunities**: 多個階段有並行機會
- **MVP Scope**: User Stories 1 & 4 (18 tasks after foundational)
- **Estimated Time**: 9 小時（根據 plan.md）

---

## Notes

- [P] 任務 = 不同檔案，無依賴關係
- [Story] 標籤將任務映射到特定用戶故事以便追蹤
- 每個用戶故事應該可獨立完成和測試
- 在每個檢查點停止以獨立驗證故事
- 避免: 模糊任務、相同檔案衝突、破壞獨立性的跨故事依賴
- 所有 API 呼叫都要有完整的錯誤處理
- 使用現有的 formatDateTime 工具函式處理時間格式化
- 遵循專案的 Vue 3 + TypeScript 開發規範
- **重要**: 文件類型 (DocumentType) 由後端根據 serviceOrderId 自動判斷，前端無需傳遞
- **重要**: 頻率限制（一小時內僅能操作一次）由後端強制執行，前端僅需顯示後端回傳的錯誤訊息

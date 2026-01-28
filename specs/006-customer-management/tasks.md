# Tasks: 客戶管理模組

**Branch**: `006-customer-management` | **Date**: 2026-01-28  
**Input**: Design documents from `/specs/006-customer-management/`  
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/customer-api.md

**Tests**: 未要求測試任務 - 本任務清單專注於功能實作

**Organization**: 任務按 user story 組織，每個 story 可獨立實作與測試

---

## Format: `- [ ] [ID] [P?] [Story] Description`

- **[P]**: 可並行執行（不同檔案，無依賴）
- **[Story]**: 所屬 user story（US1, US2, US3, US4, US5）
- 描述包含明確檔案路徑

---

## Phase 1: Setup(專案初始化)

**Purpose**: 建立基礎專案結構與目錄

- [x] T001 建立客戶管理模組目錄結構 src/pages/customer-management/
- [x] T002 [P] 建立子目錄 src/pages/customer-management/apis/
- [x] T003 [P] 建立子目錄 src/pages/customer-management/components/
- [x] T004 [P] 建立子目錄 src/pages/customer-management/composables/
- [x] T004a [P] 建立子目錄 src/pages/customer-management/workers/
- [x] T005 [P] 建立測試目錄 tests/pages/customer-management/

---

## Phase 2: Foundational(核心基礎設施)

**Purpose**: 所有 user story 都依賴的共用基礎設施

**⚠️ CRITICAL**: 此階段必須完成後才能開始任何 user story 實作

### 路由與權限

- [x] T006 在 src/router/ 中新增客戶管理路由,路徑 /customer-management,元件指向 src/pages/customer-management/index.vue
- [x] T007 在 src/common/constants/permissions.ts 新增 CUSTOMER_PERMISSIONS 常數物件,包含 READ, CREATE, UPDATE, DELETE 權限字串

### 型別定義

- [x] T008 [P] 建立 src/pages/customer-management/types.ts,定義 Customer interface(10 個欄位:id, name, phoneNumber, email, idNumber, residentialAddress, lineId, createdAt, updatedAt, version)
- [x] T009 [P] 在 types.ts 新增 CreateCustomerRequest interface(6 個欄位:name, phoneNumber, email?, idNumber, residentialAddress, lineId?)
- [x] T010 [P] 在 types.ts 新增 UpdateCustomerRequest interface(6 個欄位 + version)
- [x] T011 [P] 在 types.ts 新增 CustomerListParams interface(3 個欄位:pageNumber, pageSize, keyword?)
- [x] T012 [P] 在 types.ts 新增 IdCardRecognitionResponse interface(3 個欄位:name, idNumber, address,皆為 string | null)

---

## Phase 2: Foundational（核心基礎設施）

**Purpose**: 所有 user story 都依賴的共用基礎設施

**⚠️ CRITICAL**: 此階段必須完成後才能開始任何 user story 實作

### 路由與權限

- [ ] T006 在 src/router/ 中新增客戶管理路由，路徑 /customer-management，元件指向 src/pages/customer-management/index.vue
- [ ] T007 在 src/common/constants/permissions.ts 新增 CUSTOMER_PERMISSIONS 常數物件，包含 READ, CREATE, UPDATE, DELETE 權限字串

### 型別定義

- [ ] T008 [P] 建立 src/pages/customer-management/types.ts，定義 Customer interface（10 個欄位：id, name, phoneNumber, email, idNumber, residentialAddress, lineId, createdAt, updatedAt, version）
- [ ] T009 [P] 在 types.ts 新增 CreateCustomerRequest interface（6 個欄位：name, phoneNumber, email?, idNumber, residentialAddress, lineId?）
- [ ] T010 [P] 在 types.ts 新增 UpdateCustomerRequest interface（6 個欄位 + version）
- [ ] T011 [P] 在 types.ts 新增 CustomerListParams interface（3 個欄位：pageNumber, pageSize, keyword?）
- [ ] T012 [P] 在 types.ts 新增 IdCardRecognitionResponse interface（3 個欄位：name, idNumber, address，皆為 string | null）
- [ ] T013 [P] 在 types.ts 匯出 FormRules 型別與表單驗證規則物件 createCustomerRules

- [ ] T014 建立或更新 src/common/utils/id-number-validator.ts，實作 validateTaiwanIdNumber 函式（執行台灣身分證檢查碼演算法）
- [ ] T015 [P] 在 id-number-validator.ts 新增單元測試 tests/utils/id-number-validator.test.ts（驗證正確/錯誤身分證字號）

### API 服務層

- [ ] T016 建立 src/pages/customer-management/apis/customer.ts，匯出 customerApi 物件
- [ ] T017 在 customer.ts 實作 search 方法（GET /api/customers/search，接收 CustomerListParams，回傳 ApiResponseModel\<Customer[]\>）
- [ ] T018 [P] 在 customer.ts 實作 create 方法（POST /api/customers，接收 CreateCustomerRequest，回傳 ApiResponseModel\<Customer\>）
- [ ] T019 [P] 在 customer.ts 實作 getById 方法（GET /api/customers/{id}，接收 id: string，回傳 ApiResponseModel\<Customer\>）
- [ ] T020 [P] 在 customer.ts 實作 update 方法（PUT /api/customers/{id}，接收 id: string 和 UpdateCustomerRequest，回傳 ApiResponseModel\<Customer\>）
- [X] T021 [P] 在 customer.ts 實作 delete 方法（DELETE /api/customers/{id}，接收 id: string，回傳 ApiResponse<null>）
- [X] T022 [P] 在 customer.ts 實作 recognizeIdCard 方法（POST /api/ocr/id-card-multi，接收 files: File[]，使用 FormData，設定 30 秒逾時，回傳 ApiResponse<IdCardRecognitionResponse>）

**Checkpoint**: 基礎設施就緒 - user story 實作可以開始

---

## Phase 3: User Story 1 - 查看與搜尋客戶資料 (Priority: P1) 🎯 MVP

**Goal**: 管理員可查看客戶列表、使用關鍵字搜尋、匯出 Excel

**Independent Test**: 
1. 使用具有 customer.read 權限的帳號登入
2. 點擊主選單「客戶管理」
3. 驗證列表顯示客戶資料（姓名、電話、身分證遮罩、LINE ID、Email）
4. 在搜尋欄輸入關鍵字，驗證即時過濾
5. 點擊匯出按鈕，驗證 Excel 檔案下載

### 實作 User Story 1

- [ ] T023 [P] [US1] 建立 src/pages/customer-management/components/CustomerTable.vue，接收 customers prop（Customer[]）和 @row-click 事件，使用 ElTable 顯示列表欄位
- [ ] T024 [US1] 在 CustomerTable.vue 實作身分證遮罩邏輯（顯示前4碼+\*\*\*\*\*\*）
- [ ] T025 [US1] 在 CustomerTable.vue 加入操作欄，根據權限顯示編輯/刪除按鈕（使用 v-permission 指令）
- [ ] T026 [P] [US1] 建立 src/pages/customer-management/composables/useCustomerManagement.ts，管理分頁狀態（pageNumber, pageSize, total）與搜尋關鍵字（searchKeyword）
- [ ] T027 [US1] 在 useCustomerManagement.ts 實作 fetchCustomers 函式（呼叫 customerApi.search，處理 loading 與錯誤）  
- [ ] T028 [US1] 在 useCustomerManagement.ts 實作搜尋防抖（debounce 500ms，使用 lodash-es debounce）
- [ ] T029 [US1] 在 useCustomerManagement.ts 實作分頁變更處理函式（handlePageChange, handleSizeChange）
- [ ] T030 [P] [US1] 建立 src/pages/customer-management/composables/useExportExcel.ts，實作 exportCustomers 函式
- [ ] T031 [US1] 在 useExportExcel.ts 實作大量資料警告邏輯（超過 5000 筆顯示 ElMessageBox.confirm，提供立即匯出/背景處理/取消選項）
- [ ] T031a [US1] 在 src/pages/customer-management/workers/ 建立 excel-export.worker.ts，實作 Worker 邏輯（接收 customers 資料、使用 xlsx 套件生成 Excel、回傳 ArrayBuffer 使用 Transferable Objects、支援進度回報、錯誤處理）
- [ ] T031b [US1] 在 useExportExcel.ts 實作背景處理邏輯（使用原生 Worker API 建立 worker、postMessage 傳遞資料、監聽 onmessage 處理 progress/complete/error 事件、完成後透過專案 Notify 元件推送通知、自動觸發下載、terminate worker）
- [ ] T031c [US1] 建立或更新 src/common/components/Notify/store.ts （若不存在），使用 Pinia 建立 useNotifyStore，提供 addNotification 方法以便 useExportExcel 呼叫（或使用現有機制如 provide/inject）
- [ ] T032 [US1] 在 useExportExcel.ts 使用 xlsx 套件生成 Excel 檔案（columns: 姓名、電話、Email、身分證字號、地址、LINE ID、建立時間）
- [ ] T033 [US1] 建立 src/pages/customer-management/index.vue 主頁面，整合 CustomerTable 與 useCustomerManagement
- [ ] T034 [US1] 在 index.vue 實作搜尋欄位（ElInput with prefix-icon，綁定 searchKeyword，@input 觸發搜尋）
- [ ] T035 [US1] 在 index.vue 加入分頁元件（ElPagination，綁定 pageNumber, pageSize, total）
- [ ] T036 [US1] 在 index.vue 加入匯出按鈕（v-permission="CUSTOMER_PERMISSIONS.READ"，@click 呼叫 exportCustomers）
- [ ] T037 [US1] 在 index.vue 實作 onMounted 生命週期，載入初始客戶列表

**Checkpoint**: User Story 1 完成 - 可獨立驗證列表、搜尋、匯出功能

---

## Phase 4: User Story 2 - 新增客戶資料 (Priority: P1)

**Goal**: 管理員可開啟表單新增客戶，提交後儲存至資料庫

**Independent Test**:
1. 在客戶列表點擊「新增客戶」按鈕
2. 填寫必填欄位（姓名、身分證字號、電話）與選填欄位
3. 測試表單驗證（錯誤格式、空白必填欄位）
4. 提交表單，驗證成功訊息與列表更新
5. 測試重複身分證字號警告邏輯

### 實作 User Story 2

- [ ] T038 [P] [US2] 建立 src/pages/customer-management/components/CustomerForm.vue，包含新增/編輯模式切換邏輯
- [ ] T039 [US2] 在 CustomerForm.vue 定義表單欄位（ElForm with ElFormItem: name, phoneNumber, email, idNumber, residentialAddress, lineId）
- [ ] T040 [US2] 在 CustomerForm.vue 綁定表單驗證規則（使用 createCustomerRules from types.ts）
- [ ] T041 [US2] 在 CustomerForm.vue 實作表單提交邏輯（區分新增/編輯模式，emit success 事件）
- [ ] T042 [US2] 在 CustomerForm.vue 加入取消按鈕（emit cancel 事件，重置表單）
- [ ] T043 [P] [US2] 建立 src/pages/customer-management/composables/useCustomerForm.ts，管理表單狀態（formData, formMode: 'create' | 'edit'）
- [ ] T044 [US2] 在 useCustomerForm.ts 實作 submitForm 函式（呼叫 customerApi.create 或 update，處理 loading 與錯誤）
- [ ] T045 [US2] 在 useCustomerForm.ts 實作重複身分證字號處理（捕捉 422 錯誤，顯示 ElMessageBox.confirm「此身分證字號已存在，是否繼續新增？」）
- [ ] T046 [US2] 在 useCustomerForm.ts 實作表單重置函式（resetForm）
- [ ] T047 [US2] 在 index.vue 加入「新增客戶」按鈕（v-permission="CUSTOMER_PERMISSIONS.CREATE"，@click 開啟 CustomerForm 對話框）
- [ ] T048 [US2] 在 index.vue 整合 CustomerForm 元件（使用 ElDialog，綁定 visible, mode, @success 重新載入列表）
- [ ] T049 [US2] 在 index.vue 實作新增成功後的處理（關閉對話框、顯示成功訊息、重新載入列表）

**Checkpoint**: User Story 2 完成 - 可獨立驗證新增客戶流程（含表單驗證、重複檢查）

---

## Phase 5: User Story 3 - 使用 AI 辨識身分證 (Priority: P2)

**Goal**: 管理員在新增客戶時，可上傳身分證照片，系統自動辨識並填入表單

**Independent Test**:
1. 在新增客戶表單中找到上傳身分證區塊
2. 上傳正反面照片（JPG/PNG，≤5MB）
3. 點擊辨識按鈕，驗證 loading 狀態
4. 驗證辨識結果自動填入表單（姓名、身分證字號、地址）
5. 測試部分辨識（某些欄位為 null）
6. 測試辨識失敗與逾時情境

### 實作 User Story 3

- [ ] T050 [P] [US3] 建立 src/pages/customer-management/components/IdCardUpload.vue，包含正反面圖片上傳（ElUpload，限制 JPG/PNG，單檔 ≤5MB）
- [ ] T051 [US3] 在 IdCardUpload.vue 實作檔案驗證邏輯（before-upload hook，檢查格式、大小，超過限制顯示 ElMessage.error）
- [ ] T052 [US3] 在 IdCardUpload.vue 加入辨識按鈕（disabled when < 2 張圖片，@click emit recognize 事件）
- [ ] T053 [US3] 在 IdCardUpload.vue 顯示上傳進度與預覽（ElImage preview）
- [ ] T054 [P] [US3] 建立 src/pages/customer-management/composables/useIdCardOcr.ts，管理 loading 狀態與辨識結果
- [ ] T055 [US3] 在 useIdCardOcr.ts 實作 recognizeIdCard 函式（呼叫 customerApi.recognizeIdCard，30 秒逾時處理）
- [ ] T056 [US3] 在 useIdCardOcr.ts 實作辨識結果處理（區分全部成功/部分成功/失敗，emit fill-form 事件）
- [ ] T057 [US3] 在 useIdCardOcr.ts 實作逾時處理（捕捉 504 錯誤或 timeout，顯示 ElMessage.warning「辨識逾時，請重試或手動輸入」）
- [ ] T058 [US3] 在 useIdCardOcr.ts 實作錯誤處理（捕捉 500/400 錯誤，顯示友善錯誤訊息）
- [ ] T059 [US3] 在 CustomerForm.vue 整合 IdCardUpload 元件（僅新增模式顯示，position 在表單上方）
- [ ] T060 [US3] 在 CustomerForm.vue 實作 AI 辨識結果填入邏輯（@fill-form 事件，自動填入 name, idNumber, residentialAddress）
- [ ] T061 [US3] 在 CustomerForm.vue 實作部分辨識提示（未辨識欄位旁顯示「AI 無法辨識此欄位，請手動輸入」）

**Checkpoint**: User Story 3 完成 - 可獨立驗證 AI 辨識流程（含成功/部分成功/失敗/逾時）

---

## Phase 6: User Story 4 - 更新客戶資料 (Priority: P2)

**Goal**: 管理員可編輯現有客戶資料，系統採用樂觀鎖定防止並發衝突

**Independent Test**:
1. 在客戶列表點擊某客戶的「編輯」按鈕
2. 驗證表單載入該客戶資料（idNumber 欄位應為 disabled）
3. 修改欄位（如電話、地址）並提交
4. 驗證成功訊息與列表更新
5. 測試樂觀鎖定：開啟兩個編輯視窗，模擬並發衝突（後提交者應看到版本衝突提示）

### 實作 User Story 4

- [ ] T062 [US4] 在 useCustomerForm.ts 實作 setupEdit 函式（接收 customer: Customer，設定 formMode='edit'，載入 formData 包含 version）
- [ ] T063 [US4] 在 useCustomerForm.ts 更新 submitForm 函式，區分 create/edit 模式呼叫不同 API
- [ ] T064 [US4] 在 useCustomerForm.ts 實作樂觀鎖定衝突處理（捕捉 409 錯誤，顯示 ElMessageBox.alert「此客戶資料已被其他使用者修改，請重新載入最新資料後再試」，confirmButtonText='重新載入'）
- [ ] T065 [US4] 在 useCustomerForm.ts 實作重新載入邏輯（409 衝突時呼叫 customerApi.getById 取得最新資料，更新 formData 與 version）
- [ ] T066 [US4] 在 CustomerForm.vue 加入編輯模式邏輯（idNumber 欄位設為 disabled，隱藏 IdCardUpload 元件）
- [ ] T067 [US4] 在 CustomerForm.vue 實作表單標題切換（新增模式：「新增客戶」，編輯模式：「編輯客戶 - {name}」）
- [ ] T068 [US4] 在 index.vue 實作編輯按鈕點擊處理（@row-click 或 action column，呼叫 setupEdit，開啟對話框）
- [ ] T069 [US4] 在 index.vue 綁定編輯按鈕權限（v-permission="CUSTOMER_PERMISSIONS.UPDATE"）

**Checkpoint**: User Story 4 完成 - 可獨立驗證編輯流程（含樂觀鎖定衝突處理）

---

## Phase 7: User Story 5 - 刪除客戶資料 (Priority: P3)

**Goal**: 管理員可刪除客戶資料（軟刪除），刪除前需確認

**Independent Test**:
1. 在客戶列表點擊某客戶的「刪除」按鈕
2. 驗證確認對話框顯示（說明刪除後果）
3. 點擊確認刪除，驗證成功訊息與列表更新（該客戶不再顯示）
4. 點擊取消刪除，驗證對話框關閉且無操作

### 實作 User Story 5

- [ ] T070 [P] [US5] 在 useCustomerManagement.ts 實作 deleteCustomer 函式（呼叫 customerApi.delete，處理 loading 與錯誤）
- [ ] T071 [US5] 在 useCustomerManagement.ts 實作刪除確認邏輯（使用 ElMessageBox.confirm，標題「確認刪除」，message「刪除後資料將無法恢復，此操作執行軟刪除。是否繼續？」，type='warning'）
- [ ] T072 [US5] 在 useCustomerManagement.ts 實作刪除成功處理（顯示 ElMessage.success「刪除成功」，重新載入列表）
- [ ] T073 [US5] 在 CustomerTable.vue 加入刪除按鈕（action column，v-permission="CUSTOMER_PERMISSIONS.DELETE"，@click emit delete-customer 事件）
- [ ] T074 [US5] 在 index.vue 綁定刪除事件處理（@delete-customer 呼叫 deleteCustomer）

**Checkpoint**: User Story 5 完成 - 可獨立驗證刪除流程（含確認對話框）

---

## Phase 8: Polish & Cross-Cutting Concerns（跨功能優化）

**Purpose**: 影響多個 user story 的改進與最終檢查

- [ ] T075 [P] 在各元件加入 JSDoc 註解（CustomerForm.vue, CustomerTable.vue, IdCardUpload.vue 的 props, emits, 主要函式）
- [ ] T076 [P] 在各 composables 加入 JSDoc 註解（useCustomerManagement.ts, useCustomerForm.ts, useIdCardOcr.ts, useExportExcel.ts 的函式與回傳值）
- [ ] T077 檢查所有錯誤處理是否包含 traceId 顯示（ElMessage.error 訊息應包含 traceId 以便除錯）
- [ ] T078 [P] 驗證所有 v-permission 指令正確使用 CUSTOMER_PERMISSIONS 常數
- [ ] T079 驗證所有 API 呼叫包含 try-catch 錯誤處理
- [ ] T080 [P] 執行 ESLint 檢查並修正 src/pages/customer-management/ 下所有檔案
- [ ] T081 [P] 執行 TypeScript 型別檢查（pnpm type-check）並修正所有錯誤
- [ ] T082 驗證 quickstart.md 中的開發流程：① 啟動 dev server 無錯誤 ② 導航至客戶管理頁面載入 < 3秒 ③ 搜尋功能回應 < 1秒 ④ 新增客戶表單驗證正確 ⑤ AI 辨識成功/失敗情境正常 ⑥ 樂觀鎖定衝突提示正確 ⑦ 軟刪除後列表不顯示該客戶
- [ ] T083 [P] 效能檢查：驗證搜尋防抖生效、分頁正常、Excel 匯出 < 15 秒（5000 筆）
- [ ] T084 [P] UX 檢查：確認所有成功/失敗操作都有明確訊息回饋、loading 狀態正確顯示
- [ ] T085 最終整合測試：完整執行所有 user story 流程（依序測試查看、新增、AI 辨識、編輯、刪除）

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: 無依賴 - 可立即開始
- **Foundational (Phase 2)**: 依賴 Setup 完成 - **阻塞所有 user stories**
- **User Stories (Phase 3-7)**: 全部依賴 Foundational 完成
  - 若有多位開發者，可並行實作不同的 user story
  - 若單人開發，建議依優先順序：US1 → US2 → US3 → US4 → US5
- **Polish (Phase 8)**: 依賴所有期望的 user story 完成

### User Story Dependencies

- **User Story 1 (P1)**: Foundational 完成後即可開始 - 無其他 story 依賴
- **User Story 2 (P1)**: Foundational 完成後即可開始 - 無其他 story 依賴  
- **User Story 3 (P2)**: 依賴 User Story 2（AI 辨識整合在新增表單中）
- **User Story 4 (P2)**: 依賴 User Story 1（編輯按鈕在列表中）
- **User Story 5 (P3)**: 依賴 User Story 1（刪除按鈕在列表中）

### Within Each User Story

- 型別定義 → API 服務層 → Composables → 元件 → 主頁面整合
- 元件標記 [P] 可並行開發（不同檔案）
- Composables 標記 [P] 可並行開發（不同檔案）
- 主頁面整合需等待相關元件與 composables 完成

### Parallel Opportunities

- **Setup**: T002-T005 可並行（不同目錄）
- **Foundational - 型別**: T008-T013 可並行（同檔案不同 interface）
- **Foundational - API**: T018-T022 可並行（同檔案不同方法）
- **US1 元件與 Composables**: T023, T026, T030 可並行（不同檔案）
- **US2 元件與 Composables**: T038, T043 可並行（不同檔案）
- **US3 元件與 Composables**: T050, T054 可並行（不同檔案）
- **Polish**: T075, T076, T078, T080, T081, T083, T084 可並行（不同檔案或獨立檢查）

---

## Parallel Example: User Story 1 Implementation

```bash
# 並行啟動元件與 composables 開發（不同開發者或分支）:
Task T023 [P]: CustomerTable.vue
Task T026 [P]: useCustomerManagement.ts  
Task T030 [P]: useExportExcel.ts

# 等待上述完成後，繼續並行開發:
Task T024-T025: CustomerTable.vue 內部邏輯
Task T027-T029: useCustomerManagement.ts 內部函式
Task T031-T032: useExportExcel.ts 內部函式

# 最後整合:
Task T033-T037: index.vue 整合所有元件與 composables
```

---

## Implementation Strategy

### MVP First (User Story 1 + User Story 2 Only)

1. ✅ 完成 Phase 1: Setup
2. ✅ 完成 Phase 2: Foundational（CRITICAL - 阻塞所有 stories）
3. ✅ 完成 Phase 3: User Story 1（查看與搜尋）
4. ✅ 完成 Phase 4: User Story 2（新增客戶）
5. **STOP and VALIDATE**: 獨立測試 US1 + US2（列表、搜尋、新增）
6. 部署/展示 MVP！

### Incremental Delivery

1. **Foundation Ready**: Setup + Foundational → 路由與 API 就緒
2. **MVP (US1+US2)**: 查看 + 新增 → 獨立測試 → 部署/展示
3. **Enhanced (US3)**: AI 辨識 → 獨立測試 → 部署/展示
4. **Complete CRUD (US4+US5)**: 編輯 + 刪除 → 獨立測試 → 部署/展示
5. **Production Ready**: Polish → 最終檢查 → 正式上線

### Parallel Team Strategy

若有 3 位開發者:

1. **一起完成**: Setup + Foundational
2. **分工並行**（Foundational 完成後）:
   - Developer A: User Story 1（查看與搜尋）
   - Developer B: User Story 2（新增客戶）
   - Developer C: Foundational 加強（測試與文件）
3. **第二輪分工**:
   - Developer A: User Story 3（AI 辨識，整合 US2）
   - Developer B: User Story 4（更新客戶，整合 US1）
   - Developer C: User Story 5（刪除客戶，整合 US1）
4. **最終整合**: 三人一起執行 Polish 與最終測試

---

## Notes

- **[P] 標記**: 不同檔案、無依賴，可並行執行
- **[Story] 標記**: 將任務對應至 user story，便於追蹤與獨立測試
- **檔案路徑**: 每個任務描述包含明確路徑，避免混淆
- **Checkpoint**: 每個 user story 結束時應可獨立測試該功能
- **測試策略**: spec.md 未要求測試任務，專注於功能實作；可後續加入 Vitest 測試
- **權限控制**: 所有操作按鈕使用 v-permission 指令，確保無權限管理員無法看到對應功能
- **錯誤處理**: 統一使用 Element Plus 元件（ElMessage, ElMessageBox）顯示訊息
- **效能目標**: 搜尋 < 1 秒、路由轉換 < 500ms、Excel 匯出 5000 筆 < 15 秒
- **並發處理**: 更新操作必須包含樂觀鎖定（version 欄位）與 409 錯誤處理

---

**Total Tasks**: 89 (+4 from original: T004a workers 目錄, T031a Worker 實作, T031b Worker 整合, T031c Notify store)  
**Estimated MVP Tasks (US1+US2)**: 52 (Setup + Foundational + US1 + US2, 含背景處理完整實作)  
**Constitution Violations**: 0

**New in this update**:
- ✅ 使用原生 Worker API（無需第三方套件）
- ✅ 整合專案現有 Notify 元件（保持 UI 一致性）
- ✅ Transferable Objects 優化大數據傳輸
- ✅ 完整進度回報與錯誤處理

---

**Generated**: 2026-01-28 by `/speckit.tasks` command  
**Updated**: 2026-01-28 by `/speckit.plan` - 補充原生 Worker + Notify 元件整合  
**Ready for Implementation**: ✅ All tasks follow strict checklist format with IDs, labels, and file paths

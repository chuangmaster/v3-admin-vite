# Tasks: 服務單管理

**Input**: Design documents from `/specs/004-service-order-management/`  
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/api-contracts.md, quickstart.md  
**Branch**: `004-service-order-management`  
**Date**: 2025-12-15

**Tests**: 測試任務僅在規格明確要求時生成。本功能包含測試需求（參考 quickstart.md 測試指南）。

**Organization**: 任務按使用者故事組織，使每個故事能夠獨立實作與測試。

---

## Format: `- [ ] [ID] [P?] [Story?] Description`

- **Checkbox**: 所有任務必須以 `- [ ]` 開頭
- **[ID]**: 任務序號 (T001, T002, T003...)，按執行順序排列
- **[P]**: 可並行執行（不同檔案、無依賴關係）
- **[Story]**: 使用者故事標籤 (US1, US2, US3, US4)，僅用於使用者故事階段任務
- **Description**: 清楚的動作描述，包含確切的檔案路徑

**範例**:
- ✅ `- [ ] T001 Create project structure per implementation plan`
- ✅ `- [ ] T012 [P] [US1] Create User model in src/models/user.py`
- ✅ `- [ ] T014 [US1] Implement UserService in src/services/user_service.py`

---

## Phase 1: Setup (專案初始化)

**Purpose**: 建立專案基礎結構與設定

- [X] T001 建立服務單管理模組目錄結構 `src/pages/service-order-management/` 及子目錄 (apis/, components/, composables/, images/)
- [X] T002 [P] 安裝必要套件 signature_pad 與 xlsx (`pnpm add signature_pad xlsx`)
- [X] T003 [P] 定義型別檔案 `src/pages/service-order-management/types.ts` (ServiceOrder, ProductItem, Customer, Attachment, SignatureRecord, CreateServiceOrderRequest 等)
- [X] T004 [P] 新增服務單權限常數至 `src/common/constants/permissions.ts` (SERVICE_ORDER_PERMISSIONS: CONSIGNMENT_*, BUYBACK_*, ATTACHMENT_VIEW_SENSITIVE)
- [X] T005 建立測試目錄結構 `tests/pages/service-order-management/` 及子目錄 (composables/, components/)

---

## Phase 2: Foundational (基礎建設 - 阻塞前置條件)

**Purpose**: 核心基礎設施，所有使用者故事開始前必須完成

**⚠️ CRITICAL**: 此階段完成前，任何使用者故事工作都不能開始

- [X] T006 建立服務單 API 服務層 `src/pages/service-order-management/apis/service-order.ts` (包含所有 API 函式: getServiceOrderList, getServiceOrder, createServiceOrder, updateServiceOrder, deleteServiceOrder, updateServiceOrderStatus, getModificationHistory)
- [X] T007 [P] 建立客戶 API 服務層 `src/pages/service-order-management/apis/customer.ts` (searchCustomers, createCustomer, getCustomer)
- [X] T008 [P] 建立附件 API 服務層 `src/pages/service-order-management/apis/attachment.ts` (uploadAttachment, getAttachmentList, downloadAttachment)
- [X] T009 [P] 建立簽名 API 服務層 `src/pages/service-order-management/apis/signature.ts` (saveOfflineSignature, sendOnlineSignature, resendSignature, getSignatureRecords)
- [X] T010 [P] 建立 OCR API 服務層 `src/pages/service-order-management/apis/ocr.ts` (recognizeIDCard)
- [X] T011 新增路由設定至 `src/router/index.ts` (服務單列表路由 /service-order-management, 服務單建立路由 /service-order-management/create, 服務單詳細路由 /service-order-management/:id)
- [X] T012 建立 Pinia store `src/pinia/stores/service-order.ts` (管理服務單狀態、分頁狀態、查詢條件)

**Checkpoint**: 基礎設施就緒 - 使用者故事實作現在可以並行開始

---

## Phase 3: User Story 1 - 建立收購單 (Priority: P1) 🎯 MVP

**Goal**: 店員能快速建立收購單，包含客戶資訊、商品詳情、身分證明上傳與 AI 辨識、線上/線下簽名功能

**Independent Test**: 建立一筆完整的收購單（包含客戶選擇、1-4 件商品資訊填寫、身分證明上傳與 AI 辨識、線下觸控簽名），驗證資料儲存、合約產生與簽名記錄

### 測試 - User Story 1 (TDD: 先寫測試，確保失敗)

- [ ] T013 [P] [US1] 建立 useServiceOrderForm 組合式函式測試 `tests/pages/service-order-management/composables/useServiceOrderForm.test.ts` (測試表單驗證、提交、重置邏輯)
- [ ] T014 [P] [US1] 建立 useCustomerSearch 組合式函式測試 `tests/pages/service-order-management/composables/useCustomerSearch.test.ts` (測試搜尋關鍵字、debounce、結果列表)
- [ ] T015 [P] [US1] 建立 useIdCardRecognition 組合式函式測試 `tests/pages/service-order-management/composables/useIdCardRecognition.test.ts` (測試 OCR 呼叫、重試機制、客戶資料比對)
- [ ] T016 [P] [US1] 建立 useSignature 組合式函式測試 `tests/pages/service-order-management/composables/useSignature.test.ts` (測試簽名板初始化、清除、Base64 匯出)

### 元件實作 - User Story 1

- [X] T017 [P] [US1] 建立客戶搜尋元件 `src/pages/service-order-management/components/CustomerSearch.vue` (搜尋輸入框、結果列表、選擇客戶、新增客戶按鈕)
- [X] T018 [P] [US1] 建立客戶表單元件 `src/pages/service-order-management/components/CustomerForm.vue` (姓名、電話、Email、身分證字號輸入欄位與驗證，支援台灣與外籍人士格式)
- [X] T019 [P] [US1] 建立身分證上傳元件 `src/pages/service-order-management/components/IdCardUploader.vue` (檔案上傳、拍照功能、預覽、AI 辨識按鈕 ⭐、呼叫後端 OCR API、錯誤處理、重試機制最多 3 次)
- [X] T020 [P] [US1] 建立商品項目表單元件 `src/pages/service-order-management/components/ProductItemForm.vue` (品牌名稱、款式、內碼輸入，支援 1-4 件商品，動態新增/刪除項目)
- [X] T021 [P] [US1] 建立觸控簽名板元件 `src/pages/service-order-management/components/SignaturePad.vue` (使用 signature_pad，支援滑鼠/觸控筆/手指簽名，清除、確認按鈕，匯出 Base64 PNG)

### 組合式函式實作 - User Story 1

- [X] T022 [US1] 實作 useCustomerSearch 組合式函式 `src/pages/service-order-management/composables/useCustomerSearch.ts` (搜尋關鍵字 ref、debounce 500ms、呼叫 searchCustomers API、loading 狀態、結果列表)
- [X] T023 [US1] 實作 useIdCardRecognition 組合式函式 `src/pages/service-order-management/composables/useIdCardRecognition.ts` (檔案上傳、呼叫 recognizeIDCard API、辨識結果處理、重試計數器、錯誤提示、自動客戶搜尋、資料比對邏輯)
- [X] T024 [US1] 實作 useSignature 組合式函式 `src/pages/service-order-management/composables/useSignature.ts` (初始化 SignaturePad、清除簽名、取得 Base64 資料、驗證簽名非空)
- [X] T025 [US1] 實作 useServiceOrderForm 組合式函式 `src/pages/service-order-management/composables/useServiceOrderForm.ts` (表單資料 ref、驗證規則、提交邏輯、草稿自動儲存、重置表單、身分證明文件驗證)

### 主要元件與頁面實作 - User Story 1

- [ ] T026 [US1] 建立服務單表單元件 `src/pages/service-order-management/components/ServiceOrderForm.vue` (整合 CustomerSearch、CustomerForm、ProductItemForm、IdCardUploader、SignaturePad，收購單表單邏輯，驗證必填欄位，支援新增/編輯模式)
- [X] T027 [US1] 建立服務單建立頁面 `src/pages/service-order-management/create.vue` (路由參數接收服務單類型 buyback，顯示 ServiceOrderForm，處理提交成功/失敗，導航邏輯)
- [ ] T028 [US1] 實作收購單線下簽名流程 (提交表單後產生收購合約與一時貿易申請書，顯示 SignaturePad，每次簽名即時儲存，呼叫 saveOfflineSignature API，Base64 傳送後端，後端合併 PDF 與簽名，前端顯示預覽確認)
- [ ] T029 [US1] 實作收購單線上簽名流程 (提交表單後呼叫 sendOnlineSignature API，透過 Dropbox Sign API 寄送合約至客戶 Email，處理發送失敗顯示錯誤訊息，服務單狀態設為已終止，提示重新建單)
- [ ] T030 [US1] 實作身分證明文件強制驗證 (提交前檢查是否已上傳 fileType=ID_CARD 的附件，若未上傳則阻止提交並顯示錯誤訊息「身分證明文件為必要附件，請上傳或拍攝身分證照片」，焦點移至上傳區域)
- [ ] T031 [US1] 實作 AI 辨識自動搜尋客戶邏輯 (辨識成功後自動以身分證字號呼叫 searchCustomers API，若找到客戶自動選擇並填入表單，若找不到填入新增客戶表單，比對姓名一致性顯示警告，若已選客戶但身分證字號不符則顯示錯誤阻止繼續)
- [ ] T031-1 [P] [US1] 撰寫外籍人士身分證格式驗證測試 `tests/pages/service-order-management/composables/useForeignIdValidation.test.ts` (測試 YYYYMMDD+AA 格式驗證、出生日期合理性檢查、格式錯誤提示)
- [ ] T031-2 [US1] 實作外籍人士身分證格式驗證邏輯 `src/pages/service-order-management/composables/useForeignIdValidation.ts` (驗證 10 位格式、出生日期範圍、英文字母大寫)

**Checkpoint**: 使用者故事 1 (建立收購單) 應完全功能且可獨立測試

---

## Phase 4: User Story 2 - 建立寄賣單 (Priority: P1) 🎯 MVP

**Goal**: 店員能快速建立寄賣單，包含客戶資訊、商品詳情、配件、寄賣日期、瑕疵、續約設定、身分證明上傳與 AI 辨識、線上/線下簽名功能

**Independent Test**: 建立一筆完整的寄賣單（包含客戶選擇、1-4 件商品資訊、商品配件、寄賣日期區間、瑕疵說明、續約設定、身分證明上傳與 AI 辨識、線下觸控簽名），驗證資料儲存、合約產生與簽名記錄

### 元件實作 - User Story 2

- [X] T032 [P] [US2] 建立商品配件選擇器元件 `src/pages/service-order-management/components/AccessoriesSelector.vue` (多選項目: 盒子、防塵袋、購證、提袋、肩帶、羊毛氈、枕頭、保卡、鎖頭/鑰匙、緞帶/花、品牌小卡、保證書、無)
- [X] T033 [P] [US2] 建立商品瑕疵選擇器元件 `src/pages/service-order-management/components/DefectsSelector.vue` (多選項目: 五金生鏽/刮痕/掉、皮質磨損/刮痕/壓痕、內裡髒污、四角磨損)
- [X] T034 [US2] 擴充 ProductItemForm 元件 `src/pages/service-order-management/components/ProductItemForm.vue` (整合 AccessoriesSelector 與 DefectsSelector，根據服務單類型條件顯示)

### 主要元件與頁面實作 - User Story 2

- [ ] T035 [US2] 擴充 ServiceOrderForm 元件 `src/pages/service-order-management/components/ServiceOrderForm.vue` (新增寄賣單專屬欄位: 寄賣日期選擇器、續約設定單選、驗證寄賣日期起訖邏輯、預設結束日期為起始日期後 90 天)
- [ ] T036 [US2] 更新服務單建立頁面 `src/pages/service-order-management/create.vue` (支援路由參數 consignment，根據類型切換表單模式，寄賣單驗證邏輯)
- [ ] T037 [US2] 實作寄賣單線下簽名流程 (提交表單後產生寄賣合約書，顯示 SignaturePad，簽名即時儲存，呼叫 saveOfflineSignature API，Base64 傳送後端，後端合併 PDF 與簽名，前端顯示預覽確認)
- [ ] T038 [US2] 實作寄賣單線上簽名流程 (提交表單後呼叫 sendOnlineSignature API，透過 Dropbox Sign API 寄送寄賣合約至客戶 Email，處理發送失敗顯示錯誤訊息，服務單狀態設為已終止，提示重新建單)

**Checkpoint**: 使用者故事 1 與 2 (建立收購單與寄賣單) 都應可獨立運作

---

## Phase 5: User Story 3 - 客戶搜尋與選擇 (Priority: P2)

**Goal**: 店員能快速搜尋既有客戶或新增客戶資料，支援多種搜尋條件 (姓名、電話、Email、身分證字號)，並自動填入服務單表單

**Independent Test**: 手動搜尋既有客戶 (使用姓名、電話、Email、身分證字號)、選擇客戶並驗證資料自動填入，或搜尋不到時新增客戶

### 測試 - User Story 3

- [X] T039 [P] [US3] 建立 CustomerSearch 元件測試 `tests/pages/service-order-management/components/CustomerSearch.test.ts` (測試搜尋輸入、結果列表顯示、客戶選擇事件、新增客戶事件)
- [X] T040 [P] [US3] 建立 CustomerForm 元件測試 `tests/pages/service-order-management/components/CustomerForm.test.ts` (測試欄位驗證、格式驗證、提交事件、台灣與外籍人士格式支援)

### 組合式函式實作 - User Story 3

- [ ] T041 [US3] 完善 useCustomerSearch 組合式函式 `src/pages/service-order-management/composables/useCustomerSearch.ts` (實作搜尋優先級邏輯: 身分證字號精確比對 > 電話精確比對 > 姓名模糊搜尋 > Email 模糊搜尋，若關鍵字符合身分證格式則僅以身分證搜尋)

### 元件實作 - User Story 3

- [ ] T042 [US3] 完善 CustomerSearch 元件 `src/pages/service-order-management/components/CustomerSearch.vue` (顯示搜尋結果客戶基本資訊 (姓名、電話、Email、身分證字號)，點擊選擇客戶發出 select 事件，無結果時顯示「新增客戶」按鈕發出 create 事件)
- [ ] T043 [US3] 完善 CustomerForm 元件 `src/pages/service-order-management/components/CustomerForm.vue` (實作新增客戶邏輯，呼叫 createCustomer API，成功後發出 success 事件並自動選擇該客戶，提供身分證字號說明文字與格式驗證)

**Checkpoint**: 使用者故事 1, 2, 3 都應可獨立運作

---

## Phase 6: User Story 4 - 服務單查詢與管理 (Priority: P2)

**Goal**: 店員能查詢、瀏覽、修改已建立的收購單與寄賣單，管理服務單狀態與附件，匯出 Excel 報表

**Independent Test**: 搜尋服務單 (依類型、客戶名稱、日期範圍等條件)、查看詳細資訊、修改服務單、更新狀態、下載附件、匯出 Excel

### 測試 - User Story 4

- [ ] T044 [P] [US4] 建立 useServiceOrderManagement 組合式函式測試 `tests/pages/service-order-management/composables/useServiceOrderManagement.test.ts` (測試查詢邏輯、分頁、篩選、刪除、狀態更新)
- [ ] T045 [P] [US4] 建立 useExportExcel 組合式函式測試 `tests/pages/service-order-management/composables/useExportExcel.test.ts` (測試 Excel 匯出邏輯、檔案命名、欄位對應)
- [ ] T046 [P] [US4] 建立 useDraftAutosave 組合式函式測試 `tests/pages/service-order-management/composables/useDraftAutosave.test.ts` (測試 localStorage 儲存、恢復、清除邏輯、30 秒間隔)

### 元件實作 - User Story 4

- [ ] T047 [P] [US4] 建立服務單表格元件 `src/pages/service-order-management/components/ServiceOrderTable.vue` (顯示服務單列表: 編號、客戶名稱、商品資訊、金額、狀態、建立日期，支援排序、分頁、編輯/刪除/查看按鈕，權限控制)
- [ ] T048 [P] [US4] 建立附件查看元件 `src/pages/service-order-management/components/AttachmentViewer.vue` (顯示附件列表，提供下載/預覽功能，身分證明文件權限控制顯示「已上傳」或完整圖片，查看記錄日誌)

### 組合式函式實作 - User Story 4

- [ ] T049 [US4] 實作 useServiceOrderManagement 組合式函式 `src/pages/service-order-management/composables/useServiceOrderManagement.ts` (查詢參數 ref、呼叫 getServiceOrderList API、分頁邏輯、篩選邏輯、刪除邏輯、狀態更新邏輯、loading 狀態)
- [ ] T050 [US4] 實作 useExportExcel 組合式函式 `src/pages/service-order-management/composables/useExportExcel.ts` (使用 xlsx 套件，匯出當前畫面資料，檔案命名格式「服務單報表_YYYYMMDD_HHMMSS.xlsx」，包含欄位: 服務單編號、客戶名稱、品牌名稱、款式、內碼、商品數量、金額、狀態、建立日期，單次最多 10,000 筆限制)
- [ ] T051 [US4] 實作 useDraftAutosave 組合式函式 `src/pages/service-order-management/composables/useDraftAutosave.ts` (使用 localStorage，每 30 秒或欄位失焦時自動儲存，key 格式「serviceOrder_draft_{type}」，包含時間戳記，頁面開啟時檢測並提示恢復，提交成功或放棄時清除，7 天自動過期)

### 頁面實作 - User Story 4

- [ ] T052 [US4] 建立服務單列表查詢頁面 `src/pages/service-order-management/index.vue` (整合 ServiceOrderTable，篩選條件表單 (服務單類型、客戶名稱、日期範圍、狀態)，分頁元件，Excel 匯出按鈕，新增收購單/寄賣單按鈕，權限控制)
- [ ] T053 [US4] 建立服務單詳細頁面 `src/pages/service-order-management/detail.vue` (顯示完整服務單資訊，整合 AttachmentViewer，修改歷史顯示，編輯按鈕 (依權限)，狀態更新下拉選單，線上簽名複製連結/重新寄送按鈕)
- [ ] T054 [US4] 實作服務單狀態轉換驗證 (前端驗證狀態轉換規則: 待處理→已完成/已終止, 已完成→待處理, 已終止為終態不可逆，無效轉換時顯示錯誤提示)
- [ ] T055 [US4] 實作服務單修改邏輯 (呼叫 updateServiceOrder API，樂觀鎖版本號驗證，並發衝突時顯示「資料已被其他使用者修改，請重新載入」，成功後更新 UI)
- [ ] T056 [US4] 實作修改歷史追蹤功能 (呼叫 getModificationHistory API，顯示變更欄位、變更前後值、修改時間、修改者，格式化顯示邏輯)
- [ ] T057 [US4] 實作 Excel 匯出功能整合 (點擊「匯出 Excel」按鈕，檢查當前畫面資料量，若無資料提示「目前無資料可匯出」，若超過 10,000 筆提示「資料量過大，建議縮小篩選範圍」，呼叫 useExportExcel 執行匯出)

**Checkpoint**: 所有使用者故事應完全功能且可獨立運作

---

## Phase 7: Polish & Cross-Cutting Concerns (優化與跨切面關注)

**Purpose**: 影響多個使用者故事的改進

- [ ] T058 [P] 撰寫 IdCardUploader 元件測試 `tests/pages/service-order-management/components/IdCardUploader.test.ts` (測試檔案上傳、拍照、預覽、OCR 呼叫、重試機制)
- [ ] T059 [P] 撰寫 SignaturePad 元件測試 `tests/pages/service-order-management/components/SignaturePad.test.ts` (測試簽名板初始化、清除、匯出、驗證)
- [ ] T060 [P] 撰寫 ProductItemForm 元件測試 `tests/pages/service-order-management/components/ProductItemForm.test.ts` (測試動態新增/刪除商品項目、配件選擇、瑕疵選擇)
- [ ] T061 [P] 撰寫 ServiceOrderForm 元件測試 `tests/pages/service-order-management/components/ServiceOrderForm.test.ts` (測試表單驗證、提交、收購單/寄賣單模式切換)
- [ ] T062 [P] 撰寫 ServiceOrderTable 元件測試 `tests/pages/service-order-management/components/ServiceOrderTable.test.ts` (測試列表顯示、排序、分頁、權限按鈕)
- [X] T063 [P] 新增國際化支援至 `src/i18n/locales/zh-tw.ts` (所有服務單管理相關的文字翻譯鍵)
- [ ] T064 程式碼重構與最佳化 (移除重複程式碼、提取共用邏輯、改善可讀性)
- [ ] T065 效能優化 (大量資料處理、虛擬滾動評估、API 請求快取、debounce 調校)
- [ ] T066 安全性強化 (敏感資料加密傳輸、XSS 防護、CSRF 防護、權限驗證)
- [ ] T067 錯誤處理改進 (統一錯誤訊息格式、使用者友善錯誤提示、錯誤邊界元件)
- [ ] T068 執行 quickstart.md 驗證流程 (依照 quickstart.md 測試指南執行完整功能測試)
- [X] T069 [P] 更新專案文件 README.md (新增服務單管理模組說明、路由資訊、權限說明)
- [ ] T070 [P] 建立使用者指南文件 `docs/service-order-management-user-guide.md` (包含功能介紹、操作流程、常見問題)
- [ ] T071 撰寫 AI 辨識後客戶搜尋整合測試 `tests/pages/service-order-management/integration/ai-customer-search.test.ts` (使用 mock OCR 結果驗證辨識成功後自動搜尋客戶、自動選擇客戶、自動填入表單的完整流程，驗證 90% 成功率目標)

---

## Dependencies & Execution Order (依賴關係與執行順序)

### 階段依賴

- **Setup (Phase 1)**: 無依賴 - 可立即開始
- **Foundational (Phase 2)**: 依賴 Setup 完成 - 阻塞所有使用者故事
- **User Stories (Phase 3-6)**: 全部依賴 Foundational 階段完成
  - 使用者故事可以並行進行 (若有人力配置)
  - 或按優先級順序執行 (P1 → P2)
- **Polish (Phase 7)**: 依賴所有期望的使用者故事完成

### 使用者故事依賴

- **User Story 1 (P1 - 建立收購單)**: Foundational 完成後可開始 - 無其他故事依賴
- **User Story 2 (P1 - 建立寄賣單)**: Foundational 完成後可開始 - 與 US1 共用部分元件 (CustomerSearch, CustomerForm, IdCardUploader, SignaturePad) 但可獨立測試
- **User Story 3 (P2 - 客戶搜尋與選擇)**: Foundational 完成後可開始 - 優化 US1/US2 的客戶選擇流程但可獨立測試
- **User Story 4 (P2 - 服務單查詢與管理)**: Foundational 完成後可開始 - 依賴 US1/US2 建立的資料進行查詢但可獨立測試

### 每個使用者故事內

- 測試 (若包含) 必須先寫並確保失敗後才實作
- 元件實作可並行 (標記 [P])
- 組合式函式實作可並行 (標記 [P])
- 主要元件與頁面實作在元件與組合式函式完成後進行
- 故事完成後才移至下一優先級

### 並行機會

- 所有 Setup 任務標記 [P] 可並行執行
- 所有 Foundational 任務標記 [P] 可並行執行 (在 Phase 2 內)
- Foundational 階段完成後，所有使用者故事可並行開始 (若團隊人力允許)
- 每個使用者故事內標記 [P] 的測試可並行執行
- 每個使用者故事內標記 [P] 的元件可並行執行
- 每個使用者故事內標記 [P] 的組合式函式可並行執行
- 不同使用者故事可由不同團隊成員並行處理

---

## Parallel Example: User Story 1 (建立收購單)

```bash
# 同時啟動 User Story 1 的所有測試:
Task: "建立 useServiceOrderForm 組合式函式測試 tests/pages/service-order-management/composables/useServiceOrderForm.test.ts"
Task: "建立 useCustomerSearch 組合式函式測試 tests/pages/service-order-management/composables/useCustomerSearch.test.ts"
Task: "建立 useIdCardRecognition 組合式函式測試 tests/pages/service-order-management/composables/useIdCardRecognition.test.ts"
Task: "建立 useSignature 組合式函式測試 tests/pages/service-order-management/composables/useSignature.test.ts"

# 同時啟動 User Story 1 的所有元件:
Task: "建立客戶搜尋元件 src/pages/service-order-management/components/CustomerSearch.vue"
Task: "建立客戶表單元件 src/pages/service-order-management/components/CustomerForm.vue"
Task: "建立身分證上傳元件 src/pages/service-order-management/components/IdCardUploader.vue"
Task: "建立商品項目表單元件 src/pages/service-order-management/components/ProductItemForm.vue"
Task: "建立觸控簽名板元件 src/pages/service-order-management/components/SignaturePad.vue"
```

---

## Implementation Strategy (實作策略)

### MVP First (僅 User Story 1 + 2)

1. 完成 Phase 1: Setup
2. 完成 Phase 2: Foundational (關鍵 - 阻塞所有故事)
3. 完成 Phase 3: User Story 1 (建立收購單)
4. 完成 Phase 4: User Story 2 (建立寄賣單)
5. **停止並驗證**: 獨立測試 User Story 1 與 2
6. 若就緒則部署/展示

### 漸進式交付

1. 完成 Setup + Foundational → 基礎就緒
2. 新增 User Story 1 → 獨立測試 → 部署/展示 (MVP 第一階段!)
3. 新增 User Story 2 → 獨立測試 → 部署/展示 (MVP 完整!)
4. 新增 User Story 3 → 獨立測試 → 部署/展示 (優化!)
5. 新增 User Story 4 → 獨立測試 → 部署/展示 (完整功能!)
6. 每個故事都增加價值而不破壞先前的故事

### 並行團隊策略

若有多位開發者:

1. 團隊一起完成 Setup + Foundational
2. Foundational 完成後:
   - 開發者 A: User Story 1 (建立收購單)
   - 開發者 B: User Story 2 (建立寄賣單)
   - 開發者 C: User Story 3 (客戶搜尋與選擇)
   - 開發者 D: User Story 4 (服務單查詢與管理)
3. 故事獨立完成並整合

---

## Summary (總結)

**總任務數**: 73 個任務

**任務分佈**:
- Phase 1 (Setup): 5 個任務
- Phase 2 (Foundational): 7 個任務 (關鍵阻塞階段)
- Phase 3 (User Story 1 - 建立收購單): 21 個任務 (包含 4 個測試 + 2 個外籍人士驗證任務)
- Phase 4 (User Story 2 - 建立寄賣單): 7 個任務
- Phase 5 (User Story 3 - 客戶搜尋與選擇): 5 個任務 (包含 2 個測試)
- Phase 6 (User Story 4 - 服務單查詢與管理): 14 個任務 (包含 3 個測試)
- Phase 7 (Polish): 14 個任務 (包含 5 個元件測試 + 1 個整合測試)

**並行機會**:
- Setup 階段: 4 個任務可並行 (T002-T005)
- Foundational 階段: 5 個任務可並行 (T007-T010)
- User Story 1: 9 個任務可並行 (4 個測試 + 5 個元件)
- User Story 2: 3 個任務可並行 (3 個元件)
- User Story 3: 2 個任務可並行 (2 個測試)
- User Story 4: 5 個任務可並行 (3 個測試 + 2 個元件)
- Polish 階段: 8 個任務可並行 (5 個元件測試 + 3 個文件)

**獨立測試標準**:
- User Story 1: 建立完整收購單並驗證資料儲存、合約產生、簽名記錄
- User Story 2: 建立完整寄賣單並驗證資料儲存、合約產生、簽名記錄
- User Story 3: 搜尋客戶、選擇客戶、新增客戶並驗證資料填入
- User Story 4: 查詢服務單、修改服務單、更新狀態、匯出 Excel

**建議 MVP 範圍**: User Story 1 + User Story 2 (建立收購單與寄賣單)

**格式驗證**: 所有 73 個任務均遵循 checklist 格式 (checkbox + ID + 標籤 + 檔案路徑)

---

## Notes (注意事項)

- **[P] 任務**: 不同檔案、無依賴關係，可並行執行
- **[Story] 標籤**: 將任務對應至特定使用者故事以便追蹤
- 每個使用者故事應可獨立完成並測試
- 實作前先驗證測試失敗
- 每個任務或邏輯群組完成後提交
- 在任何檢查點停止以獨立驗證故事
- 避免: 模糊任務、同檔案衝突、破壞獨立性的跨故事依賴
- OCR 辨識由後端處理 (Azure Vision + Google Gemini)，前端僅負責上傳與顯示結果
- 身分證明文件為必要附件，每筆服務單建立時必須驗證
- 線上簽名使用 Dropbox Sign API，發送失敗則服務單狀態設為已終止
- 服務單支援 1-4 件商品項目，每件商品獨立記錄
- 客戶資料以快照方式儲存於服務單，修改僅影響該服務單不影響客戶主檔
- 草稿自動儲存使用 localStorage，每 30 秒或欄位失焦時觸發
- Excel 匯出單次最多 10,000 筆，超過提示縮小範圍
- 所有 API 呼叫需處理錯誤並顯示使用者友善訊息
- 權限控制在 UI 層隱藏無權限按鈕，後端進行二次驗證

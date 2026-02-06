# Tasks: 訂單管理模組

**Input**: Design documents from `/specs/009-order-management/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/api-contracts.md, quickstart.md

**Tests**: 本專案測試為選填項目,未在規格中明確要求 TDD 方法,因此測試任務標記為可選。

**Organization**: 任務按使用者故事組織,以實現每個故事的獨立實作與測試。

## Format: `- [ ] [ID] [P?] [Story?] Description`

- **[P]**: 可並行執行(不同檔案,無相依性)
- **[Story]**: 任務所屬使用者故事(如 US1, US2, US3)
- 描述中包含確切檔案路徑

---

## Phase 1: Setup (專案初始化)

**Purpose**: 建立訂單管理模組的基礎結構與型別定義

- [ ] T001 建立訂單管理模組目錄結構於 src/pages/order-management/
- [ ] T002 建立型別定義檔案 src/pages/order-management/types.ts 並定義所有 enums(OrderType, PaymentStatus, OrderStatus, ShippingStatus, DeliveryMethod, ProductSource, PaymentMethod)
- [ ] T003 [P] 在 src/pages/order-management/types.ts 中定義核心實體介面(SalesOrder, SalesOrderListItem, OrderItem, PaymentRecord)
- [ ] T004 [P] 在 src/pages/order-management/types.ts 中定義收件資訊聯集型別(DeliveryInfo, PickupInfo, HomeDeliveryInfo, StorePickupInfo, PlatformDeliveryInfo)
- [ ] T005 [P] 在 src/pages/order-management/types.ts 中定義請求 DTO 介面(CreateSalesOrderRequest, UpdateSalesOrderRequest, AddPaymentRecordRequest 等)
- [ ] T006 [P] 在 src/pages/order-management/types.ts 中定義回應 DTO 介面(ApiResponse, PagedResponse, ShippingLabelResponse, SalesOrderExportDto)
- [ ] T007 [P] 在 src/pages/order-management/types.ts 中定義查詢參數介面(SalesOrderListParams, OrderExportParams)
- [ ] T008 [P] 在 src/pages/order-management/types.ts 中定義表單模型介面(OrderFormData, OrderItemFormData, PaymentRecordFormData)
- [ ] T009 [P] 在 src/pages/order-management/types.ts 中定義常數(SHIPPING_FEE_CONFIG, ORDER_STATUS_LABELS, PAYMENT_STATUS_LABELS, SHIPPING_STATUS_LABELS, DELIVERY_METHOD_LABELS, PRODUCT_SOURCE_LABELS, PAYMENT_METHOD_LABELS, ORDER_STATUS_COLORS, PAYMENT_STATUS_COLORS, SHIPPING_STATUS_COLORS)
- [ ] T010 [P] 在 src/pages/order-management/types.ts 中定義型別守衛函式(isPickupInfo, isHomeDeliveryInfo, isStorePickupInfo, isPlatformDeliveryInfo)
- [ ] T011 [P] 在 src/pages/order-management/types.ts 中定義表單驗證規則常數(ORDER_ITEM_RULES, PAYMENT_RECORD_RULES)
- [ ] T012 在 src/common/constants/permissions.ts 中新增訂單管理權限常數(sales-order:create, sales-order:read, sales-order:update, sales-order:delete, sales-order:export)
- [ ] T013 在 src/router/index.ts 中新增訂單管理路由(path: /order-management, 權限檢查使用 sales-order:read)

---

## Phase 2: Foundational (阻塞性前置任務)

**Purpose**: 建立所有使用者故事依賴的核心基礎設施

**⚠️ CRITICAL**: 此階段完成前,任何使用者故事都無法開始實作

- [ ] T014 建立 src/common/apis/order.ts 並定義所有 API 請求函式介面(13 個端點對應函式)
- [ ] T015 [P] 在 src/common/apis/order.ts 中實作 createOrderApi (POST /api/sales-orders)
- [ ] T016 [P] 在 src/common/apis/order.ts 中實作 getOrderListApi (GET /api/sales-orders)
- [ ] T017 [P] 在 src/common/apis/order.ts 中實作 getOrderDetailApi (GET /api/sales-orders/{id})
- [ ] T018 [P] 在 src/common/apis/order.ts 中實作 updateOrderApi (PUT /api/sales-orders/{id})
- [ ] T019 [P] 在 src/common/apis/order.ts 中實作 deleteOrderApi (DELETE /api/sales-orders/{id})
- [ ] T020 [P] 在 src/common/apis/order.ts 中實作 addPaymentRecordApi (POST /api/sales-orders/{orderId}/payment-records)
- [ ] T021 [P] 在 src/common/apis/order.ts 中實作 updatePaymentRecordApi (PUT /api/sales-orders/{orderId}/payment-records/{paymentRecordId})
- [ ] T022 [P] 在 src/common/apis/order.ts 中實作 deletePaymentRecordApi (DELETE /api/sales-orders/{orderId}/payment-records/{paymentRecordId})
- [ ] T023 [P] 在 src/common/apis/order.ts 中實作 updatePaymentStatusApi (PATCH /api/sales-orders/{id}/payment-status)
- [ ] T024 [P] 在 src/common/apis/order.ts 中實作 updateOrderStatusApi (PATCH /api/sales-orders/{id}/order-status)
- [ ] T025 [P] 在 src/common/apis/order.ts 中實作 updateShippingStatusApi (PATCH /api/sales-orders/{id}/shipping-status)
- [ ] T026 [P] 在 src/common/apis/order.ts 中實作 getOrderExportApi (GET /api/sales-orders/export)
- [ ] T027 [P] 在 src/common/apis/order.ts 中實作 getShippingLabelApi (GET /api/sales-orders/{id}/shipping-label)
- [ ] T028 在 src/http/axios.ts 中擴充錯誤攔截器以處理訂單管理業務邏輯錯誤碼(新增訂單特有錯誤碼至 API_CODE_I18N_KEY_MAP:DAILY_ORDER_LIMIT_REACHED, DAILY_ORDER_LIMIT_WARNING, INVALID_CUSTOMER, ORDER_ALREADY_COMPLETED, ORDER_ALREADY_CANCELLED, PAYMENT_EXCEEDS_TOTAL, PAYMENT_RECORD_NOT_FOUND, CANNOT_DELETE_PAID_RECORD;VALIDATION_ERROR 與 CONCURRENT_UPDATE_CONFLICT 已由既有攔截器處理;訂單管理業務邏輯層 composables 應自行捕獲特定錯誤碼並顯示客製化訊息,攔截器僅作為通用錯誤處理備援)

**Checkpoint**: 基礎建設完成 - 使用者故事實作現在可以並行開始

---

## Phase 3: User Story 1 - 建立新銷售訂單 (Priority: P1) 🎯 MVP

**Goal**: 銷售人員可為客戶建立銷售訂單,記錄客戶資訊、商品詳情、收件方式及付款方式,以啟動銷售流程

**Independent Test**: 完整建立訂單流程測試,包含選擇客戶、輸入商品、選擇收件方式、付款方式,並查看生成的訂單確認與訂單編號。立即為員工提供記錄銷售交易的價值。

### Implementation for User Story 1

#### Composables (業務邏輯層)

- [ ] T029 [P] [US1] 建立 src/pages/order-management/composables/useCustomerSearch.ts 並實作客戶搜尋功能(關鍵字搜尋、防抖處理、快速新增客戶整合)
- [ ] T030 [P] [US1] 建立 src/pages/order-management/composables/useDeliveryValidation.ts 並實作收件資訊動態驗證邏輯(依 deliveryMethod 切換驗證規則、自動載入預設運費)
- [ ] T031 [US1] 建立 src/pages/order-management/composables/useOrderForm.ts 並實作訂單表單邏輯(表單狀態管理、提交驗證、建立訂單 API 呼叫、樂觀鎖定處理、單日上限警告處理)

#### Components (元件層)

- [ ] T032 [P] [US1] 建立 src/pages/order-management/components/CustomerSelector.vue 元件(客戶搜尋下拉選單、快速新增客戶按鈕、整合 useCustomerSearch)
- [ ] T033 [P] [US1] 建立 src/pages/order-management/components/OrderItemsForm.vue 元件(動態新增/刪除訂單項目、欄位驗證、小計計算)
- [ ] T034 [P] [US1] 建立 src/pages/order-management/components/DeliveryInfoForm.vue 元件(依收件方式動態顯示欄位、整合 useDeliveryValidation、即時驗證)
- [ ] T035 [US1] 建立 src/pages/order-management/components/OrderFormDialog.vue 元件(整合 CustomerSelector、OrderItemsForm、DeliveryInfoForm、訂單類型選擇、運費輸入、備註輸入、表單提交與重置)
- [ ] T036 [US1] 建立 src/pages/order-management/index.vue 主頁面並新增「新增訂單」按鈕(開啟 OrderFormDialog、權限檢查 sales-order:create)

#### Integration & Validation

- [ ] T037 [US1] 在 OrderFormDialog.vue 中實作表單提交流程(前端驗證→API 呼叫→成功提示顯示訂單編號→重新整理列表→關閉對話框)
- [ ] T038 [US1] 在 OrderFormDialog.vue 中實作錯誤處理邏輯(VALIDATION_ERROR 顯示欄位錯誤、DAILY_ORDER_LIMIT_REACHED 阻止提交、DAILY_ORDER_LIMIT_WARNING 顯示警告通知、INVALID_CUSTOMER 提示重新選擇客戶)
- [ ] T039 [US1] 在 OrderItemsForm.vue 中實作商品項目驗證(必填欄位、單價>0、數量≥1、即時計算小計)
- [ ] T040 [US1] 在 DeliveryInfoForm.vue 中實作收件資訊完整性驗證(自取:地點+時間必填、宅配:姓名+電話+地址必填且格式正確、超取:門市資訊+取貨人姓名+電話必填、平台物流:無需驗證)

**Checkpoint**: 此時使用者故事 1 應完全可運作且可獨立測試

---

## Phase 4: User Story 2 - 更新訂單付款與狀態 (Priority: P2)

**Goal**: 銷售人員可在客戶每次付款時逐筆輸入付款金額,記錄付款方式與付款時間;同時在訂單狀態改變(完成、取消、出貨)時更新訂單資訊

**Independent Test**: 建立訂單(使用故事 1),然後新增不同金額和方式的付款記錄、更新付款狀態、變更訂單狀態,並驗證付款歷程正確追蹤

### Implementation for User Story 2

#### Composables (業務邏輯層)

- [ ] T041 [P] [US2] 建立 src/pages/order-management/composables/usePaymentRecords.ts 並實作付款記錄管理邏輯(累積金額計算、剩餘應付金額計算、新增付款記錄、修改付款記錄銀行末五碼、刪除付款記錄、超額驗證、付款金額驗證規則)
- [ ] T042 [P] [US2] 建立 src/pages/order-management/composables/useOrderDetail.ts 並實作訂單詳情邏輯(取得訂單詳情 API 呼叫、刪除訂單 API 呼叫、並發衝突處理)
- [ ] T043 [US2] 在 src/pages/order-management/composables/useOrderForm.ts 中新增訂單修改功能(載入既有訂單資料、版本號管理、修改提交邏輯、並發衝突提示)

#### Components (元件層)

- [ ] T044 [P] [US2] 建立 src/pages/order-management/components/PaymentRecordsPanel.vue 元件(顯示付款歷程表格、累積金額與剩餘應付金額顯示、新增付款記錄對話框、修改銀行末五碼功能、刪除付款記錄確認)
- [ ] T045 [P] [US2] 建立 src/pages/order-management/components/OrderStatusActions.vue 元件(訂單狀態下拉選單、付款狀態下拉選單、出貨狀態下拉選單、即時更新 API 呼叫、權限檢查)
- [ ] T046 [US2] 在 src/pages/order-management/components/OrderFormDialog.vue 中新增編輯模式支援(檢測 dialogMode 為 edit、載入既有訂單資料、禁用客戶選擇器、顯示版本號、提交時使用 updateOrderApi)

#### Integration & Validation

- [ ] T047 [US2] 在 PaymentRecordsPanel.vue 中實作新增付款記錄流程(前端即時驗證付款金額不超過剩餘應付→API 呼叫→成功後更新本地列表與累積金額→完全付款時顯示通知)
- [ ] T048 [US2] 在 PaymentRecordsPanel.vue 中實作修改付款記錄的銀行末五碼流程(開啟編輯對話框→僅允許修改銀行末五碼欄位→API 呼叫→成功後更新本地記錄)
- [ ] T049 [US2] 在 PaymentRecordsPanel.vue 中實作刪除付款記錄流程(確認對話框→API 呼叫→成功後移除本地記錄並重新計算累積金額)
- [ ] T050 [US2] 在 OrderStatusActions.vue 中實作狀態更新流程(選擇新狀態→API 呼叫對應端點→成功後更新本地訂單物件與列表顯示)
- [ ] T051 [US2] 在 OrderFormDialog.vue 編輯模式中實作樂觀鎖定處理(提交時攜帶 version 欄位→檢測 CONCURRENT_UPDATE_CONFLICT 錯誤→顯示友善提示並提供重新載入選項)
- [ ] T052 [US2] 實作付款狀態為「已付款」時阻止新增付款記錄的前端邏輯(在 PaymentRecordsPanel.vue 中檢查 paymentStatus 並禁用新增按鈕)
- [ ] T053 [US2] 實作訂單狀態為「已完成」或「已取消」時限制修改範圍的前端邏輯(在 OrderFormDialog.vue 中禁用核心資訊欄位:客戶選擇器、商品項目表單、運費輸入、收件方式與收件資訊;僅允許更新非核心資訊:訂單備註、付款狀態、出貨狀態)

#### Page Integration

- [ ] T054 [US2] 在 src/pages/order-management/index.vue 中新增「查看詳情」操作按鈕並整合 OrderFormDialog 編輯模式(點擊開啟對話框、傳遞訂單 ID、載入詳情資料)
- [ ] T055 [US2] 在 src/pages/order-management/index.vue 中新增「刪除」操作按鈕並整合 useOrderDetail.handleDelete(確認對話框→API 呼叫→成功後重新整理列表)
- [ ] T056 [US2] 在訂單詳情對話框中整合 PaymentRecordsPanel 元件(顯示於訂單基本資訊下方、傳遞 orderId 與 totalAmount、監聽付款記錄變更事件並更新付款狀態顯示)

**Checkpoint**: 此時使用者故事 1 與 2 應都能獨立運作

---

## Phase 5: User Story 3 - 搜尋與篩選訂單 (Priority: P2)

**Goal**: 銷售經理可使用各種搜尋條件快速找到特定訂單,以追蹤所有訂單的訂單狀態、付款和出貨情況

**Independent Test**: 建立具有不同屬性的多個訂單(使用故事 1),然後按訂單編號、客戶名稱、商品名稱、付款狀態、訂單狀態、出貨狀態和日期範圍搜尋,驗證返回正確結果

### Implementation for User Story 3

#### Composables (業務邏輯層)

- [ ] T057 [US3] 建立 src/pages/order-management/composables/useOrderList.ts 並實作訂單列表邏輯(訂單列表狀態管理、分頁狀態管理、搜尋篩選條件管理、查詢訂單列表 API 呼叫、分頁變更處理、搜尋條件重置)

#### Components (元件層)

- [ ] T058 [P] [US3] 建立 src/pages/order-management/components/OrderSearchForm.vue 元件(訂單編號輸入框、客戶名稱輸入框、商品名稱輸入框、訂單狀態下拉選單、付款狀態下拉選單、出貨狀態下拉選單、日期範圍選擇器、搜尋按鈕、重置按鈕)
- [ ] T059 [P] [US3] 建立 src/pages/order-management/components/OrderListTable.vue 元件(訂單列表表格顯示、欄位包含訂單編號/客戶名稱/商品名稱/總金額/付款狀態/訂單狀態/出貨狀態/建立日期/操作者、狀態標籤顏色顯示、分頁元件整合、操作欄包含查看/編輯/刪除按鈕)

#### Integration & Validation

- [ ] T060 [US3] 在 src/pages/order-management/index.vue 中整合 OrderSearchForm 元件並實作搜尋流程(監聽搜尋事件→更新篩選條件→重置頁碼為 1→呼叫 fetchOrders)
- [ ] T061 [US3] 在 src/pages/order-management/index.vue 中整合 OrderListTable 元件並實作分頁流程(監聽 pageChange 與 sizeChange 事件→更新 pagination 狀態→呼叫 fetchOrders)
- [ ] T062 [US3] 在 OrderSearchForm.vue 中實作重置功能(清空所有篩選條件欄位→觸發搜尋事件以載入全部訂單)
- [ ] T063 [US3] 在 OrderListTable.vue 中實作狀態標籤顯示邏輯(使用 Element Plus Tag 元件、根據 ORDER_STATUS_COLORS/PAYMENT_STATUS_COLORS/SHIPPING_STATUS_COLORS 常數設定顏色)
- [ ] T064 [US3] 在 src/pages/order-management/index.vue 的 onMounted 生命週期中呼叫 fetchOrders 以載入初始訂單列表(預設分頁參數 pageNumber=1, pageSize=20)

**Checkpoint**: 所有使用者故事現在應該都能獨立運作

---

## Phase 6: User Story 4 - 列印與下載出貨單 (Priority: P3)

**Goal**: 倉庫人員可列印或下載包含訂單詳情和收件人資訊的出貨單,以準備商品出貨

**Independent Test**: 建立包含收件資訊的訂單(使用故事 1),然後生成並下載/列印出貨單,驗證所有訂單詳情和收件人資訊正確顯示

### Implementation for User Story 4

#### Composables (業務邏輯層)

- [ ] T065 [US4] 建立 src/pages/order-management/composables/useShippingLabel.ts 並實作出貨單邏輯(取得出貨單資料 API 呼叫、瀏覽器列印功能觸發、下載 PDF 功能整合)

#### Components (元件層)

- [ ] T066 [US4] 建立 src/pages/order-management/components/ShippingLabelPreview.vue 元件(出貨單資料格式化顯示、包含訂單編號/訂單日期/客戶名稱/收件方式/收件資訊/訂單項目清單、列印友善樣式設計)

#### Integration & Validation

- [ ] T067 [US4] 在 src/pages/order-management/index.vue 或 OrderFormDialog.vue 中新增「列印出貨單」按鈕並整合 ShippingLabelPreview(點擊開啟預覽對話框→載入出貨單資料→提供列印按鈕觸發 window.print)
- [ ] T068 [US4] 在 ShippingLabelPreview.vue 中實作列印樣式優化(使用 @media print CSS 規則隱藏不必要元素、確保出貨單格式符合 A4 紙張規格)
- [ ] T069 [US4] 在 useShippingLabel.ts 中實作下載功能(可選)(使用 html2canvas 或 jsPDF 將出貨單轉換為 PDF 並下載)
- [ ] T069-1 [US4] 在 src/pages/order-management/components/ 中新增 OrderDetailPrint.vue 元件並實作訂單明細列印功能(供內部使用,包含訂單編號/客戶資訊/商品詳情/金額明細/付款狀態/訂單狀態/出貨狀態/操作者等完整資訊,使用 @media print 優化列印樣式)

**Checkpoint**: 出貨單與訂單明細列印功能完成

---

## Phase 7: User Story 5 - 匯出訂單報表 (Priority: P3)

**Goal**: 銷售經理可匯出訂單資料以進行分析、向管理層報告或會計用途

**Independent Test**: 建立多個訂單(使用故事 1),然後匯出報表並驗證包含所有必要欄位(訂單編號、客戶名稱、商品名稱、售出金額、付款狀態、訂單狀態、出貨狀態、建立日期、操作者)

### Implementation for User Story 5

#### Composables (業務邏輯層)

- [ ] T070 [US5] 建立 src/pages/order-management/composables/useOrderExport.ts 並實作 Excel 匯出邏輯(呼叫匯出 API 取得資料、使用 xlsx 套件轉換為 Excel 工作表、設定欄寬與樣式、生成檔案名稱含時間戳、觸發瀏覽器下載、狀態格式化為中文標籤、日期格式化為 zh-TW 格式)

#### Integration & Validation

- [ ] T071 [US5] 在 src/pages/order-management/index.vue 中新增「匯出報表」按鈕並整合 useOrderExport(權限檢查 sales-order:export、點擊觸發 exportOrders 並傳遞當前篩選條件、顯示匯出成功訊息與筆數)
- [ ] T072 [US5] 在 useOrderExport.ts 中實作狀態與日期格式化函式(formatPaymentStatus、formatOrderStatus、formatShippingStatus、formatDate)
- [ ] T073 [US5] 在 useOrderExport.ts 中實作匯出前資料驗證(若無符合條件的訂單則顯示警告訊息、若資料量超過 1000 筆則提示分批匯出)
- [ ] T074 [US5] 測試 Excel 檔案內容完整性(驗證欄位標題為繁體中文、驗證所有必要欄位皆存在、驗證狀態已轉換為中文標籤、驗證日期格式正確、驗證可用 Excel/LibreOffice 開啟無錯誤)

**Checkpoint**: 訂單匯出功能完成

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: 改善影響多個使用者故事的跨領域關注點

- [ ] T075 [P] 在 src/pages/order-management/index.vue 中新增 Loading 狀態顯示(全域 loading 覆蓋層、列表載入骨架屏)
- [ ] T076 [P] 在所有對話框元件中新增 Loading 狀態顯示(提交按鈕 loading 狀態、禁用表單防止重複提交)
- [ ] T077 [P] 在 src/pages/order-management/index.vue 中新增空狀態提示(無訂單時顯示友善提示與建立訂單引導)
- [ ] T078 [P] 在 OrderListTable.vue 中新增響應式設計優化(確保最小寬度 1280px 下表格正常顯示、超出寬度時顯示水平捲軸)
- [ ] T079 程式碼重構與優化(移除 console.log、統一錯誤處理模式、提取重複邏輯至 utils 函式)
- [ ] T080 [P] 新增 JSDoc 註解至所有 composables 與 utils 函式(使用繁體中文、包含參數說明與回傳值說明)
- [ ] T081 [P] 新增元件 props 與 emits 的 JSDoc 註解(使用繁體中文、說明用途與型別)
- [ ] T082 執行 ESLint 檢查並修復所有警告與錯誤(執行 pnpm lint 並修正問題)
- [ ] T083 執行 TypeScript 型別檢查並修復所有錯誤(執行 pnpm type-check 並修正問題)
- [ ] T084 更新 README.md 或專案文件(新增訂單管理模組功能說明、使用者指南、開發者指南連結至 quickstart.md)
- [ ] T085 執行 quickstart.md 驗證(依照 quickstart.md 步驟從頭設置專案、驗證所有功能正常運作、更新文件中過時內容)
- [ ] T086 效能優化(使用 Vue DevTools Profiler 檢查元件渲染效能、優化大型列表渲染使用虛擬捲動、優化搜尋防抖時間、檢查記憶體洩漏)
- [ ] T087 安全性檢查(驗證所有使用者輸入皆經過驗證與跳脫、確認敏感資料不暴露於前端、檢查權限控制正確實作)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: 無相依性 - 可立即開始
- **Foundational (Phase 2)**: 依賴 Setup 完成 - 阻塞所有使用者故事
- **User Stories (Phase 3-7)**: 所有皆依賴 Foundational phase 完成
  - 使用者故事可並行進行(若人力充足)
  - 或依優先級順序執行(P1 → P2 → P3)
- **Polish (Phase 8)**: 依賴所有期望的使用者故事完成

### User Story Dependencies

- **User Story 1 (P1)**: 可在 Foundational (Phase 2) 完成後開始 - 無其他故事相依性
- **User Story 2 (P2)**: 可在 Foundational (Phase 2) 完成後開始 - 需整合 US1 的訂單建立功能但應可獨立測試
- **User Story 3 (P2)**: 可在 Foundational (Phase 2) 完成後開始 - 需整合 US1/US2 但應可獨立測試
- **User Story 4 (P3)**: 可在 Foundational (Phase 2) 完成後開始 - 需 US1 建立的訂單資料但可獨立測試
- **User Story 5 (P3)**: 可在 Foundational (Phase 2) 完成後開始 - 需 US1 建立的訂單資料但可獨立測試

### Within Each User Story

- Composables 在 Components 之前
- Components 在 Integration 之前
- 核心實作在整合之前
- 故事完成後才移至下一個優先級

### Parallel Opportunities

- Phase 1 中標記 [P] 的任務可並行執行(T002-T011 可同時進行型別定義)
- Phase 2 中標記 [P] 的任務可並行執行(T015-T027 可同時實作不同 API 函式)
- Foundational phase 完成後,所有使用者故事可並行開始(若團隊容量允許)
- 每個故事內標記 [P] 的 Composables 可並行執行(如 US1 的 T029-T030)
- 每個故事內標記 [P] 的 Components 可並行執行(如 US1 的 T032-T034)
- 不同使用者故事可由不同團隊成員並行處理

---

## Parallel Example: User Story 1

```bash
# 同時啟動 User Story 1 的所有 Composables:
Task: "建立 useCustomerSearch.ts 並實作客戶搜尋功能"
Task: "建立 useDeliveryValidation.ts 並實作收件資訊動態驗證邏輯"
# 等待 T029-T030 完成後

# 同時啟動 User Story 1 的所有可並行 Components:
Task: "建立 CustomerSelector.vue 元件"
Task: "建立 OrderItemsForm.vue 元件"
Task: "建立 DeliveryInfoForm.vue 元件"
# 等待 T032-T034 完成後

# 依序完成整合任務:
Task: "建立 OrderFormDialog.vue 元件(整合所有子元件)"
Task: "在 index.vue 主頁面新增新增訂單按鈕"
Task: "實作表單提交流程"
Task: "實作錯誤處理邏輯"
Task: "實作驗證邏輯"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. 完成 Phase 1: Setup
2. 完成 Phase 2: Foundational (CRITICAL - 阻塞所有故事)
3. 完成 Phase 3: User Story 1
4. **停止並驗證**: 獨立測試 User Story 1
5. 準備好後部署/展示

### Incremental Delivery

1. 完成 Setup + Foundational → 基礎完備
2. 新增 User Story 1 → 獨立測試 → 部署/展示 (MVP!)
3. 新增 User Story 2 → 獨立測試 → 部署/展示
4. 新增 User Story 3 → 獨立測試 → 部署/展示
5. 新增 User Story 4 → 獨立測試 → 部署/展示
6. 新增 User Story 5 → 獨立測試 → 部署/展示
7. 每個故事增加價值而不破壞先前故事

### Parallel Team Strategy

若有多位開發者:

1. 團隊共同完成 Setup + Foundational
2. Foundational 完成後:
   - 開發者 A: User Story 1
   - 開發者 B: User Story 2
   - 開發者 C: User Story 3
3. 故事獨立完成並整合

---

## Task Summary

### 總任務數: 88 個任務

### 各使用者故事任務數:
- **Setup (Phase 1)**: 13 個任務
- **Foundational (Phase 2)**: 15 個任務
- **User Story 1 - 建立新銷售訂單 (P1)**: 12 個任務
- **User Story 2 - 更新訂單付款與狀態 (P2)**: 16 個任務
- **User Story 3 - 搜尋與篩選訂單 (P2)**: 8 個任務
- **User Story 4 - 列印與下載出貨單 (P3)**: 6 個任務(新增 T069-1 訂單明細列印)
- **User Story 5 - 匯出訂單報表 (P3)**: 5 個任務
- **Polish (Phase 8)**: 13 個任務

### 並行機會識別:
- **Phase 1**: 10 個可並行任務(T002-T011)
- **Phase 2**: 13 個可並行任務(T015-T027)
- **User Story 1**: 5 個可並行任務(T029-T030, T032-T034)
- **User Story 2**: 4 個可並行任務(T041-T042, T044-T045)
- **User Story 3**: 2 個可並行任務(T058-T059)
- **Phase 8**: 5 個可並行任務(T075-T078, T080-T081)
- **總並行機會**: 39 個可並行任務

### 各故事獨立測試標準:
- **US1**: 可完整建立訂單並查看訂單編號
- **US2**: 可新增付款記錄、修改訂單、更新狀態
- **US3**: 可使用多條件搜尋訂單並正確顯示結果
- **US4**: 可生成出貨單並列印/下載
- **US5**: 可匯出 Excel 報表且格式正確

### 建議 MVP 範圍(僅 User Story 1):
完成 Phase 1 + Phase 2 + Phase 3 即可提供基本的訂單建立功能,為銷售人員提供立即價值。

### 格式驗證:
✅ 所有任務遵循 `- [ ] [ID] [P?] [Story?] Description with file path` 格式
✅ 所有任務包含明確檔案路徑
✅ 所有使用者故事任務標記 [US1], [US2], [US3], [US4], [US5]
✅ 所有可並行任務標記 [P]

---

## Notes

- [P] 任務 = 不同檔案,無相依性
- [Story] 標籤將任務映射至特定使用者故事以便追蹤
- 每個使用者故事應可獨立完成與測試
- 在每個 checkpoint 停止以獨立驗證故事
- 避免: 模糊任務、相同檔案衝突、破壞獨立性的跨故事相依

---

**Tasks Generated**: 2026-02-06 | **Author**: GitHub Copilot | **Total**: 88 tasks | **Parallel Opportunities**: 39 tasks | **Last Updated**: 2026-02-06 (Analysis corrections applied)

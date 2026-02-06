# Research Report: 訂單管理模組

**Date**: 2026-02-06 | **Branch**: `009-order-management` | **Phase**: 0

## Executive Summary

本研究報告針對銷售訂單管理模組的技術實作決策進行分析,解決 Technical Context 中標記為 "NEEDS CLARIFICATION" 的項目,並基於後端 OpenAPI 規範(`http://localhost:5176/swagger/v1/swagger.json`)與專案既有架構(V3 Admin Vite)制定前端實作策略。研究範圍涵蓋：API 整合策略、資料模型對應、表單驗證規則、狀態管理模式、Excel 匯出實作、收件資訊動態驗證以及效能最佳化策略。

## Research Topics

### Topic 1: 後端 API 整合策略與錯誤處理機制

**Decision**: 嚴格遵循後端 `/api/sales-orders` 系列 API 的 `ApiResponseModel<T>` 格式,使用統一錯誤攔截器處理業務邏輯錯誤碼

**Rationale**:
1. **API 契約一致性**: 後端 OpenAPI 規範定義標準回應格式 `ApiResponseModel<T>`,包含 `success`、`code`、`message`、`data`、`timestamp`、`traceId` 與 `errors` 欄位,前端必須嚴格遵循此格式解析回應
2. **業務邏輯錯誤碼**: 後端定義多種業務邏輯錯誤碼(如 `VALIDATION_ERROR`、`CONCURRENT_UPDATE_CONFLICT`、`DAILY_ORDER_LIMIT_REACHED`),前端需對應處理並顯示友善錯誤訊息
3. **樂觀鎖定支援**: 所有修改操作需攜帶 `version` 欄位,後端檢測並發衝突時返回 `409 Conflict`,前端需提示使用者重新載入資料
4. **統一攔截器**: 既有專案已實作 Axios 攔截器(`src/http/axios.ts`),可擴充處理訂單管理特有的業務錯誤碼

**Alternatives Considered**:
- ❌ **在每個 API 呼叫處手動處理錯誤**: 會導致重複代碼,不利維護
- ❌ **忽略業務邏輯錯誤碼,僅依賴 HTTP 狀態碼**: 無法提供細緻的錯誤提示,不符合 UX First 原則

**Implementation Guidelines**:
```typescript
// types.ts - API 回應型別
export interface ApiResponse<T = any> {
  success: boolean
  code: string  // 業務邏輯代碼(如 VALIDATION_ERROR, CONCURRENT_UPDATE_CONFLICT)
  message: string
  data: T | null
  timestamp: string
  traceId: string
  errors?: Record<string, string[]>  // 驗證錯誤詳情
}

// composables/useOrderManagement.ts - 錯誤處理範例
async function fetchOrders(): Promise<void> {
  loading.value = true
  try {
    const response = await getOrderList(params)
    if (response.success && response.data) {
      orders.value = response.data.items || []
      pagination.value.total = response.data.totalCount || 0
    } else {
      // 處理業務邏輯錯誤
      ElMessage.error(response.message || '查詢訂單失敗')
    }
  } catch (error: any) {
    // 全域攔截器已處理通用錯誤,此處處理特殊情況
    console.error('fetchOrders error:', error)
  } finally {
    loading.value = false
  }
}

// 並發衝突處理
async function handleUpdate(order: SalesOrder): Promise<void> {
  const response = await updateOrder(order.id, updateData)
  if (response.code === 'CONCURRENT_UPDATE_CONFLICT') {
    ElMessageBox.confirm(
      '訂單資料已被其他使用者修改,是否重新載入最新資料?',
      '並發衝突',
      { type: 'warning' }
    ).then(() => {
      fetchOrders()  // 重新載入列表
    })
    return
  }
  // ...其他處理
}
```

**References**:
- OpenAPI 規範: `/api/sales-orders` 系列 API 回應格式
- 憲章原則: VII. Backend API Contract Compliance
- 既有實作: `src/http/axios.ts` (全域攔截器)

---

### Topic 2: 訂單編號生成規則與單日上限處理

**Decision**: 前端不生成訂單編號,由後端 API 自動生成;前端需處理 `DAILY_ORDER_LIMIT_REACHED` 錯誤並提供清晰警告

**Rationale**:
1. **後端權威**: 訂單編號格式為 `RYO + YYYYMMDD + 流水號(001-999)`,由後端資料庫序列生成以確保唯一性與並發安全性
2. **單日上限警告**: 根據 Clarifications (Session 2026-02-06-01),系統在單日訂單數達 900 筆(90% 閾值)時開始顯示警告,999 筆時阻止建立並拋出 `DAILY_ORDER_LIMIT_REACHED` 錯誤
3. **使用者體驗**: 前端需在建立訂單成功後顯示訂單編號,並在接近/達到上限時提供預警訊息

**Alternatives Considered**:
- ❌ **前端預先生成訂單編號**: 無法保證並發唯一性,違反後端 API 契約
- ❌ **忽略 900 筆警告閾值**: 不符合功能規格(FR-013)

**Implementation Guidelines**:
```typescript
// types.ts
export interface CreateSalesOrderRequest {
  // 訂單編號由後端自動生成,前端不提供此欄位
  orderType: 'SPOT_PURCHASE' | 'PRE_ORDER'
  customerId: string
  orderItems: CreateSalesOrderItemRequest[]
  deliveryMethod: 'PICKUP' | 'HOME_DELIVERY' | 'STORE_PICKUP' | 'PLATFORM'
  deliveryInfo: any
  shippingFee?: number
  remarks?: string
}

export interface SalesOrderResponse {
  id: string
  orderNumber: string  // 後端生成,格式如 "RYO20260204001"
  orderDate: string
  // ...其他欄位
}

// composables/useOrderForm.ts
async function submitOrder(): Promise<boolean> {
  try {
    const response = await createOrder(formData.value)
    
    if (response.success && response.data) {
      ElMessage.success(`訂單建立成功！訂單編號：${response.data.orderNumber}`)
      return true
    } else if (response.code === 'DAILY_ORDER_LIMIT_REACHED') {
      // 達到 999 筆上限
      ElMessageBox.alert(
        '當日訂單數已達上限 (999 筆),請聯繫系統管理員處理或等待隔日再試。',
        '訂單數量上限',
        { type: 'error', confirmButtonText: '我知道了' }
      )
      return false
    } else if (response.code === 'DAILY_ORDER_LIMIT_WARNING') {
      // 達到 900 筆警告閾值(假設後端提供此代碼)
      ElNotification.warning({
        title: '接近單日訂單上限',
        message: `當日訂單數已達 ${response.data?.currentCount || 'N/A'} 筆,接近上限 999 筆。`,
        duration: 5000
      })
      return true
    }
    
    ElMessage.error(response.message || '訂單建立失敗')
    return false
  } catch (error) {
    console.error('submitOrder error:', error)
    return false
  }
}
```

**References**:
- 功能規格: FR-013 (訂單編號生成規則)
- Clarifications: Session 2026-02-06-01 (單日上限警告機制)
- OpenAPI 規範: `POST /api/sales-orders` 回應格式

---

### Topic 3: 收件資訊動態驗證策略

**Decision**: 依據 `deliveryMethod` 動態切換表單欄位與驗證規則,使用 Element Plus 的條件渲染與 FormRules 動態更新機制

**Rationale**:
1. **四種收件方式差異化驗證**:
   - **PICKUP(自取)**: 必填自取地點(字串)與自取時間(DateTime)
   - **HOME_DELIVERY(宅配)**: 必填收件人姓名(1-50 字元)、電話(10 位數字)、地址(10-200 字元)
   - **STORE_PICKUP(超取)**: 必填超商門市資訊(純文字,1-200 字元)、取貨人姓名(1-50 字元)、取貨人電話(10 位數字)
   - **PLATFORM(平台物流)**: 不驗證收件資訊(由平台處理)
2. **前後端雙重驗證**: 根據 FR-020,前端必須進行即時驗證並阻止提交無效資料,後端再次驗證以確保資料完整性
3. **使用者體驗**: 動態顯示/隱藏欄位,避免無關資訊干擾使用者,驗證錯誤即時顯示於表單項目下方

**Alternatives Considered**:
- ❌ **顯示所有收件欄位並根據選擇標記必填**: 會導致表單過長且混亂
- ❌ **僅後端驗證**: 不符合 UX First 原則,使用者需等待 API 回應才能看到錯誤

**Implementation Guidelines**:
```typescript
// types.ts - 收件資訊型別定義
export interface PickupInfo {
  pickupLocation: string  // 自取地點
  pickupTime: string  // ISO 8601 格式
}

export interface HomeDeliveryInfo {
  recipientName: string
  recipientPhone: string
  recipientAddress: string
}

export interface StorePickupInfo {
  storeInfo: string  // 純文字,不串接超商 API
  recipientName: string
  recipientPhone: string
}

// 平台物流無需額外資訊

// composables/useShippingInfo.ts
import type { FormRules } from 'element-plus'
import { ref, watch, computed } from 'vue'

export function useShippingInfo() {
  const deliveryMethod = ref<'PICKUP' | 'HOME_DELIVERY' | 'STORE_PICKUP' | 'PLATFORM'>('PICKUP')
  const deliveryInfo = ref<any>({})
  
  // 動態驗證規則
  const deliveryInfoRules = computed<FormRules>(() => {
    switch (deliveryMethod.value) {
      case 'PICKUP':
        return {
          pickupLocation: [
            { required: true, message: '請輸入自取地點', trigger: 'blur' },
            { min: 1, max: 200, message: '自取地點長度為 1-200 字元', trigger: 'blur' }
          ],
          pickupTime: [
            { required: true, message: '請選擇自取時間', trigger: 'change' }
          ]
        }
      
      case 'HOME_DELIVERY':
        return {
          recipientName: [
            { required: true, message: '請輸入收件人姓名', trigger: 'blur' },
            { min: 1, max: 50, message: '姓名長度為 1-50 字元', trigger: 'blur' }
          ],
          recipientPhone: [
            { required: true, message: '請輸入收件人電話', trigger: 'blur' },
            { pattern: /^09\d{8}$/, message: '請輸入有效的 10 位手機號碼(09 開頭)', trigger: 'blur' }
          ],
          recipientAddress: [
            { required: true, message: '請輸入收件地址', trigger: 'blur' },
            { min: 10, max: 200, message: '地址長度為 10-200 字元', trigger: 'blur' }
          ]
        }
      
      case 'STORE_PICKUP':
        return {
          storeInfo: [
            { required: true, message: '請輸入超商門市資訊', trigger: 'blur' },
            { min: 1, max: 200, message: '門市資訊長度為 1-200 字元', trigger: 'blur' }
          ],
          recipientName: [
            { required: true, message: '請輸入取貨人姓名', trigger: 'blur' },
            { min: 1, max: 50, message: '姓名長度為 1-50 字元', trigger: 'blur' }
          ],
          recipientPhone: [
            { required: true, message: '請輸入取貨人電話', trigger: 'blur' },
            { pattern: /^09\d{8}$/, message: '請輸入有效的 10 位手機號碼', trigger: 'blur' }
          ]
        }
      
      case 'PLATFORM':
      default:
        return {}  // 平台物流無需驗證
    }
  })
  
  // 監聽收件方式變更,重置收件資訊
  watch(deliveryMethod, (newMethod) => {
    deliveryInfo.value = {}
    // 載入預設運費(從配置檔)
    loadDefaultShippingFee(newMethod)
  })
  
  function loadDefaultShippingFee(method: string): number {
    const shippingFeeConfig = {
      PICKUP: 0,
      HOME_DELIVERY: 60,
      STORE_PICKUP: 60,
      PLATFORM: 0
    }
    return shippingFeeConfig[method] || 0
  }
  
  return {
    deliveryMethod,
    deliveryInfo,
    deliveryInfoRules,
    loadDefaultShippingFee
  }
}
```

**Vue Template Example**:
```vue
<template>
  <el-form-item label="收件方式" prop="deliveryMethod">
    <el-select v-model="deliveryMethod">
      <el-option label="自取" value="PICKUP" />
      <el-option label="宅配" value="HOME_DELIVERY" />
      <el-option label="超商取貨" value="STORE_PICKUP" />
      <el-option label="平台物流" value="PLATFORM" />
    </el-select>
  </el-form-item>

  <!-- 動態顯示收件資訊欄位 -->
  <template v-if="deliveryMethod === 'PICKUP'">
    <el-form-item label="自取地點" prop="deliveryInfo.pickupLocation" :rules="deliveryInfoRules.pickupLocation">
      <el-input v-model="deliveryInfo.pickupLocation" placeholder="請輸入自取地點" />
    </el-form-item>
    <el-form-item label="自取時間" prop="deliveryInfo.pickupTime" :rules="deliveryInfoRules.pickupTime">
      <el-date-picker v-model="deliveryInfo.pickupTime" type="datetime" placeholder="選擇日期時間" />
    </el-form-item>
  </template>

  <template v-else-if="deliveryMethod === 'HOME_DELIVERY'">
    <el-form-item label="收件人姓名" prop="deliveryInfo.recipientName" :rules="deliveryInfoRules.recipientName">
      <el-input v-model="deliveryInfo.recipientName" placeholder="請輸入收件人姓名" />
    </el-form-item>
    <el-form-item label="收件人電話" prop="deliveryInfo.recipientPhone" :rules="deliveryInfoRules.recipientPhone">
      <el-input v-model="deliveryInfo.recipientPhone" placeholder="09XXXXXXXX" />
    </el-form-item>
    <el-form-item label="收件地址" prop="deliveryInfo.recipientAddress" :rules="deliveryInfoRules.recipientAddress">
      <el-input v-model="deliveryInfo.recipientAddress" type="textarea" placeholder="請輸入完整地址" />
    </el-form-item>
  </template>

  <!-- ...其他收件方式欄位 -->
</template>
```

**References**:
- 功能規格: FR-006 至 FR-009 (收件方式差異化驗證)
- 功能規格: FR-020 (前後端雙重驗證)
- Clarifications: Session 2026-02-06-02 (收件資訊儲存結構)
- Element Plus FormRules 文檔

---

### Topic 4: 付款記錄管理與累積金額計算策略

**Decision**: 前端實作即時付款金額驗證與累積金額顯示,使用 computed 屬性計算剩餘應付金額,阻止超額付款

**Rationale**:
1. **即時驗證需求**: 根據 FR-024 與 Clarifications (Session 2026-02-06-01),當使用者輸入會導致累積金額超過訂單總額的付款金額時,必須立即顯示內嵌驗證錯誤訊息並阻止表單提交
2. **自動狀態更新**: 根據 Clarifications (Session 2026-02-04-02),系統在新增付款記錄後自動更新付款狀態:
   - 累積金額 = 0 → `UNPAID`
   - 0 < 累積金額 < 訂單總額 → `PARTIAL`
   - 累積金額 = 訂單總額 → `PAID`
3. **防止超額付款**: 後端 API 會在新增付款記錄時驗證累積金額,前端需提前攔截以提升 UX

**Alternatives Considered**:
- ❌ **僅在提交後由後端驗證**: 使用者需等待 API 回應才能看到錯誤,體驗不佳
- ❌ **允許超額付款並手動調整**: 違反業務規則 FR-024

**Implementation Guidelines**:
```typescript
// types.ts
export interface PaymentRecord {
  id: string
  paymentDate: string
  paymentAmount: number
  paymentMethod: 'STORE_CASH' | 'BANK_TRANSFER' | 'ONLINE_CARD' | 'INSTALLMENT'
  bankAccountLastFive?: string  // 僅現金匯款時填寫
  createdAt: string
}

export interface AddPaymentRecordRequest {
  paymentDate: string
  paymentAmount: number
  paymentMethod: string
  bankAccountLastFive?: string
}

// composables/usePaymentRecords.ts
import { ref, computed } from 'vue'
import type { FormRules } from 'element-plus'

export function usePaymentRecords(orderTotalAmount: Ref<number>) {
  const paymentRecords = ref<PaymentRecord[]>([])
  const newPaymentAmount = ref<number>(0)
  
  /** 累積已付款金額 */
  const totalPaidAmount = computed<number>(() => {
    return paymentRecords.value.reduce((sum, record) => sum + record.paymentAmount, 0)
  })
  
  /** 剩餘應付金額 */
  const remainingAmount = computed<number>(() => {
    return Math.max(0, orderTotalAmount.value - totalPaidAmount.value)
  })
  
  /** 付款金額驗證規則(即時驗證) */
  const paymentAmountRules: FormRules = {
    paymentAmount: [
      { required: true, message: '請輸入付款金額', trigger: 'blur' },
      { 
        type: 'number', 
        min: 0.01, 
        message: '付款金額必須大於 0', 
        trigger: 'blur' 
      },
      {
        validator: (_rule, value, callback) => {
          const inputAmount = Number(value)
          if (isNaN(inputAmount)) {
            callback(new Error('請輸入有效的數字'))
            return
          }
          
          // 檢查是否超過剩餘應付金額
          if (inputAmount > remainingAmount.value) {
            callback(new Error(`付款金額不得超過剩餘應付金額 ${remainingAmount.value} 元`))
            return
          }
          
          callback()
        },
        trigger: 'blur'
      }
    ]
  }
  
  /** 新增付款記錄 */
  async function addPaymentRecord(orderId: string, request: AddPaymentRecordRequest): Promise<boolean> {
    try {
      const response = await createPaymentRecord(orderId, request)
      
      if (response.success && response.data) {
        paymentRecords.value.push(response.data)
        ElMessage.success('付款記錄新增成功')
        
        // 檢查是否已完全付款
        if (totalPaidAmount.value >= orderTotalAmount.value) {
          ElNotification.success({
            title: '訂單已完全付款',
            message: `累積付款金額：${totalPaidAmount.value} 元`,
            duration: 3000
          })
        }
        
        return true
      } else {
        ElMessage.error(response.message || '新增付款記錄失敗')
        return false
      }
    } catch (error) {
      console.error('addPaymentRecord error:', error)
      return false
    }
  }
  
  /** 修改付款記錄(僅銀行末五碼) */
  async function updatePaymentRecord(
    orderId: string, 
    paymentId: string, 
    bankAccountLastFive: string
  ): Promise<boolean> {
    try {
      const response = await updatePaymentRecordApi(orderId, paymentId, { bankAccountLastFive })
      
      if (response.success) {
        // 更新本地記錄
        const record = paymentRecords.value.find(r => r.id === paymentId)
        if (record) {
          record.bankAccountLastFive = bankAccountLastFive
        }
        ElMessage.success('銀行末五碼更新成功')
        return true
      } else {
        ElMessage.error(response.message || '更新失敗')
        return false
      }
    } catch (error) {
      console.error('updatePaymentRecord error:', error)
      return false
    }
  }
  
  return {
    paymentRecords,
    newPaymentAmount,
    totalPaidAmount,
    remainingAmount,
    paymentAmountRules,
    addPaymentRecord,
    updatePaymentRecord
  }
}
```

**Vue Template Example**:
```vue
<template>
  <el-dialog title="新增付款記錄" v-model="dialogVisible">
    <el-form :model="paymentForm" :rules="paymentAmountRules" ref="paymentFormRef">
      <!-- 顯示訂單總額與剩餘應付金額 -->
      <el-alert type="info" :closable="false" class="mb-4">
        <template #default>
          <div>訂單總額：{{ orderTotalAmount }} 元</div>
          <div>已付金額：{{ totalPaidAmount }} 元</div>
          <div><strong>剩餘應付：{{ remainingAmount }} 元</strong></div>
        </template>
      </el-alert>
      
      <el-form-item label="付款金額" prop="paymentAmount">
        <el-input-number 
          v-model="paymentForm.paymentAmount" 
          :min="0.01" 
          :max="remainingAmount"
          :precision="0"
          placeholder="請輸入付款金額" 
        />
        <span class="ml-2 text-gray-500">元</span>
      </el-form-item>
      
      <!-- ...其他欄位 -->
    </el-form>
  </el-dialog>
</template>
```

**References**:
- 功能規格: FR-024 (付款金額驗證)
- Clarifications: Session 2026-02-04-02 (自動狀態更新機制)
- Clarifications: Session 2026-02-06-01 (即時驗證需求)
- OpenAPI 規範: `POST /api/sales-orders/{id}/payment-records`

---

### Topic 5: Excel 匯出實作策略

**Decision**: 前端使用 `xlsx` 套件(已列於專案依賴)實作 Excel 匯出功能,呼叫 `/api/sales-orders/export` 取得資料後於瀏覽器端生成檔案

**Rationale**:
1. **前端職責**: 根據 FR-040 與 Clarifications (Session 2026-02-04-01),後端僅提供資料 API,檔案格式化(CSV/Excel/PDF)由前端處理
2. **既有依賴**: 專案 `package.json` 已包含 `xlsx` 套件,可直接使用無需額外安裝
3. **使用者體驗**: 前端匯出可避免大檔案下載等待時間,使用者可立即取得檔案並選擇儲存位置
4. **效能考量**: 根據 NFR-013,API 支援分頁與篩選,前端可依需求匯出部分或全部訂單(最多 1000 筆,匯出時間 < 5 秒)

**Alternatives Considered**:
- ❌ **後端生成 Excel 檔案並返回二進位流**: 需額外實作後端邏輯,且大檔案下載影響使用者體驗
- ❌ **使用 CSV 格式**: Excel 格式支援更豐富的樣式與多工作表,更適合業務需求

**Implementation Guidelines**:
```typescript
// composables/useExportExcel.ts
import * as XLSX from 'xlsx'
import type { SalesOrderExportDto } from '../types'

export function useExportExcel() {
  const loading = ref(false)
  
  /**
   * 匯出訂單報表為 Excel 檔案
   * @param filters 篩選條件(可選)
   */
  async function exportOrders(filters?: {
    orderStatus?: string
    paymentStatus?: string
    orderDateStart?: string
    orderDateEnd?: string
  }): Promise<void> {
    loading.value = true
    try {
      // 呼叫後端 API 取得匯出資料
      const response = await getOrdersForExport(filters)
      
      if (!response.success || !response.data || response.data.length === 0) {
        ElMessage.warning('無符合條件的訂單可匯出')
        return
      }
      
      const orders: SalesOrderExportDto[] = response.data
      
      // 轉換為 Excel 工作表資料格式
      const worksheetData = orders.map(order => ({
        '訂單編號': order.orderNumber,
        '客戶名稱': order.customerName,
        '商品名稱': order.productName,
        '售出金額': order.totalAmount,
        '付款狀態': formatPaymentStatus(order.paymentStatus),
        '訂單狀態': formatOrderStatus(order.orderStatus),
        '出貨狀態': formatShippingStatus(order.shippingStatus),
        '建立日期': formatDate(order.createdAt),
        '操作者': order.createdByName
      }))
      
      // 建立工作簿與工作表
      const worksheet = XLSX.utils.json_to_sheet(worksheetData)
      const workbook = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(workbook, worksheet, '訂單報表')
      
      // 設定欄寬(可選)
      const columnWidths = [
        { wch: 15 },  // 訂單編號
        { wch: 12 },  // 客戶名稱
        { wch: 20 },  // 商品名稱
        { wch: 12 },  // 售出金額
        { wch: 10 },  // 付款狀態
        { wch: 10 },  // 訂單狀態
        { wch: 10 },  // 出貨狀態
        { wch: 18 },  // 建立日期
        { wch: 10 }   // 操作者
      ]
      worksheet['!cols'] = columnWidths
      
      // 生成檔案名稱(包含時間戳)
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
      const fileName = `訂單報表_${timestamp}.xlsx`
      
      // 匯出檔案
      XLSX.writeFile(workbook, fileName)
      
      ElMessage.success(`已成功匯出 ${orders.length} 筆訂單`)
    } catch (error) {
      console.error('exportOrders error:', error)
      ElMessage.error('匯出失敗,請稍後再試')
    } finally {
      loading.value = false
    }
  }
  
  /** 格式化付款狀態 */
  function formatPaymentStatus(status: string): string {
    const statusMap: Record<string, string> = {
      'UNPAID': '未付款',
      'PARTIAL': '部分付款',
      'PAID': '已付款'
    }
    return statusMap[status] || status
  }
  
  /** 格式化訂單狀態 */
  function formatOrderStatus(status: string): string {
    const statusMap: Record<string, string> = {
      'PLACED': '訂單成立',
      'COMPLETED': '已完成',
      'CANCELLED': '已取消'
    }
    return statusMap[status] || status
  }
  
  /** 格式化出貨狀態 */
  function formatShippingStatus(status: string): string {
    const statusMap: Record<string, string> = {
      'NOT_SHIPPED': '未出貨',
      'SHIPPED': '已出貨'
    }
    return statusMap[status] || status
  }
  
  /** 格式化日期 */
  function formatDate(dateString: string): string {
    return new Date(dateString).toLocaleString('zh-TW', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    })
  }
  
  return {
    loading,
    exportOrders
  }
}

// apis/sales-order.ts - API 定義
export async function getOrdersForExport(filters?: {
  orderStatus?: string
  paymentStatus?: string
  orderDateStart?: string
  orderDateEnd?: string
}): Promise<ApiResponse<SalesOrderExportDto[]>> {
  return request({
    url: '/api/sales-orders/export',
    method: 'GET',
    params: filters
  })
}
```

**Usage in Page Component**:
```vue
<template>
  <div class="toolbar">
    <el-button 
      type="success" 
      :icon="Download" 
      :loading="exportLoading"
      @click="handleExport"
      v-permission="[ORDER_PERMISSIONS.EXPORT]"
    >
      匯出報表
    </el-button>
  </div>
</template>

<script setup lang="ts">
import { useExportExcel } from './composables/useExportExcel'

const { loading: exportLoading, exportOrders } = useExportExcel()

function handleExport(): void {
  // 可傳遞當前篩選條件
  exportOrders({
    orderStatus: searchFilters.value.orderStatus,
    paymentStatus: searchFilters.value.paymentStatus,
    orderDateStart: searchFilters.value.dateStart,
    orderDateEnd: searchFilters.value.dateEnd
  })
}
</script>
```

**References**:
- 功能規格: FR-040 (報表匯出需求)
- Clarifications: Session 2026-02-04-01 (前端職責說明)
- NFR-013 (效能目標)
- OpenAPI 規範: `GET /api/sales-orders/export`
- xlsx 套件文檔: https://docs.sheetjs.com/

---

### Topic 6: 狀態管理模式與樂觀鎖定實作

**Decision**: 使用 Vue 3 Composition API 的 `ref` 與 `computed` 管理本地狀態,配合後端樂觀鎖定機制(`version` 欄位)處理並發更新

**Rationale**:
1. **簡化架構**: 根據憲章原則 II (Simplified Architecture),避免引入 Pinia store 除非狀態需跨多個頁面共享;訂單管理模組的狀態僅在單一頁面內使用,使用 Composition API 即可滿足需求
2. **樂觀鎖定機制**: 根據 FR-030 與 Clarifications (Session 2026-02-04-01),所有修改操作需攜帶當前 `version` 欄位,後端檢測版本衝突時返回 `409 Conflict` 與 `CONCURRENT_UPDATE_CONFLICT` 代碼,前端需提示使用者重新載入
3. **即時性**: 使用 `computed` 屬性計算衍生狀態(如剩餘應付金額、訂單總金額),確保資料一致性

**Alternatives Considered**:
- ❌ **使用 Pinia 全域 store**: 增加複雜度且違反 Simplified Architecture 原則
- ❌ **不處理並發衝突**: 可能導致資料覆蓋,違反業務規則

**Implementation Guidelines**:
```typescript
// composables/useOrderManagement.ts
import { ref, computed } from 'vue'
import type { SalesOrderResponse, SalesOrderListParams } from '../types'

export function useOrderManagement() {
  /** 訂單列表 */
  const orders = ref<SalesOrderResponse[]>([])
  
  /** 載入狀態 */
  const loading = ref(false)
  
  /** 分頁資訊 */
  const pagination = ref({
    pageNumber: 1,
    pageSize: 20,
    total: 0
  })
  
  /** 搜尋條件 */
  const searchFilters = ref<Partial<SalesOrderListParams>>({})
  
  /**
   * 查詢訂單列表
   */
  async function fetchOrders(): Promise<void> {
    loading.value = true
    try {
      const params: SalesOrderListParams = {
        pageNumber: pagination.value.pageNumber,
        pageSize: pagination.value.pageSize,
        ...searchFilters.value
      }
      
      const response = await getOrderList(params)
      
      if (response.success && response.data) {
        orders.value = response.data  // 後端使用扁平分頁格式
        pagination.value.total = response.totalCount || 0
      } else {
        ElMessage.error(response.message || '查詢訂單失敗')
      }
    } catch (error) {
      console.error('fetchOrders error:', error)
    } finally {
      loading.value = false
    }
  }
  
  /**
   * 刪除訂單
   */
  async function handleDelete(order: SalesOrderResponse): Promise<void> {
    try {
      await ElMessageBox.confirm(
        `確定要刪除訂單 ${order.orderNumber} 嗎？此操作無法復原。`,
        '確認刪除',
        { type: 'warning' }
      )
      
      const response = await deleteOrder(order.id)
      
      if (response.success) {
        ElMessage.success('訂單刪除成功')
        await fetchOrders()  // 重新載入列表
      } else {
        ElMessage.error(response.message || '刪除失敗')
      }
    } catch (error: any) {
      if (error !== 'cancel') {
        console.error('handleDelete error:', error)
      }
    }
  }
  
  /**
   * 處理並發衝突錯誤
   */
  function handleConcurrentConflict(): void {
    ElMessageBox.alert(
      '訂單資料已被其他使用者修改,請重新載入最新資料後再試。',
      '並發衝突',
      { type: 'warning', confirmButtonText: '重新載入' }
    ).then(() => {
      fetchOrders()
    })
  }
  
  return {
    orders,
    loading,
    pagination,
    searchFilters,
    fetchOrders,
    handleDelete,
    handleConcurrentConflict
  }
}

// composables/useOrderForm.ts - 修改訂單時的樂觀鎖定處理
export function useOrderForm() {
  const formData = ref<UpdateSalesOrderRequest>({
    orderItems: [],
    deliveryMethod: 'PICKUP',
    deliveryInfo: {},
    shippingFee: 0,
    remarks: '',
    version: 0  // 從伺服器取得的當前版本號
  })
  
  /**
   * 提交修改
   */
  async function submitUpdate(orderId: string): Promise<boolean> {
    try {
      const response = await updateOrder(orderId, formData.value)
      
      if (response.success && response.data) {
        ElMessage.success('訂單更新成功')
        // 更新本地 version 為最新值
        formData.value.version = response.data.version
        return true
      } else if (response.code === 'CONCURRENT_UPDATE_CONFLICT') {
        // 並發衝突處理
        ElMessageBox.alert(
          '訂單資料已被其他使用者修改,請重新載入最新資料後再試。',
          '並發衝突',
          { type: 'warning', confirmButtonText: '我知道了' }
        )
        return false
      } else {
        ElMessage.error(response.message || '更新失敗')
        return false
      }
    } catch (error) {
      console.error('submitUpdate error:', error)
      return false
    }
  }
  
  return {
    formData,
    submitUpdate
  }
}
```

**References**:
- 憲章原則: II. Simplified Architecture
- 功能規格: FR-030 (樂觀鎖定機制)
- Clarifications: Session 2026-02-04-01 (並發控制策略)
- OpenAPI 規範: 409 Conflict 錯誤處理

---

### Topic 7: 客戶選擇器與快速新增客戶整合

**Decision**: 使用既有客戶管理模組的 API (`/api/customers/search`) 實作客戶搜尋下拉選單,整合快速新增客戶功能並立即可用

**Rationale**:
1. **複用既有功能**: 專案已有客戶管理模組(`src/pages/customer-management`),可複用其 API 與型別定義,遵循 DRY 原則
2. **即時可用**: 根據 Clarifications (Session 2026-02-06-02),後端建立客戶後在回應中返回完整客戶物件(包含 ID),前端直接使用此物件更新訂單表單的客戶選擇器,無需重新呼叫客戶列表 API
3. **使用者體驗**: 支援關鍵字搜尋(姓名/電話/Email/身分證字號模糊比對) + 快速新增,減少使用者操作步驟

**Alternatives Considered**:
- ❌ **新增客戶後重新呼叫搜尋 API**: 增加網路請求延遲,使用者體驗不佳
- ❌ **不支援快速新增客戶**: 違反功能規格 FR-003

**Implementation Guidelines**:
```typescript
// composables/useCustomerSearch.ts
import { ref, watch } from 'vue'
import { debounce } from 'lodash-es'
import type { CustomerResponse } from '@@/pages/customer-management/types'
import { searchCustomers } from '@@/pages/customer-management/apis/customer'

export function useCustomerSearch() {
  const keyword = ref('')
  const customers = ref<CustomerResponse[]>([])
  const loading = ref(false)
  const selectedCustomerId = ref<string>('')
  
  /** 搜尋客戶(防抖 500ms) */
  const debouncedSearch = debounce(async () => {
    if (!keyword.value || keyword.value.length < 2) {
      customers.value = []
      return
    }
    
    loading.value = true
    try {
      const response = await searchCustomers({
        pageNumber: 1,
        pageSize: 20,
        keyword: keyword.value
      })
      
      if (response.success && response.data) {
        customers.value = response.data
      } else {
        customers.value = []
      }
    } catch (error) {
      console.error('searchCustomers error:', error)
      customers.value = []
    } finally {
      loading.value = false
    }
  }, 500)
  
  watch(keyword, () => {
    debouncedSearch()
  })
  
  /**
   * 快速新增客戶並自動選擇
   * @param customerData 新增客戶請求資料
   * @returns 是否成功
   */
  async function quickAddCustomer(customerData: CreateCustomerRequest): Promise<boolean> {
    try {
      const response = await createCustomer(customerData)
      
      if (response.success && response.data) {
        // 直接使用後端返回的完整客戶物件
        const newCustomer = response.data
        
        // 將新客戶加入搜尋結果列表(頂部)
        customers.value.unshift(newCustomer)
        
        // 自動選擇新建客戶
        selectedCustomerId.value = newCustomer.id
        
        ElMessage.success(`客戶 ${newCustomer.name} 建立成功並已選擇`)
        return true
      } else {
        ElMessage.error(response.message || '建立客戶失敗')
        return false
      }
    } catch (error) {
      console.error('quickAddCustomer error:', error)
      return false
    }
  }
  
  return {
    keyword,
    customers,
    loading,
    selectedCustomerId,
    quickAddCustomer
  }
}
```

**Vue Component Example (CustomerSelector.vue)**:
```vue
<template>
  <div class="customer-selector">
    <el-select
      v-model="selectedCustomerId"
      filterable
      remote
      reserve-keyword
      placeholder="請輸入客戶姓名/電話/身分證字號搜尋"
      :remote-method="handleSearch"
      :loading="loading"
      clearable
    >
      <el-option
        v-for="customer in customers"
        :key="customer.id"
        :label="`${customer.name} (${customer.phoneNumber})`"
        :value="customer.id"
      >
        <div class="flex justify-between items-center">
          <span>{{ customer.name }}</span>
          <span class="text-gray-500 text-sm">{{ customer.phoneNumber }}</span>
        </div>
      </el-option>
      
      <template #footer>
        <el-button 
          type="primary" 
          text 
          @click="handleShowAddCustomerDialog"
          class="w-full"
        >
          + 新增客戶
        </el-button>
      </template>
    </el-select>
    
    <!-- 快速新增客戶對話框 -->
    <el-dialog title="新增客戶" v-model="addCustomerDialogVisible" width="500px">
      <CustomerQuickAddForm 
        ref="quickAddFormRef" 
        @success="handleAddCustomerSuccess" 
        @cancel="addCustomerDialogVisible = false" 
      />
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useCustomerSearch } from '../composables/useCustomerSearch'
import CustomerQuickAddForm from './CustomerQuickAddForm.vue'

const { keyword, customers, loading, selectedCustomerId, quickAddCustomer } = useCustomerSearch()

const addCustomerDialogVisible = ref(false)
const quickAddFormRef = ref<InstanceType<typeof CustomerQuickAddForm>>()

function handleSearch(query: string): void {
  keyword.value = query
}

function handleShowAddCustomerDialog(): void {
  addCustomerDialogVisible.value = true
}

function handleAddCustomerSuccess(customer: CustomerResponse): void {
  addCustomerDialogVisible.value = false
  // 使用 composable 自動選擇新建客戶
  customers.value.unshift(customer)
  selectedCustomerId.value = customer.id
}
</script>
```

**References**:
- 功能規格: FR-002 (客戶搜尋), FR-003 (新增客戶)
- Clarifications: Session 2026-02-06-02 (新建客戶立即可用策略)
- 既有實作: `src/pages/customer-management/apis/customer.ts`
- OpenAPI 規範: `GET /api/customers/search`, `POST /api/customers`

---

## Summary & Recommendations

### Key Decisions Made

1. **API 整合**: 嚴格遵循 `ApiResponseModel<T>` 格式,使用統一錯誤攔截器處理業務邏輯錯誤碼
2. **訂單編號**: 由後端自動生成,前端處理單日上限警告(900 筆)與阻止(999 筆)
3. **收件資訊驗證**: 依 `deliveryMethod` 動態切換表單欄位與驗證規則,前後端雙重驗證
4. **付款記錄管理**: 前端即時驗證付款金額,使用 computed 計算剩餘應付金額,阻止超額付款
5. **Excel 匯出**: 使用 `xlsx` 套件於前端生成檔案,呼叫 `/api/sales-orders/export` 取得資料
6. **狀態管理**: 使用 Composition API 的 `ref`/`computed`,配合後端樂觀鎖定(`version`)處理並發
7. **客戶選擇器**: 複用既有客戶管理 API,支援搜尋與快速新增並立即可用

### Implementation Priorities

**Phase 1 (高優先級)**:
- ✅ API 整合與錯誤處理機制
- ✅ 基礎資料模型定義(SalesOrder, OrderItem, PaymentRecord)
- ✅ 訂單建立表單(含客戶選擇器、商品項目管理、收件資訊動態驗證)
- ✅ 訂單列表查詢與分頁

**Phase 2 (中優先級)**:
- ⏳ 付款記錄管理(新增/修改/列表顯示)
- ⏳ 訂單修改功能(含樂觀鎖定處理)
- ⏳ 訂單狀態/付款狀態/出貨狀態更新
- ⏳ Excel 匯出功能

**Phase 3 (低優先級)**:
- ⏳ 出貨單列印/下載
- ⏳ 效能優化與快取策略
- ⏳ 單元測試覆蓋

### Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| 並發更新衝突頻繁發生 | 實作明確的衝突提示與重新載入流程,記錄衝突次數供後續分析 |
| 付款金額驗證規則複雜 | 使用 computed 屬性即時計算,提供視覺化剩餘金額顯示 |
| 收件資訊驗證邏輯分散 | 集中於 `useShippingInfo` composable,統一管理驗證規則 |
| Excel 匯出效能問題 | 限制單次匯出最多 1000 筆,超過時提示分批匯出 |
| 客戶搜尋效能 | 使用 debounce (500ms),限制最少輸入 2 字元才觸發搜尋 |

### Next Steps

1. ✅ **完成 research.md**(本文件)
2. ⏳ 生成 `data-model.md`(Phase 1)
3. ⏳ 生成 `contracts/api-contracts.md`(Phase 1)
4. ⏳ 生成 `quickstart.md`(Phase 1)
5. ⏳ 執行 `update-agent-context.ps1` 更新 Copilot 背景資訊(Phase 1)
6. ⏳ 重新驗證憲章原則(Phase 1)

---

**Research Completed**: 2026-02-06 | **Author**: GitHub Copilot | **Reviewed By**: Development Team

# Quickstart Guide: 訂單管理模組開發指南

**Date**: 2026-02-06 | **Branch**: `009-order-management` | **Target**: 前端開發者

## Overview

本指南協助開發者快速上手訂單管理模組的開發,涵蓋環境設置、專案結構、開發流程、常見模式與除錯技巧。

---

## Prerequisites (前置需求)

### Required Knowledge
- Vue 3 Composition API 基礎
- TypeScript 型別系統
- Element Plus 元件庫使用
- RESTful API 概念
- Git 版本控制

### Development Environment
- Node.js: v18.x 以上
- pnpm: v8.x 以上
- VS Code(推薦擴充套件: Volar, ESLint, Prettier)
- Chrome DevTools

---

## Quick Start (5 分鐘啟動)

### 1. Clone 與安裝

```bash
# Clone repository
git clone <repository-url>
cd real-you-front-end

# 切換到訂單管理分支
git checkout 009-order-management

# 安裝依賴
pnpm install
```

### 2. 環境設定

建立 `.env.local` 檔案(複製 `.env.example`):

```bash
# .env.local
VITE_API_BASE_URL=http://localhost:5176
VITE_APP_TITLE=Real You Admin
```

### 3. 啟動開發伺服器

```bash
# 啟動前端開發伺服器
pnpm dev

# 瀏覽器開啟 http://localhost:5173
```

### 4. 驗證後端 API 連線

訪問 http://localhost:5176/swagger 確認後端 API 可用

---

## Project Structure (專案結構)

### Module Directory Layout

```text
src/pages/order-management/
├── index.vue                    # 主頁面(訂單列表)
├── types.ts                     # 所有型別定義
├── components/
│   ├── OrderListTable.vue      # 訂單列表表格
│   ├── OrderSearchForm.vue     # 搜尋篩選表單
│   ├── OrderFormDialog.vue     # 新增/編輯訂單對話框
│   ├── OrderItemsForm.vue      # 訂單項目子表單
│   ├── DeliveryInfoForm.vue    # 收件資訊子表單
│   ├── PaymentRecordsPanel.vue # 付款記錄面板
│   └── ShippingLabelPreview.vue # 出貨單預覽
└── composables/
    ├── useOrderList.ts         # 訂單列表邏輯
    ├── useOrderForm.ts         # 訂單表單邏輯
    ├── useOrderDetail.ts       # 訂單詳情邏輯
    ├── usePaymentRecords.ts    # 付款記錄邏輯
    ├── useOrderExport.ts       # 訂單匯出邏輯
    └── useDeliveryValidation.ts # 收件資訊驗證邏輯
```

### Shared Resources

```text
src/common/
├── apis/
│   └── order.ts                # 訂單 API 請求函式
├── constants/
│   └── permissions.ts          # 權限常數定義
└── utils/
    └── export.ts               # Excel 匯出工具
```

---

## Core Concepts (核心概念)

### 1. Type System (型別系統)

**所有型別定義集中於 `types.ts`**:

```typescript
// src/pages/order-management/types.ts
export interface SalesOrder { /* ... */ }
export interface OrderItem { /* ... */ }
export enum OrderStatus { /* ... */ }
```

**使用方式**:

```typescript
import type { SalesOrder, OrderStatus } from './types'
import { ORDER_STATUS_LABELS } from './types'

const order: SalesOrder = { /* ... */ }
const statusLabel = ORDER_STATUS_LABELS[order.orderStatus]
```

### 2. Composition API Pattern (組合式 API 模式)

**使用 Composables 封裝業務邏輯**:

```typescript
// src/pages/order-management/composables/useOrderList.ts
export function useOrderList() {
  const orderList = ref<SalesOrderListItem[]>([])
  const loading = ref(false)
  const pagination = reactive({ pageNumber: 1, pageSize: 20, total: 0 })

  async function fetchOrders() {
    loading.value = true
    try {
      const response = await getOrderListApi(pagination)
      orderList.value = response.data
      pagination.total = response.totalCount
    } finally {
      loading.value = false
    }
  }

  return { orderList, loading, pagination, fetchOrders }
}
```

**在元件中使用**:

```vue
<script setup lang="ts">
import { useOrderList } from './composables/useOrderList'

const { orderList, loading, pagination, fetchOrders } = useOrderList()

onMounted(() => {
  fetchOrders()
})
</script>
```

### 3. API Integration (API 整合)

**API 請求函式定義於 `src/common/apis/order.ts`**:

```typescript
// src/common/apis/order.ts
import { http } from '@/http/axios'
import type { ApiResponse, PagedResponse, SalesOrder, CreateSalesOrderRequest } from '@/pages/order-management/types'

/** 建立銷售訂單 */
export function createOrderApi(data: CreateSalesOrderRequest) {
  return http.post<ApiResponse<SalesOrder>>('/api/sales-orders', data)
}

/** 取得訂單列表(分頁) */
export function getOrderListApi(params: SalesOrderListParams) {
  return http.get<PagedResponse<SalesOrderListItem>>('/api/sales-orders', { params })
}
```

**使用 axios interceptor 處理統一回應格式**:

```typescript
// src/http/axios.ts (已存在)
axios.interceptors.response.use(
  (response) => {
    const apiResponse = response.data as ApiResponse
    if (!apiResponse.success) {
      ElMessage.error(apiResponse.message)
      return Promise.reject(new Error(apiResponse.message))
    }
    return response.data // 直接返回 ApiResponse
  },
  (error) => {
    const apiResponse = error.response?.data as ApiResponse
    if (apiResponse?.code === 'CONCURRENT_UPDATE_CONFLICT') {
      // 特殊錯誤處理
    }
    return Promise.reject(error)
  }
)
```

### 4. Form Validation (表單驗證)

**靜態驗證規則(types.ts)**:

```typescript
// src/pages/order-management/types.ts
export const ORDER_ITEM_RULES: FormRules = {
  productName: [
    { required: true, message: '請輸入商品名稱', trigger: 'blur' }
  ],
  unitPrice: [
    { required: true, message: '請輸入單價', trigger: 'blur' },
    { type: 'number', min: 0.01, message: '單價必須大於 0', trigger: 'blur' }
  ]
}
```

**動態驗證邏輯(composable)**:

```typescript
// src/pages/order-management/composables/useDeliveryValidation.ts
export function useDeliveryValidation() {
  const deliveryRules = computed(() => {
    if (formData.deliveryMethod === DeliveryMethod.HOME_DELIVERY) {
      return {
        'deliveryInfo.recipientName': [{ required: true, message: '請輸入收件人姓名' }],
        'deliveryInfo.recipientPhone': [
          { required: true, message: '請輸入收件人電話' },
          { pattern: /^09\d{8}$/, message: '手機格式錯誤' }
        ],
        'deliveryInfo.recipientAddress': [{ required: true, message: '請輸入收件地址' }]
      }
    } else if (formData.deliveryMethod === DeliveryMethod.PICKUP) {
      return {
        'deliveryInfo.pickupLocation': [{ required: true, message: '請輸入自取地點' }],
        'deliveryInfo.pickupTime': [{ required: true, message: '請選擇自取時間' }]
      }
    }
    return {}
  })

  return { deliveryRules }
}
```

### 5. Optimistic Locking (樂觀鎖定)

**編輯訂單時攜帶 version 欄位**:

```typescript
// src/pages/order-management/composables/useOrderForm.ts
async function updateOrder(orderId: string, formData: OrderFormData) {
  try {
    await updateOrderApi(orderId, {
      ...formData,
      version: formData.version // 必須攜帶當前版本號
    })
    ElMessage.success('訂單修改成功')
  } catch (error: any) {
    if (error.response?.data?.code === 'CONCURRENT_UPDATE_CONFLICT') {
      ElMessageBox.confirm(
        '資料已被他人修改,是否重新載入最新資料?',
        '資料衝突',
        { type: 'warning' }
      ).then(() => {
        fetchOrderDetail(orderId) // 重新載入資料
      })
    }
  }
}
```

---

## Development Workflow (開發流程)

### Step 1: 定義型別

```typescript
// src/pages/order-management/types.ts
export interface NewFeatureDto {
  id: string
  name: string
}
```

### Step 2: 建立 API 函式

```typescript
// src/common/apis/order.ts
export function getNewFeatureApi(id: string) {
  return http.get<ApiResponse<NewFeatureDto>>(`/api/new-feature/${id}`)
}
```

### Step 3: 建立 Composable

```typescript
// src/pages/order-management/composables/useNewFeature.ts
import { getNewFeatureApi } from '@/common/apis/order'
import type { NewFeatureDto } from '../types'

export function useNewFeature() {
  const data = ref<NewFeatureDto | null>(null)
  const loading = ref(false)

  async function fetchData(id: string) {
    loading.value = true
    try {
      const response = await getNewFeatureApi(id)
      data.value = response.data
    } finally {
      loading.value = false
    }
  }

  return { data, loading, fetchData }
}
```

### Step 4: 建立元件

```vue
<!-- src/pages/order-management/components/NewFeatureComponent.vue -->
<script setup lang="ts">
import { useNewFeature } from '../composables/useNewFeature'

const { data, loading, fetchData } = useNewFeature()

onMounted(() => {
  fetchData('some-id')
})
</script>

<template>
  <el-card v-loading="loading">
    <div v-if="data">{{ data.name }}</div>
  </el-card>
</template>
```

### Step 5: 整合到主頁面

```vue
<!-- src/pages/order-management/index.vue -->
<script setup lang="ts">
import NewFeatureComponent from './components/NewFeatureComponent.vue'
</script>

<template>
  <div class="order-management-page">
    <NewFeatureComponent />
  </div>
</template>
```

---

## Common Patterns (常見模式)

### Pattern 1: CRUD Operations

```typescript
// useOrderCrud.ts
export function useOrderCrud() {
  async function create(data: CreateSalesOrderRequest) {
    const response = await createOrderApi(data)
    ElMessage.success('訂單建立成功')
    return response.data
  }

  async function update(id: string, data: UpdateSalesOrderRequest) {
    const response = await updateOrderApi(id, data)
    ElMessage.success('訂單修改成功')
    return response.data
  }

  async function remove(id: string) {
    await ElMessageBox.confirm('確定要刪除此訂單嗎?', '刪除確認', { type: 'warning' })
    await deleteOrderApi(id)
    ElMessage.success('訂單刪除成功')
  }

  return { create, update, remove }
}
```

### Pattern 2: Pagination

```typescript
// useOrderPagination.ts
export function useOrderPagination() {
  const pagination = reactive({
    pageNumber: 1,
    pageSize: 20,
    total: 0
  })

  function handlePageChange(page: number) {
    pagination.pageNumber = page
    fetchData()
  }

  function handleSizeChange(size: number) {
    pagination.pageSize = size
    pagination.pageNumber = 1
    fetchData()
  }

  return { pagination, handlePageChange, handleSizeChange }
}
```

### Pattern 3: Search & Filter

```typescript
// useOrderSearch.ts
export function useOrderSearch() {
  const searchFilters = reactive<SearchFilters>({
    orderNumber: '',
    customerName: '',
    productName: '',
    orderStatus: '',
    paymentStatus: '',
    shippingStatus: '',
    dateRange: null
  })

  function handleSearch() {
    pagination.pageNumber = 1 // 重置頁碼
    fetchOrders()
  }

  function handleReset() {
    Object.assign(searchFilters, {
      orderNumber: '',
      customerName: '',
      productName: '',
      orderStatus: '',
      paymentStatus: '',
      shippingStatus: '',
      dateRange: null
    })
    handleSearch()
  }

  return { searchFilters, handleSearch, handleReset }
}
```

### Pattern 4: Dialog Management

```typescript
// useOrderDialog.ts
export function useOrderDialog() {
  const dialogVisible = ref(false)
  const dialogMode = ref<'create' | 'edit'>('create')
  const currentOrderId = ref<string | null>(null)

  function openCreateDialog() {
    dialogMode.value = 'create'
    currentOrderId.value = null
    dialogVisible.value = true
  }

  function openEditDialog(orderId: string) {
    dialogMode.value = 'edit'
    currentOrderId.value = orderId
    dialogVisible.value = true
  }

  function closeDialog() {
    dialogVisible.value = false
  }

  return { dialogVisible, dialogMode, currentOrderId, openCreateDialog, openEditDialog, closeDialog }
}
```

### Pattern 5: Excel Export

```typescript
// src/common/utils/export.ts
import * as XLSX from 'xlsx'

export function exportToExcel<T>(data: T[], filename: string, sheetName: string) {
  const worksheet = XLSX.utils.json_to_sheet(data)
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName)
  XLSX.writeFile(workbook, `${filename}.xlsx`)
}

// useOrderExport.ts
import { exportToExcel } from '@/common/utils/export'
import type { SalesOrderExportDto } from '../types'

export function useOrderExport() {
  async function exportOrders(filters: OrderExportParams) {
    const response = await getOrderExportApi(filters)
    const exportData: SalesOrderExportDto[] = response.data

    exportToExcel(exportData, `訂單報表_${Date.now()}`, '訂單清單')
    ElMessage.success('匯出成功')
  }

  return { exportOrders }
}
```

---

## Debugging Tips (除錯技巧)

### 1. Vue DevTools

安裝 Vue DevTools 擴充套件,檢查元件狀態與 Pinia store:

```bash
# 打開 Chrome DevTools → Vue 頁籤
# 檢查: Components 樹狀結構、State、Computed、Events
```

### 2. Network Inspection

檢查 API 請求/回應:

```bash
# Chrome DevTools → Network 頁籤
# 篩選: Fetch/XHR
# 檢查: Request Headers, Request Payload, Response
```

### 3. Console Debugging

使用 `console.log` 追蹤資料流:

```typescript
// 在 composable 中加入 debug log
async function fetchOrders() {
  console.log('[useOrderList] Fetching orders with params:', pagination)
  const response = await getOrderListApi(pagination)
  console.log('[useOrderList] Response:', response)
  orderList.value = response.data
}
```

### 4. Error Boundary

攔截未處理錯誤:

```typescript
// main.ts
app.config.errorHandler = (err, instance, info) => {
  console.error('[Global Error]', err, info)
  ElMessage.error('系統發生錯誤,請稍後再試')
}
```

---

## Testing (測試)

### Unit Test Example

```typescript
// tests/pages/order-management/composables/useOrderList.test.ts
import { describe, it, expect, vi } from 'vitest'
import { useOrderList } from '@/pages/order-management/composables/useOrderList'
import * as orderApi from '@/common/apis/order'

describe('useOrderList', () => {
  it('should fetch orders successfully', async () => {
    // Mock API response
    vi.spyOn(orderApi, 'getOrderListApi').mockResolvedValue({
      success: true,
      code: 'SUCCESS',
      message: '查詢成功',
      data: [{ id: '1', orderNumber: 'RYO20260206001' }],
      pageNumber: 1,
      pageSize: 20,
      totalCount: 1,
      timestamp: '2026-02-06T08:30:00.000Z',
      traceId: 'abc123'
    })

    const { orderList, fetchOrders } = useOrderList()
    await fetchOrders()

    expect(orderList.value).toHaveLength(1)
    expect(orderList.value[0].orderNumber).toBe('RYO20260206001')
  })
})
```

### E2E Test Example

```typescript
// tests/e2e/order-management.spec.ts
import { test, expect } from '@playwright/test'

test('should create order successfully', async ({ page }) => {
  await page.goto('/order-management')
  await page.click('text=新增訂單')
  await page.fill('[name="customerName"]', '王小明')
  await page.fill('[name="productName"]', 'Hermès Kelly 25')
  await page.click('text=儲存')
  await expect(page.locator('text=訂單建立成功')).toBeVisible()
})
```

---

## Performance Optimization (效能優化)

### 1. Lazy Loading

```typescript
// router/index.ts
const routes = [
  {
    path: '/order-management',
    component: () => import('@/pages/order-management/index.vue')
  }
]
```

### 2. Virtual Scrolling (大量資料)

```vue
<template>
  <el-table-v2
    :columns="columns"
    :data="orderList"
    :height="600"
    :row-height="50"
  />
</template>
```

### 3. Debounce Search Input

```typescript
import { useDebounceFn } from '@vueuse/core'

const debouncedSearch = useDebounceFn(() => {
  fetchOrders()
}, 500)
```

---

## Troubleshooting (常見問題)

### Q1: API 請求回傳 401 Unauthorized

**原因**: JWT 令牌過期或無效  
**解法**: 檢查 localStorage 中的 `access_token`,確認是否有效

```typescript
// 在 axios interceptor 中處理
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('access_token')
      router.push('/login')
    }
    return Promise.reject(error)
  }
)
```

### Q2: 表單驗證無法觸發

**原因**: FormRules 未正確綁定至 `el-form`  
**解法**: 確認 `prop` 屬性與 rules 鍵名一致

```vue
<el-form :model="formData" :rules="rules">
  <el-form-item prop="productName" label="商品名稱">
    <el-input v-model="formData.productName" />
  </el-form-item>
</el-form>
```

### Q3: 樂觀鎖定衝突頻繁發生

**原因**: 多人同時編輯同一筆訂單  
**解法**: 實作即時鎖定提示(WebSocket)或增加自動重試機制

```typescript
async function updateOrderWithRetry(orderId: string, formData: OrderFormData, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await updateOrderApi(orderId, formData)
    } catch (error: any) {
      if (error.response?.data?.code === 'CONCURRENT_UPDATE_CONFLICT' && i < maxRetries - 1) {
        // 重新載入資料並重試
        const latestOrder = await getOrderDetailApi(orderId)
        formData.version = latestOrder.data.version
        continue
      }
      throw error
    }
  }
}
```

---

## Next Steps (下一步)

1. **閱讀 research.md**: 深入理解技術決策
2. **閱讀 data-model.md**: 熟悉所有型別定義
3. **閱讀 api-contracts.md**: 理解後端 API 契約
4. **執行 /speckit.tasks**: 生成任務分解文件
5. **開始編碼**: 依照 tasks.md 逐步實作功能

---

## Resources (參考資源)

### Documentation
- [Vue 3 官方文件](https://vuejs.org/)
- [Element Plus 文件](https://element-plus.org/)
- [Vite 文件](https://vitejs.dev/)
- [TypeScript 手冊](https://www.typescriptlang.org/docs/)

### Internal Documents
- `research.md`: 技術背景研究
- `data-model.md`: 資料模型定義
- `api-contracts.md`: API 契約文件
- `.specify/memory/plan-instruction.md`: 開發規範

### Tools
- [Vue DevTools](https://devtools.vuejs.org/)
- [Postman](https://www.postman.com/): API 測試
- [Swagger UI](http://localhost:5176/swagger): 後端 API 文件

---

**Quickstart Guide Completed**: 2026-02-06 | **Author**: GitHub Copilot | **Next**: Update Agent Context

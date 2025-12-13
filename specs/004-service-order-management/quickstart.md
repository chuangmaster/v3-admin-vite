# Quickstart: 服務單管理開發指南

**Date**: 2025-12-14  
**Feature**: 服務單管理（寄賣單與收購單）  
**Target Audience**: 前端開發者

本文件提供服務單管理模組的快速入門指南，協助開發者快速理解架構、開始開發與測試。

---

## 📋 目錄

1. [功能概覽](#功能概覽)
2. [技術棧](#技術棧)
3. [專案結構](#專案結構)
4. [開發流程](#開發流程)
5. [核心元件說明](#核心元件說明)
6. [API 整合](#api-整合)
7. [測試指南](#測試指南)
8. [常見問題](#常見問題)

---

## 功能概覽

服務單管理模組提供以下核心功能：

### 收購單（Buyback Order）
- 建立收購單表單（客戶資料、商品資訊、金額）
- 身分證明文件上傳與自動辨識
- 線下簽名（觸控簽名板）或線上簽名（Dropbox Sign）
- 產生收購合約與一時貿易申請書

### 寄賣單（Consignment Order）
- 建立寄賣單表單（額外包含商品配件、寄賣日期、瑕疵、續約設定）
- 身分證明文件上傳與自動辨識
- 線下簽名或線上簽名
- 產生寄賣合約書

### 客戶管理
- 快速搜尋既有客戶（姓名、電話、Email、身分證字號）
- 新增客戶資料
- 自動填入客戶資訊

### 服務單查詢與管理
- 列表查詢（支援篩選、分頁）
- 詳細資訊查看
- 編輯服務單
- 狀態管理（待處理、已完成、已終止）
- 修改歷史追蹤
- Excel 匯出

---

## 技術棧

| 類別 | 技術 | 版本 |
|------|------|------|
| 框架 | Vue | 3.5+ |
| 語言 | TypeScript | 5.x |
| 建構工具 | Vite | 7+ |
| UI 元件庫 | Element Plus | 最新穩定版 |
| 狀態管理 | Pinia | 最新穩定版 |
| 路由 | Vue Router | 最新穩定版 |
| HTTP 客戶端 | Axios | 最新穩定版 |
| 工具函式 | Lodash-es | 最新穩定版 |
| 測試框架 | Vitest | 最新穩定版 |
| OCR | Tesseract.js | 最新穩定版 |
| 簽名板 | signature_pad | 最新穩定版 |
| Excel 匯出 | SheetJS (xlsx) | 最新穩定版 |

---

## 專案結構

```
src/pages/service-order-management/
├── index.vue                         # 服務單列表查詢主頁面
├── create.vue                        # 服務單建立頁面
├── detail.vue                        # 服務單詳細頁面
├── types.ts                          # 型別定義
├── apis/
│   └── service-order.ts              # 服務單 API
├── components/
│   ├── ServiceOrderForm.vue          # 服務單表單元件
│   ├── ServiceOrderTable.vue         # 服務單列表元件
│   ├── CustomerSearch.vue            # 客戶搜尋元件
│   ├── CustomerForm.vue              # 客戶表單元件
│   ├── IDCardUpload.vue              # 身分證明上傳與辨識元件
│   ├── SignaturePad.vue              # 觸控簽名板元件
│   └── AccessoriesSelector.vue       # 商品配件選擇器元件
└── composables/
    ├── useServiceOrderManagement.ts  # 服務單列表管理
    ├── useServiceOrderForm.ts        # 服務單表單邏輯
    ├── useCustomerSearch.ts          # 客戶搜尋邏輯
    ├── useIDCardOCR.ts               # 身分證辨識邏輯
    ├── useSignature.ts               # 簽名處理邏輯
    └── useExportExcel.ts             # Excel 匯出邏輯
```

---

## 開發流程

### 1. 環境準備

```bash
# 安裝依賴
pnpm install

# 安裝新增套件（OCR、簽名板、Excel）
pnpm add tesseract.js signature_pad xlsx

# 啟動開發伺服器
pnpm dev
```

### 2. 開發順序建議

#### Phase 1: 基礎架構（第 1-2 天）
1. ✅ 定義型別（`types.ts`）
2. ✅ 建立 API 服務層（`apis/service-order.ts`）
3. ✅ 新增權限常數（`src/common/constants/permissions.ts`）

#### Phase 2: 核心元件（第 3-5 天）
4. ✅ 客戶搜尋元件（`CustomerSearch.vue` + `useCustomerSearch.ts`）
5. ✅ 客戶表單元件（`CustomerForm.vue`）
6. ✅ 身分證上傳與辨識（`IDCardUpload.vue` + `useIDCardOCR.ts`）
7. ✅ 簽名板元件（`SignaturePad.vue` + `useSignature.ts`）
8. ✅ 商品配件選擇器（`AccessoriesSelector.vue`）

#### Phase 3: 表單頁面（第 6-8 天）
9. ✅ 服務單表單元件（`ServiceOrderForm.vue` + `useServiceOrderForm.ts`）
10. ✅ 服務單建立頁面（`create.vue`）

#### Phase 4: 列表與詳細頁（第 9-11 天）
11. ✅ 服務單列表元件（`ServiceOrderTable.vue`）
12. ✅ 列表查詢頁面（`index.vue` + `useServiceOrderManagement.ts`）
13. ✅ 詳細資訊頁面（`detail.vue`）
14. ✅ Excel 匯出（`useExportExcel.ts`）

#### Phase 5: 測試與優化（第 12-14 天）
15. ✅ 撰寫單元測試
16. ✅ 整合測試與除錯
17. ✅ 效能優化

---

## 核心元件說明

### 1. CustomerSearch.vue - 客戶搜尋元件

**職責**:
- 提供客戶搜尋輸入框
- 顯示搜尋結果列表
- 支援選擇客戶或新增客戶

**使用範例**:
```vue
<template>
  <CustomerSearch 
    @select="handleCustomerSelect" 
    @create="handleCustomerCreate" 
  />
</template>

<script setup lang="ts">
function handleCustomerSelect(customer: Customer) {
  console.log("選擇客戶:", customer)
}

function handleCustomerCreate() {
  // 顯示新增客戶表單
}
</script>
```

**組合式函式**: `useCustomerSearch.ts`
```typescript
export function useCustomerSearch() {
  const keyword = ref("")
  const customers = ref<Customer[]>([])
  const loading = ref(false)
  
  const debouncedSearch = debounce(async () => {
    loading.value = true
    try {
      const response = await searchCustomers({ keyword: keyword.value })
      if (response.success) {
        customers.value = response.data || []
      }
    } finally {
      loading.value = false
    }
  }, 500)
  
  watch(keyword, () => {
    if (keyword.value.length >= 2) {
      debouncedSearch()
    } else {
      customers.value = []
    }
  })
  
  return { keyword, customers, loading }
}
```

---

### 2. IDCardUpload.vue - 身分證上傳與辨識元件

**職責**:
- 支援檔案上傳與相機拍照
- 整合 Tesseract.js 進行 OCR 辨識
- 顯示辨識結果並自動填入表單
- 比對客戶資料一致性

**使用範例**:
```vue
<template>
  <IDCardUpload 
    :customer="selectedCustomer"
    @recognized="handleIDCardRecognized" 
  />
</template>

<script setup lang="ts">
function handleIDCardRecognized(data: { name: string; idCardNumber: string }) {
  console.log("辨識結果:", data)
  // 自動填入表單
}
</script>
```

**組合式函式**: `useIDCardOCR.ts`
```typescript
import Tesseract from "tesseract.js"

export function useIDCardOCR() {
  const loading = ref(false)
  const result = ref<{ name: string; idCardNumber: string } | null>(null)
  
  async function recognize(file: File) {
    loading.value = true
    try {
      const { data } = await Tesseract.recognize(file, "chi_tra+eng")
      const text = data.text
      
      // 解析姓名與身分證字號（正則表達式）
      const nameMatch = text.match(/姓名[:：]?\s*([^\n]+)/)
      const idMatch = text.match(/[A-Z]\d{9}/)
      
      result.value = {
        name: nameMatch?.[1]?.trim() || "",
        idCardNumber: idMatch?.[0] || ""
      }
    } catch (error) {
      ElMessage.error("辨識失敗，請重新拍攝或手動輸入")
    } finally {
      loading.value = false
    }
  }
  
  return { loading, result, recognize }
}
```

---

### 3. SignaturePad.vue - 觸控簽名板元件

**職責**:
- 提供觸控簽名功能（支援滑鼠、觸控筆、手指）
- 匯出簽名為 Base64 PNG
- 提供清除與重簽功能

**使用範例**:
```vue
<template>
  <SignaturePad 
    :document-type="'CONSIGNMENT_CONTRACT'"
    @save="handleSignatureSave" 
  />
</template>

<script setup lang="ts">
function handleSignatureSave(signatureData: string) {
  console.log("簽名資料:", signatureData)
  // 上傳至後端
}
</script>
```

**組合式函式**: `useSignature.ts`
```typescript
import SignaturePad from "signature_pad"

export function useSignature(canvasRef: Ref<HTMLCanvasElement | null>) {
  let signaturePad: SignaturePad | null = null
  
  onMounted(() => {
    if (canvasRef.value) {
      signaturePad = new SignaturePad(canvasRef.value, {
        backgroundColor: "rgb(255, 255, 255)"
      })
    }
  })
  
  function clear() {
    signaturePad?.clear()
  }
  
  function getSignatureData(): string | null {
    if (signaturePad?.isEmpty()) {
      ElMessage.warning("請先簽名")
      return null
    }
    return signaturePad?.toDataURL("image/png") || null
  }
  
  return { clear, getSignatureData }
}
```

---

### 4. ServiceOrderForm.vue - 服務單表單元件

**職責**:
- 整合客戶搜尋、身分證上傳、簽名板
- 表單驗證與提交
- 支援新增與編輯模式

**使用範例**:
```vue
<template>
  <el-dialog v-model="dialogVisible" title="建立寄賣單">
    <ServiceOrderForm 
      ref="formRef"
      :order-type="'consignment'"
      @success="handleSuccess" 
      @cancel="handleCancel" 
    />
  </el-dialog>
</template>

<script setup lang="ts">
const formRef = ref<InstanceType<typeof ServiceOrderForm>>()

function handleSuccess() {
  dialogVisible.value = false
  fetchServiceOrders()
}
</script>
```

**組合式函式**: `useServiceOrderForm.ts`（參考 `plan-instruction.md` 範例）

---

### 5. ServiceOrderTable.vue - 服務單列表元件

**職責**:
- 顯示服務單列表
- 支援編輯、刪除、查看詳細操作
- 權限控制按鈕顯示

**使用範例**:
```vue
<template>
  <ServiceOrderTable 
    :data="serviceOrders"
    :loading="loading"
    @edit="handleEdit"
    @delete="handleDelete"
    @view="handleView"
  />
</template>
```

---

## API 整合

### 1. API 服務層結構

```typescript
// src/pages/service-order-management/apis/service-order.ts

import type { ApiResponse, ServiceOrder, CreateServiceOrderRequest } from "../types"
import { request } from "@/http/axios"

/**
 * 查詢服務單列表
 */
export async function getServiceOrderList(
  params: ServiceOrderListParams
): Promise<ApiResponse<ServiceOrderListResponse>> {
  return request({
    url: "/service-orders",
    method: "GET",
    params
  })
}

/**
 * 建立服務單
 */
export async function createServiceOrder(
  data: CreateServiceOrderRequest
): Promise<ApiResponse<ServiceOrder>> {
  return request({
    url: "/service-orders",
    method: "POST",
    data
  })
}

// ... 其他 API 函式
```

### 2. 錯誤處理

```typescript
async function fetchServiceOrders() {
  loading.value = true
  try {
    const response = await getServiceOrderList(queryParams)
    
    if (response.success) {
      serviceOrders.value = response.data?.items || []
      pagination.value.total = response.data?.totalRecords || 0
    } else {
      // 處理業務錯誤
      ElMessage.error(response.message)
    }
  } catch (error) {
    // 處理系統錯誤
    ElMessage.error("系統錯誤，請稍後再試")
  } finally {
    loading.value = false
  }
}
```

### 3. 並發控制（樂觀鎖）

```typescript
async function updateServiceOrder(id: string, data: UpdateServiceOrderRequest) {
  const response = await updateServiceOrder(id, data)
  
  if (response.code === "CONCURRENT_UPDATE_CONFLICT") {
    ElMessage.error("資料已被其他使用者修改，請重新載入")
    await fetchServiceOrders()
  } else if (response.success) {
    ElMessage.success("更新成功")
  }
}
```

---

## 測試指南

### 1. 單元測試範例

```typescript
// tests/composables/useCustomerSearch.test.ts

import { describe, it, expect, vi } from "vitest"
import { useCustomerSearch } from "@/pages/service-order-management/composables/useCustomerSearch"

describe("useCustomerSearch", () => {
  it("應該在輸入關鍵字後搜尋客戶", async () => {
    const { keyword, customers, loading } = useCustomerSearch()
    
    keyword.value = "王小明"
    
    // 等待 debounce
    await new Promise(resolve => setTimeout(resolve, 600))
    
    expect(loading.value).toBe(false)
    expect(customers.value.length).toBeGreaterThan(0)
  })
})
```

### 2. 元件測試範例

```typescript
// tests/components/CustomerSearch.test.ts

import { mount } from "@vue/test-utils"
import { describe, it, expect } from "vitest"
import CustomerSearch from "@/pages/service-order-management/components/CustomerSearch.vue"

describe("CustomerSearch.vue", () => {
  it("應該顯示搜尋輸入框", () => {
    const wrapper = mount(CustomerSearch)
    expect(wrapper.find("input").exists()).toBe(true)
  })
  
  it("應該在點擊客戶時發出 select 事件", async () => {
    const wrapper = mount(CustomerSearch)
    
    // 模擬搜尋結果
    // ...
    
    await wrapper.find(".customer-item").trigger("click")
    expect(wrapper.emitted("select")).toBeTruthy()
  })
})
```

---

## 常見問題

### Q1: 如何測試 OCR 功能？

**A**: 準備測試用身分證圖片（確保清晰、角度正確），在開發環境測試辨識準確率。若準確率不足，調整圖片預處理參數。

### Q2: 線上簽名整合需要後端支援嗎？

**A**: 是的，前端僅負責發送簽名邀請請求，實際與 Dropbox Sign API 整合由後端處理。

### Q3: 如何處理大量服務單查詢？

**A**: 使用後端分頁，每頁最多顯示 100 筆。匯出時限制最多 10,000 筆，超過提示縮小範圍。

### Q4: 草稿儲存會影響效能嗎？

**A**: 使用 debounce（2 秒）與 LocalStorage，對效能影響極小。

### Q5: 如何確保與後端 API 契約一致？

**A**: 
1. 參考 `contracts/api-contracts.md` 定義
2. 使用 TypeScript 型別檢查
3. 撰寫整合測試驗證 API 回應格式

---

## 參考資源

### 內部文件
- [spec.md](./spec.md) - 功能規格
- [data-model.md](./data-model.md) - 資料模型
- [contracts/api-contracts.md](./contracts/api-contracts.md) - API 契約
- [research.md](./research.md) - 技術研究
- [.specify/memory/plan-instruction.md](../../.specify/memory/plan-instruction.md) - 開發規範

### 外部資源
- [Vue 3 官方文件](https://vuejs.org/)
- [Element Plus 官方文件](https://element-plus.org/)
- [Tesseract.js 官方文件](https://tesseract.projectnaptha.com/)
- [signature_pad GitHub](https://github.com/szimek/signature_pad)
- [SheetJS 官方文件](https://docs.sheetjs.com/)

---

## 下一步

完成開發後，執行以下命令進入任務拆分階段：

```bash
/speckit.tasks
```

這將生成 `tasks.md`，提供詳細的開發任務清單與時程規劃。

---

**Happy Coding! 🚀**

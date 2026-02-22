# Quick Start: 商品訂購單文件產生

**Feature**: 010-order-document  
**Date**: 2026-02-18  
**實作時間估計**: 6-8 小時

---

## 概述

本功能實現商品訂購單的前端產生與列印，讓業務人員能快速產生標準化的客戶訂購確認文件。

**核心流程**:
1. 業務人員在訂單管理頁面點擊「產生訂購單」按鈕
2. 系統從訂單資料生成 `OrderDocumentData`
3. 在 ElDialog 中預覽完整訂購單
4. 點擊「列印」觸發瀏覽器列印對話框

---

## 前置檢查

### 必要知識

- ✅ Vue 3 Composition API 與 `<script setup>` 語法
- ✅ TypeScript 基礎型別定義
- ✅ Element Plus 元件（ElDialog、ElDescriptions）
- ✅ CSS `@media print` 列印樣式

### 環境需求

```bash
Node.js: 18+
pnpm: 8+
Vue: 3.5+
Element Plus: 最新版
TypeScript: 5+
```

### 參考檔案

開始前請先閱讀以下現有實作：
- `src/pages/order-management/components/ShippingLabelPreview.vue` - 出貨單預覽（格式範本）
- `src/pages/order-management/types.ts` - 訂單管理型別定義
- `.specify/memory/plan-instruction.md` - 專案開發規範

---

## 開發步驟

### Step 1: 擴充型別定義（15 分鐘）

**檔案**: `src/pages/order-management/types.ts`

在檔案末尾新增以下型別與常數：

```typescript
// ============================================================================
// Order Document Types (訂購單文件型別)
// ============================================================================

/** 訂購單文件資料 */
export interface OrderDocumentData {
  /** 訂單編號（格式: RYO + YYYYMMDD + 流水號） */
  orderNumber: string
  /** 訂單日期（ISO 8601, UTC） */
  orderDate: string
  /** 訂單類型（預購 or 現貨） */
  orderType: OrderType
  /** 訂購人姓名 */
  customerName: string
  /** 訂購人電話 */
  customerPhone: string
  /** 訂購人 Line ID（可選） */
  customerLineId: string | null
  /** 商品明細列表 */
  orderItems: OrderDocumentItem[]
  /** 付款紀錄列表 */
  paymentRecords: PaymentRecordSummary[]
  /** 總金額 */
  totalAmount: number
  /** 已付金額 */
  paidAmount: number
}

/** 訂購單商品項目 */
export interface OrderDocumentItem {
  /** 商品項目唯一識別碼（UUID） */
  id: string
  /** 品牌名稱 */
  brandName: string
  /** 商品名稱 */
  productName: string
  /** 款式 */
  productStyle: string
  /** 配件列表（僅現貨訂單顯示，預購訂單此欄位為 null） */
  accessories: string[] | null
  /** 數量 */
  quantity: number
  /** 單價 */
  unitPrice: number
}

/** 商品預購定金須知（固定內容，每筆為一條條文） */
export const DEPOSIT_TERMS = [
  "確認訂購後 REALYOU 將收取 50% 訂購金額為定金（支付定金方不履行契約時，無權請求返還）。",
  "唯獨在 REALYOU 無法如期交付商品時退還，除因物流或其他不可抗因素（天災/疫情/戰爭/政治等因素）所造成之延誤，與 REALYOU 無關。",
  "溢品與作品多為手工製作，難免有些許不完美之處：些許溢膠、皮紋皺摺、線頭收尾，皆不影響正常使用！",
  "商品經由專業人員鑑定完成，保證正品，唯商品本身並無提供保固，致商品保固及維修問題，請洽品牌專櫃或可由廠商代送處理。",
  "定金一旦支付，僅在第二條條文情形下才會退還，支付前請務必三思。",
  "通知商品到貨日起逾 2 週內仍未支付尾款，視為「違約棄單」，REALYOU 得解除契約並沒收定金。",
  "下定前請詳閱 REALYOU 官網下方 > 常見問題 > 購物須知，匯款完成即代表同意「商品預購定金須知」。"
] as const
```

---

### Step 2: 建立組合式函式（30 分鐘）

**檔案**: `src/pages/order-management/composables/useOrderDocumentPreview.ts`

```typescript
/**
 * 訂購單預覽組合式函式
 * 
 * @module order-management/composables/useOrderDocumentPreview
 * @description 處理訂單資料轉換與訂購單預覽邏輯
 */

import type { OrderDocumentData, SalesOrder } from '../types'
import { OrderType } from '../types'
import { ref } from 'vue'

export function useOrderDocumentPreview() {
  /** 對話框顯示狀態 */
  const dialogVisible = ref(false)
  
  /** 訂購單資料 */
  const orderDocumentData = ref<OrderDocumentData | null>(null)

  /**
   * 將 SalesOrder 轉換為 OrderDocumentData
   */
  function transformToOrderDocument(order: SalesOrder): OrderDocumentData {
    return {
      orderNumber: order.orderNumber,
      orderDate: order.orderDate,
      orderType: order.orderType,
      customerName: order.customerName,
      customerPhone: order.customerPhone,
      customerLineId: order.customerLineId || null,
      orderItems: order.orderItems.map(item => ({
        id: item.id,
        brandName: item.brandName,
        productName: item.productName,
        productStyle: item.productStyle,
        accessories: order.orderType === OrderType.SPOT_PURCHASE ? item.accessories : null,
        quantity: item.quantity,
        unitPrice: item.unitPrice
      })),
      paymentRecords: order.paymentRecords.map(record => ({
        id: record.id,
        paymentDate: record.paymentDate,
        paymentAmount: record.paymentAmount,
        paymentMethod: record.paymentMethod,
        bankAccountLastFive: record.bankAccountLastFive
      })),
      totalAmount: order.totalAmount,
      paidAmount: order.paidAmount
    }
  }

  /**
   * 開啟訂購單預覽
   */
  function openPreview(order: SalesOrder): void {
    orderDocumentData.value = transformToOrderDocument(order)
    dialogVisible.value = true
  }

  /**
   * 關閉訂購單預覽
   */
  function closePreview(): void {
    dialogVisible.value = false
  }

  /**
   * 列印訂購單
   */
  function printDocument(): void {
    window.print()
  }

  return {
    dialogVisible,
    orderDocumentData,
    openPreview,
    closePreview,
    printDocument
  }
}
```

---

### Step 3: 建立訂購單預覽元件（2-3 小時）

**檔案**: `src/pages/order-management/components/OrderDocumentPreview.vue`

**核心結構**:
```vue
<script setup lang="ts">
/**
 * 訂購單預覽元件
 * 
 * @module order-management/components/OrderDocumentPreview
 * @description 訂購單格式化顯示,包含訂購人資訊、商品明細、付款紀錄與定金須知,
 *              支援列印友善樣式
 */
import type { OrderDocumentData } from '../types'
import { DEPOSIT_TERMS, OrderType, /* ... */ } from '../types'
import { Printer } from '@element-plus/icons-vue'
import { ElButton, ElDialog, ElDescriptions, ElDescriptionsItem } from 'element-plus'
import BrandBanner from './BrandBanner.vue'
import '@/common/assets/fonts/fonts.css'

defineOptions({ name: 'OrderDocumentPreview' })

interface Props {
  visible: boolean
  data: OrderDocumentData | null
}

interface Emits {
  (e: 'update:visible', value: boolean): void
  (e: 'print'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// 格式化函式
function formatDate(dateStr: string): string { /* ... */ }
function formatCurrency(amount: number | undefined | null): string { /* ... */ }
function formatAccessories(accessories: string[] | null): string { /* ... */ }

function handlePrint() {
  emit('print')
}

function handleClose() {
  emit('update:visible', false)
}
</script>

<template>
  <ElDialog
    :model-value="props.visible"
    title="訂購單預覽"
    width="800px"
    class="order-document-dialog"
    append-to-body
    :close-on-click-modal="false"
    @close="handleClose"
  >
    <div v-if="props.data" class="order-document-content">
      <!-- 1. 品牌標的 -->
      <div class="document-header">
        <BrandBanner />
        <h2 class="document-title">商品訂購單</h2>
      </div>

      <!-- 2. 訂單基本資訊 + 訂購人資訊 -->
      <ElDescriptions :column="2" border size="small" class="document-info">
        <ElDescriptionsItem label="訂單編號">
          {{ props.data.orderNumber }}
        </ElDescriptionsItem>
        <ElDescriptionsItem label="訂單日期">
          {{ formatDate(props.data.orderDate) }}
        </ElDescriptionsItem>
        <ElDescriptionsItem label="訂購人姓名">
          {{ props.data.customerName }}
        </ElDescriptionsItem>
        <ElDescriptionsItem label="訂購人電話">
          {{ props.data.customerPhone }}
        </ElDescriptionsItem>
        <ElDescriptionsItem label="Line ID">
          {{ props.data.customerLineId || '-' }}
        </ElDescriptionsItem>
      </ElDescriptions>

      <!-- 3. 商品明細 -->
      <div class="items-section">
        <h3 class="section-title">商品明細</h3>
        <div class="product-cards">
          <div
            v-for="(item, index) in props.data.orderItems"
            :key="item.id"
            class="product-card"
          >
            <!-- 商品卡片內容，參考 ShippingLabelPreview 的格式 -->
            <!-- 使用 v-if 根據 orderType 控制配件欄位顯示 -->
          </div>
        </div>
      </div>

      <!-- 4. 付款紀錄 -->
      <div v-if="props.data.paymentRecords?.length" class="payment-section">
        <h3 class="section-title">付款紀錄</h3>
        <!-- 使用 ElDescriptions 顯示每筆付款紀錄 -->
      </div>

      <!-- 5. 定金須知 -->
      <div class="terms-section">
        <h3 class="section-title">商品預購定金須知</h3>
        <ol class="terms-content">
          <li v-for="(term, index) in DEPOSIT_TERMS" :key="index" class="terms-item">
            {{ term }}
          </li>
        </ol>
      </div>
    </div>

    <template #footer>
      <ElButton @click="handleClose">關閉</ElButton>
      <ElButton type="primary" :icon="Printer" @click="handlePrint">
        列印
      </ElButton>
    </template>
  </ElDialog>
</template>

<style scoped lang="scss">
/* 參考 ShippingLabelPreview.vue 的樣式 */
/* 商品卡片、描述列表、區段標題等 */
</style>

<style lang="scss">
/* 列印樣式（非 scoped） */
@media print {
  @page {
    size: A4 portrait;
    margin: 15mm;
  }

  body > *:not(.el-overlay) {
    display: none !important;
  }

  body > .el-overlay:not([style*="display: none"]):has(.order-document-dialog) {
    display: block !important;
    position: static !important;
    background: none !important;
  }

  .order-document-dialog {
    /* 列印時對話框樣式調整 */
  }

  .product-card {
    break-inside: avoid;
    page-break-inside: avoid;
  }

  .terms-section {
    break-inside: avoid;
    page-break-inside: avoid;
  }
}
</style>
```

**樣式開發提示**:
1. 完全複製 `ShippingLabelPreview.vue` 的 scoped 樣式作為基礎
2. 調整商品卡片的欄位佈局（預購 vs 現貨）
3. 新增定金須知區塊的樣式（使用 `<pre>` 標籤保留換行）
4. 確保所有區塊都有 `break-inside: avoid` 樣式

---

### Step 4: 整合至訂單管理頁面（45 分鐘）

**檔案**: `src/pages/order-management/index.vue`

#### 4.1 匯入組合式函式與元件

```typescript
import OrderDocumentPreview from './components/OrderDocumentPreview.vue'
import { useOrderDocumentPreview } from './composables/useOrderDocumentPreview'
```

#### 4.2 在 `<script setup>` 中初始化

```typescript
// 訂購單預覽
const {
  dialogVisible: orderDocDialogVisible,
  orderDocumentData,
  openPreview: openOrderDocPreview,
  closePreview: closeOrderDocPreview,
  printDocument: printOrderDocument
} = useOrderDocumentPreview()
```

#### 4.3 新增「產生訂購單」按鈕

在表格的操作欄新增按鈕（參考「產生出貨單」按鈕位置）：

```vue
<template>
  <!-- 在表格操作欄 -->
  <el-table-column label="操作" width="200" fixed="right">
    <template #default="{ row }">
      <!-- 現有按鈕：編輯、刪除、產生出貨單等 -->
      
      <!-- 新增：產生訂購單 -->
      <el-button
        v-permission="[ORDER_PERMISSIONS.READ]"
        type="success"
        size="small"
        @click="handleGenerateOrderDocument(row)"
      >
        產生訂購單
      </el-button>
    </template>
  </el-table-column>
</template>
```

#### 4.4 新增事件處理函式

```typescript
/**
 * 產生訂購單
 */
function handleGenerateOrderDocument(order: SalesOrder): void {
  openOrderDocPreview(order)
}

/**
 * 列印訂購單
 */
function handlePrintOrderDocument(): void {
  printOrderDocument()
}
```

#### 4.5 在模板中加入對話框元件

```vue
<template>
  <div class="order-management-page">
    <!-- ... 現有內容 ... -->

    <!-- 訂購單預覽對話框 -->
    <OrderDocumentPreview
      v-model:visible="orderDocDialogVisible"
      :data="orderDocumentData"
      @print="handlePrintOrderDocument"
    />
  </div>
</template>
```

---

### Step 5: 單元測試（1 小時）

**檔案**: `tests/pages/order-management/components/OrderDocumentPreview.test.ts`

```typescript
import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import OrderDocumentPreview from '@/pages/order-management/components/OrderDocumentPreview.vue'
import type { OrderDocumentData } from '@/pages/order-management/types'
import { OrderType, PaymentMethod } from '@/pages/order-management/types'

describe('OrderDocumentPreview', () => {
  const mockOrderData: OrderDocumentData = {
    orderNumber: 'RYO20260218001',
    orderDate: '2026-02-18T10:00:00Z',
    orderType: OrderType.PRE_ORDER,
    customerName: '測試客戶',
    customerPhone: '0912-345-678',
    customerLineId: 'test_line',
    orderItems: [
      {
        id: 'item-001',
        brandName: 'CHANEL',
        productName: 'Classic Flap Bag',
        productStyle: 'Black',
        accessories: null,
        quantity: 1,
        unitPrice: 250000
      }
    ],
    paymentRecords: [
      {
        id: 'pay-001',
        paymentDate: '2026-02-18T11:00:00Z',
        paymentAmount: 125000,
        paymentMethod: PaymentMethod.BANK_TRANSFER
      }
    ],
    totalAmount: 250000,
    paidAmount: 125000
  }

  it('應正確渲染訂購人資訊', () => {
    const wrapper = mount(OrderDocumentPreview, {
      props: {
        visible: true,
        data: mockOrderData
      }
    })

    expect(wrapper.text()).toContain('測試客戶')
    expect(wrapper.text()).toContain('0912-345-678')
    expect(wrapper.text()).toContain('test_line')
  })

  it('預購訂單不應顯示配件欄位', () => {
    const wrapper = mount(OrderDocumentPreview, {
      props: {
        visible: true,
        data: mockOrderData
      }
    })

    expect(wrapper.text()).not.toContain('配件')
  })

  it('現貨訂單應顯示配件欄位', () => {
    const spotOrderData = {
      ...mockOrderData,
      orderType: OrderType.SPOT_PURCHASE,
      orderItems: [
        {
          ...mockOrderData.orderItems[0],
          accessories: ['BOX', 'DUST_BAG']
        }
      ]
    }

    const wrapper = mount(OrderDocumentPreview, {
      props: {
        visible: true,
        data: spotOrderData
      }
    })

    expect(wrapper.text()).toContain('配件')
  })

  it('點擊列印按鈕應觸發 print 事件', async () => {
    const wrapper = mount(OrderDocumentPreview, {
      props: {
        visible: true,
        data: mockOrderData
      }
    })

    await wrapper.find('[data-testid="print-button"]').trigger('click')
    expect(wrapper.emitted('print')).toBeTruthy()
  })
})
```

---

### Step 6: 手動測試（30 分鐘）

#### 測試檢查清單

- [ ] **基本顯示**
  - [ ] 對話框能正常開啟與關閉
  - [ ] 所有欄位正確顯示（訂單編號、客戶資訊、商品明細、付款紀錄、定金須知）
  - [ ] Line ID 和銀行帳號為空時顯示「-」

- [ ] **動態欄位邏輯**
  - [ ] 預購訂單不顯示配件欄位
  - [ ] 現貨訂單顯示配件欄位
  - [ ] 配件值正確轉換為中文標籤

- [ ] **列印功能**
  - [ ] 點擊「列印」按鈕觸發瀏覽器列印對話框
  - [ ] 列印預覽中只顯示訂購單內容（無 header/footer）
  - [ ] 列印輸出為 A4 格式
  - [ ] 商品項目不跨頁分割
  - [ ] 品牌標的、表格框線清晰可見

- [ ] **響應式**
  - [ ] 在桌機螢幕（1920x1080）正常顯示
  - [ ] 在平板螢幕（768x1024）正常顯示

- [ ] **邊界案例**
  - [ ] 沒有付款紀錄時顯示正常
  - [ ] 商品明細超過 10 項時自動分頁
  - [ ] 長品牌名稱或款式名稱不破壞版面

---

## 開發注意事項

### 🚨 必須遵守的規範

1. **檔案命名**: 
   - 元件使用 PascalCase（`OrderDocumentPreview.vue`）
   - 組合式函式使用 camelCase（`useOrderDocumentPreview.ts`）

2. **型別定義**:
   - 使用 JSDoc 單行註解（`/** 註解 */`）
   - Props 與 Emits 必須明確定義型別

3. **樣式**:
   - 使用 `<style scoped lang="scss">` 處理元件樣式
   - 列印樣式使用非 scoped 的 `<style lang="scss">`
   - 複用專案 CSS 變數（`var(--el-color-primary)` 等）

4. **權限控制**:
   - 按鈕必須加上 `v-permission` 指令
   - 權限代碼使用 `ORDER_PERMISSIONS.READ`

5. **不可修改現有程式碼**（除非明確需要）:
   - 僅新增功能，不重構現有邏輯
   - 若需修改 `types.ts`，只在檔案末尾新增內容

### ⚡ 效能優化建議

1. **懶載入**: 若訂購單元件較大，可考慮使用 `defineAsyncComponent`
2. **記憶化**: 格式化函式可使用 `computed` 快取結果
3. **事件防抖**: 列印按鈕加上 loading 狀態防止重複點擊

### 🐛 常見問題

**Q: 列印時仍顯示其他頁面元素？**  
A: 檢查 CSS 選擇器是否正確，確保使用 `:has()` 偽類精確匹配對話框。

**Q: 商品項目跨頁分割？**  
A: 確認 `.product-card` 有 `break-inside: avoid` 樣式。

**Q: 配件欄位未根據訂單類型隱藏？**  
A: 檢查 `v-if="data.orderType === OrderType.SPOT_PURCHASE"` 條件是否正確。

**Q: 定金須知換行顯示異常？**  
A: 使用 `<pre>` 標籤並設置 `white-space: pre-wrap` 樣式。

---

## 提交規範

### Commit Message 範例

```bash
# 型別定義
feat(order): add OrderDocumentData types

# 組合式函式
feat(order): add useOrderDocumentPreview composable

# 訂購單元件
feat(order): add OrderDocumentPreview component

# 整合至主頁面
feat(order): integrate order document generation button

# 單元測試
test(order): add OrderDocumentPreview component tests

# 修復問題
fix(order): correct accessories display logic for pre-orders
```

### Pull Request 檢查清單

- [ ] 所有新增檔案遵循專案命名規範
- [ ] TypeScript 編譯無錯誤（`pnpm type-check`）
- [ ] ESLint 檢查通過（`pnpm lint`）
- [ ] 單元測試通過（`pnpm test`）
- [ ] 功能手動測試完成（桌機 + 平板 + 列印）
- [ ] 程式碼註解完整（JSDoc + 邏輯說明）
- [ ] 已在本機測試列印輸出（Chrome + Edge）

---

## 相關文件

- [功能規格](./spec.md) - 完整需求與驗收標準
- [實作計畫](./plan.md) - 技術架構與計畫概覽
- [研究文件](./research.md) - 技術決策與最佳實踐
- [資料模型](./data-model.md) - 資料結構與轉換邏輯
- [專案開發規範](../../.specify/memory/plan-instruction.md) - 程式碼風格與慣例

---

## 時間估計明細

| 階段 | 時間 | 說明 |
|------|------|------|
| Step 1: 型別定義 | 15 分鐘 | 擴充 types.ts |
| Step 2: 組合式函式 | 30 分鐘 | useOrderDocumentPreview |
| Step 3: 預覽元件 | 2-3 小時 | OrderDocumentPreview.vue |
| Step 4: 頁面整合 | 45 分鐘 | 整合至 index.vue |
| Step 5: 單元測試 | 1 小時 | 撰寫測試案例 |
| Step 6: 手動測試 | 30 分鐘 | 功能驗證與列印測試 |
| 除錯與調整 | 1-2 小時 | 解決跨瀏覽器問題、樣式微調 |
| **總計** | **6-8 小時** | 完整實作與測試 |

---

**準備好了嗎？** 開始開發前請確認：
- ✅ 已閱讀所有參考文件
- ✅ 已檢查本機環境符合需求
- ✅ 已建立功能分支 `010-order-document`
- ✅ 已理解資料流程與元件結構

**祝開發順利！** 🚀

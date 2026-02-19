# Data Model: 商品訂購單文件產生

**Feature**: 010-order-document  
**Date**: 2026-02-18  
**Status**: ✅ Complete

---

## 概述

本文件定義商品訂購單文件產生功能所需的資料結構。訂購單為前端產生的文件，主要資料來源為現有的 `SalesOrder` 實體，無需新增後端 API 或資料庫變更。

---

## 核心實體

### 1. OrderDocumentData

**描述**: 訂購單文件的完整資料結構，用於 `OrderDocumentPreview.vue` 元件的 props。

**來源**: 從 `SalesOrder` 實體轉換而來（由前端組合式函式 `useOrderDocumentPreview` 處理）

```typescript
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
```

**欄位說明**:
- `customerLineId` 為選填欄位，空值時在文件上顯示「-」
- `orderType` 決定商品明細的欄位顯示（預購不顯示配件）
- `paymentRecords` 包含完整的付款記錄列表，支援多筆付款

---

### 2. OrderDocumentItem

**描述**: 訂購單中的單一商品項目資料。

**來源**: 從 `SalesOrder.orderItems` 轉換而來

```typescript
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
```

**欄位說明**:
- `accessories` 在預購訂單 (`OrderType.PRE_ORDER`) 中為 `null`，在現貨訂單 (`OrderType.SPOT_PURCHASE`) 中為字串陣列
- 配件值為英文代碼（如 `"BOX"`, `"CARD"`），需透過 `ACCESSORY_OPTIONS` 常數轉換為中文標籤

---

### 3. PaymentRecordSummary

**描述**: 付款紀錄摘要，用於訂購單顯示。

**來源**: 從後端 `PaymentRecord` 實體簡化而來（已存在於 `order-management/types.ts`）

```typescript
/** 付款紀錄摘要 */
export interface PaymentRecordSummary {
  /** 付款紀錄唯一識別碼（UUID） */
  id: string
  
  /** 付款日期（ISO 8601, UTC） */
  paymentDate: string
  
  /** 付款金額 */
  paymentAmount: number
  
  /** 付款方式 */
  paymentMethod: PaymentMethod
  /** 銀行帳戶末五碼（選填，僅現金匯款時使用） */
  bankAccountLastFive: string | null
}
```

**欄位說明**:
- `paymentMethod` 使用現有的 `PaymentMethod` 枚舉（`STORE_CASH`, `BANK_TRANSFER`, `ONLINE_CARD`, `INSTALLMENT`）
- 顯示時使用 `PAYMENT_METHOD_LABELS` 常數轉換為中文標籤

---

### 4. DepositTerms（常數）

**描述**: 商品預購定金須知的固定法律條款內容。

**來源**: 根據功能規格 FR-006 定義的條款文字

```typescript
/** 商品預購定金須知（固定內容） */
export const DEPOSIT_TERMS = `
確認訂購後 REALYOU 將收取 50% 訂購金額為定金（支付定金方不履行契約時，無權請求返還）。

唯獨在 REALYOU 無法如期交付商品時退還，除因物流或其他不可抗因素（天災/疫情/戰爭/政治等因素）所造成之延誤，與 REALYOU 無關。

溢品與作品多為手工製作，難免有些許不完美之處：些許溢膠、皮紋皺摺、線頭收尾，皆不影響正常使用！

商品經由專業人員鑑定完成，保證正品，唯商品本身並無提供保固，致商品保固及維修問題，請洽品牌專櫃或可由廠商代送處理。

定金一旦支付，僅在第二條條文情形下才會退還，支付前請務必三思。

通知商品到貨日起逾 2 週內仍未支付尾款，視為「違約棄單」，REALYOU 得解除契約並沒收定金。

下定前請詳閱 REALYOU 官網下方 > 常見問題 > 購物須知，匯款完成即代表同意「商品預購定金須知」。
` as const
```

**使用方式**:
```vue
<template>
  <div class="terms-content">
    <pre>{{ DEPOSIT_TERMS }}</pre>
  </div>
</template>

<script setup lang="ts">
import { DEPOSIT_TERMS } from '@/pages/order-management/types'
</script>
```

---

## 資料轉換邏輯

### 從 SalesOrder 轉換為 OrderDocumentData

**位置**: `src/pages/order-management/composables/useOrderDocumentPreview.ts`

```typescript
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
    customerBankAccountLast5: order.customerBankAccountLast5 || null,
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
      paymentMethod: record.paymentMethod
    })),
    totalAmount: order.totalAmount,
    paidAmount: order.paidAmount
  }
}
```

**轉換規則**:
1. 直接映射大部分欄位
2. 選填欄位（Line ID、銀行帳號）為空字串時轉換為 `null`
3. 商品明細的 `accessories` 根據訂單類型決定：
   - 預購訂單：設為 `null`
   - 現貨訂單：保留原始陣列
4. 付款紀錄只保留必要欄位

---

## 型別定義檔案位置

### 新增型別（需加入 `src/pages/order-management/types.ts`）

```typescript
// ============================================================================
// Order Document Types (訂購單文件型別)
// ============================================================================

/** 訂購單文件資料 */
export interface OrderDocumentData {
  // ... (如上述定義)
}

/** 訂購單商品項目 */
export interface OrderDocumentItem {
  // ... (如上述定義)
}

/** 商品預購定金須知（固定內容） */
export const DEPOSIT_TERMS = `...` as const
```

### 複用現有型別

以下型別已存在於 `src/pages/order-management/types.ts`，無需重複定義：
- `OrderType` (枚舉)
- `PaymentMethod` (枚舉)
- `PaymentRecordSummary` (介面，已存在於 ShippingLabelResponse 中)
- `PAYMENT_METHOD_LABELS` (常數)
- `ACCESSORY_OPTIONS` (常數)

---

## 實體關係圖

```
┌─────────────────────────────────────────────┐
│           OrderDocumentData                 │
│  (訂購單文件的完整資料結構)                 │
├─────────────────────────────────────────────┤
│ - orderNumber: string                       │
│ - orderDate: string                         │
│ - orderType: OrderType                      │
│ - customerName: string                      │
│ - customerPhone: string                     │
│ - customerLineId: string | null             │
│ - orderItems: OrderDocumentItem[]          │───┐
│ - paymentRecords: PaymentRecordSummary[]   │───┼─┐
│ - totalAmount: number                       │   │ │
│ - paidAmount: number                        │   │ │
└─────────────────────────────────────────────┘   │ │
                                                  │ │
                                                  │ │
    ┌─────────────────────────────────────────────┘ │
    │                                               │
    ▼                                               ▼
┌─────────────────────────────────┐   ┌────────────────────────────┐
│    OrderDocumentItem            │   │   PaymentRecordSummary     │
│  (商品項目)                     │   │  (付款紀錄摘要)            │
├─────────────────────────────────┤   ├────────────────────────────┤
│ - id: string                    │   │ - id: string               │
│ - brandName: string             │   │ - paymentDate: string      │
│ - productName: string           │   │ - paymentAmount: number    │
│ - productStyle: string          │   │ - paymentMethod: enum      │
│ - accessories: string[] | null  │   └────────────────────────────┘
│ - quantity: number              │
│ - unitPrice: number             │
└─────────────────────────────────┘

┌─────────────────────────────────┐
│      DEPOSIT_TERMS              │
│  (定金須知常數)                 │
├─────────────────────────────────┤
│ 固定的法律條款文字內容          │
└─────────────────────────────────┘
```

---

## 驗證規則

### 業務規則驗證（前端顯示層）

1. **必填欄位檢查**（在產生訂購單前）:
   - `orderNumber` 不可為空
   - `customerName` 不可為空
   - `customerPhone` 不可為空
   - `orderItems` 陣列不可為空（至少一項商品）

2. **選填欄位處理**:
   - `customerLineId` 為 `null` 或空字串時，顯示「-」

3. **金額驗證**:
   - `totalAmount` 必須 ≥ 0
   - `paidAmount` 必須 ≥ 0
   - `unitPrice` 必須 > 0

4. **配件欄位邏輯**:
   - 預購訂單 (`OrderType.PRE_ORDER`): `accessories` 必須為 `null`（隱藏欄位）
   - 現貨訂單 (`OrderType.SPOT_PURCHASE`): `accessories` 可為空陣列或包含配件

**注意**: 資料驗證主要由後端負責，前端僅負責顯示格式檢查與容錯處理。

---

## 格式化函式

### 日期格式化

```typescript
/**
 * 格式化日期為「YYYY/MM/DD」格式
 */
function formatDate(dateStr: string): string {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return date.toLocaleDateString('zh-TW', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  })
}
```

### 金額格式化

```typescript
/**
 * 格式化金額為「NT$ 999,999」格式
 */
function formatCurrency(amount: number | undefined | null): string {
  if (amount == null) return 'NT$ 0'
  return `NT$ ${amount.toLocaleString()}`
}
```

### 配件格式化

```typescript
/**
 * 將配件值轉換為中文標籤（如 "BOX" → "盒子"）
 */
function formatAccessories(accessories: string[] | null): string {
  if (!accessories || accessories.length === 0) return '無'
  return accessories
    .map((accessory) => {
      const option = ACCESSORY_OPTIONS.find(opt => opt.value === accessory)
      return option ? option.label : accessory
    })
    .join('、')
}
```

---

## 測試資料範例

### 預購訂單範例

```typescript
const preOrderDocument: OrderDocumentData = {
  orderNumber: 'RYO20260218001',
  orderDate: '2026-02-18T10:30:00Z',
  orderType: OrderType.PRE_ORDER,
  customerName: '王小明',
  customerPhone: '0912-345-678',
  customerLineId: 'wang_xiaoming',
  orderItems: [
    {
      id: 'item-001',
      brandName: 'CHANEL',
      productName: 'Classic Flap Bag',
      productStyle: 'Black Lambskin with Gold Hardware',
      accessories: null, // 預購訂單不顯示配件
      quantity: 1,
      unitPrice: 250000
    }
  ],
  paymentRecords: [
    {
      id: 'payment-001',
      paymentDate: '2026-02-18T11:00:00Z',
      paymentAmount: 125000,
      paymentMethod: PaymentMethod.BANK_TRANSFER,
      bankAccountLastFive: '12345'
    }
  ],
  totalAmount: 250000,
  paidAmount: 125000
}
```

### 現貨訂單範例

```typescript
const spotOrderDocument: OrderDocumentData = {
  orderNumber: 'RYO20260218002',
  orderDate: '2026-02-18T14:00:00Z',
  orderType: OrderType.SPOT_PURCHASE,
  customerName: '李小華',
  customerPhone: '0922-333-444',
  customerLineId: null, // 客戶未提供 Line ID
  orderItems: [
    {
      id: 'item-002',
      brandName: 'LOUIS VUITTON',
      productName: 'Neverfull MM',
      productStyle: 'Monogram Canvas',
      accessories: ['BOX', 'DUST_BAG', 'CARD'], // 現貨訂單顯示配件
      quantity: 1,
      unitPrice: 180000
    }
  ],
  paymentRecords: [
    {
      id: 'payment-002',
      paymentDate: '2026-02-18T14:30:00Z',
      paymentAmount: 180000,
      paymentMethod: PaymentMethod.ONLINE_CARD,
      bankAccountLastFive: null
    }
  ],
  totalAmount: 180000,
  paidAmount: 180000
}
```

---

## 資料來源對照表

| OrderDocumentData 欄位 | 資料來源（SalesOrder） | 備註 |
|------------------------|------------------------|------|
| `orderNumber` | `SalesOrder.orderNumber` | 直接映射 |
| `orderDate` | `SalesOrder.orderDate` | 直接映射 |
| `orderType` | `SalesOrder.orderType` | 直接映射 |
| `customerName` | `SalesOrder.customerName` | 直接映射 |
| `customerPhone` | `SalesOrder.customerPhone` | 直接映射 |
| `customerLineId` | `SalesOrder.customerLineId` | 空字串轉 `null` |
| `orderItems` | `SalesOrder.orderItems` | 轉換為 `OrderDocumentItem[]` |
| `paymentRecords` | `SalesOrder.paymentRecords` | 簡化為 `PaymentRecordSummary[]` |
| `totalAmount` | `SalesOrder.totalAmount` | 直接映射 |
| `paidAmount` | `SalesOrder.paidAmount` | 直接映射 |

---

## 與現有系統的整合

### 1. 與 ShippingLabelPreview 的差異

| 項目 | ShippingLabelPreview | OrderDocumentPreview |
|------|----------------------|----------------------|
| **用途** | 出貨單（物流文件） | 訂購單（客戶確認文件） |
| **顯示內容** | 收件資訊、出貨狀態、商品詳情 | 訂購人資訊、商品明細、定金須知 |
| **特殊欄位** | 收件方式、簽名檢核 | Line ID、銀行帳號、定金條款 |
| **配件顯示** | 一律顯示 | 根據訂單類型動態顯示 |
| **付款紀錄** | 顯示完整列表 | 顯示完整列表 |

### 2. 複用的元件與常數

- **元件**: `BrandBanner.vue`（品牌標的）
- **型別**: `OrderType`, `PaymentMethod`, `PaymentRecordSummary`
- **常數**: `PAYMENT_METHOD_LABELS`, `ACCESSORY_OPTIONS`
- **樣式**: `fonts.css`（字型樣式）

---

## 未來擴充考量

1. **多語系支援**: 目前定金須知為繁體中文固定內容，未來可改為國際化 (i18n) 字串
2. **電子簽名**: 目前為空白簽名欄位，未來可整合電子簽名功能
3. **QR Code**: 可加入訂單 QR Code，方便客戶掃描查詢訂單狀態
4. **浮水印**: 可加入「COPY」或「DRAFT」浮水印，區分正式與副本文件

---

**資料模型結論**: 所有必要的資料結構已完整定義，資料來源明確（從 `SalesOrder` 轉換），無需修改後端 API，可直接進入實作階段。

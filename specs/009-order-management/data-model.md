# Data Model: 訂單管理模組

**Date**: 2026-02-06 | **Branch**: `009-order-management` | **Phase**: 1

## Overview

本文件定義訂單管理模組的所有前端資料模型,包括實體型別、請求/回應 DTO、查詢參數型別等。所有型別定義基於後端 OpenAPI 規範(`/api/sales-orders` 系列 API)並遵循專案既有的型別命名規範。

## Type Definitions Location

```text
src/pages/order-management/
└── types.ts  # 所有型別定義集中於此檔案
```

## Core Entities (實體型別)

### SalesOrder (銷售訂單)

```typescript
/** 銷售訂單實體(詳細資訊) */
export interface SalesOrder {
  /** 訂單唯一識別碼(UUID) */
  id: string
  /** 訂單編號(格式: RYO + YYYYMMDD + 流水號,例如: RYO20260204001) */
  orderNumber: string
  /** 訂單日期(ISO 8601, UTC) */
  orderDate: string
  /** 訂單類型 */
  orderType: OrderType
  /** 客戶 ID(UUID) */
  customerId: string
  /** 客戶姓名 */
  customerName: string
  /** 客戶電話 */
  customerPhone: string
  /** 商品小計(所有訂單項目金額總和) */
  subtotalAmount: number
  /** 運費 */
  shippingFee: number
  /** 總金額(商品小計 + 運費) */
  totalAmount: number
  /** 付款狀態 */
  paymentStatus: PaymentStatus
  /** 訂單狀態 */
  orderStatus: OrderStatus
  /** 出貨狀態 */
  shippingStatus: ShippingStatus
  /** 收件方式 */
  deliveryMethod: DeliveryMethod
  /** 收件資訊(依 deliveryMethod 而異,型別為 any) */
  deliveryInfo: DeliveryInfo
  /** 訂單備註(最多 1000 字元) */
  remarks: string | null
  /** 訂單項目清單 */
  orderItems: OrderItem[]
  /** 付款記錄清單 */
  paymentRecords: PaymentRecord[]
  /** 建立時間(ISO 8601, UTC) */
  createdAt: string
  /** 建立者名稱 */
  createdByName: string
  /** 版本號(用於樂觀鎖定) */
  version: number
}

/** 銷售訂單列表項目(簡化版本,用於列表顯示) */
export interface SalesOrderListItem {
  /** 訂單唯一識別碼 */
  id: string
  /** 訂單編號 */
  orderNumber: string
  /** 訂單日期 */
  orderDate: string
  /** 訂單類型 */
  orderType: OrderType
  /** 客戶 ID */
  customerId: string
  /** 客戶姓名 */
  customerName: string
  /** 客戶電話 */
  customerPhone: string
  /** 商品小計 */
  subtotalAmount: number
  /** 運費 */
  shippingFee: number
  /** 總金額 */
  totalAmount: number
  /** 付款狀態 */
  paymentStatus: PaymentStatus
  /** 訂單狀態 */
  orderStatus: OrderStatus
  /** 出貨狀態 */
  shippingStatus: ShippingStatus
  /** 收件方式 */
  deliveryMethod: DeliveryMethod
  /** 訂單備註 */
  remarks: string | null
  /** 建立時間 */
  createdAt: string
  /** 建立者名稱 */
  createdByName: string
  /** 版本號 */
  version: number
}
```

### OrderItem (訂單項目)

```typescript
/** 訂單項目實體 */
export interface OrderItem {
  /** 訂單項目唯一識別碼(UUID) */
  id: string
  /** 商品名稱(必填) */
  productName: string
  /** 品牌名稱(必填) */
  brandName: string
  /** 磐石編碼(必填) */
  panshiCode: string
  /** 序號 ID(必填) */
  serialId: string
  /** 商品款式(必填) */
  productStyle: string
  /** 配件(選填,例如: "盒子、防塵袋") */
  accessories: string | null
  /** 商品來源(必填) */
  productSource: ProductSource
  /** 單價(必填,大於 0) */
  unitPrice: number
  /** 數量(必填,至少 1) */
  quantity: number
}
```

### PaymentRecord (付款記錄)

```typescript
/** 付款記錄實體 */
export interface PaymentRecord {
  /** 付款記錄唯一識別碼(UUID) */
  id: string
  /** 付款日期(ISO 8601, UTC) */
  paymentDate: string
  /** 付款金額(必須大於 0) */
  paymentAmount: number
  /** 付款方式 */
  paymentMethod: PaymentMethod
  /** 銀行帳戶末五碼(選填,僅現金匯款時使用) */
  bankAccountLastFive: string | null
  /** 建立時間(ISO 8601, UTC) */
  createdAt: string
}
```

### DeliveryInfo (收件資訊)

```typescript
/** 收件資訊基礎型別(聯集型別) */
export type DeliveryInfo = PickupInfo | HomeDeliveryInfo | StorePickupInfo | PlatformDeliveryInfo

/** 自取收件資訊 */
export interface PickupInfo {
  type: 'PICKUP'
  /** 自取地點(必填,1-200 字元) */
  pickupLocation: string
  /** 自取時間(必填,ISO 8601 格式) */
  pickupTime: string
}

/** 宅配收件資訊 */
export interface HomeDeliveryInfo {
  type: 'HOME_DELIVERY'
  /** 收件人姓名(必填,1-50 字元) */
  recipientName: string
  /** 收件人電話(必填,10 位數字,格式: 09XXXXXXXX) */
  recipientPhone: string
  /** 收件地址(必填,10-200 字元) */
  recipientAddress: string
}

/** 超商取貨收件資訊 */
export interface StorePickupInfo {
  type: 'STORE_PICKUP'
  /** 超商門市資訊(必填,純文字,1-200 字元) */
  storeInfo: string
  /** 取貨人姓名(必填,1-50 字元) */
  recipientName: string
  /** 取貨人電話(必填,10 位數字) */
  recipientPhone: string
}

/** 平台物流收件資訊 */
export interface PlatformDeliveryInfo {
  type: 'PLATFORM'
  /** 平台物流無需額外資訊 */
}
```

## Enums (枚舉型別)

```typescript
/** 訂單類型 */
export enum OrderType {
  /** 代購現貨 */
  SPOT_PURCHASE = 'SPOT_PURCHASE',
  /** 預購 */
  PRE_ORDER = 'PRE_ORDER'
}

/** 付款狀態 */
export enum PaymentStatus {
  /** 未付款 */
  UNPAID = 'UNPAID',
  /** 部分付款 */
  PARTIAL = 'PARTIAL',
  /** 已付款 */
  PAID = 'PAID'
}

/** 訂單狀態 */
export enum OrderStatus {
  /** 訂單成立 */
  PLACED = 'PLACED',
  /** 已完成 */
  COMPLETED = 'COMPLETED',
  /** 已取消 */
  CANCELLED = 'CANCELLED'
}

/** 出貨狀態 */
export enum ShippingStatus {
  /** 未出貨 */
  NOT_SHIPPED = 'NOT_SHIPPED',
  /** 已出貨 */
  SHIPPED = 'SHIPPED'
}

/** 收件方式 */
export enum DeliveryMethod {
  /** 自取 */
  PICKUP = 'PICKUP',
  /** 宅配 */
  HOME_DELIVERY = 'HOME_DELIVERY',
  /** 超商取貨 */
  STORE_PICKUP = 'STORE_PICKUP',
  /** 平台物流 */
  PLATFORM = 'PLATFORM'
}

/** 商品來源 */
export enum ProductSource {
  /** 收購 */
  BUYBACK = 'BUYBACK',
  /** 寄賣 */
  CONSIGNMENT = 'CONSIGNMENT',
  /** 代購 */
  PURCHASE = 'PURCHASE'
}

/** 付款方式 */
export enum PaymentMethod {
  /** 門市現金 */
  STORE_CASH = 'STORE_CASH',
  /** 現金匯款 */
  BANK_TRANSFER = 'BANK_TRANSFER',
  /** 線上刷卡 */
  ONLINE_CARD = 'ONLINE_CARD',
  /** 無卡分期 */
  INSTALLMENT = 'INSTALLMENT'
}
```

## Request DTOs (請求資料傳輸物件)

### CreateSalesOrderRequest (建立訂單請求)

```typescript
/** 建立銷售訂單請求 */
export interface CreateSalesOrderRequest {
  /** 訂單類型 */
  orderType: OrderType
  /** 客戶 ID(必填,必須為既有客戶) */
  customerId: string
  /** 訂單項目清單(至少 1 項) */
  orderItems: CreateOrderItemRequest[]
  /** 收件方式 */
  deliveryMethod: DeliveryMethod
  /** 收件資訊(依 deliveryMethod 而異) */
  deliveryInfo: DeliveryInfo
  /** 運費(選填,未提供則使用系統預設值) */
  shippingFee?: number
  /** 訂單備註(選填,最多 1000 字元) */
  remarks?: string
}

/** 建立訂單項目請求 */
export interface CreateOrderItemRequest {
  /** 商品名稱 */
  productName: string
  /** 品牌名稱 */
  brandName: string
  /** 磐石編碼 */
  panshiCode: string
  /** 序號 ID */
  serialId: string
  /** 商品款式 */
  productStyle: string
  /** 配件(選填) */
  accessories?: string
  /** 商品來源 */
  productSource: ProductSource
  /** 單價(必須大於 0) */
  unitPrice: number
  /** 數量(至少 1) */
  quantity: number
}
```

### UpdateSalesOrderRequest (修改訂單請求)

```typescript
/** 修改銷售訂單請求 */
export interface UpdateSalesOrderRequest {
  /** 訂單項目清單(選填,若提供則完整取代現有項目) */
  orderItems?: CreateOrderItemRequest[]
  /** 收件方式(選填) */
  deliveryMethod?: DeliveryMethod
  /** 收件資訊(選填,依 deliveryMethod 而異) */
  deliveryInfo?: DeliveryInfo
  /** 運費(選填) */
  shippingFee?: number
  /** 訂單備註(選填) */
  remarks?: string
  /** 當前版本號(必填,用於樂觀鎖定) */
  version: number
}
```

### AddPaymentRecordRequest (新增付款記錄請求)

```typescript
/** 新增付款記錄請求 */
export interface AddPaymentRecordRequest {
  /** 付款日期(ISO 8601 格式) */
  paymentDate: string
  /** 付款金額(必須大於 0) */
  paymentAmount: number
  /** 付款方式 */
  paymentMethod: PaymentMethod
  /** 銀行帳戶末五碼(選填,僅現金匯款時使用) */
  bankAccountLastFive?: string
}
```

### UpdatePaymentRecordRequest (修改付款記錄請求)

```typescript
/** 修改付款記錄請求(僅允許修改銀行末五碼) */
export interface UpdatePaymentRecordRequest {
  /** 銀行帳戶末五碼(選填) */
  bankAccountLastFive?: string
}
```

### UpdatePaymentStatusRequest (更新付款狀態請求)

```typescript
/** 更新付款狀態請求(手動調整) */
export interface UpdatePaymentStatusRequest {
  /** 付款狀態 */
  paymentStatus: PaymentStatus
}
```

### UpdateOrderStatusRequest (更新訂單狀態請求)

```typescript
/** 更新訂單狀態請求 */
export interface UpdateOrderStatusRequest {
  /** 訂單狀態 */
  orderStatus: OrderStatus
}
```

### UpdateShippingStatusRequest (更新出貨狀態請求)

```typescript
/** 更新出貨狀態請求 */
export interface UpdateShippingStatusRequest {
  /** 出貨狀態 */
  shippingStatus: ShippingStatus
}
```

## Response DTOs (回應資料傳輸物件)

### ApiResponse (標準 API 回應格式)

```typescript
/** 標準 API 回應格式 */
export interface ApiResponse<T = any> {
  /** 操作是否成功 */
  success: boolean
  /** 業務邏輯代碼(如: VALIDATION_ERROR, CONCURRENT_UPDATE_CONFLICT) */
  code: string
  /** 繁體中文訊息 */
  message: string
  /** 回應資料(可為 null) */
  data: T | null
  /** 回應時間戳記(ISO 8601, UTC) */
  timestamp: string
  /** 分散式追蹤 ID */
  traceId: string
  /** 驗證錯誤詳情(僅在驗證失敗時使用) */
  errors?: Record<string, string[]>
}
```

### PagedResponse (分頁回應格式)

```typescript
/** 分頁回應格式(扁平化,避免 Data.Items 巢狀) */
export interface PagedResponse<T> {
  /** 操作是否成功 */
  success: boolean
  /** 業務邏輯代碼 */
  code: string
  /** 訊息 */
  message: string
  /** 分頁項目清單 */
  data: T[]
  /** 當前頁碼(從 1 開始) */
  pageNumber: number
  /** 每頁大小 */
  pageSize: number
  /** 總筆數 */
  totalCount: number
  /** 時間戳 */
  timestamp: string
  /** 追蹤 ID */
  traceId: string
}
```

### ShippingLabelResponse (出貨單資料回應)

```typescript
/** 出貨單資料回應 */
export interface ShippingLabelResponse {
  /** 訂單編號 */
  orderNumber: string
  /** 訂單日期 */
  orderDate: string
  /** 客戶名稱 */
  customerName: string
  /** 收件方式 */
  deliveryMethod: DeliveryMethod
  /** 收件資訊(依 deliveryMethod 而異) */
  deliveryInfo: DeliveryInfo
  /** 訂單項目清單 */
  orderItems: OrderItem[]
}
```

### SalesOrderExportDto (匯出資料 DTO)

```typescript
/** 銷售訂單匯出資料 DTO */
export interface SalesOrderExportDto {
  /** 訂單編號 */
  orderNumber: string
  /** 客戶名稱 */
  customerName: string
  /** 商品名稱(多項以逗號分隔) */
  productName: string
  /** 售出金額(總金額) */
  totalAmount: number
  /** 付款狀態 */
  paymentStatus: string
  /** 訂單狀態 */
  orderStatus: string
  /** 出貨狀態 */
  shippingStatus: string
  /** 建立日期 */
  createdAt: string
  /** 操作者 */
  createdByName: string
}
```

## Query Parameters (查詢參數型別)

### SalesOrderListParams (訂單列表查詢參數)

```typescript
/** 訂單列表查詢參數 */
export interface SalesOrderListParams {
  /** 頁碼(從 1 開始,預設 1) */
  pageNumber: number
  /** 每頁筆數(1-100,預設 20) */
  pageSize: number
  /** 訂單編號(模糊搜尋,選填) */
  orderNumber?: string
  /** 客戶名稱(模糊搜尋,選填) */
  customerName?: string
  /** 商品名稱(模糊搜尋,選填) */
  productName?: string
  /** 訂單狀態篩選(選填) */
  orderStatus?: OrderStatus
  /** 付款狀態篩選(選填) */
  paymentStatus?: PaymentStatus
  /** 出貨狀態篩選(選填) */
  shippingStatus?: ShippingStatus
  /** 訂單日期起始(選填,YYYY-MM-DD) */
  orderDateStart?: string
  /** 訂單日期結束(選填,YYYY-MM-DD) */
  orderDateEnd?: string
}
```

### OrderExportParams (訂單匯出參數)

```typescript
/** 訂單匯出參數 */
export interface OrderExportParams {
  /** 訂單狀態篩選(選填) */
  orderStatus?: OrderStatus
  /** 付款狀態篩選(選填) */
  paymentStatus?: PaymentStatus
  /** 訂單日期起始(選填) */
  orderDateStart?: string
  /** 訂單日期結束(選填) */
  orderDateEnd?: string
}
```

## Form Models (表單模型)

### OrderFormData (訂單表單資料)

```typescript
/** 訂單表單資料(用於新增/編輯) */
export interface OrderFormData {
  /** 訂單類型 */
  orderType: OrderType
  /** 客戶 ID */
  customerId: string
  /** 訂單項目清單 */
  orderItems: OrderItemFormData[]
  /** 收件方式 */
  deliveryMethod: DeliveryMethod
  /** 收件資訊 */
  deliveryInfo: Partial<DeliveryInfo>
  /** 運費 */
  shippingFee: number
  /** 訂單備註 */
  remarks: string
  /** 版本號(編輯時使用) */
  version?: number
}

/** 訂單項目表單資料 */
export interface OrderItemFormData {
  /** 臨時 ID(用於前端識別,提交時移除) */
  tempId?: string
  /** 商品名稱 */
  productName: string
  /** 品牌名稱 */
  brandName: string
  /** 磐石編碼 */
  panshiCode: string
  /** 序號 ID */
  serialId: string
  /** 商品款式 */
  productStyle: string
  /** 配件 */
  accessories: string
  /** 商品來源 */
  productSource: ProductSource
  /** 單價 */
  unitPrice: number
  /** 數量 */
  quantity: number
}
```

### PaymentRecordFormData (付款記錄表單資料)

```typescript
/** 付款記錄表單資料 */
export interface PaymentRecordFormData {
  /** 付款日期(Date 物件,提交時轉為 ISO 8601) */
  paymentDate: Date | string
  /** 付款金額 */
  paymentAmount: number
  /** 付款方式 */
  paymentMethod: PaymentMethod
  /** 銀行帳戶末五碼 */
  bankAccountLastFive: string
}
```

## Utility Types (工具型別)

### Pagination (分頁資訊)

```typescript
/** 分頁資訊 */
export interface Pagination {
  /** 當前頁碼(從 1 開始) */
  pageNumber: number
  /** 每頁筆數 */
  pageSize: number
  /** 總筆數 */
  total: number
}
```

### SearchFilters (搜尋篩選條件)

```typescript
/** 搜尋篩選條件 */
export interface SearchFilters {
  /** 訂單編號 */
  orderNumber: string
  /** 客戶名稱 */
  customerName: string
  /** 商品名稱 */
  productName: string
  /** 訂單狀態 */
  orderStatus: OrderStatus | ''
  /** 付款狀態 */
  paymentStatus: PaymentStatus | ''
  /** 出貨狀態 */
  shippingStatus: ShippingStatus | ''
  /** 日期範圍 */
  dateRange: [string, string] | null
}
```

## Constants (常數定義)

### ShippingFeeConfig (運費配置)

```typescript
/** 
 * 運費配置(前端預設值)
 * 所有收件方式預設運費皆為 0,實際運費由使用者手動輸入
 * 系統不強制自動計算運費以保持彈性,可依業務規則調整
 */
export const SHIPPING_FEE_CONFIG: Record<DeliveryMethod, number> = {
  [DeliveryMethod.PICKUP]: 0,
  [DeliveryMethod.HOME_DELIVERY]: 0,
  [DeliveryMethod.STORE_PICKUP]: 0,
  [DeliveryMethod.PLATFORM]: 0
}
```

### StatusLabels (狀態標籤)

```typescript
/** 訂單狀態標籤 */
export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  [OrderStatus.PLACED]: '訂單成立',
  [OrderStatus.COMPLETED]: '已完成',
  [OrderStatus.CANCELLED]: '已取消'
}

/** 付款狀態標籤 */
export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  [PaymentStatus.UNPAID]: '未付款',
  [PaymentStatus.PARTIAL]: '部分付款',
  [PaymentStatus.PAID]: '已付款'
}

/** 出貨狀態標籤 */
export const SHIPPING_STATUS_LABELS: Record<ShippingStatus, string> = {
  [ShippingStatus.NOT_SHIPPED]: '未出貨',
  [ShippingStatus.SHIPPED]: '已出貨'
}

/** 收件方式標籤 */
export const DELIVERY_METHOD_LABELS: Record<DeliveryMethod, string> = {
  [DeliveryMethod.PICKUP]: '自取',
  [DeliveryMethod.HOME_DELIVERY]: '宅配',
  [DeliveryMethod.STORE_PICKUP]: '超商取貨',
  [DeliveryMethod.PLATFORM]: '平台物流'
}

/** 商品來源標籤 */
export const PRODUCT_SOURCE_LABELS: Record<ProductSource, string> = {
  [ProductSource.BUYBACK]: '收購',
  [ProductSource.CONSIGNMENT]: '寄賣',
  [ProductSource.PURCHASE]: '代購'
}

/** 付款方式標籤 */
export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  [PaymentMethod.STORE_CASH]: '門市現金',
  [PaymentMethod.BANK_TRANSFER]: '現金匯款',
  [PaymentMethod.ONLINE_CARD]: '線上刷卡',
  [PaymentMethod.INSTALLMENT]: '無卡分期'
}
```

### StatusColors (狀態顏色)

```typescript
/** 訂單狀態顏色(Element Plus Tag type) */
export const ORDER_STATUS_COLORS: Record<OrderStatus, '' | 'success' | 'info' | 'warning' | 'danger'> = {
  [OrderStatus.PLACED]: 'info',
  [OrderStatus.COMPLETED]: 'success',
  [OrderStatus.CANCELLED]: 'danger'
}

/** 付款狀態顏色 */
export const PAYMENT_STATUS_COLORS: Record<PaymentStatus, '' | 'success' | 'info' | 'warning' | 'danger'> = {
  [PaymentStatus.UNPAID]: 'danger',
  [PaymentStatus.PARTIAL]: 'warning',
  [PaymentStatus.PAID]: 'success'
}

/** 出貨狀態顏色 */
export const SHIPPING_STATUS_COLORS: Record<ShippingStatus, '' | 'success' | 'info' | 'warning' | 'danger'> = {
  [ShippingStatus.NOT_SHIPPED]: 'info',
  [ShippingStatus.SHIPPED]: 'success'
}
```

## Type Guards (型別守衛)

```typescript
/** 檢查是否為自取收件資訊 */
export function isPickupInfo(info: DeliveryInfo): info is PickupInfo {
  return info.type === 'PICKUP'
}

/** 檢查是否為宅配收件資訊 */
export function isHomeDeliveryInfo(info: DeliveryInfo): info is HomeDeliveryInfo {
  return info.type === 'HOME_DELIVERY'
}

/** 檢查是否為超商取貨收件資訊 */
export function isStorePickupInfo(info: DeliveryInfo): info is StorePickupInfo {
  return info.type === 'STORE_PICKUP'
}

/** 檢查是否為平台物流收件資訊 */
export function isPlatformDeliveryInfo(info: DeliveryInfo): info is PlatformDeliveryInfo {
  return info.type === 'PLATFORM'
}
```

## Validation Rules (驗證規則型別)

```typescript
import type { FormRules } from 'element-plus'

/** 訂單項目驗證規則 */
export const ORDER_ITEM_RULES: FormRules = {
  productName: [
    { required: true, message: '請輸入商品名稱', trigger: 'blur' },
    { min: 1, max: 200, message: '商品名稱長度為 1-200 字元', trigger: 'blur' }
  ],
  brandName: [
    { required: true, message: '請輸入品牌名稱', trigger: 'blur' },
    { min: 1, max: 100, message: '品牌名稱長度為 1-100 字元', trigger: 'blur' }
  ],
  panshiCode: [
    { required: true, message: '請輸入磐石編碼', trigger: 'blur' },
    { min: 1, max: 50, message: '磐石編碼長度為 1-50 字元', trigger: 'blur' }
  ],
  serialId: [
    { required: true, message: '請輸入序號 ID', trigger: 'blur' },
    { min: 1, max: 100, message: '序號 ID 長度為 1-100 字元', trigger: 'blur' }
  ],
  productStyle: [
    { required: true, message: '請輸入商品款式', trigger: 'blur' },
    { min: 1, max: 100, message: '商品款式長度為 1-100 字元', trigger: 'blur' }
  ],
  productSource: [
    { required: true, message: '請選擇商品來源', trigger: 'change' }
  ],
  unitPrice: [
    { required: true, message: '請輸入單價', trigger: 'blur' },
    { type: 'number', min: 0.01, message: '單價必須大於 0', trigger: 'blur' }
  ],
  quantity: [
    { required: true, message: '請輸入數量', trigger: 'blur' },
    { type: 'number', min: 1, message: '數量至少為 1', trigger: 'blur' }
  ]
}

/** 付款記錄驗證規則 */
export const PAYMENT_RECORD_RULES: FormRules = {
  paymentDate: [
    { required: true, message: '請選擇付款日期', trigger: 'change' }
  ],
  paymentAmount: [
    { required: true, message: '請輸入付款金額', trigger: 'blur' },
    { type: 'number', min: 0.01, message: '付款金額必須大於 0', trigger: 'blur' }
  ],
  paymentMethod: [
    { required: true, message: '請選擇付款方式', trigger: 'change' }
  ],
  bankAccountLastFive: [
    { pattern: /^\d{5}$/, message: '銀行末五碼必須為 5 位數字', trigger: 'blur' }
  ]
}
```

## Data Model Summary

### Key Design Decisions

1. **型別集中管理**: 所有型別定義集中於 `types.ts`,便於維護與複用
2. **枚舉優先**: 使用 TypeScript enum 定義所有狀態與類別,提供型別安全與自動完成
3. **聯集型別處理收件資訊**: 使用 discriminated union (`type` 欄位)區分不同收件方式,確保型別安全
4. **扁平化分頁格式**: 遵循後端 API 設計,避免 `Data.Items` 巢狀結構
5. **表單模型分離**: 區分 API 模型與表單模型,表單模型包含臨時欄位(如 `tempId`)
6. **常數定義**: 提供狀態標籤、顏色、預設運費等常數,統一管理顯示邏輯
7. **型別守衛**: 提供型別守衛函式以安全處理聯集型別
8. **驗證規則**: 定義 Element Plus FormRules,確保資料完整性

### Validation Summary

| 欄位 | 驗證規則 | 錯誤訊息 |
|------|---------|---------|
| 商品名稱 | 必填,1-200 字元 | 請輸入商品名稱 |
| 品牌名稱 | 必填,1-100 字元 | 請輸入品牌名稱 |
| 磐石編碼 | 必填,1-50 字元 | 請輸入磐石編碼 |
| 序號 ID | 必填,1-100 字元 | 請輸入序號 ID |
| 商品款式 | 必填,1-100 字元 | 請輸入商品款式 |
| 配件 | 選填,最多 500 字元 | - |
| 商品來源 | 必填 | 請選擇商品來源 |
| 單價 | 必填,大於 0 | 單價必須大於 0 |
| 數量 | 必填,至少 1 | 數量至少為 1 |
| 付款金額 | 必填,大於 0,不得超過剩餘應付金額 | 付款金額不得超過剩餘應付金額 X 元 |
| 銀行末五碼 | 5 位數字 | 銀行末五碼必須為 5 位數字 |
| 自取地點 | 必填,1-200 字元 | 請輸入自取地點 |
| 收件人姓名 | 必填,1-50 字元 | 請輸入收件人姓名 |
| 收件人電話 | 必填,10 位數字(09 開頭) | 請輸入有效的 10 位手機號碼 |
| 收件地址 | 必填,10-200 字元 | 請輸入完整地址 |
| 超商門市資訊 | 必填,1-200 字元 | 請輸入超商門市資訊 |

---

**Data Model Completed**: 2026-02-06 | **Author**: GitHub Copilot | **Next**: API Contracts Definition

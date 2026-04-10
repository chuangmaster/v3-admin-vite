/**
 * 訂單管理模組 - TypeScript 型別定義
 *
 * @module order-management/types
 * @description 定義訂單管理相關的所有介面、枚舉、常數、型別守衛與表單驗證規則
 */

import type { FormRules } from "element-plus"

// ============================================================================
// Enums (枚舉型別)
// ============================================================================

/** 訂單類型 */
export enum OrderType {
  /** 現貨 */
  SPOT_PURCHASE = "SPOT_PURCHASE",
  /** 預購 */
  PRE_ORDER = "PRE_ORDER"
}

/** 付款狀態 */
export enum PaymentStatus {
  /** 未付款 */
  UNPAID = "UNPAID",
  /** 部分付款 */
  PARTIAL = "PARTIAL",
  /** 已付款 */
  PAID = "PAID"
}

/** 訂單狀態 */
export enum OrderStatus {
  /** 訂單成立 */
  PLACED = "PLACED",
  /** 已完成 */
  COMPLETED = "COMPLETED",
  /** 已取消 */
  CANCELLED = "CANCELLED"
}

/** 出貨狀態 */
export enum ShippingStatus {
  /** 未出貨 */
  NOT_SHIPPED = "NOT_SHIPPED",
  /** 已出貨 */
  SHIPPED = "SHIPPED"
}

/** 收件方式 */
export enum DeliveryMethod {
  /** 自取 */
  PICKUP = "PICKUP",
  /** 宅配 */
  HOME_DELIVERY = "HOME_DELIVERY",
  /** 超商取貨 */
  STORE_PICKUP = "STORE_PICKUP",
  /** 平台物流 */
  PLATFORM = "PLATFORM"
}

/** 商品來源 */
export enum ProductSource {
  /** 收購 */
  BUYBACK = "BUYBACK",
  /** 寄賣 */
  CONSIGNMENT = "CONSIGNMENT",
  /** 代購 */
  PURCHASE = "PURCHASE"
}

/** 付款方式 */
export enum PaymentMethod {
  /** 面交現金 */
  FACE_TO_FACE_CASH = "FACE_TO_FACE_CASH",
  /** 現金匯款 */
  BANK_TRANSFER = "BANK_TRANSFER",
  /** 中租 */
  CHUNG_RENT = "CHUNG_RENT",
  /** 和潤 */
  HO_RUN = "HO_RUN",
  /** 線上刷卡 */
  ONLINE_CARD = "ONLINE_CARD",
  /** 綠界 */
  ECPAY = "ECPAY",
  /** 萬事達 */
  MASTERCARD = "MASTERCARD",
  /** 門市刷卡 */
  STORE_CARD = "STORE_CARD",
  /** 門市置換 */
  STORE_EXCHANGE = "STORE_EXCHANGE"
}

// ============================================================================
// Core Entities (核心實體)
// ============================================================================

/** 銷售訂單實體（詳細資訊） */
export interface SalesOrder {
  /** 訂單唯一識別碼（UUID） */
  id: string
  /** 訂單編號（格式: RYO + YYYYMMDD + 流水號） */
  orderNumber: string
  /** 訂單日期（ISO 8601, UTC） */
  orderDate: string
  /** 訂單類型 */
  orderType: OrderType
  /** 客戶 ID（UUID） */
  customerId: string
  /** 客戶姓名 */
  customerName: string
  /** 客戶電話 */
  customerPhone: string
  /** 客戶 Line ID（可選） */
  customerLineId: string | null
  /** 商品小計（所有訂單項目金額總和） */
  subtotalAmount: number
  /** 運費 */
  shippingFee: number
  /** 總金額（商品小計 + 運費） */
  totalAmount: number
  /** 付款狀態 */
  paymentStatus: PaymentStatus
  /** 訂單狀態 */
  orderStatus: OrderStatus
  /** 出貨狀態 */
  shippingStatus: ShippingStatus
  /** 收件方式 */
  deliveryMethod: DeliveryMethod
  /** 收件資訊（依 deliveryMethod 而異） */
  deliveryInfo: DeliveryInfo
  /** 訂單來源（選填,最多 30 字元） */
  orderSource: string | null
  /** 訂單備註（最多 1000 字元） */
  remarks: string | null
  /** 訂單項目清單 */
  orderItems: OrderItem[]
  /** 付款記錄清單 */
  paymentRecords: PaymentRecord[]
  /** 建立時間（ISO 8601, UTC） */
  createdAt: string
  /** 建立者名稱 */
  createdByName: string
  /** 版本號（用於樂觀鎖定） */
  version: number
}

/** 銷售訂單列表項目（簡化版本,用於列表顯示） */
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
  /** 訂單來源（選填,最多 30 字元） */
  orderSource: string | null
  /** 訂單備註 */
  remarks: string | null
  /** 訂單項目清單 */
  orderItems: OrderItem[]
  /** 建立時間 */
  createdAt: string
  /** 建立者名稱 */
  createdByName: string
  /** 版本號 */
  version: number
}

// ============================================================================
// OrderItem (訂單項目)
// ============================================================================

/** 訂單項目實體 */
export interface OrderItem {
  /** 訂單項目唯一識別碼（UUID） */
  id: string
  /** 商品名稱（必填） */
  productName: string
  /** 品牌名稱（必填） */
  brandName: string
  /** 磐石編碼（必填） */
  panshiCode: string
  /** 序號 ID（必填） */
  serialId: string
  /** 商品款式（必填） */
  productStyle: string
  /** 配件（選填,字串陣列） */
  accessories: string[] | null
  /** 商品來源（必填） */
  productSource: ProductSource
  /** 單價（必填,大於 0） */
  unitPrice: number
  /** 數量（必填,至少 1） */
  quantity: number
}

// ============================================================================
// PaymentRecord (付款記錄)
// ============================================================================

/** 付款記錄實體 */
export interface PaymentRecord {
  /** 付款記錄唯一識別碼（UUID） */
  id: string
  /** 付款日期（ISO 8601, UTC） */
  paymentDate: string
  /** 付款金額（必須大於 0） */
  paymentAmount: number
  /** 付款方式 */
  paymentMethod: PaymentMethod
  /** 銀行帳戶末五碼（選填,僅現金匯款時使用） */
  bankAccountLastFive: string | null
  /** 建立時間（ISO 8601, UTC） */
  createdAt: string
}

// ============================================================================
// DeliveryInfo (收件資訊)
// ============================================================================

/** 收件資訊基礎型別（聯集型別） */
export type DeliveryInfo = PickupInfo | HomeDeliveryInfo | StorePickupInfo | PlatformDeliveryInfo

/** 自取收件資訊 */
export interface PickupInfo {
  type: "PICKUP"
  /** 自取地點（必填,1-200 字元） */
  pickupLocation: string
  /** 自取時間（必填,ISO 8601 格式） */
  pickupTime: string
}

/** 宅配收件資訊 */
export interface HomeDeliveryInfo {
  type: "HOME_DELIVERY"
  /** 收件人姓名（必填,1-50 字元） */
  recipientName: string
  /** 收件人電話（必填,10 位數字） */
  recipientPhone: string
  /** 收件地址（必填,10-200 字元） */
  recipientAddress: string
}

/** 超商取貨收件資訊 */
export interface StorePickupInfo {
  type: "STORE_PICKUP"
  /** 超商門市資訊（必填,純文字,1-200 字元） */
  storeInfo: string
  /** 取貨人姓名（必填,1-50 字元） */
  recipientName: string
  /** 取貨人電話（必填,10 位數字） */
  recipientPhone: string
}

/** 平台物流收件資訊 */
export interface PlatformDeliveryInfo {
  type: "PLATFORM"
}

// ============================================================================
// Request DTOs (請求資料傳輸物件)
// ============================================================================

/** 建立銷售訂單時附帶的付款記錄請求 */
export interface CreateSalesOrderPaymentRequest {
  /** 付款日期（ISO 8601 格式） */
  paymentDate: string
  /** 付款金額（必須大於 0） */
  paymentAmount: number
  /** 付款方式 */
  paymentMethod: PaymentMethod
  /** 銀行帳戶末五碼（選填,僅現金匯款時使用） */
  bankAccountLastFive?: string
}

/** 建立銷售訂單請求 */
export interface CreateSalesOrderRequest {
  /** 訂單類型 */
  orderType: OrderType
  /** 客戶 ID（必填,必須為既有客戶） */
  customerId: string
  /** 訂單項目清單（至少 1 項） */
  orderItems: CreateOrderItemRequest[]
  /** 收件方式 */
  deliveryMethod: DeliveryMethod
  /** 收件資訊（依 deliveryMethod 而異） */
  deliveryInfo: DeliveryInfo
  /** 運費（選填,未提供則使用系統預設值） */
  shippingFee?: number
  /** 訂單來源（選填,最多 30 字元） */
  orderSource?: string
  /** 訂單備註（選填,最多 1000 字元） */
  remarks?: string
  /** 初始付款記錄（選填） */
  payment?: CreateSalesOrderPaymentRequest
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
  /** 配件（選填,字串陣列） */
  accessories?: string[]
  /** 商品來源 */
  productSource: ProductSource
  /** 單價（必須大於 0） */
  unitPrice: number
  /** 數量（至少 1） */
  quantity: number
}

/** 修改銷售訂單請求 */
export interface UpdateSalesOrderRequest {
  /** 訂單項目清單（選填,若提供則完整取代現有項目） */
  orderItems?: CreateOrderItemRequest[]
  /** 收件方式（選填） */
  deliveryMethod?: DeliveryMethod
  /** 收件資訊（選填,依 deliveryMethod 而異） */
  deliveryInfo?: DeliveryInfo
  /** 運費（選填） */
  shippingFee?: number
  /** 訂單備註（選填） */
  remarks?: string
  /** 當前版本號（必填,用於樂觀鎖定） */
  version: number
}

/** 新增付款記錄請求 */
export interface AddPaymentRecordRequest {
  /** 付款日期（ISO 8601 格式） */
  paymentDate: string
  /** 付款金額（必須大於 0） */
  paymentAmount: number
  /** 付款方式 */
  paymentMethod: PaymentMethod
  /** 銀行帳戶末五碼（選填,僅現金匯款時使用） */
  bankAccountLastFive?: string
}

/** 修改付款記錄請求（僅允許修改銀行末五碼） */
export interface UpdatePaymentRecordRequest {
  /** 銀行帳戶末五碼（選填） */
  bankAccountLastFive?: string
}

/** 更新付款狀態請求（手動調整） */
export interface UpdatePaymentStatusRequest {
  /** 付款狀態 */
  paymentStatus: PaymentStatus
}

/** 更新訂單狀態請求 */
export interface UpdateOrderStatusRequest {
  /** 訂單狀態 */
  orderStatus: OrderStatus
}

/** 更新出貨狀態請求 */
export interface UpdateShippingStatusRequest {
  /** 出貨狀態 */
  shippingStatus: ShippingStatus
}

// ============================================================================
// Response DTOs (回應資料傳輸物件)
// ============================================================================

/** 出貨單資料回應 */
export interface ShippingLabelResponse {
  /** 訂單編號 */
  orderNumber: string
  /** 訂單日期 */
  orderDate: string
  /** 訂單類型（後端可能未提供） */
  orderType?: OrderType
  /** 客戶名稱 */
  customerName: string
  /** 客戶電話（後端可能未提供） */
  customerPhone?: string
  /** 商品小計（後端可能未提供） */
  subtotalAmount?: number
  /** 運費（後端可能未提供） */
  shippingFee?: number
  /** 總金額（後端可能未提供） */
  totalAmount?: number
  /** 付款狀態（後端可能未提供） */
  paymentStatus?: PaymentStatus
  /** 訂單狀態（後端可能未提供） */
  orderStatus?: OrderStatus
  /** 出貨狀態（後端可能未提供） */
  shippingStatus?: ShippingStatus
  /** 收件方式 */
  deliveryMethod: DeliveryMethod
  /** 收件資訊（依 deliveryMethod 而異） */
  deliveryInfo: DeliveryInfo
  /** 訂單項目清單 */
  orderItems: OrderItem[]
  /** 付款記錄清單（後端可能未提供） */
  paymentRecords?: PaymentRecord[]
  /** 訂單備註（後端可能未提供） */
  remarks?: string | null
  /** 建立者名稱（後端可能未提供） */
  createdByName?: string
}

/** 銷售訂單匯出資料 DTO */
export interface SalesOrderExportDto {
  /** 訂單編號 */
  orderNumber: string
  /** 客戶名稱 */
  customerName: string
  /** 商品名稱（多項以逗號分隔） */
  productName: string
  /** 磐石ID（多項以逗號分隔） */
  panshiCode: string
  /** 序號ID（多項以逗號分隔） */
  serialId: string
  /** 商品來源（多項以逗號分隔） */
  productSource: string
  /** 訂單類型 */
  orderType: string
  /** 收件方式 */
  deliveryMethod: string
  /** 售出金額（總金額） */
  totalAmount: number
  /** 付款狀態 */
  paymentStatus: string
  /** 訂單狀態 */
  orderStatus: string
  /** 出貨狀態 */
  shippingStatus: string
  /** 訂單來源 */
  orderSource?: string
  /** 建立日期 */
  createdAt: string
  /** 操作者 */
  createdByName: string
}

// ============================================================================
// Query Parameters (查詢參數型別)
// ============================================================================

/** 訂單列表查詢參數 */
export interface SalesOrderListParams {
  /** 頁碼（從 1 開始,預設 1） */
  pageNumber: number
  /** 每頁筆數（1-100,預設 20） */
  pageSize: number
  /** 訂單編號（模糊搜尋,選填） */
  orderNumber?: string
  /** 客戶名稱（模糊搜尋,選填） */
  customerName?: string
  /** 商品名稱（模糊搜尋,選填） */
  productName?: string
  /** 訂單狀態篩選（選填） */
  orderStatus?: OrderStatus
  /** 付款狀態篩選（選填） */
  paymentStatus?: PaymentStatus
  /** 出貨狀態篩選（選填） */
  shippingStatus?: ShippingStatus
  /** 訂單來源（模糊搜尋,選填） */
  orderSource?: string
  /** 訂單日期起始（選填,YYYY-MM-DD） */
  orderDateStart?: string
  /** 訂單日期結束（選填,YYYY-MM-DD） */
  orderDateEnd?: string
}

/** 訂單匯出參數 */
export interface OrderExportParams {
  /** 訂單編號篩選（選填） */
  orderNumber?: string
  /** 客戶名稱篩選（選填） */
  customerName?: string
  /** 商品名稱篩選（選填） */
  productName?: string
  /** 訂單狀態篩選（選填） */
  orderStatus?: OrderStatus
  /** 付款狀態篩選（選填） */
  paymentStatus?: PaymentStatus
  /** 出貨狀態篩選（選填） */
  shippingStatus?: ShippingStatus
  /** 訂單來源篩選（選填） */
  orderSource?: string
  /** 訂單日期起始（選填） */
  orderDateStart?: string
  /** 訂單日期結束（選填） */
  orderDateEnd?: string
}

// ============================================================================
// Form Models (表單模型)
// ============================================================================

/** 訂單表單資料（用於新增/編輯） */
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
  /** 訂單來源（選填,最多 30 字元） */
  orderSource?: string
  /** 訂單備註 */
  remarks: string
  /** 版本號（編輯時使用） */
  version?: number
  /** 初始付款記錄（選填,僅新增時使用） */
  payment?: PaymentRecordFormData | null
}

/** 訂單項目表單資料 */
export interface OrderItemFormData {
  /** 臨時 ID（用於前端識別,提交時移除） */
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
  /** 配件（字串陣列） */
  accessories: string[]
  /** 商品來源 */
  productSource: ProductSource
  /** 單價 */
  unitPrice: number
  /** 數量 */
  quantity: number
}

/** 付款記錄表單資料 */
export interface PaymentRecordFormData {
  /** 付款日期（Date 物件,提交時轉為 ISO 8601） */
  paymentDate: Date | string
  /** 付款金額 */
  paymentAmount: number
  /** 付款方式 */
  paymentMethod: PaymentMethod
  /** 銀行帳戶末五碼 */
  bankAccountLastFive: string
}

// ============================================================================
// Utility Types (工具型別)
// ============================================================================

/** 分頁資訊 */
export interface Pagination {
  /** 當前頁碼（從 1 開始） */
  pageNumber: number
  /** 每頁筆數 */
  pageSize: number
  /** 總筆數 */
  total: number
}

/** 搜尋篩選條件 */
export interface SearchFilters {
  /** 訂單編號 */
  orderNumber: string
  /** 客戶名稱 */
  customerName: string
  /** 商品名稱 */
  productName: string
  /** 訂單狀態 */
  orderStatus: OrderStatus | ""
  /** 付款狀態 */
  paymentStatus: PaymentStatus | ""
  /** 出貨狀態 */
  shippingStatus: ShippingStatus | ""
  /** 訂單來源 */
  orderSource: string
  /** 日期範圍 */
  dateRange: [string, string] | null
}

// ============================================================================
// Constants (常數定義)
// ============================================================================

/**
 * 運費配置（前端預設值）
 * 所有收件方式預設運費皆為 0,實際運費由使用者手動輸入
 */
export const SHIPPING_FEE_CONFIG: Record<DeliveryMethod, number> = {
  [DeliveryMethod.PICKUP]: 0,
  [DeliveryMethod.HOME_DELIVERY]: 0,
  [DeliveryMethod.STORE_PICKUP]: 0,
  [DeliveryMethod.PLATFORM]: 0
}

/** 商品配件選項 */
export const ACCESSORY_OPTIONS = [
  { label: "盒子", value: "box" },
  { label: "防塵袋", value: "dustBag" },
  { label: "購證", value: "purchaseProof" },
  { label: "提袋", value: "shoppingBag" },
  { label: "肩帶", value: "shoulderStrap" },
  { label: "羊毛氈", value: "felt" },
  { label: "枕頭", value: "pillow" },
  { label: "保卡", value: "card" },
  { label: "鎖頭/鑰匙", value: "lockKey" },
  { label: "緞帶/花", value: "ribbon" },
  { label: "品牌小卡", value: "brandCard" },
  { label: "雨衣", value: "raincoat" }
] as const

/** 訂單類型標籤 */
export const ORDER_TYPE_LABELS: Record<OrderType, string> = {
  [OrderType.SPOT_PURCHASE]: "現貨",
  [OrderType.PRE_ORDER]: "預購"
}

/** 訂單狀態標籤 */
export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  [OrderStatus.PLACED]: "訂單成立",
  [OrderStatus.COMPLETED]: "已完成",
  [OrderStatus.CANCELLED]: "已取消"
}

/** 付款狀態標籤 */
export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  [PaymentStatus.UNPAID]: "未付款",
  [PaymentStatus.PARTIAL]: "部分付款",
  [PaymentStatus.PAID]: "已付款"
}

/** 出貨狀態標籤 */
export const SHIPPING_STATUS_LABELS: Record<ShippingStatus, string> = {
  [ShippingStatus.NOT_SHIPPED]: "未出貨",
  [ShippingStatus.SHIPPED]: "已出貨"
}

/** 收件方式標籤 */
export const DELIVERY_METHOD_LABELS: Record<DeliveryMethod, string> = {
  [DeliveryMethod.PICKUP]: "自取",
  [DeliveryMethod.HOME_DELIVERY]: "宅配",
  [DeliveryMethod.STORE_PICKUP]: "超商取貨",
  [DeliveryMethod.PLATFORM]: "平台物流"
}

/** 商品來源標籤 */
export const PRODUCT_SOURCE_LABELS: Record<ProductSource, string> = {
  [ProductSource.BUYBACK]: "收購",
  [ProductSource.CONSIGNMENT]: "寄賣",
  [ProductSource.PURCHASE]: "代購"
}

/** 付款方式標籤 */
export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  [PaymentMethod.FACE_TO_FACE_CASH]: "面交現金",
  [PaymentMethod.BANK_TRANSFER]: "現金匯款",
  [PaymentMethod.CHUNG_RENT]: "中租",
  [PaymentMethod.HO_RUN]: "和潤",
  [PaymentMethod.ONLINE_CARD]: "線上刷卡",
  [PaymentMethod.ECPAY]: "綠界",
  [PaymentMethod.MASTERCARD]: "萬事達",
  [PaymentMethod.STORE_CARD]: "門市刷卡",
  [PaymentMethod.STORE_EXCHANGE]: "門市置換"
}

/** 訂單狀態顏色（Element Plus Tag type） */
export const ORDER_STATUS_COLORS: Record<OrderStatus, "primary" | "success" | "info" | "warning" | "danger"> = {
  [OrderStatus.PLACED]: "info",
  [OrderStatus.COMPLETED]: "success",
  [OrderStatus.CANCELLED]: "danger"
}

/** 付款狀態顏色 */
export const PAYMENT_STATUS_COLORS: Record<PaymentStatus, "primary" | "success" | "info" | "warning" | "danger"> = {
  [PaymentStatus.UNPAID]: "danger",
  [PaymentStatus.PARTIAL]: "warning",
  [PaymentStatus.PAID]: "success"
}

/** 出貨狀態顏色 */
export const SHIPPING_STATUS_COLORS: Record<ShippingStatus, "primary" | "success" | "info" | "warning" | "danger"> = {
  [ShippingStatus.NOT_SHIPPED]: "info",
  [ShippingStatus.SHIPPED]: "success"
}

// ============================================================================
// Type Guards (型別守衛)
// ============================================================================

/** 檢查是否為自取收件資訊 */
export function isPickupInfo(info: DeliveryInfo): info is PickupInfo {
  return info.type === "PICKUP"
}

/** 檢查是否為宅配收件資訊 */
export function isHomeDeliveryInfo(info: DeliveryInfo): info is HomeDeliveryInfo {
  return info.type === "HOME_DELIVERY"
}

/** 檢查是否為超商取貨收件資訊 */
export function isStorePickupInfo(info: DeliveryInfo): info is StorePickupInfo {
  return info.type === "STORE_PICKUP"
}

/** 檢查是否為平台物流收件資訊 */
export function isPlatformDeliveryInfo(info: DeliveryInfo): info is PlatformDeliveryInfo {
  return info.type === "PLATFORM"
}

// ============================================================================
// PaymentRecordReport (付款紀錄報表)
// ============================================================================

/** 付款紀錄報表項目（包含所屬訂單資訊） */
export interface PaymentRecordReportItem {
  /** 付款記錄唯一識別碼 */
  id: string
  /** 所屬訂單編號 */
  orderNumber: string
  /** 訂單日期（ISO 8601, UTC） */
  orderDate: string
  /** 客戶姓名 */
  customerName: string
  /** 付款日期（ISO 8601, UTC） */
  paymentDate: string
  /** 付款金額 */
  paymentAmount: number
  /** 付款方式 */
  paymentMethod: PaymentMethod
  /** 銀行帳戶末五碼（僅現金匯款時使用） */
  bankAccountLastFive: string | null
  /** 建立時間（ISO 8601, UTC） */
  createdAt: string
}

/** 付款紀錄報表查詢參數 */
export interface PaymentRecordReportParams {
  /** 建立時間起始（YYYY-MM-DD，必填） */
  createdAtStart: string
  /** 建立時間結束（YYYY-MM-DD，必填） */
  createdAtEnd: string
  /** 付款方式篩選（選填） */
  paymentMethod?: PaymentMethod
}

// ============================================================================
// Validation Rules (驗證規則)
// ============================================================================

/** 訂單項目驗證規則 */
export const ORDER_ITEM_RULES: FormRules = {
  productName: [
    { required: true, message: "請輸入商品名稱", trigger: "blur" },
    { min: 1, max: 200, message: "商品名稱長度為 1-200 字元", trigger: "blur" }
  ],
  brandName: [
    { required: true, message: "請輸入品牌名稱", trigger: "blur" },
    { min: 1, max: 100, message: "品牌名稱長度為 1-100 字元", trigger: "blur" }
  ],
  panshiCode: [
    { required: true, message: "請輸入磐石編碼", trigger: "blur" },
    { min: 1, max: 50, message: "磐石編碼長度為 1-50 字元", trigger: "blur" }
  ],
  serialId: [
    { required: true, message: "請輸入序號 ID", trigger: "blur" },
    { min: 1, max: 100, message: "序號 ID 長度為 1-100 字元", trigger: "blur" }
  ],
  productStyle: [
    { required: true, message: "請輸入商品款式", trigger: "blur" },
    { min: 1, max: 100, message: "商品款式長度為 1-100 字元", trigger: "blur" }
  ],
  productSource: [
    { required: true, message: "請選擇商品來源", trigger: "change" }
  ],
  unitPrice: [
    { required: true, message: "請輸入單價", trigger: "blur" },
    { type: "number", min: 0.01, message: "單價必須大於 0", trigger: "blur" }
  ],
  quantity: [
    { required: true, message: "請輸入數量", trigger: "blur" },
    { type: "number", min: 1, message: "數量至少為 1", trigger: "blur" }
  ]
}

/** 付款記錄驗證規則 */
export const PAYMENT_RECORD_RULES: FormRules = {
  paymentDate: [
    { required: true, message: "請選擇付款日期", trigger: "change" }
  ],
  paymentAmount: [
    { required: true, message: "請輸入付款金額", trigger: "blur" },
    { type: "number", min: 0.01, message: "付款金額必須大於 0", trigger: "blur" }
  ],
  paymentMethod: [
    { required: true, message: "請選擇付款方式", trigger: "change" }
  ],
  bankAccountLastFive: [
    { pattern: /^\d{5}$/, message: "銀行末五碼必須為 5 位數字", trigger: "blur" }
  ]
}

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

/** 商品預購定金須知標頭（REAL YOU 品牌宣言） */
export const DEPOSIT_HEADERS = [
  "◼ REAL YOU 的堅持｜正品安心購- 為精品保值，也為您的消費選擇負責",
  "◼ REAL YOU 的堅持｜嚴格進貨與上架流程- 從鑑定開始把關"
] as const

/** 商品預購定金須知（固定內容，每筆為一條條文） */
export const DEPOSIT_TERMS = [
  "確認訂購後 REALYOU 將收取 50% 訂購金額為定金。若訂購方因個人因素取消或拒絕履約，定金不予退還。",
  "定金僅於本公司無法交付商品時退還。若因物流延誤或其他不可抗力因素（如天災、疫情、戰爭、政府管制或其他非可歸責於任一方之事由）致交付延遲，交期得順延，定金不因此退還。",
  "精品品牌多為手工製作，並非工廠大量量產；因此即使是同款商品，也難免在溢膠、色澤、皮質觸感、紋理、厚度與縫線細節上出現些許差異。高標準客人建議先仔細檢視實拍圖細節，確認可接受再下單，謝謝理解。",
  "REALYOU所有商品皆由專業團隊完成鑑定，並留存鑑定重點與紀錄，確保商品為正品。若日後對真偽有疑義，經提供品牌官方或具公信力之第三方鑑定證明文件確認非正品者，本公司將依原付款方式辦理全額退費，並負責相關處理。",
  "現貨商品應於訂購日起一週內付清尾款。訂購方已付訂金後，如無正當理由逾期未付尾款或拒絕履約，視為違約，本公司得解除契約，並沒收定金。",
  "下定前請詳閱REALYOU官網下方>常見問題> REALYOU購物須知，匯款完成即代表同意『商品預購訂金須知』。"
] as const

/** 商品預購定金須知延伸閱讀連結 */
export const DEPOSIT_LINKS = [
  {
    label: "➊ realyou.com.tw/blogs/精品服務/realyou-product_listing",
    url: "https://realyou.com.tw/blogs/精品服務/realyou-product_listing"
  },
  {
    label: "➋ realyou.com.tw/blogs/精品服務/realyou-safe_shopping",
    url: "https://realyou.com.tw/blogs/精品服務/realyou-safe_shopping"
  }
] as const

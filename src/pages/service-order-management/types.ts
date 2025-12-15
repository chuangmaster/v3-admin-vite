/** 服務單管理模組型別定義 */

/** 服務單類型 */
export enum ServiceOrderType {
  /** 寄賣單 */
  CONSIGNMENT = "consignment",
  /** 收購單 */
  BUYBACK = "buyback"
}

/** 服務單來源 */
export enum ServiceOrderSource {
  /** 線上 */
  ONLINE = "online",
  /** 線下 */
  OFFLINE = "offline"
}

/** 服務單狀態 */
export enum ServiceOrderStatus {
  /** 待處理 */
  PENDING = "pending",
  /** 已完成 */
  COMPLETED = "completed",
  /** 已終止 */
  TERMINATED = "terminated"
}

/** 續約設定 */
export enum RenewalOption {
  /** 到期自動取回 */
  AUTO_RETRIEVE = "auto_retrieve",
  /** 第三個月起自動調降 10% */
  AUTO_DISCOUNT_10 = "auto_discount_10",
  /** 屆時討論 */
  DISCUSS_LATER = "discuss_later"
}

/** 簽名方式 */
export enum SignatureMethod {
  /** 線下簽名 */
  OFFLINE = "OFFLINE",
  /** 線上簽名 */
  ONLINE = "ONLINE"
}

/** 簽名文件類型 */
export enum DocumentType {
  /** 收購合約 */
  BUYBACK_CONTRACT = "BUYBACK_CONTRACT",
  /** 一時貿易申請書 */
  TRADE_APPLICATION = "TRADE_APPLICATION",
  /** 寄賣合約書 */
  CONSIGNMENT_CONTRACT = "CONSIGNMENT_CONTRACT"
}

/** 附件類型 */
export enum AttachmentType {
  /** 身分證明文件 */
  ID_CARD = "ID_CARD",
  /** 合約文件 */
  CONTRACT = "CONTRACT",
  /** 其他文件 */
  OTHER = "OTHER"
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
  { label: "保證書", value: "certificate" },
  { label: "無", value: "none" }
] as const

/** 商品瑕疵選項 */
export const DEFECT_OPTIONS = [
  { label: "五金生鏽/刮痕/掉", value: "hardwareRustScratchLoss" },
  { label: "皮質磨損/刮痕/壓痕", value: "leatherWearScratchDent" },
  { label: "內裡髒污", value: "liningDirty" },
  { label: "四角磨損", value: "cornerWear" }
] as const

/** 商品項目實體 */
export interface ProductItem {
  /** 唯一識別碼（UUID） */
  id?: string
  /** 服務單 ID */
  serviceOrderId?: string
  /** 品牌名稱 */
  brandName: string
  /** 款式 */
  style: string
  /** 內碼 */
  internalCode?: string
  /** 商品序號（顯示順序，1-4） */
  sequence: number
  /** 商品配件（僅寄賣單） */
  accessories?: string[]
  /** 商品瑕疵處（僅寄賣單） */
  defects?: string[]
}

/** 客戶實體 */
export interface Customer {
  /** 唯一識別碼（UUID） */
  id: string
  /** 客戶姓名 */
  name: string
  /** 電話號碼 */
  phone: string
  /** Email */
  email?: string
  /** 身分證字號 */
  idCardNumber: string
  /** 建立時間（ISO 8601, UTC） */
  createdAt: string
  /** 最後更新時間（ISO 8601, UTC） */
  updatedAt?: string
}

/** 附件實體 */
export interface Attachment {
  /** 唯一識別碼（UUID） */
  id: string
  /** 服務單 ID */
  serviceOrderId: string
  /** 檔案名稱 */
  fileName: string
  /** 檔案類型 */
  fileType: AttachmentType
  /** 檔案 URL */
  fileUrl: string
  /** 檔案大小（bytes） */
  fileSize: number
  /** 上傳時間（ISO 8601, UTC） */
  uploadedAt: string
  /** 上傳者（使用者 ID） */
  uploadedBy: string
}

/** 簽名記錄實體 */
export interface SignatureRecord {
  /** 唯一識別碼（UUID） */
  id: string
  /** 服務單 ID */
  serviceOrderId: string
  /** 簽名文件類型 */
  documentType: DocumentType
  /** 簽名資料（Base64 PNG，僅線下簽名） */
  signatureData?: string
  /** 簽名方式 */
  signatureMethod: SignatureMethod
  /** Dropbox Sign 請求 ID（僅線上簽名） */
  dropboxSignRequestId?: string
  /** 簽名者姓名 */
  signerName: string
  /** 簽名時間（ISO 8601, UTC） */
  signedAt: string
}

/** 修改歷史實體 */
export interface ModificationHistory {
  /** 唯一識別碼（UUID） */
  id: string
  /** 服務單 ID */
  serviceOrderId: string
  /** 變更欄位名稱 */
  fieldName: string
  /** 變更前的值 */
  oldValue?: string
  /** 變更後的值 */
  newValue: string
  /** 變更時間（ISO 8601, UTC） */
  modifiedAt: string
  /** 變更者（使用者 ID） */
  modifiedBy: string
  /** 變更者姓名 */
  modifiedByName?: string
}

/** 服務單實體 */
export interface ServiceOrder {
  /** 唯一識別碼（UUID） */
  id: string
  /** 服務單編號（如 CS20251214001） */
  orderNumber: string
  /** 服務單類型 */
  orderType: ServiceOrderType
  /** 服務單來源 */
  orderSource: ServiceOrderSource
  /** 客戶 ID */
  customerId: string
  /** 客戶資訊（查詢詳細時回傳） */
  customer?: Customer
  /** 商品項目列表（1-4 件） */
  productItems: ProductItem[]
  /** 總金額 */
  totalAmount: number
  /** 服務單狀態 */
  status: ServiceOrderStatus
  /** 寄賣起始日期（僅寄賣單，ISO 8601） */
  consignmentStartDate?: string
  /** 寄賣結束日期（僅寄賣單，ISO 8601） */
  consignmentEndDate?: string
  /** 續約設定（僅寄賣單） */
  renewalOption?: RenewalOption
  /** 建立時間（ISO 8601, UTC） */
  createdAt: string
  /** 建立者（使用者 ID） */
  createdBy: string
  /** 最後更新時間（ISO 8601, UTC） */
  updatedAt?: string
  /** 最後更新者（使用者 ID） */
  updatedBy?: string
  /** 版本號（樂觀鎖） */
  version: number
}

/** 服務單列表項目（列表頁面使用，欄位較少） */
export interface ServiceOrderListItem {
  /** 唯一識別碼（UUID） */
  id: string
  /** 服務單編號 */
  orderNumber: string
  /** 服務單類型 */
  orderType: ServiceOrderType
  /** 服務單來源 */
  orderSource: ServiceOrderSource
  /** 客戶 ID */
  customerId: string
  /** 客戶名稱 */
  customerName: string
  /** 品牌名稱（第一件商品） */
  brandName: string
  /** 款式（第一件商品） */
  style: string
  /** 內碼（第一件商品） */
  internalCode?: string
  /** 商品數量 */
  quantity: number
  /** 總金額 */
  amount: number
  /** 服務單狀態 */
  status: ServiceOrderStatus
  /** 建立時間（ISO 8601, UTC） */
  createdAt: string
  /** 建立者（使用者 ID） */
  createdBy: string
  /** 版本號（樂觀鎖） */
  version: number
}

/** 建立服務單請求 */
export interface CreateServiceOrderRequest {
  /** 服務單類型 */
  orderType: ServiceOrderType
  /** 服務單來源 */
  orderSource: ServiceOrderSource
  /** 客戶 ID */
  customerId: string
  /** 商品項目列表(1-4件) */
  productItems: ProductItem[]
  /** 總金額 */
  totalAmount: number
  /** 寄賣起始日期（僅寄賣單，ISO 8601） */
  consignmentStartDate?: string
  /** 寄賣結束日期（僅寄賣單，ISO 8601） */
  consignmentEndDate?: string
  /** 續約設定（僅寄賣單） */
  renewalOption?: RenewalOption
}

/** 更新服務單請求 */
export interface UpdateServiceOrderRequest {
  /** 商品項目列表(1-4件) */
  productItems: ProductItem[]
  /** 總金額 */
  totalAmount: number
  /** 寄賣起始日期（僅寄賣單，ISO 8601） */
  consignmentStartDate?: string
  /** 寄賣結束日期（僅寄賣單，ISO 8601） */
  consignmentEndDate?: string
  /** 續約設定（僅寄賣單） */
  renewalOption?: RenewalOption
  /** 版本號（樂觀鎖） */
  version: number
}

/** 更新服務單狀態請求 */
export interface UpdateStatusRequest {
  /** 目標狀態 */
  status: ServiceOrderStatus
  /** 版本號（樂觀鎖） */
  version: number
}

/** 服務單列表查詢參數 */
export interface ServiceOrderListParams {
  /** 頁碼（從 1 開始） */
  pageNumber: number
  /** 每頁筆數（1-100） */
  pageSize: number
  /** 服務單類型（可選） */
  orderType?: ServiceOrderType
  /** 客戶名稱（模糊搜尋，可選） */
  customerName?: string
  /** 起始日期（ISO 8601，可選） */
  startDate?: string
  /** 結束日期（ISO 8601，可選） */
  endDate?: string
  /** 服務單狀態（可選） */
  status?: ServiceOrderStatus
}

/** 分頁回應格式 */
export interface PagedResponse<T> {
  /** 資料項目列表 */
  items: T[]
  /** 當前頁碼（從 1 開始） */
  pageNumber: number
  /** 每頁筆數 */
  pageSize: number
  /** 總筆數 */
  totalRecords: number
  /** 總頁數 */
  totalPages: number
}

/** 客戶搜尋參數 */
export interface CustomerSearchParams {
  /** 搜尋關鍵字(姓名、電話、Email、身分證字號) */
  keyword: string
}

/** 建立客戶請求 */
export interface CreateCustomerRequest {
  /** 客戶姓名 */
  name: string
  /** 電話號碼 */
  phone: string
  /** Email（可選） */
  email?: string
  /** 身分證字號（支援台灣身分證與外籍人士格式） */
  idCardNumber: string
}

/** OCR 辨識身分證請求（multipart/form-data） */
export interface OCRIDCardRequest {
  /** 身分證圖片檔案 */
  file: File
}

/** OCR 辨識身分證回應 */
export interface OCRIDCardResponse {
  /** 姓名 */
  name: string
  /** 身分證字號 */
  idCardNumber: string
  /** 辨識信心度（0-1） */
  confidence: number
}

/** 上傳附件請求（multipart/form-data） */
export interface UploadAttachmentRequest {
  /** 檔案 */
  file: File
  /** 檔案類型 */
  fileType: AttachmentType
}

/** 儲存線下簽名請求 */
export interface SaveOfflineSignatureRequest {
  /** 簽名文件類型 */
  documentType: DocumentType
  /** 簽名資料（Base64 PNG） */
  signatureData: string
  /** 簽名者姓名 */
  signerName: string
}

/** 發送線上簽名請求 */
export interface SendOnlineSignatureRequest {
  /** 簽名文件類型 */
  documentType: DocumentType
  /** 簽名者姓名 */
  signerName: string
  /** 簽名者 Email */
  signerEmail: string
}

/** 重新發送簽名請求 */
export interface ResendSignatureRequest {
  /** 簽名記錄 ID */
  signatureRecordId: string
}

/** 合併簽名預覽請求 */
export interface MergeSignaturePreviewRequest {
  /** 簽名文件類型 */
  documentType: DocumentType
  /** 簽名資料（Base64 PNG） */
  signatureBase64: string
}

/** 合併簽名預覽回應 */
export interface MergeSignaturePreviewResponse {
  /** 預覽 URL */
  previewUrl: string
  /** 過期時間（ISO 8601, UTC） */
  expiresAt: string
}

/** 記錄附件查看日誌請求 */
export interface LogAttachmentViewRequest {
  /** 操作類型 */
  action: "VIEW" | "DOWNLOAD"
}

/** 記錄附件查看日誌回應 */
export interface LogAttachmentViewResponse {
  /** 日誌 ID */
  logId: string
  /** 附件 ID */
  attachmentId: string
  /** 使用者 ID */
  userId: string
  /** 使用者姓名 */
  userName: string
  /** 操作類型 */
  action: "VIEW" | "DOWNLOAD"
  /** 查看時間（ISO 8601, UTC） */
  viewedAt: string
}

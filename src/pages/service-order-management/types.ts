/** 服務單管理模組型別定義 */

/** 服務單類型 */
export enum ServiceOrderType {
  /** 寄賣單 */
  CONSIGNMENT = "CONSIGNMENT",
  /** 收購單 */
  BUYBACK = "BUYBACK"
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
  /** 草稿 */
  DRAFT = "DRAFT",
  /** 待確認 */
  PENDING = "PENDING",
  /** 已確認 */
  CONFIRMED = "CONFIRMED",
  /** 處理中 */
  IN_PROGRESS = "IN_PROGRESS",
  /** 已完成 */
  COMPLETED = "COMPLETED",
  /** 已取消 */
  CANCELLED = "CANCELLED"
}

/** 續約設定 */
export enum RenewalOption {
  /** 無續約 */
  NONE = "NONE",
  /** 到期自動取回 */
  AUTO_RETRIEVE = "AUTO_RETRIEVE",
  /** 第三個月起自動調降 10% */
  AUTO_DISCOUNT_10 = "AUTO_DISCOUNT_10",
  /** 屆時討論 */
  DISCUSS = "DISCUSS"
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
  ONE_TIME_TRADE = "ONE_TIME_TRADE",
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

/** 商品類別（收購單專用） */
export enum ProductCategory {
  /** 黃金首飾 */
  GOLD_JEWELRY = "黃金首飾",
  /** 鉑金首飾 */
  PLATINUM_JEWELRY = "鉑金首飾",
  /** K金首飾 */
  K_GOLD_JEWELRY = "K金首飾",
  /** 鑽石 */
  DIAMOND = "鑽石",
  /** 寶石 */
  GEMSTONE = "寶石",
  /** 名錶 */
  LUXURY_WATCH = "名錶",
  /** 名牌包 */
  LUXURY_BAG = "名牌包",
  /** 其他精品 */
  OTHER = "其他精品"
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

/** 商品等級選項 */
export const GRADE_OPTIONS = [
  { label: "A", value: "A" },
  { label: "B", value: "B" },
  { label: "C", value: "C" },
  { label: "D", value: "D" }
] as const

/** 商品項目實體（包含收購單和寄賣單的所有欄位） */
export interface ProductItem {
  /** 唯一識別碼（UUID） */
  id?: string
  /** 服務單 ID */
  serviceOrderId?: string

  // 收購單專用欄位
  /** 商品類別（收購單） */
  category?: ProductCategory
  /** 商品名稱（收購單） */
  name?: string
  /** 重量 (g) - 金屬類商品（收購單） */
  weight?: number
  /** 純度 - 金屬類商品（收購單） */
  purity?: string
  /** 單價（收購單） */
  unitPrice?: number
  /** 數量（收購單） */
  quantity?: number
  /** 小計（收購單） */
  totalPrice?: number
  /** 備註說明（收購單） */
  description?: string

  // 寄賣單專用欄位
  /** 品牌名稱（寄賣單） */
  brandName?: string
  /** 款式（寄賣單） */
  style?: string
  /** 內碼（寄賣單） */
  internalCode?: string
  /** 商品等級 */
  grade?: string
  /** 商品序號（顯示順序，1-4）（寄賣單） */
  sequence?: number
  /** 商品項目序號（API 使用） */
  sequenceNumber?: number
  /** 商品配件（僅寄賣單） */
  accessories?: string[]
  /** 商品瑕疵處（僅寄賣單） */
  defects?: string[]
  /** 金額（寄賣單為實拿金額，收購單為收購金額） */
  amount?: number
}

/** 客戶實體 */
export interface Customer {
  /** 唯一識別碼（UUID） */
  id: string
  /** 客戶姓名 */
  name: string
  /** 電話號碼 */
  phoneNumber: string
  /** Email */
  email?: string
  /** 身分證字號 */
  idCardNumber: string
  /** 居住地址 */
  residentialAddress: string
  /** Line ID */
  lineId?: string
  /** 建立時間（ISO 8601, UTC） */
  createdAt: string
  /** 最後更新時間（ISO 8601, UTC） */
  updatedAt?: string
}

/** 附件實體 */
export interface Attachment {
  /**
   * SAS URL（用於直接上傳/下載檔案，包含存取權杖）
   */
  sasUrl: string
  /** SAS URL 過期時間（ISO 8601, UTC） */
  expiresAt?: string
  /** 唯一識別碼（UUID） */
  id: string
  /** 服務單 ID */
  serviceOrderId?: string
  /** 檔案名稱 */
  fileName: string
  /** 檔案類型（前端使用） */
  fileType?: AttachmentType
  /** 附件類型（API 回傳，如 ID_CARD_FRONT, ID_CARD_BACK, CONTRACT） */
  attachmentType?: string
  /** 檔案 URL */
  fileUrl?: string
  /** 檔案大小（bytes） */
  fileSize: number
  /** 檔案 MIME 類型 */
  contentType?: string
  /** 上傳時間（ISO 8601, UTC） */
  uploadedAt?: string
  /** 建立時間（ISO 8601, UTC） */
  createdAt?: string
  /** 上傳者（使用者 ID） */
  uploadedBy?: string
}

/** 簽名記錄實體 */
export interface SignatureRecord {
  /** 唯一識別碼（UUID） */
  id: string
  /** 服務單 ID */
  serviceOrderId: string
  /** 簽名文件類型 */
  documentType: DocumentType
  /** 簽名類型（用於顯示） */
  signatureType?: string
  /** 簽名資料（Base64 PNG，僅線下簽名） */
  signatureData?: string
  /** 簽名 URL（用於顯示簽名圖片） */
  signatureUrl?: string
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
  /** 客戶姓名（查詢詳細時回傳） */
  customerName?: string
  /** 客戶電話（查詢詳細時回傳） */
  customerPhone?: string
  /** 客戶 Email（查詢詳細時回傳） */
  customerEmail?: string
  /** 客戶身分證字號（查詢詳細時回傳） */
  customerIdNumber?: string
  /** 客戶地址（查詢詳細時回傳） */
  customerAddress?: string
  /** 客戶 Line ID（查詢詳細時回傳） */
  customerLineId?: string
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
  /** 簽名記錄列表（查詢詳細時回傳） */
  signatureRecords?: SignatureRecord[]
  /** 備註說明 */
  notes?: string
  /** 建立時間（ISO 8601, UTC） */
  createdAt: string
  /** 建立者（使用者姓名） */
  createdByName: string
  /** 最後更新時間（ISO 8601, UTC） */
  updatedAt?: string
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

/** API 商品項目（建立訂單用） */
export interface CreateOrderProductItem {
  /** 商品項目序號 */
  sequenceNumber: number
  /** 品牌名稱 */
  brandName: string
  /** 款式 */
  styleName: string
  /** 內碼 */
  internalCode?: string
}

/** 建立收購單商品項目請求 */
export interface CreateBuybackProductItemRequest {
  /** 商品序號 (1-4) */
  sequenceNumber: number
  /** 品牌名稱 */
  brandName: string
  /** 款式 */
  styleName?: string
  /** 內碼 */
  internalCode?: string
  /** 配件列表 */
  accessories?: string[]
}

/** 建立寄賣單商品項目請求 */
export interface CreateConsignmentProductItemRequest {
  /** 商品序號 (1-4) */
  sequenceNumber: number
  /** 品牌名稱 */
  brandName: string
  /** 款式名稱 */
  styleName?: string
  /** 內碼 */
  internalCode?: string
  /** 配件列表 */
  accessories?: string[]
  /** 瑕疵列表 */
  defects?: string[]
}

/** 建立收購單請求 (US1 線下/線上) */
export interface CreateBuybackOrderRequest {
  /** 服務單類型 (固定為 BUYBACK) */
  orderType: string
  /** 服務單來源 (OFFLINE/ONLINE) */
  orderSource: string
  /** 既有客戶 ID (必填) */
  customerId: string
  /** 商品項目清單 (1-4 件) */
  productItems: CreateBuybackProductItemRequest[]
  /** 總金額 */
  totalAmount: number
  /** 身分證正面圖片 Base64 (不含 data: 前綴) */
  idCardFrontImageBase64?: string
  /** 身分證正面圖片 MIME 類型 */
  idCardFrontImageContentType?: string
  /** 身分證正面圖片原始檔名 */
  idCardFrontImageFileName?: string
  /** 身分證反面圖片 Base64 (不含 data: 前綴) */
  idCardBackImageBase64?: string
  /** 身分證反面圖片 MIME 類型 */
  idCardBackImageContentType?: string
  /** 身分證反面圖片原始檔名 */
  idCardBackImageFileName?: string
}

/** 建立寄賣單請求 (US2 線下/線上) */
export interface CreateConsignmentOrderRequest {
  /** 服務單類型 (固定為 CONSIGNMENT) */
  orderType: string
  /** 服務單來源 (OFFLINE/ONLINE) */
  orderSource: string
  /** 既有客戶 ID (必填) */
  customerId: string
  /** 服務日期 */
  serviceDate?: string
  /** 寄賣起始日期 */
  consignmentStartDate?: string
  /** 寄賣結束日期 (預設為起始日期 + 90 天) */
  consignmentEndDate?: string
  /** 續約選項 (AUTO_RETRIEVE/AUTO_DISCOUNT_10/DISCUSS) */
  renewalOption?: string
  /** 商品項目列表 (1-4 件) */
  productItems: CreateConsignmentProductItemRequest[]
  /** 總金額 */
  totalAmount: number
  /** 備註 */
  remarks?: string
}

/** @deprecated 使用 CreateBuybackOrderRequest 或 CreateConsignmentOrderRequest */
export interface CreateServiceOrderRequest {
  /** 服務單類型 */
  orderType: string
  /** 服務單來源 */
  orderSource: string
  /** 客戶 ID */
  customerId?: string
  /** 商品項目列表(1-4件) */
  productItems: CreateOrderProductItem[]
  /** 總金額 */
  totalAmount: number
  /** 身分證影本 Base64（單張圖片，舊格式） */
  idCardImageBase64?: string
  /** 身分證影本 Content Type */
  idCardImageContentType?: string
  /** 身分證影本檔案名稱 */
  idCardImageFileName?: string
  /** 身分證正面 Base64 */
  idCardFrontImageBase64?: string
  /** 身分證正面 Content Type */
  idCardFrontImageContentType?: string
  /** 身分證正面檔案名稱 */
  idCardFrontImageFileName?: string
  /** 身分證反面 Base64 */
  idCardBackImageBase64?: string
  /** 身分證反面 Content Type */
  idCardBackImageContentType?: string
  /** 身分證反面檔案名稱 */
  idCardBackImageFileName?: string
  /** 寄賣起始日期（僅寄賣單，ISO 8601） */
  consignmentStartDate?: string
  /** 寄賣結束日期（僅寄賣單，ISO 8601） */
  consignmentEndDate?: string
  /** 續約設定（僅寄賣單） */
  renewalOption?: RenewalOption
  /** 續約月數（僅寄賣單） */
  renewalMonths?: number
  /** 利率（僅寄賣單） */
  interestRate?: number
  /** 備註說明 */
  notes?: string
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
  /** 單號（模糊搜尋，可選） */
  orderNumber?: string
  /** 日期範圍（可選，用於前端篩選） */
  createdDateRange?: [string, string]
  /** 起始日期（ISO 8601，可選） */
  startDate?: string
  /** 結束日期（ISO 8601，可選） */
  endDate?: string
  /** 服務單狀態（可選） */
  status?: ServiceOrderStatus
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
  /** 聯絡電話 */
  phoneNumber: string
  /** Email（可選） */
  email?: string
  /** 身分證字號（支援台灣身分證與外籍人士格式） */
  idNumber: string
  /** 居住地址 */
  residentialAddress: string
  /** Line ID（可選） */
  lineId?: string
}

/** OCR 辨識身分證請求（使用 Base64 編碼） */
export interface OcrIdCardRequest {
  /** 身分證圖片 Base64 字串（不含 data:image/xxx;base64, 前綴） */
  imageBase64: string
  /** 圖片 MIME 類型（例如：image/jpeg, image/png） */
  contentType: string
  /** 原始檔案名稱（可選） */
  fileName?: string
}

/** OCR 辨識身分證回應 */
export interface OCRIDCardResponse {
  /** 姓名 */
  name: string
  /** 身分證字號 */
  idNumber: string
  /** 辨識信心度（0-1） */
  confidence: number
  /** 是否為低信心度 */
  isLowConfidence: boolean
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
  /** 簽名記錄 ID */
  signatureRecordId: string
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

/** 生成 Pdf 預覽請求 */
export interface GeneratePdfPreviewRequest {
  /** 服務單類型 */
  documentType: DocumentType
  /** 客戶資訊 */
  customer: {
    /** 客戶姓名 */
    name: string
    /** 電話號碼 */
    phoneNumber: string
    /** Email */
    email?: string
    /** 身分證字號 */
    idCardNumber: string
    /** 居住地址 */
    residentialAddress?: string
  }
  /** 商品項目列表 */
  productItems: ProductItem[]
  /** 總金額 */
  totalAmount: number
  /** 寄賣起始日期（僅寄賣單） */
  consignmentStartDate?: string
  /** 寄賣結束日期（僅寄賣單） */
  consignmentEndDate?: string
}

/** 生成合約預覽回應 */
export interface GeneratePdfPreviewResponse {
  /** 收購合約預覽 URL（收購單） */
  buybackContractUrl?: string
  /** 一時貿易申請書預覽 URL（收購單） */
  tradeApplicationUrl?: string
  /** 寄賣合約書預覽 URL（寄賣單） */
  consignmentContractUrl?: string
  /** 過期時間（ISO 8601, UTC） */
  expiresAt: string
}

/** 確認服務單並儲存最終文件回應 */
export interface ConfirmOrderResponse {
  /** 新建立的附件 ID */
  attachmentId: string
  /** 新建立的簽名記錄 ID */
  signatureRecordId: string
  /** Blob 路徑 */
  blobPath?: string
  /** SAS 下載連結 */
  sasUrl?: string
  /** SAS 過期時間 (UTC) */
  expiresAt?: string
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

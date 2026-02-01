/**
 * 客戶管理模組 - TypeScript 型別定義
 *
 * @module customer-management/types
 * @description 定義客戶管理相關的所有介面、型別與表單驗證規則
 */

import type { FormRules } from "element-plus"

// ============================================================================
// 客戶等級相關型別
// ============================================================================

/**
 * 客戶等級狀態列舉
 * @description 由後端自動計算，前端僅用於顯示
 */
export enum CustomerLevelStatus {
  /** 進行中（當前時間在 startDate 與 endDate 之間） */
  Active = "Active",
  /** 已過期（當前時間 >= endDate） */
  Expired = "Expired",
  /** 即將生效（當前時間 < startDate） */
  Upcoming = "Upcoming"
}

/**
 * 客戶等級列舉
 * @description 支援的等級選項
 */
export enum CustomerLevel {
  VIP = "VIP"
  // 未來可擴展其他等級
}

/**
 * 客戶等級效期回應（從後端 API 取得）
 * @description 對應後端 API: GET /api/customers/{customerId}/levels
 */
export interface CustomerLevelPeriodResponse {
  /** 唯一識別碼 (UUID) */
  id: string
  /** 所屬客戶 ID (UUID) */
  customerId: string
  /** 等級（例如: "VIP", "VVIP"） */
  level: string
  /** 效期開始日期（UTC ISO 8601 格式） */
  startDate: string
  /** 效期結束日期（UTC ISO 8601 格式） */
  endDate: string
  /** 當前狀態（由後端計算） */
  status: CustomerLevelStatus
  /** 建立時間（UTC ISO 8601 格式） */
  createdAt: string
  /** 最後更新時間（UTC ISO 8601 格式，可為 null） */
  updatedAt: string | null
  /** 樂觀鎖版本號 */
  version: number
}

/**
 * 新增客戶等級效期請求
 * @description 對應後端 API: POST /api/customers/{customerId}/levels
 */
export interface CreateLevelRequest {
  /** 等級 */
  level: string
  /** 效期開始日期（UTC ISO 8601，必須為該日 00:00:00Z） */
  startDate: string
  /** 效期結束日期（UTC ISO 8601，必須為該日 23:59:59Z） */
  endDate: string
}

/**
 * 更新客戶等級效期請求
 * @description 對應後端 API: PUT /api/customers/{customerId}/levels/{levelId}
 */
export interface UpdateLevelRequest extends CreateLevelRequest {
  /** 樂觀鎖版本號（必須與當前資料庫版本一致） */
  version: number
}

/**
 * 等級設定表單資料（前端表單使用）
 * @description 日期欄位使用 Date 物件，提交時再轉換為 ISO 8601
 */
export interface CustomerLevelFormData {
  /** 等級 */
  level: string
  /** 效期開始日期（本地時區 Date） */
  startDate: Date | null
  /** 效期結束日期（本地時區 Date） */
  endDate: Date | null
}

/**
 * 等級設定表單驗證規則
 */
export const customerLevelFormRules: FormRules<CustomerLevelFormData> = {
  level: [
    { required: true, message: "請選擇等級", trigger: "change" }
  ],
  startDate: [
    { required: true, message: "請選擇開始日期", trigger: "change" }
  ],
  endDate: [
    { required: true, message: "請選擇結束日期", trigger: "change" }
  ]
}

// ============================================================================
// 客戶相關型別
// ============================================================================

/**
 * 客戶實體
 * 對應後端 API: GET /api/customers/:id
 */
export interface Customer {
  /** 客戶唯一識別碼（UUID） */
  id: string

  /** 客戶姓名（必填，1-100 字元） */
  name: string

  /** 聯絡電話（必填，台灣手機格式：10 字元） */
  phoneNumber: string

  /** 電子郵件（選填，最多 100 字元，需符合 email 格式） */
  email: string | null

  /** 身分證字號/外籍人士格式（必填，10 字元） */
  idNumber: string

  /** 居住地址（必填，1-200 字元） */
  residentialAddress: string

  /** LINE ID（選填，最多 50 字元） */
  lineId: string | null

  /** 建立時間（ISO 8601 格式，UTC） */
  createdAt: string

  /** 最後更新時間（ISO 8601 格式，UTC，可為 null） */
  updatedAt: string | null

  /** 資料版本號（用於樂觀鎖定，從 1 開始） */
  version: number

  /** 是否當前有有效等級（由後端 API 回傳） */
  isCurrentlyAtLevel: boolean

  /** 當前等級名稱（由後端 API 回傳，若無有效等級則為 null） */
  currentLevel: string | null

  /** 當前有效的會員等級詳細資訊（由後端 API 回傳，若無有效等級則為 null） */
  activePeriod: CustomerLevelPeriodResponse | null
}

/**
 * 新增客戶請求模型
 * 對應後端 API: POST /api/customers
 */
export interface CreateCustomerRequest {
  /** 客戶姓名（必填，1-100 字元） */
  name: string

  /** 聯絡電話（必填，10 字元） */
  phoneNumber: string

  /** 電子郵件（選填，最多 100 字元） */
  email?: string

  /** 身分證字號（必填，10 字元） */
  idNumber: string

  /** 居住地址（必填，1-200 字元） */
  residentialAddress: string

  /** LINE ID（選填，最多 50 字元） */
  lineId?: string
}

/**
 * 更新客戶請求模型
 * 對應後端 API: PUT /api/customers/:id
 * 注意：身分證字號不可更新
 */
export interface UpdateCustomerRequest {
  /** 客戶姓名（必填） */
  name: string

  /** 聯絡電話（必填） */
  phoneNumber: string

  /** 電子郵件（選填） */
  email?: string

  /** 居住地址（必填） */
  residentialAddress: string

  /** LINE ID（選填） */
  lineId?: string

  /** 資料版本號（必填，用於樂觀鎖定） */
  version: number
}

/**
 * 列表查詢參數
 * 對應後端 API: GET /api/customers/search
 */
export interface CustomerListParams {
  /** 頁碼（從 1 開始） */
  pageNumber: number

  /** 每頁筆數（1-100） */
  pageSize: number

  /** 搜尋關鍵字（模糊比對姓名/電話/Email/身分證字號） */
  keyword?: string
}

/**
 * AI 身分證辨識結果
 * 對應後端 API: POST /api/ocr/id-card-multi
 */
export interface IdCardRecognitionResponse {
  /** 姓名（辨識成功時為 string，失敗時為 null） */
  name: string | null

  /** 身分證字號（辨識成功時為 string，失敗時為 null） */
  idNumber: string | null

  /** 地址（辨識成功時為 string，失敗時為 null） */
  address: string | null
}

/**
 * 新增客戶表單驗證規則
 */
export const createCustomerRules: FormRules<CreateCustomerRequest> = {
  name: [
    { required: true, message: "請輸入客戶姓名", trigger: "blur" },
    { min: 1, max: 100, message: "長度需在 1-100 字元之間", trigger: "blur" }
  ],
  phoneNumber: [
    { required: true, message: "請輸入聯絡電話", trigger: "blur" },
    { pattern: /^09\d{8}$/, message: "請輸入正確的台灣手機號碼（09開頭，共10碼）", trigger: "blur" }
  ],
  email: [
    { type: "email", message: "請輸入正確的電子郵件格式", trigger: "blur" },
    { max: 100, message: "電子郵件最多 100 字元", trigger: "blur" }
  ],
  idNumber: [
    { required: true, message: "請輸入身分證字號", trigger: "blur" },
    {
      validator: (_rule, value, callback) => {
        // 動態匯入驗證函式（避免循環依賴）
        import("@/common/utils/id-number-validator").then(({ validateTaiwanIdNumber }) => {
          if (!validateTaiwanIdNumber(value)) {
            callback(new Error("請輸入正確的身分證字號格式"))
          } else {
            callback()
          }
        }).catch(() => {
          callback(new Error("驗證函式載入失敗"))
        })
      },
      trigger: "blur"
    }
  ],
  residentialAddress: [
    { required: true, message: "請輸入居住地址", trigger: "blur" },
    { min: 1, max: 200, message: "長度需在 1-200 字元之間", trigger: "blur" }
  ],
  lineId: [
    { max: 50, message: "LINE ID 最多 50 字元", trigger: "blur" }
  ]
}

/**
 * 更新客戶表單驗證規則
 */
export const updateCustomerRules: FormRules<UpdateCustomerRequest> = {
  name: createCustomerRules.name,
  phoneNumber: createCustomerRules.phoneNumber,
  email: createCustomerRules.email,
  residentialAddress: createCustomerRules.residentialAddress,
  lineId: createCustomerRules.lineId,
  version: [
    { required: true, message: "版本號為必填", trigger: "change" }
  ]
}

/**
 * 客戶管理模組 - TypeScript 型別定義
 *
 * @module customer-management/types
 * @description 定義客戶管理相關的所有介面、型別與表單驗證規則
 */

import type { FormRules } from "element-plus"

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

/**
 * 客戶管理 API 服務
 *
 * @module customer-management/apis/customer
 * @description 提供客戶管理相關的所有 API 請求方法
 */

import type {
  CreateCustomerRequest,
  Customer,
  CustomerListParams,
  IdCardRecognitionResponse,
  UpdateCustomerRequest
} from "../types"
import { request } from "@/http/axios"

/**
 * 客戶 API 服務物件
 */
export const customerApi = {
  /**
   * 搜尋客戶列表(分頁)
   * @param params - 查詢參數
   * @returns 客戶列表與總筆數
   */
  async search(params: CustomerListParams): Promise<PagedApiResponse<Customer[]>> {
    return request<PagedApiResponse<Customer[]>>({
      url: "/customers/search",
      method: "get",
      params
    })
  },

  /**
   * 根據 ID 取得客戶詳細資料
   * @param id - 客戶 ID (UUID)
   * @returns 客戶詳細資料
   */
  async getById(id: string): Promise<ApiResponse<Customer>> {
    return request<ApiResponse<Customer>>({
      url: `/customers/${id}`,
      method: "get"
    })
  },

  /**
   * 新增客戶
   * @param data - 新增客戶資料
   * @returns 新建的客戶資料(包含 id, createdAt 等系統欄位)
   */
  async create(data: CreateCustomerRequest): Promise<ApiResponse<Customer>> {
    // 後端 API 要求 email 欄位為 optional，如果前端傳空字串則轉為 undefined
    if (data.email === "") {
      data.email = undefined
    }
    return request<ApiResponse<Customer>>({
      url: "/customers",
      method: "post",
      data
    })
  },

  /**
   * 更新客戶資料
   * @param id - 客戶 ID
   * @param data - 更新資料(必須包含 version 進行樂觀鎖定)
   * @returns 更新後的客戶資料(version 會遞增)
   * @throws {409} 當 version 不匹配時(並發衝突)
   */
  async update(id: string, data: UpdateCustomerRequest): Promise<ApiResponse<Customer>> {
    return request<ApiResponse<Customer>>({
      url: `/customers/${id}`,
      method: "put",
      data
    })
  },

  /**
   * 刪除客戶(軟刪除)
   * @param id - 客戶 ID
   * @returns 刪除結果
   */
  async delete(id: string): Promise<ApiResponse<null>> {
    return request<ApiResponse<null>>({
      url: `/customers/${id}`,
      method: "delete"
    })
  },

  /**
   * 辨識身分證照片(Gemini AI OCR)
   * @param files - 身分證照片陣列(正反面)
   * @returns 辨識結果(姓名、身分證字號、地址)
   * @throws {504} 當 AI 辨識超過 30 秒逾時
   */
  async recognizeIdCard(files: File[]): Promise<ApiResponse<IdCardRecognitionResponse>> {
    const formData = new FormData()
    files.forEach((file) => {
      formData.append("images", file)
    })

    return request<ApiResponse<IdCardRecognitionResponse>>({
      url: "/ocr/id-card-multi",
      method: "post",
      data: formData,
      headers: {
        "Content-Type": "multipart/form-data"
      },
      timeout: 30000 // 30 秒逾時
    })
  }
}

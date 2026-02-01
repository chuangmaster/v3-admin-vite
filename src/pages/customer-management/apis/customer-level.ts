/**
 * 客戶等級 API 服務
 *
 * @module customer-management/apis/customer-level
 * @description 提供客戶等級相關的所有 API 請求方法
 */

import type {
  CreateLevelRequest,
  CustomerLevelPeriodResponse,
  UpdateLevelRequest
} from "../types"
import { API_CODE_SUCCESS } from "@@/constants/api-code"
import { request } from "@/http/axios"

/**
 * 客戶等級 API 服務物件
 */
export const customerLevelApi = {
  /**
   * 建立等級效期
   * @param customerId - 客戶 ID (UUID)
   * @param data - 新增等級請求資料
   * @returns 新建的等級效期記錄
   * @throws {400} 請求參數錯誤（日期範圍不正確等）
   * @throws {409} 與現有期間重疊
   */
  async createLevel(customerId: string, data: CreateLevelRequest): Promise<ApiResponse<CustomerLevelPeriodResponse>> {
    return request<ApiResponse<CustomerLevelPeriodResponse>>({
      url: `/customers/${customerId}/levels`,
      method: "post",
      data
    })
  },

  /**
   * 查詢等級歷程記錄
   * @param customerId - 客戶 ID (UUID)
   * @param includeExpired - 是否包含已過期的記錄（預設為 true）
   * @returns 等級效期記錄陣列
   */
  async getLevelHistory(
    customerId: string,
    includeExpired: boolean = true
  ): Promise<ApiResponse<CustomerLevelPeriodResponse[]>> {
    return request<ApiResponse<CustomerLevelPeriodResponse[]>>({
      url: `/customers/${customerId}/levels`,
      method: "get",
      params: { includeExpired }
    })
  },

  /**
   * 查詢當前有效等級狀態
   * @param customerId - 客戶 ID (UUID)
   * @returns 當前有效的等級效期記錄，若無有效會籍則回傳 null
   */
  async getActiveLevel(customerId: string): Promise<ApiResponse<CustomerLevelPeriodResponse | null>> {
    try {
      const response = await request<ApiResponse<CustomerLevelPeriodResponse | null>>({
        url: `/customers/${customerId}/levels/active`,
        method: "get"
      })
      const rawData = response.data
      if (rawData === null) {
        return { ...response, data: null }
      }
      return { ...response, data: rawData }
    } catch (error: unknown) {
      // 404 表示無有效等級，視為正常情況
      if (error && typeof error === "object" && "response" in error) {
        const err = error as { response?: { status?: number } }
        if (err.response?.status === 404) {
          return {
            success: true,
            code: API_CODE_SUCCESS,
            message: "success",
            data: null,
            timestamp: new Date().toISOString(),
            traceId: ""
          }
        }
      }
      throw error
    }
  },

  /**
   * 更新等級效期
   * @param customerId - 客戶 ID (UUID)
   * @param levelId - 等級效期記錄 ID (UUID)
   * @param data - 更新資料（必須包含 version 進行樂觀鎖定）
   * @returns 更新後的等級效期記錄（version 會遞增）
   * @throws {404} 等級效期記錄不存在
   * @throws {409} 版本衝突（樂觀鎖）
   */
  async updateLevel(
    customerId: string,
    levelId: string,
    data: UpdateLevelRequest
  ): Promise<ApiResponse<CustomerLevelPeriodResponse>> {
    return request<ApiResponse<CustomerLevelPeriodResponse>>({
      url: `/customers/${customerId}/levels/${levelId}`,
      method: "put",
      data
    })
  },

  /**
   * 終止當前會籍
   * @param customerId - 客戶 ID (UUID)
   * @returns 終止後的等級效期記錄（endDate 會更新為當前時間 - 1 秒，status 變為 Expired）
   * @throws {404} 無有效的會籍可終止
   */
  async terminateLevel(customerId: string): Promise<ApiResponse<CustomerLevelPeriodResponse>> {
    return request<ApiResponse<CustomerLevelPeriodResponse>>({
      url: `/customers/${customerId}/levels/terminate`,
      method: "post"
    })
  }
}

/**
 * 服務單管理 API 服務
 * @module @/pages/service-order-management/apis/service-order
 */

import type { PagedApiResponse } from "types/api"
import type {
  CreateBuybackOrderRequest,
  CreateConsignmentOrderRequest,
  ModificationHistory,
  ServiceOrder,
  ServiceOrderListItem,
  ServiceOrderListParams,
  UpdateStatusRequest
} from "../types"
import { request } from "@/http/axios"

/**
 * 查詢服務單列表
 * @param params - 查詢參數（頁碼、每頁筆數、服務單類型、客戶名稱、日期範圍、狀態）
 * @returns 服務單列表回應
 */
export async function getServiceOrderList(
  params: ServiceOrderListParams
): Promise<PagedApiResponse<ServiceOrderListItem[]>> {
  // 處理日期範圍參數，將 createdDateRange 轉換為 createdAtStart 和 createdAtEnd
  const apiParams = { ...params }
  if (apiParams.createdDateRange && apiParams.createdDateRange.length === 2) {
    // 將 YYYY-MM-DD 格式轉換為瀏覽器本地時區的開始時間（00:00:00）
    const startDate = new Date(`${apiParams.createdDateRange[0]}T00:00:00`)
    // 將 YYYY-MM-DD 格式轉換為瀏覽器本地時區的結束時間（23:59:59）
    const endDate = new Date(`${apiParams.createdDateRange[1]}T23:59:59`)

    // 轉換為 ISO 8601 格式（包含時區資訊）
    apiParams.createdAtStart = startDate.toISOString()
    apiParams.createdAtEnd = endDate.toISOString()
  }
  // 移除前端用的 createdDateRange，避免傳給後端
  delete (apiParams as any).createdDateRange

  return request({ url: "/service-orders", method: "GET", params: apiParams })
}

/**
 * 查詢單一服務單
 * @param id - 服務單 ID（UUID）
 * @returns 服務單完整資料
 */
export async function getServiceOrder(id: string): Promise<ApiResponse<ServiceOrder>> {
  return request({ url: `/service-orders/${id}`, method: "GET" })
}

/**
 * 建立收購單 (US1 線下/線上)
 * @param data - 建立收購單請求資料
 * @returns 建立的服務單資料
 */
export async function createBuybackOrder(
  data: CreateBuybackOrderRequest
): Promise<ApiResponse<ServiceOrder>> {
  return request({ url: "/service-orders/buyback", method: "POST", data })
}

/**
 * 建立寄賣單 (US2 線下/線上)
 * @param data - 建立寄賣單請求資料
 * @returns 建立的服務單資料
 */
export async function createConsignmentOrder(
  data: CreateConsignmentOrderRequest
): Promise<ApiResponse<ServiceOrder>> {
  return request({ url: "/service-orders/consignment", method: "POST", data })
}

/**
 * 更新服務單狀態
 * @param id - 服務單 ID（UUID）
 * @param data - 更新狀態請求資料（包含樂觀鎖版本號）
 * @returns 更新後的服務單資料
 */
export async function updateServiceOrderStatus(
  id: string,
  data: UpdateStatusRequest
): Promise<ApiResponse<ServiceOrder>> {
  return request({ url: `/service-orders/${id}/status`, method: "PATCH", data })
}

/**
 * 查詢服務單修改歷史
 * @param id - 服務單 ID（UUID）
 * @returns 修改歷史列表
 */
export async function getModificationHistory(
  id: string
): Promise<ApiResponse<ModificationHistory[]>> {
  return request({ url: `/service-orders/${id}/history`, method: "GET" })
}

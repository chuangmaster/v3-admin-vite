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
import { toUTC0ISOString } from "@@/utils/datetime"
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
    // 轉換為 UTC+0 的 ISO String 格式
    apiParams.createdAtStart = toUTC0ISOString(apiParams.createdDateRange[0], false)
    apiParams.createdAtEnd = toUTC0ISOString(apiParams.createdDateRange[1], true)
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

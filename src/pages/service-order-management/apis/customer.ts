/**
 * 客戶管理 API 服務
 * @module @/pages/service-order-management/apis/customer
 */

import type {
  CreateCustomerRequest,
  Customer,
  CustomerSearchParams
} from "../types"
import { request } from "@/http/axios"

/**
 * 搜尋客戶
 * @param params - 搜尋參數（關鍵字：姓名、電話、Email、身分證字號）
 * @returns 客戶列表
 */
export async function searchCustomers(
  params: CustomerSearchParams
): Promise<ApiResponse<Customer[]>> {
  return request({ url: "/customers/search", method: "GET", params })
}

/**
 * 新增客戶
 * @param data - 新增客戶請求資料
 * @returns 建立的客戶資料
 */
export async function createCustomer(
  data: CreateCustomerRequest
): Promise<ApiResponse<Customer>> {
  return request({ url: "/customers", method: "POST", data })
}

/**
 * 查詢客戶詳細資訊
 * @param id - 客戶 ID（UUID）
 * @returns 客戶資料
 */
export async function getCustomer(id: string): Promise<ApiResponse<Customer>> {
  return request({ url: `/customers/${id}`, method: "GET" })
}

/**
 * 客戶管理 API 服務
 * @module @/pages/service-order-management/apis/customer
 * @description 重新匯出 customer-management 模組的 API,避免重複實作
 */

import type { CustomerSearchParams } from "../types"
import type { Customer } from "@/pages/customer-management/types"
import { customerApi } from "@/pages/customer-management/apis/customer"

/**
 * 搜尋客戶
 * @param params - 搜尋參數（關鍵字：姓名、電話、Email、身分證字號）
 * @returns 客戶列表
 */
export async function searchCustomers(
  params: CustomerSearchParams
): Promise<PagedApiResponse<Customer[]>> {
  return customerApi.search({
    pageNumber: params.pageNumber || 1,
    pageSize: params.pageSize || 20,
    keyword: params.keyword
  })
}

/**
 * 查詢客戶詳細資訊
 * @param id - 客戶 ID（UUID）
 * @returns 客戶資料
 */
export async function getCustomer(id: string): Promise<ApiResponse<Customer>> {
  return customerApi.getById(id)
}

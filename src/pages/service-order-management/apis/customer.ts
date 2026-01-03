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
 * 後端回傳的客戶資料格式（與前端欄位名稱不同）
 */
interface CustomerResponseDTO {
  id: string
  name: string
  phoneNumber: string
  email?: string
  idNumber: string
  residentialAddress: string
  lineId?: string
  createdAt: string
  updatedAt?: string
}

/**
 * 轉換後端回傳的客戶資料為前端格式
 */
function transformCustomer(dto: CustomerResponseDTO): Customer {
  return {
    id: dto.id,
    name: dto.name,
    phoneNumber: dto.phoneNumber,
    email: dto.email,
    idCardNumber: dto.idNumber,
    residentialAddress: dto.residentialAddress,
    lineId: dto.lineId,
    createdAt: dto.createdAt,
    updatedAt: dto.updatedAt
  }
}

/**
 * 搜尋客戶
 * @param params - 搜尋參數（關鍵字：姓名、電話、Email、身分證字號）
 * @returns 客戶列表
 */
export async function searchCustomers(
  params: CustomerSearchParams
): Promise<ApiResponse<Customer[]>> {
  const response = await request<ApiResponse<CustomerResponseDTO[]>>({
    url: "/customers/search",
    method: "GET",
    params
  })

  if (response.success && response.data) {
    return {
      ...response,
      data: response.data.map(transformCustomer)
    }
  }

  return {
    ...response,
    data: []
  }
}

/**
 * 新增客戶
 * @param data - 新增客戶請求資料
 * @returns 建立的客戶資料
 */
export async function createCustomer(
  data: CreateCustomerRequest
): Promise<ApiResponse<Customer>> {
  const response = await request<ApiResponse<CustomerResponseDTO>>({
    url: "/customers",
    method: "POST",
    data
  })

  if (response.success && response.data) {
    return {
      ...response,
      data: transformCustomer(response.data)
    }
  }

  return response as unknown as ApiResponse<Customer>
}

/**
 * 查詢客戶詳細資訊
 * @param id - 客戶 ID（UUID）
 * @returns 客戶資料
 */
export async function getCustomer(id: string): Promise<ApiResponse<Customer>> {
  const response = await request<ApiResponse<CustomerResponseDTO>>({
    url: `/customers/${id}`,
    method: "GET"
  })

  if (response.success && response.data) {
    return {
      ...response,
      data: transformCustomer(response.data)
    }
  }

  return response as unknown as ApiResponse<Customer>
}

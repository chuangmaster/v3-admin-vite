/**
 * 訂單管理 API 服務
 *
 * @module order-management/apis/order
 * @description 提供訂單管理相關的所有 API 請求方法（13 個端點）
 */

import type {
  AddPaymentRecordRequest,
  CreateSalesOrderRequest,
  OrderExportParams,
  PaymentRecordReportItem,
  PaymentRecordReportParams,
  SalesOrder,
  SalesOrderExportDto,
  SalesOrderListItem,
  SalesOrderListParams,
  ShippingLabelResponse,
  UpdateOrderStatusRequest,
  UpdatePaymentRecordRequest,
  UpdatePaymentStatusRequest,
  UpdateSalesOrderRequest,
  UpdateShippingStatusRequest
} from "@/pages/order-management/types"
import { request } from "@/http/axios"

/**
 * 訂單 API 服務物件
 */
export const orderApi = {
  /**
   * 建立銷售訂單
   * @param data - 建立訂單資料
   * @returns 建立的訂單完整資料（包含訂單編號）
   */
  async create(data: CreateSalesOrderRequest): Promise<ApiResponse<SalesOrder>> {
    return request<ApiResponse<SalesOrder>>({
      url: "/sales-orders",
      method: "post",
      data
    })
  },

  /**
   * 取得訂單列表（分頁）
   * @param params - 查詢參數
   * @returns 訂單列表與分頁資訊
   */
  async getList(params: SalesOrderListParams): Promise<PagedApiResponse<SalesOrderListItem[]>> {
    return request<PagedApiResponse<SalesOrderListItem[]>>({
      url: "/sales-orders",
      method: "get",
      params
    })
  },

  /**
   * 取得訂單詳細資訊
   * @param id - 訂單 ID（UUID）
   * @returns 訂單完整資料
   */
  async getDetail(id: string): Promise<ApiResponse<SalesOrder>> {
    return request<ApiResponse<SalesOrder>>({
      url: `/sales-orders/${id}`,
      method: "get"
    })
  },

  /**
   * 修改銷售訂單
   * @param id - 訂單 ID
   * @param data - 修改資料（必須包含 version 進行樂觀鎖定）
   * @returns 修改後的訂單完整資料
   * @throws {409} 當 version 不匹配時（並發衝突）
   */
  async update(id: string, data: UpdateSalesOrderRequest): Promise<ApiResponse<SalesOrder>> {
    return request<ApiResponse<SalesOrder>>({
      url: `/sales-orders/${id}`,
      method: "put",
      data
    })
  },

  /**
   * 刪除銷售訂單（軟刪除）
   * @param id - 訂單 ID
   * @returns 刪除結果
   */
  async delete(id: string): Promise<ApiResponse<null>> {
    return request<ApiResponse<null>>({
      url: `/sales-orders/${id}`,
      method: "delete"
    })
  },

  /**
   * 新增付款記錄
   * @param orderId - 訂單 ID
   * @param data - 付款記錄資料
   * @returns 新增的付款記錄
   */
  async addPaymentRecord(orderId: string, data: AddPaymentRecordRequest): Promise<ApiResponse<SalesOrder>> {
    return request<ApiResponse<SalesOrder>>({
      url: `/sales-orders/${orderId}/payment-records`,
      method: "post",
      data
    })
  },

  /**
   * 修改付款記錄（僅允許修改銀行末五碼）
   * @param orderId - 訂單 ID
   * @param paymentRecordId - 付款記錄 ID
   * @param data - 修改資料
   * @returns 修改後的付款記錄
   */
  async updatePaymentRecord(
    orderId: string,
    paymentRecordId: string,
    data: UpdatePaymentRecordRequest
  ): Promise<ApiResponse<SalesOrder>> {
    return request<ApiResponse<SalesOrder>>({
      url: `/sales-orders/${orderId}/payment-records/${paymentRecordId}`,
      method: "put",
      data
    })
  },

  /**
   * 刪除付款記錄（硬刪除）
   * @param orderId - 訂單 ID
   * @param paymentRecordId - 付款記錄 ID
   * @returns 刪除結果
   */
  async deletePaymentRecord(orderId: string, paymentRecordId: string): Promise<ApiResponse<SalesOrder>> {
    return request<ApiResponse<SalesOrder>>({
      url: `/sales-orders/${orderId}/payment-records/${paymentRecordId}`,
      method: "delete"
    })
  },

  /**
   * 更新付款狀態（手動調整）
   * @param id - 訂單 ID
   * @param data - 付款狀態
   * @returns 更新結果
   */
  async updatePaymentStatus(id: string, data: UpdatePaymentStatusRequest): Promise<ApiResponse<null>> {
    return request<ApiResponse<null>>({
      url: `/sales-orders/${id}/payment-status`,
      method: "put",
      data
    })
  },

  /**
   * 更新訂單狀態
   * @param id - 訂單 ID
   * @param data - 訂單狀態
   * @returns 更新結果
   */
  async updateOrderStatus(id: string, data: UpdateOrderStatusRequest): Promise<ApiResponse<null>> {
    return request<ApiResponse<null>>({
      url: `/sales-orders/${id}/order-status`,
      method: "put",
      data
    })
  },

  /**
   * 更新出貨狀態
   * @param id - 訂單 ID
   * @param data - 出貨狀態
   * @returns 更新結果
   */
  async updateShippingStatus(id: string, data: UpdateShippingStatusRequest): Promise<ApiResponse<null>> {
    return request<ApiResponse<null>>({
      url: `/sales-orders/${id}/shipping-status`,
      method: "put",
      data
    })
  },

  /**
   * 匯出訂單報表
   * @param params - 篩選參數
   * @returns 匯出資料陣列
   */
  async getExportData(params?: OrderExportParams): Promise<ApiResponse<SalesOrderExportDto[]>> {
    return request<ApiResponse<SalesOrderExportDto[]>>({
      url: "/sales-orders/export",
      method: "get",
      params
    })
  },

  /**
   * 取得出貨單資料
   * @param id - 訂單 ID
   * @returns 出貨單資料
   */
  async getShippingLabel(id: string): Promise<ApiResponse<ShippingLabelResponse>> {
    return request<ApiResponse<ShippingLabelResponse>>({
      url: `/sales-orders/${id}/shipping-label`,
      method: "get"
    })
  },

  /**
   * 取得付款紀錄報表（依建立時間區間篩選）
   * @param params - 查詢參數（createdAtStart、createdAtEnd 必填）
   * @returns 付款紀錄列表
   */
  async getPaymentRecords(params: PaymentRecordReportParams): Promise<ApiResponse<PaymentRecordReportItem[]>> {
    return request<ApiResponse<PaymentRecordReportItem[]>>({
      url: "/payment-records",
      method: "get",
      params
    })
  }
}

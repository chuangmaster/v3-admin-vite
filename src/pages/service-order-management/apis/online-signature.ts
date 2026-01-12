/**
 * 線上簽章 API 服務
 * @module @/pages/service-order-management/apis/online-signature
 */

import type { SendOnlineSignatureRequest, SendOnlineSignatureResponse } from "../types"
import { request } from "@/http/axios"

/**
 * 發送線上簽章請求
 * @param serviceOrderId - 服務單 ID
 * @param data - 發送請求資料（可選）
 * @returns 簽章請求回應
 * @remarks 後端會根據 serviceOrderId 自動判斷文件類型（documentType），前端無需指定
 */
export async function sendOnlineSignature(
  serviceOrderId: string,
  data?: SendOnlineSignatureRequest
): Promise<ApiResponse<SendOnlineSignatureResponse>> {
  return request<ApiResponse<SendOnlineSignatureResponse>>({
    url: `/service-orders/${serviceOrderId}/signatures/online`,
    method: "POST",
    data: data || {}
  })
}

/**
 * 重新發送線上簽章請求
 * @param serviceOrderId - 服務單 ID
 * @returns 簽章請求回應
 * @remarks 重新發送頻率限制（一小時內僅能操作一次）由後端強制執行，
 *          若違反限制，後端會回傳錯誤，前端僅需顯示錯誤訊息即可
 */
export async function resendOnlineSignature(
  serviceOrderId: string
): Promise<ApiResponse<SendOnlineSignatureResponse>> {
  return request<ApiResponse<SendOnlineSignatureResponse>>({
    url: `/service-orders/${serviceOrderId}/signatures/online/resend`,
    method: "POST"
  })
}

/**
 * 簽名管理 API 服務
 * @module @/pages/service-order-management/apis/signature
 */

import type {
  GeneratePdfPreviewRequest,
  GeneratePdfPreviewResponse,
  MergeSignaturePreviewRequest,
  MergeSignaturePreviewResponse,
  ResendSignatureRequest,
  SaveOfflineSignatureRequest,
  SendOnlineSignatureRequest,
  SignatureRecord
} from "../types"
import { request } from "@/http/axios"

/**
 * 合併簽名與預覽文件
 * @param serviceOrderId - 服務單 ID（UUID）
 * @param data - 合併簽名預覽請求資料（文件類型、簽名 Base64）
 * @returns 預覽文件 URL 與過期時間
 */
export async function mergeSignaturePreview(
  serviceOrderId: string,
  data: MergeSignaturePreviewRequest
): Promise<ApiResponse<MergeSignaturePreviewResponse>> {
  return request({
    url: `/service-orders/${serviceOrderId}/signatures/merge-preview`,
    method: "POST",
    data
  })
}

/**
 * 儲存線下簽名
 * @param data - 儲存線下簽名請求資料（簽名記錄 ID、文件類型、簽名資料、簽名者姓名）
 * @returns 簽名記錄
 */
export async function saveOfflineSignature(
  data: SaveOfflineSignatureRequest
): Promise<ApiResponse<SignatureRecord>> {
  return request({
    url: `/signatures/offline/confirm`,
    method: "POST",
    data
  })
}

/**
 * 發送線上簽名邀請
 * @param serviceOrderId - 服務單 ID（UUID）
 * @param data - 發送線上簽名請求資料（文件類型、簽名者姓名、簽名者 Email）
 * @returns 簽名記錄（包含 Dropbox Sign 請求 ID）
 */
export async function sendOnlineSignature(
  serviceOrderId: string,
  data: SendOnlineSignatureRequest
): Promise<ApiResponse<SignatureRecord>> {
  return request({
    url: `/service-orders/${serviceOrderId}/signatures/online`,
    method: "POST",
    data
  })
}

/**
 * 重新發送簽名邀請
 * @param serviceOrderId - 服務單 ID（UUID）
 * @param data - 重新發送簽名請求資料（簽名記錄 ID）
 * @returns 操作結果（data 為 null）
 */
export async function resendSignature(
  serviceOrderId: string,
  data: ResendSignatureRequest
): Promise<ApiResponse<null>> {
  return request({
    url: `/service-orders/${serviceOrderId}/signatures/resend`,
    method: "POST",
    data
  })
}

/**
 * 取得簽名記錄列表
 * @param serviceOrderId - 服務單 ID（UUID）
 * @returns 簽名記錄列表
 */
export async function getSignatureRecords(
  serviceOrderId: string
): Promise<ApiResponse<SignatureRecord[]>> {
  return request({
    url: `/service-orders/${serviceOrderId}/signatures`,
    method: "GET"
  })
}

/**
 * 生成合約預覽 PDF
 * @param data - 生成合約預覽請求資料（客戶資訊、商品項目等）
 * @returns 合約預覽 URL（收購單包含收購合約和一時貿易申請書，寄賣單包含寄賣合約書）
 */
export async function generatePdfPreview(
  data: GeneratePdfPreviewRequest
): Promise<ApiResponse<GeneratePdfPreviewResponse>> {
  return request({
    url: "/pdf/preview",
    method: "POST",
    data
  })
}

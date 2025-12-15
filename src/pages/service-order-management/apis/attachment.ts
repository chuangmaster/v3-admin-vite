/**
 * 附件管理 API 服務
 * @module @/pages/service-order-management/apis/attachment
 */

import type {
  Attachment,
  LogAttachmentViewRequest,
  LogAttachmentViewResponse
} from "../types"
import { request } from "@/http/axios"

/**
 * 上傳附件
 * @param serviceOrderId - 服務單 ID（UUID）
 * @param file - 檔案
 * @param fileType - 檔案類型（ID_CARD, CONTRACT, OTHER）
 * @returns 上傳的附件資料
 */
export async function uploadAttachment(
  serviceOrderId: string,
  file: File,
  fileType: string
): Promise<ApiResponse<Attachment>> {
  const formData = new FormData()
  formData.append("file", file)
  formData.append("fileType", fileType)

  return request({
    url: `/service-orders/${serviceOrderId}/attachments`,
    method: "POST",
    data: formData,
    headers: {
      "Content-Type": "multipart/form-data"
    }
  })
}

/**
 * 取得附件列表
 * @param serviceOrderId - 服務單 ID（UUID）
 * @returns 附件列表
 */
export async function getAttachmentList(
  serviceOrderId: string
): Promise<ApiResponse<Attachment[]>> {
  return request({
    url: `/service-orders/${serviceOrderId}/attachments`,
    method: "GET"
  })
}

/**
 * 下載附件
 * @param attachmentId - 附件 ID（UUID）
 * @returns 檔案二進位資料
 */
export async function downloadAttachment(attachmentId: string): Promise<Blob> {
  return request({
    url: `/attachments/${attachmentId}/download`,
    method: "GET",
    responseType: "blob"
  })
}

/**
 * 記錄附件查看日誌（敏感附件如身分證明文件）
 * @param attachmentId - 附件 ID（UUID）
 * @param data - 查看日誌請求資料（操作類型：VIEW 或 DOWNLOAD）
 * @returns 查看日誌記錄
 */
export async function logAttachmentView(
  attachmentId: string,
  data: LogAttachmentViewRequest
): Promise<ApiResponse<LogAttachmentViewResponse>> {
  return request({
    url: `/attachments/${attachmentId}/view-log`,
    method: "POST",
    data
  })
}

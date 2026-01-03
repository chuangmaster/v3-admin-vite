/**
 * OCR 辨識 API 服務
 * @module @/pages/service-order-management/apis/ocr
 */

import type { OcrIdCardRequest, OCRIDCardResponse } from "../types"
import { request } from "@/http/axios"

/**
 * 辨識身分證
 * @param imageBase64 - 身分證圖片 Base64 字串（不含 data:image/jpeg;base64, 前綴）
 * @param contentType - 圖片 MIME 類型（預設：image/jpeg）
 * @param fileName - 原始檔案名稱（可選）
 * @returns OCR 辨識結果（姓名、身分證字號、信心度）
 */
export async function recognizeIDCard(
  imageBase64: string,
  contentType = "image/jpeg",
  fileName?: string
): Promise<ApiResponse<OCRIDCardResponse>> {
  const requestData: OcrIdCardRequest = {
    imageBase64,
    contentType
  }

  if (fileName) {
    requestData.fileName = fileName
  }

  return request({
    url: "/ocr/id-card",
    method: "POST",
    data: requestData
  })
}

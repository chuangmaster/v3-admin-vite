/**
 * OCR 辨識 API 服務
 * @module @/pages/service-order-management/apis/ocr
 */

import type { OCRIDCardResponse } from "../types"
import { request } from "@/http/axios"

/**
 * 辨識身分證
 * @param file - 身分證圖片檔案
 * @returns OCR 辨識結果（姓名、身分證字號、信心度）
 */
export async function recognizeIDCard(file: File): Promise<ApiResponse<OCRIDCardResponse>> {
  const formData = new FormData()
  formData.append("file", file)

  return request({
    url: "/ocr/id-card",
    method: "POST",
    data: formData,
    headers: {
      "Content-Type": "multipart/form-data"
    }
  })
}

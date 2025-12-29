/**
 * 簽名相關業務邏輯
 */
import type { GeneratePdfPreviewRequest, GeneratePdfPreviewResponse, SignatureRecord } from "../types"
import { generatePdfPreview, mergeSignaturePreview, saveOfflineSignature } from "../apis/signature"
import { DocumentType } from "../types"

/**
 * 將 Base64 編碼的 PDF 轉換為可顯示的 Data URL
 * @param base64 - Base64 編碼的 PDF 字串
 * @returns 可用於 iframe src 的 Data URL
 */
function base64ToDataUrl(base64: string): string {
  if (!base64) return ""
  // 如果已經是 Data URL 格式，直接返回
  if (base64.startsWith("data:")) {
    return base64
  }
  return `data:application/pdf;base64,${base64}`
}

export function useSignature() {
  const loading = ref(false)

  /** 簽名記錄 */
  const signatureRecord = ref<SignatureRecord>()

  /** 合約預覽 URL (收購合約) */
  const buybackContractPreviewUrl = ref<string>("")

  /** 貿易書預覽 URL */
  const tradeApplicationPreviewUrl = ref<string>("")

  /** 寄賣合約預覽 URL */
  const consignmentContractPreviewUrl = ref<string>("")

  /**
   * 生成合約預覽 PDF
   * @param data - 客戶資料、商品資料等
   */
  async function generatePreview(data: GeneratePdfPreviewRequest): Promise<GeneratePdfPreviewResponse | null> {
    loading.value = true
    try {
      const response = await generatePdfPreview(data)

      if (response.success && response.data) {
        // 支援兩種格式：URL 格式（契約規格）或 Base64 格式（後端過渡版本）
        const resData = response.data as GeneratePdfPreviewResponse & { pdfBase64?: string }

        // 根據後端返回的 URL 設定對應的預覽 URL（後端可能一次返回多個 URL）
        if (resData.buybackContractUrl) {
          buybackContractPreviewUrl.value = resData.buybackContractUrl
        }
        if (resData.tradeApplicationUrl) {
          tradeApplicationPreviewUrl.value = resData.tradeApplicationUrl
        }
        if (resData.consignmentContractUrl) {
          consignmentContractPreviewUrl.value = resData.consignmentContractUrl
        }
        // 向後相容：如果是舊版 API 返回 pdfBase64，則根據請求的文件類型設定對應的預覽 URL
        if (resData.pdfBase64 && !resData.buybackContractUrl && !resData.tradeApplicationUrl && !resData.consignmentContractUrl) {
          const pdfDataUrl = base64ToDataUrl(resData.pdfBase64)
          if (data.documentType === DocumentType.BUYBACK_CONTRACT) {
            buybackContractPreviewUrl.value = pdfDataUrl
          } else if (data.documentType === DocumentType.ONE_TIME_TRADE) {
            tradeApplicationPreviewUrl.value = pdfDataUrl
          } else if (data.documentType === DocumentType.CONSIGNMENT_CONTRACT) {
            consignmentContractPreviewUrl.value = pdfDataUrl
          }
        }
        return response.data
      } else {
        ElMessage.error(response.message || "生成合約預覽失敗")
        return null
      }
    } catch {
      ElMessage.error("生成合約預覽失敗，請稍後再試")
      return null
    } finally {
      loading.value = false
    }
  }

  /**
   * 合併簽名與預覽（用於確認簽名效果）
   * @param serviceOrderId - 服務單 ID
   * @param documentType - 文件類型
   * @param signatureBase64 - 簽名 Base64
   */
  async function mergeSignatureWithPreview(
    serviceOrderId: string,
    documentType: DocumentType,
    signatureBase64: string
  ): Promise<string | null> {
    loading.value = true
    try {
      const response = await mergeSignaturePreview(serviceOrderId, {
        documentType,
        signatureBase64
      })

      if (response.success && response.data) {
        return response.data.previewUrl
      } else {
        ElMessage.error(response.message || "合併簽名預覽失敗")
        return null
      }
    } catch {
      ElMessage.error("合併簽名預覽失敗，請稍後再試")
      return null
    } finally {
      loading.value = false
    }
  }

  /**
   * 儲存離線簽名
   */
  async function saveSignature(
    signatureRecordId: string,
    documentType: DocumentType,
    signatureDataUrl: string,
    signerName: string = "客戶"
  ): Promise<boolean> {
    loading.value = true
    try {
      const response = await saveOfflineSignature({
        signatureRecordId,
        signatureData: signatureDataUrl,
        signerName
      })

      if (response.success && response.data) {
        signatureRecord.value = response.data
        ElMessage.success("簽名儲存成功")
        return true
      } else {
        ElMessage.error(response.message || "簽名儲存失敗")
        return false
      }
    } catch {
      ElMessage.error("簽名儲存失敗，請稍後再試")
      return false
    } finally {
      loading.value = false
    }
  }

  /**
   * 清除簽名記錄
   */
  function clearSignature() {
    signatureRecord.value = undefined
    buybackContractPreviewUrl.value = ""
    tradeApplicationPreviewUrl.value = ""
    consignmentContractPreviewUrl.value = ""
  }

  return {
    loading,
    signatureRecord,
    buybackContractPreviewUrl,
    tradeApplicationPreviewUrl,
    consignmentContractPreviewUrl,
    generatePreview,
    mergeSignatureWithPreview,
    saveSignature,
    clearSignature
  }
}

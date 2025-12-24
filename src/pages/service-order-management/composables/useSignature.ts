/**
 * 簽名相關業務邏輯
 */
import type { DocumentType, GenerateContractPreviewRequest, GenerateContractPreviewResponse, SignatureRecord } from "../types"
import { generateContractPreview, mergeSignaturePreview, saveOfflineSignature } from "../apis/signature"
import { ServiceOrderType } from "../types"

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
  async function generatePreview(data: GenerateContractPreviewRequest): Promise<GenerateContractPreviewResponse | null> {
    loading.value = true
    try {
      const response = await generateContractPreview(data)

      if (response.success && response.data) {
        // 支援兩種格式：URL 格式（契約規格）或 Base64 格式（後端過渡版本）
        const resData = response.data as GenerateContractPreviewResponse & { pdfBase64?: string }

        if (data.orderType === ServiceOrderType.BUYBACK) {
          // 優先使用 URL，若無則使用 Base64 轉換
          buybackContractPreviewUrl.value = resData.buybackContractUrl || base64ToDataUrl(resData.pdfBase64 || "")
          tradeApplicationPreviewUrl.value = resData.tradeApplicationUrl || base64ToDataUrl(resData.pdfBase64 || "")
        } else {
          consignmentContractPreviewUrl.value = resData.consignmentContractUrl || base64ToDataUrl(resData.pdfBase64 || "")
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
    serviceOrderId: string,
    documentType: DocumentType,
    signatureDataUrl: string,
    signerName: string = "客戶"
  ): Promise<boolean> {
    loading.value = true
    try {
      const response = await saveOfflineSignature(serviceOrderId, {
        documentType,
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

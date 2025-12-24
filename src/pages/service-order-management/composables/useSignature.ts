/**
 * 簽名相關業務邏輯
 */
import type { DocumentType, GenerateContractPreviewRequest, GenerateContractPreviewResponse, SignatureRecord } from "../types"
import { generateContractPreview, mergeSignaturePreview, saveOfflineSignature } from "../apis/signature"
import { ServiceOrderType } from "../types"

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
        // 儲存預覽 URL
        if (data.orderType === ServiceOrderType.BUYBACK) {
          buybackContractPreviewUrl.value = response.data.buybackContractUrl || ""
          tradeApplicationPreviewUrl.value = response.data.tradeApplicationUrl || ""
        } else {
          consignmentContractPreviewUrl.value = response.data.consignmentContractUrl || ""
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

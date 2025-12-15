/**
 * 簽名相關業務邏輯
 */
import type { SignatureRecord } from "../types"
import { saveOfflineSignature } from "../apis/signature"
import { DocumentType } from "../types"

export function useSignature() {
  const loading = ref(false)

  /** 簽名記錄 */
  const signatureRecord = ref<SignatureRecord>()

  /**
   * 儲存離線簽名
   */
  async function saveSignature(
    serviceOrderId: string,
    signatureDataUrl: string,
    signerName: string = "客戶"
  ): Promise<boolean> {
    loading.value = true
    try {
      const response = await saveOfflineSignature(serviceOrderId, {
        documentType: DocumentType.BUYBACK_CONTRACT,
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
  }

  return {
    loading,
    signatureRecord,
    saveSignature,
    clearSignature
  }
}

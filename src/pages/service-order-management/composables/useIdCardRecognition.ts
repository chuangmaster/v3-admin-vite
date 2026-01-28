/**
 * 身分證辨識業務邏輯
 */
import { customerApi } from "@/pages/customer-management/apis/customer"

export function useIdCardRecognition() {
  const recognizing = ref(false)
  const retryCount = ref(0)
  const MAX_RETRY_COUNT = 3

  /** 辨識結果 */
  const recognitionResult = ref<{
    name: string
    idNumber: string
  }>()

  /**
   * 執行辨識
   */
  async function recognize(file: File): Promise<boolean> {
    recognizing.value = true
    try {
      // 呼叫統一的 OCR API
      const response = await customerApi.recognizeIdCard([file])

      if (response.success && response.data) {
        recognitionResult.value = {
          name: response.data.name || "",
          idNumber: response.data.idNumber || ""
        }
        retryCount.value = 0
        ElMessage.success("辨識成功")
        return true
      } else {
        throw new Error(response.message || "辨識失敗")
      }
    } catch {
      retryCount.value++

      if (retryCount.value < MAX_RETRY_COUNT) {
        const shouldRetry = await ElMessageBox.confirm(
          `辨識失敗,是否重試?(剩餘 ${MAX_RETRY_COUNT - retryCount.value} 次機會)`,
          "提示",
          {
            confirmButtonText: "重試",
            cancelButtonText: "取消",
            type: "warning"
          }
        ).catch(() => false)

        if (shouldRetry) {
          return recognize(file)
        } else {
          ElMessage.info("已取消辨識")
          return false
        }
      } else {
        ElMessage.error("已達最大重試次數,請檢查圖片是否清晰或手動輸入資料")
        retryCount.value = 0
        return false
      }
    } finally {
      recognizing.value = false
    }
  }

  /**
   * 清除辨識結果
   */
  function clearResult() {
    recognitionResult.value = undefined
    retryCount.value = 0
  }

  return {
    recognizing,
    retryCount,
    recognitionResult,
    recognize,
    clearResult
  }
}

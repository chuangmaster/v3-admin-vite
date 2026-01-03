/**
 * 身分證辨識業務邏輯
 */
import { recognizeIDCard } from "../apis/ocr"

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
   * 將檔案轉換為 Base64
   */
  function fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => {
        const result = reader.result as string
        // 移除 data:image/xxx;base64, 前綴
        const base64 = result.split(",")[1]
        resolve(base64)
      }
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  }

  /**
   * 執行辨識
   */
  async function recognize(file: File): Promise<boolean> {
    recognizing.value = true
    try {
      // 將圖片轉換為 Base64
      const base64 = await fileToBase64(file)
      const contentType = file.type || "image/jpeg"
      const fileName = file.name

      const response = await recognizeIDCard(base64, contentType, fileName)

      if (response.success && response.data) {
        recognitionResult.value = response.data
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
          `辨識失敗，是否重試？（剩餘 ${MAX_RETRY_COUNT - retryCount.value} 次機會）`,
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
        ElMessage.error("已達最大重試次數，請檢查圖片是否清晰或手動輸入資料")
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

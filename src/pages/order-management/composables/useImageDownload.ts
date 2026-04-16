/**
 * 圖片下載組合式函式
 *
 * @module order-management/composables/useImageDownload
 * @description 使用 html2canvas 將 DOM 元素擷取為 PNG 圖片並觸發下載
 */

import { ElMessage } from "element-plus"
import html2canvas from "html2canvas"
import { ref } from "vue"

export function useImageDownload() {
  /** 下載中狀態 */
  const downloading = ref(false)

  /**
   * 將指定 DOM 元素擷取為 PNG 圖片並下載
   * @param element - 要擷取的 DOM 元素
   * @param filename - 下載的檔案名稱（不含副檔名）
   */
  async function downloadAsImage(element: HTMLElement, filename: string): Promise<void> {
    if (downloading.value) return
    downloading.value = true

    try {
      const canvas = await html2canvas(element, {
        scale: 2,
        backgroundColor: "#ffffff",
        useCORS: true,
        logging: false
      })

      const blob = await new Promise<Blob | null>(resolve =>
        canvas.toBlob(resolve, "image/png")
      )

      if (!blob) {
        ElMessage.error("圖片產生失敗")
        return
      }

      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = `${filename}.png`
      link.click()
      URL.revokeObjectURL(url)
    } catch {
      ElMessage.error("下載圖片失敗")
    } finally {
      downloading.value = false
    }
  }

  return {
    downloading,
    downloadAsImage
  }
}

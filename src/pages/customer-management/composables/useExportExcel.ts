import type { Customer } from "../types"
import type { ExportData, WorkerMessage } from "../workers/export-excel.worker"
import { ElLoading, ElMessage } from "element-plus"
/**
 * Excel 匯出 Composable
 *
 * 功能:
 * - 使用 Web Worker 背景處理 Excel 匯出
 * - 整合 Notify 元件推送完成通知
 * - 支援進度顯示
 * - 支援下載檔案
 */
import { ref } from "vue"
import { useNotifyStore } from "@/common/components/Notify/store"

export function useExportExcel() {
  const notifyStore = useNotifyStore()

  /** 匯出中狀態 */
  const exporting = ref(false)

  /** 目前進度 */
  const progress = ref(0)

  /**
   * 匯出 Excel
   * @param customers 客戶列表
   */
  async function exportToExcel(customers: Customer[]) {
    if (customers.length === 0) {
      ElMessage.warning("沒有資料可匯出")
      return
    }

    exporting.value = true
    progress.value = 0

    // 顯示載入提示
    const loading = ElLoading.service({
      lock: true,
      text: "準備匯出資料...",
      background: "rgba(0, 0, 0, 0.7)"
    })

    try {
      // 準備匯出資料
      const exportData: ExportData[] = customers.map(customer => ({
        name: customer.name,
        idNumber: customer.idNumber,
        phone: customer.phoneNumber,
        email: customer.email || "",
        address: customer.residentialAddress,
        createdAt: customer.createdAt
      }))

      // 建立 Worker
      const worker = new Worker(
        new URL("../workers/export-excel.worker.ts", import.meta.url),
        { type: "module" }
      )

      // 處理 Worker 訊息
      worker.addEventListener("message", (event: MessageEvent<WorkerMessage>) => {
        const message = event.data

        switch (message.type) {
          case "start":
            loading.setText("開始處理資料...")
            break

          case "progress":
            if (message.progress !== undefined) {
              progress.value = message.progress
              loading.setText(`處理中... ${message.progress}%`)
            }
            break

          case "success":
            handleExportSuccess(message.data as ArrayBuffer)
            worker.terminate()
            loading.close()
            break

          case "error":
            ElMessage.error(`匯出失敗: ${message.error}`)
            worker.terminate()
            loading.close()
            exporting.value = false
            break
        }
      })

      // 錯誤處理
      worker.addEventListener("error", (error) => {
        console.error("Worker error:", error)
        ElMessage.error("匯出失敗,請稍後再試")
        worker.terminate()
        loading.close()
        exporting.value = false
      })

      // 發送資料到 Worker
      worker.postMessage(exportData)
    } catch (error) {
      console.error("Export error:", error)
      ElMessage.error("匯出失敗")
      loading.close()
      exporting.value = false
    }
  }

  /**
   * 處理匯出成功
   * @param buffer Excel 檔案 ArrayBuffer
   */
  function handleExportSuccess(buffer: ArrayBuffer) {
    try {
      // 建立 Blob
      const blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      })

      // 建立下載連結
      const url = URL.createObjectURL(blob)
      const filename = `客戶列表_${new Date().toISOString().slice(0, 10)}.xlsx`

      // 自動下載
      const link = document.createElement("a")
      link.href = url
      link.download = filename
      link.click()

      // 清理資源
      URL.revokeObjectURL(url)

      // 推送通知
      notifyStore.addNotification({
        title: "Excel 匯出完成",
        description: `檔案「${filename}」已成功匯出`,
        status: "success",
        extra: `檔案大小: ${(blob.size / 1024).toFixed(2)} KB`
      })

      ElMessage.success("匯出成功")
      exporting.value = false
      progress.value = 0
    } catch (error) {
      console.error("Download error:", error)
      ElMessage.error("下載失敗")
      exporting.value = false
    }
  }

  return {
    exporting,
    progress,
    exportToExcel
  }
}

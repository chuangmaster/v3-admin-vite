/**
 * Excel 匯出 Web Worker
 *
 * 功能:
 * - 在背景執行緒處理 Excel 匯出
 * - 避免阻塞主執行緒
 * - 支援進度回報
 */
import * as XLSX from "xlsx"

export interface WorkerMessage {
  type: "start" | "progress" | "success" | "error"
  data?: any
  progress?: number
  error?: string
}

export interface ExportData {
  name: string
  idNumber: string
  phone: string
  email: string
  address: string
  createdAt: string
}

/**
 * 處理 Excel 匯出
 */
globalThis.addEventListener("message", (event: MessageEvent<ExportData[]>) => {
  const data = event.data

  try {
    // 發送開始訊息
    postMessage({
      type: "start",
      progress: 0
    } as WorkerMessage)

    // 準備工作表資料
    const worksheetData = data.map((item, index) => {
      // 模擬處理進度
      if (index % 100 === 0) {
        const progress = Math.round((index / data.length) * 80)
        postMessage({
          type: "progress",
          progress
        } as WorkerMessage)
      }

      return {
        姓名: item.name,
        身分證字號: item.idNumber,
        電話: item.phone,
        電子郵件: item.email,
        地址: item.address,
        建立時間: new Date(item.createdAt).toLocaleString("zh-TW")
      }
    })

    // 建立工作表
    postMessage({
      type: "progress",
      progress: 85
    } as WorkerMessage)

    const worksheet = XLSX.utils.json_to_sheet(worksheetData)

    // 設定欄位寬度
    const columnWidths = [
      { wch: 15 }, // 姓名
      { wch: 15 }, // 身分證字號
      { wch: 15 }, // 電話
      { wch: 30 }, // 電子郵件
      { wch: 40 }, // 地址
      { wch: 20 } // 建立時間
    ]
    worksheet["!cols"] = columnWidths

    postMessage({
      type: "progress",
      progress: 90
    } as WorkerMessage)

    // 建立工作簿
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, "客戶列表")

    postMessage({
      type: "progress",
      progress: 95
    } as WorkerMessage)

    // 產生 Excel 檔案
    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array"
    })

    // 發送成功訊息
    postMessage({
      type: "success",
      data: excelBuffer,
      progress: 100
    } as WorkerMessage)
  } catch (error) {
    // 發送錯誤訊息
    postMessage({
      type: "error",
      error: error instanceof Error ? error.message : "未知錯誤"
    } as WorkerMessage)
  }
})

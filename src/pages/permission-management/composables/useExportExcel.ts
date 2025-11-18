/**
 * Excel 匯出組合式函式
 * 處理權限資料的 Excel 匯出功能
 * @module @/pages/permission-management/composables/useExportExcel
 */

import type { Permission } from "../types"
import { ElMessage } from "element-plus"
import { ref } from "vue"

/**
 * Excel 匯出組合式函式
 * @returns Excel 匯出操作方法
 */
export function useExportExcel() {
  /** 匯出狀態 */
  const exporting = ref(false)

  /**
   * 將權限資料匯出為 Excel
   * @param permissions - 待匯出的權限列表
   */
  function exportPermissions(permissions: Permission[]): void {
    if (permissions.length === 0) {
      ElMessage.warning("沒有資料可匯出")
      return
    }

    exporting.value = true
    try {
      // 準備匯出資料
      const data = permissions.map(permission => ({
        ID: permission.id,
        權限名稱: permission.name,
        權限代碼: permission.code,
        描述: permission.description || "-",
        系統權限: permission.isSystem ? "是" : "否",
        版本: permission.version,
        建立時間: formatDate(permission.createdAt),
        更新時間: formatDate(permission.updatedAt),
        建立者: permission.createdBy || "-",
        更新者: permission.updatedBy || "-"
      }))

      // 建立 CSV 內容
      const csv = convertToCSV(data)

      // 下載檔案
      downloadFile(csv, "permissions.csv")

      ElMessage.success("匯出成功")
    } catch {
      ElMessage.error("匯出失敗")
    } finally {
      exporting.value = false
    }
  }

  /**
   * 將資料轉換為 CSV 格式
   */
  function convertToCSV(data: any[]): string {
    if (data.length === 0) return ""

    // 取得表頭
    const headers = Object.keys(data[0])
    const headerRow = headers.map(h => `"${h}"`).join(",")

    // 取得資料行
    const dataRows = data.map((row) => {
      return headers.map((header) => {
        const value = row[header]
        // 轉義引號並使用雙引號包裝
        return `"${String(value).replace(/"/g, "\"\"")}"`
      }).join(",")
    })

    return [headerRow, ...dataRows].join("\n")
  }

  /**
   * 下載檔案
   */
  function downloadFile(content: string, filename: string): void {
    // 使用 BOM 以確保 UTF-8 編碼在 Excel 中正確顯示
    const bom = "\uFEFF"
    const blob = new Blob([bom + content], { type: "text/csv;charset=utf-8" })
    const url = URL.createObjectURL(blob)

    const link = document.createElement("a")
    link.href = url
    link.download = filename
    link.click()

    // 清理
    URL.revokeObjectURL(url)
  }

  /**
   * 格式化日期
   */
  function formatDate(dateString: string): string {
    try {
      const date = new Date(dateString)
      return date.toLocaleString("zh-TW", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit"
      })
    } catch {
      return dateString
    }
  }

  return {
    exporting,
    exportPermissions
  }
}

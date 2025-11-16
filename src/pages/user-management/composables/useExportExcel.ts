/**
 * Excel 匯出組合式函式
 * @module @/pages/user-management/composables/useExportExcel
 */

import type { User, UserExportData } from "../types"
import dayjs from "dayjs"
import * as XLSX from "xlsx"

/**
 * 用於 Excel 匯出的組合式函式
 * @returns 提供 exportUsers 方法的物件
 */
export function useExportExcel() {
  /**
   * 匯出用戶資料為 Excel 檔案
   * @param users - 用戶列表
   * @example
   * ```typescript
   * const { exportUsers } = useExportExcel()
   * exportUsers(users.value)
   * ```
   */
  function exportUsers(users: User[]): void {
    // 轉換資料格式
    const exportData: UserExportData[] = users.map(user => ({
      用戶名: user.username,
      顯示名稱: user.displayName,
      狀態: user.status === "active" ? "啟用" : "已停用",
      建立時間: dayjs(user.createdAt).format("YYYY-MM-DD HH:mm:ss"),
      最後更新時間: user.updatedAt ? dayjs(user.updatedAt).format("YYYY-MM-DD HH:mm:ss") : "-"
    }))

    // 建立工作表
    const worksheet = XLSX.utils.json_to_sheet(exportData)

    // 設定欄位寬度
    const columnWidths = [
      { wch: 20 }, // 用戶名
      { wch: 20 }, // 顯示名稱
      { wch: 10 }, // 狀態
      { wch: 20 }, // 建立時間
      { wch: 20 } // 最後更新時間
    ]
    worksheet["!cols"] = columnWidths

    // 建立工作簿
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, "用戶列表")

    // 生成檔名（包含時間戳）
    const filename = `用戶列表_${dayjs().format("YYYYMMDD_HHmmss")}.xlsx`

    // 下載檔案
    XLSX.writeFile(workbook, filename)
  }

  return {
    exportUsers
  }
}

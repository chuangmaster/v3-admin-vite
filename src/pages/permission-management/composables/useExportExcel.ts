/**
 * Excel 匯出組合式函式
 * 處理權限資料的 Excel 匯出功能
 * @module @/pages/permission-management/composables/useExportExcel
 */

import type { Permission } from "../types"
import { ElMessage } from "element-plus"
import { ref } from "vue"
import * as XLSX from "xlsx"

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
        權限代碼: permission.permissionCode,
        描述: permission.description || "-",
        系統權限: permission.isSystem ? "是" : "否",
        版本: permission.version,
        建立時間: formatDate(permission.createdAt),
        更新時間: formatDate(permission.updatedAt),
        建立者: (permission as any).createdBy || "-",
        更新者: (permission as any).updatedBy || "-"
      }))

      // 使用 xlsx 將資料轉成 worksheet
      const ws = XLSX.utils.json_to_sheet(data)
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, "Permissions")

      // 產生 binary array
      const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" })

      // 下載檔案
      const blob = new Blob([wbout], { type: "application/octet-stream" })
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = "permissions.xlsx"
      link.click()
      URL.revokeObjectURL(url)

      ElMessage.success("匯出成功")
    } catch (err) {
      console.error(err)
      ElMessage.error("匯出失敗")
    } finally {
      exporting.value = false
    }
  }

  /**
   * 將資料轉換為 CSV 格式
   */
  // CSV 轉換與下載相關函式已移除，改為使用 xlsx 套件產生 .xlsx

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

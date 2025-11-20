/**
 * Excel 匯出邏輯組合式函式
 * @module @/pages/role-management/composables/useExportExcel
 */

import type { RoleDto } from "../types"

import { ElMessageBox } from "element-plus"
import * as XLSX from "xlsx"

/**
 * Excel 匯出邏輯
 */
export function useExportExcel() {
  /**
   * 匯出角色列表為 Excel
   * @param roles 角色陣列
   * @param filename 檔案名稱（不包含副檔名）
   */
  function exportRoles(roles: RoleDto[], filename = "角色列表") {
    if (!roles.length) {
      ElMessageBox.alert("沒有可匯出的資料", "提示")
      return
    }

    // 顯示確認對話框
    ElMessageBox.confirm(
      `即將匯出 ${roles.length} 筆角色資料。繼續嗎？`,
      "匯出確認",
      { confirmButtonText: "確定", cancelButtonText: "取消", type: "info" }
    )
      .then(() => {
        // 轉換資料格式
        const exportData = roles.map(role => ({
          角色名稱: role.roleName,
          角色描述: role.description || "",
          建立時間: new Date(role.createdAt).toLocaleString("zh-TW"),
          版本號: role.version
        }))

        // 建立工作表
        const worksheet = XLSX.utils.json_to_sheet(exportData)

        // 設定欄寬
        worksheet["!cols"] = [
          { wch: 15 }, // 角色名稱
          { wch: 30 }, // 角色描述
          { wch: 20 }, // 建立時間
          { wch: 10 } // 版本號
        ]

        // 建立工作簿
        const workbook = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(workbook, worksheet, "角色列表")

        // 匯出檔案
        XLSX.writeFile(workbook, `${filename}_${Date.now()}.xlsx`)
      })
      .catch(() => {
        // 用戶取消
      })
  }

  return {
    exportRoles
  }
}

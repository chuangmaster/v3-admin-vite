/**
 * 訂單匯出 Composable
 *
 * @module order-management/composables/useOrderExport
 * @description 提供 Excel 匯出功能,包含狀態格式化、日期格式化、
 *              欄寬設定、檔案下載
 */

import type { OrderExportParams, OrderStatus, PaymentStatus, SalesOrderExportDto, ShippingStatus } from "@/pages/order-management/types"
import { ElMessage } from "element-plus"
import { ref } from "vue"
import { orderApi } from "@/pages/order-management/apis/order"
import {
  ORDER_STATUS_LABELS,
  PAYMENT_STATUS_LABELS,
  SHIPPING_STATUS_LABELS
} from "@/pages/order-management/types"

export function useOrderExport() {
  /** 匯出中狀態 */
  const exporting = ref(false)

  /**
   * 格式化付款狀態為中文
   */
  function formatPaymentStatus(status: string): string {
    return PAYMENT_STATUS_LABELS[status as PaymentStatus] || status
  }

  /**
   * 格式化訂單狀態為中文
   */
  function formatOrderStatus(status: string): string {
    return ORDER_STATUS_LABELS[status as OrderStatus] || status
  }

  /**
   * 格式化出貨狀態為中文
   */
  function formatShippingStatus(status: string): string {
    return SHIPPING_STATUS_LABELS[status as ShippingStatus] || status
  }

  /**
   * 格式化日期為 zh-TW 格式
   */
  function formatDate(dateStr: string): string {
    if (!dateStr) return ""
    const date = new Date(dateStr)
    return date.toLocaleDateString("zh-TW", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit"
    })
  }

  /**
   * 匯出訂單報表為 Excel
   * @param params - 匯出參數（沿用當前篩選條件）
   */
  async function exportOrders(params?: OrderExportParams) {
    exporting.value = true
    try {
      const response = await orderApi.getExportData(params || {})

      if (!response.success || !response.data) {
        ElMessage.error(response.message || "取得匯出資料失敗")
        return
      }

      const exportData = response.data as SalesOrderExportDto[]

      if (exportData.length === 0) {
        ElMessage.warning("無符合條件的訂單資料可匯出")
        return
      }

      if (exportData.length > 1000) {
        ElMessage.warning(`資料量較大（${exportData.length} 筆）,建議縮小篩選範圍後分批匯出`)
      }

      // 動態載入 xlsx
      const XLSX = await import("xlsx")

      // 轉換資料格式
      const formattedData = exportData.map(item => ({
        訂單編號: item.orderNumber,
        客戶名稱: item.customerName,
        商品名稱: item.productName,
        售出金額: item.totalAmount,
        付款狀態: formatPaymentStatus(item.paymentStatus),
        訂單狀態: formatOrderStatus(item.orderStatus),
        出貨狀態: formatShippingStatus(item.shippingStatus),
        建立日期: formatDate(item.createdAt),
        操作者: item.createdByName
      }))

      // 建立工作表
      const worksheet = XLSX.utils.json_to_sheet(formattedData)

      // 設定欄寬
      worksheet["!cols"] = [
        { wch: 20 }, // 訂單編號
        { wch: 15 }, // 客戶名稱
        { wch: 30 }, // 商品名稱
        { wch: 12 }, // 售出金額
        { wch: 10 }, // 付款狀態
        { wch: 10 }, // 訂單狀態
        { wch: 10 }, // 出貨狀態
        { wch: 12 }, // 建立日期
        { wch: 10 } // 操作者
      ]

      // 建立活頁簿
      const workbook = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(workbook, worksheet, "訂單報表")

      // 生成檔案名稱（含時間戳）
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19)
      const fileName = `訂單報表_${timestamp}.xlsx`

      // 觸發下載
      XLSX.writeFile(workbook, fileName)

      ElMessage.success(`已匯出 ${exportData.length} 筆訂單資料`)
    } catch (error) {
      console.error("exportOrders error:", error)
      ElMessage.error("匯出失敗,請稍後再試")
    } finally {
      exporting.value = false
    }
  }

  return {
    exporting,
    exportOrders,
    formatPaymentStatus,
    formatOrderStatus,
    formatShippingStatus,
    formatDate
  }
}

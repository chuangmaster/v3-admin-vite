/**
 * 服務單匯出 Composable
 *
 * @module service-order-management/composables/useServiceOrderExport
 * @description 提供 Excel 匯出功能：拉取全量資料 → 展開商品項目 → xlsx 匯出
 */

import type { ServiceOrderListItem, ServiceOrderListParams } from "../types"
import { ElMessage } from "element-plus"
import { ref } from "vue"
import { getServiceOrderList } from "../apis/service-order"
import { ACCESSORY_OPTIONS, DEFECT_OPTIONS, ServiceOrderSource, ServiceOrderStatus, ServiceOrderType } from "../types"

export function useServiceOrderExport() {
  /** 匯出中狀態 */
  const exporting = ref(false)

  /** 格式化訂單類型 */
  function formatOrderType(type: string): string {
    const map: Record<string, string> = {
      [ServiceOrderType.BUYBACK]: "收購單",
      [ServiceOrderType.CONSIGNMENT]: "寄賣單"
    }
    return map[type] || type
  }

  /** 格式化訂單來源 */
  function formatOrderSource(source: string): string {
    const map: Record<string, string> = {
      [ServiceOrderSource.ONLINE]: "線上",
      [ServiceOrderSource.OFFLINE]: "線下"
    }
    return map[source] || source || ""
  }

  /** 格式化狀態 */
  function formatStatus(status: string): string {
    const normalized = status?.toString().toUpperCase().trim()
    const map: Record<string, string> = {
      [ServiceOrderStatus.PENDING]: "待確認",
      [ServiceOrderStatus.CONFIRMED]: "已確認",
      [ServiceOrderStatus.IN_PROGRESS]: "處理中",
      [ServiceOrderStatus.COMPLETED]: "已完成",
      [ServiceOrderStatus.TERMINATED]: "已取消"
    }
    return map[normalized] || status
  }

  /** 格式化配件 */
  function formatAccessories(accessories?: string[]): string {
    if (!accessories || accessories.length === 0) return "無"
    const accessoryMap = Object.fromEntries(ACCESSORY_OPTIONS.map(opt => [opt.value, opt.label]))
    return accessories.map(acc => accessoryMap[acc] || acc).join("、")
  }

  /** 格式化瑕疵 */
  function formatDefects(defects?: string[]): string {
    if (!defects || defects.length === 0) return "無"
    const defectMap = Object.fromEntries(DEFECT_OPTIONS.map(opt => [opt.value, opt.label]))
    return defects.map(d => defectMap[d] || d).join("、")
  }

  /** 格式化日期 */
  function formatDate(dateStr?: string): string {
    if (!dateStr) return ""
    const date = new Date(dateStr)
    return date.toLocaleDateString("zh-TW", { year: "numeric", month: "2-digit", day: "2-digit" })
  }

  /**
   * 匯出服務單報表為 Excel
   * @param currentParams - 沿用當前篩選條件
   */
  async function exportServiceOrders(currentParams: ServiceOrderListParams) {
    exporting.value = true
    try {
      // 使用列表 API 取得全量資料
      const exportParams: ServiceOrderListParams = {
        ...currentParams,
        pageNumber: 1,
        pageSize: 10000
      }

      const response = await getServiceOrderList(exportParams)
      if (!response.success || !response.data) {
        ElMessage.error(response.message || "取得匯出資料失敗")
        return
      }

      const orders: ServiceOrderListItem[] = response.data
      if (orders.length === 0) {
        ElMessage.warning("無符合條件的服務單資料可匯出")
        return
      }

      if (orders.length > 1000) {
        ElMessage.warning(`資料量較大（${orders.length} 筆），建議縮小篩選範圍後分批匯出`)
      }

      // 動態載入 xlsx
      const XLSX = await import("xlsx")

      // 展開商品項目：一個項目一列
      const formattedData: Array<Record<string, string | number>> = []

      orders.forEach((order) => {
        const baseRow = {
          服務單編號: order.orderNumber || "",
          訂單類型: formatOrderType(order.orderType),
          訂單來源: formatOrderSource(order.orderSource),
          客戶姓名: order.customerName || "",
          客戶電話: order.customerPhone || "",
          總金額: order.totalAmount ?? 0,
          狀態: formatStatus(order.status),
          服務日期: formatDate(order.serviceDate),
          建立日期: formatDate(order.createdAt),
          建立者: order.createdByName || ""
        }

        if (order.productItems && order.productItems.length > 0) {
          order.productItems.forEach((item) => {
            formattedData.push({
              ...baseRow,
              品牌: item.brandName || "",
              款式: item.style || "",
              等級: item.grade || "",
              商品金額: item.amount ?? 0,
              配件: formatAccessories(item.accessories),
              瑕疵: formatDefects(item.defects)
            })
          })
        } else {
          formattedData.push({
            ...baseRow,
            品牌: "",
            款式: "",
            等級: "",
            商品金額: "",
            配件: "",
            瑕疵: ""
          })
        }
      })

      // 建立工作表
      const worksheet = XLSX.utils.json_to_sheet(formattedData)

      // 設定欄寬
      worksheet["!cols"] = [
        { wch: 18 }, // 服務單編號
        { wch: 10 }, // 訂單類型
        { wch: 8 }, // 訂單來源
        { wch: 12 }, // 客戶姓名
        { wch: 14 }, // 客戶電話
        { wch: 14 }, // 總金額
        { wch: 10 }, // 狀態
        { wch: 12 }, // 服務日期
        { wch: 12 }, // 建立日期
        { wch: 12 }, // 建立者
        { wch: 15 }, // 品牌
        { wch: 18 }, // 款式
        { wch: 6 }, // 等級
        { wch: 14 }, // 商品金額
        { wch: 30 }, // 配件
        { wch: 25 } // 瑕疵
      ]

      // 設定列高（表頭）
      worksheet["!rows"] = [{ hpt: 25 }]

      // 建立活頁簿
      const workbook = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(workbook, worksheet, "服務單報表")

      // 生成檔名（含時間戳）
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19)
      const fileName = `服務單報表_${timestamp}.xlsx`

      // 觸發下載
      XLSX.writeFile(workbook, fileName)

      ElMessage.success(`已匯出 ${orders.length} 筆服務單，共 ${formattedData.length} 列資料`)
    } catch (error) {
      console.error("exportServiceOrders error:", error)
      ElMessage.error("匯出失敗，請稍後再試")
    } finally {
      exporting.value = false
    }
  }

  return {
    exporting,
    exportServiceOrders,
    formatOrderType,
    formatOrderSource,
    formatStatus,
    formatAccessories,
    formatDefects,
    formatDate
  }
}

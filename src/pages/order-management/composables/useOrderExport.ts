/**
 * 訂單匯出 Composable
 *
 * @module order-management/composables/useOrderExport
 * @description 提供 Excel 匯出功能,包含狀態格式化、日期格式化、
 *              欄寬設定、檔案下載
 */

import type { DeliveryMethod, OrderExportParams, OrderStatus, OrderType, PaymentStatus, ProductSource, SalesOrderListItem, SalesOrderListParams, ShippingStatus } from "@/pages/order-management/types"
import { toUTC0ISOString } from "@@/utils/datetime"
import { ElMessage } from "element-plus"
import { ref } from "vue"
import { orderApi } from "@/pages/order-management/apis/order"
import {
  DELIVERY_METHOD_LABELS,
  ORDER_STATUS_LABELS,
  ORDER_TYPE_LABELS,
  PAYMENT_STATUS_LABELS,
  PRODUCT_SOURCE_LABELS,
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
   * 格式化訂單類型為中文
   */
  function formatOrderType(type: string): string {
    return ORDER_TYPE_LABELS[type as OrderType] || type
  }

  /**
   * 格式化收件方式為中文
   */
  function formatDeliveryMethod(method: string): string {
    return DELIVERY_METHOD_LABELS[method as DeliveryMethod] || method
  }

  /**
   * 格式化商品來源為中文
   */
  function formatProductSource(source: string): string {
    return PRODUCT_SOURCE_LABELS[source as ProductSource] || source
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
   * 格式化配件陣列為文字
   */
  function formatAccessories(accessories: string[] | null): string {
    if (!accessories || accessories.length === 0) return "無"

    const accessoryMap: Record<string, string> = {
      box: "盒子",
      dustBag: "防塵袋",
      purchaseProof: "購證",
      shoppingBag: "提袋",
      shoulderStrap: "肩帶",
      felt: "羊毛氈",
      pillow: "枕頭",
      card: "保卡",
      lockKey: "鎖頭/鑰匙",
      ribbon: "緞帶/花",
      brandCard: "品牌小卡",
      raincoat: "雨衣"
    }

    return accessories.map(acc => accessoryMap[acc] || acc).join("、")
  }

  /**
   * 格式化金額為千分位
   */
  function formatCurrency(amount: number): string {
    return `${amount.toLocaleString("zh-TW", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
  }

  /**
   * 匯出訂單報表為 Excel
   * @param params - 匯出參數（沿用當前篩選條件）
   */
  async function exportOrders(params?: OrderExportParams) {
    exporting.value = true
    try {
      // 使用列表 API 取得完整訂單資料（包含 orderItems）
      const listParams: SalesOrderListParams = {
        pageNumber: 1,
        pageSize: 10000, // 一次取得所有資料
        orderNumber: params?.orderNumber,
        customerName: params?.customerName,
        productName: params?.productName,
        orderStatus: params?.orderStatus,
        paymentStatus: params?.paymentStatus,
        shippingStatus: params?.shippingStatus,
        orderDateStart: params?.orderDateStart ? toUTC0ISOString(params.orderDateStart, false) : undefined,
        orderDateEnd: params?.orderDateEnd ? toUTC0ISOString(params.orderDateEnd, true) : undefined
      }

      const response = await orderApi.getList(listParams)

      if (!response.success || !response.data) {
        ElMessage.error(response.message || "取得匯出資料失敗")
        return
      }

      const orders: SalesOrderListItem[] = response.data

      if (orders.length === 0) {
        ElMessage.warning("無符合條件的訂單資料可匯出")
        return
      }

      if (orders.length > 1000) {
        ElMessage.warning(`資料量較大（${orders.length} 筆訂單）,建議縮小篩選範圍後分批匯出`)
      }

      // 動態載入 xlsx
      const XLSX = await import("xlsx")

      // 將訂單資料展開：一個訂單項目一列
      const formattedData: Array<Record<string, string | number>> = []

      orders.forEach((order) => {
        if (order.orderItems && order.orderItems.length > 0) {
          // 有商品項目，每個項目一列
          order.orderItems.forEach((item) => {
            formattedData.push({
              訂單編號: order.orderNumber,
              客戶名稱: order.customerName,
              商品名稱: item.productName || "",
              品牌: item.brandName || "",
              磐石ID: item.panshiCode || "",
              SerialId: item.serialId || "",
              款式: item.productStyle || "",
              配件: formatAccessories(item.accessories),
              商品來源: formatProductSource(item.productSource),
              單價: item.unitPrice,
              數量: item.quantity,
              訂單類型: formatOrderType(order.orderType),
              收件方式: formatDeliveryMethod(order.deliveryMethod),
              訂單金額: order.totalAmount,
              付款狀態: formatPaymentStatus(order.paymentStatus),
              訂單狀態: formatOrderStatus(order.orderStatus),
              出貨狀態: formatShippingStatus(order.shippingStatus),
              建立日期: formatDate(order.createdAt),
              承辦人員: order.createdByName,
              訂單來源: order.orderSource || ""
            })
          })
        } else {
          // 無商品項目，保留訂單資訊
          formattedData.push({
            訂單編號: order.orderNumber,
            客戶名稱: order.customerName,
            商品名稱: "",
            品牌: "",
            磐石ID: "",
            SerialId: "",
            款式: "",
            配件: "",
            商品來源: "",
            單價: "",
            數量: "",
            訂單類型: formatOrderType(order.orderType),
            收件方式: formatDeliveryMethod(order.deliveryMethod),
            訂單金額: order.totalAmount,
            付款狀態: formatPaymentStatus(order.paymentStatus),
            訂單狀態: formatOrderStatus(order.orderStatus),
            出貨狀態: formatShippingStatus(order.shippingStatus),
            建立日期: formatDate(order.createdAt),
            承辦人員: order.createdByName,
            訂單來源: order.orderSource || ""
          })
        }
      })

      // 建立工作表
      const worksheet = XLSX.utils.json_to_sheet(formattedData)

      // 設定欄寬
      worksheet["!cols"] = [
        { wch: 18 }, // 訂單編號
        { wch: 12 }, // 客戶名稱
        { wch: 25 }, // 商品名稱
        { wch: 15 }, // 品牌
        { wch: 12 }, // 磐石ID
        { wch: 15 }, // SerialId
        { wch: 15 }, // 款式
        { wch: 30 }, // 配件
        { wch: 12 }, // 商品來源
        { wch: 15 }, // 單價
        { wch: 8 }, // 數量
        { wch: 12 }, // 訂單類型
        { wch: 12 }, // 收件方式
        { wch: 15 }, // 訂單金額
        { wch: 12 }, // 付款狀態
        { wch: 12 }, // 訂單狀態
        { wch: 12 }, // 出貨狀態
        { wch: 12 }, // 建立日期
        { wch: 12 }, // 承辦人員
        { wch: 15 } // 訂單來源
      ]

      // 設定表頭樣式（第一列）
      const headerStyle = {
        font: { bold: true, color: { rgb: "FFFFFF" } },
        fill: { fgColor: { rgb: "4472C4" } },
        alignment: { horizontal: "center", vertical: "center" }
      }

      // 取得表頭範圍（A1 到 T1，共20欄）
      const headerCells = [
        "A1",
        "B1",
        "C1",
        "D1",
        "E1",
        "F1",
        "G1",
        "H1",
        "I1",
        "J1",
        "K1",
        "L1",
        "M1",
        "N1",
        "O1",
        "P1",
        "Q1",
        "R1",
        "S1",
        "T1"
      ]
      headerCells.forEach((cell) => {
        if (worksheet[cell]) {
          worksheet[cell].s = headerStyle
        }
      })

      // 設定列高（第一列表頭）
      worksheet["!rows"] = [{ hpt: 25 }]

      // 建立活頁簿
      const workbook = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(workbook, worksheet, "訂單報表")

      // 生成檔案名稱（含時間戳）
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19)
      const fileName = `訂單報表_${timestamp}.xlsx`

      // 觸發下載
      XLSX.writeFile(workbook, fileName)

      ElMessage.success(`已匯出 ${orders.length} 筆訂單，共 ${formattedData.length} 個商品項目`)
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
    formatOrderType,
    formatDeliveryMethod,
    formatProductSource,
    formatAccessories,
    formatCurrency,
    formatDate
  }
}

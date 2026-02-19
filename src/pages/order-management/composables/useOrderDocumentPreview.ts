/**
 * 訂購單預覽組合式函式
 *
 * @module order-management/composables/useOrderDocumentPreview
 * @description 處理訂單資料轉換與訂購單預覽邏輯
 */

import type { OrderDocumentData, SalesOrder } from "../types"
import { ref } from "vue"
import { OrderType } from "../types"

export function useOrderDocumentPreview() {
  /** 對話框顯示狀態 */
  const dialogVisible = ref(false)

  /** 訂購單資料 */
  const orderDocumentData = ref<OrderDocumentData | null>(null)

  /**
   * 將 SalesOrder 轉換為 OrderDocumentData
   */
  function transformToOrderDocument(order: SalesOrder): OrderDocumentData {
    const paidAmount = order.paymentRecords.reduce(
      (sum, record) => sum + record.paymentAmount,
      0
    )

    return {
      orderNumber: order.orderNumber,
      orderDate: order.orderDate,
      orderType: order.orderType,
      customerName: order.customerName,
      customerPhone: order.customerPhone,
      customerLineId: null,
      orderItems: order.orderItems.map(item => ({
        id: item.id,
        brandName: item.brandName,
        productName: item.productName,
        productStyle: item.productStyle,
        accessories: order.orderType === OrderType.SPOT_PURCHASE ? item.accessories : null,
        quantity: item.quantity,
        unitPrice: item.unitPrice
      })),
      paymentRecords: order.paymentRecords.map(record => ({
        id: record.id,
        paymentDate: record.paymentDate,
        paymentAmount: record.paymentAmount,
        paymentMethod: record.paymentMethod,
        bankAccountLastFive: record.bankAccountLastFive
      })),
      totalAmount: order.totalAmount,
      paidAmount
    }
  }

  /**
   * 開啟訂購單預覽
   */
  function openPreview(order: SalesOrder): void {
    orderDocumentData.value = transformToOrderDocument(order)
    dialogVisible.value = true
  }

  /**
   * 關閉訂購單預覽
   */
  function closePreview(): void {
    dialogVisible.value = false
  }

  /**
   * 列印訂購單
   */
  function printDocument(): void {
    window.print()
  }

  return {
    dialogVisible,
    orderDocumentData,
    openPreview,
    closePreview,
    printDocument
  }
}

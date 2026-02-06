/**
 * 訂單詳情 Composable
 *
 * @module order-management/composables/useOrderDetail
 * @description 提供取得訂單詳情、刪除訂單、並發衝突處理等功能
 */

import type { SalesOrder } from "@/pages/order-management/types"
import { ElMessage, ElMessageBox } from "element-plus"
import { ref } from "vue"
import { orderApi } from "@/pages/order-management/apis/order"

export function useOrderDetail() {
  /** 訂單詳情 */
  const orderDetail = ref<SalesOrder | null>(null)

  /** 載入中狀態 */
  const loading = ref(false)

  /** 刪除中狀態 */
  const deleting = ref(false)

  /**
   * 取得訂單詳情
   * @param orderId - 訂單 ID
   * @returns 訂單資料或 null
   */
  async function fetchOrderDetail(orderId: string): Promise<SalesOrder | null> {
    loading.value = true
    try {
      const response = await orderApi.getDetail(orderId)

      if (response.success && response.data) {
        orderDetail.value = response.data
        return response.data
      }

      ElMessage.error(response.message || "取得訂單詳情失敗")
      return null
    } catch (error) {
      console.error("fetchOrderDetail error:", error)
      ElMessage.error("取得訂單詳情失敗")
      return null
    } finally {
      loading.value = false
    }
  }

  /**
   * 刪除訂單
   * @param orderId - 訂單 ID
   * @param orderNumber - 訂單編號（用於提示）
   * @param onSuccess - 成功回呼
   * @returns 是否成功
   */
  async function handleDelete(
    orderId: string,
    orderNumber: string,
    onSuccess?: () => void
  ): Promise<boolean> {
    try {
      await ElMessageBox.confirm(
        `確定要刪除訂單「${orderNumber}」嗎？此操作無法復原`,
        "刪除訂單",
        {
          confirmButtonText: "確定刪除",
          cancelButtonText: "取消",
          type: "warning"
        }
      )
    } catch {
      return false
    }

    deleting.value = true
    try {
      const response = await orderApi.delete(orderId)

      if (response.success) {
        ElMessage.success(`訂單「${orderNumber}」已刪除`)
        orderDetail.value = null
        onSuccess?.()
        return true
      }

      handleDeleteError(response)
      return false
    } catch (error) {
      console.error("handleDelete error:", error)
      return false
    } finally {
      deleting.value = false
    }
  }

  /**
   * 處理刪除錯誤
   */
  function handleDeleteError(response: any) {
    const code = response?.code || response?.apiCode

    switch (code) {
      case "ORDER_ALREADY_COMPLETED":
        ElMessage.error("已完成的訂單無法刪除")
        break
      default:
        if (response?.message) {
          ElMessage.error(response.message)
        } else {
          ElMessage.error("刪除訂單失敗")
        }
    }
  }

  /**
   * 重置狀態
   */
  function resetOrderDetail() {
    orderDetail.value = null
  }

  return {
    orderDetail,
    loading,
    deleting,
    fetchOrderDetail,
    handleDelete,
    resetOrderDetail
  }
}

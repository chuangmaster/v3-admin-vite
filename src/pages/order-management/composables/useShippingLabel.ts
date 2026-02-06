/**
 * 出貨單 Composable
 *
 * @module order-management/composables/useShippingLabel
 * @description 提供出貨單資料取得、瀏覽器列印功能觸發
 */

import type { ShippingLabelResponse } from "@/pages/order-management/types"
import { ElMessage } from "element-plus"
import { ref } from "vue"
import { orderApi } from "@/pages/order-management/apis/order"

export function useShippingLabel() {
  /** 出貨單資料 */
  const shippingLabel = ref<ShippingLabelResponse | null>(null)

  /** 載入中狀態 */
  const loading = ref(false)

  /** 預覽對話框可見狀態 */
  const previewVisible = ref(false)

  /**
   * 取得出貨單資料並開啟預覽
   * @param orderId - 訂單 ID
   */
  async function openPreview(orderId: string) {
    loading.value = true
    try {
      const response = await orderApi.getShippingLabel(orderId)

      if (response.success && response.data) {
        shippingLabel.value = response.data
        previewVisible.value = true
      } else {
        ElMessage.error(response.message || "取得出貨單資料失敗")
      }
    } catch (error) {
      console.error("openPreview error:", error)
      ElMessage.error("取得出貨單資料失敗")
    } finally {
      loading.value = false
    }
  }

  /**
   * 觸發瀏覽器列印
   */
  function handlePrint() {
    window.print()
  }

  /**
   * 關閉預覽
   */
  function closePreview() {
    previewVisible.value = false
    shippingLabel.value = null
  }

  return {
    shippingLabel,
    loading,
    previewVisible,
    openPreview,
    handlePrint,
    closePreview
  }
}

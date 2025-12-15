/**
 * 服務訂單詳情業務邏輯
 */
import type { ServiceOrder } from "../types"
import { getServiceOrder } from "../apis/service-order"

export function useServiceOrderDetail(id: string) {
  const loading = ref(false)
  const serviceOrder = ref<ServiceOrder>()

  /**
   * 載入服務訂單詳情
   */
  async function loadServiceOrder() {
    loading.value = true
    try {
      const response = await getServiceOrder(id)

      if (response.success && response.data) {
        serviceOrder.value = response.data
      } else {
        ElMessage.error(response.message || "載入服務訂單詳情失敗")
      }
    } catch {
      ElMessage.error("載入服務訂單詳情失敗，請稍後再試")
    } finally {
      loading.value = false
    }
  }

  // 初始化時載入資料
  onMounted(() => {
    loadServiceOrder()
  })

  return {
    loading,
    serviceOrder,
    loadServiceOrder
  }
}

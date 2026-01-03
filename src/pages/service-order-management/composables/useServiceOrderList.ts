/**
 * 服務訂單列表業務邏輯
 */
import type { ServiceOrderListItem } from "../types"
import { useServiceOrderStore } from "@/pinia/stores/service-order"
import { getServiceOrderList } from "../apis/service-order"

export function useServiceOrderList() {
  const store = useServiceOrderStore()
  const router = useRouter()

  const loading = ref(false)
  const serviceOrders = ref<ServiceOrderListItem[]>([])
  const total = ref(0)

  /**
   * 載入服務訂單列表
   */
  async function loadServiceOrders() {
    loading.value = true
    try {
      const response = await getServiceOrderList(store.queryParams)

      if (response.success && response.data) {
        // PagedApiResponse 將陣列資料直接放在 data 中，分頁資訊在最外層
        serviceOrders.value = response.data
        total.value = response.totalCount
      } else {
        ElMessage.error(response.message || "載入服務訂單列表失敗")
      }
    } catch {
      ElMessage.error("載入服務訂單列表失敗，請稍後再試")
    } finally {
      loading.value = false
    }
  }

  /**
   * 分頁變更
   */
  function handlePageChange(page: number) {
    store.queryParams.pageNumber = page
    loadServiceOrders()
  }

  /**
   * 每頁數量變更
   */
  function handleSizeChange(size: number) {
    store.queryParams.pageNumber = 1
    store.queryParams.pageSize = size
    loadServiceOrders()
  }

  /**
   * 查看詳情
   */
  function viewDetail(id: string) {
    router.push({
      name: "ServiceOrderDetail",
      params: { id }
    })
  }

  /**
   * 建立新訂單
   */
  function createOrder() {
    router.push({ name: "ServiceOrderCreate" })
  }

  /**
   * 重新整理
   */
  function refresh() {
    loadServiceOrders()
  }

  /**
   * 重置查詢條件
   */
  function resetQuery() {
    store.resetQueryParams()
    loadServiceOrders()
  }

  // 初始化時載入資料
  onMounted(() => {
    loadServiceOrders()
  })

  return {
    loading,
    serviceOrders,
    total,
    queryParams: computed(() => store.queryParams),
    loadServiceOrders,
    handlePageChange,
    handleSizeChange,
    viewDetail,
    createOrder,
    refresh,
    resetQuery
  }
}

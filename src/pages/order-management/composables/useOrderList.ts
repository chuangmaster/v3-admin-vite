/**
 * 訂單列表 Composable
 *
 * @module order-management/composables/useOrderList
 * @description 提供訂單列表狀態管理、分頁、搜尋篩選、查詢 API 呼叫
 */

import type { SalesOrderListItem, SalesOrderListParams, SearchFilters } from "@/pages/order-management/types"
import { ElMessage } from "element-plus"
import { onMounted, ref } from "vue"
import { orderApi } from "@/pages/order-management/apis/order"

/** 預設每頁筆數 */
const DEFAULT_PAGE_SIZE = 20

export function useOrderList() {
  /** 訂單列表 */
  const orders = ref<SalesOrderListItem[]>([])

  /** 載入中狀態 */
  const loading = ref(false)

  /** 總筆數 */
  const total = ref(0)

  /** 查詢參數 */
  const searchParams = ref<SalesOrderListParams>({
    pageNumber: 1,
    pageSize: DEFAULT_PAGE_SIZE
  })

  /** 搜尋篩選條件 */
  const filters = ref<SearchFilters>({
    orderNumber: "",
    customerName: "",
    productName: "",
    orderStatus: "",
    paymentStatus: "",
    shippingStatus: "",
    orderSource: "",
    dateRange: null
  })

  /**
   * 查詢訂單列表
   */
  async function fetchOrders() {
    loading.value = true
    try {
      // 組合搜尋參數
      const params: SalesOrderListParams = {
        pageNumber: searchParams.value.pageNumber,
        pageSize: searchParams.value.pageSize
      }

      if (filters.value.orderNumber) {
        params.orderNumber = filters.value.orderNumber
      }
      if (filters.value.customerName) {
        params.customerName = filters.value.customerName
      }
      if (filters.value.productName) {
        params.productName = filters.value.productName
      }
      if (filters.value.orderStatus) {
        params.orderStatus = filters.value.orderStatus as any
      }
      if (filters.value.paymentStatus) {
        params.paymentStatus = filters.value.paymentStatus as any
      }
      if (filters.value.shippingStatus) {
        params.shippingStatus = filters.value.shippingStatus as any
      }
      if (filters.value.orderSource) {
        params.orderSource = filters.value.orderSource
      }
      if (filters.value.dateRange && filters.value.dateRange[0]) {
        params.orderDateStart = filters.value.dateRange[0]
        params.orderDateEnd = filters.value.dateRange[1]
      }

      const response = await orderApi.getList(params)

      if (response.success && response.data) {
        orders.value = response.data
        total.value = response.totalCount || 0
      } else {
        ElMessage.error(response.message || "取得訂單列表失敗")
      }
    } catch (error) {
      console.error("fetchOrders error:", error)
      ElMessage.error("取得訂單列表失敗")
    } finally {
      loading.value = false
    }
  }

  /**
   * 處理搜尋
   */
  function handleSearch() {
    searchParams.value.pageNumber = 1
    fetchOrders()
  }

  /**
   * 處理重置
   */
  function handleReset() {
    filters.value = {
      orderNumber: "",
      customerName: "",
      productName: "",
      orderStatus: "",
      paymentStatus: "",
      shippingStatus: "",
      orderSource: "",
      dateRange: null
    }
    searchParams.value = {
      pageNumber: 1,
      pageSize: DEFAULT_PAGE_SIZE
    }
    fetchOrders()
  }

  /**
   * 處理頁碼變更
   * @param page - 新頁碼
   */
  function handlePageChange(page: number) {
    searchParams.value.pageNumber = page
    fetchOrders()
  }

  /**
   * 處理每頁筆數變更
   * @param pageSize - 新每頁筆數
   */
  function handlePageSizeChange(pageSize: number) {
    searchParams.value.pageSize = pageSize
    searchParams.value.pageNumber = 1
    fetchOrders()
  }

  /**
   * 重新整理列表
   */
  function refresh() {
    fetchOrders()
  }

  onMounted(() => {
    fetchOrders()
  })

  return {
    orders,
    loading,
    total,
    searchParams,
    filters,
    fetchOrders,
    handleSearch,
    handleReset,
    handlePageChange,
    handlePageSizeChange,
    refresh
  }
}

/**
 * 服務單管理模組狀態管理
 * @module @/pinia/stores/service-order
 */

import type {
  ServiceOrderListParams,
  ServiceOrderStatus,
  ServiceOrderType
} from "@/pages/service-order-management/types"
import { pinia } from "@/pinia"

export const useServiceOrderStore = defineStore("service-order", () => {
  /** 查詢條件 */
  const queryParams = ref<ServiceOrderListParams>({
    pageNumber: 1,
    pageSize: 20,
    orderType: "BUYBACK" as any,
    customerName: undefined,
    startDate: undefined,
    endDate: undefined,
    status: "PENDING" as any
  })

  /** 當前服務單類型篩選（用於 UI 顯示） */
  const currentOrderType = ref<ServiceOrderType | undefined>(undefined)

  /** 當前服務單狀態篩選（用於 UI 顯示） */
  const currentStatus = ref<ServiceOrderStatus | undefined>(undefined)

  /** 總筆數 */
  const totalRecords = ref<number>(0)

  /** 總頁數 */
  const totalPages = ref<number>(0)

  /**
   * 設定查詢參數
   * @param params - 部分查詢參數
   */
  const setQueryParams = (params: Partial<ServiceOrderListParams>) => {
    queryParams.value = { ...queryParams.value, ...params }
  }

  /**
   * 重置查詢參數
   */
  const resetQueryParams = () => {
    queryParams.value = {
      pageNumber: 1,
      pageSize: 20,
      orderType: "BUYBACK" as any,
      customerName: undefined,
      startDate: undefined,
      endDate: undefined,
      status: "pending" as any
    }
    currentOrderType.value = undefined
    currentStatus.value = undefined
  }

  /**
   * 設定分頁資訊
   * @param total - 總筆數
   * @param pages - 總頁數
   */
  const setPagination = (total: number, pages: number) => {
    totalRecords.value = total
    totalPages.value = pages
  }

  /**
   * 切換頁碼
   * @param page - 目標頁碼
   */
  const changePage = (page: number) => {
    queryParams.value.pageNumber = page
  }

  /**
   * 切換每頁筆數
   * @param size - 每頁筆數
   */
  const changePageSize = (size: number) => {
    queryParams.value.pageSize = size
    queryParams.value.pageNumber = 1 // 重置到第一頁
  }

  /**
   * 設定服務單類型篩選
   * @param type - 服務單類型
   */
  const setOrderType = (type: ServiceOrderType | undefined) => {
    currentOrderType.value = type
    queryParams.value.orderType = type
    queryParams.value.pageNumber = 1 // 重置到第一頁
  }

  /**
   * 設定服務單狀態篩選
   * @param status - 服務單狀態
   */
  const setStatus = (status: ServiceOrderStatus | undefined) => {
    currentStatus.value = status
    queryParams.value.status = status
    queryParams.value.pageNumber = 1 // 重置到第一頁
  }

  /**
   * 設定客戶名稱搜尋
   * @param name - 客戶名稱
   */
  const setCustomerName = (name: string | undefined) => {
    queryParams.value.customerName = name
    queryParams.value.pageNumber = 1 // 重置到第一頁
  }

  /**
   * 設定日期範圍篩選
   * @param startDate - 起始日期（ISO 8601）
   * @param endDate - 結束日期（ISO 8601）
   */
  const setDateRange = (startDate: string | undefined, endDate: string | undefined) => {
    queryParams.value.startDate = startDate
    queryParams.value.endDate = endDate
    queryParams.value.pageNumber = 1 // 重置到第一頁
  }

  return {
    // State
    queryParams,
    currentOrderType,
    currentStatus,
    totalRecords,
    totalPages,
    // Actions
    setQueryParams,
    resetQueryParams,
    setPagination,
    changePage,
    changePageSize,
    setOrderType,
    setStatus,
    setCustomerName,
    setDateRange
  }
})

/**
 * @description 在 SPA 應用中可用於在 pinia 實例被激活前使用 store
 * @description 在 SSR 應用中可用於在 setup 外使用 store
 */
export function useServiceOrderStoreOutside() {
  return useServiceOrderStore(pinia)
}

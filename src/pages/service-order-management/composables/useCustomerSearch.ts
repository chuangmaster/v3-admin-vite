/**
 * 客戶搜尋組合式函式
 * @module @/pages/service-order-management/composables/useCustomerSearch
 */

import type { Customer, CustomerSearchParams } from "../types"
import { debounce } from "lodash-es"
import { searchCustomers } from "../apis/customer"

/**
 * 客戶搜尋組合式函式
 * @returns 搜尋狀態、方法
 */
export function useCustomerSearch() {
  /** 搜尋關鍵字 */
  const keyword = ref("")

  /** 搜尋結果列表 */
  const customers = ref<Customer[]>([])

  /** 載入狀態 */
  const loading = ref(false)

  /**
   * 執行搜尋
   */
  const executeSearch = async () => {
    if (!keyword.value || keyword.value.trim().length < 2) {
      customers.value = []
      return
    }

    loading.value = true
    try {
      const params: CustomerSearchParams = {
        keyword: keyword.value.trim()
      }
      const response = await searchCustomers(params)
      if (response.success) {
        customers.value = response.data || []
      } else {
        customers.value = []
        ElMessage.error(response.message || "搜尋客戶失敗")
      }
    } catch {
      customers.value = []
      ElMessage.error("搜尋客戶失敗，請稍後再試")
    } finally {
      loading.value = false
    }
  }

  /**
   * 防抖搜尋（500ms）
   */
  const debouncedSearch = debounce(executeSearch, 500)

  /**
   * 監聽關鍵字變化
   */
  watch(keyword, () => {
    if (keyword.value.trim().length >= 2) {
      debouncedSearch()
    } else {
      customers.value = []
    }
  })

  /**
   * 清除搜尋結果
   */
  const clearResults = () => {
    keyword.value = ""
    customers.value = []
  }

  return {
    keyword,
    customers,
    loading,
    clearResults
  }
}

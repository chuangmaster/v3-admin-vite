/**
 * 客戶關鍵字搜尋組合式函式
 *
 * @module common/composables/useCustomerKeywordSearch
 * @description 提供客戶搜尋功能,支援姓名、電話、Email、身分證字號等關鍵字搜尋,
 *              自動監聽關鍵字變化並防抖搜尋（500ms）
 */

import type { Customer } from "@/pages/customer-management/types"
import { ElMessage } from "element-plus"
import { debounce } from "lodash-es"
import { ref, watch } from "vue"
import { customerApi } from "@/pages/customer-management/apis/customer"

export function useCustomerKeywordSearch() {
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
      const response = await customerApi.search({
        pageNumber: 1,
        pageSize: 20,
        keyword: keyword.value.trim()
      })

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

  /** 防抖搜尋（500ms） */
  const debouncedSearch = debounce(executeSearch, 500)

  /** 監聽關鍵字變化自動搜尋 */
  watch(keyword, () => {
    if (keyword.value.trim().length >= 2) {
      debouncedSearch()
    } else {
      customers.value = []
    }
  })

  /** 清除搜尋結果 */
  function clearResults() {
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

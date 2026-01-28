import type { Customer, CustomerListParams } from "../types"
import { ElMessage } from "element-plus"
/**
 * 客戶管理 Composable
 *
 * 功能:
 * - 客戶列表查詢
 * - 分頁處理
 * - 搜尋防抖
 * - 載入狀態管理
 */
import { onMounted, ref } from "vue"
import { customerApi } from "../apis/customer"

/** 預設分頁參數 */
const DEFAULT_PAGE_SIZE = 10

export function useCustomerManagement() {
  /** 客戶列表資料 */
  const customers = ref<Customer[]>([])

  /** 載入中狀態 */
  const loading = ref(false)

  /** 總筆數 */
  const total = ref(0)

  /** 搜尋參數 */
  const searchParams = ref<CustomerListParams>({
    pageNumber: 1,
    pageSize: DEFAULT_PAGE_SIZE,
    keyword: ""
  })

  /**
   * 取得客戶列表
   */
  async function fetchCustomers() {
    loading.value = true
    try {
      const response = await customerApi.search(searchParams.value)

      if (response.success && response.data) {
        customers.value = response.data
        total.value = response.totalCount || 0
      } else {
        ElMessage.error(response.message || "取得客戶列表失敗")
      }
    } catch (error) {
      console.error("fetchCustomers error:", error)
      ElMessage.error("取得客戶列表失敗")
    } finally {
      loading.value = false
    }
  }

  /**
   * 處理搜尋
   * @param params 搜尋參數
   */
  function handleSearch(params: CustomerListParams) {
    searchParams.value = { ...params, pageNumber: 1 }
    fetchCustomers()
  }

  /**
   * 處理重設
   */
  function handleReset() {
    searchParams.value = {
      pageNumber: 1,
      pageSize: DEFAULT_PAGE_SIZE,
      keyword: ""
    }
    fetchCustomers()
  }

  /**
   * 處理頁碼變更
   * @param page 頁碼
   */
  function handlePageChange(page: number) {
    searchParams.value.pageNumber = page
    fetchCustomers()
  }

  /**
   * 處理每頁筆數變更
   * @param pageSize 每頁筆數
   */
  function handlePageSizeChange(pageSize: number) {
    searchParams.value.pageSize = pageSize
    searchParams.value.pageNumber = 1
    fetchCustomers()
  }

  /**
   * 重新整理列表
   */
  function refresh() {
    fetchCustomers()
  }

  // 元件掛載時取得資料
  onMounted(() => {
    fetchCustomers()
  })

  return {
    customers,
    loading,
    total,
    searchParams,
    fetchCustomers,
    handleSearch,
    handleReset,
    handlePageChange,
    handlePageSizeChange,
    refresh
  }
}

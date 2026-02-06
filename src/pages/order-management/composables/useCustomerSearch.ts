/**
 * 客戶搜尋 Composable
 *
 * @module order-management/composables/useCustomerSearch
 * @description 提供客戶搜尋與快速新增客戶功能,整合客戶管理模組 API
 */

import type { CreateCustomerRequest, Customer } from "@/pages/customer-management/types"
import { useDebounceFn } from "@vueuse/core"
import { ElMessage } from "element-plus"
import { ref } from "vue"
import { customerApi } from "@/pages/customer-management/apis/customer"

export function useCustomerSearch() {
  /** 搜尋關鍵字 */
  const keyword = ref("")

  /** 客戶選項列表 */
  const customerOptions = ref<Customer[]>([])

  /** 搜尋中狀態 */
  const searching = ref(false)

  /** 已選擇的客戶 ID */
  const selectedCustomerId = ref("")

  /** 已選擇的客戶資料 */
  const selectedCustomer = ref<Customer | null>(null)

  /**
   * 搜尋客戶（防抖 500ms）
   * @param query - 搜尋關鍵字
   */
  const searchCustomers = useDebounceFn(async (query: string) => {
    if (!query || query.length < 2) {
      customerOptions.value = []
      return
    }

    searching.value = true
    try {
      const response = await customerApi.search({
        pageNumber: 1,
        pageSize: 20,
        keyword: query
      })

      if (response.success && response.data) {
        customerOptions.value = response.data
      } else {
        customerOptions.value = []
      }
    } catch (error) {
      console.error("searchCustomers error:", error)
      customerOptions.value = []
    } finally {
      searching.value = false
    }
  }, 500)

  /**
   * 處理客戶選擇變更
   * @param customerId - 客戶 ID
   */
  function handleCustomerChange(customerId: string) {
    selectedCustomerId.value = customerId
    selectedCustomer.value = customerOptions.value.find(c => c.id === customerId) || null
  }

  /**
   * 快速新增客戶並自動選擇
   * @param data - 新增客戶資料
   * @returns 是否成功
   */
  async function quickAddCustomer(data: CreateCustomerRequest): Promise<boolean> {
    try {
      const response = await customerApi.create(data)

      if (response.success && response.data) {
        const newCustomer = response.data

        // 將新客戶加入選項列表頂部
        customerOptions.value.unshift(newCustomer)

        // 自動選擇新建客戶
        selectedCustomerId.value = newCustomer.id
        selectedCustomer.value = newCustomer

        ElMessage.success(`客戶「${newCustomer.name}」建立成功並已選擇`)
        return true
      } else {
        ElMessage.error(response.message || "建立客戶失敗")
        return false
      }
    } catch (error) {
      console.error("quickAddCustomer error:", error)
      return false
    }
  }

  /**
   * 根據客戶 ID 設定已選客戶（編輯模式用）
   * @param customer - 客戶資料
   */
  function setSelectedCustomer(customer: Pick<Customer, "id" | "name" | "phoneNumber">) {
    selectedCustomerId.value = customer.id
    selectedCustomer.value = customer as Customer
    customerOptions.value = [customer as Customer]
  }

  /**
   * 重置客戶選擇狀態
   */
  function resetCustomerSelection() {
    keyword.value = ""
    selectedCustomerId.value = ""
    selectedCustomer.value = null
    customerOptions.value = []
  }

  return {
    keyword,
    customerOptions,
    searching,
    selectedCustomerId,
    selectedCustomer,
    searchCustomers,
    handleCustomerChange,
    quickAddCustomer,
    setSelectedCustomer,
    resetCustomerSelection
  }
}

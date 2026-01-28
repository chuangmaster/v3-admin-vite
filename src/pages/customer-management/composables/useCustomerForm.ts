import type { CreateCustomerRequest, Customer, UpdateCustomerRequest } from "../types"
import { ElMessage } from "element-plus"
/**
 * 客戶表單 Composable
 *
 * 功能:
 * - 新增客戶
 * - 更新客戶
 * - 重複檢查
 * - 表單狀態管理
 */
import { ref } from "vue"
import { customerApi } from "../apis/customer"

export function useCustomerForm() {
  /** 對話框顯示狀態 */
  const dialogVisible = ref(false)

  /** 表單模式 */
  const formMode = ref<"create" | "edit">("create")

  /** 當前編輯的客戶 */
  const currentCustomer = ref<Customer>()

  /** 提交中狀態 */
  const submitting = ref(false)

  /**
   * 開啟新增對話框
   */
  function openCreateDialog() {
    formMode.value = "create"
    currentCustomer.value = undefined
    dialogVisible.value = true
  }

  /**
   * 開啟編輯對話框
   * @param customer 客戶資料
   */
  function openEditDialog(customer: Customer) {
    formMode.value = "edit"
    currentCustomer.value = customer
    dialogVisible.value = true
  }

  /**
   * 關閉對話框
   */
  function closeDialog() {
    dialogVisible.value = false
    currentCustomer.value = undefined
  }

  /**
   * 檢查重複客戶
   * @param idNumber 身分證字號
   * @returns 是否重複
   */
  async function checkDuplicate(idNumber: string): Promise<boolean> {
    try {
      const response = await customerApi.search({
        pageNumber: 1,
        pageSize: 1,
        keyword: idNumber
      })

      if (response.success && response.data) {
        // 檢查是否有完全符合的身分證字號
        const duplicate = response.data.some(
          (customer: Customer) => customer.idNumber === idNumber
        )
        return duplicate
      }
      return false
    } catch (error) {
      console.error("checkDuplicate error:", error)
      return false
    }
  }

  /**
   * 新增客戶
   * @param data 客戶資料
   * @param onSuccess 成功回呼
   */
  async function createCustomer(
    data: CreateCustomerRequest,
    onSuccess?: () => void
  ) {
    submitting.value = true

    try {
      // 檢查重複
      const isDuplicate = await checkDuplicate(data.idNumber)
      if (isDuplicate) {
        ElMessage.warning("此身分證字號已存在,無法新增重複客戶")
        submitting.value = false
        return
      }

      // 呼叫 API
      const response = await customerApi.create(data)

      if (response.success) {
        ElMessage.success("新增客戶成功")
        closeDialog()
        onSuccess?.()
      } else {
        ElMessage.error(response.message || "新增客戶失敗")
      }
    } catch (error) {
      console.error("createCustomer error:", error)
      ElMessage.error("新增客戶失敗")
    } finally {
      submitting.value = false
    }
  }

  /**
   * 更新客戶
   * @param id 客戶 ID
   * @param data 客戶資料
   * @param onSuccess 成功回呼
   */
  async function updateCustomer(
    id: string,
    data: UpdateCustomerRequest,
    onSuccess?: () => void
  ) {
    submitting.value = true

    try {
      const response = await customerApi.update(id, data)

      if (response.success) {
        ElMessage.success("更新客戶成功")
        closeDialog()
        onSuccess?.()
      } else {
        // 處理版本衝突
        if (response.code === "409") {
          ElMessage.error("資料已被其他人修改,請重新整理後再試")
        } else {
          ElMessage.error(response.message || "更新客戶失敗")
        }
      }
    } catch (error) {
      console.error("updateCustomer error:", error)
      ElMessage.error("更新客戶失敗")
    } finally {
      submitting.value = false
    }
  }

  /**
   * 處理表單提交
   * @param data 表單資料
   * @param onSuccess 成功回呼
   */
  function handleSubmit(
    data: CreateCustomerRequest | UpdateCustomerRequest,
    onSuccess?: () => void
  ) {
    if (formMode.value === "create") {
      createCustomer(data as CreateCustomerRequest, onSuccess)
    } else if (currentCustomer.value) {
      updateCustomer(currentCustomer.value.id, data as UpdateCustomerRequest, onSuccess)
    }
  }

  return {
    dialogVisible,
    formMode,
    currentCustomer,
    submitting,
    openCreateDialog,
    openEditDialog,
    closeDialog,
    handleSubmit,
    checkDuplicate
  }
}

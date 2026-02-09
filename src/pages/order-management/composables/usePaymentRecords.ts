/**
 * 付款記錄管理 Composable
 *
 * @module order-management/composables/usePaymentRecords
 * @description 提供付款記錄的新增、修改銀行末五碼、刪除、累積金額計算、
 *              剩餘應付金額計算、超額驗證
 */

import type {
  AddPaymentRecordRequest,
  PaymentRecord,
  PaymentRecordFormData,
  UpdatePaymentRecordRequest
} from "@/pages/order-management/types"
import { ElMessage, ElMessageBox } from "element-plus"
import { computed, ref } from "vue"
import { orderApi } from "@/pages/order-management/apis/order"
import { PaymentStatus } from "@/pages/order-management/types"

export function usePaymentRecords() {
  /** 付款記錄列表 */
  const paymentRecords = ref<PaymentRecord[]>([])

  /** 訂單總金額（用於計算剩餘應付） */
  const orderTotalAmount = ref(0)

  /** 當前付款狀態 */
  const paymentStatus = ref<PaymentStatus>(PaymentStatus.UNPAID)

  /** 操作中狀態 */
  const loading = ref(false)

  /** 新增付款記錄對話框 */
  const addDialogVisible = ref(false)

  /** 修改銀行末五碼對話框 */
  const editDialogVisible = ref(false)

  /** 當前編輯的付款記錄 */
  const editingRecord = ref<PaymentRecord | null>(null)

  /** 累積已付金額 */
  const paidAmount = computed(() => {
    return paymentRecords.value.reduce((sum, record) => sum + record.paymentAmount, 0)
  })

  /** 剩餘應付金額 */
  const remainingAmount = computed(() => {
    return Math.max(0, orderTotalAmount.value - paidAmount.value)
  })

  /** 是否已全額付款 */
  const isFullyPaid = computed(() => {
    return paymentStatus.value === PaymentStatus.PAID
  })

  /**
   * 初始化付款記錄資料
   * @param records - 付款記錄列表
   * @param totalAmount - 訂單總金額
   * @param status - 付款狀態
   */
  function initPaymentRecords(
    records: PaymentRecord[],
    totalAmount: number,
    status: PaymentStatus
  ) {
    paymentRecords.value = [...records]
    orderTotalAmount.value = totalAmount
    paymentStatus.value = status
  }

  /**
   * 新增付款記錄
   * @param orderId - 訂單 ID
   * @param data - 付款記錄表單資料
   * @param onSuccess - 成功回呼
   * @returns 是否成功
   */
  async function addPaymentRecord(
    orderId: string,
    data: PaymentRecordFormData,
    onSuccess?: () => void
  ): Promise<boolean> {
    // 前端驗證：金額不超過剩餘應付
    if (data.paymentAmount > remainingAmount.value) {
      ElMessage.warning(`付款金額不可超過剩餘應付金額 NT$ ${remainingAmount.value.toLocaleString()}`)
      return false
    }

    loading.value = true
    try {
      const request: AddPaymentRecordRequest = {
        paymentDate: typeof data.paymentDate === "string"
          ? data.paymentDate
          : data.paymentDate.toISOString(),
        paymentAmount: data.paymentAmount,
        paymentMethod: data.paymentMethod,
        bankAccountLastFive: data.bankAccountLastFive || undefined
      }

      const response = await orderApi.addPaymentRecord(orderId, request)

      if (response.success) {
        ElMessage.success("付款記錄新增成功")
        addDialogVisible.value = false
        onSuccess?.()
        return true
      }

      handlePaymentError(response)
      return false
    } catch (error: any) {
      console.error("addPaymentRecord error:", error)
      return false
    } finally {
      loading.value = false
    }
  }

  /**
   * 修改付款記錄銀行末五碼
   * @param orderId - 訂單 ID
   * @param recordId - 付款記錄 ID
   * @param bankAccountLastFive - 銀行末五碼
   * @param onSuccess - 成功回呼
   * @returns 是否成功
   */
  async function updatePaymentRecordBank(
    orderId: string,
    recordId: string,
    bankAccountLastFive: string,
    onSuccess?: () => void
  ): Promise<boolean> {
    loading.value = true
    try {
      const request: UpdatePaymentRecordRequest = {
        bankAccountLastFive: bankAccountLastFive || undefined
      }

      const response = await orderApi.updatePaymentRecord(orderId, recordId, request)

      if (response.success && response.data) {
        paymentRecords.value = response.data.paymentRecords
        ElMessage.success("銀行末五碼更新成功")
        editDialogVisible.value = false
        editingRecord.value = null
        onSuccess?.()
        return true
      }

      ElMessage.error(response.message || "更新失敗")
      return false
    } catch (error) {
      console.error("updatePaymentRecordBank error:", error)
      return false
    } finally {
      loading.value = false
    }
  }

  /**
   * 刪除付款記錄
   * @param orderId - 訂單 ID
   * @param recordId - 付款記錄 ID
   * @param onSuccess - 成功回呼
   * @returns 是否成功
   */
  async function deletePaymentRecord(
    orderId: string,
    recordId: string,
    onSuccess?: () => void
  ): Promise<boolean> {
    try {
      await ElMessageBox.confirm(
        "確定要刪除此付款記錄嗎？刪除後將重新計算付款狀態",
        "刪除付款記錄",
        {
          confirmButtonText: "確定",
          cancelButtonText: "取消",
          type: "warning"
        }
      )
    } catch {
      return false
    }

    loading.value = true
    try {
      const response = await orderApi.deletePaymentRecord(orderId, recordId)

      if (response.success && response.data) {
        paymentRecords.value = response.data.paymentRecords
        paymentStatus.value = response.data.paymentStatus
        ElMessage.success("付款記錄已刪除")
        onSuccess?.()
        return true
      }

      handlePaymentError(response)
      return false
    } catch (error) {
      console.error("deletePaymentRecord error:", error)
      return false
    } finally {
      loading.value = false
    }
  }

  /**
   * 開啟新增付款記錄對話框
   */
  function openAddDialog() {
    addDialogVisible.value = true
  }

  /**
   * 開啟修改銀行末五碼對話框
   * @param record - 付款記錄
   */
  function openEditDialog(record: PaymentRecord) {
    editingRecord.value = { ...record }
    editDialogVisible.value = true
  }

  /**
   * 處理付款相關業務錯誤
   */
  function handlePaymentError(response: any) {
    const code = response?.code || response?.apiCode

    switch (code) {
      case "PAYMENT_EXCEEDS_TOTAL":
        ElMessage.error("付款金額已超過訂單總金額")
        break
      case "PAYMENT_RECORD_NOT_FOUND":
        ElMessage.error("付款記錄不存在或已被刪除")
        break
      case "CANNOT_DELETE_PAID_RECORD":
        ElMessage.error("無法刪除已確認的付款記錄")
        break
      default:
        if (response?.message) {
          ElMessage.error(response.message)
        }
    }
  }

  /**
   * 重置狀態
   */
  function resetPaymentRecords() {
    paymentRecords.value = []
    orderTotalAmount.value = 0
    paymentStatus.value = PaymentStatus.UNPAID
    editingRecord.value = null
    addDialogVisible.value = false
    editDialogVisible.value = false
  }

  return {
    paymentRecords,
    orderTotalAmount,
    paymentStatus,
    loading,
    addDialogVisible,
    editDialogVisible,
    editingRecord,
    paidAmount,
    remainingAmount,
    isFullyPaid,
    initPaymentRecords,
    addPaymentRecord,
    updatePaymentRecordBank,
    deletePaymentRecord,
    openAddDialog,
    openEditDialog,
    resetPaymentRecords
  }
}

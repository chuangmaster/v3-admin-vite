/**
 * 訂單表單 Composable
 *
 * @module order-management/composables/useOrderForm
 * @description 提供訂單表單狀態管理、提交驗證、建立/修改訂單 API 呼叫、
 *              樂觀鎖定處理、單日上限警告處理
 */

import type {
  CreateOrderItemRequest,
  CreateSalesOrderPaymentRequest,
  CreateSalesOrderRequest,
  DeliveryInfo,
  OrderFormData,
  SalesOrder,
  UpdateSalesOrderRequest
} from "@/pages/order-management/types"
import { toUTC0ISOString } from "@@/utils/datetime"
import { ElMessage, ElMessageBox, ElNotification } from "element-plus"
import { ref } from "vue"
import { orderApi } from "@/pages/order-management/apis/order"
import { DeliveryMethod, OrderType } from "@/pages/order-management/types"

/** 對話框模式 */
export type DialogMode = "create" | "edit"

export function useOrderForm() {
  /** 對話框是否顯示 */
  const dialogVisible = ref(false)

  /** 對話框模式 */
  const dialogMode = ref<DialogMode>("create")

  /** 提交中狀態 */
  const submitting = ref(false)

  /** 當前編輯中的訂單（編輯模式用） */
  const currentOrder = ref<SalesOrder | null>(null)

  /** 表單預設值 */
  function getDefaultFormData(): OrderFormData {
    return {
      orderType: OrderType.SPOT_PURCHASE,
      customerId: "",
      orderItems: [],
      deliveryMethod: DeliveryMethod.PICKUP,
      deliveryInfo: { type: "PICKUP", pickupLocation: "", pickupTime: "" },
      shippingFee: 0,
      remarks: ""
    }
  }

  /** 表單資料 */
  const formData = ref<OrderFormData>(getDefaultFormData())

  /**
   * 開啟新增訂單對話框
   */
  function openCreateDialog() {
    dialogMode.value = "create"
    currentOrder.value = null
    formData.value = getDefaultFormData()
    dialogVisible.value = true
  }

  /**
   * 開啟編輯訂單對話框
   * @param order - 訂單詳情
   */
  function openEditDialog(order: SalesOrder) {
    dialogMode.value = "edit"
    currentOrder.value = order

    formData.value = {
      orderType: order.orderType,
      customerId: order.customerId,
      orderItems: order.orderItems.map(item => ({
        tempId: item.id,
        productName: item.productName,
        brandName: item.brandName,
        panshiCode: item.panshiCode,
        serialId: item.serialId,
        productStyle: item.productStyle,
        accessories: item.accessories || [],
        productSource: item.productSource,
        unitPrice: item.unitPrice,
        quantity: item.quantity
      })),
      deliveryMethod: order.deliveryMethod,
      deliveryInfo: { ...order.deliveryInfo },
      shippingFee: order.shippingFee,
      remarks: order.remarks || "",
      version: order.version
    }

    dialogVisible.value = true
  }

  /**
   * 關閉對話框
   */
  function closeDialog() {
    dialogVisible.value = false
    currentOrder.value = null
    formData.value = getDefaultFormData()
  }

  /**
   * 將表單資料轉換為建立訂單 API 請求
   */
  function toCreateRequest(data: OrderFormData): CreateSalesOrderRequest {
    let payment: CreateSalesOrderPaymentRequest | undefined
    if (data.payment) {
      payment = {
        paymentDate: toUTC0ISOString(data.payment.paymentDate as string),
        paymentAmount: data.payment.paymentAmount,
        paymentMethod: data.payment.paymentMethod,
        bankAccountLastFive: data.payment.bankAccountLastFive || undefined
      }
    }

    return {
      orderType: data.orderType,
      customerId: data.customerId,
      orderItems: data.orderItems.map<CreateOrderItemRequest>(item => ({
        productName: item.productName,
        brandName: item.brandName,
        panshiCode: item.panshiCode,
        serialId: item.serialId,
        productStyle: item.productStyle,
        accessories: item.accessories.length > 0 ? item.accessories : undefined,
        productSource: item.productSource,
        unitPrice: item.unitPrice,
        quantity: item.quantity
      })),
      deliveryMethod: data.deliveryMethod,
      deliveryInfo: data.deliveryInfo as DeliveryInfo,
      shippingFee: data.shippingFee,
      remarks: data.remarks || undefined,
      payment
    }
  }

  /**
   * 將表單資料轉換為修改訂單 API 請求
   */
  function toUpdateRequest(data: OrderFormData): UpdateSalesOrderRequest {
    return {
      orderItems: data.orderItems.map<CreateOrderItemRequest>(item => ({
        productName: item.productName,
        brandName: item.brandName,
        panshiCode: item.panshiCode,
        serialId: item.serialId,
        productStyle: item.productStyle,
        accessories: item.accessories.length > 0 ? item.accessories : undefined,
        productSource: item.productSource,
        unitPrice: item.unitPrice,
        quantity: item.quantity
      })),
      deliveryMethod: data.deliveryMethod,
      deliveryInfo: data.deliveryInfo as DeliveryInfo,
      shippingFee: data.shippingFee,
      remarks: data.remarks || undefined,
      version: data.version!
    }
  }

  /**
   * 處理提交（新增或修改）
   * @param data - 表單資料
   * @param onSuccess - 成功回呼
   * @returns 是否成功
   */
  async function handleSubmit(
    data: OrderFormData,
    onSuccess?: () => void
  ): Promise<boolean> {
    if (submitting.value) return false
    submitting.value = true

    try {
      if (dialogMode.value === "create") {
        return await createOrder(data, onSuccess)
      } else if (currentOrder.value) {
        return await updateOrder(currentOrder.value.id, data, onSuccess)
      }
      return false
    } finally {
      submitting.value = false
    }
  }

  /**
   * 建立訂單
   */
  async function createOrder(
    data: OrderFormData,
    onSuccess?: () => void
  ): Promise<boolean> {
    try {
      const request = toCreateRequest(data)
      const response = await orderApi.create(request)

      if (response.success && response.data) {
        ElMessage.success(`訂單「${response.data.orderNumber}」建立成功`)
        closeDialog()
        onSuccess?.()
        return true
      }

      // 處理特定業務錯誤碼
      handleBusinessError(response)
      return false
    } catch (error: any) {
      handleApiError(error)
      return false
    }
  }

  /**
   * 修改訂單
   */
  async function updateOrder(
    orderId: string,
    data: OrderFormData,
    onSuccess?: () => void
  ): Promise<boolean> {
    try {
      const request = toUpdateRequest(data)
      const response = await orderApi.update(orderId, request)

      if (response.success && response.data) {
        ElMessage.success("訂單修改成功")
        closeDialog()
        onSuccess?.()
        return true
      }

      // 處理特定業務錯誤碼
      handleBusinessError(response)
      return false
    } catch (error: any) {
      handleApiError(error)
      return false
    }
  }

  /**
   * 處理業務邏輯錯誤
   */
  function handleBusinessError(response: any) {
    const code = response?.code || response?.apiCode

    switch (code) {
      case "DAILY_ORDER_LIMIT_REACHED":
        ElMessage.error("已達今日訂單數量上限,無法再建立新訂單")
        break
      case "DAILY_ORDER_LIMIT_WARNING":
        ElNotification({
          title: "訂單數量提醒",
          message: response.message || "今日訂單數量接近上限,請注意",
          type: "warning",
          duration: 5000
        })
        break
      case "INVALID_CUSTOMER":
        ElMessage.error("客戶資料無效,請重新選擇客戶")
        break
      case "ORDER_ALREADY_COMPLETED":
        ElMessage.error("訂單已完成,無法修改")
        break
      case "ORDER_ALREADY_CANCELLED":
        ElMessage.error("訂單已取消,無法修改")
        break
      case "CONCURRENT_UPDATE_CONFLICT":
        handleConcurrentConflict()
        break
      default:
        if (response.message) {
          ElMessage.error(response.message)
        }
    }
  }

  /**
   * 處理 API 錯誤
   */
  function handleApiError(error: any) {
    const code = error?.response?.data?.code || error?.response?.data?.apiCode

    if (code === "CONCURRENT_UPDATE_CONFLICT") {
      handleConcurrentConflict()
      return
    }

    console.error("handleApiError:", error)
  }

  /**
   * 處理並發衝突錯誤
   */
  async function handleConcurrentConflict() {
    try {
      await ElMessageBox.confirm(
        "此訂單已被其他人修改,請重新載入最新資料後再操作",
        "資料衝突",
        {
          confirmButtonText: "重新載入",
          cancelButtonText: "取消",
          type: "warning"
        }
      )

      // 使用者確認重新載入
      if (currentOrder.value) {
        const response = await orderApi.getDetail(currentOrder.value.id)
        if (response.success && response.data) {
          openEditDialog(response.data)
        }
      }
    } catch {
      // 使用者取消,不做處理
    }
  }

  return {
    dialogVisible,
    dialogMode,
    submitting,
    currentOrder,
    formData,
    getDefaultFormData,
    openCreateDialog,
    openEditDialog,
    closeDialog,
    handleSubmit
  }
}

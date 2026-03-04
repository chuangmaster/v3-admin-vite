<script setup lang="ts">
/**
 * 訂單狀態操作元件
 *
 * @module order-management/components/OrderStatusActions
 * @description 提供訂單狀態、付款狀態、出貨狀態的下拉選單即時更新
 */
import type {
  PaymentStatus,
  SalesOrder,
  ShippingStatus,
  UpdatePaymentStatusRequest,
  UpdateShippingStatusRequest
} from "@/pages/order-management/types"
import { ElDescriptions, ElDescriptionsItem, ElMessage, ElMessageBox, ElOption, ElSelect, ElTag } from "element-plus"
import { ref } from "vue"
import { orderApi } from "@/pages/order-management/apis/order"
import {
  ORDER_STATUS_COLORS,
  ORDER_STATUS_LABELS,
  PAYMENT_STATUS_COLORS,
  PAYMENT_STATUS_LABELS,
  SHIPPING_STATUS_COLORS,
  SHIPPING_STATUS_LABELS
} from "@/pages/order-management/types"

defineOptions({ name: "OrderStatusActions" })

const props = defineProps<Props>()

const emit = defineEmits<Emits>()

interface Props {
  /** 訂單資料 */
  order: SalesOrder
}

interface Emits {
  (e: "update", order: SalesOrder): void
}

/** 更新中狀態 */
const updating = ref(false)

/**
 * 更新付款狀態
 * @param status - 新付款狀態
 */
async function handlePaymentStatusChange(status: PaymentStatus) {
  const currentLabel = PAYMENT_STATUS_LABELS[props.order.paymentStatus]
  const newLabel = PAYMENT_STATUS_LABELS[status]

  try {
    await ElMessageBox.confirm(
      `確定要將付款狀態從「${currentLabel}」變更為「${newLabel}」嗎？`,
      "變更付款狀態",
      { confirmButtonText: "確定", cancelButtonText: "取消", type: "warning" }
    )
  } catch {
    return
  }

  updating.value = true
  try {
    const request: UpdatePaymentStatusRequest = { paymentStatus: status }
    const response = await orderApi.updatePaymentStatus(props.order.id, request)

    if (response.success && response.data) {
      ElMessage.success(`付款狀態已更新為「${newLabel}」`)
      emit("update", response.data)
    } else {
      ElMessage.error(response.message || "更新付款狀態失敗")
    }
  } catch (error) {
    console.error("handlePaymentStatusChange error:", error)
  } finally {
    updating.value = false
  }
}

/**
 * 更新出貨狀態
 * @param status - 新出貨狀態
 */
async function handleShippingStatusChange(status: ShippingStatus) {
  const currentLabel = SHIPPING_STATUS_LABELS[props.order.shippingStatus]
  const newLabel = SHIPPING_STATUS_LABELS[status]

  try {
    await ElMessageBox.confirm(
      `確定要將出貨狀態從「${currentLabel}」變更為「${newLabel}」嗎？`,
      "變更出貨狀態",
      { confirmButtonText: "確定", cancelButtonText: "取消", type: "warning" }
    )
  } catch {
    return
  }

  updating.value = true
  try {
    const request: UpdateShippingStatusRequest = { shippingStatus: status }
    const response = await orderApi.updateShippingStatus(props.order.id, request)

    if (response.success && response.data) {
      ElMessage.success(`出貨狀態已更新為「${newLabel}」`)
      emit("update", response.data)
    } else {
      ElMessage.error(response.message || "更新出貨狀態失敗")
    }
  } catch (error) {
    console.error("handleShippingStatusChange error:", error)
  } finally {
    updating.value = false
  }
}
</script>

<template>
  <div class="order-status-actions">
    <ElDescriptions :column="3" border size="small">
      <ElDescriptionsItem label="訂單狀態">
        <ElTag
          :type="ORDER_STATUS_COLORS[props.order.orderStatus]"
          size="small"
        >
          {{ ORDER_STATUS_LABELS[props.order.orderStatus] }}
        </ElTag>
      </ElDescriptionsItem>

      <ElDescriptionsItem label="付款狀態">
        <ElSelect
          :model-value="props.order.paymentStatus"
          :disabled="updating"
          size="small"
          style="width: 130px"
          @change="handlePaymentStatusChange"
        >
          <ElOption
            v-for="(label, key) in PAYMENT_STATUS_LABELS"
            :key="key"
            :label="label"
            :value="key"
          />
        </ElSelect>
        <ElTag
          :type="PAYMENT_STATUS_COLORS[props.order.paymentStatus]"
          size="small"
          style="margin-left: 8px"
        >
          {{ PAYMENT_STATUS_LABELS[props.order.paymentStatus] }}
        </ElTag>
      </ElDescriptionsItem>

      <ElDescriptionsItem label="出貨狀態">
        <ElSelect
          :model-value="props.order.shippingStatus"
          :disabled="updating"
          size="small"
          style="width: 130px"
          @change="handleShippingStatusChange"
        >
          <ElOption
            v-for="(label, key) in SHIPPING_STATUS_LABELS"
            :key="key"
            :label="label"
            :value="key"
          />
        </ElSelect>
        <ElTag
          :type="SHIPPING_STATUS_COLORS[props.order.shippingStatus]"
          size="small"
          style="margin-left: 8px"
        >
          {{ SHIPPING_STATUS_LABELS[props.order.shippingStatus] }}
        </ElTag>
      </ElDescriptionsItem>
    </ElDescriptions>
  </div>
</template>

<style scoped lang="scss">
.order-status-actions {
  margin-bottom: 16px;
}
</style>

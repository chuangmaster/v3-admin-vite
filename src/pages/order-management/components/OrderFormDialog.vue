<script setup lang="ts">
import type { FormInstance } from "element-plus"
/**
 * 訂單表單對話框元件
 *
 * @module order-management/components/OrderFormDialog
 * @description 整合 CustomerSelector、OrderItemsForm、DeliveryInfoForm,
 *              支援新增/編輯模式,含訂單類型選擇、運費輸入、備註輸入、表單提交與重置
 */
import type { Customer } from "@/pages/customer-management/types"
import type { DialogMode } from "@/pages/order-management/composables/useOrderForm"
import type { DeliveryMethod, OrderFormData, OrderType, PaymentRecordFormData, SalesOrder } from "@/pages/order-management/types"
import { formatDateOnly } from "@@/utils/datetime"
import {
  ElButton,
  ElCheckbox,
  ElDatePicker,
  ElDialog,
  ElDivider,
  ElForm,
  ElFormItem,
  ElInput,
  ElInputNumber,
  ElMessage,
  ElOption,
  ElSelect
} from "element-plus"
import { computed, nextTick, ref, watch } from "vue"
import { customerApi } from "@/pages/customer-management/apis/customer"
import { orderApi } from "@/pages/order-management/apis/order"
import {
  ORDER_TYPE_LABELS,
  OrderStatus,
  PAYMENT_METHOD_LABELS,
  PaymentMethod,
  SHIPPING_FEE_CONFIG,
  ShippingStatus
} from "@/pages/order-management/types"
import CustomerSelector from "./CustomerSelector.vue"
import DeliveryInfoForm from "./DeliveryInfoForm.vue"
import OrderItemsForm from "./OrderItemsForm.vue"
import OrderStatusActions from "./OrderStatusActions.vue"
import PaymentRecordsPanel from "./PaymentRecordsPanel.vue"

defineOptions({ name: "OrderFormDialog" })

const props = withDefaults(defineProps<Props>(), {
  mode: "create",
  currentOrder: null,
  loading: false
})

const emit = defineEmits<Emits>()

interface Props {
  /** 對話框是否顯示 */
  visible: boolean
  /** 對話框模式 */
  mode?: DialogMode
  /** 表單資料 */
  formData: OrderFormData
  /** 當前訂單（編輯模式） */
  currentOrder?: SalesOrder | null
  /** 提交中狀態 */
  loading?: boolean
}

interface Emits {
  (e: "update:visible", value: boolean): void
  (e: "update:formData", value: OrderFormData): void
  (e: "submit", data: OrderFormData): void
  (e: "close"): void
  (e: "orderUpdate", order: SalesOrder): void
}

/** 表單實例參考 */
const formRef = ref<FormInstance>()

/** 客戶選擇器參考 */
const customerSelectorRef = ref<InstanceType<typeof CustomerSelector>>()

/** 對話框標題 */
const dialogTitle = computed(() => {
  return props.mode === "create" ? "新增訂單" : "編輯訂單"
})

/** 是否為已完成或已取消的訂單（限制編輯） */
const isTerminalState = computed(() => {
  if (!props.currentOrder) return false
  return [OrderStatus.COMPLETED, OrderStatus.CANCELLED].includes(props.currentOrder.orderStatus)
})

/** 核心欄位是否禁用（已完成/已取消的訂單禁用核心資訊） */
const coreFieldsDisabled = computed(() => {
  return isTerminalState.value
})

/** 是否已出貨（出貨後禁止修改收件資訊） */
const isShipped = computed(() => {
  if (!props.currentOrder) return false
  return props.currentOrder.shippingStatus === ShippingStatus.SHIPPED
})

/** 新增模式：是否勾選新增付款記錄 */
const enableInitialPayment = ref(false)

/** 付款方式選項 */
const paymentMethodOptions = Object.entries(PAYMENT_METHOD_LABELS).map(([value, label]) => ({
  value,
  label
}))

/** 是否顯示銀行末五碼欄位 */
const showBankField = computed(() => {
  return props.formData.payment?.paymentMethod === PaymentMethod.BANK_TRANSFER
})

/**
 * 切換初始付款記錄開關
 */
function handleTogglePayment(enabled: boolean | string | number) {
  if (enabled) {
    updateFormField("payment", {
      paymentDate: "",
      paymentAmount: 0,
      paymentMethod: PaymentMethod.FACE_TO_FACE_CASH,
      bankAccountLastFive: ""
    } as PaymentRecordFormData)
  } else {
    updateFormField("payment", null)
  }
}

/**
 * 更新付款記錄表單欄位
 */
function updatePaymentField<K extends keyof PaymentRecordFormData>(field: K, value: PaymentRecordFormData[K]) {
  if (!props.formData.payment) return
  updateFormField("payment", { ...props.formData.payment, [field]: value })
}

/** 商品小計 */
const subtotalAmount = computed(() => {
  return props.formData.orderItems.reduce((sum, item) => {
    return sum + (item.unitPrice || 0) * (item.quantity || 0)
  }, 0)
})

/** 總金額 */
const totalAmount = computed(() => {
  return subtotalAmount.value + (props.formData.shippingFee || 0)
})

/**
 * 處理訂單類型變更
 */
function handleOrderTypeChange(v: OrderType) {
  updateFormField("orderType", v)
}

/**
 * 處理收件方式變更並更新運費預設值
 */
function handleDeliveryMethodChange(method: DeliveryMethod) {
  emit("update:formData", {
    ...props.formData,
    deliveryMethod: method,
    shippingFee: SHIPPING_FEE_CONFIG[method] ?? 0
  })
}

/**
 * 更新表單欄位
 */
function updateFormField<K extends keyof OrderFormData>(field: K, value: OrderFormData[K]) {
  emit("update:formData", { ...props.formData, [field]: value })
}

/**
 * 處理客戶選擇
 */
function handleCustomerChange(customer: Customer | null) {
  if (customer) {
    updateFormField("customerId", customer.id)
    // 清除表單驗證錯誤
    nextTick(() => {
      formRef.value?.clearValidate("customerId")
    })
  }
}

/**
 * 處理收件資訊欄位驗證
 */
function handleValidateDeliveryFields() {
  nextTick(() => {
    formRef.value?.validateField([
      "deliveryInfo.recipientName",
      "deliveryInfo.recipientPhone",
      "deliveryInfo.recipientAddress",
      "deliveryInfo.storeInfo"
    ])
  })
}

/**
 * 處理表單提交
 */
async function handleSubmit() {
  if (!formRef.value) return

  // 手動驗證訂單項目數量
  if (props.formData.orderItems.length === 0) {
    ElMessage.warning("請新增至少一個商品項目")
    return
  }

  try {
    await formRef.value.validate()
  } catch {
    ElMessage.warning("請檢查表單填寫是否完整")
    return
  }

  emit("submit", props.formData)
}

/**
 * 處理訂單狀態更新（來自 OrderStatusActions）
 */
function handleOrderUpdate(updatedOrder: SalesOrder) {
  emit("orderUpdate", updatedOrder)
}

/**
 * 處理付款記錄更新（來自 PaymentRecordsPanel）
 * 重新取得訂單明細以刷新付款記錄
 */
async function handlePaymentUpdate() {
  if (!props.currentOrder) return
  try {
    const response = await orderApi.getDetail(props.currentOrder.id)
    if (response.success && response.data) {
      emit("orderUpdate", response.data)
    }
  } catch {
    console.error("重新取得訂單付款資料失敗")
  }
}

/**
 * 處理對話框關閉
 */
function handleClose() {
  emit("update:visible", false)
  emit("close")
  enableInitialPayment.value = false
  nextTick(() => {
    formRef.value?.resetFields()
  })
}

/**
 * 對話框開啟時的處理
 */
watch(() => props.visible, (newVal) => {
  if (newVal && props.mode === "edit" && props.currentOrder) {
    nextTick(async () => {
      formRef.value?.clearValidate()
      // 編輯模式：載入客戶資訊並設定到 CustomerSelector
      if (props.currentOrder?.customerId) {
        try {
          const response = await customerApi.getById(props.currentOrder.customerId)
          if (response.success && response.data) {
            customerSelectorRef.value?.setSelectedCustomer(response.data)
          }
        } catch {
          console.error("載入客戶資訊失敗")
        }
      }
    })
  }
})

defineExpose({
  formRef,
  resetFields: () => formRef.value?.resetFields(),
  validate: () => formRef.value?.validate()
})
</script>

<template>
  <ElDialog
    :model-value="props.visible"
    :title="dialogTitle"
    width="90%"
    class="order-form-dialog"
    :close-on-click-modal="false"
    destroy-on-close
    @close="handleClose"
  >
    <ElForm
      ref="formRef"
      :model="props.formData"
      label-width="100px"
      label-position="right"
    >
      <!-- 訂單類型 -->
      <ElFormItem
        label="訂單類型"
        prop="orderType"
        :rules="[{ required: true, message: '請選擇訂單類型', trigger: 'change' }]"
      >
        <ElSelect
          :model-value="props.formData.orderType"
          :disabled="props.mode === 'edit'"
          placeholder="請選擇訂單類型"
          @update:model-value="handleOrderTypeChange"
        >
          <ElOption
            v-for="(label, key) in ORDER_TYPE_LABELS"
            :key="key"
            :label="label"
            :value="key"
          />
        </ElSelect>
      </ElFormItem>

      <!-- 客戶選擇 -->
      <ElFormItem
        label="客戶"
        prop="customerId"
        :rules="[{ required: true, message: '請選擇客戶', trigger: 'change' }]"
      >
        <CustomerSelector
          ref="customerSelectorRef"
          :model-value="props.formData.customerId"
          :disabled="props.mode === 'edit' || coreFieldsDisabled"
          @update:model-value="(v: string) => updateFormField('customerId', v)"
          @customer-change="handleCustomerChange"
        />
      </ElFormItem>

      <!-- 商品項目（獨立區塊,不包在 ElFormItem 內避免溢出） -->
      <OrderItemsForm
        :model-value="props.formData.orderItems"
        :order-type="props.formData.orderType"
        :disabled="coreFieldsDisabled || props.mode === 'edit'"
        :readonly="props.mode === 'edit'"
        @update:model-value="(v) => updateFormField('orderItems', v)"
      />

      <!-- 收件資訊 -->
      <DeliveryInfoForm
        :delivery-method="props.formData.deliveryMethod"
        :delivery-info="props.formData.deliveryInfo"
        :disabled="coreFieldsDisabled || isShipped"
        :customer-info="customerSelectorRef?.selectedCustomer ? { name: customerSelectorRef.selectedCustomer.name, phone: customerSelectorRef.selectedCustomer.phoneNumber, address: customerSelectorRef.selectedCustomer.residentialAddress } : null"
        @update:delivery-method="handleDeliveryMethodChange"
        @update:delivery-info="(v) => updateFormField('deliveryInfo', v)"
        @validate-delivery-fields="handleValidateDeliveryFields"
      />

      <!-- 運費 -->
      <ElFormItem label="運費" prop="shippingFee">
        <ElInputNumber
          :model-value="props.formData.shippingFee"
          :disabled="coreFieldsDisabled || props.mode === 'edit'"
          :min="0"
          :precision="0"
          :controls="false"
          placeholder="請輸入運費"
          style="width: 200px"
          @update:model-value="(v: number | undefined) => updateFormField('shippingFee', v ?? 0)"
        />
      </ElFormItem>

      <!-- 金額彙總 -->
      <ElFormItem label="訂單金額">
        <div class="amount-summary">
          <span>商品小計：NT$ {{ subtotalAmount.toLocaleString() }}</span>
          <span>運費：NT$ {{ (props.formData.shippingFee || 0).toLocaleString() }}</span>
          <span class="total-amount">
            總金額：NT$ {{ totalAmount.toLocaleString() }}
          </span>
        </div>
      </ElFormItem>

      <!-- 訂單來源 -->
      <ElFormItem label="訂單來源" prop="orderSource">
        <ElInput
          :model-value="props.formData.orderSource"
          clearable
          placeholder="選填"
          maxlength="30"
          show-word-limit
          @update:model-value="(v: string) => updateFormField('orderSource', v)"
        />
      </ElFormItem>

      <!-- 備註 -->
      <ElFormItem label="備註" prop="remarks">
        <ElInput
          :model-value="props.formData.remarks"
          type="textarea"
          :rows="3"
          placeholder="選填,最多 1000 字元"
          maxlength="1000"
          show-word-limit
          @update:model-value="(v: string) => updateFormField('remarks', v)"
        />
      </ElFormItem>

      <!-- 新增模式：初始付款記錄 -->
      <template v-if="props.mode === 'create'">
        <ElDivider content-position="left">
          <ElCheckbox
            v-model="enableInitialPayment"
            label="同時新增一筆付款記錄（選填）"
            @change="handleTogglePayment"
          />
        </ElDivider>

        <template v-if="enableInitialPayment && props.formData.payment">
          <!-- 付款日期 -->
          <ElFormItem
            label="付款日期"
            prop="payment.paymentDate"
            :rules="[{ required: true, message: '請選擇付款日期', trigger: 'change' }]"
          >
            <ElDatePicker
              :model-value="props.formData.payment.paymentDate as string"
              type="date"
              placeholder="選擇付款日期"
              format="YYYY-MM-DD"
              style="width: 200px"
              @update:model-value="(v: Date | string | null) => updatePaymentField('paymentDate', v ? formatDateOnly(v) : '')"
            />
          </ElFormItem>

          <!-- 付款金額 -->
          <ElFormItem
            label="付款金額"
            prop="payment.paymentAmount"
            :rules="[
              { required: true, message: '請輸入付款金額', trigger: 'blur' },
              { type: 'number', min: 0.01, message: '付款金額必須大於 0', trigger: 'blur' },
            ]"
          >
            <ElInputNumber
              :model-value="props.formData.payment.paymentAmount"
              :min="0"
              :precision="0"
              :controls="false"
              placeholder="請輸入付款金額"
              style="width: 200px"
              @update:model-value="(v: number | undefined) => updatePaymentField('paymentAmount', v ?? 0)"
            />
          </ElFormItem>

          <!-- 付款方式 -->
          <ElFormItem
            label="付款方式"
            prop="payment.paymentMethod"
            :rules="[{ required: true, message: '請選擇付款方式', trigger: 'change' }]"
          >
            <ElSelect
              :model-value="props.formData.payment.paymentMethod"
              placeholder="請選擇付款方式"
              style="width: 200px"
              @update:model-value="(v: string) => updatePaymentField('paymentMethod', v as PaymentMethod)"
            >
              <ElOption
                v-for="opt in paymentMethodOptions"
                :key="opt.value"
                :label="opt.label"
                :value="opt.value"
              />
            </ElSelect>
          </ElFormItem>

          <!-- 銀行末五碼（現金匯款才顯示） -->
          <ElFormItem
            v-if="showBankField"
            label="銀行末五碼"
            prop="payment.bankAccountLastFive"
            :rules="[{ pattern: /^\d{5}$/, message: '銀行末五碼必須為 5 位數字', trigger: 'blur' }]"
          >
            <ElInput
              :model-value="props.formData.payment.bankAccountLastFive"
              maxlength="5"
              placeholder="請輸入銀行末五碼"
              style="width: 200px"
              @update:model-value="(v: string) => updatePaymentField('bankAccountLastFive', v)"
            />
          </ElFormItem>
        </template>
      </template>
    </ElForm>

    <!-- 編輯模式：訂單狀態操作 -->
    <template v-if="props.mode === 'edit' && props.currentOrder">
      <OrderStatusActions
        :order="props.currentOrder"
        @update="handleOrderUpdate"
      />

      <!-- 付款記錄面板 -->
      <PaymentRecordsPanel
        :order-id="props.currentOrder.id"
        :total-amount="props.currentOrder.totalAmount"
        :payment-status="props.currentOrder.paymentStatus"
        :payment-records="props.currentOrder.paymentRecords"
        :disabled="isTerminalState"
        @update="handlePaymentUpdate"
      />
    </template>

    <template #footer>
      <ElButton @click="handleClose">
        取消
      </ElButton>
      <ElButton
        type="primary"
        :loading="props.loading"
        :disabled="isTerminalState"
        @click="handleSubmit"
      >
        {{ props.mode === "create" ? "新增" : "儲存" }}
      </ElButton>
    </template>
  </ElDialog>
</template>

<style scoped lang="scss">
.amount-summary {
  display: flex;
  gap: 24px;
  align-items: center;
  font-size: 14px;
  flex-wrap: wrap;

  .total-amount {
    font-weight: 700;
    font-size: 16px;
    color: var(--el-color-danger);
  }
}
</style>

<style lang="scss">
/** 非 scoped：覆寫 ElDialog 最大寬度 */
.order-form-dialog {
  max-width: 1100px;
}
</style>

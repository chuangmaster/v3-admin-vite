<script setup lang="ts">
/**
 * 收件資訊表單元件
 *
 * @module order-management/components/DeliveryInfoForm
 * @description 依收件方式動態顯示對應欄位,整合 useDeliveryValidation 即時驗證
 */
import type { DeliveryInfo } from "@/pages/order-management/types"
import {
  ElButton,
  ElDatePicker,
  ElFormItem,
  ElInput,
  ElOption,
  ElSelect
} from "element-plus"
import { computed, watch } from "vue"
import {
  DELIVERY_METHOD_LABELS,
  DeliveryMethod
} from "@/pages/order-management/types"

defineOptions({ name: "DeliveryInfoForm" })

const props = withDefaults(defineProps<Props>(), {
  disabled: false
})

const emit = defineEmits<Emits>()

/** 收件方式選項列表 */
const deliveryMethodOptions = [
  { value: DeliveryMethod.PICKUP, label: DELIVERY_METHOD_LABELS[DeliveryMethod.PICKUP] },
  { value: DeliveryMethod.HOME_DELIVERY, label: DELIVERY_METHOD_LABELS[DeliveryMethod.HOME_DELIVERY] },
  { value: DeliveryMethod.STORE_PICKUP, label: DELIVERY_METHOD_LABELS[DeliveryMethod.STORE_PICKUP] },
  { value: DeliveryMethod.PLATFORM, label: DELIVERY_METHOD_LABELS[DeliveryMethod.PLATFORM] }
]

interface Props {
  /** 收件方式 */
  deliveryMethod: DeliveryMethod
  /** 收件資訊 */
  deliveryInfo: Partial<DeliveryInfo>
  /** 是否禁用 */
  disabled?: boolean
  /** 購買人資料（用於「同購買人資料」帶入） */
  customerInfo?: { name: string, phone: string, address: string } | null
}

interface Emits {
  (e: "update:deliveryMethod", value: DeliveryMethod): void
  (e: "update:deliveryInfo", value: Partial<DeliveryInfo>): void
}

/** 是否為自取 */
const isPickup = computed(() => props.deliveryMethod === DeliveryMethod.PICKUP)

/** 是否為宅配 */
const isHomeDelivery = computed(() => props.deliveryMethod === DeliveryMethod.HOME_DELIVERY)

/** 是否為超商取貨 */
const isStorePickup = computed(() => props.deliveryMethod === DeliveryMethod.STORE_PICKUP)

/** 是否為平台物流 */
const isPlatform = computed(() => props.deliveryMethod === DeliveryMethod.PLATFORM)

/**
 * 收件方式變更時重置收件資訊
 */
watch(() => props.deliveryMethod, (newMethod) => {
  switch (newMethod) {
    case DeliveryMethod.PICKUP:
      emit("update:deliveryInfo", { type: "PICKUP", pickupLocation: "", pickupTime: "" })
      break
    case DeliveryMethod.HOME_DELIVERY:
      emit("update:deliveryInfo", { type: "HOME_DELIVERY", recipientName: "", recipientPhone: "", recipientAddress: "" })
      break
    case DeliveryMethod.STORE_PICKUP:
      emit("update:deliveryInfo", { type: "STORE_PICKUP", storeInfo: "", recipientName: "", recipientPhone: "" })
      break
    case DeliveryMethod.PLATFORM:
      emit("update:deliveryInfo", { type: "PLATFORM" })
      break
  }
})

/**
 * 更新收件資訊欄位
 * @param field - 欄位名稱
 * @param value - 欄位值
 */
function updateField(field: string, value: string) {
  emit("update:deliveryInfo", {
    ...props.deliveryInfo,
    [field]: value
  })
}

/**
 * 處理收件方式變更
 */
function handleMethodChange(method: DeliveryMethod) {
  emit("update:deliveryMethod", method)
}
/**
 * 帶入購買人資料至宅配收件資訊
 */
function fillFromCustomer() {
  if (!props.customerInfo) return
  emit("update:deliveryInfo", {
    ...props.deliveryInfo,
    recipientName: props.customerInfo.name,
    recipientPhone: props.customerInfo.phone,
    recipientAddress: props.customerInfo.address
  })
}
</script>

<template>
  <div class="delivery-info-form">
    <ElFormItem label="收件方式" prop="deliveryMethod" required>
      <ElSelect
        :model-value="props.deliveryMethod"
        :disabled="props.disabled"
        placeholder="請選擇收件方式"
        @update:model-value="handleMethodChange"
      >
        <ElOption
          v-for="option in deliveryMethodOptions"
          :key="option.value"
          :label="option.label"
          :value="option.value"
        />
      </ElSelect>
    </ElFormItem>

    <!-- 自取 -->
    <template v-if="isPickup">
      <ElFormItem
        label="自取地點"
        prop="deliveryInfo.pickupLocation"
        :rules="[
          { required: true, message: '請輸入自取地點', trigger: 'blur' },
          { min: 1, max: 200, message: '自取地點長度為 1-200 字元', trigger: 'blur' },
        ]"
      >
        <ElInput
          :model-value="(props.deliveryInfo as any)?.pickupLocation"
          :disabled="props.disabled"
          placeholder="請輸入自取地點"
          maxlength="200"
          @update:model-value="(v: string) => updateField('pickupLocation', v)"
        />
      </ElFormItem>

      <ElFormItem
        label="自取時間"
        prop="deliveryInfo.pickupTime"
        :rules="[{ required: true, message: '請選擇自取時間', trigger: 'change' }]"
      >
        <ElDatePicker
          :model-value="(props.deliveryInfo as any)?.pickupTime"
          :disabled="props.disabled"
          type="datetime"
          placeholder="請選擇自取時間"
          format="YYYY-MM-DD HH:mm"
          value-format="YYYY-MM-DDTHH:mm:ss.000Z"
          @update:model-value="(v: string) => updateField('pickupTime', v)"
        />
      </ElFormItem>
    </template>

    <!-- 宅配 -->
    <template v-if="isHomeDelivery">
      <div class="copy-customer-row">
        <ElButton
          size="small"
          :disabled="props.disabled || !props.customerInfo"
          @click="fillFromCustomer"
        >
          同購買人資料
        </ElButton>
      </div>

      <ElFormItem
        label="收件人姓名"
        prop="deliveryInfo.recipientName"
        :rules="[
          { required: true, message: '請輸入收件人姓名', trigger: 'blur' },
          { min: 1, max: 50, message: '收件人姓名長度為 1-50 字元', trigger: 'blur' },
        ]"
      >
        <ElInput
          :model-value="(props.deliveryInfo as any)?.recipientName"
          :disabled="props.disabled"
          placeholder="請輸入收件人姓名"
          maxlength="50"
          @update:model-value="(v: string) => updateField('recipientName', v)"
        />
      </ElFormItem>

      <ElFormItem
        label="收件人電話"
        prop="deliveryInfo.recipientPhone"
        :rules="[
          { required: true, message: '請輸入收件人電話', trigger: 'blur' },
          { pattern: /^09\d{8}$/, message: '請輸入正確的台灣手機號碼（09 開頭,共 10 碼）', trigger: 'blur' },
        ]"
      >
        <ElInput
          :model-value="(props.deliveryInfo as any)?.recipientPhone"
          :disabled="props.disabled"
          placeholder="請輸入收件人電話"
          maxlength="10"
          @update:model-value="(v: string) => updateField('recipientPhone', v)"
        />
      </ElFormItem>

      <ElFormItem
        label="收件地址"
        prop="deliveryInfo.recipientAddress"
        :rules="[
          { required: true, message: '請輸入收件地址', trigger: 'blur' },
          { min: 10, max: 200, message: '收件地址長度為 10-200 字元', trigger: 'blur' },
        ]"
      >
        <ElInput
          :model-value="(props.deliveryInfo as any)?.recipientAddress"
          :disabled="props.disabled"
          placeholder="請輸入收件地址"
          maxlength="200"
          @update:model-value="(v: string) => updateField('recipientAddress', v)"
        />
      </ElFormItem>
    </template>

    <!-- 超商取貨 -->
    <template v-if="isStorePickup">
      <ElFormItem
        label="超商門市"
        prop="deliveryInfo.storeInfo"
        :rules="[
          { required: true, message: '請輸入超商門市資訊', trigger: 'blur' },
          { min: 1, max: 200, message: '超商門市資訊長度為 1-200 字元', trigger: 'blur' },
        ]"
      >
        <ElInput
          :model-value="(props.deliveryInfo as any)?.storeInfo"
          :disabled="props.disabled"
          placeholder="請輸入超商門市資訊"
          maxlength="200"
          @update:model-value="(v: string) => updateField('storeInfo', v)"
        />
      </ElFormItem>

      <ElFormItem
        label="取貨人姓名"
        prop="deliveryInfo.recipientName"
        :rules="[
          { required: true, message: '請輸入取貨人姓名', trigger: 'blur' },
          { min: 1, max: 50, message: '取貨人姓名長度為 1-50 字元', trigger: 'blur' },
        ]"
      >
        <ElInput
          :model-value="(props.deliveryInfo as any)?.recipientName"
          :disabled="props.disabled"
          placeholder="請輸入取貨人姓名"
          maxlength="50"
          @update:model-value="(v: string) => updateField('recipientName', v)"
        />
      </ElFormItem>

      <ElFormItem
        label="取貨人電話"
        prop="deliveryInfo.recipientPhone"
        :rules="[
          { required: true, message: '請輸入取貨人電話', trigger: 'blur' },
          { pattern: /^09\d{8}$/, message: '請輸入正確的台灣手機號碼（09 開頭,共 10 碼）', trigger: 'blur' },
        ]"
      >
        <ElInput
          :model-value="(props.deliveryInfo as any)?.recipientPhone"
          :disabled="props.disabled"
          placeholder="請輸入取貨人電話"
          maxlength="10"
          @update:model-value="(v: string) => updateField('recipientPhone', v)"
        />
      </ElFormItem>
    </template>

    <!-- 平台物流 -->
    <template v-if="isPlatform">
      <div class="platform-hint">
        <span>平台物流不需填寫額外收件資訊</span>
      </div>
    </template>
  </div>
</template>

<style scoped lang="scss">
.delivery-info-form {
  width: 100%;
}

.platform-hint {
  padding: 12px 16px;
  color: var(--el-text-color-secondary);
  font-size: 13px;
  background-color: var(--el-fill-color-light);
  border-radius: 4px;
  margin-bottom: 16px;
}

.copy-customer-row {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 12px;
}
</style>

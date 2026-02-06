<script setup lang="ts">
/**
 * 出貨單預覽元件
 *
 * @module order-management/components/ShippingLabelPreview
 * @description 出貨單格式化顯示,包含訂單編號、客戶名稱、收件資訊、商品清單,
 *              支援列印友善樣式
 */
import type { ShippingLabelResponse } from "@/pages/order-management/types"
import { Printer } from "@element-plus/icons-vue"
import {
  ElButton,
  ElDescriptions,
  ElDescriptionsItem,
  ElDialog,
  ElTable,
  ElTableColumn
} from "element-plus"
import {
  DELIVERY_METHOD_LABELS,
  DeliveryMethod
} from "@/pages/order-management/types"

defineOptions({ name: "ShippingLabelPreview" })

const props = defineProps<Props>()

const emit = defineEmits<Emits>()

interface Props {
  /** 對話框是否顯示 */
  visible: boolean
  /** 出貨單資料 */
  data: ShippingLabelResponse | null
}

interface Emits {
  (e: "update:visible", value: boolean): void
  (e: "print"): void
}

/**
 * 格式化日期
 */
function formatDate(dateStr: string): string {
  if (!dateStr) return ""
  const date = new Date(dateStr)
  return date.toLocaleDateString("zh-TW", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  })
}

/**
 * 格式化金額
 */
function formatCurrency(amount: number): string {
  return `NT$ ${amount.toLocaleString()}`
}

/**
 * 取得收件人資訊文字
 */
function getDeliveryInfoText(): string {
  if (!props.data) return ""
  const info = props.data.deliveryInfo as any

  switch (props.data.deliveryMethod) {
    case DeliveryMethod.PICKUP:
      return `自取地點：${info.pickupLocation || ""}\n自取時間：${formatDate(info.pickupTime || "")}`
    case DeliveryMethod.HOME_DELIVERY:
      return `收件人：${info.recipientName || ""}\n電話：${info.recipientPhone || ""}\n地址：${info.recipientAddress || ""}`
    case DeliveryMethod.STORE_PICKUP:
      return `超商門市：${info.storeInfo || ""}\n取貨人：${info.recipientName || ""}\n電話：${info.recipientPhone || ""}`
    case DeliveryMethod.PLATFORM:
      return "平台物流"
    default:
      return ""
  }
}

/**
 * 處理列印
 */
function handlePrint() {
  emit("print")
}

/**
 * 處理關閉
 */
function handleClose() {
  emit("update:visible", false)
}
</script>

<template>
  <ElDialog
    :model-value="props.visible"
    title="出貨單預覽"
    width="800px"
    :close-on-click-modal="false"
    @close="handleClose"
  >
    <div v-if="props.data" class="shipping-label-content">
      <div class="label-header">
        <h2 class="label-title">
          出貨單
        </h2>
      </div>

      <!-- 訂單基本資訊 -->
      <ElDescriptions :column="2" border size="small" class="label-info">
        <ElDescriptionsItem label="訂單編號">
          {{ props.data.orderNumber }}
        </ElDescriptionsItem>
        <ElDescriptionsItem label="訂單日期">
          {{ formatDate(props.data.orderDate) }}
        </ElDescriptionsItem>
        <ElDescriptionsItem label="客戶名稱">
          {{ props.data.customerName }}
        </ElDescriptionsItem>
        <ElDescriptionsItem label="收件方式">
          {{ DELIVERY_METHOD_LABELS[props.data.deliveryMethod] }}
        </ElDescriptionsItem>
      </ElDescriptions>

      <!-- 收件資訊 -->
      <div class="delivery-section">
        <h3 class="section-title">
          收件資訊
        </h3>
        <pre class="delivery-info-text">{{ getDeliveryInfoText() }}</pre>
      </div>

      <!-- 商品清單 -->
      <div class="items-section">
        <h3 class="section-title">
          商品清單
        </h3>
        <ElTable :data="props.data.orderItems" border size="small">
          <ElTableColumn type="index" label="#" width="50" />
          <ElTableColumn prop="productName" label="商品名稱" min-width="150" />
          <ElTableColumn prop="brandName" label="品牌" min-width="100" />
          <ElTableColumn prop="panshiCode" label="磐石編碼" min-width="100" />
          <ElTableColumn prop="serialId" label="序號 ID" min-width="100" />
          <ElTableColumn prop="productStyle" label="款式" min-width="100" />
          <ElTableColumn label="數量" min-width="60" align="center">
            <template #default="{ row }">
              {{ row.quantity }}
            </template>
          </ElTableColumn>
          <ElTableColumn label="單價" min-width="100" align="right">
            <template #default="{ row }">
              {{ formatCurrency(row.unitPrice) }}
            </template>
          </ElTableColumn>
        </ElTable>
      </div>
    </div>

    <template #footer>
      <ElButton @click="handleClose">
        關閉
      </ElButton>
      <ElButton type="primary" :icon="Printer" @click="handlePrint">
        列印
      </ElButton>
    </template>
  </ElDialog>
</template>

<style scoped lang="scss">
.shipping-label-content {
  padding: 0 16px;
}

.label-header {
  text-align: center;
  margin-bottom: 20px;
}

.label-title {
  font-size: 22px;
  font-weight: 700;
  margin: 0;
}

.label-info {
  margin-bottom: 16px;
}

.delivery-section,
.items-section {
  margin-bottom: 16px;
}

.section-title {
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 8px;
  padding-bottom: 4px;
  border-bottom: 1px solid var(--el-border-color);
}

.delivery-info-text {
  font-family: inherit;
  font-size: 14px;
  line-height: 1.8;
  padding: 8px 12px;
  background-color: var(--el-fill-color-light);
  border-radius: 4px;
  white-space: pre-wrap;
  margin: 0;
}

/* 列印樣式 */
@media print {
  .el-dialog__footer,
  .el-dialog__headerbtn {
    display: none !important;
  }

  .shipping-label-content {
    padding: 0;
  }

  .label-title {
    font-size: 24px;
  }
}
</style>

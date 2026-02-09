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
  ElDialog
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
    class="shipping-label-dialog"
    append-to-body
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
        <div class="product-cards">
          <div
            v-for="(item, index) in props.data.orderItems"
            :key="item.id"
            class="product-card"
          >
            <div class="product-card-header">
              <span class="product-index">#{{ index + 1 }}</span>
              <span class="product-name">{{ item.productName }}</span>
            </div>
            <div class="product-card-body">
              <div class="product-field">
                <span class="field-label">品牌</span>
                <span class="field-value">{{ item.brandName }}</span>
              </div>
              <div class="product-field">
                <span class="field-label">磐石編碼</span>
                <span class="field-value">{{ item.panshiCode }}</span>
              </div>
              <div class="product-field">
                <span class="field-label">序號 ID</span>
                <span class="field-value">{{ item.serialId }}</span>
              </div>
              <div class="product-field">
                <span class="field-label">款式</span>
                <span class="field-value">{{ item.productStyle }}</span>
              </div>
              <div class="product-field">
                <span class="field-label">數量</span>
                <span class="field-value">{{ item.quantity }}</span>
              </div>
              <div class="product-field">
                <span class="field-label">單價</span>
                <span class="field-value price">{{ formatCurrency(item.unitPrice) }}</span>
              </div>
            </div>
          </div>
        </div>
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

/* 商品卡片 */
.product-cards {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.product-card {
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 6px;
  overflow: hidden;
}

.product-card-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background-color: var(--el-fill-color-light);
  border-bottom: 1px solid var(--el-border-color-lighter);
  font-weight: 600;
  font-size: 14px;
}

.product-index {
  color: var(--el-text-color-secondary);
  font-size: 12px;
  min-width: 20px;
}

.product-name {
  color: var(--el-text-color-primary);
}

.product-card-body {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0;
}

.product-field {
  display: flex;
  flex-direction: column;
  padding: 6px 12px;
  border-bottom: 1px solid var(--el-border-color-extra-light);
  border-right: 1px solid var(--el-border-color-extra-light);

  &:nth-child(3n) {
    border-right: none;
  }

  &:nth-last-child(-n + 3) {
    border-bottom: none;
  }
}

.field-label {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  margin-bottom: 2px;
}

.field-value {
  font-size: 13px;
  color: var(--el-text-color-primary);
  word-break: break-all;

  &.price {
    font-weight: 600;
    color: var(--el-color-primary);
  }
}

/* 平板響應式 */
@media (max-width: 860px) {
  .shipping-label-content {
    padding: 0 8px;
  }

  .product-card-body {
    grid-template-columns: repeat(2, 1fr);
  }

  .product-field {
    &:nth-child(3n) {
      border-right: 1px solid var(--el-border-color-extra-light);
    }

    &:nth-child(2n) {
      border-right: none;
    }

    &:nth-last-child(-n + 3) {
      border-bottom: 1px solid var(--el-border-color-extra-light);
    }

    &:nth-last-child(-n + 2) {
      border-bottom: none;
    }
  }
}
</style>

<!-- 非 scoped 樣式：用於對話框本體及列印 -->
<style lang="scss">
/* 對話框響應式寬度（平板適配） */
.shipping-label-dialog {
  max-width: 95vw;

  .el-dialog__body {
    overflow-x: hidden;
  }
}

/* A4 列印樣式 (210mm × 297mm) */
@media print {
  @page {
    size: A4 portrait;
    margin: 15mm;
  }

  /* 隱藏頁面所有內容（#app 及其他非 overlay 元素） */
  body > *:not(.el-overlay) {
    display: none !important;
  }

  /* 隱藏不相關的 overlay（非出貨單預覽的對話框） */
  body > .el-overlay:not(:has(.shipping-label-dialog)) {
    display: none !important;
  }

  /* 顯示出貨單 overlay 並移除遮罩背景 */
  body > .el-overlay:has(.shipping-label-dialog) {
    position: static !important;
    background: none !important;
    overflow: visible !important;
  }

  .el-overlay-dialog {
    position: static !important;
    overflow: visible !important;
  }

  .shipping-label-dialog {
    position: static !important;
    width: 100% !important;
    max-width: none !important;
    margin: 0 !important;
    border: none !important;
    box-shadow: none !important;
    border-radius: 0 !important;
    transform: none !important;

    .el-dialog__header {
      display: none !important;
    }

    .el-dialog__footer {
      display: none !important;
    }

    .el-dialog__body {
      padding: 0 !important;
      overflow: visible !important;
    }
  }

  .shipping-label-content {
    padding: 0 !important;
    width: 100% !important;
  }

  .label-title {
    font-size: 24px !important;
  }

  /* 列印時卡片樣式 */
  .product-card {
    break-inside: avoid;
    border-color: #ddd !important;
  }

  .product-card-header {
    background-color: #f5f5f5 !important;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  .delivery-info-text {
    background-color: #f5f5f5 !important;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
}
</style>

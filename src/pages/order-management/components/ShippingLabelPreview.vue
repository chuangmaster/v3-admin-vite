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
  ElTag
} from "element-plus"
import {
  ACCESSORY_OPTIONS,
  DELIVERY_METHOD_LABELS,
  DeliveryMethod,
  ORDER_STATUS_COLORS,
  ORDER_STATUS_LABELS,
  ORDER_TYPE_LABELS,
  PAYMENT_METHOD_LABELS,
  PAYMENT_STATUS_COLORS,
  PAYMENT_STATUS_LABELS,
  PRODUCT_SOURCE_LABELS,
  SHIPPING_STATUS_COLORS,
  SHIPPING_STATUS_LABELS
} from "@/pages/order-management/types"
import BrandBanner from "./BrandBanner.vue"
import "@/common/assets/fonts/fonts.css"

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
function formatCurrency(amount: number | undefined | null): string {
  if (amount == null) return "NT$ 0"
  return `NT$ ${amount.toLocaleString()}`
}

/**
 * 將配件值轉換為中文標籤
 */
function formatAccessories(accessories: string[] | null): string {
  if (!accessories || accessories.length === 0) return "無"
  return accessories
    .map((accessory) => {
      const option = ACCESSORY_OPTIONS.find(opt => opt.value === accessory)
      return option ? option.label : accessory
    })
    .join("、")
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
        <BrandBanner />
      </div>

      <!-- 訂單基本資訊 -->
      <ElDescriptions :column="3" border size="small" class="label-info">
        <ElDescriptionsItem label="訂單編號">
          {{ props.data.orderNumber }}
        </ElDescriptionsItem>
        <ElDescriptionsItem label="訂單日期">
          {{ formatDate(props.data.orderDate) }}
        </ElDescriptionsItem>
        <ElDescriptionsItem v-if="props.data.orderType" label="訂單類型">
          {{ ORDER_TYPE_LABELS[props.data.orderType] }}
        </ElDescriptionsItem>
        <ElDescriptionsItem label="收件方式">
          {{ DELIVERY_METHOD_LABELS[props.data.deliveryMethod] }}
        </ElDescriptionsItem>
        <ElDescriptionsItem label="客戶名稱">
          {{ props.data.customerName }}
        </ElDescriptionsItem>
        <ElDescriptionsItem label="客戶電話">
          {{ props.data.customerPhone }}
        </ElDescriptionsItem>
      </ElDescriptions>

      <!-- 狀態資訊 -->
      <div v-if="props.data.orderStatus || props.data.paymentStatus || props.data.shippingStatus" class="label-info">
        <h3 class="section-title">
          狀態資訊
        </h3>
        <ElDescriptions :column="3" border size="small">
          <ElDescriptionsItem label="訂單狀態">
            <ElTag v-if="props.data.orderStatus" :type="ORDER_STATUS_COLORS[props.data.orderStatus]" size="small">
              {{ ORDER_STATUS_LABELS[props.data.orderStatus] }}
            </ElTag>
            <span v-else>—</span>
          </ElDescriptionsItem>
          <ElDescriptionsItem label="付款狀態">
            <ElTag v-if="props.data.paymentStatus" :type="PAYMENT_STATUS_COLORS[props.data.paymentStatus]" size="small">
              {{ PAYMENT_STATUS_LABELS[props.data.paymentStatus] }}
            </ElTag>
            <span v-else>—</span>
          </ElDescriptionsItem>
          <ElDescriptionsItem label="出貨狀態">
            <ElTag v-if="props.data.shippingStatus" :type="SHIPPING_STATUS_COLORS[props.data.shippingStatus]" size="small">
              {{ SHIPPING_STATUS_LABELS[props.data.shippingStatus] }}
            </ElTag>
            <span v-else>—</span>
          </ElDescriptionsItem>
        </ElDescriptions>
      </div>

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
                <span class="field-label">Serial ID</span>
                <span class="field-value">{{ item.serialId }}</span>
              </div>
              <div class="product-field">
                <span class="field-label">款式</span>
                <span class="field-value">{{ item.productStyle }}</span>
              </div>
              <div class="product-field">
                <span class="field-label">商品來源</span>
                <span class="field-value">{{ PRODUCT_SOURCE_LABELS[item.productSource] }}</span>
              </div>
              <div class="product-field">
                <span class="field-label">配件</span>
                <span class="field-value">{{ formatAccessories(item.accessories) }}</span>
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

      <!-- 金額明細 -->
      <div v-if="props.data.subtotalAmount != null || props.data.shippingFee != null || props.data.totalAmount != null" class="label-info">
        <h3 class="section-title">
          金額明細
        </h3>
        <ElDescriptions :column="3" border size="small">
          <ElDescriptionsItem label="商品小計">
            {{ formatCurrency(props.data.subtotalAmount) }}
          </ElDescriptionsItem>
          <ElDescriptionsItem label="運費">
            {{ formatCurrency(props.data.shippingFee) }}
          </ElDescriptionsItem>
          <ElDescriptionsItem label="總金額">
            <span class="total-amount">{{ formatCurrency(props.data.totalAmount) }}</span>
          </ElDescriptionsItem>
        </ElDescriptions>
      </div>

      <!-- 付款記錄 -->
      <div v-if="props.data.paymentRecords?.length" class="items-section">
        <h3 class="section-title">
          付款記錄
        </h3>
        <ElDescriptions
          v-for="(record, index) in props.data.paymentRecords"
          :key="record.id"
          :column="3"
          border
          size="small"
          class="payment-record"
          :title="`第 ${index + 1} 筆`"
        >
          <ElDescriptionsItem label="付款日期">
            {{ formatDate(record.paymentDate) }}
          </ElDescriptionsItem>
          <ElDescriptionsItem label="付款金額">
            <span class="total-amount">{{ formatCurrency(record.paymentAmount) }}</span>
          </ElDescriptionsItem>
          <ElDescriptionsItem label="付款方式">
            {{ PAYMENT_METHOD_LABELS[record.paymentMethod] }}
          </ElDescriptionsItem>
        </ElDescriptions>
      </div>

      <!-- 其他資訊 -->
      <div v-if="props.data.createdByName || props.data.remarks" class="label-info">
        <h3 class="section-title">
          其他資訊
        </h3>
        <ElDescriptions :column="2" border size="small">
          <ElDescriptionsItem label="建立者">
            {{ props.data.createdByName }}
          </ElDescriptionsItem>
          <ElDescriptionsItem label="備註">
            {{ props.data.remarks || '無' }}
          </ElDescriptionsItem>
        </ElDescriptions>
      </div>

      <!-- 簽名檢核欄位 -->
      <div class="signature-section">
        <h3 class="section-title">
          簽名檢核
        </h3>
        <div class="signature-fields">
          <div class="signature-field">
            <div class="signature-label">
              精品養護人員：
            </div>
            <div class="signature-line" />
            <div class="signature-date-label">
              日期：
            </div>
            <div class="signature-date-line" />
          </div>
          <div class="signature-field">
            <div class="signature-label">
              質檢發貨人員：
            </div>
            <div class="signature-line" />
            <div class="signature-date-label">
              日期：
            </div>
            <div class="signature-date-line" />
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

.label-info {
  margin-bottom: 16px;
}

.delivery-section,
.items-section {
  margin-bottom: 16px;
}

.total-amount {
  font-weight: 700;
  color: var(--el-color-danger);
  font-size: 15px;
}

.payment-record {
  margin-bottom: 8px;
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
  grid-template-columns: repeat(4, 1fr);
  gap: 0;
}

.product-field {
  display: flex;
  flex-direction: column;
  padding: 6px 12px;
  border-bottom: 1px solid var(--el-border-color-extra-light);
  border-right: 1px solid var(--el-border-color-extra-light);

  &:nth-child(4n) {
    border-right: none;
  }

  &:nth-last-child(-n + 4) {
    border-bottom: none;
  }
}

.product-field-full {
  grid-column: 1 / -1;
  border-right: none !important;
  border-top: 1px solid var(--el-border-color-extra-light);
  border-bottom: none;
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

/* 簽名檢核 */
.signature-section {
  margin-top: 24px;
  margin-bottom: 16px;
}

.signature-fields {
  display: flex;
  gap: 32px;
  margin-top: 16px;
}

.signature-field {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 8px;
}

.signature-label {
  font-size: 14px;
  color: var(--el-text-color-primary);
  white-space: nowrap;
}

.signature-line {
  flex: 1;
  min-width: 120px;
  border-bottom: 1px solid var(--el-text-color-secondary);
  height: 32px;
}

.signature-date-label {
  font-size: 14px;
  color: var(--el-text-color-primary);
  white-space: nowrap;
}

.signature-date-line {
  width: 100px;
  border-bottom: 1px solid var(--el-text-color-secondary);
  height: 32px;
}

/* 平板響應式 */
@media screen and (max-width: 860px) {
  .shipping-label-content {
    padding: 0 8px;
  }

  .signature-fields {
    flex-direction: column;
    gap: 16px;
  }

  .product-card-body {
    grid-template-columns: repeat(2, 1fr);
  }

  .product-field {
    &:nth-child(4n) {
      border-right: 1px solid var(--el-border-color-extra-light);
    }

    &:nth-child(2n) {
      border-right: none;
    }

    &:nth-last-child(-n + 4) {
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
    margin: 10mm;
  }

  /* 隱藏頁面所有內容（#app 及其他非 overlay 元素） */
  body > *:not(.el-overlay) {
    display: none !important;
  }

  /* 隱藏所有 overlay */
  body > .el-overlay {
    display: none !important;
  }

  /**
   * 顯示出貨單 overlay（僅當對話框為開啟狀態）
   * :not([style*="display: none"]) 確保只匹配實際可見的 overlay，
   * 避免關閉但仍殘留在 DOM 中的 overlay 干擾其他列印對話框
   */
  body > .el-overlay:not([style*="display: none"]):has(.shipping-label-dialog) {
    display: block !important;
    position: static !important;
    background: none !important;
    overflow: visible !important;
  }

  body > .el-overlay:not([style*="display: none"]):has(.shipping-label-dialog) .el-overlay-dialog {
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
    /* 整體縮放至 80%，確保所有內容收納於單頁 A4 */
    zoom: 0.8;
  }

  /* 壓縮 header 間距 */
  .label-header {
    margin-bottom: 10px !important;
  }

  /* 壓縮各區塊間距 */
  .label-info,
  .delivery-section,
  .items-section {
    margin-bottom: 8px !important;
  }

  .section-title {
    font-size: 12px !important;
    margin-bottom: 4px !important;
    padding-bottom: 2px !important;
  }

  /* 壓縮 ElDescriptions 單元格 padding */
  .el-descriptions__cell {
    padding: 4px 8px !important;
    font-size: 11px !important;
  }

  /* 壓縮收件資訊文字 */
  .delivery-info-text {
    font-size: 12px !important;
    line-height: 1.6 !important;
    padding: 5px 8px !important;
    background-color: #f5f5f5 !important;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  /* 壓縮商品卡片間距 */
  .product-cards {
    gap: 6px !important;
  }

  /* 列印時卡片樣式 */
  .product-card {
    break-inside: avoid;
    border-color: #ddd !important;
  }

  .product-card-header {
    padding: 4px 8px !important;
    font-size: 12px !important;
    background-color: #f5f5f5 !important;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  .product-field {
    padding: 4px 8px !important;
  }

  .field-label {
    font-size: 10px !important;
    margin-bottom: 1px !important;
  }

  .field-value {
    font-size: 11px !important;
  }

  /* 壓縮付款記錄間距 */
  .payment-record {
    margin-bottom: 4px !important;
  }

  /* 壓縮簽名欄 */
  .signature-section {
    margin-top: 12px !important;
    margin-bottom: 8px !important;
  }

  .signature-fields {
    margin-top: 8px !important;
  }

  /* 列印時簽名欄位 */
  .signature-line,
  .signature-date-line {
    border-bottom-color: #333 !important;
  }
}
</style>

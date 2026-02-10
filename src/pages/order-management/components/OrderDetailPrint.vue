<script setup lang="ts">
/**
 * 訂單明細列印元件
 *
 * @module order-management/components/OrderDetailPrint
 * @description 供內部使用的訂單明細列印,包含完整資訊:
 *              訂單編號、客戶資訊、商品詳情、金額明細、付款狀態、
 *              訂單狀態、出貨狀態、操作者等
 */
import type { SalesOrder } from "@/pages/order-management/types"
import { Printer } from "@element-plus/icons-vue"
import {
  ElButton,
  ElDescriptions,
  ElDescriptionsItem,
  ElDialog,
  ElTag
} from "element-plus"
import {
  DELIVERY_METHOD_LABELS,
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

defineOptions({ name: "OrderDetailPrint" })

const props = defineProps<Props>()

const emit = defineEmits<Emits>()

interface Props {
  /** 對話框是否顯示 */
  visible: boolean
  /** 訂單詳情資料 */
  order: SalesOrder | null
}

interface Emits {
  (e: "update:visible", value: boolean): void
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
 * 處理列印
 */
function handlePrint() {
  window.print()
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
    title="訂單明細列印"
    width="900px"
    class="order-detail-print-dialog"
    append-to-body
    :close-on-click-modal="false"
    @close="handleClose"
  >
    <div v-if="props.order" class="order-detail-print">
      <div class="print-header">
        <h2 class="print-title">
          訂單明細
        </h2>
      </div>

      <!-- 訂單基本資訊 -->
      <ElDescriptions :column="3" border size="small" title="訂單資訊" class="section">
        <ElDescriptionsItem label="訂單編號">
          {{ props.order.orderNumber }}
        </ElDescriptionsItem>
        <ElDescriptionsItem label="訂單日期">
          {{ formatDate(props.order.orderDate) }}
        </ElDescriptionsItem>
        <ElDescriptionsItem label="訂單類型">
          {{ ORDER_TYPE_LABELS[props.order.orderType] }}
        </ElDescriptionsItem>
        <ElDescriptionsItem label="客戶名稱">
          {{ props.order.customerName }}
        </ElDescriptionsItem>
        <ElDescriptionsItem label="客戶電話">
          {{ props.order.customerPhone }}
        </ElDescriptionsItem>
        <ElDescriptionsItem label="收件方式">
          {{ DELIVERY_METHOD_LABELS[props.order.deliveryMethod] }}
        </ElDescriptionsItem>
      </ElDescriptions>

      <!-- 狀態資訊 -->
      <ElDescriptions :column="3" border size="small" title="狀態資訊" class="section">
        <ElDescriptionsItem label="訂單狀態">
          <ElTag :type="ORDER_STATUS_COLORS[props.order.orderStatus]" size="small">
            {{ ORDER_STATUS_LABELS[props.order.orderStatus] }}
          </ElTag>
        </ElDescriptionsItem>
        <ElDescriptionsItem label="付款狀態">
          <ElTag :type="PAYMENT_STATUS_COLORS[props.order.paymentStatus]" size="small">
            {{ PAYMENT_STATUS_LABELS[props.order.paymentStatus] }}
          </ElTag>
        </ElDescriptionsItem>
        <ElDescriptionsItem label="出貨狀態">
          <ElTag :type="SHIPPING_STATUS_COLORS[props.order.shippingStatus]" size="small">
            {{ SHIPPING_STATUS_LABELS[props.order.shippingStatus] }}
          </ElTag>
        </ElDescriptionsItem>
      </ElDescriptions>

      <!-- 商品明細 -->
      <div class="section">
        <h3 class="section-title">
          商品明細
        </h3>
        <div class="product-cards">
          <div
            v-for="(item, index) in props.order.orderItems"
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
                <span class="field-label">來源</span>
                <span class="field-value">{{ PRODUCT_SOURCE_LABELS[item.productSource as keyof typeof PRODUCT_SOURCE_LABELS] || item.productSource }}</span>
              </div>
              <div class="product-field">
                <span class="field-label">單價</span>
                <span class="field-value">{{ formatCurrency(item.unitPrice) }}</span>
              </div>
              <div class="product-field">
                <span class="field-label">數量</span>
                <span class="field-value">{{ item.quantity }}</span>
              </div>
              <div class="product-field">
                <span class="field-label">小計</span>
                <span class="field-value price">{{ formatCurrency(item.unitPrice * item.quantity) }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 金額明細 -->
      <ElDescriptions :column="3" border size="small" title="金額明細" class="section">
        <ElDescriptionsItem label="商品小計">
          {{ formatCurrency(props.order.subtotalAmount) }}
        </ElDescriptionsItem>
        <ElDescriptionsItem label="運費">
          {{ formatCurrency(props.order.shippingFee) }}
        </ElDescriptionsItem>
        <ElDescriptionsItem label="總金額">
          <span class="total-amount">{{ formatCurrency(props.order.totalAmount) }}</span>
        </ElDescriptionsItem>
      </ElDescriptions>

      <!-- 付款記錄 -->
      <div v-if="props.order.paymentRecords.length > 0" class="section">
        <h3 class="section-title">
          付款記錄
        </h3>
        <ElTable :data="props.order.paymentRecords" border size="small">
          <ElTableColumn type="index" label="#" width="50" />
          <ElTableColumn label="付款日期" min-width="110">
            <template #default="{ row }">
              {{ formatDate(row.paymentDate) }}
            </template>
          </ElTableColumn>
          <ElTableColumn label="付款金額" min-width="120" align="right">
            <template #default="{ row }">
              {{ formatCurrency(row.paymentAmount) }}
            </template>
          </ElTableColumn>
          <ElTableColumn label="付款方式" min-width="100">
            <template #default="{ row }">
              {{ PAYMENT_METHOD_LABELS[row.paymentMethod as keyof typeof PAYMENT_METHOD_LABELS] || row.paymentMethod }}
            </template>
          </ElTableColumn>
          <ElTableColumn label="銀行末五碼" min-width="100">
            <template #default="{ row }">
              {{ row.bankAccountLastFive || "-" }}
            </template>
          </ElTableColumn>
        </ElTable>
      </div>

      <!-- 其他資訊 -->
      <ElDescriptions :column="2" border size="small" title="其他資訊" class="section">
        <ElDescriptionsItem label="建立者">
          {{ props.order.createdByName }}
        </ElDescriptionsItem>
        <ElDescriptionsItem label="建立時間">
          {{ formatDate(props.order.createdAt) }}
        </ElDescriptionsItem>
        <ElDescriptionsItem v-if="props.order.remarks" label="備註" :span="2">
          {{ props.order.remarks }}
        </ElDescriptionsItem>
      </ElDescriptions>
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
.order-detail-print {
  padding: 0 16px;
}

.print-header {
  text-align: center;
  margin-bottom: 20px;
}

.print-title {
  font-size: 22px;
  font-weight: 700;
  margin: 0;
}

.section {
  margin-bottom: 16px;
}

.section-title {
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 8px;
  padding-bottom: 4px;
  border-bottom: 1px solid var(--el-border-color);
}

.total-amount {
  font-weight: 700;
  color: var(--el-color-danger);
  font-size: 16px;
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
    color: var(--el-color-danger);
  }
}

/* 平板響應式 */
@media (max-width: 860px) {
  .order-detail-print {
    padding: 0 8px;
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
.order-detail-print-dialog {
  max-width: 95vw;
}

/* A4 列印樣式 */
@media print {
  @page {
    size: A4 portrait;
    margin: 15mm;
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
   * 顯示訂單明細 overlay（僅當對話框為開啟狀態）
   * :not([style*="display: none"]) 確保只匹配實際可見的 overlay，
   * 避免關閉但仍殘留在 DOM 中的 overlay 干擾其他列印對話框
   */
  body > .el-overlay:not([style*="display: none"]):has(.order-detail-print-dialog) {
    display: block !important;
    position: static !important;
    background: none !important;
    overflow: visible !important;
  }

  body > .el-overlay:not([style*="display: none"]):has(.order-detail-print-dialog) .el-overlay-dialog {
    position: static !important;
    overflow: visible !important;
  }

  .order-detail-print-dialog {
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

  .order-detail-print {
    padding: 0 !important;
    width: 100% !important;
  }

  .print-title {
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

  .product-card-body {
    grid-template-columns: repeat(4, 1fr) !important;
  }
}
</style>

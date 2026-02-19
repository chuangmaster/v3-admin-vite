<script setup lang="ts">
/**
 * 訂購單預覽元件
 *
 * @module order-management/components/OrderDocumentPreview
 * @description 訂購單格式化顯示，包含訂購人資訊、商品明細、付款紀錄與定金須知，
 *              支援列印友善樣式
 */
import type { OrderDocumentData } from "../types"
import { Printer } from "@element-plus/icons-vue"
import {
  ElButton,
  ElDescriptions,
  ElDescriptionsItem,
  ElDialog
} from "element-plus"
import { computed } from "vue"
import {
  ACCESSORY_OPTIONS,
  DEPOSIT_TERMS,
  OrderType,
  PAYMENT_METHOD_LABELS,
  PaymentMethod
} from "../types"
import BrandBanner from "./BrandBanner.vue"
import "@/common/assets/fonts/fonts.css"

defineOptions({ name: "OrderDocumentPreview" })

const props = defineProps<Props>()

const emit = defineEmits<Emits>()

interface Props {
  /** 對話框是否顯示 */
  visible: boolean
  /** 訂購單資料 */
  data: OrderDocumentData | null
}

interface Emits {
  (e: "update:visible", value: boolean): void
  (e: "print"): void
}

/**
 * 付款紀錄依日期升冪排序
 */
const sortedPaymentRecords = computed(() => {
  if (!props.data?.paymentRecords) return []
  return [...props.data.paymentRecords].sort(
    (a, b) => new Date(a.paymentDate).getTime() - new Date(b.paymentDate).getTime()
  )
})

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
    title="訂購單預覽"
    width="800px"
    class="order-document-dialog"
    append-to-body
    :close-on-click-modal="false"
    @close="handleClose"
  >
    <div v-if="props.data" class="order-document-content">
      <!-- 品牌標的 -->
      <div class="document-header">
        <BrandBanner />
        <h2 class="document-title">
          商品訂購單
        </h2>
      </div>

      <!-- 訂單基本資訊 + 訂購人資訊 -->
      <ElDescriptions :column="2" border size="small" class="document-info">
        <ElDescriptionsItem label="訂單編號">
          {{ props.data.orderNumber }}
        </ElDescriptionsItem>
        <ElDescriptionsItem label="訂單日期">
          {{ formatDate(props.data.orderDate) }}
        </ElDescriptionsItem>
        <ElDescriptionsItem label="訂購人姓名">
          {{ props.data.customerName }}
        </ElDescriptionsItem>
        <ElDescriptionsItem label="訂購人電話">
          {{ props.data.customerPhone }}
        </ElDescriptionsItem>
        <ElDescriptionsItem label="Line ID">
          {{ props.data.customerLineId || '-' }}
        </ElDescriptionsItem>
      </ElDescriptions>

      <!-- 商品明細 -->
      <div class="items-section">
        <h3 class="section-title">
          商品明細
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
                <span class="field-label">款式</span>
                <span class="field-value">{{ item.productStyle }}</span>
              </div>
              <div v-if="props.data.orderType === OrderType.SPOT_PURCHASE" class="product-field">
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

      <!-- 金額摘要 -->
      <div class="amount-section">
        <ElDescriptions :column="2" border size="small">
          <ElDescriptionsItem label="總金額">
            <span class="total-amount">{{ formatCurrency(props.data.totalAmount) }}</span>
          </ElDescriptionsItem>
          <ElDescriptionsItem label="已付金額">
            <span class="total-amount">{{ formatCurrency(props.data.paidAmount) }}</span>
          </ElDescriptionsItem>
        </ElDescriptions>
      </div>

      <!-- 付款紀錄 -->
      <div class="payment-section">
        <h3 class="section-title">
          付款紀錄
        </h3>
        <template v-if="sortedPaymentRecords.length">
          <table class="payment-table">
            <thead>
              <tr>
                <th>付款日期</th>
                <th>付款金額</th>
                <th>付款方式</th>
                <th>末五碼</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="record in sortedPaymentRecords" :key="record.id">
                <td>{{ formatDate(record.paymentDate) }}</td>
                <td class="cell-amount">
                  {{ formatCurrency(record.paymentAmount) }}
                </td>
                <td>{{ PAYMENT_METHOD_LABELS[record.paymentMethod] }}</td>
                <td>{{ record.paymentMethod === PaymentMethod.BANK_TRANSFER ? (record.bankAccountLastFive || '-') : '-' }}</td>
              </tr>
            </tbody>
          </table>
        </template>
        <p v-else class="no-records">
          尚無付款紀錄
        </p>
      </div>

      <!-- 定金須知 -->
      <div class="terms-section">
        <h3 class="section-title">
          訂購須知
        </h3>
        <ol class="terms-content">
          <li v-for="(term, index) in DEPOSIT_TERMS" :key="index" class="terms-item">
            {{ term }}
          </li>
        </ol>
      </div>
    </div>

    <template #footer>
      <ElButton @click="handleClose">
        關閉
      </ElButton>
      <ElButton type="primary" :icon="Printer" data-testid="print-button" @click="handlePrint">
        列印
      </ElButton>
    </template>
  </ElDialog>
</template>

<style scoped lang="scss">
.order-document-content {
  padding: 0 16px;
}

.document-header {
  text-align: center;
  margin-bottom: 20px;
}

.document-title {
  font-size: 18px;
  font-weight: 700;
  margin: 12px 0 0;
  color: var(--el-text-color-primary);
}

.document-info {
  margin-bottom: 16px;
}

.items-section,
.payment-section,
.amount-section {
  margin-bottom: 16px;
}

.total-amount {
  font-weight: 700;
  color: var(--el-color-danger);
  font-size: 15px;
}

.payment-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;

  th,
  td {
    padding: 7px 12px;
    text-align: left;
    border: 1px solid var(--el-border-color-lighter);
  }

  th {
    background-color: var(--el-fill-color-light);
    font-weight: 600;
    color: var(--el-text-color-secondary);
    font-size: 12px;
    white-space: nowrap;
  }

  td {
    color: var(--el-text-color-primary);
  }

  .cell-amount {
    font-weight: 700;
    color: var(--el-color-danger);
  }

  tbody tr:nth-child(even) {
    background-color: var(--el-fill-color-extra-light);
  }
}

.no-records {
  font-size: 14px;
  color: var(--el-text-color-secondary);
  padding: 8px 12px;
  background-color: var(--el-fill-color-light);
  border-radius: 4px;
  margin: 0;
}

.section-title {
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 8px;
  padding-bottom: 4px;
  border-bottom: 1px solid var(--el-border-color);
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
  border-right: 1px solid var(--el-border-color-extra-light);

  // 每列最後一格（第4欄）與最後一格不需要右邊線
  &:nth-child(4n),
  &:last-child {
    border-right: none;
  }
}

// 現貨（含配件，共5個欄位）：偵測到第5格時，第一列需要下邊線
.product-card-body:has(.product-field:nth-child(5)) {
  .product-field:nth-child(-n + 4) {
    border-bottom: 1px solid var(--el-border-color-extra-light);
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

.terms-content {
  font-size: 13px;
  line-height: 1.8;
  padding: 12px 16px 12px 32px;
  background-color: var(--el-fill-color-light);
  border-radius: 4px;
  margin: 0;
  border: 1px solid var(--el-border-color-lighter);
  list-style: decimal;
}

.terms-item {
  color: var(--el-text-color-primary);

  & + & {
    margin-top: 6px;
  }
}

/* 平板響應式 */
@media (max-width: 860px) {
  .order-document-content {
    padding: 0 8px;
  }

  .product-card-body {
    grid-template-columns: repeat(2, 1fr);
  }

  .product-field {
    // 重設 4 欄右邊線規則，恢復第4欄的右邊線
    &:nth-child(4n) {
      border-right: 1px solid var(--el-border-color-extra-light);
    }

    // 套用 2 欄規則：偶數格（右欄）不需要右邊線
    &:nth-child(2n) {
      border-right: none;
    }
  }

  // 預購（4個欄位）：2×2 排列，第一列需要下邊線
  .product-card-body:not(:has(.product-field:nth-child(5))) {
    .product-field:nth-child(-n + 2) {
      border-bottom: 1px solid var(--el-border-color-extra-light);
    }
  }

  // 現貨（5個欄位）：2×2+1 排列，前兩列需要下邊線
  .product-card-body:has(.product-field:nth-child(5)) {
    .product-field:nth-child(-n + 4) {
      border-bottom: 1px solid var(--el-border-color-extra-light);
    }
  }
}
</style>

<!-- 非 scoped 樣式：用於對話框本體及列印 -->
<style lang="scss">
/* 對話框響應式寬度（平板適配） */
.order-document-dialog {
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

  /* 隱藏頁面所有內容 */
  body > *:not(.el-overlay) {
    display: none !important;
  }

  /* 隱藏所有 overlay */
  body > .el-overlay {
    display: none !important;
  }

  /**
   * 顯示訂購單 overlay（僅當對話框為開啟狀態）
   * :not([style*="display: none"]) 確保只匹配實際可見的 overlay
   */
  body > .el-overlay:not([style*="display: none"]):has(.order-document-dialog) {
    display: block !important;
    position: static !important;
    background: none !important;
    overflow: visible !important;
  }

  body > .el-overlay:not([style*="display: none"]):has(.order-document-dialog) .el-overlay-dialog {
    position: static !important;
    overflow: visible !important;
  }

  .order-document-dialog {
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

  .order-document-content {
    padding: 0 !important;
    width: 100% !important;
  }

  /* 列印時卡片樣式 */
  .order-document-dialog .product-card {
    break-inside: avoid;
    page-break-inside: avoid;
    border-color: #ddd !important;
  }

  .order-document-dialog .product-card-header {
    background-color: #f5f5f5 !important;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  /* 定金須知不跨頁 */
  .order-document-dialog .terms-section {
    break-inside: avoid;
    page-break-inside: avoid;
  }

  /* 區段標題與內容不分離 */
  .order-document-dialog .section-title {
    break-after: avoid;
    page-break-after: avoid;
  }

  /* 保留背景顏色 */
  .order-document-dialog .terms-content {
    background-color: #f5f5f5 !important;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  /* 付款紀錄表格列印樣式 */
  .order-document-dialog .payment-table {
    th,
    td {
      border-color: #ddd !important;
    }

    th {
      background-color: #f5f5f5 !important;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    tbody tr:nth-child(even) {
      background-color: #fafafa !important;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
  }
}
</style>

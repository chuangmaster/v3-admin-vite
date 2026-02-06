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
  ElTable,
  ElTableColumn,
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
        <ElTable :data="props.order.orderItems" border size="small">
          <ElTableColumn type="index" label="#" width="50" />
          <ElTableColumn prop="productName" label="商品名稱" min-width="140" />
          <ElTableColumn prop="brandName" label="品牌" min-width="90" />
          <ElTableColumn prop="panshiCode" label="磐石編碼" min-width="90" />
          <ElTableColumn prop="serialId" label="序號 ID" min-width="90" />
          <ElTableColumn prop="productStyle" label="款式" min-width="90" />
          <ElTableColumn label="來源" min-width="70">
            <template #default="{ row }">
              {{ PRODUCT_SOURCE_LABELS[row.productSource as keyof typeof PRODUCT_SOURCE_LABELS] || row.productSource }}
            </template>
          </ElTableColumn>
          <ElTableColumn label="單價" min-width="100" align="right">
            <template #default="{ row }">
              {{ formatCurrency(row.unitPrice) }}
            </template>
          </ElTableColumn>
          <ElTableColumn prop="quantity" label="數量" min-width="60" align="center" />
          <ElTableColumn label="小計" min-width="100" align="right">
            <template #default="{ row }">
              {{ formatCurrency(row.unitPrice * row.quantity) }}
            </template>
          </ElTableColumn>
        </ElTable>
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

@media print {
  .el-dialog__footer,
  .el-dialog__headerbtn {
    display: none !important;
  }

  .order-detail-print {
    padding: 0;
  }

  .print-title {
    font-size: 24px;
  }
}
</style>

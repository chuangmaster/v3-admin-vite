<script setup lang="ts">
/**
 * 訂單列表表格元件
 *
 * @module order-management/components/OrderListTable
 * @description 訂單列表表格顯示,含狀態標籤、操作按鈕
 */
import type { SalesOrderListItem } from "@/pages/order-management/types"
import { Delete, Printer, View } from "@element-plus/icons-vue"
import {
  ElButton,
  ElDropdown,
  ElDropdownItem,
  ElDropdownMenu,
  ElEmpty,
  ElTable,
  ElTableColumn,
  ElTag
} from "element-plus"
import {
  DELIVERY_METHOD_LABELS,
  ORDER_STATUS_COLORS,
  ORDER_STATUS_LABELS,
  ORDER_TYPE_LABELS,
  PAYMENT_STATUS_COLORS,
  PAYMENT_STATUS_LABELS,
  SHIPPING_STATUS_COLORS,
  SHIPPING_STATUS_LABELS
} from "@/pages/order-management/types"

defineOptions({ name: "OrderListTable" })

withDefaults(defineProps<Props>(), {
  loading: false
})

const emit = defineEmits<Emits>()

interface Props {
  /** 訂單列表資料 */
  data: SalesOrderListItem[]
  /** 載入中狀態 */
  loading?: boolean
}

interface Emits {
  (e: "view", order: SalesOrderListItem): void
  (e: "edit", order: SalesOrderListItem): void
  (e: "delete", order: SalesOrderListItem): void
  (e: "printShipping", order: SalesOrderListItem): void
  (e: "printOrder", order: SalesOrderListItem): void
  (e: "printOrderDocument", order: SalesOrderListItem): void
}

/**
 * 格式化日期顯示
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
</script>

<template>
  <ElTable
    :data="data"
    :loading="loading"
    border
    stripe
    style="width: 100%"
  >
    <template #empty>
      <ElEmpty description="暫無訂單資料" :image-size="100" />
    </template>

    <ElTableColumn prop="orderNumber" label="訂單編號" min-width="150" fixed="left" show-overflow-tooltip />

    <ElTableColumn label="訂單日期" min-width="110">
      <template #default="{ row }">
        {{ formatDate(row.orderDate) }}
      </template>
    </ElTableColumn>

    <ElTableColumn label="訂單類型" min-width="100">
      <template #default="{ row }">
        {{ ORDER_TYPE_LABELS[row.orderType as keyof typeof ORDER_TYPE_LABELS] || row.orderType }}
      </template>
    </ElTableColumn>

    <ElTableColumn prop="customerName" label="客戶名稱" min-width="100" show-overflow-tooltip />

    <ElTableColumn label="總金額" min-width="120" align="right">
      <template #default="{ row }">
        {{ formatCurrency(row.totalAmount) }}
      </template>
    </ElTableColumn>

    <ElTableColumn label="付款狀態" min-width="100" align="center">
      <template #default="{ row }">
        <ElTag
          :type="PAYMENT_STATUS_COLORS[row.paymentStatus as keyof typeof PAYMENT_STATUS_COLORS]"
          size="small"
        >
          {{ PAYMENT_STATUS_LABELS[row.paymentStatus as keyof typeof PAYMENT_STATUS_LABELS] || row.paymentStatus }}
        </ElTag>
      </template>
    </ElTableColumn>

    <ElTableColumn label="訂單狀態" min-width="100" align="center">
      <template #default="{ row }">
        <ElTag
          :type="ORDER_STATUS_COLORS[row.orderStatus as keyof typeof ORDER_STATUS_COLORS]"
          size="small"
        >
          {{ ORDER_STATUS_LABELS[row.orderStatus as keyof typeof ORDER_STATUS_LABELS] || row.orderStatus }}
        </ElTag>
      </template>
    </ElTableColumn>

    <ElTableColumn label="出貨狀態" min-width="100" align="center">
      <template #default="{ row }">
        <ElTag
          :type="SHIPPING_STATUS_COLORS[row.shippingStatus as keyof typeof SHIPPING_STATUS_COLORS]"
          size="small"
        >
          {{ SHIPPING_STATUS_LABELS[row.shippingStatus as keyof typeof SHIPPING_STATUS_LABELS] || row.shippingStatus }}
        </ElTag>
      </template>
    </ElTableColumn>

    <ElTableColumn label="收件方式" min-width="100">
      <template #default="{ row }">
        {{ DELIVERY_METHOD_LABELS[row.deliveryMethod as keyof typeof DELIVERY_METHOD_LABELS] || row.deliveryMethod }}
      </template>
    </ElTableColumn>

    <ElTableColumn prop="orderSource" label="訂單來源" min-width="110" show-overflow-tooltip>
      <template #default="{ row }">
        {{ row.orderSource || "—" }}
      </template>
    </ElTableColumn>

    <ElTableColumn prop="createdByName" label="操作者" min-width="90" show-overflow-tooltip />

    <ElTableColumn label="操作" width="200" align="center" fixed="right">
      <template #default="{ row }">
        <div class="action-buttons">
          <ElButton
            :icon="View"
            size="small"
            link
            @click="emit('view', row)"
          >
            查看
          </ElButton>
          <ElButton
            :icon="Delete"
            size="small"
            type="danger"
            link
            @click="emit('delete', row)"
          >
            刪除
          </ElButton>
          <ElDropdown
            trigger="click" @command="(cmd: string) => {
              if (cmd === 'printShipping') emit('printShipping', row)
              if (cmd === 'printOrder') emit('printOrder', row)
              if (cmd === 'printOrderDocument') emit('printOrderDocument', row)
            }"
          >
            <ElButton :icon="Printer" size="small" link>
              匯出
            </ElButton>
            <template #dropdown>
              <ElDropdownMenu>
                <ElDropdownItem command="printShipping">
                  出貨單
                </ElDropdownItem>
                <ElDropdownItem command="printOrder">
                  保證書
                </ElDropdownItem>
                <ElDropdownItem command="printOrderDocument">
                  訂購單
                </ElDropdownItem>
              </ElDropdownMenu>
            </template>
          </ElDropdown>
        </div>
      </template>
    </ElTableColumn>
  </ElTable>
</template>

<style scoped lang="scss">
.action-buttons {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
}
</style>

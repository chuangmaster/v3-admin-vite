<script setup lang="ts">
/**
 * 訂單搜尋表單元件
 *
 * @module order-management/components/OrderSearchForm
 * @description 提供訂單列表篩選條件：訂單編號、客戶名稱、商品名稱、
 *              訂單狀態、付款狀態、出貨狀態、日期範圍
 */
import type { SearchFilters } from "@/pages/order-management/types"
import { Refresh, Search } from "@element-plus/icons-vue"
import {
  ElButton,
  ElDatePicker,
  ElForm,
  ElFormItem,
  ElInput,
  ElOption,
  ElSelect
} from "element-plus"
import {
  ORDER_STATUS_LABELS,
  PAYMENT_STATUS_LABELS,
  SHIPPING_STATUS_LABELS
} from "@/pages/order-management/types"

defineOptions({ name: "OrderSearchForm" })

const props = defineProps<Props>()

const emit = defineEmits<Emits>()

interface Props {
  /** 篩選條件 */
  filters: SearchFilters
}

interface Emits {
  (e: "search"): void
  (e: "reset"): void
  (e: "update:filters", value: SearchFilters): void
}

/**
 * 更新篩選欄位
 */
function updateFilter<K extends keyof SearchFilters>(field: K, value: SearchFilters[K]) {
  emit("update:filters", { ...props.filters, [field]: value })
}

/**
 * 處理搜尋
 */
function handleSearch() {
  emit("search")
}

/**
 * 處理重置
 */
function handleReset() {
  emit("reset")
}
</script>

<template>
  <div class="filter-container">
    <ElForm inline @submit.prevent="handleSearch">
      <ElFormItem label="訂單編號">
        <ElInput
          :model-value="props.filters.orderNumber"
          placeholder="請輸入訂單編號"
          clearable
          style="width: 160px"
          @update:model-value="(v: string) => updateFilter('orderNumber', v)"
          @keyup.enter="handleSearch"
          @clear="handleSearch"
        />
      </ElFormItem>

      <ElFormItem label="客戶名稱">
        <ElInput
          :model-value="props.filters.customerName"
          placeholder="請輸入客戶名稱"
          clearable
          style="width: 140px"
          @update:model-value="(v: string) => updateFilter('customerName', v)"
          @keyup.enter="handleSearch"
          @clear="handleSearch"
        />
      </ElFormItem>

      <ElFormItem label="商品名稱">
        <ElInput
          :model-value="props.filters.productName"
          placeholder="請輸入商品名稱"
          clearable
          style="width: 140px"
          @update:model-value="(v: string) => updateFilter('productName', v)"
          @keyup.enter="handleSearch"
          @clear="handleSearch"
        />
      </ElFormItem>

      <ElFormItem label="訂單狀態">
        <ElSelect
          :model-value="props.filters.orderStatus"
          placeholder="全部"
          clearable
          style="width: 120px"
          @update:model-value="(v: string) => updateFilter('orderStatus', v as any)"
          @clear="handleSearch"
        >
          <ElOption
            v-for="(label, key) in ORDER_STATUS_LABELS"
            :key="key"
            :label="label"
            :value="key"
          />
        </ElSelect>
      </ElFormItem>

      <ElFormItem label="付款狀態">
        <ElSelect
          :model-value="props.filters.paymentStatus"
          placeholder="全部"
          clearable
          style="width: 120px"
          @update:model-value="(v: string) => updateFilter('paymentStatus', v as any)"
          @clear="handleSearch"
        >
          <ElOption
            v-for="(label, key) in PAYMENT_STATUS_LABELS"
            :key="key"
            :label="label"
            :value="key"
          />
        </ElSelect>
      </ElFormItem>

      <ElFormItem label="出貨狀態">
        <ElSelect
          :model-value="props.filters.shippingStatus"
          placeholder="全部"
          clearable
          style="width: 120px"
          @update:model-value="(v: string) => updateFilter('shippingStatus', v as any)"
          @clear="handleSearch"
        >
          <ElOption
            v-for="(label, key) in SHIPPING_STATUS_LABELS"
            :key="key"
            :label="label"
            :value="key"
          />
        </ElSelect>
      </ElFormItem>

      <ElFormItem label="訂單日期">
        <ElDatePicker
          :model-value="props.filters.dateRange"
          type="daterange"
          range-separator="至"
          start-placeholder="開始日期"
          end-placeholder="結束日期"
          format="YYYY-MM-DD"
          value-format="YYYY-MM-DD"
          style="width: 240px"
          @update:model-value="(v: [string, string] | null) => updateFilter('dateRange', v)"
        />
      </ElFormItem>

      <ElFormItem>
        <ElButton type="primary" :icon="Search" @click="handleSearch">
          查詢
        </ElButton>
        <ElButton :icon="Refresh" @click="handleReset">
          重置
        </ElButton>
      </ElFormItem>
    </ElForm>
  </div>
</template>

<style scoped lang="scss">
.filter-container {
  margin-bottom: 20px;
}
</style>

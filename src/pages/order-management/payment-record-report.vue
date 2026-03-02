<script setup lang="ts">
/**
 * 付款紀錄報表頁面
 *
 * @module order-management/payment-record-report
 * @description 提供依建立時間區間查詢付款紀錄、表格瀏覽與列印功能
 */
import type { PaymentMethod } from "@/pages/order-management/types"
import { Download, Printer, Refresh, Search } from "@element-plus/icons-vue"
import {
  ElButton,
  ElCard,
  ElDatePicker,
  ElForm,
  ElFormItem,
  ElOption,
  ElSelect,
  ElTable,
  ElTableColumn
} from "element-plus"
import BrandBanner from "@/pages/order-management/components/BrandBanner.vue"
import { usePaymentRecordReport } from "@/pages/order-management/composables/usePaymentRecordReport"
import { PAYMENT_METHOD_LABELS } from "@/pages/order-management/types"
import "@/common/assets/fonts/fonts.css"

defineOptions({ name: "PaymentRecordReport" })

const {
  records,
  loading,
  exporting,
  dateRange,
  paymentMethodFilter,
  totalAmount,
  hasRecords,
  handleSearch,
  handleReset,
  handlePrint,
  handleExport
} = usePaymentRecordReport()

/** 付款方式選項（含「全部」空值選項） */
const paymentMethodOptions = Object.entries(PAYMENT_METHOD_LABELS).map(([value, label]) => ({
  value: value as PaymentMethod,
  label
}))

/**
 * 格式化日期時間
 */
function formatDateTime(dateStr: string): string {
  if (!dateStr) return "—"
  const date = new Date(dateStr)
  return date.toLocaleString("zh-TW", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
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
  <div class="app-container">
    <!-- 搜尋區（列印時隱藏） -->
    <ElCard shadow="never" class="no-print">
      <ElForm inline @submit.prevent="handleSearch">
        <ElFormItem label="建立時間區間" required>
          <ElDatePicker
            v-model="dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="起始日期"
            end-placeholder="結束日期"
            value-format="YYYY-MM-DD"
            style="width: 260px"
          />
        </ElFormItem>

        <ElFormItem label="付款方式">
          <ElSelect
            v-model="paymentMethodFilter"
            placeholder="全部"
            clearable
            style="width: 130px"
          >
            <ElOption
              v-for="opt in paymentMethodOptions"
              :key="opt.value"
              :label="opt.label"
              :value="opt.value"
            />
          </ElSelect>
        </ElFormItem>

        <ElFormItem>
          <ElButton
            type="primary"
            :icon="Search"
            :loading="loading"
            native-type="submit"
            @click="handleSearch"
          >
            搜尋
          </ElButton>
          <ElButton :icon="Refresh" @click="handleReset">
            重設
          </ElButton>
          <ElButton
            :icon="Download"
            :loading="exporting"
            :disabled="!hasRecords"
            @click="handleExport"
          >
            匯出 Excel
          </ElButton>
          <ElButton
            :icon="Printer"
            :disabled="!hasRecords"
            @click="handlePrint"
          >
            列印
          </ElButton>
        </ElFormItem>
      </ElForm>
    </ElCard>

    <!-- 列印表頭（僅列印時顯示） -->
    <div class="print-only print-header">
      <BrandBanner />
      <h2 class="print-title">
        付款紀錄報表
      </h2>
      <p v-if="dateRange" class="print-date-range">
        查詢區間：{{ dateRange[0] }} ~ {{ dateRange[1] }}
        <span v-if="paymentMethodFilter">
          ｜付款方式：{{ PAYMENT_METHOD_LABELS[paymentMethodFilter as PaymentMethod] }}
        </span>
      </p>
    </div>

    <!-- 資料表格 -->
    <ElCard shadow="never" class="mt-4">
      <ElTable
        v-loading="loading"
        :data="records"
        border
        stripe
        show-summary
        :summary-method="() => ['合計', '', formatCurrency(totalAmount), '', '']"
        empty-text="暫無資料，請輸入日期區間後點擊搜尋"
      >
        <ElTableColumn label="訂單編號" prop="orderNumber" min-width="160" />
        <ElTableColumn label="付款方式" min-width="120">
          <template #default="{ row }">
            {{ PAYMENT_METHOD_LABELS[row.paymentMethod as PaymentMethod] ?? row.paymentMethod }}
          </template>
        </ElTableColumn>
        <ElTableColumn label="付款金額" min-width="130" align="right">
          <template #default="{ row }">
            {{ formatCurrency(row.paymentAmount) }}
          </template>
        </ElTableColumn>
        <ElTableColumn label="銀行末五碼" prop="bankAccountLastFive" min-width="110" align="center">
          <template #default="{ row }">
            {{ row.bankAccountLastFive ?? "—" }}
          </template>
        </ElTableColumn>
        <ElTableColumn label="建立時間" min-width="160">
          <template #default="{ row }">
            {{ formatDateTime(row.createdAt) }}
          </template>
        </ElTableColumn>
      </ElTable>
    </ElCard>
  </div>
</template>

<style scoped lang="scss">
.mt-4 {
  margin-top: 16px;
}

/* 列印專屬表頭（平常隱藏） */
.print-only {
  display: none;
}

.print-header {
  margin-bottom: 16px;
}

.print-title {
  margin: 8px 0 4px;
  font-size: 18px;
  font-weight: 600;
  text-align: center;
}

.print-date-range {
  text-align: center;
  font-size: 13px;
  color: #666;
  margin-bottom: 12px;
}

/* 列印樣式 */
@media print {
  /* 隱藏搜尋區與操作按鈕 */
  :global(.no-print) {
    display: none !important;
  }

  /* 顯示列印表頭 */
  .print-only {
    display: block;
  }

  /* 確保表格完整顯示 */
  :global(.el-card) {
    box-shadow: none !important;
    border: none !important;
  }

  :global(.el-table) {
    font-size: 12px;
  }
}
</style>

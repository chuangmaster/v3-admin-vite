<script setup lang="ts">
import type { FormInstance } from "element-plus"
/**
 * 付款記錄面板元件
 *
 * @module order-management/components/PaymentRecordsPanel
 * @description 顯示付款歷程、累積金額、新增/修改/刪除付款記錄
 */
import type { PaymentRecordFormData, PaymentStatus } from "@/pages/order-management/types"
import { Delete, Edit, Plus } from "@element-plus/icons-vue"
import {
  ElButton,
  ElDatePicker,
  ElDescriptions,
  ElDescriptionsItem,
  ElDialog,
  ElForm,
  ElFormItem,
  ElInput,
  ElInputNumber,
  ElOption,
  ElSelect,
  ElTable,
  ElTableColumn,
  ElTag
} from "element-plus"
import { computed, ref } from "vue"
import { usePaymentRecords } from "@/pages/order-management/composables/usePaymentRecords"
import {
  PAYMENT_METHOD_LABELS,
  PAYMENT_RECORD_RULES,
  PAYMENT_STATUS_COLORS,
  PAYMENT_STATUS_LABELS,
  PaymentMethod
} from "@/pages/order-management/types"

defineOptions({ name: "PaymentRecordsPanel" })

const props = defineProps<Props>()

const emit = defineEmits<Emits>()

interface Props {
  /** 訂單 ID */
  orderId: string
  /** 訂單總金額 */
  totalAmount: number
  /** 付款狀態 */
  paymentStatus: PaymentStatus
  /** 付款記錄列表 */
  paymentRecords: import("@/pages/order-management/types").PaymentRecord[]
  /** 是否禁用所有操作（訂單已取消/已完成） */
  disabled?: boolean
}

interface Emits {
  (e: "update"): void
}

const {
  loading,
  addDialogVisible,
  editDialogVisible,
  editingRecord,
  paidAmount,
  remainingAmount,
  isFullyPaid,
  initPaymentRecords,
  addPaymentRecord,
  updatePaymentRecordBank,
  deletePaymentRecord,
  openAddDialog,
  openEditDialog
} = usePaymentRecords()

// 初始化資料
initPaymentRecords(props.paymentRecords, props.totalAmount, props.paymentStatus)

/** 新增付款表單 ref */
const addFormRef = ref<FormInstance>()

/** 新增付款表單資料 */
const addFormData = ref<PaymentRecordFormData>({
  paymentDate: "",
  paymentAmount: 0,
  paymentMethod: PaymentMethod.FACE_TO_FACE_CASH,
  bankAccountLastFive: ""
})

/** 修改銀行末五碼表單 */
const editBankValue = ref("")

/** 是否顯示銀行末五碼欄位 */
const showBankField = computed(() => {
  return addFormData.value.paymentMethod === PaymentMethod.BANK_TRANSFER
})

/**
 * 重置新增表單
 */
function resetAddForm() {
  addFormData.value = {
    paymentDate: "",
    paymentAmount: 0,
    paymentMethod: PaymentMethod.FACE_TO_FACE_CASH,
    bankAccountLastFive: ""
  }
  addFormRef.value?.resetFields()
}

/**
 * 處理新增付款記錄
 */
async function handleAddSubmit() {
  if (!addFormRef.value) return

  try {
    await addFormRef.value.validate()
  } catch {
    return
  }

  const success = await addPaymentRecord(props.orderId, addFormData.value, () => {
    emit("update")
  })

  if (success) {
    resetAddForm()
  }
}

/**
 * 處理修改銀行末五碼
 */
async function handleEditSubmit() {
  if (!editingRecord.value) return

  await updatePaymentRecordBank(
    props.orderId,
    editingRecord.value.id,
    editBankValue.value,
    () => emit("update")
  )
}

/**
 * 處理刪除付款記錄
 * @param recordId - 付款記錄 ID
 */
async function handleDeleteRecord(recordId: string) {
  await deletePaymentRecord(props.orderId, recordId, () => {
    emit("update")
  })
}

/**
 * 開啟修改對話框
 */
function handleOpenEdit(record: import("@/pages/order-management/types").PaymentRecord) {
  editBankValue.value = record.bankAccountLastFive || ""
  openEditDialog(record)
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
</script>

<template>
  <div class="payment-records-panel">
    <div class="panel-header">
      <span class="panel-title">付款記錄</span>
      <ElButton
        type="primary"
        :icon="Plus"
        size="small"
        :disabled="isFullyPaid || props.disabled"
        @click="openAddDialog"
      >
        新增付款
      </ElButton>
    </div>

    <!-- 金額摘要 -->
    <ElDescriptions :column="3" border size="small" class="amount-summary">
      <ElDescriptionsItem label="訂單總金額">
        {{ formatCurrency(props.totalAmount) }}
      </ElDescriptionsItem>
      <ElDescriptionsItem label="累積已付">
        <span class="paid-amount">{{ formatCurrency(paidAmount) }}</span>
      </ElDescriptionsItem>
      <ElDescriptionsItem label="剩餘應付">
        <span :class="{ 'remaining-zero': remainingAmount === 0 }">
          {{ formatCurrency(remainingAmount) }}
        </span>
      </ElDescriptionsItem>
    </ElDescriptions>

    <!-- 付款記錄表格 -->
    <ElTable
      :data="props.paymentRecords"
      border
      size="small"
      empty-text="尚無付款記錄"
      class="records-table"
    >
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

      <ElTableColumn label="建立時間" min-width="110">
        <template #default="{ row }">
          {{ formatDate(row.createdAt) }}
        </template>
      </ElTableColumn>

      <ElTableColumn label="操作" width="100" align="center" fixed="right">
        <template #default="{ row }">
          <ElButton
            v-if="row.paymentMethod === PaymentMethod.BANK_TRANSFER"
            :icon="Edit"
            size="small"
            link
            :disabled="props.disabled"
            @click="handleOpenEdit(row)"
          />
          <ElButton
            :icon="Delete"
            size="small"
            type="danger"
            link
            :disabled="props.disabled"
            @click="handleDeleteRecord(row.id)"
          />
        </template>
      </ElTableColumn>
    </ElTable>

    <!-- 付款狀態標籤 -->
    <div class="payment-status-row">
      <span>當前付款狀態：</span>
      <ElTag :type="PAYMENT_STATUS_COLORS[props.paymentStatus]">
        {{ PAYMENT_STATUS_LABELS[props.paymentStatus] }}
      </ElTag>
    </div>

    <!-- 新增付款記錄對話框 -->
    <ElDialog
      v-model="addDialogVisible"
      title="新增付款記錄"
      width="500px"
      :close-on-click-modal="false"
      @close="resetAddForm"
    >
      <ElForm
        ref="addFormRef"
        :model="addFormData"
        :rules="PAYMENT_RECORD_RULES"
        label-width="100px"
      >
        <ElFormItem label="付款日期" prop="paymentDate">
          <ElDatePicker
            v-model="addFormData.paymentDate"
            type="date"
            placeholder="請選擇付款日期"
            format="YYYY-MM-DD"
            style="width: 100%"
          />
        </ElFormItem>

        <ElFormItem label="付款金額" prop="paymentAmount">
          <ElInputNumber
            v-model="addFormData.paymentAmount"
            :min="0.01"
            :max="remainingAmount"
            :precision="0"
            :controls="false"
            placeholder="請輸入付款金額"
            style="width: 100%"
          />
          <div class="field-hint">
            剩餘應付：{{ formatCurrency(remainingAmount) }}
          </div>
        </ElFormItem>

        <ElFormItem label="付款方式" prop="paymentMethod">
          <ElSelect v-model="addFormData.paymentMethod" placeholder="請選擇付款方式">
            <ElOption
              v-for="(label, key) in PAYMENT_METHOD_LABELS"
              :key="key"
              :label="label"
              :value="key"
            />
          </ElSelect>
        </ElFormItem>

        <ElFormItem
          v-if="showBankField"
          label="銀行末五碼"
          prop="bankAccountLastFive"
        >
          <ElInput
            v-model="addFormData.bankAccountLastFive"
            placeholder="請輸入銀行帳戶末五碼"
            maxlength="5"
          />
        </ElFormItem>
      </ElForm>

      <template #footer>
        <ElButton @click="addDialogVisible = false">
          取消
        </ElButton>
        <ElButton type="primary" :loading="loading" @click="handleAddSubmit">
          新增
        </ElButton>
      </template>
    </ElDialog>

    <!-- 修改銀行末五碼對話框 -->
    <ElDialog
      v-model="editDialogVisible"
      title="修改銀行末五碼"
      width="400px"
      :close-on-click-modal="false"
    >
      <ElForm label-width="100px">
        <ElFormItem label="銀行末五碼">
          <ElInput
            v-model="editBankValue"
            placeholder="請輸入銀行帳戶末五碼"
            maxlength="5"
          />
        </ElFormItem>
      </ElForm>

      <template #footer>
        <ElButton @click="editDialogVisible = false">
          取消
        </ElButton>
        <ElButton type="primary" :loading="loading" @click="handleEditSubmit">
          儲存
        </ElButton>
      </template>
    </ElDialog>
  </div>
</template>

<style scoped lang="scss">
.payment-records-panel {
  margin-top: 20px;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.panel-title {
  font-weight: 600;
  font-size: 14px;
}

.amount-summary {
  margin-bottom: 12px;
}

.paid-amount {
  color: var(--el-color-success);
  font-weight: 600;
}

.remaining-zero {
  color: var(--el-color-success);
  font-weight: 600;
}

.records-table {
  margin-bottom: 12px;
}

.payment-status-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 8px;
}

.field-hint {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  margin-top: 4px;
}
</style>

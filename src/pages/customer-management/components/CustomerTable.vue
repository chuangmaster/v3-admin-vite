<!--
  客戶列表表格元件

  功能:
  - 顯示客戶列表資料
  - 支援身分證字號遮罩顯示
  - 提供編輯、刪除操作按鈕
  - 權限控制
-->
<script lang="ts" setup>
import type { Customer } from "../types"
import { Delete, Edit } from "@element-plus/icons-vue"
import { ElButton, ElTable, ElTableColumn, ElTag } from "element-plus"
import { maskIdNumber } from "@/common/utils/id-number-validator"

interface Props {
  /** 客戶列表資料 */
  data: Customer[]
  /** 載入中狀態 */
  loading?: boolean
}

interface Emits {
  /** 編輯客戶 */
  (e: "edit", customer: Customer): void
  /** 刪除客戶 */
  (e: "delete", customer: Customer): void
}

const props = withDefaults(defineProps<Props>(), {
  loading: false
})

const emit = defineEmits<Emits>()

/** 格式化日期時間 */
function formatDateTime(dateStr: string | undefined): string {
  if (!dateStr) return "-"
  return new Date(dateStr).toLocaleString("zh-TW", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  })
}

/** 處理編輯 */
function handleEdit(customer: Customer) {
  emit("edit", customer)
}

/** 處理刪除 */
function handleDelete(customer: Customer) {
  emit("delete", customer)
}
</script>

<template>
  <ElTable
    :data="props.data"
    :loading="props.loading"
    stripe
    border
    style="width: 100%"
  >
    <ElTableColumn prop="name" label="姓名" width="120" />

    <ElTableColumn prop="idNumber" label="身分證字號" width="150">
      <template #default="{ row }">
        {{ maskIdNumber(row.idNumber) }}
      </template>
    </ElTableColumn>

    <ElTableColumn prop="phoneNumber" label="電話" width="130" />

    <ElTableColumn prop="email" label="電子郵件" min-width="180" />

    <ElTableColumn prop="residentialAddress" label="地址" min-width="200" show-overflow-tooltip />

    <ElTableColumn prop="status" label="狀態" width="80" align="center">
      <template #default="{ row }">
        <ElTag v-if="row.isDeleted" type="danger" size="small">
          已刪除
        </ElTag>
        <ElTag v-else type="success" size="small">
          正常
        </ElTag>
      </template>
    </ElTableColumn>

    <ElTableColumn prop="createdAt" label="建立時間" width="160">
      <template #default="{ row }">
        {{ formatDateTime(row.createdAt) }}
      </template>
    </ElTableColumn>

    <ElTableColumn label="操作" width="150" align="center" fixed="right">
      <template #default="{ row }">
        <ElButton
          v-permission="['customer.update']"
          :icon="Edit"
          type="primary"
          size="small"
          link
          @click="handleEdit(row)"
        >
          編輯
        </ElButton>
        <ElButton
          v-permission="['customer.delete']"
          :icon="Delete"
          type="danger"
          size="small"
          link
          :disabled="row.isDeleted"
          @click="handleDelete(row)"
        >
          刪除
        </ElButton>
      </template>
    </ElTableColumn>
  </ElTable>
</template>

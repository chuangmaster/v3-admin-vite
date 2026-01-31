<!--
  客戶等級歷程表格元件

  功能:
  - 使用 el-table 展示等級歷程記錄
  - 欄位：等級、開始日期、結束日期、狀態、建立時間、操作
  - 支援排序（按 startDate 降序）
  - 狀態標籤顯示（Active=success, Expired=info, Upcoming=warning）
  - 操作按鈕：編輯、終止（含權限控制）
  - 空資料狀態處理

  @module customer-management/components/CustomerLevelTable
-->
<script lang="ts" setup>
import type { CustomerLevelPeriodResponse } from "../types"
import { Edit, Remove } from "@element-plus/icons-vue"
import { ElButton, ElEmpty, ElTable, ElTableColumn, ElTag } from "element-plus"
import { computed } from "vue"
import { formatDateTime } from "@/common/utils/datetime"
import { CustomerLevelStatus } from "../types"

interface Props {
  /** 等級歷程記錄列表 */
  data: CustomerLevelPeriodResponse[]
  /** 載入中狀態 */
  loading?: boolean
}

interface Emits {
  /** 編輯等級記錄 */
  (e: "edit", record: CustomerLevelPeriodResponse): void
  /** 終止等級記錄 */
  (e: "terminate", record: CustomerLevelPeriodResponse): void
}

const props = withDefaults(defineProps<Props>(), {
  loading: false
})

const emit = defineEmits<Emits>()

/** 是否有資料 */
const hasData = computed(() => props.data.length > 0)

/**
 * 取得狀態標籤類型
 * @param status - 等級狀態
 * @returns Element Plus Tag 類型
 */
function getStatusTagType(status: CustomerLevelStatus): "success" | "info" | "warning" {
  switch (status) {
    case CustomerLevelStatus.Active:
      return "success"
    case CustomerLevelStatus.Expired:
      return "info"
    case CustomerLevelStatus.Upcoming:
      return "warning"
    default:
      return "info"
  }
}

/**
 * 取得狀態顯示文字
 * @param status - 等級狀態
 * @returns 狀態文字
 */
function getStatusText(status: CustomerLevelStatus): string {
  switch (status) {
    case CustomerLevelStatus.Active:
      return "進行中"
    case CustomerLevelStatus.Expired:
      return "已過期"
    case CustomerLevelStatus.Upcoming:
      return "即將生效"
    default:
      return status
  }
}

/**
 * 格式化日期（僅顯示日期部分）
 * @param dateStr - ISO 8601 日期字串
 * @returns 格式化後的日期
 */
function formatDate(dateStr: string): string {
  return formatDateTime(dateStr, "YYYY-MM-DD")
}

/**
 * 判斷記錄是否可編輯
 * @param record - 等級記錄
 * @returns 是否可編輯（Active 或 Upcoming 可編輯）
 */
function canEdit(record: CustomerLevelPeriodResponse): boolean {
  return record.status === CustomerLevelStatus.Active || record.status === CustomerLevelStatus.Upcoming
}

/**
 * 判斷記錄是否可終止
 * @param record - 等級記錄
 * @returns 是否可終止（僅 Active 可終止）
 */
function canTerminate(record: CustomerLevelPeriodResponse): boolean {
  return record.status === CustomerLevelStatus.Active
}

/** 處理編輯 */
function handleEdit(record: CustomerLevelPeriodResponse) {
  emit("edit", record)
}

/** 處理終止 */
function handleTerminate(record: CustomerLevelPeriodResponse) {
  emit("terminate", record)
}
</script>

<template>
  <div class="customer-level-table">
    <!-- 有資料時顯示表格 -->
    <ElTable
      v-if="hasData"
      v-loading="loading"
      :data="data"
      border
      stripe
      :default-sort="{ prop: 'startDate', order: 'descending' }"
    >
      <ElTableColumn prop="level" label="等級" width="100" sortable>
        <template #default="{ row }">
          <ElTag type="warning" size="small">
            {{ row.level }}
          </ElTag>
        </template>
      </ElTableColumn>

      <ElTableColumn prop="startDate" label="開始日期" width="120" sortable>
        <template #default="{ row }">
          {{ formatDate(row.startDate) }}
        </template>
      </ElTableColumn>

      <ElTableColumn prop="endDate" label="結束日期" width="120" sortable>
        <template #default="{ row }">
          {{ formatDate(row.endDate) }}
        </template>
      </ElTableColumn>

      <ElTableColumn prop="status" label="狀態" width="100">
        <template #default="{ row }">
          <ElTag :type="getStatusTagType(row.status)" size="small">
            {{ getStatusText(row.status) }}
          </ElTag>
        </template>
      </ElTableColumn>

      <ElTableColumn prop="createdAt" label="建立時間" width="180" sortable>
        <template #default="{ row }">
          {{ formatDateTime(row.createdAt) }}
        </template>
      </ElTableColumn>

      <ElTableColumn label="操作" width="150" fixed="right">
        <template #default="{ row }">
          <ElButton
            v-permission="['customer.level.update']"
            :icon="Edit"
            type="primary"
            size="small"
            link
            :disabled="!canEdit(row)"
            @click="handleEdit(row)"
          >
            編輯
          </ElButton>
          <ElButton
            v-permission="['customer.level.terminate']"
            :icon="Remove"
            type="danger"
            size="small"
            link
            :disabled="!canTerminate(row)"
            @click="handleTerminate(row)"
          >
            終止
          </ElButton>
        </template>
      </ElTableColumn>
    </ElTable>

    <!-- 無資料時顯示空狀態 -->
    <ElEmpty
      v-else-if="!loading"
      description="尚無等級記錄"
    />
  </div>
</template>

<style lang="scss" scoped>
.customer-level-table {
  width: 100%;
}
</style>

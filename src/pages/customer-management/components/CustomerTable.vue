<!--
  客戶列表表格元件

  功能:
  - 顯示客戶列表資料
  - 支援身分證字號遮罩顯示
  - 顯示等級狀態徽章
  - 提供編輯、刪除、等級管理操作按鈕
  - 權限控制
-->
<script lang="ts" setup>
import type { Customer } from "../types"

import { Delete, Edit, Medal, Star } from "@element-plus/icons-vue"
import { ElButton, ElTag } from "element-plus"
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
  /** 開啟等級設定 */
  (e: "setLevel", customer: Customer): void
  /** 查看等級歷程 */
  (e: "viewHistory", customer: Customer): void
}

const props = withDefaults(defineProps<Props>(), {
  loading: false
})

const emit = defineEmits<Emits>()

/**
 * 判斷客戶是否有有效等級
 * @param customer - 客戶資料
 * @returns 是否有有效等級（後端已計算）
 */
function hasActiveLevel(customer: Customer): boolean {
  return customer.isCurrentlyAtLevel
}

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

/** 處理等級設定 */
function handleSetLevel(customer: Customer) {
  emit("setLevel", customer)
}

/** 處理查看等級歷程 */
function handleViewHistory(customer: Customer) {
  emit("viewHistory", customer)
}
</script>

<template>
  <el-table
    v-loading="props.loading"
    :data="props.data"
    border
    stripe
  >
    <el-table-column prop="name" label="姓名" width="100" fixed="left" />

    <el-table-column label="等級狀態" width="100">
      <template #default="{ row }">
        <ElTag
          v-if="hasActiveLevel(row)"
          type="warning"
          effect="dark"
          size="small"
        >
          <el-icon class="mr-1">
            <Star />
          </el-icon>
          {{ row.activePeriod?.level }}
        </ElTag>
        <span v-else class="text-gray-400">-</span>
      </template>
    </el-table-column>

    <el-table-column prop="idNumber" label="身分證字號" width="140">
      <template #default="{ row }">
        {{ maskIdNumber(row.idNumber) }}
      </template>
    </el-table-column>

    <el-table-column prop="phoneNumber" label="電話" width="120" />

    <el-table-column prop="email" label="電子郵件" width="200" show-overflow-tooltip>
      <template #default="{ row }">
        {{ row.email || '-' }}
      </template>
    </el-table-column>

    <el-table-column prop="lineId" label="LINE ID" width="120" show-overflow-tooltip>
      <template #default="{ row }">
        {{ row.lineId || '-' }}
      </template>
    </el-table-column>

    <el-table-column prop="residentialAddress" label="地址" min-width="250" show-overflow-tooltip />

    <el-table-column prop="createdAt" label="建立時間" width="180">
      <template #default="{ row }">
        {{ formatDateTime(row.createdAt) }}
      </template>
    </el-table-column>

    <el-table-column label="操作" width="280" fixed="right">
      <template #default="{ row }">
        <ElButton
          v-permission="['customer.level.create']"
          :icon="Medal"
          type="warning"
          size="small"
          link
          @click="handleSetLevel(row)"
        >
          會員等級
        </ElButton>
        <ElButton
          v-permission="['customer.level.view']"
          type="info"
          size="small"
          link
          @click="handleViewHistory(row)"
        >
          VIP 歷程
        </ElButton>
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
    </el-table-column>
  </el-table>
</template>

<style lang="scss" scoped>
.mr-1 {
  margin-right: 4px;
}

.text-gray-400 {
  color: #9ca3af;
}
</style>

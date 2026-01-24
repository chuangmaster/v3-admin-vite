<script setup lang="ts">
import type { User } from "../types"
import { USER_PERMISSIONS } from "@@/constants/permissions"
import dayjs from "dayjs"

interface Props {
  /** 用戶列表資料 */
  data: User[]
  /** 載入狀態 */
  loading: boolean
}

interface Emits {
  (e: "edit", user: User): void
  (e: "delete", user: User): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

/** 狀態選項 */
const statusOptions = [
  { label: "啟用", value: "active", type: "success" },
  { label: "已停用", value: "inactive", type: "info" }
]

/**
 * 根據狀態值取得對應的 tag 類型
 * @param status - 用戶狀態
 * @returns 狀態 tag 類型
 */
function getStatusType(status: string): "success" | "warning" | "info" | "danger" {
  return statusOptions.find(opt => opt.value === status)?.type as "success" | "info" || "info"
}

/**
 * 根據狀態值取得對應的顯示文字
 * @param status - 用戶狀態
 * @returns 狀態顯示文字
 */
function getStatusLabel(status: string): string {
  return statusOptions.find(opt => opt.value === status)?.label || status
}

/**
 * 處理編輯按鈕點擊
 */
function handleEdit(user: User): void {
  emit("edit", user)
}

/**
 * 處理刪除按鈕點擊
 */
function handleDelete(user: User): void {
  emit("delete", user)
}

defineExpose({
  // 可根據需要暴露方法給父層
})
</script>

<template>
  <el-table :data="props.data" v-loading="props.loading" stripe>
    <el-table-column prop="account" label="帳號" min-width="150" show-overflow-tooltip />
    <el-table-column prop="displayName" label="顯示名稱" min-width="150" show-overflow-tooltip />
    <el-table-column prop="status" label="狀態" min-width="100">
      <template #default="{ row }">
        <el-tag :type="getStatusType(row.status)">
          {{ getStatusLabel(row.status) }}
        </el-tag>
      </template>
    </el-table-column>
    <el-table-column prop="createdAt" label="建立時間" width="180">
      <template #default="{ row }">
        {{ dayjs(row.createdAt).format("YYYY-MM-DD HH:mm:ss") }}
      </template>
    </el-table-column>
    <el-table-column prop="updatedAt" label="最後更新時間" width="180">
      <template #default="{ row }">
        {{ row.updatedAt ? dayjs(row.updatedAt).format("YYYY-MM-DD HH:mm:ss") : "-" }}
      </template>
    </el-table-column>
    <el-table-column label="操作" width="180" fixed="right">
      <template #default="{ row }">
        <el-button
          v-permission="[USER_PERMISSIONS.UPDATE]"
          type="primary"
          size="small"
          link
          @click="handleEdit(row)"
        >
          編輯
        </el-button>
        <el-button
          v-permission="[USER_PERMISSIONS.DELETE]"
          type="danger"
          size="small"
          link
          @click="handleDelete(row)"
        >
          刪除
        </el-button>
      </template>
    </el-table-column>
  </el-table>
</template>

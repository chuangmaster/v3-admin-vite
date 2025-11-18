<script setup lang="ts">
import type { Permission } from "../types"
import { ref } from "vue"

defineProps<{
  permissions: Permission[]
  loading: boolean
}>()

const emit = defineEmits<{
  "edit": [permission: Permission]
  "delete": [permission: Permission]
  "selection-change": [permissions: Permission[]]
}>()

/** 表格 ref */
const tableRef = ref()

/** 已選擇的權限列表 */
const selectedPermissions = ref<Permission[]>([])

/**
 * 處理選擇變更
 */
function handleSelectionChange(selection: Permission[]): void {
  selectedPermissions.value = selection
  // eslint-disable-next-line vue/custom-event-name-casing
  emit("selection-change", selection)
}

/**
 * 處理編輯按鈕點擊
 */
function handleEdit(permission: Permission): void {
  emit("edit", permission)
}

/**
 * 處理刪除按鈕點擊
 */
function handleDelete(permission: Permission): void {
  emit("delete", permission)
}

/**
 * 獲取已選擇的權限列表
 */
function getSelectedPermissions(): Permission[] {
  return selectedPermissions.value
}

/**
 * 清空選擇
 */
function clearSelection(): void {
  tableRef.value?.clearSelection()
}

/**
 * 刷新表格
 */
function refresh(): void {
  clearSelection()
}

defineExpose({
  getSelectedPermissions,
  clearSelection,
  refresh
})
</script>

<template>
  <el-table
    ref="tableRef"
    v-loading="loading"
    :data="permissions"
    stripe
    style="width: 100%"
    @selection-change="handleSelectionChange"
  >
    <!-- 選擇列 -->
    <el-table-column type="selection" width="50" />

    <!-- ID 列 -->
    <el-table-column prop="id" label="ID" width="180" show-overflow-tooltip />

    <!-- 名稱列 -->
    <el-table-column prop="name" label="權限名稱" min-width="150" show-overflow-tooltip />

    <!-- 代碼列 -->
    <el-table-column prop="code" label="權限代碼" min-width="150" show-overflow-tooltip />

    <!-- 描述列 -->
    <el-table-column prop="description" label="描述" min-width="200" show-overflow-tooltip />

    <!-- 使用情況列 -->
    <el-table-column label="使用情況" width="120" align="center">
      <template #default="{ row }">
        <el-tag v-if="row.roleCount && row.roleCount > 0" type="warning">
          {{ row.roleCount }} 個角色使用中
        </el-tag>
        <el-tag v-else type="info">
          未使用
        </el-tag>
      </template>
    </el-table-column>

    <!-- 系統權限標記列 -->
    <el-table-column label="系統權限" width="100" align="center">
      <template #default="{ row }">
        <el-tag v-if="row.isSystem" type="success">
          是
        </el-tag>
        <span v-else>-</span>
      </template>
    </el-table-column>

    <!-- 操作列 -->
    <el-table-column label="操作" width="180" fixed="right" align="center">
      <template #default="{ row }">
        <el-button link type="primary" size="small" @click="handleEdit(row)">
          編輯
        </el-button>
        <el-button link type="danger" size="small" @click="handleDelete(row)">
          刪除
        </el-button>
      </template>
    </el-table-column>

    <!-- 空狀態 -->
    <template #empty>
      <el-empty description="暫無權限資料" />
    </template>
  </el-table>
</template>

<style scoped lang="scss">
:deep(.el-table) {
  .el-table__row {
    &:hover {
      background-color: var(--el-table-row-hover-bg-color);
    }
  }
}
</style>

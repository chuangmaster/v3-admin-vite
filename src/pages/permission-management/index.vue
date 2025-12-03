<script setup lang="ts">
import type { Permission } from "./types"
import { PERMISSION_PERMISSIONS } from "@@/constants/permissions"
import { Delete, Download, Plus, RefreshRight, Search } from "@element-plus/icons-vue"
import { ElMessage } from "element-plus"
import { nextTick, onMounted, ref } from "vue"
import PermissionForm from "./components/PermissionForm.vue"
import PermissionTable from "./components/PermissionTable.vue"
import { useExportExcel } from "./composables/useExportExcel"
import { usePermissionManagement } from "./composables/usePermissionManagement"

const {
  permissions,
  loading,
  pagination,
  searchKeyword,
  fetchPermissions,
  handleDelete: handleDeletePermission,
  handleBatchDelete: handleBatchDeletePermissions,
  resetSearch
} = usePermissionManagement()

const { exportPermissions } = useExportExcel()

const dialogVisible = ref(false)
const dialogTitle = ref("新增權限")
const permissionTableRef = ref<InstanceType<typeof PermissionTable>>()
const permissionFormRef = ref<InstanceType<typeof PermissionForm>>()
const selectedPermissions = ref<Permission[]>([])

function handleCreate(): void {
  dialogTitle.value = "新增權限"
  permissionFormRef.value?.resetForm()
  dialogVisible.value = true
}

/**
 * 處理編輯權限
 */
function handleEdit(permission: Permission): void {
  dialogTitle.value = "編輯權限"
  dialogVisible.value = true
  nextTick(() => {
    permissionFormRef.value?.loadPermission(permission)
  })
}

async function handleDelete(permission: Permission): Promise<void> {
  await handleDeletePermission(permission)
}

async function handleBatchDelete(): Promise<void> {
  await handleBatchDeletePermissions(selectedPermissions.value)
  permissionTableRef.value?.clearSelection()
}

function handlePaginationChange(): void {
  fetchPermissions()
}

function handleReset(): void {
  resetSearch()
  fetchPermissions()
}

function handleSearchClear(): void {
  pagination.value.pageNumber = 1
  fetchPermissions()
}

function handleExport(): void {
  exportPermissions(permissions.value)
  ElMessage.success("匯出成功")
}

function handleSelectionChange(selected: Permission[]): void {
  selectedPermissions.value = selected
}

function handleFormSuccess(): void {
  dialogVisible.value = false
  fetchPermissions()
}

function handleDialogClose(): void {
  permissionFormRef.value?.resetForm()
}

function checkPermission(): void {
  // 檢查是否有查看權限
  const hasReadPermission = !!PERMISSION_PERMISSIONS.READ
  if (!hasReadPermission) {
    ElMessage.error("無權限訪問此頁面")
  }
}

onMounted(() => {
  checkPermission()
  fetchPermissions()
})
</script>

<template>
  <div class="permission-management-page">
    <!-- 工具列 -->
    <div class="toolbar">
      <el-input
        v-model="searchKeyword"
        placeholder="搜尋權限名稱或代碼..."
        clearable
        style="width: 250px"
        @keyup.enter="fetchPermissions"
        @clear="handleSearchClear"
      >
        <template #prefix>
          <el-icon><Search /></el-icon>
        </template>
      </el-input>

      <div class="toolbar-buttons">
        <el-button type="primary" :icon="Plus" @click="handleCreate">
          新增權限
        </el-button>
        <el-button
          v-if="selectedPermissions.length > 0"
          type="danger"
          :icon="Delete"
          @click="handleBatchDelete"
        >
          批次刪除 ({{ selectedPermissions.length }})
        </el-button>
        <el-button :icon="Download" @click="handleExport">
          匯出報表
        </el-button>
        <el-button :icon="RefreshRight" @click="handleReset">
          重置
        </el-button>
      </div>
    </div>

    <!-- 表格卡片 -->
    <el-card class="table-card">
      <template #header>
        <span class="card-title">權限列表</span>
      </template>

      <PermissionTable
        ref="permissionTableRef"
        :permissions="permissions"
        :loading="loading"
        @edit="handleEdit"
        @delete="handleDelete"
        @selection-change="handleSelectionChange"
      />

      <!-- 分頁 -->
      <div class="pagination-container">
        <el-pagination
          v-model:current-page="pagination.pageNumber"
          v-model:page-size="pagination.pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="pagination.total"
          layout="total, sizes, prev, pager, next, jumper"
          @change="handlePaginationChange"
        />
      </div>
    </el-card>

    <!-- 新增/編輯對話框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="600px"
      @close="handleDialogClose"
    >
      <PermissionForm
        ref="permissionFormRef"
        @success="handleFormSuccess"
        @close="dialogVisible = false"
      />
    </el-dialog>
  </div>
</template>

<style scoped lang="scss">
.permission-management-page {
  padding: 20px;

  .toolbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
    gap: 16px;

    .toolbar-buttons {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
    }
  }

  .table-card {
    :deep(.el-card__header) {
      padding: 16px 20px;
      border-bottom: 1px solid var(--el-border-color-light);
      background-color: var(--el-fill-color-blank);
    }

    :deep(.el-card__body) {
      padding: 0;
    }

    .card-title {
      font-size: 16px;
      font-weight: 600;
      color: var(--el-text-color-primary);
    }
  }

  .pagination-container {
    display: flex;
    justify-content: flex-end;
    padding: 16px 20px;
    border-top: 1px solid var(--el-border-color-lighter);
    background-color: var(--el-fill-color-blank);
  }

  @media (max-width: 768px) {
    padding: 12px;

    .toolbar {
      flex-direction: column;
      align-items: stretch;
      gap: 12px;

      input {
        width: 100% !important;
      }

      .toolbar-buttons {
        justify-content: flex-start;
      }
    }
  }
}
</style>

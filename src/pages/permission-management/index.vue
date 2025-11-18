<script setup lang="ts">
import type { Permission } from "./types"
import { PERMISSION_PERMISSIONS } from "@@/constants/permissions"
import { Delete, Download, Plus, RefreshRight, Search } from "@element-plus/icons-vue"
import { ElIcon, ElMessage } from "element-plus"
import { onMounted, ref } from "vue"
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

/** 對話框可見性 */
const dialogVisible = ref(false)

/** 對話框標題 */
const dialogTitle = ref("新增權限")

/** 表單模式 */
const formMode = ref<"create" | "edit">("create")

/** PermissionTable 元件 ref */
const permissionTableRef = ref<InstanceType<typeof PermissionTable>>()

/** PermissionForm 元件 ref */
const permissionFormRef = ref<InstanceType<typeof PermissionForm>>()

/** 已選擇的權限列表 */
const selectedPermissions = ref<Permission[]>([])

/**
 * 處理新增權限按鈕點擊
 */
function handleCreate(): void {
  dialogTitle.value = "新增權限"
  formMode.value = "create"
  permissionFormRef.value?.resetForm()
  dialogVisible.value = true
}

/**
 * 處理編輯權限
 */
function handleEdit(permission: Permission): void {
  dialogTitle.value = "編輯權限"
  formMode.value = "edit"
  permissionFormRef.value?.loadPermission(permission)
  dialogVisible.value = true
}

/**
 * 處理刪除權限
 */
async function handleDelete(permission: Permission): Promise<void> {
  await handleDeletePermission(permission)
}

/**
 * 處理批次刪除權限
 */
async function handleBatchDelete(): Promise<void> {
  const ids = selectedPermissions.value.map(p => p.id)
  await handleBatchDeletePermissions(ids)
  permissionTableRef.value?.clearSelection()
}

/**
 * 處理分頁變更
 */
function handlePaginationChange(): void {
  fetchPermissions()
}

/**
 * 處理搜尋重置
 */
function handleReset(): void {
  resetSearch()
}

/**
 * 處理匯出 Excel
 */
function handleExport(): void {
  exportPermissions(permissions.value)
  ElMessage.success("匯出成功")
}

/**
 * 處理表單選擇變更
 */
function handleSelectionChange(selected: Permission[]): void {
  selectedPermissions.value = selected
}

/**
 * 處理表單成功提交
 */
function handleFormSuccess(): void {
  dialogVisible.value = false
  fetchPermissions()
}

/**
 * 處理對話框關閉
 */
function handleDialogClose(): void {
  permissionFormRef.value?.resetForm()
}

/**
 * 檢查權限
 */
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
  <div class="permission-management">
    <!-- 頁面標題 -->
    <div class="page-header">
      <h1>權限管理</h1>
    </div>

    <!-- 工具列 -->
    <div class="toolbar">
      <!-- 搜尋輸入 -->
      <div class="search-box">
        <el-input
          v-model="searchKeyword"
          placeholder="搜尋權限名稱或代碼..."
          clearable
          style="width: 250px"
        >
          <template #prefix>
            <ElIcon><Search /></ElIcon>
          </template>
        </el-input>
      </div>

      <!-- 操作按鈕 -->
      <div class="action-buttons">
        <el-button type="primary" @click="handleCreate">
          <ElIcon><Plus /></ElIcon>
          新增權限
        </el-button>
        <el-button
          v-if="selectedPermissions.length > 0"
          type="danger"
          @click="handleBatchDelete"
        >
          <ElIcon><Delete /></ElIcon>
          批次刪除 ({{ selectedPermissions.length }})
        </el-button>
        <el-button @click="handleExport">
          <ElIcon><Download /></ElIcon>
          匯出 Excel
        </el-button>
        <el-button @click="handleReset">
          <ElIcon><RefreshRight /></ElIcon>
          重置
        </el-button>
      </div>
    </div>

    <!-- 權限表格 -->
    <div class="table-container">
      <PermissionTable
        ref="permissionTableRef"
        :permissions="permissions"
        :loading="loading"
        @edit="handleEdit"
        @delete="handleDelete"
        @selection-change="handleSelectionChange"
      />
    </div>

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

    <!-- 新增/編輯對話框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="500px"
      @close="handleDialogClose"
    >
      <PermissionForm
        ref="permissionFormRef"
        :mode="formMode"
        @success="handleFormSuccess"
        @close="dialogVisible = false"
      />
    </el-dialog>
  </div>
</template>

<style scoped lang="scss">
.permission-management {
  padding: 20px;

  .page-header {
    margin-bottom: 20px;

    h1 {
      margin: 0;
      font-size: 24px;
      font-weight: 600;
      color: var(--el-text-color-primary);
    }
  }

  .toolbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
    gap: 16px;

    .search-box {
      flex: 1;
      max-width: 300px;
    }

    .action-buttons {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
    }
  }

  .table-container {
    margin-bottom: 16px;
    background: var(--el-bg-color);
    border-radius: 4px;
    padding: 0;
  }

  .pagination-container {
    display: flex;
    justify-content: flex-end;
    align-items: center;
  }
}

@media (max-width: 768px) {
  .permission-management {
    padding: 12px;

    .toolbar {
      flex-direction: column;
      align-items: stretch;

      .search-box {
        max-width: 100%;
      }

      .action-buttons {
        justify-content: flex-start;
      }
    }
  }
}
</style>

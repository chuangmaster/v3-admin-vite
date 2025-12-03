<script setup lang="ts">
import type { User } from "./types"
import { USER_PERMISSIONS } from "@@/constants/permissions"
import { Download, Plus, Search } from "@element-plus/icons-vue"
import { onMounted, ref } from "vue"
import UserForm from "./components/UserForm.vue"
import UserTable from "./components/UserTable.vue"
import { useExportExcel } from "./composables/useExportExcel"
import { useUserManagement } from "./composables/useUserManagement"

const { users, loading, pagination, searchKeyword, fetchUsers, handleDelete }
  = useUserManagement()
const { exportUsers } = useExportExcel()

const dialogVisible = ref(false)
const dialogTitle = ref("新增用戶")
const userFormRef = ref<InstanceType<typeof UserForm>>()

function handleCreate(): void {
  dialogTitle.value = "新增用戶"
  userFormRef.value?.resetForm()
  dialogVisible.value = true
}

function handleEdit(user: User): void {
  dialogTitle.value = "編輯用戶"
  userFormRef.value?.setupEdit(user)
  dialogVisible.value = true
}

function handleFormSuccess(): void {
  dialogVisible.value = false
  fetchUsers()
}

function handleFormCancel(): void {
  dialogVisible.value = false
}

function handleExport(): void {
  exportUsers(users.value)
}

function handlePageChange(): void {
  fetchUsers()
}

function handleSearchClear(): void {
  searchKeyword.value = ""
  pagination.value.pageNumber = 1
  fetchUsers()
}

onMounted(() => {
  fetchUsers()
})
</script>

<template>
  <div class="user-management-page">
    <!-- 工具列 -->
    <div class="toolbar">
      <el-input
        v-model="searchKeyword"
        placeholder="請輸入用戶名或顯示名稱"
        clearable
        style="width: 250px"
        @keyup.enter="fetchUsers"
        @clear="handleSearchClear"
      >
        <template #prefix>
          <el-icon><Search /></el-icon>
        </template>
      </el-input>

      <div class="toolbar-buttons">
        <el-button
          v-permission="[USER_PERMISSIONS.CREATE]"
          type="primary"
          :icon="Plus"
          @click="handleCreate"
        >
          新增用戶
        </el-button>
        <el-button
          :icon="Download"
          @click="handleExport"
        >
          匯出報表
        </el-button>
      </div>
    </div>

    <!-- 表格卡片 -->
    <el-card class="table-card">
      <template #header>
        <span class="card-title">用戶列表</span>
      </template>

      <UserTable :data="users" :loading="loading" @edit="handleEdit" @delete="handleDelete" />

      <!-- 分頁 -->
      <div class="pagination-container">
        <el-pagination
          v-model:current-page="pagination.pageNumber"
          v-model:page-size="pagination.pageSize"
          :total="pagination.total"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handlePageChange"
          @current-change="handlePageChange"
        />
      </div>
    </el-card>

    <!-- 新增/編輯用戶對話框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="600px"
      :close-on-click-modal="false"
    >
      <UserForm ref="userFormRef" @success="handleFormSuccess" @cancel="handleFormCancel" />
      <template #footer>
        <el-button @click="handleFormCancel">
          取消
        </el-button>
        <el-button type="primary" @click="userFormRef?.handleSubmit?.()">
          {{ dialogTitle === "新增用戶" ? "提交" : "確認" }}
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped lang="scss">
.user-management-page {
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
}
</style>

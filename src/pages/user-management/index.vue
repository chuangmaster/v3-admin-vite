<script setup lang="ts">
import type { User } from "./types"
import { USER_PERMISSIONS } from "@@/constants/permissions"
import { onMounted, ref } from "vue"
import UserForm from "./components/UserForm.vue"
import UserTable from "./components/UserTable.vue"
import { useExportExcel } from "./composables/useExportExcel"
import { useUserManagement } from "./composables/useUserManagement"

const { users, loading, pagination, searchKeyword, fetchUsers, handleDelete, resetSearch }
  = useUserManagement()
const { exportUsers } = useExportExcel()

/** 對話框可見性 */
const dialogVisible = ref(false)

/** 對話框標題 */
const dialogTitle = ref("新增用戶")

/** UserForm 元件 ref */
const userFormRef = ref<InstanceType<typeof UserForm>>()

/**
 * 處理新增用戶按鈕點擊
 */
function handleCreate(): void {
  dialogTitle.value = "新增用戶"
  userFormRef.value?.resetForm()
  dialogVisible.value = true
}

/**
 * 處理編輯用戶
 * @param user - 待編輯的用戶
 */
function handleEdit(user: User): void {
  dialogTitle.value = "編輯用戶"
  userFormRef.value?.setupEdit(user)
  dialogVisible.value = true
}

/**
 * 處理表單提交成功
 */
function handleFormSuccess(): void {
  dialogVisible.value = false
  fetchUsers()
}

/**
 * 處理匯出報表
 */
function handleExport(): void {
  exportUsers(users.value)
}

/**
 * 處理分頁變更
 */
function handlePageChange(): void {
  fetchUsers()
}

onMounted(() => {
  fetchUsers()
})
</script>

<template>
  <div class="user-management p-5">
    <!-- 搜尋列 -->
    <el-card class="mb-4">
      <el-row :gutter="16">
        <el-col :span="8">
          <el-input
            v-model="searchKeyword"
            placeholder="請輸入用戶名或顯示名稱"
            clearable
            @clear="resetSearch"
          >
            <template #append>
              <el-button icon="Search" @click="fetchUsers" />
            </template>
          </el-input>
        </el-col>
        <el-col :span="16" class="flex justify-end gap-2">
          <el-button
            v-permission="[USER_PERMISSIONS.CREATE]"
            type="primary"
            icon="Plus"
            @click="handleCreate"
          >
            新增用戶
          </el-button>
          <el-button icon="Download" @click="handleExport">
            匯出報表
          </el-button>
        </el-col>
      </el-row>
    </el-card>

    <!-- 用戶表格 -->
    <el-card>
      <UserTable :data="users" :loading="loading" @edit="handleEdit" @delete="handleDelete" />

      <!-- 分頁 -->
      <div class="mt-4 flex justify-end">
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
      <UserForm ref="userFormRef" @success="handleFormSuccess" />
    </el-dialog>
  </div>
</template>

<style scoped lang="scss">
.user-management {
  background: var(--el-bg-color);
}
</style>

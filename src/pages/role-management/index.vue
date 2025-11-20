<script setup lang="ts">
import { computed, onMounted } from "vue"

import RoleForm from "./components/RoleForm.vue"
import RoleTable from "./components/RoleTable.vue"
import { useExportExcel } from "./composables/useExportExcel"
import { useRoleForm } from "./composables/useRoleForm"
import { useRoleManagement } from "./composables/useRoleManagement"

const {
  roles,
  loading,
  total,
  currentPage,
  pageSize,
  loadRoles,
  handleDeleteRole,
  handlePageChange,
  handleSizeChange
} = useRoleManagement()

const roleForm = useRoleForm(() => {
  loadRoles()
})

const { exportRoles } = useExportExcel()

// 建立計算屬性確保類型正確
const rolesList = computed(() => roles.value)
const isLoading = computed(() => loading.value)
const totalCount = computed(() => total.value)

// 在頁面掛載時載入角色列表
onMounted(() => {
  loadRoles()
})

function handleAdd() {
  roleForm.openCreate()
}

function handleEdit(role: any) {
  roleForm.openEdit(role)
}

function handleDelete(role: any) {
  handleDeleteRole(role)
}

function handleSubmitForm() {
  roleForm.submitForm()
}

function handleExport() {
  exportRoles(roles.value)
}

function handleUpdateFormData(newFormData: any) {
  Object.assign(roleForm.formData, newFormData)
}
</script>

<template>
  <div class="role-management-page">
    <el-card class="box-card">
      <!-- 工具列 -->
      <template #header>
        <div class="card-header">
          <span class="title">角色列表</span>
          <div class="toolbar-buttons">
            <el-button
              type="primary"
              @click="handleAdd"
              v-permission="['role.create']"
            >
              新增角色
            </el-button>
            <el-button
              type="default"
              @click="handleExport"
            >
              匯出報表
            </el-button>
          </div>
        </div>
      </template>

      <!-- 角色表格 -->
      <RoleTable
        :data="rolesList"
        :loading="isLoading"
        @edit="handleEdit"
        @delete="handleDelete"
      />

      <!-- 分頁 -->
      <el-pagination
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :page-sizes="[10, 20, 50, 100]"
        :total="totalCount"
        layout="total, sizes, prev, pager, next, jumper"
        @current-change="handlePageChange"
        @size-change="handleSizeChange"
        class="pagination-container"
      />
    </el-card>

    <!-- 角色表單對話框 -->
    <RoleForm
      :model-value="roleForm.dialogVisible.value"
      :title="roleForm.isEditMode.value ? '編輯角色' : '新增角色'"
      :loading="roleForm.formLoading.value"
      :form-data="roleForm.formData"
      :rules="roleForm.rules"
      :permissions="roleForm.permissions.value"
      @update:model-value="(value) => { roleForm.dialogVisible.value = value }"
      @update:form-data="handleUpdateFormData"
      @submit="handleSubmitForm"
    />
  </div>
</template>

<style scoped lang="scss">
.role-management-page {
  padding: 12px;

  .box-card {
    :deep(.el-card__header) {
      padding: 16px 20px;
      border-bottom: 1px solid #ebeef5;
    }

    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;

      .title {
        font-size: 16px;
        font-weight: 500;
      }

      .toolbar-buttons {
        display: flex;
        gap: 12px;
      }
    }
  }

  .pagination-container {
    margin-top: 16px;
    text-align: right;
  }
}
</style>

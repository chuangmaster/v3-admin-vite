<script setup lang="ts">
import { Download, Plus } from "@element-plus/icons-vue"
import { computed, onMounted, ref, watch } from "vue"
import RoleForm from "./components/RoleForm.vue"
import RoleTable from "./components/RoleTable.vue"
import { useExportExcel } from "./composables/useExportExcel"
import { useRoleForm } from "./composables/useRoleForm"
import { useRoleManagement } from "./composables/useRoleManagement"

const {
  roles,
  loading,
  pagination,
  loadRoles,
  handleDeleteRole,
  handlePageChange,
  handleSizeChange
} = useRoleManagement()

const roleForm = useRoleForm(() => {
  loadRoles()
})

const roleFormRef = ref()

// 當 roleFormRef 建立後，傳遞給 useRoleForm
watch(() => roleFormRef.value?.formRef, (newVal) => {
  if (newVal) {
    roleForm.setFormRef(newVal)
  }
}, { immediate: true })
const { exportRoles } = useExportExcel()

const rolesList = computed(() => roles.value)
const isLoading = computed(() => loading.value)
const totalCount = computed(() => pagination.value.total)

onMounted(async () => {
  try {
    await roleForm.preloadPermissions()
  } catch (e) {
    console.warn("preloadPermissions failed:", e)
  }
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

function handleSubmitRole() {
  roleForm.submitRole()
}

function handleSubmitPermission() {
  roleForm.submitPermission()
}

function handleExport() {
  exportRoles(roles.value)
}
</script>

<template>
  <div class="role-management-page">
    <!-- 工具列 -->
    <div class="toolbar">
      <div class="toolbar-buttons">
        <el-button
          type="primary"
          :icon="Plus"
          @click="handleAdd"
          v-permission="['role.create']"
        >
          新增角色
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
        <span class="card-title">角色列表</span>
      </template>

      <RoleTable
        :data="rolesList"
        :loading="isLoading"
        @edit="handleEdit"
        @delete="handleDelete"
      />

      <!-- 分頁 -->
      <div class="pagination-container">
        <el-pagination
          v-model:current-page="pagination.pageNumber"
          v-model:page-size="pagination.pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="totalCount"
          layout="total, sizes, prev, pager, next, jumper"
          @current-change="handlePageChange"
          @size-change="handleSizeChange"
        />
      </div>
    </el-card>

    <!-- 角色表單對話框 -->
    <RoleForm
      ref="roleFormRef"
      :model-value="roleForm.dialogVisible.value"
      :title="roleForm.isEditMode.value ? '編輯角色' : '新增角色'"
      :loading="roleForm.formLoading.value"
      :form-data="roleForm.formData.value"
      :rules="roleForm.rules"
      :permissions="roleForm.permissions.value"
      @update:model-value="(value) => { roleForm.dialogVisible.value = value }"
      @update:form-data="(value) => { roleForm.formData.value = value }"
      @submit-role="handleSubmitRole"
      @submit-permission="handleSubmitPermission"
    />
  </div>
</template>

<style scoped lang="scss">
.role-management-page {
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

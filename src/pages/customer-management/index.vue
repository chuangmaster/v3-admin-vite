<script setup lang="ts">
/**
 * 客戶管理主頁面
 *
 * @description 提供客戶資料的查看、搜尋、新增、編輯、刪除功能
 * @module customer-management/index
 */

import type { CreateCustomerRequest, Customer, UpdateCustomerRequest } from "./types"
import { Plus } from "@element-plus/icons-vue"
import { ElButton, ElCard, ElMessage, ElMessageBox, ElPagination } from "element-plus"
import { customerApi } from "./apis/customer"
import CustomerDialog from "./components/CustomerDialog.vue"
import CustomerTable from "./components/CustomerTable.vue"
import SearchBar from "./components/SearchBar.vue"
import { useCustomerForm } from "./composables/useCustomerForm"
import { useCustomerManagement } from "./composables/useCustomerManagement"
import { useExportExcel } from "./composables/useExportExcel"

// 客戶管理邏輯
const {
  customers,
  loading,
  total,
  searchParams,
  handleSearch,
  handleReset,
  handlePageChange,
  handlePageSizeChange,
  refresh
} = useCustomerManagement()

// Excel 匯出邏輯
const { exporting, exportToExcel } = useExportExcel()

// 表單邏輯
const {
  dialogVisible,
  formMode,
  currentCustomer,
  submitting,
  openCreateDialog,
  openEditDialog,
  handleSubmit
} = useCustomerForm()

/** 刪除中狀態 */
const deleting = ref(false)

/** 處理新增客戶 */
function handleCreate() {
  openCreateDialog()
}

/** 處理編輯 */
function handleEdit(customer: Customer) {
  openEditDialog(customer)
}

/** 處理刪除 */
async function handleDelete(customer: Customer) {
  try {
    await ElMessageBox.confirm(
      `確定要刪除客戶「${customer.name}」嗎? `,
      "刪除確認",
      {
        confirmButtonText: "確定刪除",
        cancelButtonText: "取消",
        type: "warning"
      }
    )

    // 執行刪除
    deleting.value = true
    try {
      const response = await customerApi.delete(customer.id)

      if (response.success) {
        ElMessage.success("刪除客戶成功")
        refresh()
      } else {
        ElMessage.error(response.message || "刪除客戶失敗")
      }
    } catch (error) {
      console.error("delete error:", error)
      ElMessage.error("刪除客戶失敗")
    } finally {
      deleting.value = false
    }
  } catch {
    // 使用者取消
  }
}

/** 處理匯出 */
function handleExport() {
  exportToExcel(customers.value)
}

/** 處理表單提交 */
function handleFormSubmit(data: CreateCustomerRequest | UpdateCustomerRequest) {
  handleSubmit(data, refresh)
}
</script>

<template>
  <div class="customer-management">
    <!-- 頂部操作列 -->
    <ElCard shadow="never" class="header-card">
      <div class="header-actions">
        <h2>客戶管理</h2>
        <ElButton
          v-permission="['customer.create']"
          type="primary"
          :icon="Plus"
          @click="handleCreate"
        >
          新增客戶
        </ElButton>
      </div>
    </ElCard>

    <!-- 搜尋列 -->
    <ElCard shadow="never" class="search-card">
      <SearchBar
        @search="handleSearch"
        @reset="handleReset"
        @export="handleExport"
      />
    </ElCard>

    <!-- 客戶列表 -->
    <ElCard shadow="never" class="table-card">
      <CustomerTable
        :data="customers"
        :loading="loading || exporting || deleting"
        @edit="handleEdit"
        @delete="handleDelete"
      />

      <!-- 分頁 -->
      <div class="pagination-wrapper">
        <ElPagination
          v-model:current-page="searchParams.pageNumber"
          v-model:page-size="searchParams.pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="total"
          layout="total, sizes, prev, pager, next, jumper"
          @current-change="handlePageChange"
          @size-change="handlePageSizeChange"
        />
      </div>
    </ElCard>

    <!-- 客戶表單對話框 -->
    <CustomerDialog
      v-model:visible="dialogVisible"
      :customer="currentCustomer"
      :mode="formMode"
      :loading="submitting"
      @submit="handleFormSubmit"
    />
  </div>
</template>

<style lang="scss" scoped>
.customer-management {
  padding: 20px;

  .header-card {
    margin-bottom: 20px;

    .header-actions {
      display: flex;
      justify-content: space-between;
      align-items: center;

      h2 {
        margin: 0;
        font-size: 20px;
        font-weight: 600;
        color: var(--el-text-color-primary);
      }
    }
  }

  .search-card {
    margin-bottom: 20px;
  }

  .table-card {
    .pagination-wrapper {
      margin-top: 20px;
      display: flex;
      justify-content: flex-end;
    }
  }
}
</style>

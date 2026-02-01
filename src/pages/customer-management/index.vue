<script setup lang="ts">
/**
 * 客戶管理主頁面
 *
 * @description 提供客戶資料的查看、搜尋、新增、編輯、刪除功能，以及會員等級管理
 * @module customer-management/index
 */

import type { CreateCustomerRequest, Customer, CustomerLevelFormData, UpdateCustomerRequest } from "./types"
import { Download, Plus, Refresh, Search } from "@element-plus/icons-vue"
import { ElButton, ElCard, ElMessage, ElMessageBox } from "element-plus"
import { customerApi } from "./apis/customer"
import CustomerDialog from "./components/CustomerDialog.vue"
import CustomerLevelDialog from "./components/CustomerLevelDialog.vue"
import CustomerLevelTable from "./components/CustomerLevelTable.vue"
import CustomerTable from "./components/CustomerTable.vue"
import { useCustomerForm } from "./composables/useCustomerForm"
import { useCustomerLevel } from "./composables/useCustomerLevel"
import { useCustomerManagement } from "./composables/useCustomerManagement"
import { useExportExcel } from "./composables/useExportExcel"

defineOptions({
  name: "CustomerManagement"
})

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

// 等級管理邏輯
const {
  levelList,
  loading: levelLoading,
  fetchLevelHistory,
  createLevel,
  updateLevel,
  terminateLevel
} = useCustomerLevel()

/** 刪除中狀態 */
const deleting = ref(false)

/** 等級對話框狀態 */
const levelDialogVisible = ref(false)
const levelDialogMode = ref<"create" | "edit" | "terminate">("create")
const selectedCustomer = ref<Customer | null>(null)
const selectedLevelRecord = ref<Customer["activePeriod"]>(null)

/** 等級歷程對話框狀態 */
const levelHistoryDialogVisible = ref(false)

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

/** 處理開啟等級設定對話框 */
function handleSetLevel(customer: Customer) {
  selectedCustomer.value = customer
  selectedLevelRecord.value = customer.activePeriod

  if (customer.activePeriod) {
    // 若已有等級，預設為編輯模式
    levelDialogMode.value = "edit"
  } else {
    // 若無等級，為新增模式
    levelDialogMode.value = "create"
  }

  levelDialogVisible.value = true
}

/** 開啟 VIP 歷程對話框 */
async function handleViewHistory(customer: Customer) {
  selectedCustomer.value = customer
  levelHistoryDialogVisible.value = true
  await fetchLevelHistory(customer.id)
}

/** 從歷程表格進入編輯 */
function handleHistoryEdit(record: NonNullable<Customer["activePeriod"]>) {
  if (!selectedCustomer.value) return
  selectedLevelRecord.value = record
  levelDialogMode.value = "edit"
  levelHistoryDialogVisible.value = false
  levelDialogVisible.value = true
}

/** 從歷程表格進入終止 */
function handleHistoryTerminate(record: NonNullable<Customer["activePeriod"]>) {
  if (!selectedCustomer.value) return
  selectedLevelRecord.value = record
  levelDialogMode.value = "terminate"
  levelHistoryDialogVisible.value = false
  levelDialogVisible.value = true
}

/** 處理等級對話框提交 */
async function handleLevelSubmit(formData: CustomerLevelFormData, version?: number) {
  if (!selectedCustomer.value) return

  let success = false

  if (levelDialogMode.value === "create") {
    success = await createLevel(selectedCustomer.value.id, formData)
  } else if (levelDialogMode.value === "edit" && selectedLevelRecord.value && version !== undefined) {
    success = await updateLevel(
      selectedCustomer.value.id,
      selectedLevelRecord.value.id,
      formData,
      version
    )
  }

  if (success) {
    // 立即關閉 dialog
    levelDialogVisible.value = false
    selectedCustomer.value = null
    selectedLevelRecord.value = null
    // 重新載入客戶列表
    refresh()
  }
}

/** 處理終止等級 */
async function handleTerminate() {
  if (!selectedCustomer.value) return

  const success = await terminateLevel(selectedCustomer.value.id)
  if (success) {
    // 立即關閉 dialog
    levelDialogVisible.value = false
    selectedCustomer.value = null
    selectedLevelRecord.value = null
    // 重新載入客戶列表
    refresh()
  }
}

/** 處理等級對話框取消 */
function handleLevelCancel() {
  levelDialogVisible.value = false
  selectedCustomer.value = null
  selectedLevelRecord.value = null
}

/** 處理表單提交 */
function handleFormSubmit(data: CreateCustomerRequest | UpdateCustomerRequest) {
  handleSubmit(data, refresh)
}
</script>

<template>
  <div class="app-container">
    <ElCard shadow="never">
      <template #header>
        <div class="card-header">
          <span class="title">客戶管理</span>
          <div>
            <ElButton
              v-permission="['customer.create']"
              type="primary"
              :icon="Plus"
              @click="handleCreate"
            >
              新增客戶
            </ElButton>
          </div>
        </div>
      </template>

      <!-- 查詢條件 -->
      <div class="filter-container">
        <el-form inline>
          <el-form-item label="關鍵字">
            <el-input
              v-model="searchParams.keyword"
              placeholder="姓名/電話/電子郵件"
              clearable
              style="width: 240px"
              @keyup.enter="handleSearch"
              @clear="refresh"
            />
          </el-form-item>

          <el-form-item>
            <ElButton
              v-permission="['customer.read']"
              type="primary"
              :icon="Search"
              @click="refresh"
            >
              查詢
            </ElButton>
            <ElButton :icon="Refresh" @click="handleReset">
              重置
            </ElButton>
            <ElButton
              v-permission="['customer.read']"
              :icon="Download"
              :loading="exporting"
              @click="handleExport"
            >
              匯出 Excel
            </ElButton>
          </el-form-item>
        </el-form>
      </div>

      <!-- 客戶列表 -->
      <CustomerTable
        :data="customers"
        :loading="loading || exporting || deleting || levelLoading"
        @edit="handleEdit"
        @delete="handleDelete"
        @set-level="handleSetLevel"
        @view-history="handleViewHistory"
      />

      <!-- 分頁 -->
      <el-pagination
        v-model:current-page="searchParams.pageNumber"
        v-model:page-size="searchParams.pageSize"
        :total="total"
        :page-sizes="[10, 20, 50, 100]"
        layout="total, sizes, prev, pager, next, jumper"
        @current-change="handlePageChange"
        @size-change="handlePageSizeChange"
      />
    </ElCard>

    <!-- 客戶表單對話框 -->
    <CustomerDialog
      v-model:visible="dialogVisible"
      :customer="currentCustomer"
      :mode="formMode"
      :loading="submitting"
      @submit="handleFormSubmit"
    />

    <!-- 會員等級設定對話框 -->
    <CustomerLevelDialog
      v-model="levelDialogVisible"
      :mode="levelDialogMode"
      :data="selectedLevelRecord"
      :customer-id="selectedCustomer?.id || ''"
      :customer-name="selectedCustomer?.name"
      :loading="levelLoading"
      @submit="handleLevelSubmit"
      @terminate="handleTerminate"
      @cancel="handleLevelCancel"
    />

    <!-- VIP 歷程對話框 -->
    <el-dialog
      v-model="levelHistoryDialogVisible"
      :title="selectedCustomer ? `會員等級歷程 - ${selectedCustomer.name}` : '等級歷程'"
      width="900px"
      destroy-on-close
    >
      <CustomerLevelTable
        :data="levelList"
        :loading="levelLoading"
        @edit="handleHistoryEdit"
        @terminate="handleHistoryTerminate"
      />
    </el-dialog>
  </div>
</template>

<style scoped lang="scss">
.app-container {
  padding: 20px;

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;

    .title {
      font-size: 18px;
      font-weight: 600;
    }
  }

  .filter-container {
    margin-bottom: 20px;
  }

  .el-pagination {
    margin-top: 20px;
    justify-content: flex-end;
  }
}
</style>

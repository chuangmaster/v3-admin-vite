<script setup lang="ts">
/**
 * 訂單管理主頁面
 *
 * @module order-management/index
 * @description 訂單列表頁面,包含新增訂單按鈕、搜尋篩選、表格、分頁、操作
 */
import type { SalesOrder, SalesOrderListItem } from "@/pages/order-management/types"
import { SALES_ORDER_PERMISSIONS } from "@@/constants/permissions"
import { Download, Plus } from "@element-plus/icons-vue"
import { ElButton, ElCard, ElPagination } from "element-plus"
import { ref } from "vue"
import { useOrderDetail } from "@/pages/order-management/composables/useOrderDetail"
import { useOrderExport } from "@/pages/order-management/composables/useOrderExport"
import { useOrderForm } from "@/pages/order-management/composables/useOrderForm"
import { useOrderList } from "@/pages/order-management/composables/useOrderList"
import { useShippingLabel } from "@/pages/order-management/composables/useShippingLabel"
import OrderFormDialog from "./components/OrderFormDialog.vue"
import OrderListTable from "./components/OrderListTable.vue"
import OrderSearchForm from "./components/OrderSearchForm.vue"
import ShippingLabelPreview from "./components/ShippingLabelPreview.vue"
import WarrantyPrint from "./components/WarrantyPrint.vue"

defineOptions({ name: "OrderManagement" })

const {
  orders,
  loading,
  total,
  searchParams,
  filters,
  handleSearch,
  handleReset,
  handlePageChange,
  handlePageSizeChange,
  refresh
} = useOrderList()

const {
  dialogVisible,
  dialogMode,
  submitting,
  currentOrder,
  formData,
  openCreateDialog,
  openEditDialog,
  handleSubmit
} = useOrderForm()

const {
  fetchOrderDetail,
  handleDelete
} = useOrderDetail()

const {
  exporting,
  exportOrders
} = useOrderExport()

const {
  shippingLabel,
  previewVisible: shippingPreviewVisible,
  openPreview: openShippingPreview,
  handlePrint: handleShippingPrint
} = useShippingLabel()

/** 保證書列印對話框狀態 */
const printVisible = ref(false)
/** 當前列印的訂單資料 */
const printOrder = ref<SalesOrder | null>(null)

/**
 * 處理表單提交
 */
function handleFormSubmit(data: typeof formData.value) {
  handleSubmit(data, refresh)
}

/**
 * 處理查看/編輯訂單
 * @param order - 訂單列表項目
 */
async function handleViewOrder(order: SalesOrderListItem) {
  const detail = await fetchOrderDetail(order.id)
  if (detail) {
    openEditDialog(detail)
  }
}

/**
 * 處理刪除訂單
 * @param order - 訂單列表項目
 */
async function handleDeleteOrder(order: SalesOrderListItem) {
  await handleDelete(order.id, order.orderNumber, refresh)
}

/**
 * 處理訂單狀態更新後重新整理
 */
function handleOrderUpdate(order: SalesOrder) {
  currentOrder.value = order
  refresh()
}

/**
 * 處理匯出訂單報表
 */
function handleExport() {
  const params: Record<string, unknown> = {
    orderNumber: filters.value.orderNumber || undefined,
    customerName: filters.value.customerName || undefined,
    productName: filters.value.productName || undefined,
    orderStatus: filters.value.orderStatus || undefined,
    paymentStatus: filters.value.paymentStatus || undefined,
    shippingStatus: filters.value.shippingStatus || undefined,
    orderDateStart: filters.value.dateRange?.[0] || undefined,
    orderDateEnd: filters.value.dateRange?.[1] || undefined
  }

  exportOrders(params)
}

/**
 * 處理列印出貨單
 * @param order - 訂單列表項目
 */
function handlePrintShippingLabel(order: SalesOrderListItem) {
  openShippingPreview(order.id)
}

/**
 * 處理列印保證書
 * @param order - 訂單列表項目
 */
async function handlePrintOrder(order: SalesOrderListItem) {
  const detail = await fetchOrderDetail(order.id)
  if (detail) {
    printOrder.value = detail
    printVisible.value = true
  }
}
</script>

<template>
  <div class="app-container">
    <ElCard shadow="never">
      <template #header>
        <div class="card-header">
          <span class="title">訂單管理</span>
          <div class="header-actions">
            <ElButton
              v-permission="[SALES_ORDER_PERMISSIONS.EXPORT]"
              :icon="Download"
              :loading="exporting"
              @click="handleExport"
            >
              匯出報表
            </ElButton>
            <ElButton
              v-permission="[SALES_ORDER_PERMISSIONS.CREATE]"
              type="primary"
              :icon="Plus"
              @click="openCreateDialog"
            >
              新增訂單
            </ElButton>
          </div>
        </div>
      </template>

      <!-- 搜尋篩選 -->
      <OrderSearchForm
        v-model:filters="filters"
        @search="handleSearch"
        @reset="handleReset"
      />

      <!-- 訂單列表表格 -->
      <OrderListTable
        :data="orders"
        :loading="loading"
        @view="handleViewOrder"
        @delete="handleDeleteOrder"
        @print-shipping="handlePrintShippingLabel"
        @print-order="handlePrintOrder"
      />

      <!-- 分頁 -->
      <ElPagination
        v-model:current-page="searchParams.pageNumber"
        v-model:page-size="searchParams.pageSize"
        :total="total"
        :page-sizes="[10, 20, 50, 100]"
        layout="total, sizes, prev, pager, next, jumper"
        class="pagination"
        @current-change="handlePageChange"
        @size-change="handlePageSizeChange"
      />
    </ElCard>

    <!-- 訂單表單對話框 -->
    <OrderFormDialog
      v-model:visible="dialogVisible"
      v-model:form-data="formData"
      :mode="dialogMode"
      :current-order="currentOrder"
      :loading="submitting"
      @submit="handleFormSubmit"
      @order-update="handleOrderUpdate"
    />

    <!-- 出貨單預覽 -->
    <ShippingLabelPreview
      v-model:visible="shippingPreviewVisible"
      :data="shippingLabel"
      @print="handleShippingPrint"
    />

    <!-- 保證書列印 -->
    <WarrantyPrint
      v-model:visible="printVisible"
      :order="printOrder"
    />
  </div>
</template>

<style scoped lang="scss">
.app-container {
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;

  .title {
    font-size: 18px;
    font-weight: 600;
  }

  .header-actions {
    display: flex;
    gap: 8px;
  }
}

.pagination {
  margin-top: 20px;
  justify-content: flex-end;
}
</style>

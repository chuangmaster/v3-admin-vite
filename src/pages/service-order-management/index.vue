<script setup lang="ts">
/**
 * 服務訂單管理列表頁面
 */
import { formatDateTime } from "@@/utils/datetime"
import { Plus, Refresh, Search, View } from "@element-plus/icons-vue"
import { useServiceOrderList } from "./composables/useServiceOrderList"
import { ServiceOrderStatus, ServiceOrderType } from "./types"

defineOptions({
  name: "ServiceOrderManagement"
})

const {
  loading,
  serviceOrders,
  total,
  queryParams,
  handlePageChange,
  handleSizeChange,
  viewDetail,
  createOrder,
  refresh,
  resetQuery
} = useServiceOrderList()

/** 訂單類型選項 */
const orderTypeOptions = [
  { label: "全部", value: "" },
  { label: "收購單", value: ServiceOrderType.BUYBACK },
  { label: "寄賣單", value: ServiceOrderType.CONSIGNMENT }
]

/** 訂單狀態選項 */
const statusOptions = [
  { label: "全部", value: "" },
  { label: "草稿", value: ServiceOrderStatus.DRAFT },
  { label: "待確認", value: ServiceOrderStatus.PENDING },
  { label: "已確認", value: ServiceOrderStatus.CONFIRMED },
  { label: "處理中", value: ServiceOrderStatus.IN_PROGRESS },
  { label: "已完成", value: ServiceOrderStatus.COMPLETED },
  { label: "已取消", value: ServiceOrderStatus.CANCELLED }
]

/**
 * 訂單類型標籤類型
 */
function getOrderTypeTag(type: ServiceOrderType) {
  return type === ServiceOrderType.BUYBACK ? "success" : "warning"
}

/**
 * 訂單狀態標籤類型
 */
function getStatusTag(status: ServiceOrderStatus) {
  const map: Record<ServiceOrderStatus, any> = {
    [ServiceOrderStatus.DRAFT]: "info",
    [ServiceOrderStatus.PENDING]: "warning",
    [ServiceOrderStatus.CONFIRMED]: "success",
    [ServiceOrderStatus.IN_PROGRESS]: "primary",
    [ServiceOrderStatus.COMPLETED]: "success",
    [ServiceOrderStatus.CANCELLED]: "danger"
  }
  return map[status] || "info"
}

/**
 * 訂單狀態文字
 */
function getStatusText(status: ServiceOrderStatus) {
  const map: Record<ServiceOrderStatus, string> = {
    [ServiceOrderStatus.DRAFT]: "草稿",
    [ServiceOrderStatus.PENDING]: "待確認",
    [ServiceOrderStatus.CONFIRMED]: "已確認",
    [ServiceOrderStatus.IN_PROGRESS]: "處理中",
    [ServiceOrderStatus.COMPLETED]: "已完成",
    [ServiceOrderStatus.CANCELLED]: "已取消"
  }
  return map[status] || status
}

/**
 * 訂單類型文字
 */
function getOrderTypeText(type: ServiceOrderType) {
  return type === ServiceOrderType.BUYBACK ? "收購單" : "寄賣單"
}
</script>

<template>
  <div class="app-container">
    <el-card shadow="never">
      <template #header>
        <div class="card-header">
          <span class="title">服務訂單管理</span>
          <div>
            <el-button
              type="primary"
              :icon="Plus"
              @click="createOrder"
            >
              建立訂單
            </el-button>
          </div>
        </div>
      </template>

      <!-- 查詢條件 -->
      <div class="filter-container">
        <el-form inline>
          <el-form-item label="訂單編號">
            <el-input
              v-model="queryParams.orderNumber"
              placeholder="請輸入訂單編號"
              clearable
              @clear="refresh"
            />
          </el-form-item>

          <el-form-item label="訂單類型">
            <el-select
              v-model="queryParams.orderType"
              placeholder="請選擇訂單類型"
              clearable
              @change="refresh"
            >
              <el-option
                v-for="option in orderTypeOptions"
                :key="option.value"
                :label="option.label"
                :value="option.value"
              />
            </el-select>
          </el-form-item>

          <el-form-item label="訂單狀態">
            <el-select
              v-model="queryParams.status"
              placeholder="請選擇訂單狀態"
              clearable
              @change="refresh"
            >
              <el-option
                v-for="option in statusOptions"
                :key="option.value"
                :label="option.label"
                :value="option.value"
              />
            </el-select>
          </el-form-item>

          <el-form-item label="客戶姓名">
            <el-input
              v-model="queryParams.customerName"
              placeholder="請輸入客戶姓名"
              clearable
              @clear="refresh"
            />
          </el-form-item>

          <el-form-item label="建立日期">
            <el-date-picker
              v-model="queryParams.createdDateRange"
              type="daterange"
              range-separator="至"
              start-placeholder="開始日期"
              end-placeholder="結束日期"
              value-format="YYYY-MM-DD"
              @change="refresh"
            />
          </el-form-item>

          <el-form-item>
            <el-button type="primary" :icon="Search" @click="refresh">
              查詢
            </el-button>
            <el-button :icon="Refresh" @click="resetQuery">
              重置
            </el-button>
          </el-form-item>
        </el-form>
      </div>

      <!-- 資料表格 -->
      <el-table
        v-loading="loading"
        :data="serviceOrders"
        border
        stripe
      >
        <el-table-column prop="orderNumber" label="訂單編號" width="180" fixed="left" />
        <el-table-column prop="orderType" label="訂單類型" width="100">
          <template #default="{ row }">
            <el-tag :type="getOrderTypeTag(row.orderType)">
              {{ getOrderTypeText(row.orderType) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="customerName" label="客戶姓名" width="120" />
        <el-table-column prop="customerPhone" label="客戶電話" width="130" />
        <el-table-column prop="totalAmount" label="總金額" width="120" align="right">
          <template #default="{ row }">
            NT$ {{ row.totalAmount.toLocaleString() }}
          </template>
        </el-table-column>
        <el-table-column prop="status" label="狀態" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusTag(row.status)">
              {{ getStatusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="建立時間" width="180">
          <template #default="{ row }">
            {{ formatDateTime(row.createdAt) }}
          </template>
        </el-table-column>
        <el-table-column prop="createdBy" label="建立人" width="120" />
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{ row }">
            <el-button
              v-permission="['service-order:buyback:read', 'service-order:consignment:read']"
              type="primary"
              link
              size="small"
              :icon="View"
              @click="viewDetail(row.id)"
            >
              查看
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分頁 -->
      <el-pagination
        v-model:current-page="queryParams.pageNumber"
        v-model:page-size="queryParams.pageSize"
        :total="total"
        :page-sizes="[10, 20, 50, 100]"
        layout="total, sizes, prev, pager, next, jumper"
        @current-change="handlePageChange"
        @size-change="handleSizeChange"
      />
    </el-card>
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

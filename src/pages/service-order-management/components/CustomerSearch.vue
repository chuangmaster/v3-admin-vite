<script setup lang="ts">
/**
 * 客戶搜尋元件
 * 提供客戶搜尋輸入框與結果列表，支援選擇客戶或新增客戶
 */
import type { Customer } from "../types"
import { Search } from "@element-plus/icons-vue"
import { useCustomerSearch } from "../composables/useCustomerSearch"

const emit = defineEmits<{
  /** 選擇客戶事件 */
  select: [customer: Customer]
  /** 新增客戶事件 */
  create: []
}>()

const { keyword, customers, loading, clearResults } = useCustomerSearch()

/**
 * 處理客戶選擇
 */
function handleSelect(customer: Customer) {
  emit("select", customer)
  clearResults()
}

/**
 * 處理新增客戶
 */
function handleCreate() {
  emit("create")
}
</script>

<template>
  <div class="customer-search">
    <div class="search-input-wrapper">
      <el-input
        v-model="keyword"
        placeholder="搜尋客戶（姓名、電話、Email、身分證字號）"
        clearable
        :prefix-icon="Search"
        @clear="clearResults"
      />
      <el-button type="primary" @click="handleCreate">
        新增客戶
      </el-button>
    </div>

    <!-- 搜尋結果列表 -->
    <div v-if="keyword && keyword.length >= 2" v-loading="loading" class="search-results">
      <template v-if="customers.length > 0">
        <div
          v-for="customer in customers"
          :key="customer.id"
          class="customer-item"
          @click="handleSelect(customer)"
        >
          <div class="customer-info">
            <div class="customer-name">
              {{ customer.name }}
            </div>
            <div class="customer-details">
              <span>{{ customer.phoneNumber }}</span>
              <span v-if="customer.email" class="separator">|</span>
              <span v-if="customer.email">{{ customer.email }}</span>
              <span class="separator">|</span>
              <span>{{ customer.idCardNumber }}</span>
            </div>
          </div>
        </div>
      </template>
      <template v-else>
        <el-empty description="查無客戶資料" :image-size="80" />
      </template>
    </div>
  </div>
</template>

<style scoped lang="scss">
.customer-search {
  position: relative;
  overflow: visible;
}

.search-input-wrapper {
  display: flex;
  gap: 12px;
  align-items: center;
}

.search-results {
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  right: 0;
  z-index: 2000;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color);
  border-radius: var(--el-border-radius-base);
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  max-height: 300px;
  min-height: 120px;
  overflow-y: auto;
}

.customer-item {
  padding: 12px 16px;
  cursor: pointer;
  transition: background-color 0.2s;

  &:hover {
    background-color: var(--el-fill-color-light);
  }

  &:not(:last-child) {
    border-bottom: 1px solid var(--el-border-color-lighter);
  }
}

.customer-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.customer-name {
  font-weight: 500;
  font-size: 14px;
  color: var(--el-text-color-primary);
}

.customer-details {
  font-size: 12px;
  color: var(--el-text-color-secondary);

  .separator {
    margin: 0 8px;
  }
}

.create-customer-hint {
  padding: 12px 16px;
  text-align: center;
}
</style>

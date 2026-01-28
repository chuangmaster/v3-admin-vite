<!--
  客戶搜尋列元件

  功能:
  - 提供多種搜尋條件 (關鍵字、狀態)
  - 支援搜尋、重設操作
  - 支援 Excel 匯出按鈕
-->
<script lang="ts" setup>
import type { CustomerListParams } from "../types"
import { Download, Refresh, Search } from "@element-plus/icons-vue"
import { ElButton, ElForm, ElFormItem, ElInput } from "element-plus"

interface Emits {
  /** 搜尋事件 */
  (e: "search", params: CustomerListParams): void
  /** 重設事件 */
  (e: "reset"): void
  /** 匯出事件 */
  (e: "export"): void
}

const emit = defineEmits<Emits>()

/** 搜尋表單 */
const searchForm = ref<CustomerListParams>({
  pageNumber: 1,
  pageSize: 10,
  keyword: ""
})

/** 處理搜尋 */
function handleSearch() {
  emit("search", { ...searchForm.value })
}

/** 處理重設 */
function handleReset() {
  searchForm.value = {
    pageNumber: 1,
    pageSize: 10,
    keyword: ""
  }
  emit("reset")
}

/** 處理匯出 */
function handleExport() {
  emit("export")
}
</script>

<template>
  <ElForm :model="searchForm" inline>
    <ElFormItem label="關鍵字">
      <ElInput
        v-model="searchForm.keyword"
        placeholder="姓名/電話/電子郵件"
        clearable
        style="width: 240px"
        @keyup.enter="handleSearch"
      />
    </ElFormItem>

    <ElFormItem>
      <ElButton
        v-permission="['customer.read']"
        type="primary"
        :icon="Search"
        @click="handleSearch"
      >
        搜尋
      </ElButton>
      <ElButton :icon="Refresh" @click="handleReset">
        重設
      </ElButton>
      <ElButton
        v-permission="['customer.read']"
        :icon="Download"
        @click="handleExport"
      >
        匯出 Excel
      </ElButton>
    </ElFormItem>
  </ElForm>
</template>

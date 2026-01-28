<!--
  客戶對話框元件

  功能:
  - 包裝 CustomerForm 在對話框中
  - 支援新增/編輯模式
  - 自動處理對話框開關
-->
<script lang="ts" setup>
import type { CreateCustomerRequest, Customer, UpdateCustomerRequest } from "../types"
import { ElDialog } from "element-plus"
import { ref } from "vue"
import CustomerForm from "./CustomerForm.vue"

interface Props {
  /** 對話框顯示狀態 */
  visible: boolean
  /** 編輯模式下的客戶資料 */
  customer?: Customer
  /** 表單模式 */
  mode?: "create" | "edit"
  /** 載入中狀態 */
  loading?: boolean
}

interface Emits {
  /** 更新顯示狀態 */
  (e: "update:visible", value: boolean): void
  /** 提交表單 */
  (e: "submit", data: CreateCustomerRequest | UpdateCustomerRequest): void
}

const props = withDefaults(defineProps<Props>(), {
  mode: "create",
  loading: false
})

const emit = defineEmits<Emits>()

/** 表單實例 */
const formRef = ref<InstanceType<typeof CustomerForm>>()

/** 對話框標題 */
const dialogTitle = computed(() => {
  return props.mode === "create" ? "新增客戶" : "編輯客戶資料"
})

/** 處理關閉 */
function handleClose() {
  emit("update:visible", false)
  // 延遲重設表單,避免關閉動畫時看到表單清空
  setTimeout(() => {
    formRef.value?.resetFields()
  }, 300)
}

/** 處理提交 */
function handleSubmit(data: CreateCustomerRequest | UpdateCustomerRequest) {
  emit("submit", data)
}

/** 處理取消 */
function handleCancel() {
  handleClose()
}
</script>

<template>
  <ElDialog
    :model-value="props.visible"
    :title="dialogTitle"
    width="600px"
    :close-on-click-modal="false"
    @close="handleClose"
  >
    <CustomerForm
      ref="formRef"
      :customer="props.customer"
      :mode="props.mode"
      :loading="props.loading"
      @submit="handleSubmit"
      @cancel="handleCancel"
    />
  </ElDialog>
</template>

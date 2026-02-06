<script setup lang="ts">
import type { FormInstance } from "element-plus"
/**
 * 客戶選擇器元件
 *
 * @module order-management/components/CustomerSelector
 * @description 提供客戶搜尋下拉選單與快速新增客戶功能
 */
import type { CreateCustomerRequest, Customer } from "@/pages/customer-management/types"
import { Plus } from "@element-plus/icons-vue"
import { ElButton, ElDialog, ElForm, ElFormItem, ElInput, ElOption, ElSelect } from "element-plus"
import { ref } from "vue"
import { createCustomerRules } from "@/pages/customer-management/types"
import { useCustomerSearch } from "@/pages/order-management/composables/useCustomerSearch"

defineOptions({ name: "CustomerSelector" })

const props = withDefaults(defineProps<Props>(), {
  modelValue: "",
  disabled: false
})

const emit = defineEmits<Emits>()

interface Props {
  /** 已選擇的客戶 ID */
  modelValue?: string
  /** 是否禁用 */
  disabled?: boolean
}

interface Emits {
  (e: "update:modelValue", value: string): void
  (e: "customerChange", customer: Customer | null): void
}

const {
  customerOptions,
  searching,
  searchCustomers,
  handleCustomerChange,
  quickAddCustomer,
  selectedCustomer
} = useCustomerSearch()

/** 快速新增客戶對話框 */
const quickAddVisible = ref(false)
const quickAddFormRef = ref<FormInstance>()
const quickAddLoading = ref(false)
const quickAddForm = ref<CreateCustomerRequest>({
  name: "",
  phoneNumber: "",
  idNumber: "",
  residentialAddress: ""
})

/**
 * 處理客戶搜尋
 */
function handleSearch(query: string) {
  searchCustomers(query)
}

/**
 * 處理客戶選擇
 */
function handleSelect(customerId: string) {
  handleCustomerChange(customerId)
  emit("update:modelValue", customerId)
  emit("customerChange", selectedCustomer.value)
}

/**
 * 開啟快速新增客戶對話框
 */
function openQuickAdd() {
  quickAddForm.value = {
    name: "",
    phoneNumber: "",
    idNumber: "",
    residentialAddress: ""
  }
  quickAddVisible.value = true
}

/**
 * 提交快速新增客戶
 */
async function handleQuickAddSubmit() {
  if (!quickAddFormRef.value) return

  try {
    await quickAddFormRef.value.validate()
  } catch {
    return
  }

  quickAddLoading.value = true
  try {
    const success = await quickAddCustomer(quickAddForm.value)
    if (success) {
      quickAddVisible.value = false
      emit("update:modelValue", selectedCustomer.value?.id || "")
      emit("customerChange", selectedCustomer.value)
    }
  } finally {
    quickAddLoading.value = false
  }
}

/**
 * 關閉快速新增對話框
 */
function handleQuickAddClose() {
  quickAddVisible.value = false
  quickAddFormRef.value?.resetFields()
}
</script>

<template>
  <div class="customer-selector">
    <div class="selector-row">
      <ElSelect
        :model-value="props.modelValue"
        filterable
        remote
        reserve-keyword
        clearable
        :remote-method="handleSearch"
        :loading="searching"
        :disabled="props.disabled"
        placeholder="請輸入客戶名稱或電話搜尋"
        style="flex: 1"
        @change="handleSelect"
      >
        <ElOption
          v-for="customer in customerOptions"
          :key="customer.id"
          :label="`${customer.name} (${customer.phoneNumber})`"
          :value="customer.id"
        >
          <span>{{ customer.name }}</span>
          <span style="float: right; color: var(--el-text-color-secondary); font-size: 13px">
            {{ customer.phoneNumber }}
          </span>
        </ElOption>
      </ElSelect>

      <ElButton
        :icon="Plus"
        :disabled="props.disabled"
        style="margin-left: 8px"
        @click="openQuickAdd"
      >
        快速新增
      </ElButton>
    </div>

    <!-- 快速新增客戶對話框 -->
    <ElDialog
      v-model="quickAddVisible"
      title="快速新增客戶"
      width="500px"
      :close-on-click-modal="false"
      @close="handleQuickAddClose"
    >
      <ElForm
        ref="quickAddFormRef"
        :model="quickAddForm"
        :rules="createCustomerRules"
        label-width="100px"
      >
        <ElFormItem label="客戶姓名" prop="name">
          <ElInput v-model="quickAddForm.name" placeholder="請輸入客戶姓名" maxlength="100" />
        </ElFormItem>
        <ElFormItem label="聯絡電話" prop="phoneNumber">
          <ElInput v-model="quickAddForm.phoneNumber" placeholder="請輸入手機號碼" maxlength="10" />
        </ElFormItem>
        <ElFormItem label="身分證字號" prop="idNumber">
          <ElInput v-model="quickAddForm.idNumber" placeholder="請輸入身分證字號" maxlength="10" />
        </ElFormItem>
        <ElFormItem label="居住地址" prop="residentialAddress">
          <ElInput v-model="quickAddForm.residentialAddress" placeholder="請輸入居住地址" maxlength="200" />
        </ElFormItem>
      </ElForm>

      <template #footer>
        <ElButton @click="handleQuickAddClose">
          取消
        </ElButton>
        <ElButton type="primary" :loading="quickAddLoading" @click="handleQuickAddSubmit">
          新增
        </ElButton>
      </template>
    </ElDialog>
  </div>
</template>

<style scoped lang="scss">
.customer-selector {
  width: 100%;
}

.selector-row {
  display: flex;
  align-items: center;
}
</style>

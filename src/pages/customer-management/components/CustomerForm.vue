<!--
  客戶表單元件

  功能:
  - 支援新增/編輯模式
  - 完整表單驗證
  - 台灣身分證字號驗證
  - 電話格式驗證
  - Email 格式驗證
-->
<script lang="ts" setup>
import type { FormInstance } from "element-plus"
import type { CreateCustomerRequest, Customer, UpdateCustomerRequest } from "../types"
import { Cpu } from "@element-plus/icons-vue"
import { ElButton, ElCollapse, ElCollapseItem, ElForm, ElFormItem, ElIcon, ElInput, ElMessage } from "element-plus"
import { computed, ref, watch } from "vue"
import { createCustomerRules, updateCustomerRules } from "../types"
import IdCardUpload from "./IdCardUpload.vue"

interface Props {
  /** 編輯模式下的客戶資料 */
  customer?: Customer
  /** 表單模式: create(新增) | edit(編輯) */
  mode?: "create" | "edit"
  /** 載入中狀態 */
  loading?: boolean
}

interface Emits {
  /** 提交表單 */
  (e: "submit", data: CreateCustomerRequest | UpdateCustomerRequest): void
  /** 取消操作 */
  (e: "cancel"): void
}

const props = withDefaults(defineProps<Props>(), {
  mode: "create",
  loading: false
})

const emit = defineEmits<Emits>()

/** 表單實例 */
const formRef = ref<FormInstance>()

/** AI 辨識區塊展開狀態 */
const aiCollapseActive = ref<string[]>([])

/** 上傳元件實例 */
const uploadRef = ref<InstanceType<typeof IdCardUpload>>()

/** 表單資料 */
const formData = ref({
  name: "",
  phoneNumber: "",
  email: "",
  idNumber: "",
  residentialAddress: "",
  lineId: "",
  version: undefined as number | undefined
})

/** 表單驗證規則 */
const rules = computed(() => {
  return props.mode === "create" ? createCustomerRules : updateCustomerRules
})

/** 表單標題 */
const title = computed(() => {
  return props.mode === "create" ? "新增客戶" : "編輯客戶"
})

/** 監聽客戶資料變更,填入表單 */
watch(
  () => props.customer,
  (newCustomer) => {
    if (newCustomer && props.mode === "edit") {
      formData.value = {
        name: newCustomer.name,
        phoneNumber: newCustomer.phoneNumber,
        email: newCustomer.email || "",
        idNumber: newCustomer.idNumber,
        residentialAddress: newCustomer.residentialAddress,
        lineId: newCustomer.lineId || "",
        version: newCustomer.version
      }
    } else if (props.mode === "create") {
      formData.value = {
        name: "",
        phoneNumber: "",
        email: "",
        idNumber: "",
        residentialAddress: "",
        lineId: "",
        version: undefined
      }
    }
  },
  { immediate: true }
)
/** 提交表單 */
async function handleSubmit() {
  if (!formRef.value) return

  try {
    await formRef.value.validate()

    // 根據模式組裝資料
    if (props.mode === "create") {
      const submitData: CreateCustomerRequest = {
        name: formData.value.name,
        phoneNumber: formData.value.phoneNumber,
        email: formData.value.email || undefined,
        idNumber: formData.value.idNumber,
        residentialAddress: formData.value.residentialAddress,
        lineId: formData.value.lineId || undefined
      }
      emit("submit", submitData)
    } else {
      const submitData: UpdateCustomerRequest = {
        name: formData.value.name,
        phoneNumber: formData.value.phoneNumber,
        email: formData.value.email || undefined,
        residentialAddress: formData.value.residentialAddress,
        lineId: formData.value.lineId || undefined,
        version: formData.value.version!
      }
      emit("submit", submitData)
    }
  } catch {
    ElMessage.warning("請檢查表單欄位")
  }
}

/** 重設表單 */
function handleReset() {
  formRef.value?.resetFields()
  uploadRef.value?.clear()
  aiCollapseActive.value = []
  emit("cancel")
}

/**
 * 處理 AI 辨識結果
 */
function handleRecognize(result: {
  name: string | null
  idNumber: string | null
  address: string | null
}) {
  // 回填辨識結果
  if (result.name) {
    formData.value.name = result.name
  }
  if (result.idNumber) {
    formData.value.idNumber = result.idNumber
  }
  if (result.address) {
    formData.value.residentialAddress = result.address
  }

  // 收起 AI 辨識區塊
  aiCollapseActive.value = []

  ElMessage.success("辨識結果已自動填入,請確認後提交")
}

/** 暴露方法給父元件 */
defineExpose({
  resetFields: () => {
    formRef.value?.resetFields()
    uploadRef.value?.clear()
    aiCollapseActive.value = []
  },
  validate: () => formRef.value?.validate()
})
</script>

<template>
  <div class="customer-form">
    <h3>{{ title }}</h3>

    <!-- AI 辨識區塊 (僅新增模式) -->
    <ElCollapse v-if="mode === 'create'" v-model="aiCollapseActive" class="ai-collapse">
      <ElCollapseItem name="ai" title="🤖 AI 身分證辨識 (選用)">
        <template #title>
          <div class="collapse-title">
            <ElIcon :size="18" color="#409eff">
              <Cpu />
            </ElIcon>
            <span>AI 身分證辨識 (選用)</span>
          </div>
        </template>
        <IdCardUpload ref="uploadRef" @recognize="handleRecognize" />
      </ElCollapseItem>
    </ElCollapse>

    <ElForm
      ref="formRef"
      :model="formData"
      :rules="rules"
      label-width="120px"
      label-position="right"
    >
      <!-- 姓名 -->
      <ElFormItem label="姓名" prop="name">
        <ElInput
          v-model="formData.name"
          placeholder="請輸入客戶姓名"
          maxlength="100"
          show-word-limit
          clearable
        />
      </ElFormItem>

      <!-- 身分證字號 -->
      <ElFormItem label="身分證字號" prop="idNumber">
        <ElInput
          v-model="formData.idNumber"
          placeholder="請輸入身分證字號 (例: A123456789)"
          maxlength="10"
          :disabled="mode === 'edit'"
          clearable
        />
        <template #extra>
          <span v-if="mode === 'edit'" class="form-tip">
            身分證字號不可修改
          </span>
        </template>
      </ElFormItem>

      <!-- 聯絡電話 -->
      <ElFormItem label="聯絡電話" prop="phoneNumber">
        <ElInput
          v-model="formData.phoneNumber"
          placeholder="請輸入手機號碼 (例: 0912345678)"
          maxlength="10"
          clearable
        />
      </ElFormItem>

      <!-- 電子郵件 -->
      <ElFormItem label="電子郵件" prop="email">
        <ElInput
          v-model="formData.email"
          placeholder="請輸入電子郵件 (選填)"
          maxlength="100"
          type="email"
          clearable
        />
      </ElFormItem>

      <!-- 居住地址 -->
      <ElFormItem label="居住地址" prop="residentialAddress">
        <ElInput
          v-model="formData.residentialAddress"
          type="textarea"
          placeholder="請輸入居住地址"
          maxlength="200"
          :rows="3"
          show-word-limit
          clearable
        />
      </ElFormItem>

      <!-- LINE ID -->
      <ElFormItem label="LINE ID" prop="lineId">
        <ElInput
          v-model="formData.lineId"
          placeholder="請輸入 LINE ID (選填)"
          maxlength="50"
          clearable
        />
      </ElFormItem>

      <!-- 按鈕區 -->
      <ElFormItem>
        <ElButton
          type="primary"
          :loading="props.loading"
          @click="handleSubmit"
        >
          {{ mode === 'create' ? '新增' : '更新' }}
        </ElButton>
        <ElButton @click="handleReset">
          取消
        </ElButton>
      </ElFormItem>
    </ElForm>
  </div>
</template>

<style lang="scss" scoped>
.customer-form {
  h3 {
    margin-bottom: 20px;
    font-size: 18px;
    font-weight: 600;
    color: var(--el-text-color-primary);
  }

  .ai-collapse {
    margin-bottom: 24px;
    border: 1px solid var(--el-border-color);
    border-radius: 4px;

    .collapse-title {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 14px;
      font-weight: 500;
    }
  }

  .form-tip {
    font-size: 12px;
    color: var(--el-text-color-secondary);
  }
}

:deep(.el-form-item__extra) {
  margin-top: 4px;
}

:deep(.el-collapse-item__header) {
  padding: 12px 16px;
  font-weight: 500;
}

:deep(.el-collapse-item__content) {
  padding: 20px 16px;
}
</style>

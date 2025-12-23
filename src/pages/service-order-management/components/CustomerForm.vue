<script setup lang="ts">
/**
 * 客戶表單元件
 * 用於新增或編輯客戶資料
 */
import type { FormInstance, FormRules } from "element-plus"
import type { CreateCustomerRequest, Customer } from "../types"
import { createCustomer } from "../apis/customer"

const emit = defineEmits<{
  /** 成功事件 */
  success: [customer: Customer]
  /** 取消事件 */
  cancel: []
}>()

const formRef = ref<FormInstance>()
const loading = ref(false)

/** 表單資料 */
const formData = reactive<CreateCustomerRequest>({
  name: "",
  phoneNumber: "",
  email: "",
  idNumber: ""
})

/** 表單驗證規則 */
const rules: FormRules = {
  name: [
    { required: true, message: "請輸入客戶姓名", trigger: "blur" },
    { min: 1, max: 50, message: "姓名長度為 1-50 字元", trigger: "blur" }
  ],
  phoneNumber: [
    { required: true, message: "請輸入電話號碼", trigger: "blur" },
    {
      pattern: /^(09\d{8}|0[2-8]-?\d{7,8})$/,
      message: "請輸入有效的台灣手機號碼或市話",
      trigger: "blur"
    }
  ],
  email: [
    {
      type: "email",
      message: "請輸入有效的 Email 地址",
      trigger: "blur"
    }
  ],
  idNumber: [
    { required: true, message: "請輸入身分證字號", trigger: "blur" },
    {
      validator: (_rule, value, callback) => {
        // 台灣身分證格式：1 英文字母 + 9 數字
        const taiwanIdPattern = /^[A-Z]\d{9}$/
        // 外籍人士格式：出生年月日(8位) + 英文姓名前2碼(大寫)
        const foreignIdPattern = /^\d{8}[A-Z]{2}$/

        if (!value) {
          callback()
          return
        }

        if (taiwanIdPattern.test(value) || foreignIdPattern.test(value)) {
          callback()
        } else {
          callback(new Error("身分證字號格式不正確"))
        }
      },
      trigger: "blur"
    }
  ]
}

/**
 * 提交表單
 */
async function handleSubmit() {
  if (!formRef.value)
    return

  await formRef.value.validate(async (valid) => {
    if (!valid)
      return

    loading.value = true
    try {
      const response = await createCustomer(formData)
      if (response.success && response.data) {
        ElMessage.success("新增客戶成功")
        emit("success", response.data)
        resetForm()
      } else {
        ElMessage.error(response.message || "新增客戶失敗")
      }
    } catch {
      ElMessage.error("新增客戶失敗，請稍後再試")
    } finally {
      loading.value = false
    }
  })
}

/**
 * 取消
 */
function handleCancel() {
  emit("cancel")
  resetForm()
}

/**
 * 重置表單
 */
function resetForm() {
  formRef.value?.resetFields()
  formData.name = ""
  formData.phoneNumber = ""
  formData.email = ""
  formData.idNumber = ""
}

/**
 * 使用 OCR 辨識結果填入表單
 */
function fillFromOCR(data: { name: string, idCardNumber: string }) {
  formData.name = data.name
  formData.idNumber = data.idCardNumber
}

// 暴露方法供父元件使用
defineExpose({
  resetForm,
  fillFromOCR
})
</script>

<template>
  <el-form
    ref="formRef"
    :model="formData"
    :rules="rules"
    label-width="120px"
    :disabled="loading"
  >
    <el-form-item label="客戶姓名" prop="name">
      <el-input
        v-model="formData.name"
        placeholder="請輸入客戶姓名"
        maxlength="50"
        show-word-limit
      />
    </el-form-item>

    <el-form-item label="電話號碼" prop="phoneNumber">
      <el-input
        v-model="formData.phoneNumber"
        placeholder="請輸入手機號碼或市話（例如：0912345678）"
        maxlength="15"
      />
    </el-form-item>

    <el-form-item label="Email" prop="email">
      <el-input
        v-model="formData.email"
        type="email"
        placeholder="請輸入 Email（選填）"
        maxlength="100"
      />
    </el-form-item>

    <el-form-item label="身分證字號" prop="idNumber">
      <el-input
        v-model="formData.idNumber"
        placeholder="請輸入身分證字號"
        maxlength="11"
        @input="formData.idNumber = formData.idNumber.toUpperCase()"
      >
        <template #append>
          <el-tooltip
            content="台灣國民：1英文+9數字（如A123456789）&#10;外籍人士：出生年月日8位+姓名前2碼（如19900115JO）"
            raw-content
          >
            <el-icon><QuestionFilled /></el-icon>
          </el-tooltip>
        </template>
      </el-input>
    </el-form-item>

    <el-form-item>
      <el-button @click="handleCancel">
        取消
      </el-button>
      <el-button type="primary" :loading="loading" @click="handleSubmit">
        確定
      </el-button>
    </el-form-item>
  </el-form>
</template>

<style scoped lang="scss">
// 如有需要可添加自訂樣式
</style>

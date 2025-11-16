<script setup lang="ts">
import { useUserForm } from "../composables/useUserForm"

const emit = defineEmits<{
  /** 表單提交成功事件 */
  success: []
}>()

const { formRef, formData, formLoading, rules, submitForm, resetForm } = useUserForm()

/**
 * 處理表單提交
 */
async function handleSubmit(): Promise<void> {
  const success = await submitForm()
  if (success) {
    emit("success")
    resetForm()
  }
}

/**
 * 處理取消
 */
function handleCancel(): void {
  resetForm()
}

// 暴露 resetForm 方法供父元件呼叫
defineExpose({ resetForm })
</script>

<template>
  <el-form
    ref="formRef"
    :model="formData"
    :rules="rules"
    label-width="120px"
    :disabled="formLoading"
  >
    <el-form-item label="用戶名" prop="username">
      <el-input
        v-model="formData.username"
        placeholder="請輸入用戶名（3-20 字元，僅英數字與底線）"
        maxlength="20"
        show-word-limit
      />
    </el-form-item>
    <el-form-item label="密碼" prop="password">
      <el-input
        v-model="formData.password"
        type="password"
        placeholder="請輸入密碼（最少 8 字元，包含大小寫字母與數字）"
        show-password
      />
    </el-form-item>
    <el-form-item label="顯示名稱" prop="displayName">
      <el-input
        v-model="formData.displayName"
        placeholder="請輸入顯示名稱"
        maxlength="100"
        show-word-limit
      />
    </el-form-item>
    <el-form-item>
      <el-button type="primary" :loading="formLoading" @click="handleSubmit">
        提交
      </el-button>
      <el-button @click="handleCancel">
        取消
      </el-button>
    </el-form-item>
  </el-form>
</template>

<script setup lang="ts">
import type { User } from "../types"
import { useUserForm } from "../composables/useUserForm"

const emit = defineEmits<{
  /** 表單提交成功事件 */
  success: []
}>()

const { formRef, formData, formLoading, isEditMode, rules, submitForm, resetForm, setEditMode }
  = useUserForm()

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

/**
 * 設置編輯模式（公開方法供父元件呼叫）
 * @param user - 待編輯的用戶
 */
function setupEdit(user: User): void {
  setEditMode(user)
}

// 暴露方法供父元件呼叫
defineExpose({ resetForm, setupEdit })
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
        :readonly="isEditMode"
        placeholder="請輸入用戶名（3-20 字元，僅英數字與底線）"
        maxlength="20"
        show-word-limit
      />
    </el-form-item>
    <el-form-item label="密碼" prop="password" v-if="!isEditMode">
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
        {{ isEditMode ? "更新" : "提交" }}
      </el-button>
      <el-button @click="handleCancel">
        取消
      </el-button>
    </el-form-item>
  </el-form>
</template>

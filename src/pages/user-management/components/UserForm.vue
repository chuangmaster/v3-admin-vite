<script setup lang="ts">
import type { Ref } from "vue"
import type { User } from "../types"

import { ref } from "vue"

import { useChangePasswordForm } from "../composables/useChangePasswordForm"
import { useUserForm } from "../composables/useUserForm"

const emit = defineEmits<{
  /** 表單提交成功事件 */
  success: []
  /** 取消事件 */
  cancel: []
}>()

/** 活躍分頁 */
const activeTab: Ref<string | number> = ref("info")

// ============ 信息表單 ============
const { formRef, formData, formLoading, isEditMode, rules, submitForm, resetForm, setEditMode }
  = useUserForm()

// ============ 密碼表單 ============
const { formRef: passwordFormRef, formData: passwordData, formLoading: passwordLoading, rules: passwordRules, submitForm: submitPasswordForm, resetForm: resetPasswordForm, setUserId }
  = useChangePasswordForm()

/**
 * 處理表單提交
 */
async function handleSubmit(): Promise<void> {
  if (activeTab.value === "info") {
    const success = await submitForm()
    if (success) {
      emit("success")
      resetForm()
    }
  } else if (activeTab.value === "password") {
    const success = await submitPasswordForm()
    if (success) {
      emit("success")
      resetPasswordForm()
    }
  }
}

/**
 * 處理取消
 */
function handleCancel(): void {
  resetForm()
  resetPasswordForm()
  emit("cancel")
}

/**
 * 設置編輯模式（公開方法供父元件呼叫）
 * @param user - 待編輯的用戶
 */
function setupEdit(user: User): void {
  activeTab.value = "info"
  setEditMode(user)
  setUserId(user.id)
}

// 暴露方法供父元件呼叫
defineExpose({
  resetForm,
  setupEdit,
  handleSubmit,
  handleCancel,
  activeTab
})
</script>

<template>
  <el-tabs v-model="activeTab">
    <!-- 信息修改分頁 -->
    <el-tab-pane label="修改資料" name="info">
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
        <el-form-item v-if="!isEditMode" label="密碼" prop="password">
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
      </el-form>
    </el-tab-pane>

    <!-- 密碼修改分頁（僅在編輯模式下顯示） -->
    <el-tab-pane v-if="isEditMode" label="修改密碼" name="password">
      <el-form
        ref="passwordFormRef"
        :model="passwordData"
        :rules="passwordRules"
        label-width="120px"
        :disabled="passwordLoading"
      >
        <el-form-item label="舊密碼" prop="oldPassword">
          <el-input
            v-model="passwordData.oldPassword"
            type="password"
            placeholder="請輸入舊密碼"
            show-password
          />
        </el-form-item>
        <el-form-item label="新密碼" prop="newPassword">
          <el-input
            v-model="passwordData.newPassword"
            type="password"
            placeholder="請輸入新密碼（最少 8 字元，包含大小寫字母與數字）"
            show-password
          />
        </el-form-item>
        <el-form-item label="確認密碼" prop="confirmPassword">
          <el-input
            v-model="passwordData.confirmPassword"
            type="password"
            placeholder="請確認新密碼"
            show-password
          />
        </el-form-item>
      </el-form>
    </el-tab-pane>
  </el-tabs>
</template>

<style scoped lang="scss"></style>

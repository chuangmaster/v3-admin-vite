<script setup lang="ts">
import type { Ref } from "vue"
import type { User } from "../types"

import { ref } from "vue"

import { useChangePasswordForm } from "../composables/useChangePasswordForm"
import { useUserForm } from "../composables/useUserForm"
import { useUserRoles } from "../composables/useUserRoles"

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

// ============ 角色表單 ============
const { formLoading: roleFormLoading, formData: roleFormData, availableRoles, fetchRoles, fetchUserRoles, submitForm: submitRoleForm, resetForm: resetRoleForm, setUserId: setRoleUserId }
  = useUserRoles()

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
  } else if (activeTab.value === "roles") {
    const success = await submitRoleForm()
    if (success) {
      emit("success")
    }
  }
}

/**
 * 處理取消
 */
function handleCancel(): void {
  resetForm()
  resetPasswordForm()
  resetRoleForm()
  emit("cancel")
}

/**
 * 設置編輯模式（公開方法供父元件呼叫）
 * @param user - 待編輯的用戶
 */
async function setupEdit(user: User): Promise<void> {
  activeTab.value = "info"
  setEditMode(user)
  setUserId(user.id, user.version)
  setRoleUserId(user.id)
  // 預先載入可用角色列表和使用者的角色
  await fetchRoles()
  await fetchUserRoles()
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
        <el-form-item label="用戶名" prop="account">
          <el-input
            v-model="formData.account"
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
    <el-tab-pane v-if="isEditMode" label="重設密碼" name="password">
      <el-form
        ref="passwordFormRef"
        :model="passwordData"
        :rules="passwordRules"
        label-width="120px"
        :disabled="passwordLoading"
      >
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

    <!-- 角色分配分頁（僅在編輯模式下顯示，需要 users:assign-roles 權限） -->
    <el-tab-pane v-if="isEditMode" v-permission="['role.assign']" label="角色分配" name="roles">
      <div class="role-assignment">
        <el-form label-width="120px" :disabled="roleFormLoading">
          <el-form-item label="角色">
            <el-select
              v-model="roleFormData.selectedRoleIds"
              multiple
              filterable
              clearable
              placeholder="請選擇要分配的角色"
              :loading="roleFormLoading"
              style="width: 100%"
            >
              <el-option
                v-for="role in availableRoles"
                :key="role.id"
                :label="role.roleName"
                :value="role.id"
              />
            </el-select>
          </el-form-item>
        </el-form>
      </div>
    </el-tab-pane>
  </el-tabs>
</template>

<style scoped lang="scss">
.role-assignment {
  padding: 20px 0;
}
</style>

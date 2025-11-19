<script setup lang="ts">
import type { FormItemRule } from "element-plus"
import { usePermissionForm } from "../composables/usePermissionForm"

const emit = defineEmits<{
  success: []
  close: []
  conflict: []
  refresh: []
}>()

const { formData, isEditMode, loading, resetForm, loadPermission, handleSubmit, handleCancel }
  = usePermissionForm(emit)

// 表單驗證規則
const nameRules: FormItemRule[] = [
  { required: true, message: "請輸入權限名稱", trigger: "blur" },
  { min: 1, max: 100, message: "權限名稱長度為 1-100 字元", trigger: "blur" }
]

const codeRules: FormItemRule[] = [
  { required: true, message: "請輸入權限代碼", trigger: "blur" },
  {
    validator: (_rule, value, callback) => {
      if (!value) {
        callback()
        return
      }
      const pattern = /^\w+\.\w+(?:\.\w+)?$/
      if (!pattern.test(value)) {
        callback(new Error("權限代碼格式不正確（格式：module.action，最多三層）"))
      } else {
        callback()
      }
    },
    trigger: "blur"
  }
]

const permissionTypeRules: FormItemRule[] = [
  { required: true, message: "請選擇權限類型", trigger: "change" }
]

const descriptionRules: FormItemRule[] = [
  { max: 500, message: "描述最多 500 字元", trigger: "blur" }
]

const permissionTypeOptions = [
  { label: "功能", value: "function" },
  { label: "頁面", value: "view" }
]

defineExpose({
  resetForm,
  loadPermission
})
</script>

<template>
  <form @submit.prevent="handleSubmit">
    <!-- 權限名稱 -->
    <el-form-item label="權限名稱" :rules="nameRules">
      <el-input
        v-model="formData.name"
        placeholder="請輸入權限名稱"
        maxlength="100"
        show-word-limit
        clearable
      />
    </el-form-item>

    <!-- 權限代碼 -->
    <el-form-item label="權限代碼" :rules="codeRules">
      <el-input
        v-model="formData.permissionCode"
        placeholder="格式：module.action（如：permission.create）"
        maxlength="100"
        clearable
        :disabled="isEditMode"
      />
      <template #description>
        格式為 module.action 或 module.submodule.action（最多三層），允許英文字母、數字、底線
      </template>
    </el-form-item>

    <!-- 權限類型 -->
    <el-form-item label="權限類型" :rules="permissionTypeRules">
      <el-select
        v-model="formData.permissionType"
        placeholder="請選擇權限類型"
        clearable
        :disabled="isEditMode"
      >
        <el-option
          v-for="option in permissionTypeOptions"
          :key="option.value"
          :label="option.label"
          :value="option.value"
        />
      </el-select>
    </el-form-item>

    <!-- 權限描述 -->
    <el-form-item label="權限描述" :rules="descriptionRules">
      <el-input
        v-model="formData.description"
        type="textarea"
        placeholder="請輸入權限描述（可選）"
        maxlength="500"
        show-word-limit
        :rows="4"
      />
    </el-form-item>

    <!-- 操作按鈕 -->
    <div class="form-actions">
      <el-button type="primary" :loading="loading" @click="handleSubmit">
        {{ isEditMode ? '更新' : '建立' }}
      </el-button>
      <el-button @click="handleCancel">
        取消
      </el-button>
    </div>
  </form>
</template>

<style scoped lang="scss">
.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 20px;
}
</style>

<script setup lang="ts">
import type { FormInstance, FormRules } from "element-plus"
import { ref } from "vue"

import PermissionSelector from "./PermissionSelector.vue"

interface Props {
  modelValue: boolean
  title: string
  loading: boolean
  formData: any
  rules: FormRules
  permissions?: any[]
}

interface Emits {
  (e: "update:modelValue", value: boolean): void
  (e: "submit"): void
  (e: "update:formData", value: any): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const formRef = ref<FormInstance>()

defineExpose({ formRef })

function handleClose() {
  emit("update:modelValue", false)
}

function handleSubmit() {
  emit("submit")
}

function handleRoleNameChange(val: string) {
  emit("update:formData", {
    ...props.formData,
    roleName: val
  })
}

function handleDescriptionChange(val: string) {
  emit("update:formData", {
    ...props.formData,
    description: val
  })
}

function handlePermissionChange(permissions: string[]) {
  emit("update:formData", {
    ...props.formData,
    selectedPermissionIds: permissions
  })
}
</script>

<template>
  <el-dialog
    :model-value="props.modelValue"
    :title="props.title"
    width="550px"
    :close-on-click-modal="false"
    :close-on-press-escape="false"
    @close="handleClose"
  >
    <el-form
      ref="formRef"
      :model="props.formData"
      :rules="props.rules"
      label-width="100px"
      v-loading="props.loading"
    >
      <el-form-item label="角色名稱" prop="roleName">
        <el-input
          :value="props.formData.roleName"
          placeholder="請輸入角色名稱 (1-100 字元)"
          maxlength="100"
          clearable
          @input="handleRoleNameChange"
        />
      </el-form-item>

      <el-form-item label="角色描述" prop="description">
        <el-input
          :value="props.formData.description"
          type="textarea"
          :rows="3"
          placeholder="請輸入角色描述（選填，最多 500 字元）"
          maxlength="500"
          show-word-limit
          @input="handleDescriptionChange"
        />
      </el-form-item>

      <el-collapse>
        <el-collapse-item title="權限設定" name="permissions">
          <PermissionSelector
            :model-value="props.formData.selectedPermissionIds"
            :permissions="props.permissions"
            @update:model-value="handlePermissionChange"
          />
        </el-collapse-item>
      </el-collapse>
    </el-form>

    <template #footer>
      <span class="dialog-footer">
        <el-button @click="handleClose">取消</el-button>
        <el-button type="primary" @click="handleSubmit" :loading="props.loading">
          確定
        </el-button>
      </span>
    </template>
  </el-dialog>
</template>

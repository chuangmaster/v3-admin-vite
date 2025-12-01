<script setup lang="ts">
import type { FormInstance, FormRules } from "element-plus"
import { ref, watch } from "vue"

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
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const formRef = ref<FormInstance>()

// 創建本地表單數據副本，確保雙向綁定工作正常
const localFormData = ref({ ...props.formData })

// 監聽 prop 的變更
watch(() => props.formData, (newVal) => {
  Object.assign(localFormData.value, newVal)
}, { deep: true })

// 監聽本地表單數據的變更，同步回 prop
watch(() => localFormData.value, (newVal) => {
  Object.assign(props.formData, newVal)
}, { deep: true })

defineExpose({ formRef })

function handleClose() {
  emit("update:modelValue", false)
}

function handleSubmit() {
  emit("submit")
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
      :model="localFormData"
      :rules="props.rules"
      label-width="100px"
      v-loading="props.loading"
    >
      <el-form-item label="角色名稱" prop="roleName">
        <el-input
          v-model="localFormData.roleName"
          placeholder="請輸入角色名稱 (1-100 字元)"
          maxlength="100"
          clearable
        />
      </el-form-item>

      <el-form-item label="角色描述" prop="description">
        <el-input
          v-model="localFormData.description"
          type="textarea"
          :rows="3"
          placeholder="請輸入角色描述（選填，最多 500 字元）"
          maxlength="500"
          show-word-limit
        />
      </el-form-item>

      <el-collapse>
        <el-collapse-item title="權限設定" name="permissions">
          <PermissionSelector
            :model-value="localFormData.selectedPermissionIds"
            :permissions="props.permissions"
            @update:model-value="(val) => localFormData.selectedPermissionIds = val"
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

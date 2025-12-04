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
  (e: "update:formData", value: any): void
  (e: "submitRole"): void
  (e: "submitPermission"): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const formRef = ref<FormInstance>()

defineExpose({ formRef })

function handleClose() {
  emit("update:modelValue", false)
}

function handleSubmitRole() {
  emit("submitRole")
}

function handleSubmitPermission() {
  emit("submitPermission")
}

function handleRoleNameChange(val: string) {
  emit("update:formData", { ...props.formData, roleName: val })
}

function handleDescriptionChange(val: string) {
  emit("update:formData", { ...props.formData, description: val })
}

function handlePermissionsChange(val: string[]) {
  emit("update:formData", { ...props.formData, selectedPermissionIds: val })
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
    <!-- 角色基本資訊區塊 -->
    <div class="form-section">
      <div class="section-title">
        基本資訊
      </div>
      <el-form
        ref="formRef"
        :model="props.formData"
        :rules="props.rules"
        label-width="100px"
        v-loading="props.loading"
      >
        <el-form-item label="角色名稱" prop="roleName">
          <el-input
            :model-value="props.formData?.roleName"
            placeholder="請輸入角色名稱 (1-100 字元)"
            maxlength="100"
            clearable
            @update:model-value="handleRoleNameChange"
          />
        </el-form-item>

        <el-form-item label="角色描述" prop="description">
          <el-input
            :model-value="props.formData?.description"
            type="textarea"
            :rows="3"
            placeholder="請輸入角色描述（選填，最多 500 字元）"
            maxlength="500"
            show-word-limit
            @update:model-value="handleDescriptionChange"
          />
        </el-form-item>
      </el-form>
      <div class="section-footer">
        <el-button @click="handleClose">
          取消
        </el-button>
        <el-button type="primary" @click="handleSubmitRole" :loading="props.loading">
          保存角色
        </el-button>
      </div>
    </div>

    <!-- 權限設定區塊 -->
    <div class="form-section">
      <div class="section-title">
        權限設定
      </div>
      <el-collapse>
        <el-collapse-item title="選擇權限" name="permissions">
          <PermissionSelector
            :model-value="props.formData?.selectedPermissionIds || []"
            :permissions="props.permissions"
            @update:model-value="handlePermissionsChange"
          />
        </el-collapse-item>
      </el-collapse>
      <div class="section-footer">
        <el-button @click="handleClose">
          取消
        </el-button>
        <el-button type="success" @click="handleSubmitPermission" :loading="props.loading">
          保存權限
        </el-button>
      </div>
    </div>

    <template #footer />
  </el-dialog>
</template>

<style scoped lang="scss">
.form-section {
  margin-bottom: 24px;
  padding: 16px 0;
  border-bottom: 1px solid var(--el-border-color-lighter);

  &:last-of-type {
    border-bottom: none;
  }

  .section-title {
    font-size: 14px;
    font-weight: 600;
    color: var(--el-text-color-primary);
    margin-bottom: 16px;
    padding-bottom: 8px;
    border-bottom: 2px solid var(--el-color-primary);
  }

  .section-footer {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
    margin-top: 16px;
    padding-top: 16px;
    border-top: 1px solid var(--el-border-color-lighter);
  }
}
</style>

<script lang="ts" setup>
import { useChangePasswordForm } from "../composables/useChangePassword"

interface Props {
  /** 用戶 ID */
  userId: string
  /** 資料版本號（用於併發控制） */
  version: number
}

const props = defineProps<Props>()

const emit = defineEmits<{
  /** 密碼修改成功 */
  "password-changed": []
  /** 需要重新載入用戶資料（併發衝突時觸發） */
  "refresh-required": []
}>()

const {
  formRef,
  formData,
  rules,
  submitting,
  handleSubmit,
  handleReset
} = useChangePasswordForm(emit)

/** 處理表單提交 */
async function onSubmit(): Promise<void> {
  await handleSubmit(props.userId, props.version)
}
</script>

<template>
  <el-card class="change-password-card">
    <template #header>
      <div class="card-header">
        <span class="title">修改密碼</span>
      </div>
    </template>

    <el-form
      ref="formRef"
      :model="formData"
      :rules="rules"
      label-width="100px"
      @submit.prevent="onSubmit"
    >
      <el-form-item label="舊密碼" prop="oldPassword">
        <el-input
          v-model="formData.oldPassword"
          type="password"
          placeholder="請輸入舊密碼"
          show-password
          autocomplete="current-password"
        />
      </el-form-item>

      <el-form-item label="新密碼" prop="newPassword">
        <el-input
          v-model="formData.newPassword"
          type="password"
          placeholder="請輸入新密碼（至少 8 字元，包含大小寫字母與數字）"
          show-password
          autocomplete="new-password"
        />
      </el-form-item>

      <el-form-item label="確認密碼" prop="confirmPassword">
        <el-input
          v-model="formData.confirmPassword"
          type="password"
          placeholder="請再次輸入新密碼"
          show-password
          autocomplete="new-password"
        />
      </el-form-item>

      <el-form-item class="form-actions">
        <el-button
          type="primary"
          :loading="submitting"
          @click="onSubmit"
        >
          {{ submitting ? "提交中..." : "提交" }}
        </el-button>
        <el-button @click="handleReset">
          重置
        </el-button>
      </el-form-item>
    </el-form>
  </el-card>
</template>

<style scoped lang="scss">
.change-password-card {
  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;

    .title {
      font-size: 16px;
      font-weight: 600;
    }
  }

  .form-actions {
    margin-bottom: 0;
  }
}
</style>

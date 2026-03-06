<script setup lang="ts">
import type { FormInstance, FormRules } from "element-plus"
import type { PushNotificationRequest } from "./types"
import { getUserList } from "@/pages/user-management/apis/user"
import { pushNotificationApi } from "./apis"
import { NotificationSeverity, PushMode } from "./types"

defineOptions({ name: "NotificationPush" })

const formRef = ref<FormInstance>()
const loading = ref(false)

const form = ref<PushNotificationRequest>({
  mode: PushMode.Broadcast,
  targetUserId: null,
  title: "",
  message: "",
  severity: NotificationSeverity.Info
})

const rules: FormRules = {
  title: [{ required: true, message: "請輸入通知標題", trigger: "blur" }],
  message: [{ required: true, message: "請輸入通知內容", trigger: "blur" }],
  targetUserId: [{
    validator: (_rule, value, callback) => {
      if (form.value.mode === PushMode.Targeted && !value) {
        callback(new Error("指定推播模式須選擇目標用戶"))
      } else {
        callback()
      }
    },
    trigger: "change"
  }]
}

const severityOptions = [
  { label: "一般", value: NotificationSeverity.Info },
  { label: "警告", value: NotificationSeverity.Warning },
  { label: "錯誤", value: NotificationSeverity.Error }
]

const modeOptions = [
  { label: "廣播（所有用戶）", value: PushMode.Broadcast },
  { label: "指定用戶", value: PushMode.Targeted }
]

// 用戶列表（供指定推播選擇）
const userOptions = ref<{ id: string, displayName: string, account: string }[]>([])
const userLoading = ref(false)

async function fetchUsers() {
  userLoading.value = true
  try {
    const { data } = await getUserList({ pageNumber: 1, pageSize: 100 })
    userOptions.value = (data as any)?.items ?? data ?? []
  } catch {
    userOptions.value = []
  } finally {
    userLoading.value = false
  }
}

function handleModeChange() {
  if (form.value.mode === PushMode.Targeted && userOptions.value.length === 0) {
    fetchUsers()
  }
  if (form.value.mode === PushMode.Broadcast) {
    form.value.targetUserId = null
  }
}

async function handleSubmit() {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return

  loading.value = true
  try {
    await pushNotificationApi(form.value)
    ElMessage.success("推播成功")
    formRef.value?.resetFields()
    form.value.mode = PushMode.Broadcast
    form.value.targetUserId = null
    form.value.severity = NotificationSeverity.Info
  } catch {
    ElMessage.error("推播失敗")
  } finally {
    loading.value = false
  }
}

function handleReset() {
  formRef.value?.resetFields()
  form.value.mode = PushMode.Broadcast
  form.value.targetUserId = null
  form.value.severity = NotificationSeverity.Info
}
</script>

<template>
  <div class="notification-push-page">
    <el-card>
      <template #header>
        <span class="card-title">主動推播通知</span>
      </template>

      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-width="120px"
        style="max-width: 600px"
      >
        <el-form-item label="推播模式" prop="mode">
          <el-radio-group v-model="form.mode" @change="handleModeChange">
            <el-radio
              v-for="opt in modeOptions"
              :key="opt.value"
              :value="opt.value"
            >
              {{ opt.label }}
            </el-radio>
          </el-radio-group>
        </el-form-item>

        <el-form-item
          v-if="form.mode === PushMode.Targeted"
          label="目標用戶"
          prop="targetUserId"
        >
          <el-select
            v-model="form.targetUserId"
            placeholder="請選擇用戶"
            filterable
            :loading="userLoading"
            style="width: 100%"
          >
            <el-option
              v-for="user in userOptions"
              :key="user.id"
              :label="`${user.displayName}（${user.account}）`"
              :value="user.id"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="嚴重程度" prop="severity">
          <el-select v-model="form.severity" style="width: 160px">
            <el-option
              v-for="opt in severityOptions"
              :key="opt.value"
              :label="opt.label"
              :value="opt.value"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="通知標題" prop="title">
          <el-input
            v-model="form.title"
            maxlength="100"
            show-word-limit
            placeholder="請輸入通知標題"
          />
        </el-form-item>

        <el-form-item label="通知內容" prop="message">
          <el-input
            v-model="form.message"
            type="textarea"
            :rows="4"
            maxlength="500"
            show-word-limit
            placeholder="請輸入通知內容"
          />
        </el-form-item>

        <el-form-item>
          <el-button type="primary" :loading="loading" @click="handleSubmit">
            發送推播
          </el-button>
          <el-button @click="handleReset">
            重置
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<style scoped lang="scss">
.notification-push-page {
  padding: 20px;
}

.card-title {
  font-weight: bold;
  font-size: 16px;
}
</style>

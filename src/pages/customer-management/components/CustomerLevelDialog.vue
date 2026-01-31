<!--
  客戶會員等級設定彈窗元件

  功能:
  - 支援三種模式：新增(create)、編輯(edit)、終止(terminate)
  - 新增/編輯模式：等級選擇、日期選擇器、表單驗證
  - 終止模式：確認對話框
  - 日期選擇器顯示本地時區，提交時轉換為 UTC
  - 權限控制：v-permission

  @module customer-management/components/CustomerLevelDialog
-->
<script lang="ts" setup>
import type { FormInstance, FormRules } from "element-plus"
import type { CustomerLevelFormData, CustomerLevelPeriodResponse } from "../types"
import dayjs from "dayjs"
import { computed, reactive, ref, watch } from "vue"
import { CustomerLevel, customerLevelFormRules } from "../types"

/** 對話框模式 */
type DialogMode = "create" | "edit" | "terminate"

interface Props {
  /** 對話框顯示狀態 */
  modelValue: boolean
  /** 對話框模式 */
  mode?: DialogMode
  /** 編輯/終止模式下的現有資料 */
  data?: CustomerLevelPeriodResponse | null
  /** 客戶 ID */
  customerId: string
  /** 客戶姓名（用於顯示） */
  customerName?: string
  /** 載入中狀態 */
  loading?: boolean
}

interface Emits {
  /** 更新顯示狀態 */
  (e: "update:modelValue", value: boolean): void
  /** 提交表單（新增/編輯模式） */
  (e: "submit", formData: CustomerLevelFormData, version?: number): void
  /** 確認終止（終止模式） */
  (e: "terminate"): void
  /** 取消操作 */
  (e: "cancel"): void
}

const props = withDefaults(defineProps<Props>(), {
  mode: "create",
  data: null,
  customerName: "",
  loading: false
})

const emit = defineEmits<Emits>()

/** 表單實例 */
const formRef = ref<FormInstance>()

/** 表單資料 */
const form = reactive<CustomerLevelFormData>({
  level: CustomerLevel.VIP,
  startDate: null,
  endDate: null
})

/** 等級選項 */
const levelOptions = [
  { label: "VIP", value: CustomerLevel.VIP }
]

/** 對話框標題 */
const dialogTitle = computed(() => {
  switch (props.mode) {
    case "create":
      return "設定會員等級"
    case "edit":
      return "編輯會員等級"
    case "terminate":
      return "終止會員"
    default:
      return "設定會員等級"
  }
})

/** 是否為終止模式 */
const isTerminateMode = computed(() => props.mode === "terminate")

/** 是否為編輯模式 */
const isEditMode = computed(() => props.mode === "edit")

/** 確認按鈕文字 */
const confirmButtonText = computed(() => {
  switch (props.mode) {
    case "create":
      return "確認設定"
    case "edit":
      return "確認修改"
    case "terminate":
      return "確認終止"
    default:
      return "確認"
  }
})

/** 確認按鈕類型 */
const confirmButtonType = computed(() => {
  return props.mode === "terminate" ? "danger" : "primary"
})

/** 自訂表單驗證規則（包含日期範圍驗證） */
const formRules = computed<FormRules<CustomerLevelFormData>>(() => ({
  ...customerLevelFormRules,
  endDate: [
    { required: true, message: "請選擇結束日期", trigger: "change" },
    {
      validator: (_rule, value, callback) => {
        if (form.startDate && value) {
          const start = dayjs(form.startDate)
          const end = dayjs(value)
          if (end.isBefore(start) || end.isSame(start)) {
            callback(new Error("結束日期必須晚於開始日期"))
          } else {
            callback()
          }
        } else {
          callback()
        }
      },
      trigger: "change"
    }
  ]
}))

/** 監聽 data 變化，編輯模式下預填表單 */
watch(
  () => [props.modelValue, props.data, props.mode],
  () => {
    if (props.modelValue && props.mode === "edit" && props.data) {
      // 將 UTC ISO 字串轉換為本地 Date 物件
      form.level = props.data.level
      form.startDate = new Date(props.data.startDate)
      form.endDate = new Date(props.data.endDate)
    } else if (props.modelValue && props.mode === "create") {
      // 新增模式，重設表單
      resetForm()
    }
  },
  { immediate: true }
)

/** 重設表單 */
function resetForm() {
  form.level = CustomerLevel.VIP
  form.startDate = null
  form.endDate = null
  formRef.value?.resetFields()
}

/** 處理關閉 */
function handleClose() {
  emit("update:modelValue", false)
  // 延遲重設表單，避免關閉動畫時看到表單清空
  setTimeout(() => {
    resetForm()
  }, 300)
}

/** 處理取消 */
function handleCancel() {
  emit("cancel")
  handleClose()
}

/** 處理提交 */
async function handleSubmit() {
  if (isTerminateMode.value) {
    // 終止模式
    emit("terminate")
    return
  }

  // 表單驗證
  if (!formRef.value) return
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return

  // 發送提交事件
  const formData: CustomerLevelFormData = {
    level: form.level,
    startDate: form.startDate,
    endDate: form.endDate
  }

  if (isEditMode.value && props.data) {
    emit("submit", formData, props.data.version)
  } else {
    emit("submit", formData)
  }
}

/** 日期選擇器快捷選項 */
const dateShortcuts = [
  {
    text: "一年",
    value: () => {
      const start = new Date()
      const end = dayjs(start).add(1, "year").subtract(1, "day").toDate()
      return [start, end]
    }
  },
  {
    text: "半年",
    value: () => {
      const start = new Date()
      const end = dayjs(start).add(6, "month").subtract(1, "day").toDate()
      return [start, end]
    }
  },
  {
    text: "三個月",
    value: () => {
      const start = new Date()
      const end = dayjs(start).add(3, "month").subtract(1, "day").toDate()
      return [start, end]
    }
  }
]
</script>

<template>
  <el-dialog
    :model-value="modelValue"
    :title="dialogTitle"
    width="500px"
    :close-on-click-modal="false"
    destroy-on-close
    @close="handleClose"
  >
    <!-- 終止模式：確認對話框 -->
    <template v-if="isTerminateMode">
      <div class="terminate-confirm">
        <el-alert
          title="警告"
          type="warning"
          :closable="false"
          show-icon
        >
          <template #default>
            <p class="mb-2">
              此操作將立即終止 VIP 資格，終止後無法復原。
            </p>
            <p v-if="customerName">
              客戶：<strong>{{ customerName }}</strong>
            </p>
            <p v-if="data">
              目前等級：<el-tag type="warning" size="small">
                {{ data.level }}
              </el-tag>
            </p>
            <p v-if="data">
              有效期間：{{ dayjs(data.startDate).format("YYYY-MM-DD") }} ~ {{ dayjs(data.endDate).format("YYYY-MM-DD") }}
            </p>
          </template>
        </el-alert>
      </div>
    </template>

    <!-- 新增/編輯模式：表單 -->
    <template v-else>
      <el-form
        ref="formRef"
        :model="form"
        :rules="formRules"
        label-width="100px"
        :disabled="loading"
      >
        <el-form-item label="VIP 等級" prop="level">
          <el-select v-model="form.level" placeholder="請選擇 VIP 等級" class="w-full">
            <el-option
              v-for="option in levelOptions"
              :key="option.value"
              :label="option.label"
              :value="option.value"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="開始日期" prop="startDate">
          <el-date-picker
            v-model="form.startDate"
            type="date"
            placeholder="請選擇開始日期"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
            class="w-full"
            :shortcuts="dateShortcuts.map(s => ({ text: s.text, value: s.value()[0] }))"
          />
        </el-form-item>

        <el-form-item label="結束日期" prop="endDate">
          <el-date-picker
            v-model="form.endDate"
            type="date"
            placeholder="請選擇結束日期"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
            class="w-full"
          />
        </el-form-item>
      </el-form>
    </template>

    <!-- 底部按鈕 -->
    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleCancel">
          取消
        </el-button>
        <el-button
          :type="confirmButtonType"
          :loading="loading"
          @click="handleSubmit"
        >
          {{ confirmButtonText }}
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<style lang="scss" scoped>
.terminate-confirm {
  padding: 10px 0;

  p {
    margin: 8px 0;
    line-height: 1.6;
  }
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.w-full {
  width: 100%;
}

.mb-2 {
  margin-bottom: 8px;
}
</style>

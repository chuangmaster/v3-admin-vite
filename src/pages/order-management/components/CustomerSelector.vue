<script setup lang="ts">
/**
 * 客戶選擇器元件
 *
 * @module order-management/components/CustomerSelector
 * @description 整合客戶搜尋、身分證辨識與新增客戶功能,
 *              選擇後顯示客戶資訊卡片（ElDescriptions）
 */
import type { Customer } from "@/pages/customer-management/types"
import CustomerForm from "@@/components/CustomerForm/index.vue"
import CustomerSearch from "@@/components/CustomerSearch/index.vue"
import IdCardUploader from "@@/components/IdCardUploader/index.vue"
import { ref } from "vue"
import { customerApi } from "@/pages/customer-management/apis/customer"

defineOptions({ name: "CustomerSelector" })

const props = withDefaults(defineProps<Props>(), {
  modelValue: "",
  disabled: false
})

const emit = defineEmits<Emits>()

interface Props {
  /** 已選擇的客戶 ID */
  modelValue?: string
  /** 是否禁用 */
  disabled?: boolean
}

interface Emits {
  (e: "update:modelValue", value: string): void
  (e: "customerChange", customer: Customer | null): void
}

/** 已選擇的客戶 */
const selectedCustomer = ref<Customer | null>(null)

/** 新增客戶對話框 */
const showCustomerDialog = ref(false)
const customerDialogTab = ref<string | number>("idcard")

/** 元件 refs */
const customerFormRef = ref<InstanceType<typeof CustomerForm>>()

/**
 * 處理客戶搜尋選擇
 */
function handleCustomerSelect(customer: Customer) {
  selectedCustomer.value = customer
  emit("update:modelValue", customer.id)
  emit("customerChange", customer)
}

/**
 * 重新選擇客戶
 */
function handleReselect() {
  selectedCustomer.value = null
  emit("update:modelValue", "")
  emit("customerChange", null)
}

/**
 * 開啟新增客戶對話框
 */
function handleCreateCustomer() {
  customerDialogTab.value = "idcard"
  showCustomerDialog.value = true
}

/**
 * 客戶新增成功
 */
function handleCustomerCreated(customer: Customer) {
  selectedCustomer.value = customer
  showCustomerDialog.value = false
  emit("update:modelValue", customer.id)
  emit("customerChange", customer)
  ElMessage.success("客戶新增成功")
}

/**
 * OCR 辨識成功，先從資料庫搜尋是否有既有客戶
 */
async function handleOCRRecognized(data: { name: string, idNumber: string, address?: string }) {
  try {
    const response = await customerApi.search({
      pageNumber: 1,
      pageSize: 20,
      keyword: data.idNumber
    })

    if (response.success && response.data && response.data.length > 0) {
      // 找到既有客戶，提示是否使用
      const customer = response.data[0]

      let nameWarning = ""
      if (data.name && customer.name !== data.name) {
        nameWarning = `\n注意：辨識姓名「${data.name}」與客戶資料「${customer.name}」不一致，請確認`
      }

      ElMessageBox.confirm(
        `找到既有客戶「${customer.name}」，是否使用此客戶資料？${nameWarning}`,
        "找到既有客戶",
        {
          confirmButtonText: "使用既有客戶",
          cancelButtonText: "新增為新客戶",
          type: nameWarning ? "warning" : "info"
        }
      ).then(() => {
        // 使用既有客戶：直接帶入資料並關閉對話框
        selectedCustomer.value = customer
        showCustomerDialog.value = false
        emit("update:modelValue", customer.id)
        emit("customerChange", customer)
        ElMessage.success(`已選擇客戶：${customer.name}`)
      }).catch(() => {
        // 新增為新客戶：將 OCR 資料填入表單
        customerFormRef.value?.fillFromOCR(data)
        customerDialogTab.value = "manual"
        ElMessage.info("請確認客戶資料後提交")
      })
    } else {
      // 未找到既有客戶，填入表單供新增
      customerFormRef.value?.fillFromOCR(data)
      customerDialogTab.value = "manual"
      ElMessage.info("未找到既有客戶，請確認辨識資料後新增")
    }
  } catch {
    // 搜尋失敗，不阻擋流程，填入表單
    customerFormRef.value?.fillFromOCR(data)
    customerDialogTab.value = "manual"
    ElMessage.warning("搜尋客戶失敗，請手動確認客戶資料")
  }
}

/**
 * 設定已選擇的客戶（供外部呼叫,例如編輯模式還原）
 */
function setSelectedCustomer(customer: Customer) {
  selectedCustomer.value = customer
}

defineExpose({
  selectedCustomer,
  setSelectedCustomer
})
</script>

<template>
  <div class="customer-selector">
    <!-- 未選擇客戶：搜尋與新增 -->
    <div v-if="!selectedCustomer">
      <CustomerSearch
        @select="handleCustomerSelect"
        @create="handleCreateCustomer"
      />
    </div>

    <!-- 已選擇客戶：顯示客戶資訊卡片 -->
    <div v-else class="customer-info">
      <el-descriptions :column="2" border>
        <el-descriptions-item label="客戶姓名">
          {{ selectedCustomer.name }}
        </el-descriptions-item>
        <el-descriptions-item label="電話號碼">
          {{ selectedCustomer.phoneNumber }}
        </el-descriptions-item>
        <el-descriptions-item label="Email">
          {{ selectedCustomer.email || '未提供' }}
        </el-descriptions-item>
        <el-descriptions-item label="身分證字號">
          {{ selectedCustomer.idNumber }}
        </el-descriptions-item>
        <el-descriptions-item label="居住地址" :span="2">
          {{ selectedCustomer.residentialAddress }}
        </el-descriptions-item>
        <el-descriptions-item label="Line ID">
          {{ selectedCustomer.lineId || '未提供' }}
        </el-descriptions-item>
      </el-descriptions>

      <el-button
        v-if="!props.disabled"
        type="primary"
        link
        class="reselect-customer-btn"
        @click="handleReselect"
      >
        重新選擇客戶
      </el-button>
    </div>

    <!-- 新增客戶對話框 -->
    <el-dialog
      v-model="showCustomerDialog"
      title="新增客戶"
      width="90%"
      class="customer-dialog"
      :close-on-click-modal="false"
    >
      <el-tabs v-model="customerDialogTab">
        <el-tab-pane label="身分證辨識" name="idcard">
          <el-alert
            type="info"
            :closable="false"
            show-icon
            style="margin-bottom: 16px"
          >
            上傳或拍攝身分證照片，系統將自動辨識並搜尋既有客戶
          </el-alert>
          <IdCardUploader
            :show-recognize="true"
            @recognized="handleOCRRecognized"
          />
          <div class="dialog-hint">
            辨識後請至「手動輸入」頁籤確認資料
          </div>
        </el-tab-pane>
        <el-tab-pane label="手動輸入" name="manual">
          <CustomerForm
            ref="customerFormRef"
            @success="handleCustomerCreated"
            @cancel="showCustomerDialog = false"
          />
        </el-tab-pane>
      </el-tabs>
    </el-dialog>
  </div>
</template>

<style scoped lang="scss">
.customer-selector {
  width: 100%;
}

.customer-info {
  width: 100%;

  .el-button {
    margin-top: 12px;
  }

  .reselect-customer-btn {
    position: relative;
    z-index: 10;
    margin-bottom: 16px;
  }
}

.dialog-hint {
  margin-top: 16px;
  text-align: center;
  font-size: 13px;
  color: var(--el-text-color-secondary);
}
</style>

<!-- 新增客戶對話框 RWD -->
<style lang="scss">
.customer-dialog {
  max-width: 700px;

  @media (max-width: 768px) {
    width: 95% !important;
    margin: 20px auto;
  }

  @media (max-width: 480px) {
    width: 100% !important;
    margin: 0;
    border-radius: 0;

    .el-dialog__header {
      padding: 16px;
    }

    .el-dialog__body {
      padding: 16px;
    }
  }
}
</style>

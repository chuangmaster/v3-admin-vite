<script setup lang="ts">
/**
 * 建立服務訂單頁面
 * 用於建立收購單或寄賣單
 */
import type { Customer } from "./types"
import { Delete, Edit, EditPen, Goods, Plus, Upload, User } from "@element-plus/icons-vue"
import AttachmentUploader from "./components/AttachmentUploader.vue"
import CustomerForm from "./components/CustomerForm.vue"
import CustomerSearch from "./components/CustomerSearch.vue"
import IdCardUploader from "./components/IdCardUploader.vue"
import ProductItemForm from "./components/ProductItemForm.vue"
import SignaturePad from "./components/SignaturePad.vue"
import { useIdCardRecognition } from "./composables/useIdCardRecognition"
import { useServiceOrderForm } from "./composables/useServiceOrderForm"
import { useSignature } from "./composables/useSignature"
import { AttachmentType, ServiceOrderType } from "./types"

defineOptions({
  name: "ServiceOrderCreate"
})

const router = useRouter()

// 使用業務邏輯 composables
const {
  loading,
  selectedCustomer,
  productItems,
  formData,
  totalAmount,
  setCustomer,
  addProductItem,
  updateProductItem,
  removeProductItem,
  setSignature,
  setIdCardUploaded,
  submitForm
} = useServiceOrderForm()

const { recognitionResult: _recognitionResult } = useIdCardRecognition()
const { saveSignature: _saveSignature } = useSignature()

// 元件 refs
const customerFormRef = ref<InstanceType<typeof CustomerForm>>()
const productItemFormRef = ref<InstanceType<typeof ProductItemForm>>()
const signaturePadRef = ref<InstanceType<typeof SignaturePad>>()

// UI 狀態
const showCustomerDialog = ref(false)
const showProductDialog = ref(false)
const editingProductIndex = ref<number>()

/**
 * 選擇客戶
 */
function handleCustomerSelect(customer: Customer) {
  setCustomer(customer)
  ElMessage.success(`已選擇客戶：${customer.name}`)
}

/**
 * 新增客戶
 */
function handleCreateCustomer() {
  showCustomerDialog.value = true
}

/**
 * 客戶新增成功
 */
function handleCustomerCreated(customer: Customer) {
  setCustomer(customer)
  showCustomerDialog.value = false
  ElMessage.success("客戶新增成功")
}

/**
 * OCR 辨識成功
 */
function handleOCRRecognized(data: { name: string, idCardNumber: string }) {
  // 檢查是否已選擇客戶
  if (selectedCustomer.value) {
    // 比對身分證字號是否一致
    if (selectedCustomer.value.idCardNumber !== data.idCardNumber) {
      ElMessageBox.alert(
        `辨識的身分證字號「${data.idCardNumber}」與已選客戶「${selectedCustomer.value.name}(${selectedCustomer.value.idCardNumber})」不符，請重新選擇客戶`,
        "身分證字號不符",
        {
          confirmButtonText: "確定",
          type: "error",
          callback: () => {
            // 清除已選客戶
            selectedCustomer.value = undefined
            // 填入辨識資料
            customerFormRef.value?.fillFromOCR(data)
            // 自動搜尋客戶
            searchCustomerByIdCard(data.idCardNumber)
          }
        }
      )
      return
    } else {
      // 身分證字號一致，比對姓名
      if (selectedCustomer.value.name !== data.name) {
        ElMessage.warning(`辨識姓名「${data.name}」與客戶資料「${selectedCustomer.value.name}」不一致，請確認`)
      } else {
        ElMessage.success("身分證辨識資料與客戶資料一致")
      }
      return
    }
  }

  // 未選擇客戶，填入客戶表單
  customerFormRef.value?.fillFromOCR(data)

  // 自動使用身分證字號搜尋既有客戶
  searchCustomerByIdCard(data.idCardNumber, data.name)
}

/**
 * 使用身分證字號搜尋客戶
 */
async function searchCustomerByIdCard(idCardNumber: string, ocrName?: string) {
  try {
    // 這裡需要調用客戶搜尋 API
    const { searchCustomers } = await import("./apis/customer")
    const response = await searchCustomers({ keyword: idCardNumber })

    if (response.success && response.data && response.data.length > 0) {
      // 找到客戶，自動選擇第一個
      const customer = response.data[0]

      // 比對姓名一致性
      let nameWarning = ""
      if (ocrName && customer.name !== ocrName) {
        nameWarning = `\n注意：辨識姓名「${ocrName}」與客戶資料「${customer.name}」不一致，請確認`
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
        // 使用既有客戶
        setCustomer(customer)
        showCustomerDialog.value = false
        ElMessage.success(`已選擇客戶：${customer.name}`)
      }).catch(() => {
        // 繼續新增為新客戶，保持表單填入的資料
        ElMessage.info("請確認客戶資料後提交")
      })
    } else {
      // 未找到客戶，顯示提示
      ElMessage.info("未找到既有客戶，請確認辨識資料後新增")
    }
  } catch {
    // 搜尋失敗，不影響新增流程
    ElMessage.warning("搜尋客戶失敗，請手動確認客戶資料")
  }
}

/**
 * 新增商品項目
 */
function handleAddProduct() {
  editingProductIndex.value = undefined
  showProductDialog.value = true
}

/**
 * 編輯商品項目
 */
function handleEditProduct(index: number) {
  editingProductIndex.value = index
  showProductDialog.value = true
}

/**
 * 商品項目提交
 */
function handleProductSubmit(item: any) {
  if (editingProductIndex.value !== undefined) {
    updateProductItem(editingProductIndex.value, item)
    ElMessage.success("商品已更新")
  } else {
    addProductItem(item)
    ElMessage.success("商品已新增")
  }
  showProductDialog.value = false
  productItemFormRef.value?.resetForm()
}

/**
 * 刪除商品項目
 */
function handleRemoveProduct(index: number) {
  ElMessageBox.confirm("確定要刪除此商品項目嗎？", "提示", {
    confirmButtonText: "確定",
    cancelButtonText: "取消",
    type: "warning"
  }).then(() => {
    removeProductItem(index)
    ElMessage.success("已刪除商品項目")
  })
}

/**
 * 簽名完成
 */
function handleSigned(dataUrl: string) {
  setSignature(dataUrl)
}

/**
 * 提交訂單
 */
async function handleSubmit() {
  await submitForm()
}

/**
 * 取消
 */
function handleCancel() {
  ElMessageBox.confirm("確定要取消嗎？未儲存的資料將會遺失", "提示", {
    confirmButtonText: "確定",
    cancelButtonText: "取消",
    type: "warning"
  }).then(() => {
    router.push({ name: "ServiceOrderManagement" })
  })
}
</script>

<template>
  <div class="app-container">
    <el-card shadow="never" class="main-card">
      <template #header>
        <div class="card-header">
          <span class="title">建立服務訂單</span>
          <el-tag v-if="formData.orderType === ServiceOrderType.BUYBACK" type="success">
            收購單
          </el-tag>
          <el-tag v-else type="warning">
            寄賣單
          </el-tag>
        </div>
      </template>

      <el-steps :active="selectedCustomer ? 1 : 0" finish-status="success" class="steps">
        <el-step title="選擇客戶" />
        <el-step title="新增商品" />
        <el-step title="上傳附件" />
        <el-step title="簽名確認" />
      </el-steps>

      <!-- 步驟 1: 選擇客戶 -->
      <el-card shadow="never" class="section-card">
        <template #header>
          <div class="section-title">
            <el-icon><User /></el-icon>
            <span>客戶資訊</span>
          </div>
        </template>

        <div v-if="!selectedCustomer">
          <CustomerSearch
            @select="handleCustomerSelect"
            @create="handleCreateCustomer"
          />
        </div>

        <div v-else class="customer-info">
          <el-descriptions :column="2" border>
            <el-descriptions-item label="客戶姓名">
              {{ selectedCustomer.name }}
            </el-descriptions-item>
            <el-descriptions-item label="電話號碼">
              {{ selectedCustomer.phone }}
            </el-descriptions-item>
            <el-descriptions-item label="Email">
              {{ selectedCustomer.email || '未提供' }}
            </el-descriptions-item>
            <el-descriptions-item label="身分證字號">
              {{ selectedCustomer.idCardNumber }}
            </el-descriptions-item>
          </el-descriptions>
          <el-button type="primary" link @click="selectedCustomer = undefined">
            重新選擇客戶
          </el-button>
        </div>
      </el-card>

      <!-- 步驟 2: 新增商品 -->
      <el-card v-if="selectedCustomer" shadow="never" class="section-card">
        <template #header>
          <div class="section-title">
            <el-icon><Goods /></el-icon>
            <span>商品項目</span>
            <el-button
              type="primary"
              :icon="Plus"
              size="small"
              @click="handleAddProduct"
            >
              新增商品
            </el-button>
          </div>
        </template>

        <el-table
          v-if="productItems.length > 0"
          :data="productItems"
          border
          stripe
        >
          <el-table-column type="index" label="#" width="50" />
          <el-table-column prop="category" label="類別" width="120" />
          <el-table-column prop="name" label="商品名稱" />
          <el-table-column prop="weight" label="重量 (g)" width="100">
            <template #default="{ row }">
              {{ row.weight || '-' }}
            </template>
          </el-table-column>
          <el-table-column prop="purity" label="純度" width="100">
            <template #default="{ row }">
              {{ row.purity || '-' }}
            </template>
          </el-table-column>
          <el-table-column prop="unitPrice" label="單價" width="120" align="right">
            <template #default="{ row }">
              NT$ {{ row.unitPrice?.toLocaleString() || 0 }}
            </template>
          </el-table-column>
          <el-table-column prop="quantity" label="數量" width="80" align="center" />
          <el-table-column prop="totalPrice" label="小計" width="120" align="right">
            <template #default="{ row }">
              <el-tag type="success">
                NT$ {{ row.totalPrice?.toLocaleString() || 0 }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="120" fixed="right">
            <template #default="{ $index }">
              <el-button
                type="primary"
                link
                size="small"
                :icon="Edit"
                @click="handleEditProduct($index)"
              >
                編輯
              </el-button>
              <el-button
                type="danger"
                link
                size="small"
                :icon="Delete"
                @click="handleRemoveProduct($index)"
              >
                刪除
              </el-button>
            </template>
          </el-table-column>
        </el-table>

        <el-empty v-else description="尚未新增商品項目">
          <el-button type="primary" @click="handleAddProduct">
            新增第一個商品
          </el-button>
        </el-empty>

        <div v-if="productItems.length > 0" class="total-amount">
          <span>總金額：</span>
          <el-tag type="danger" size="large" effect="dark">
            NT$ {{ totalAmount.toLocaleString() }}
          </el-tag>
        </div>
      </el-card>

      <!-- 步驟 3: 上傳附件 -->
      <el-card v-if="productItems.length > 0" shadow="never" class="section-card">
        <template #header>
          <div class="section-title">
            <el-icon><Upload /></el-icon>
            <span>上傳附件</span>
            <el-text type="info" size="small" style="margin-left: 12px;">
              請上傳身分證、合約等相關文件（可選）
            </el-text>
          </div>
        </template>

        <el-row :gutter="20">
          <el-col :span="12">
            <div class="attachment-section">
              <div class="attachment-title">
                身分證照片
              </div>
              <AttachmentUploader
                :file-type="AttachmentType.ID_CARD"
                :limit="2"
              />
            </div>
          </el-col>
          <el-col :span="12">
            <div class="attachment-section">
              <div class="attachment-title">
                合約文件
              </div>
              <AttachmentUploader
                :file-type="AttachmentType.CONTRACT"
                :limit="5"
              />
            </div>
          </el-col>
        </el-row>
        <el-row :gutter="20" style="margin-top: 20px;">
          <el-col :span="24">
            <div class="attachment-section">
              <div class="attachment-title">
                其他附件
              </div>
              <AttachmentUploader
                :file-type="AttachmentType.OTHER"
                :limit="10"
              />
            </div>
          </el-col>
        </el-row>
      </el-card>

      <!-- 步驟 4: 簽名確認 -->
      <el-card v-if="productItems.length > 0" shadow="never" class="section-card">
        <template #header>
          <div class="section-title">
            <el-icon><EditPen /></el-icon>
            <span>客戶簽名</span>
          </div>
        </template>

        <SignaturePad
          ref="signaturePadRef"
          @signed="handleSigned"
        />
      </el-card>

      <!-- 操作按鈕 -->
      <div class="action-buttons">
        <el-button @click="handleCancel">
          取消
        </el-button>
        <el-button
          type="primary"
          :loading="loading"
          :disabled="!selectedCustomer || productItems.length === 0"
          @click="handleSubmit"
        >
          建立訂單
        </el-button>
      </div>
    </el-card>

    <!-- 新增客戶對話框 -->
    <el-dialog
      v-model="showCustomerDialog"
      title="新增客戶"
      width="90%"
      class="customer-dialog"
      :close-on-click-modal="false"
    >
      <el-tabs>
        <el-tab-pane label="身分證辨識">
          <el-alert
            title="上傳或拍攝身分證照片，系統將自動辨識並搜尋既有客戶"
            type="info"
            :closable="false"
            style="margin-bottom: 16px;"
          />
          <IdCardUploader
            @recognized="handleOCRRecognized"
            @update:model-value="setIdCardUploaded"
          />
          <el-divider>辨識後請至「手動輸入」頁籤確認資料</el-divider>
        </el-tab-pane>
        <el-tab-pane label="手動輸入">
          <CustomerForm
            ref="customerFormRef"
            @success="handleCustomerCreated"
            @cancel="showCustomerDialog = false"
          />
        </el-tab-pane>
      </el-tabs>
    </el-dialog>

    <!-- 新增/編輯商品對話框 -->
    <el-dialog
      v-model="showProductDialog"
      :title="editingProductIndex !== undefined ? '編輯商品' : '新增商品'"
      width="600px"
      :close-on-click-modal="false"
    >
      <ProductItemForm
        ref="productItemFormRef"
        :order-type="formData.orderType"
        :model-value="editingProductIndex !== undefined ? productItems[editingProductIndex] : undefined"
        @submit="handleProductSubmit"
        @cancel="showProductDialog = false"
      />
    </el-dialog>
  </div>
</template>

<style scoped lang="scss">
.app-container {
  padding: 20px;
  min-height: calc(100vh - 100px);

  .main-card {
    overflow: visible;

    :deep(.el-card__body) {
      overflow: visible;
      min-height: 500px;
    }
  }

  .card-header {
    display: flex;
    align-items: center;
    gap: 12px;

    .title {
      font-size: 18px;
      font-weight: 600;
    }
  }

  .steps {
    margin: 24px 0;
  }

  .section-card {
    margin-top: 20px;
    overflow: visible;

    :deep(.el-card__body) {
      overflow: visible;
    }

    .section-title {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 16px;
      font-weight: 500;

      .el-icon {
        color: var(--el-color-primary);
      }

      .el-button {
        margin-left: auto;
      }
    }
  }

  .customer-info {
    .el-button {
      margin-top: 12px;
    }
  }

  .total-amount {
    display: flex;
    justify-content: flex-end;
    align-items: center;
    gap: 12px;
    margin-top: 16px;
    padding: 12px;
    background-color: var(--el-fill-color-light);
    border-radius: 4px;

    span {
      font-size: 16px;
      font-weight: 500;
    }
  }

  .action-buttons {
    display: flex;
    justify-content: center;
    gap: 12px;
    margin-top: 24px;
  }

  .attachment-section {
    .attachment-title {
      margin-bottom: 12px;
      font-size: 14px;
      font-weight: 500;
      color: var(--el-text-color-regular);
    }
  }
}

// 新增客戶對話框 RWD
:deep(.customer-dialog) {
  width: 90%;
  max-width: 700px;

  @media (max-width: 768px) {
    width: 95%;
    margin: 20px auto;
  }

  @media (max-width: 480px) {
    width: 100%;
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

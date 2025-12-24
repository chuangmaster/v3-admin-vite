<script setup lang="ts">
/**
 * 建立服務訂單頁面
 * 用於建立收購單或寄賣單
 */
import type { Customer } from "./types"
import { Delete, Document, Edit, EditPen, Goods, Plus, User, View } from "@element-plus/icons-vue"
import { nextTick } from "vue"
import CustomerForm from "./components/CustomerForm.vue"
import CustomerSearch from "./components/CustomerSearch.vue"
import IdCardUploader from "./components/IdCardUploader.vue"
import ProductItemForm from "./components/ProductItemForm.vue"
import SignaturePad from "./components/SignaturePad.vue"
import { useIdCardRecognition } from "./composables/useIdCardRecognition"
import { useServiceOrderForm } from "./composables/useServiceOrderForm"
import { useSignature } from "./composables/useSignature"
import { ACCESSORY_OPTIONS, DEFECT_OPTIONS, ServiceOrderSource, ServiceOrderType } from "./types"

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
  idCardFrontUploaded,
  idCardBackUploaded,
  contractPreviewGenerated,
  setCustomer,
  addProductItem,
  updateProductItem,
  removeProductItem,
  setSignature,
  setIdCardUploaded,
  setContractPreviewGenerated,
  prepareContractPreviewData,
  validateFormBasic,
  submitForm
} = useServiceOrderForm()

const { recognitionResult: _recognitionResult } = useIdCardRecognition()
const {
  loading: signatureLoading,
  buybackContractPreviewUrl,
  tradeApplicationPreviewUrl,
  consignmentContractPreviewUrl,
  generatePreview,
  saveSignature: _saveSignature
} = useSignature()

// 元件 refs
const customerFormRef = ref<InstanceType<typeof CustomerForm>>()
const productItemFormRef = ref<InstanceType<typeof ProductItemForm>>()
const signaturePadRef = ref<InstanceType<typeof SignaturePad>>()
const dialogIdCardUploaderRef = ref<InstanceType<typeof IdCardUploader>>()
const mainIdCardUploaderRef = ref<InstanceType<typeof IdCardUploader>>()

// UI 狀態
const showCustomerDialog = ref(false)
const showProductDialog = ref(false)
const editingProductIndex = ref<number>()
const customerDialogTab = ref<string | number>("idcard")

// 暫存對話框中上傳的身分證圖片
const pendingIdCardFiles = ref<{ front: File | null, back: File | null }>({ front: null, back: null })

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
  // 先保存對話框中上傳的身分證圖片
  const uploadedFiles = dialogIdCardUploaderRef.value?.getUploadedFiles()
  if (uploadedFiles) {
    pendingIdCardFiles.value = {
      front: uploadedFiles.front,
      back: uploadedFiles.back
    }
  }

  setCustomer(customer)
  showCustomerDialog.value = false
  ElMessage.success("客戶新增成功")

  // 將身分證圖片傳遞給客戶資訊區塊的上傳元件
  nextTick(() => {
    if (pendingIdCardFiles.value.front || pendingIdCardFiles.value.back) {
      mainIdCardUploaderRef.value?.setFiles(pendingIdCardFiles.value)
      // 更新上傳狀態
      setIdCardUploaded({
        front: !!pendingIdCardFiles.value.front || idCardFrontUploaded.value,
        back: !!pendingIdCardFiles.value.back || idCardBackUploaded.value
      })
    }
  })
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
 * 生成合約預覽
 */
async function handleGeneratePreview() {
  // 先驗證基本資料
  const validation = validateFormBasic()
  if (!validation.valid) {
    ElMessage.warning(validation.message)
    return
  }

  const previewData = prepareContractPreviewData()
  if (!previewData) {
    ElMessage.error("無法準備合約預覽資料")
    return
  }

  const result = await generatePreview(previewData)
  if (result) {
    setContractPreviewGenerated(true)
    ElMessage.success("合約預覽生成成功，請客戶確認後進行簽章")
  }
}

/**
 * 開啟 PDF 預覽（新視窗）
 * 支援 URL 和 Base64 Data URL 兩種格式
 */
function openPreview(url: string) {
  if (!url) return

  // 如果是 Data URL (Base64 格式)，轉換為 Blob URL 以解決瀏覽器安全策略限制
  if (url.startsWith("data:application/pdf;base64,")) {
    try {
      const base64 = url.replace("data:application/pdf;base64,", "")
      const binaryString = atob(base64)
      const bytes = new Uint8Array(binaryString.length)
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i)
      }
      const blob = new Blob([bytes], { type: "application/pdf" })
      const blobUrl = URL.createObjectURL(blob)
      window.open(blobUrl, "_blank")
      // 延遲釋放 Blob URL，確保新視窗有足夠時間載入
      setTimeout(() => URL.revokeObjectURL(blobUrl), 10000)
    } catch (error) {
      console.error("PDF 預覽開啟失敗:", error)
      ElMessage.error("PDF 預覽開啟失敗")
    }
  } else {
    // 一般 URL 直接開啟
    window.open(url, "_blank")
  }
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

/**
 * 取得配件標籤
 */
function getAccessoryLabel(value: string) {
  return ACCESSORY_OPTIONS.find(opt => opt.value === value)?.label || value
}

/**
 * 取得瑕疵標籤
 */
function getDefectLabel(value: string) {
  return DEFECT_OPTIONS.find(opt => opt.value === value)?.label || value
}
</script>

<template>
  <div class="app-container">
    <el-card shadow="never" class="main-card">
      <template #header>
        <div class="card-header">
          <span class="title">建立服務訂單</span>
        </div>
      </template>

      <el-steps
        :active="
          (formData.orderSource === ServiceOrderSource.OFFLINE && contractPreviewGenerated) || formData.orderSource === ServiceOrderSource.ONLINE
            ? 4
            : (formData.orderSource === ServiceOrderSource.OFFLINE && productItems.length > 0)
              ? 3
              : productItems.length > 0
                ? 2
                : selectedCustomer
                  ? 1
                  : formData.orderType && formData.orderSource
                    ? 0
                    : 0
        "
        finish-status="success"
        class="steps"
      >
        <el-step title="服務單設定" />
        <el-step title="選擇客戶" />
        <el-step title="新增商品" />
        <el-step v-if="formData.orderSource === ServiceOrderSource.OFFLINE" title="合約預覽" />
        <el-step title="簽名確認" />
      </el-steps>

      <!-- 服務單類型與來源選擇 -->
      <el-card shadow="never" class="section-card">
        <template #header>
          <div class="section-title">
            <el-icon><Document /></el-icon>
            <span>服務單設定</span>
          </div>
        </template>

        <el-form label-width="100px">
          <el-form-item label="服務單類型" required>
            <el-select v-model="formData.orderType" placeholder="請選擇服務單類型">
              <el-option
                label="收購單"
                :value="ServiceOrderType.BUYBACK"
              >
                <el-tag type="success" size="small">
                  收購單
                </el-tag>
              </el-option>
              <el-option
                label="寄賣單"
                :value="ServiceOrderType.CONSIGNMENT"
              >
                <el-tag type="warning" size="small">
                  寄賣單
                </el-tag>
              </el-option>
            </el-select>
          </el-form-item>

          <el-form-item label="服務單來源" required>
            <el-select v-model="formData.orderSource" placeholder="請選擇服務單來源">
              <el-option
                label="線下"
                :value="ServiceOrderSource.OFFLINE"
              >
                <el-tag type="info" size="small">
                  線下
                </el-tag>
              </el-option>
              <el-option
                label="線上"
                :value="ServiceOrderSource.ONLINE"
              >
                <el-tag type="primary" size="small">
                  線上
                </el-tag>
              </el-option>
            </el-select>
          </el-form-item>
        </el-form>
      </el-card>

      <!-- 步驟 1: 選擇客戶 -->
      <el-card v-if="formData.orderType && formData.orderSource" shadow="never" class="section-card">
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
              {{ selectedCustomer.phoneNumber }}
            </el-descriptions-item>
            <el-descriptions-item label="Email">
              {{ selectedCustomer.email || '未提供' }}
            </el-descriptions-item>
            <el-descriptions-item label="身分證字號">
              {{ selectedCustomer.idCardNumber }}
            </el-descriptions-item>
          </el-descriptions>

          <!-- 身分證件上傳區 -->
          <div class="id-card-section">
            <div class="section-subtitle">
              <span>身分證件</span>
              <el-tag v-if="formData.orderSource === ServiceOrderSource.OFFLINE" type="danger" size="small">
                正反面必填
              </el-tag>
            </div>
            <IdCardUploader
              ref="mainIdCardUploaderRef"
              :require-both-sides="formData.orderSource === ServiceOrderSource.OFFLINE"
              :show-recognize="false"
              @update:model-value="setIdCardUploaded"
            />
          </div>

          <el-button type="primary" link class="reselect-customer-btn" @click="selectedCustomer = undefined">
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
          <el-table-column prop="brandName" label="品牌名稱" min-width="120">
            <template #default="{ row }">
              {{ row.brandName || '-' }}
            </template>
          </el-table-column>
          <el-table-column prop="style" label="款式" min-width="120">
            <template #default="{ row }">
              {{ row.style || '-' }}
            </template>
          </el-table-column>
          <el-table-column prop="internalCode" label="內碼" width="120">
            <template #default="{ row }">
              {{ row.internalCode || '-' }}
            </template>
          </el-table-column>
          <el-table-column
            :label="formData.orderType === ServiceOrderType.CONSIGNMENT ? '實拿金額' : '收購金額'"
            width="120"
            align="right"
          >
            <template #default="{ row }">
              {{ row.amount ? row.amount.toLocaleString() : '-' }}
            </template>
          </el-table-column>
          <el-table-column
            label="商品配件"
            min-width="150"
          >
            <template #default="{ row }">
              <el-tag
                v-for="accessory in row.accessories"
                :key="accessory"
                size="small"
                style="margin: 2px;"
              >
                {{ getAccessoryLabel(accessory) }}
              </el-tag>
              <span v-if="!row.accessories || row.accessories.length === 0">-</span>
            </template>
          </el-table-column>
          <el-table-column
            v-if="formData.orderType === ServiceOrderType.CONSIGNMENT"
            label="商品瑕疵處"
            min-width="150"
          >
            <template #default="{ row }">
              <el-tag
                v-for="defect in row.defects"
                :key="defect"
                type="warning"
                size="small"
                style="margin: 2px;"
              >
                {{ getDefectLabel(defect) }}
              </el-tag>
              <span v-if="!row.defects || row.defects.length === 0">-</span>
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
          <span class="total-amount-value">{{ formData.totalAmount?.toLocaleString() || 0 }}</span>
          <span style="margin-left: 8px;">元</span>
        </div>
      </el-card>

      <!-- 步驟 3: 合約預覽（僅線下流程） -->
      <el-card v-if="productItems.length > 0 && formData.orderSource === ServiceOrderSource.OFFLINE" shadow="never" class="section-card">
        <template #header>
          <div class="section-title">
            <el-icon><Document /></el-icon>
            <span>合約預覽</span>
            <el-tag v-if="!contractPreviewGenerated" type="warning" size="small">
              必須完成
            </el-tag>
            <el-tag v-else type="success" size="small">
              已完成
            </el-tag>
          </div>
        </template>

        <el-alert
          v-if="!contractPreviewGenerated"
          title="請先生成合約預覽，供客戶確認後再進行簽章"
          type="info"
          :closable="false"
          style="margin-bottom: 16px;"
        />

        <div v-if="!contractPreviewGenerated" style="text-align: center; padding: 20px;">
          <el-button
            type="primary"
            :loading="signatureLoading"
            size="large"
            @click="handleGeneratePreview"
          >
            生成合約預覽
          </el-button>
        </div>

        <div v-else class="contract-preview">
          <el-alert
            title="合約已生成，請讓客戶確認以下文件"
            type="success"
            :closable="false"
            style="margin-bottom: 16px;"
          />

          <!-- 收購單：收購合約 + 一時貿易書 -->
          <template v-if="formData.orderType === ServiceOrderType.BUYBACK">
            <div class="preview-section">
              <h4>收購合約</h4>
              <el-button
                type="primary"
                link
                :icon="View"
                @click="openPreview(buybackContractPreviewUrl)"
              >
                開啟預覽
              </el-button>
              <iframe :src="buybackContractPreviewUrl" class="pdf-preview" />
            </div>

            <div class="preview-section">
              <h4>一時貿易申請書（收購單需要）</h4>
              <el-button
                type="primary"
                link
                :icon="View"
                @click="openPreview(tradeApplicationPreviewUrl)"
              >
                開啟預覽
              </el-button>
              <iframe :src="tradeApplicationPreviewUrl" class="pdf-preview" />
            </div>
          </template>

          <!-- 寄賣單：寄賣合約書 -->
          <template v-else>
            <div class="preview-section">
              <h4>寄賣合約書</h4>
              <el-button
                type="primary"
                link
                :icon="View"
                @click="openPreview(consignmentContractPreviewUrl)"
              >
                開啟預覽
              </el-button>
              <iframe :src="consignmentContractPreviewUrl" class="pdf-preview" />
            </div>
          </template>

          <el-button
            type="warning"
            style="margin-top: 16px;"
            @click="() => { setContractPreviewGenerated(false) }"
          >
            重新生成
          </el-button>
        </div>
      </el-card>

      <!-- 步驟 4: 簽名確認 -->
      <el-card v-if="productItems.length > 0 && (formData.orderSource === ServiceOrderSource.ONLINE || contractPreviewGenerated)" shadow="never" class="section-card">
        <template #header>
          <div class="section-title">
            <el-icon><EditPen /></el-icon>
            <span>客戶簽名</span>
          </div>
        </template>

        <el-alert
          v-if="formData.orderSource === ServiceOrderSource.OFFLINE"
          title="請客戶確認合約內容無誤後，在下方簽名區簽名"
          type="info"
          :closable="false"
          style="margin-bottom: 16px;"
        />

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
      <el-tabs v-model="customerDialogTab">
        <el-tab-pane label="身分證辨識" name="idcard">
          <el-alert
            title="上傳或拍攝身分證照片，系統將自動辨識並搜尋既有客戶"
            type="info"
            :closable="false"
            style="margin-bottom: 16px;"
          />
          <el-alert
            v-if="formData.orderSource === ServiceOrderSource.OFFLINE"
            title="線下流程需要上傳身分證正反面影本"
            type="warning"
            :closable="false"
            style="margin-bottom: 16px;"
          />
          <IdCardUploader
            ref="dialogIdCardUploaderRef"
            :require-both-sides="formData.orderSource === ServiceOrderSource.OFFLINE"
            @recognized="handleOCRRecognized"
            @update:model-value="setIdCardUploaded"
          />
          <el-divider>辨識後請至「手動輸入」頁籤確認資料</el-divider>
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
      min-height: 200px;
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

    // 確保「重新選擇客戶」按鈕可以被正常點擊，不會被其他元素覆蓋
    .reselect-customer-btn {
      position: relative;
      z-index: 10;
      margin-bottom: 16px;
    }

    .id-card-section {
      margin-top: 20px;
      padding-top: 20px;
      border-top: 1px solid var(--el-border-color-light);

      .section-subtitle {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 16px;
        font-size: 14px;
        font-weight: 500;
        color: var(--el-text-color-primary);
      }
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

    .total-amount-value {
      font-size: 20px;
      font-weight: 700;
      color: var(--el-color-primary);
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

  .contract-preview {
    .preview-section {
      margin-bottom: 24px;

      h4 {
        margin: 0 0 12px 0;
        font-size: 14px;
        font-weight: 500;
        color: var(--el-text-color-primary);
      }

      .pdf-preview {
        width: 100%;
        height: 500px;
        border: 1px solid var(--el-border-color);
        border-radius: 4px;
        margin-top: 8px;
      }
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

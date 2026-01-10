<script setup lang="ts">
import type { Attachment, ServiceOrderSource, SignatureRecord } from "./types"
import { formatDateTime } from "@@/utils/datetime"
/**
 * 服務訂單詳情頁面
 */
import { ArrowLeft, DocumentChecked, Goods, Upload } from "@element-plus/icons-vue"
import { ElMessage } from "element-plus"
import { getAttachmentList } from "./apis/attachment"
import AttachmentUploader from "./components/AttachmentUploader.vue"
import OfflineSignatureDialog from "./components/OfflineSignatureDialog.vue"
import OnlineSignatureSection from "./components/OnlineSignatureSection.vue"
import { useServiceOrderDetail } from "./composables/useServiceOrderDetail"
import { useSignature } from "./composables/useSignature"
import { ACCESSORY_OPTIONS, AttachmentType, DEFECT_OPTIONS, DocumentType, GRADE_OPTIONS, RenewalOption, ServiceOrderStatus, ServiceOrderType, SignatureType } from "./types"

defineOptions({
  name: "ServiceOrderDetail"
})

const route = useRoute()
const router = useRouter()

const id = computed(() => route.params.id as string)
const { loading, serviceOrder } = useServiceOrderDetail(id.value)

const attachments = ref<Attachment[]>([])
const attachmentsLoading = ref(false)

/**
 * 根據附件類型分類
 */
const idCardAttachments = computed(() => {
  return attachments.value.filter((att) => {
    // 支援 API 回傳的 attachmentType（ID_CARD_FRONT, ID_CARD_BACK）
    if (att.attachmentType) {
      return att.attachmentType.startsWith("ID_CARD")
    }
    // 相容舊的 fileType 欄位
    return att.fileType === AttachmentType.ID_CARD
  })
})

const contractAttachments = computed(() => {
  return attachments.value.filter((att) => {
    // 支援 API 回傳的 attachmentType（包含所有合約類型）
    if (att.attachmentType) {
      return att.attachmentType.includes("CONTRACT")
    }
    // 相容舊的 fileType 欄位
    return att.fileType === AttachmentType.CONTRACT
  })
})

// 簽名相關
const {
  loading: signatureLoading,
  buybackContractPreviewUrl,
  tradeApplicationPreviewUrl,
  consignmentContractPreviewUrl,
  generatePreview,
  saveSignature
} = useSignature()

const showSignatureDialog = ref(false)
const currentSignatureDocument = ref<DocumentType>()
const currentSignatureRecord = ref<SignatureRecord>()

/**
 * 載入附件列表
 */
async function loadAttachments() {
  if (!serviceOrder.value?.id) return

  try {
    attachmentsLoading.value = true
    const response = await getAttachmentList(serviceOrder.value.id)
    if (response.success && response.data) {
      attachments.value = response.data
    }
  } catch {
    ElMessage.error("載入附件列表失敗")
  } finally {
    attachmentsLoading.value = false
  }
}

/**
 * 檢查是否有任何線下簽名記錄
 */
const hasOfflineSignature = computed(() => {
  if (!serviceOrder.value?.signatureRecords) return false
  return serviceOrder.value.signatureRecords.some(
    record => record.signatureType === "OFFLINE"
  )
})

/**
 * 取得待簽署的文件列表（線下簽名且尚未簽署完成）
 * 規則：signatureRecord.documentType == attachmentType && signedAt.hasValue 表示已簽署
 */
const pendingSignatureDocuments = computed(() => {
  if (!serviceOrder.value?.signatureRecords) return []

  return serviceOrder.value.signatureRecords.filter((record) => {
    // 只處理線下簽名
    if (record.signatureType !== "OFFLINE") return false

    // 如果已經有簽署時間，表示已完成簽署，不需要再顯示
    if (record.signedAt) return false
    // 檢查是否已經有對應的合約附件（比對 documentType 和 attachmentType）
    const hasMatchingAttachment = attachments.value.some(
      att => att.attachmentType === record.documentType
    )

    // 如果還沒有對應的附件，表示需要簽署
    return !hasMatchingAttachment
  })
})

/**
 * 生成合約預覽
 */
async function handleGeneratePreview(documentType: DocumentType) {
  if (!serviceOrder.value) return

  await generatePreview(serviceOrder.value.id, documentType)
}

/**
 * 開始簽署文件
 */
async function handleStartSign(record: SignatureRecord) {
  if (!serviceOrder.value) return

  // 根據文件類型檢查是否需要生成預覽
  let needPreview = false
  if (record.documentType === DocumentType.BUYBACK_CONTRACT) {
    needPreview = !buybackContractPreviewUrl.value
  } else if (record.documentType === DocumentType.ONE_TIME_TRADE) {
    needPreview = !tradeApplicationPreviewUrl.value
  } else if (record.documentType === DocumentType.CONSIGNMENT_CONTRACT) {
    needPreview = !consignmentContractPreviewUrl.value
  }

  if (needPreview) {
    // 如果後端返回的是 ONE_TIME_TRADE，轉換為 ONE_TIME_TRADE
    const documentTypeForApi = record.documentType === "ONE_TIME_TRADE"
      ? DocumentType.ONE_TIME_TRADE
      : record.documentType as DocumentType
    await handleGeneratePreview(documentTypeForApi)
  }

  currentSignatureDocument.value = record.documentType as DocumentType
  currentSignatureRecord.value = record
  showSignatureDialog.value = true
}

/**
 * 確認簽名
 */
async function handleConfirmSignature(signatureDataUrl: string) {
  if (!serviceOrder.value || !currentSignatureDocument.value || !currentSignatureRecord.value) return

  // 線下情境的所有文件都需要簽名（包含一時貿易申請書）
  const result = await saveSignature(
    serviceOrder.value.id,
    currentSignatureRecord.value.id,
    signatureDataUrl || "",
    serviceOrder.value.customerName!
  )

  if (result) {
    // 重新載入服務單資料以更新簽名記錄
    window.location.reload()
  }
}

/**
 * 取得當前合約預覽 URL
 */
const currentContractUrl = computed(() => {
  if (!currentSignatureDocument.value) return ""

  const docType = currentSignatureDocument.value as string
  console.log("取得當前合約預覽 URL", { docType, buybackContractPreviewUrl: buybackContractPreviewUrl.value, tradeApplicationPreviewUrl: tradeApplicationPreviewUrl.value })

  if (docType === DocumentType.BUYBACK_CONTRACT || docType === "BUYBACK_CONTRACT") {
    return buybackContractPreviewUrl.value
  } else if (docType === DocumentType.ONE_TIME_TRADE || docType === "TRADE_APPLICATION" || docType === "ONE_TIME_TRADE") {
    return tradeApplicationPreviewUrl.value
  } else if (docType === DocumentType.CONSIGNMENT_CONTRACT || docType === "CONSIGNMENT_CONTRACT") {
    return consignmentContractPreviewUrl.value
  }

  return ""
})

// 當 serviceOrder 載入完成後，載入附件列表
watch(
  () => serviceOrder.value?.id,
  (newId) => {
    if (newId) {
      loadAttachments()
    }
  },
  { immediate: true }
)

/**
 * 處理線上簽章操作成功
 * 重新載入服務單資料以更新簽章狀態
 */
function handleOnlineSignatureSuccess(): void {
  // 重新載入服務單資料
  window.location.reload()
}

/**
 * 訂單類型文字
 */
function getOrderTypeText(type: ServiceOrderType) {
  return type === ServiceOrderType.BUYBACK ? "收購單" : "寄賣單"
}

/**
 * 訂單來源文字
 */
function getOrderSourceText(source: ServiceOrderSource | string) {
  if (!source) return "-"
  const normalizedSource = source.toString().toLowerCase().trim()
  return normalizedSource === "online" ? "線上" : "線下"
}

/**
 * 訂單來源標籤類型
 */
function getOrderSourceTag(source: ServiceOrderSource | string) {
  if (!source) return "info"
  const normalizedSource = source.toString().toLowerCase().trim()
  return normalizedSource === "online" ? "primary" : "info"
}

/**
 * 訂單狀態文字
 */
function getStatusText(status: ServiceOrderStatus) {
  const map: Record<string, string> = {
    [ServiceOrderStatus.DRAFT]: "草稿",
    [ServiceOrderStatus.PENDING]: "待確認",
    [ServiceOrderStatus.CONFIRMED]: "已確認",
    [ServiceOrderStatus.IN_PROGRESS]: "處理中",
    [ServiceOrderStatus.COMPLETED]: "已完成",
    [ServiceOrderStatus.CANCELLED]: "已取消"
  }
  return map[status] || status
}

/**
 * 文件類型文字
 */
function getDocumentTypeText(documentType: DocumentType) {
  const map: Record<DocumentType, string> = {
    [DocumentType.BUYBACK_CONTRACT]: "收購合約",
    [DocumentType.ONE_TIME_TRADE]: "一時貿易申請書",
    [DocumentType.CONSIGNMENT_CONTRACT]: "寄賣合約書",
    [DocumentType.BUYBACK_CONTRACT_WITH_ONE_TIME_TRADE]: "收購合約與一次性交易"
  }
  return map[documentType] || documentType
}

/**
 * 返回列表
 */
function goBack() {
  router.push({ name: "ServiceOrderManagement" })
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

/**
 * 取得商品等級標籤
 */
function getGradeLabel(value: string) {
  return GRADE_OPTIONS.find(opt => opt.value === value)?.label || value
}

/**
 * 取得到期處理方式文字
 */
function getRenewalOptionText(option: string) {
  const map: Record<string, string> = {
    [RenewalOption.AUTO_RETRIEVE]: "到期自動取回",
    [RenewalOption.AUTO_DISCOUNT_10]: "第三個月起自動調降 10%",
    [RenewalOption.DISCUSS]: "屆時討論",
    [RenewalOption.NONE]: "無"
  }
  return map[option] || option
}
</script>

<template>
  <div class="app-container">
    <el-card v-loading="loading" shadow="never">
      <template #header>
        <div class="card-header">
          <el-button :icon="ArrowLeft" @click="goBack">
            返回
          </el-button>
          <span class="title">服務訂單詳情</span>
        </div>
      </template>

      <div v-if="serviceOrder">
        <!-- 基本資訊 -->
        <el-descriptions title="基本資訊" :column="3" border>
          <el-descriptions-item label="訂單編號">
            {{ serviceOrder.orderNumber }}
          </el-descriptions-item>
          <el-descriptions-item label="訂單類型">
            <el-tag :type="serviceOrder.orderType === ServiceOrderType.BUYBACK ? 'success' : 'warning'">
              {{ getOrderTypeText(serviceOrder.orderType) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="訂單來源">
            <el-tag :type="getOrderSourceTag(serviceOrder.orderSource)">
              {{ getOrderSourceText(serviceOrder.orderSource) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="訂單狀態">
            <el-tag>{{ getStatusText(serviceOrder.status) }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="建立時間">
            {{ formatDateTime(serviceOrder.createdAt) }}
          </el-descriptions-item>
          <el-descriptions-item label="建立人">
            {{ serviceOrder.createdByName }}
          </el-descriptions-item>
          <el-descriptions-item label="更新時間">
            {{ serviceOrder.updatedAt ? formatDateTime(serviceOrder.updatedAt) : '-' }}
          </el-descriptions-item>
          <!-- 寄賣單專屬欄位 -->
          <template v-if="serviceOrder.orderType === ServiceOrderType.CONSIGNMENT">
            <el-descriptions-item label="寄賣起始日期">
              {{ formatDateTime(serviceOrder.consignmentStartDate) || '-' }}
            </el-descriptions-item>
            <el-descriptions-item label="寄賣結束日期">
              {{ formatDateTime(serviceOrder.consignmentEndDate) || '-' }}
            </el-descriptions-item>
            <el-descriptions-item label="到期處理">
              <el-tag v-if="serviceOrder.renewalOption" type="info" size="small">
                {{ getRenewalOptionText(serviceOrder.renewalOption) }}
              </el-tag>
              <span v-else>-</span>
            </el-descriptions-item>
          </template>
        </el-descriptions>

        <!-- 客戶資訊 -->
        <el-descriptions title="客戶資訊" :column="2" border class="section">
          <el-descriptions-item label="客戶姓名">
            {{ serviceOrder.customerName }}
          </el-descriptions-item>
          <el-descriptions-item label="電話號碼">
            {{ serviceOrder.customerPhone }}
          </el-descriptions-item>
          <el-descriptions-item label="Email">
            {{ serviceOrder.customerEmail || '未提供' }}
          </el-descriptions-item>
          <el-descriptions-item label="身分證字號">
            {{ serviceOrder.customerIdNumber }}
          </el-descriptions-item>
          <el-descriptions-item label="居住地址" :span="2">
            {{ serviceOrder.customerAddress || '未提供' }}
          </el-descriptions-item>
          <el-descriptions-item v-if="serviceOrder.customerLineId" label="Line ID" :span="2">
            {{ serviceOrder.customerLineId }}
          </el-descriptions-item>
        </el-descriptions>

        <!-- 商品項目 -->
        <el-card shadow="never" class="section-card">
          <template #header>
            <div class="section-title">
              <el-icon><Goods /></el-icon>
              <span>商品項目</span>
            </div>
          </template>

          <el-table
            v-if="serviceOrder.productItems && serviceOrder.productItems.length > 0"
            :data="serviceOrder.productItems"
            border
            stripe
            style="width: 100%"
          >
            <el-table-column type="index" label="#" width="50" />
            <el-table-column prop="grade" label="等級" width="100">
              <template #default="{ row }">
                <el-tag v-if="row.grade" type="info" size="small">
                  {{ getGradeLabel(row.grade) }}
                </el-tag>
                <span v-else>-</span>
              </template>
            </el-table-column>
            <el-table-column prop="brandName" label="品牌名稱" min-width="120">
              <template #default="{ row }">
                {{ row.brandName || '-' }}
              </template>
            </el-table-column>
            <el-table-column prop="styleName" label="款式" min-width="120">
              <template #default="{ row }">
                {{ row.styleName || '-' }}
              </template>
            </el-table-column>
            <el-table-column prop="internalCode" label="內碼" width="120">
              <template #default="{ row }">
                {{ row.internalCode || '-' }}
              </template>
            </el-table-column>
            <el-table-column
              :label="serviceOrder.orderType === ServiceOrderType.CONSIGNMENT ? '實拿金額' : '收購金額'"
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
              v-if="serviceOrder.orderType === ServiceOrderType.CONSIGNMENT"
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
          </el-table>

          <el-empty v-else description="尚無商品項目" />

          <div v-if="serviceOrder.productItems && serviceOrder.productItems.length > 0" class="total-amount">
            <span>總金額：</span>
            <span class="total-amount-value">{{ serviceOrder.totalAmount?.toLocaleString() || 0 }}</span>
            <span style="margin-left: 8px;">元</span>
          </div>
        </el-card>

        <!-- 附件管理 -->
        <div v-loading="attachmentsLoading" class="section">
          <h3 class="section-title">
            <el-icon><Upload /></el-icon>
            <span>附件管理</span>
          </h3>
          <el-row :gutter="20">
            <el-col :span="12">
              <div class="attachment-section">
                <div class="attachment-title">
                  身分證照片
                  <el-tag type="info" size="small" style="margin-left: 8px;">
                    僅供瀏覽
                  </el-tag>
                </div>
                <AttachmentUploader
                  :service-order-id="serviceOrder.id"
                  :file-type="AttachmentType.ID_CARD"
                  :attachment-list="idCardAttachments"
                  :limit="2"
                  :readonly="true"
                  :disabled="serviceOrder.status === ServiceOrderStatus.CANCELLED"
                />
              </div>
            </el-col>
            <el-col :span="12">
              <div class="attachment-section">
                <div class="attachment-title">
                  合約文件
                  <el-tag type="info" size="small" style="margin-left: 8px;">
                    僅供瀏覽
                  </el-tag>
                </div>
                <AttachmentUploader
                  :service-order-id="serviceOrder.id"
                  :file-type="AttachmentType.CONTRACT"
                  :attachment-list="contractAttachments"
                  :limit="5"
                  :readonly="true"
                  :disabled="serviceOrder.status === ServiceOrderStatus.CANCELLED"
                />
              </div>
            </el-col>
          </el-row>
        </div>

        <!-- 線下簽章 -->
        <div v-if="hasOfflineSignature && pendingSignatureDocuments.length > 0" class="section">
          <h3 class="section-title">
            <el-icon><DocumentChecked /></el-icon>
            <span>文件簽署</span>
          </h3>
          <el-alert
            type="info"
            :closable="false"
            style="margin-bottom: 16px;"
          >
            <template #title>
              此訂單使用線下簽名方式，請先預覽合約內容後進行簽章
            </template>
          </el-alert>
          <el-row :gutter="16">
            <el-col v-for="record in pendingSignatureDocuments" :key="record.id" :span="12">
              <el-card shadow="hover">
                <template #header>
                  <div class="card-title">
                    <span>{{ getDocumentTypeText(record.documentType) }}</span>
                  </div>
                </template>
                <div class="contract-card-content">
                  <el-button
                    type="primary"
                    :loading="signatureLoading"
                    @click="handleStartSign(record)"
                  >
                    預覽並簽署
                  </el-button>
                </div>
              </el-card>
            </el-col>
          </el-row>
        </div>

        <!-- 簽名記錄 -->
        <div v-if="serviceOrder.signatureRecords && serviceOrder.signatureRecords.length > 0" class="section">
          <h3 class="section-title">
            簽名記錄
          </h3>
          <el-timeline>
            <el-timeline-item
              v-for="record in serviceOrder.signatureRecords"
              :key="record.id"
              :timestamp="record.signedAt ? formatDateTime(record.signedAt) : '待簽名'"
            >
              <div class="signature-record">
                <div class="signature-info">
                  <p><strong>文件類型：</strong>{{ getDocumentTypeText(record.documentType) }}</p>
                  <p>
                    <strong>簽名方式：</strong>
                    <el-tag :type="record.signatureType === SignatureType.ONLINE ? 'warning' : 'success'">
                      {{ record.signatureType === SignatureType.ONLINE ? '線上簽名' : '線下簽名' }}
                    </el-tag>
                  </p>
                  <p><strong>簽名人：</strong>{{ record.signerName }}</p>

                  <!-- 線下簽名圖片 -->
                  <div v-if="record.signatureType === SignatureType.OFFLINE && record.signatureUrl">
                    <strong>簽名圖片：</strong>
                    <el-image
                      :src="record.signatureUrl"
                      :preview-src-list="[record.signatureUrl]"
                      fit="contain"
                      class="signature-image"
                    />
                  </div>
                </div>
              </div>
            </el-timeline-item>
          </el-timeline>
        </div>

        <!-- 線上簽章資訊區塊 -->
        <OnlineSignatureSection
          v-if="serviceOrder"
          :service-order="serviceOrder"
          @success="handleOnlineSignatureSuccess"
        />

        <!-- 備註 -->
        <el-descriptions v-if="serviceOrder.notes" title="備註說明" :column="1" border class="section">
          <el-descriptions-item>
            {{ serviceOrder.notes }}
          </el-descriptions-item>
        </el-descriptions>
      </div>

      <el-empty v-else description="找不到訂單資料" />
    </el-card>

    <!-- 線下簽名對話框 -->
    <OfflineSignatureDialog
      v-model="showSignatureDialog"
      :contract-url="currentContractUrl"
      :document-type="currentSignatureDocument!"
      :document-type-text="currentSignatureDocument ? getDocumentTypeText(currentSignatureDocument) : ''"
      @confirm="handleConfirmSignature"
    />
  </div>
</template>

<style scoped lang="scss">
.app-container {
  padding: 20px;

  .card-header {
    display: flex;
    align-items: center;
    gap: 12px;

    .title {
      font-size: 18px;
      font-weight: 600;
    }
  }

  .section {
    margin-top: 24px;
  }

  .section-card {
    margin-top: 20px;

    .section-title {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 16px;
      font-weight: 500;

      .el-icon {
        color: var(--el-color-primary);
      }
    }

    // 確保表格邊框完整顯示
    :deep(.el-table) {
      border-collapse: collapse;

      .el-table__cell {
        border-right: 1px solid var(--el-border-color);
        border-bottom: 1px solid var(--el-border-color);
      }
    }
  }

  .section-title {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 16px;
    font-weight: 500;
    margin-bottom: 16px;
    padding-left: 12px;
    border-left: 4px solid var(--el-color-primary);

    .el-icon {
      color: var(--el-color-primary);
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

  .signature-record {
    p {
      margin: 8px 0;
    }

    .signature-info {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .signature-image {
      max-width: 300px;
      max-height: 150px;
      margin-top: 8px;
      border: 1px solid var(--el-border-color);
      border-radius: 4px;
    }

    .signature-actions {
      display: flex;
      gap: 8px;
      margin-top: 12px;
    }
  }

  .attachment-section {
    .attachment-title {
      margin-bottom: 12px;
      font-size: 14px;
      font-weight: 500;
      color: var(--el-text-color-regular);
    }
  }

  .card-title {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 16px;
    font-weight: 500;
  }

  .contract-card-content {
    display: flex;
    flex-direction: column;
    gap: 16px;
    align-items: center;
    padding: 20px 0;

    p {
      margin: 0;
      color: var(--el-text-color-regular);
      text-align: center;
    }
  }
}
</style>

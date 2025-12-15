<script setup lang="ts">
import { formatDateTime } from "@@/utils/datetime"
/**
 * 服務訂單詳情頁面
 */
import { ArrowLeft, CopyDocument, Refresh, Upload } from "@element-plus/icons-vue"
import { ElMessage, ElMessageBox } from "element-plus"
import { resendSignature } from "./apis/signature"
import AttachmentUploader from "./components/AttachmentUploader.vue"
import { useServiceOrderDetail } from "./composables/useServiceOrderDetail"
import { AttachmentType, DocumentType, ServiceOrderStatus, ServiceOrderType, SignatureMethod } from "./types"

defineOptions({
  name: "ServiceOrderDetail"
})

const route = useRoute()
const router = useRouter()

const id = computed(() => route.params.id as string)
const { loading, serviceOrder } = useServiceOrderDetail(id.value)

/**
 * 訂單類型文字
 */
function getOrderTypeText(type: ServiceOrderType) {
  return type === ServiceOrderType.BUYBACK ? "收購單" : "寄賣單"
}

/**
 * 訂單狀態文字
 */
function getStatusText(status: ServiceOrderStatus) {
  const map: Record<ServiceOrderStatus, string> = {
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
    [DocumentType.TRADE_APPLICATION]: "一時貿易申請書",
    [DocumentType.CONSIGNMENT_CONTRACT]: "寄賣合約書"
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
 * 複製 Dropbox Sign 簽名連結
 */
async function handleCopySignLink(dropboxSignRequestId: string) {
  const signLink = `https://app.hellosign.com/sign/${dropboxSignRequestId}`
  try {
    await navigator.clipboard.writeText(signLink)
    ElMessage.success("簽名連結已複製到剪貼簿")
  } catch {
    ElMessage.error("複製失敗,請手動複製")
  }
}

/**
 * 重新發送簽名邀請
 */
async function handleResendSignature(record: { id: string, signerName: string }) {
  if (!serviceOrder.value)
    return

  ElMessageBox.confirm(
    `確定要重新發送簽名邀請給 ${record.signerName} 嗎？`,
    "重新發送簽名邀請",
    {
      confirmButtonText: "確定",
      cancelButtonText: "取消",
      type: "warning"
    }
  ).then(async () => {
    try {
      await resendSignature(serviceOrder.value!.id, {
        signatureRecordId: record.id
      })
      ElMessage.success("簽名邀請已重新發送")
    } catch {
      ElMessage.error("發送失敗,請稍後再試")
    }
  })
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
          <el-descriptions-item label="訂單狀態">
            <el-tag>{{ getStatusText(serviceOrder.status) }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="建立時間">
            {{ formatDateTime(serviceOrder.createdAt) }}
          </el-descriptions-item>
          <el-descriptions-item label="建立人">
            {{ serviceOrder.createdBy }}
          </el-descriptions-item>
          <el-descriptions-item label="更新時間">
            {{ formatDateTime(serviceOrder.updatedAt) }}
          </el-descriptions-item>
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
            {{ serviceOrder.customerIdCard }}
          </el-descriptions-item>
        </el-descriptions>

        <!-- 商品項目 -->
        <div class="section">
          <h3 class="section-title">
            商品項目
          </h3>
          <el-table :data="serviceOrder.productItems" border stripe>
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
                NT$ {{ row.totalPrice?.toLocaleString() || 0 }}
              </template>
            </el-table-column>
            <el-table-column prop="description" label="備註" min-width="150">
              <template #default="{ row }">
                {{ row.description || '-' }}
              </template>
            </el-table-column>
          </el-table>

          <div class="total-amount">
            <span>總金額：</span>
            <el-tag type="danger" size="large" effect="dark">
              NT$ {{ serviceOrder.totalAmount.toLocaleString() }}
            </el-tag>
          </div>
        </div>

        <!-- 附件管理 -->
        <div class="section">
          <h3 class="section-title">
            <el-icon><Upload /></el-icon>
            <span>附件管理</span>
          </h3>
          <el-row :gutter="20">
            <el-col :span="12">
              <div class="attachment-section">
                <div class="attachment-title">
                  身分證照片
                </div>
                <AttachmentUploader
                  :service-order-id="serviceOrder.id"
                  :file-type="AttachmentType.ID_CARD"
                  :limit="2"
                  :disabled="serviceOrder.status === ServiceOrderStatus.CANCELLED"
                />
              </div>
            </el-col>
            <el-col :span="12">
              <div class="attachment-section">
                <div class="attachment-title">
                  合約文件
                </div>
                <AttachmentUploader
                  :service-order-id="serviceOrder.id"
                  :file-type="AttachmentType.CONTRACT"
                  :limit="5"
                  :disabled="serviceOrder.status === ServiceOrderStatus.CANCELLED"
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
                  :service-order-id="serviceOrder.id"
                  :file-type="AttachmentType.OTHER"
                  :limit="10"
                  :disabled="serviceOrder.status === ServiceOrderStatus.CANCELLED"
                />
              </div>
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
                    <el-tag :type="record.signatureMethod === SignatureMethod.ONLINE ? 'warning' : 'success'">
                      {{ record.signatureMethod === SignatureMethod.ONLINE ? '線上簽名' : '線下簽名' }}
                    </el-tag>
                  </p>
                  <p><strong>簽名人：</strong>{{ record.signerName }}</p>
                  <p v-if="record.signatureMethod === SignatureMethod.ONLINE && record.dropboxSignRequestId">
                    <strong>簽名狀態：</strong>
                    <el-tag :type="record.signedAt ? 'success' : 'info'">
                      {{ record.signedAt ? '已完成' : '待簽名' }}
                    </el-tag>
                  </p>

                  <!-- 線下簽名圖片 -->
                  <div v-if="record.signatureMethod === SignatureMethod.OFFLINE && record.signatureUrl">
                    <strong>簽名圖片：</strong>
                    <el-image
                      :src="record.signatureUrl"
                      :preview-src-list="[record.signatureUrl]"
                      fit="contain"
                      class="signature-image"
                    />
                  </div>

                  <!-- 線上簽名操作 -->
                  <div v-if="record.signatureMethod === SignatureMethod.ONLINE && record.dropboxSignRequestId" class="signature-actions">
                    <el-button
                      :icon="CopyDocument"
                      size="small"
                      @click="handleCopySignLink(record.dropboxSignRequestId!)"
                    >
                      複製簽名連結
                    </el-button>
                    <el-button
                      v-if="!record.signedAt"
                      :icon="Refresh"
                      size="small"
                      type="primary"
                      @click="handleResendSignature({ id: record.id, signerName: record.signerName })"
                    >
                      重新發送邀請
                    </el-button>
                  </div>
                </div>
              </div>
            </el-timeline-item>
          </el-timeline>
        </div>

        <!-- 備註 -->
        <el-descriptions v-if="serviceOrder.notes" title="備註說明" :column="1" border class="section">
          <el-descriptions-item>
            {{ serviceOrder.notes }}
          </el-descriptions-item>
        </el-descriptions>
      </div>

      <el-empty v-else description="找不到訂單資料" />
    </el-card>
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
}
</style>

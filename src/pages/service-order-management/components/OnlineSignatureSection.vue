<script setup lang="ts">
import type { ServiceOrder, SignatureRecord } from "../types"
import { formatDateTime } from "@@/utils/datetime"
import { CopyDocument, DocumentChecked, Promotion, Refresh } from "@element-plus/icons-vue"
import { computed } from "vue"
import { useOnlineSignature } from "../composables/useOnlineSignature"

interface Props {
  /** 服務單資料 */
  serviceOrder: ServiceOrder
}

interface Emits {
  /** 操作成功事件（需要重新載入服務單） */
  (e: "success"): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const {
  loading,
  sendSignatureRequest,
  resendSignatureRequest,
  copySignatureUrl,
  getStatusText,
  getStatusType,
  canResend,
  canCopyUrl
} = useOnlineSignature()

/**
 * 線上簽章紀錄（篩選出 ONLINE 類型）
 */
const onlineSignatureRecords = computed(() => {
  return props.serviceOrder.signatureRecords?.filter(
    record => record.signatureMethod === "ONLINE"
  ) || []
})

/**
 * 是否有線上簽章紀錄
 */
const hasOnlineSignature = computed(() => {
  return onlineSignatureRecords.value.length > 0
})

/**
 * 是否可以發送簽章請求
 * 條件：服務單來源為線上 && 尚未有線上簽章紀錄
 */
const canSendRequest = computed(() => {
  return (
    props.serviceOrder.orderSource === "ONLINE"
    && !hasOnlineSignature.value
  )
})

/**
 * 處理發送簽章請求
 */
async function handleSendRequest(): Promise<void> {
  // 後端會根據 serviceOrderId 自動判斷文件類型，前端無需指定
  const success = await sendSignatureRequest(
    props.serviceOrder.id
  )

  if (success) {
    emit("success")
  }
}

/**
 * 處理重新發送簽章請求
 * @remarks 頻率限制由後端處理，若違反會收到錯誤訊息
 */
async function handleResend(_record: SignatureRecord): Promise<void> {
  const success = await resendSignatureRequest(
    props.serviceOrder.id
  )

  if (success) {
    emit("success")
  }
}

/**
 * 處理複製簽章連結
 */
function handleCopyUrl(record: SignatureRecord): void {
  if (record.signatureUrl) {
    copySignatureUrl(record.signatureUrl)
  }
}
</script>

<template>
  <div v-if="serviceOrder.orderSource === 'ONLINE'" class="online-signature-section">
    <h3 class="section-title">
      <el-icon><DocumentChecked /></el-icon>
      <span>線上簽章</span>
    </h3>

    <!-- 發送簽章請求按鈕（尚未發送時顯示） -->
    <div v-if="canSendRequest" class="send-request-container">
      <el-alert
        type="info"
        :closable="false"
        style="margin-bottom: 16px;"
      >
        此訂單來自線上渠道，請發送簽章請求給客戶完成合約簽署。
      </el-alert>
      <el-button
        type="primary"
        :icon="Promotion"
        :loading="loading"
        @click="handleSendRequest"
      >
        發送簽章請求
      </el-button>
    </div>

    <!-- 簽章紀錄列表 -->
    <div v-if="hasOnlineSignature" class="signature-records">
      <el-timeline>
        <el-timeline-item
          v-for="record in onlineSignatureRecords"
          :key="record.id"
          :timestamp="record.sentAt ? formatDateTime(record.sentAt) : '待發送'"
        >
          <el-card shadow="hover">
            <div class="record-header">
              <span class="record-title">
                {{
                  record.documentType === "BUYBACK_CONTRACT"
                    ? "收購合約"
                    : record.documentType === "CONSIGNMENT_CONTRACT"
                      ? "寄賣合約"
                      : record.documentType === "BUYBACK_CONTRACT_WITH_ONE_TIME_TRADE"
                        ? "收購合約與一次性交易"
                        : "合約"
                }}
              </span>
              <el-tag :type="getStatusType(record.status)" size="small">
                {{ getStatusText(record.status) }}
              </el-tag>
            </div>

            <div class="record-content">
              <p><strong>簽名者：</strong>{{ record.signerName }}</p>
              <p v-if="record.sentAt">
                <strong>發送時間：</strong>{{ formatDateTime(record.sentAt) }}
              </p>
              <p v-if="record.expiresAt">
                <strong>到期時間：</strong>{{ formatDateTime(record.expiresAt) }}
              </p>
              <p v-if="record.signedAt">
                <strong>簽名時間：</strong>{{ formatDateTime(record.signedAt) }}
              </p>

              <!-- 操作按鈕 -->
              <div class="record-actions">
                <el-button
                  v-if="canResend(record)"
                  :icon="Refresh"
                  size="small"
                  type="primary"
                  :loading="loading"
                  @click="handleResend(record)"
                >
                  重新發送簽章請求
                </el-button>
                <el-button
                  v-if="canCopyUrl(record)"
                  :icon="CopyDocument"
                  size="small"
                  @click="handleCopyUrl(record)"
                >
                  複製簽章連結
                </el-button>
              </div>
            </div>
          </el-card>
        </el-timeline-item>
      </el-timeline>
    </div>
  </div>
</template>

<style scoped lang="scss">
.online-signature-section {
  margin-top: 24px;

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

  .send-request-container {
    padding: 16px;
    background-color: var(--el-fill-color-light);
    border-radius: 4px;
  }

  .signature-records {
    margin-top: 16px;

    .record-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;

      .record-title {
        font-size: 16px;
        font-weight: 600;
      }
    }

    .record-content {
      p {
        margin: 8px 0;
        color: var(--el-text-color-regular);
      }

      .record-actions {
        display: flex;
        gap: 8px;
        margin-top: 16px;
      }
    }
  }
}
</style>

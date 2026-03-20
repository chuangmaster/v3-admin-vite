<script setup lang="ts">
import type { DownloadDocumentType } from "./types"
import { formatDateOnly } from "@@/utils/datetime"
import { CircleClose, Delete, Download, Refresh, Upload } from "@element-plus/icons-vue"
import { useServiceOrderDownloadTask } from "./composables/useServiceOrderDownloadTask"
import { DownloadDocumentType as DownloadDocumentTypeEnum, ServiceOrderType } from "./types"

defineOptions({
  name: "ServiceOrderBatchDownload"
})

const {
  form,
  submitting,
  loading,
  currentTask,
  hasTask,
  canDownload,
  failedOrderNumbers,
  submitTask,
  fetchTaskStatus,
  resetForm,
  openDownloadUrl,
  clearTask,
  normalizeStatus,
  isTerminalStatus,
  getDefaultDocumentTypes
} = useServiceOrderDownloadTask()

/** 寄賣單文件勾選項 */
const consignmentDocOptions: Array<{ label: string, value: DownloadDocumentType }> = [
  { label: "寄賣合約", value: DownloadDocumentTypeEnum.CONSIGNMENT_CONTRACT }
]

/** 收購單文件勾選項（虛擬 key，submitTask 時會展開映射） */
const buybackDocOptions: Array<{ label: string, value: string }> = [
  { label: "身分證正面", value: "ID_CARD_FRONT" },
  { label: "身分證反面", value: "ID_CARD_BACK" },
  { label: "收購合約（含線下/線上版本）", value: "BUYBACK_CONTRACT" },
  { label: "一次性交易申請書（含線下/線上版本）", value: "ONE_TIME_TRADE" }
]

const currentDocOptions = computed(() => {
  if (form.value.orderType === ServiceOrderType.CONSIGNMENT)
    return consignmentDocOptions
  if (form.value.orderType === ServiceOrderType.BUYBACK)
    return buybackDocOptions
  return []
})

function handleOrderTypeChange() {
  form.value.documentTypes = getDefaultDocumentTypes(form.value.orderType)
}

const orderTypeLabel: Record<string, string> = {
  BUYBACK: "收購單",
  CONSIGNMENT: "寄賣單"
}

const documentTypeLabelMap: Record<string, string> = {
  ID_CARD_FRONT: "身分證正面",
  ID_CARD_BACK: "身分證反面",
  BUYBACK_CONTRACT: "收購合約",
  CONSIGNMENT_CONTRACT: "寄賣合約",
  ONE_TIME_TRADE: "一次性交易申請書",
  BUYBACK_CONTRACT_WITH_ONE_TIME_TRADE: "收購合約＋一次性交易"
}

function getOrderTypeLabel(type?: string) {
  return orderTypeLabel[type ?? ""] ?? type ?? "-"
}

function getDocumentTypesLabel(types?: string[]) {
  if (!types || types.length === 0)
    return "全部（預設）"
  return types.map(t => documentTypeLabelMap[t] ?? t).join("、")
}

function formatDateTime(dateStr?: string) {
  if (!dateStr)
    return "-"

  return new Date(dateStr).toLocaleString("zh-TW", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit"
  })
}

function getStatusLabel(status?: string) {
  const normalized = normalizeStatus(status)
  const map: Record<string, string> = {
    queued: "排隊中",
    pending: "等待處理",
    processing: "處理中",
    in_progress: "處理中",
    running: "處理中",
    completed: "已完成",
    success: "已完成",
    succeeded: "已完成",
    failed: "失敗",
    error: "失敗",
    expired: "已過期",
    cancelled: "已取消",
    canceled: "已取消",
    partial_failed: "部分失敗"
  }

  return map[normalized] ?? status ?? "-"
}

function getStatusTagType(status?: string) {
  const normalized = normalizeStatus(status)

  if (["completed", "success", "succeeded"].includes(normalized))
    return "success"
  if (["failed", "error", "cancelled", "canceled"].includes(normalized))
    return "danger"
  if (["expired", "partial_failed"].includes(normalized))
    return "warning"
  if (["processing", "in_progress", "running"].includes(normalized))
    return "primary"

  return "info"
}
</script>

<template>
  <div class="app-container">
    <el-card shadow="never">
      <template #header>
        <div class="card-header">
          <div>
            <div class="title">
              服務單批次下載
            </div>
            <div class="subtitle">
              提交非同步下載任務，完成後會透過 SignalR 通知。
            </div>
          </div>
          <el-button :icon="Refresh" :loading="loading" @click="fetchTaskStatus()">
            重新整理任務
          </el-button>
        </div>
      </template>

      <el-alert
        type="info"
        :closable="false"
        show-icon
        title="下載流程說明"
        description="選擇服務單類型與日期區間，建立打包任務。任務完成後，系統會推播通知，頁面也會自動更新最新狀態。"
      />

      <el-form class="filter-form" @submit.prevent="submitTask">
        <div class="form-row">
          <el-form-item label="服務單類型" required>
            <el-radio-group v-model="form.orderType" @change="handleOrderTypeChange">
              <el-radio-button :value="ServiceOrderType.BUYBACK">
                收購單
              </el-radio-button>
              <el-radio-button :value="ServiceOrderType.CONSIGNMENT">
                寄賣單
              </el-radio-button>
            </el-radio-group>
          </el-form-item>

          <el-form-item label="日期區間" required>
            <el-date-picker
              v-model="form.dateRange"
              type="daterange"
              range-separator="至"
              start-placeholder="開始日期"
              end-placeholder="結束日期"
              value-format="YYYY-MM-DD"
              style="width: 260px"
            />
          </el-form-item>
        </div>

        <el-form-item v-if="form.orderType" label="文件類型">
          <el-checkbox-group v-model="form.documentTypes">
            <el-checkbox
              v-for="option in currentDocOptions"
              :key="option.value"
              :label="option.label"
              :value="option.value"
            />
          </el-checkbox-group>
        </el-form-item>

        <el-form-item>
          <el-button
            type="primary"
            :icon="Upload"
            :loading="submitting"
            native-type="submit"
            @click="submitTask"
          >
            提交下載任務
          </el-button>
          <el-button :icon="Refresh" @click="resetForm">
            重置條件
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card v-if="hasTask" shadow="never" class="mt-4">
      <template #header>
        <div class="task-header">
          <span>最新任務狀態</span>
          <div class="task-actions">
            <el-button text type="primary" :icon="Refresh" :loading="loading" @click="fetchTaskStatus()">
              更新狀態
            </el-button>
            <el-button text type="danger" :icon="Delete" @click="clearTask">
              清除紀錄
            </el-button>
          </div>
        </div>
      </template>

      <el-descriptions :column="2" border>
        <el-descriptions-item label="任務 ID">
          {{ currentTask?.taskId }}
        </el-descriptions-item>
        <el-descriptions-item label="狀態">
          <el-tag :type="getStatusTagType(currentTask?.status)">
            {{ getStatusLabel(currentTask?.status) }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="文件類型">
          {{ getOrderTypeLabel(currentTask?.orderType) }}
        </el-descriptions-item>
        <el-descriptions-item label="建立時間">
          {{ formatDateTime(currentTask?.createdAt) }}
        </el-descriptions-item>
        <el-descriptions-item label="查詢區間">
          {{ formatDateOnly(currentTask?.startDate ?? "") }} 至 {{ formatDateOnly(currentTask?.endDate ?? "") }}
        </el-descriptions-item>
        <el-descriptions-item label="下載文件">
          {{ getDocumentTypesLabel(currentTask?.documentTypes) }}
        </el-descriptions-item>
        <el-descriptions-item label="失敗筆數">
          {{ currentTask?.failedCount ?? 0 }}
        </el-descriptions-item>
        <el-descriptions-item v-if="currentTask?.expiresAt" label="連結到期時間">
          {{ formatDateTime(currentTask?.expiresAt) }}
        </el-descriptions-item>
        <el-descriptions-item v-if="currentTask?.errorMessage" label="錯誤訊息" :span="currentTask?.expiresAt ? 1 : 2">
          <span class="error-text">{{ currentTask.errorMessage }}</span>
        </el-descriptions-item>
      </el-descriptions>

      <div class="task-footer">
        <el-button
          type="success"
          :icon="Download"
          :disabled="!canDownload"
          @click="openDownloadUrl"
        >
          下載壓縮檔
        </el-button>
        <span v-if="!isTerminalStatus(currentTask)" class="task-tip">
          任務仍在處理中，完成後會自動更新。
        </span>
        <span v-else-if="currentTask?.downloadUrl" class="task-tip">
          下載連結已就緒，請於有效時間內完成下載。
        </span>
        <span v-else class="task-tip">
          任務已結束，目前沒有可下載檔案。
        </span>
      </div>

      <div v-if="failedOrderNumbers.length" class="mt-4">
        <div class="failed-title">
          打包失敗的服務單
        </div>
        <div class="failed-list">
          <el-tag
            v-for="orderNumber in failedOrderNumbers"
            :key="orderNumber"
            type="danger"
            effect="plain"
          >
            {{ orderNumber }}
          </el-tag>
        </div>
      </div>
    </el-card>

    <el-empty
      v-else
      class="mt-4"
      description="尚未提交批次下載任務"
      :image-size="120"
    >
      <el-button type="primary" :icon="CircleClose" @click="resetForm">
        清空查詢條件
      </el-button>
    </el-empty>
  </div>
</template>

<style scoped lang="scss">
.app-container {
  padding: 20px;
}

.card-header,
.task-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.title {
  font-size: 18px;
  font-weight: 600;
}

.subtitle {
  margin-top: 6px;
  font-size: 13px;
  color: var(--el-text-color-secondary);
}

.filter-form {
  margin-top: 20px;
}

.form-row {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
}

.task-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.task-footer {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 20px;
}

.task-tip {
  color: var(--el-text-color-secondary);
  font-size: 13px;
}

.failed-title {
  margin-bottom: 12px;
  font-weight: 600;
}

.failed-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.error-text {
  color: var(--el-color-danger);
}

.mt-4 {
  margin-top: 16px;
}
</style>

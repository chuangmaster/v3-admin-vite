<script setup lang="ts">
/**
 * 線下簽名對話框
 * 用於預覽合約並進行簽章
 */
import type { DocumentType } from "../types"
import { ElMessage } from "element-plus"
import SignaturePad from "./SignaturePad.vue"

interface Props {
  /** 是否顯示對話框 */
  modelValue: boolean
  /** 合約預覽 URL */
  contractUrl: string
  /** 文件類型 */
  documentType: DocumentType
  /** 文件類型文字 */
  documentTypeText: string
}

const props = defineProps<Props>()

const emit = defineEmits<{
  "update:modelValue": [value: boolean]
  "confirm": [signatureDataUrl: string]
}>()

const signaturePadRef = ref<InstanceType<typeof SignaturePad>>()

/**
 * 在新頁籤開啟合約
 */
function openContractInNewWindow() {
  if (!props.contractUrl) {
    ElMessage.warning("合約 URL 不存在")
    return
  }

  // 如果是 base64 格式，轉換為 Blob URL
  if (props.contractUrl.startsWith("data:application/pdf;base64,")) {
    try {
      const base64Data = props.contractUrl.split(",")[1]
      const binaryData = atob(base64Data)
      const bytes = new Uint8Array(binaryData.length)
      for (let i = 0; i < binaryData.length; i++) {
        bytes[i] = binaryData.charCodeAt(i)
      }
      const blob = new Blob([bytes], { type: "application/pdf" })
      const blobUrl = URL.createObjectURL(blob)

      const newWindow = window.open("", "_blank")
      if (newWindow) {
        newWindow.document.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>合約預覽 - ${props.documentTypeText}</title>
              <style>
                body { margin: 0; padding: 0; }
                iframe { width: 100%; height: 100vh; border: none; }
              </style>
            </head>
            <body>
              <iframe src="${blobUrl}" type="application/pdf"></iframe>
            </body>
          </html>
        `)
        newWindow.document.close()

        // 清理 Blob URL
        setTimeout(() => URL.revokeObjectURL(blobUrl), 1000)
      }
    } catch (error) {
      ElMessage.error("開啟合約失敗")
      console.error("Error opening contract:", error)
    }
  } else {
    // 如果是普通 URL，直接開啟
    window.open(props.contractUrl, "_blank")
  }
}

/**
 * 處理簽名完成
 */
function handleSigned(dataUrl: string) {
  emit("confirm", dataUrl)
  handleClose()
}

/**
 * 關閉對話框
 */
function handleClose() {
  signaturePadRef.value?.clear()
  emit("update:modelValue", false)
}
</script>

<template>
  <el-dialog
    :model-value="modelValue"
    :title="`簽署 - ${documentTypeText}`"
    width="90%"
    :close-on-click-modal="false"
    @close="handleClose"
  >
    <div class="signature-dialog-content">
      <!-- 合約預覽區 -->
      <div class="contract-preview-section">
        <div class="preview-header">
          <h4>合約預覽</h4>
          <el-button
            v-if="contractUrl"
            size="small"
            type="primary"
            link
            @click="openContractInNewWindow"
          >
            在新頁籤開啟
          </el-button>
        </div>
        <div class="preview-container">
          <iframe
            v-if="contractUrl"
            :src="contractUrl"
            class="contract-iframe"
            title="合約預覽"
          />
          <el-empty v-else description="無法載入合約預覽" />
        </div>
      </div>

      <!-- 簽名區 -->
      <div class="signature-section">
        <h4>客戶簽名</h4>
        <SignaturePad ref="signaturePadRef" @signed="handleSigned" />
      </div>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleClose">
          取消
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<style scoped lang="scss">
.signature-dialog-content {
  display: flex;
  flex-direction: column;
  gap: 24px;
  max-height: 70vh;
  overflow-y: auto;

  .contract-preview-section {
    .preview-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
    }

    h4 {
      margin: 0;
      font-size: 16px;
      font-weight: 500;
      color: var(--el-text-color-primary);
    }

    .preview-container {
      border: 1px solid var(--el-border-color);
      border-radius: 4px;
      overflow: hidden;
      background-color: var(--el-fill-color-lighter);

      .contract-iframe {
        width: 100%;
        height: 500px;
        border: none;
      }
    }
  }

  .signature-section {
    h4 {
      margin: 0 0 12px;
      font-size: 16px;
      font-weight: 500;
      color: var(--el-text-color-primary);
    }
  }
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}
</style>

<script setup lang="ts">
/**
 * 身分證上傳元件
 * 支援檔案上傳、拍照、預覽、AI OCR 辨識功能
 */
import type { UploadFile, UploadInstance, UploadRawFile } from "element-plus"
import { Camera, Delete, Star, Upload } from "@element-plus/icons-vue"
import { recognizeIDCard } from "../apis/ocr"

const emit = defineEmits<{
  /** 辨識成功 */
  "recognized": [data: { name: string, idCardNumber: string }]
  /** 更新上傳狀態 */
  "update:modelValue": [value: boolean]
}>()

const uploadRef = ref<UploadInstance>()
const recognizing = ref(false)
const retryCount = ref(0)
const MAX_RETRY_COUNT = 3

/** 當前檔案 */
const currentFile = ref<UploadFile>()
/** 預覽圖片 URL */
const previewUrl = ref<string>("")

/**
 * 檔案上傳前檢查
 */
function beforeUpload(file: UploadRawFile) {
  const isImage = file.type.startsWith("image/")
  const isLt5M = file.size / 1024 / 1024 < 5

  if (!isImage) {
    ElMessage.error("請上傳圖片檔案")
    return false
  }
  if (!isLt5M) {
    ElMessage.error("圖片大小不能超過 5MB")
    return false
  }

  return true
}

/**
 * 檔案變更處理
 */
function handleChange(file: UploadFile) {
  currentFile.value = file

  // 生成預覽 URL
  if (file.raw) {
    previewUrl.value = URL.createObjectURL(file.raw)
  }

  // 重置重試計數
  retryCount.value = 0

  // 通知父元件已上傳
  emit("update:modelValue", true)
}

/**
 * 移除檔案
 */
function handleRemove() {
  currentFile.value = undefined
  previewUrl.value = ""
  retryCount.value = 0

  // 釋放 URL
  if (previewUrl.value) {
    URL.revokeObjectURL(previewUrl.value)
  }

  // 通知父元件已移除
  emit("update:modelValue", false)
}

/**
 * 將檔案轉換為 Base64
 */
function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      // 移除 data:image/xxx;base64, 前綴
      const base64 = result.split(",")[1]
      resolve(base64)
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

/**
 * 執行 AI 辨識
 */
async function handleRecognize() {
  if (!currentFile.value?.raw) {
    ElMessage.warning("請先上傳身分證圖片")
    return
  }

  recognizing.value = true
  try {
    // 將圖片轉換為 Base64
    const base64 = await fileToBase64(currentFile.value.raw)
    const contentType = currentFile.value.raw.type || "image/jpeg"
    const fileName = currentFile.value.name

    const response = await recognizeIDCard(base64, contentType, fileName)

    if (response.success && response.data) {
      ElMessage.success("辨識成功")
      emit("recognized", response.data)
      retryCount.value = 0
    } else {
      throw new Error(response.message || "辨識失敗")
    }
  } catch {
    retryCount.value++

    if (retryCount.value < MAX_RETRY_COUNT) {
      ElMessageBox.confirm(
        `辨識失敗，是否重試？（剩餘 ${MAX_RETRY_COUNT - retryCount.value} 次機會）`,
        "提示",
        {
          confirmButtonText: "重試",
          cancelButtonText: "取消",
          type: "warning"
        }
      )
        .then(() => {
          handleRecognize()
        })
        .catch(() => {
          ElMessage.info("已取消辨識")
        })
    } else {
      ElMessage.error("已達最大重試次數，請檢查圖片是否清晰或手動輸入資料")
      retryCount.value = 0
    }
  } finally {
    recognizing.value = false
  }
}

/**
 * 拍照功能（使用瀏覽器相機 API）
 */
function handleCapture() {
  // 創建 file input 元素並設定為相機模式
  const input = document.createElement("input")
  input.type = "file"
  input.accept = "image/*"
  input.capture = "environment" // 使用後置相機

  input.onchange = (e: Event) => {
    const target = e.target as HTMLInputElement
    const file = target.files?.[0]
    if (file) {
      // 轉換為 UploadFile 格式
      const uploadFile: UploadFile = {
        name: file.name,
        size: file.size,
        raw: file as UploadRawFile,
        status: "ready",
        uid: Date.now()
      }
      handleChange(uploadFile)
    }
  }

  input.click()
}

// 組件卸載時釋放 URL
onBeforeUnmount(() => {
  if (previewUrl.value) {
    URL.revokeObjectURL(previewUrl.value)
  }
})
</script>

<template>
  <div class="id-card-uploader">
    <div class="upload-area">
      <el-upload
        ref="uploadRef"
        :auto-upload="false"
        :show-file-list="false"
        accept="image/*"
        :before-upload="beforeUpload"
        :on-change="handleChange"
        :on-remove="handleRemove"
        drag
      >
        <div v-if="!currentFile" class="upload-placeholder">
          <el-icon class="upload-icon">
            <Upload />
          </el-icon>
          <div class="upload-text">
            將身分證圖片拖曳至此，或<em>點擊上傳</em>
          </div>
          <div class="upload-hint">
            支援 JPG、PNG 格式，檔案大小不超過 5MB
          </div>
        </div>

        <div v-else class="preview-container">
          <el-image
            :src="previewUrl"
            fit="contain"
            class="preview-image"
            :preview-src-list="[previewUrl]"
          />
          <div class="file-info">
            <span>{{ currentFile.name }}</span>
            <el-button
              text
              type="danger"
              size="small"
              :icon="Delete"
              @click.stop="handleRemove"
            >
              移除
            </el-button>
          </div>
        </div>
      </el-upload>
    </div>

    <div class="action-buttons">
      <el-button
        type="primary"
        :icon="Camera"
        @click="handleCapture"
      >
        使用相機拍照
      </el-button>

      <el-button
        v-if="currentFile"
        type="success"
        :icon="Star"
        :loading="recognizing"
        @click="handleRecognize"
      >
        AI 辨識身分證
      </el-button>
    </div>

    <el-alert
      v-if="retryCount > 0"
      type="warning"
      :closable="false"
      show-icon
      class="retry-alert"
    >
      <template #title>
        已重試 {{ retryCount }} 次，剩餘 {{ MAX_RETRY_COUNT - retryCount }} 次機會
      </template>
    </el-alert>
  </div>
</template>

<style scoped lang="scss">
.id-card-uploader {
  width: 100%;
}

.upload-area {
  margin-bottom: 16px;

  :deep(.el-upload) {
    width: 100%;
  }

  :deep(.el-upload-dragger) {
    width: 100%;
    padding: 20px;
  }
}

.upload-placeholder {
  text-align: center;

  .upload-icon {
    font-size: 48px;
    color: var(--el-color-primary);
    margin-bottom: 16px;
  }

  .upload-text {
    font-size: 14px;
    color: var(--el-text-color-regular);
    margin-bottom: 8px;

    em {
      color: var(--el-color-primary);
      font-style: normal;
    }
  }

  .upload-hint {
    font-size: 12px;
    color: var(--el-text-color-secondary);
  }
}

.preview-container {
  .preview-image {
    width: 100%;
    max-height: 300px;
    margin-bottom: 12px;
  }

  .file-info {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 8px 0;
    border-top: 1px solid var(--el-border-color-light);

    span {
      font-size: 14px;
      color: var(--el-text-color-regular);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  }
}

.action-buttons {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
}

.retry-alert {
  margin-top: 12px;
}
</style>

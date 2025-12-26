<script setup lang="ts">
/**
 * 身分證上傳元件
 * 支援正反面檔案上傳、拍照、預覽、AI OCR 辨識功能
 */
import type { UploadFile, UploadRawFile } from "element-plus"
import { Camera, Delete, Star, Upload } from "@element-plus/icons-vue"
import { recognizeIDCard } from "../apis/ocr"

interface Props {
  /** 是否要求正反面都上傳（線下流程為 true） */
  requireBothSides?: boolean
  /** 是否顯示 AI 辨識按鈕 */
  showRecognize?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  requireBothSides: false,
  showRecognize: true
})

const emit = defineEmits<{
  /** 辨識成功 */
  "recognized": [data: { name: string, idCardNumber: string }]
  /** 更新上傳狀態（正面已上傳, 反面已上傳） */
  "update:modelValue": [value: { front: boolean, back: boolean }]
  /** 正面圖片已上傳（傳遞 Base64 資料） */
  "frontUploaded": [data: { base64: string, contentType: string, fileName: string }]
  /** 反面圖片已上傳（傳遞 Base64 資料） */
  "backUploaded": [data: { base64: string, contentType: string, fileName: string }]
}>()

const recognizing = ref(false)
const retryCount = ref(0)
const MAX_RETRY_COUNT = 3

/** 正面檔案 */
const frontFile = ref<UploadFile>()
/** 正面預覽圖片 URL */
const frontPreviewUrl = ref<string>("")

/** 反面檔案 */
const backFile = ref<UploadFile>()
/** 反面預覽圖片 URL */
const backPreviewUrl = ref<string>("")

/** 當前上傳類型 */
type UploadSide = "front" | "back"

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
 * 正面檔案變更處理
 */
async function handleFrontChange(file: UploadFile) {
  frontFile.value = file

  // 生成預覽 URL
  if (file.raw) {
    if (frontPreviewUrl.value) {
      URL.revokeObjectURL(frontPreviewUrl.value)
    }
    frontPreviewUrl.value = URL.createObjectURL(file.raw)

    // 轉換為 Base64 並通知父元件
    try {
      const base64 = await fileToBase64(file.raw)
      emit("frontUploaded", {
        base64,
        contentType: file.raw.type || "image/jpeg",
        fileName: file.name
      })
    } catch (error) {
      ElMessage.error("圖片轉換失敗")
      console.error(error)
    }
  }

  // 重置重試計數
  retryCount.value = 0

  // 通知父元件上傳狀態
  emitUploadStatus()
}

/**
 * 反面檔案變更處理
 */
async function handleBackChange(file: UploadFile) {
  backFile.value = file

  // 生成預覽 URL
  if (file.raw) {
    if (backPreviewUrl.value) {
      URL.revokeObjectURL(backPreviewUrl.value)
    }
    backPreviewUrl.value = URL.createObjectURL(file.raw)

    // 轉換為 Base64 並通知父元件
    try {
      const base64 = await fileToBase64(file.raw)
      emit("backUploaded", {
        base64,
        contentType: file.raw.type || "image/jpeg",
        fileName: file.name
      })
    } catch (error) {
      ElMessage.error("圖片轉換失敗")
      console.error(error)
    }
  }

  // 通知父元件上傳狀態
  emitUploadStatus()
}

/**
 * 通知父元件上傳狀態
 */
function emitUploadStatus() {
  emit("update:modelValue", {
    front: !!frontFile.value,
    back: !!backFile.value
  })
}

/**
 * 移除正面檔案
 */
function handleRemoveFront() {
  frontFile.value = undefined
  if (frontPreviewUrl.value) {
    URL.revokeObjectURL(frontPreviewUrl.value)
    frontPreviewUrl.value = ""
  }
  retryCount.value = 0
  emitUploadStatus()
}

/**
 * 移除反面檔案
 */
function handleRemoveBack() {
  backFile.value = undefined
  if (backPreviewUrl.value) {
    URL.revokeObjectURL(backPreviewUrl.value)
    backPreviewUrl.value = ""
  }
  emitUploadStatus()
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
 * 執行 AI 辨識（使用正面圖片）
 */
async function handleRecognize() {
  if (!frontFile.value?.raw) {
    ElMessage.warning("請先上傳身分證正面圖片")
    return
  }

  recognizing.value = true
  try {
    // 將圖片轉換為 Base64
    const base64 = await fileToBase64(frontFile.value.raw)
    const contentType = frontFile.value.raw.type || "image/jpeg"
    const fileName = frontFile.value.name

    const response = await recognizeIDCard(base64, contentType, fileName)

    if (response.success && response.data) {
      ElMessage.success("辨識成功")
      // 後端回傳 idNumber，轉換為前端使用的 idCardNumber
      emit("recognized", {
        name: response.data.name,
        idCardNumber: response.data.idNumber
      })
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
function handleCapture(side: UploadSide) {
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
      if (side === "front") {
        handleFrontChange(uploadFile)
      } else {
        handleBackChange(uploadFile)
      }
    }
  }

  input.click()
}

/**
 * 取得當前上傳的圖片資料
 */
function getUploadedFiles() {
  return {
    front: frontFile.value?.raw || null,
    back: backFile.value?.raw || null,
    frontPreviewUrl: frontPreviewUrl.value,
    backPreviewUrl: backPreviewUrl.value
  }
}

/**
 * 設定圖片（從外部傳入）
 */
function setFiles(data: { front?: File | null, back?: File | null }) {
  if (data.front) {
    const uploadFile: UploadFile = {
      name: data.front.name,
      size: data.front.size,
      raw: data.front as UploadRawFile,
      status: "ready",
      uid: Date.now()
    }
    handleFrontChange(uploadFile)
  }
  if (data.back) {
    const uploadFile: UploadFile = {
      name: data.back.name,
      size: data.back.size,
      raw: data.back as UploadRawFile,
      status: "ready",
      uid: Date.now() + 1
    }
    handleBackChange(uploadFile)
  }
}

// 組件卸載時釋放 URL
onBeforeUnmount(() => {
  if (frontPreviewUrl.value) {
    URL.revokeObjectURL(frontPreviewUrl.value)
  }
  if (backPreviewUrl.value) {
    URL.revokeObjectURL(backPreviewUrl.value)
  }
})

// 暴露方法供父元件使用
defineExpose({
  getUploadedFiles,
  setFiles
})
</script>

<template>
  <div class="id-card-uploader">
    <!-- 正面上傳區 -->
    <div class="upload-section">
      <div class="section-header">
        <span class="section-title">身分證正面</span>
        <el-tag v-if="props.requireBothSides" type="danger" size="small">
          必填
        </el-tag>
      </div>
      <div class="upload-area">
        <el-upload
          :auto-upload="false"
          :show-file-list="false"
          accept="image/*"
          :before-upload="beforeUpload"
          :on-change="handleFrontChange"
          drag
        >
          <div v-if="!frontFile" class="upload-placeholder">
            <el-icon class="upload-icon">
              <Upload />
            </el-icon>
            <div class="upload-text">
              將身分證<strong>正面</strong>圖片拖曳至此，或<em>點擊上傳</em>
            </div>
            <div class="upload-hint">
              支援 JPG、PNG 格式，檔案大小不超過 5MB
            </div>
          </div>

          <div v-else class="preview-container">
            <el-image
              :src="frontPreviewUrl"
              fit="contain"
              class="preview-image"
              :preview-src-list="[frontPreviewUrl]"
            />
            <div class="file-info">
              <span>{{ frontFile.name }}</span>
              <el-button
                text
                type="danger"
                size="small"
                :icon="Delete"
                @click.stop="handleRemoveFront"
              >
                移除
              </el-button>
            </div>
          </div>
        </el-upload>
      </div>

      <div class="action-buttons">
        <el-button
          size="small"
          :icon="Camera"
          @click="handleCapture('front')"
        >
          拍照
        </el-button>

        <el-button
          v-if="frontFile && props.showRecognize"
          type="success"
          size="small"
          :icon="Star"
          :loading="recognizing"
          @click="handleRecognize"
        >
          AI 辨識
        </el-button>
      </div>
    </div>

    <!-- 反面上傳區（線下流程必填） -->
    <div v-if="props.requireBothSides" class="upload-section">
      <div class="section-header">
        <span class="section-title">身分證反面</span>
        <el-tag type="danger" size="small">
          必填
        </el-tag>
      </div>
      <div class="upload-area">
        <el-upload
          :auto-upload="false"
          :show-file-list="false"
          accept="image/*"
          :before-upload="beforeUpload"
          :on-change="handleBackChange"
          drag
        >
          <div v-if="!backFile" class="upload-placeholder">
            <el-icon class="upload-icon">
              <Upload />
            </el-icon>
            <div class="upload-text">
              將身分證<strong>反面</strong>圖片拖曳至此，或<em>點擊上傳</em>
            </div>
            <div class="upload-hint">
              支援 JPG、PNG 格式，檔案大小不超過 5MB
            </div>
          </div>

          <div v-else class="preview-container">
            <el-image
              :src="backPreviewUrl"
              fit="contain"
              class="preview-image"
              :preview-src-list="[backPreviewUrl]"
            />
            <div class="file-info">
              <span>{{ backFile.name }}</span>
              <el-button
                text
                type="danger"
                size="small"
                :icon="Delete"
                @click.stop="handleRemoveBack"
              >
                移除
              </el-button>
            </div>
          </div>
        </el-upload>
      </div>

      <div class="action-buttons">
        <el-button
          size="small"
          :icon="Camera"
          @click="handleCapture('back')"
        >
          拍照
        </el-button>
      </div>
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
  position: relative;
  z-index: 0;
}

.upload-section {
  margin-bottom: 24px;
  position: relative;
  z-index: 1;

  &:last-child {
    margin-bottom: 0;
  }
}

.section-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;

  .section-title {
    font-size: 14px;
    font-weight: 500;
    color: var(--el-text-color-primary);
  }
}

.upload-area {
  margin-bottom: 12px;

  :deep(.el-upload) {
    width: 100%;
    display: block;
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

    strong {
      color: var(--el-color-primary);
    }

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
    max-width: 100%;
    max-height: 300px;
    margin-bottom: 12px;

    :deep(img) {
      max-width: 100%;
      max-height: 300px;
      object-fit: contain;
    }
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
}

.retry-alert {
  margin-top: 12px;
}
</style>

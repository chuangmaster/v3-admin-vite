<script setup lang="ts">
/**
 * 身分證上傳元件
 *
 * @module common/components/IdCardUploader
 * @description 支援正反面檔案上傳、拍照、預覽、AI OCR 辨識功能
 */
import type { UploadProps, UploadUserFile } from "element-plus"
import { Camera, Check, Picture, Upload } from "@element-plus/icons-vue"
import { ElButton, ElImage, ElLoading, ElMessage, ElMessageBox, ElUpload } from "element-plus"
import { computed, onBeforeUnmount, ref } from "vue"
import { customerApi } from "@/pages/customer-management/apis/customer"

defineOptions({ name: "IdCardUploader" })

const props = withDefaults(defineProps<Props>(), {
  requireBothSides: false,
  showRecognize: true
})

const emit = defineEmits<{
  /** 辨識成功 */
  "recognized": [data: { name: string, idNumber: string, address?: string }]
  /** 更新上傳狀態（正面已上傳, 反面已上傳） */
  "update:modelValue": [value: { front: boolean, back: boolean }]
  /** 正面圖片上傳成功 */
  "frontUploaded": [data: { base64: string, contentType: string, fileName: string }]
  /** 反面圖片上傳成功 */
  "backUploaded": [data: { base64: string, contentType: string, fileName: string }]
}>()

interface Props {
  /** 是否要求正反面都上傳（線下流程為 true） */
  requireBothSides?: boolean
  /** 是否顯示 AI 辨識按鈕 */
  showRecognize?: boolean
}

const recognizing = ref(false)
const retryCount = ref(0)
const MAX_RETRY_COUNT = 3

/** 上傳的檔案列表 */
const fileList = ref<UploadUserFile[]>([])

/** 是否已上傳圖片 */
const hasImage = computed(() => fileList.value.length > 0)

/** 是否已上傳足夠的圖片 */
const hasEnoughImages = computed(() => {
  if (props.requireBothSides) {
    return fileList.value.length >= 2
  }
  return fileList.value.length >= 1
})

/**
 * 處理檔案變更
 */
const handleChange: UploadProps["onChange"] = async (uploadFile, uploadFiles) => {
  fileList.value = uploadFiles

  if (uploadFile.raw && !uploadFile.url) {
    uploadFile.url = URL.createObjectURL(uploadFile.raw)
  }

  retryCount.value = 0
  emitUploadStatus()

  if (uploadFile.raw) {
    const fileIndex = uploadFiles.findIndex(f => f.uid === uploadFile.uid)
    const side = fileIndex === 0 ? "front" : "back"
    await emitFileUploaded(uploadFile.raw, side)
  }
}

/**
 * 處理檔案移除
 */
const handleRemove: UploadProps["onRemove"] = (uploadFile, uploadFiles) => {
  if (uploadFile.url) {
    URL.revokeObjectURL(uploadFile.url)
  }
  fileList.value = uploadFiles
  emitUploadStatus()
}

/**
 * 上傳前驗證
 */
const beforeUpload: UploadProps["beforeUpload"] = (rawFile) => {
  const validTypes = ["image/jpeg", "image/png", "image/jpg"]
  if (!validTypes.includes(rawFile.type)) {
    ElMessage.error("只能上傳 JPG/PNG 格式的圖片")
    return false
  }

  const maxSize = 5 * 1024 * 1024
  if (rawFile.size > maxSize) {
    ElMessage.error("圖片大小不能超過 5MB")
    return false
  }

  return true
}

/**
 * 將 File 轉換為 base64 字串（移除 data URL 前綴）
 */
function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      const base64 = result.split(",")[1]
      resolve(base64)
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

/**
 * 通知父元件上傳狀態
 */
function emitUploadStatus() {
  emit("update:modelValue", {
    front: fileList.value.length >= 1,
    back: fileList.value.length >= 2
  })
}

/**
 * 發送圖片上傳事件給父元件（含 base64 資料）
 */
async function emitFileUploaded(file: File, side: "front" | "back") {
  try {
    const base64 = await fileToBase64(file)

    if (side === "front") {
      emit("frontUploaded", {
        base64,
        contentType: file.type,
        fileName: file.name
      })
    } else {
      emit("backUploaded", {
        base64,
        contentType: file.type,
        fileName: file.name
      })
    }
  } catch (error) {
    ElMessage.error(`圖片轉換失敗: ${file.name}`)
    console.error("File to base64 conversion error:", error)
  }
}

/**
 * 執行 AI 辨識
 */
async function handleRecognize() {
  if (!hasEnoughImages.value) {
    const message = props.requireBothSides
      ? "請上傳身分證正反面圖片"
      : "請至少上傳 1 張身分證圖片"
    ElMessage.warning(message)
    return
  }

  recognizing.value = true
  const loading = ElLoading.service({
    lock: true,
    text: "AI 辨識中,請稍候...",
    background: "rgba(0, 0, 0, 0.7)"
  })

  try {
    const files = fileList.value
      .map(file => file.raw)
      .filter(raw => raw !== undefined) as File[]
    const response = await customerApi.recognizeIdCard(files)

    if (response.success && response.data) {
      const result = response.data

      if (!result.name && !result.idNumber && !result.address) {
        ElMessage.warning("辨識失敗,請確認圖片清晰度或手動輸入")
      } else {
        ElMessage.success("辨識成功")
        emit("recognized", {
          name: result.name || "",
          idNumber: result.idNumber || "",
          address: result.address || ""
        })
        retryCount.value = 0
      }
    } else {
      throw new Error(response.message || "辨識失敗")
    }
  } catch {
    retryCount.value++

    if (retryCount.value < MAX_RETRY_COUNT) {
      ElMessageBox.confirm(
        `辨識失敗，是否重試？(剩餘 ${MAX_RETRY_COUNT - retryCount.value} 次機會)`,
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
      ElMessage.error("已達最大重試次數,請檢查圖片是否清晰或手動輸入資料")
      retryCount.value = 0
    }
  } finally {
    recognizing.value = false
    loading.close()
  }
}

/**
 * 拍照功能（使用瀏覽器相機 API）
 */
async function handleCapture() {
  const input = document.createElement("input")
  input.type = "file"
  input.accept = "image/*"
  input.capture = "environment"
  input.multiple = props.requireBothSides

  input.onchange = async (e: Event) => {
    const target = e.target as HTMLInputElement
    const files = Array.from(target.files || [])

    for (let index = 0; index < files.length; index++) {
      const file = files[index]

      if (fileList.value.length >= 2) {
        ElMessage.warning("最多只能上傳 2 張圖片")
        break
      }

      if (!beforeUpload(file as any)) {
        continue
      }

      const uploadFile: UploadUserFile = {
        name: file.name,
        size: file.size,
        raw: file as any,
        status: "ready",
        uid: Date.now() + index,
        url: URL.createObjectURL(file)
      }

      fileList.value.push(uploadFile)

      const currentFileIndex = fileList.value.length - 1
      const side = currentFileIndex === 0 ? "front" : "back"
      await emitFileUploaded(file, side)
    }

    emitUploadStatus()
  }

  input.click()
}

/**
 * 清空上傳
 */
function clear() {
  fileList.value.forEach((file) => {
    if (file.url) {
      URL.revokeObjectURL(file.url)
    }
  })
  fileList.value = []
  retryCount.value = 0
  emitUploadStatus()
}

/**
 * 取得當前上傳的圖片資料
 */
function getUploadedFiles() {
  const files = fileList.value.map(f => f.raw).filter(Boolean) as File[]
  return {
    front: files[0] || null,
    back: files[1] || null,
    frontPreviewUrl: fileList.value[0]?.url || "",
    backPreviewUrl: fileList.value[1]?.url || ""
  }
}

/**
 * 設定圖片（從外部傳入）
 */
async function setFiles(data: { front?: File | null, back?: File | null }) {
  clear()

  const files: File[] = []
  if (data.front) files.push(data.front)
  if (data.back) files.push(data.back)

  for (let index = 0; index < files.length; index++) {
    const file = files[index]
    const uploadFile: UploadUserFile = {
      name: file.name,
      size: file.size,
      raw: file as any,
      status: "ready",
      uid: Date.now() + index,
      url: URL.createObjectURL(file)
    }
    fileList.value.push(uploadFile)

    const side = index === 0 ? "front" : "back"
    await emitFileUploaded(file, side)
  }

  emitUploadStatus()
}

onBeforeUnmount(() => {
  fileList.value.forEach((file) => {
    if (file.url) {
      URL.revokeObjectURL(file.url)
    }
  })
})

defineExpose({
  getUploadedFiles,
  setFiles,
  clear
})
</script>

<template>
  <div class="id-card-uploader">
    <div class="upload-area">
      <ElUpload
        v-model:file-list="fileList"
        :auto-upload="false"
        :limit="2"
        accept="image/jpeg,image/png,image/jpg"
        :before-upload="beforeUpload"
        :on-change="handleChange"
        :on-remove="handleRemove"
        :show-file-list="false"
        drag
      >
        <div class="upload-content">
          <el-icon :size="50" color="#409eff">
            <Upload />
          </el-icon>
          <div class="upload-text">
            <p>將身分證正反面圖片拖曳到此處</p>
            <p class="upload-hint">
              或點擊選擇檔案(最多 2 張)
            </p>
          </div>
        </div>
      </ElUpload>
    </div>

    <!-- 圖片預覽 -->
    <div v-if="hasImage" class="preview-area">
      <div class="preview-title">
        已上傳 {{ fileList.length }} 張圖片:
      </div>
      <div class="preview-grid">
        <div
          v-for="(file, index) in fileList"
          :key="file.uid"
          class="preview-item"
        >
          <ElImage
            :src="file.url"
            fit="contain"
            :preview-src-list="fileList.map(f => f.url || '')"
            :initial-index="index"
          >
            <template #error>
              <div class="image-error">
                <el-icon :size="30">
                  <Picture />
                </el-icon>
                <p>載入失敗</p>
              </div>
            </template>
          </ElImage>
          <div class="preview-label">
            {{ index === 0 ? '正面' : '反面' }}
          </div>
        </div>
      </div>
    </div>

    <!-- 操作按鈕 -->
    <div v-if="hasImage" class="actions">
      <ElButton
        v-if="props.showRecognize"
        type="primary"
        :icon="Check"
        :loading="recognizing"
        :disabled="recognizing || !hasEnoughImages"
        @click="handleRecognize"
      >
        {{ recognizing ? 'AI 辨識中...' : '開始 AI 辨識' }}
      </ElButton>
      <ElButton :icon="Camera" @click="handleCapture">
        拍照
      </ElButton>
      <ElButton @click="clear">
        清空重選
      </ElButton>
    </div>

    <div v-else class="empty-actions">
      <ElButton :icon="Camera" @click="handleCapture">
        拍照
      </ElButton>
    </div>

    <!-- 提示文字 -->
    <div class="tips">
      <p>📸 上傳提示:</p>
      <ul>
        <li v-if="props.requireBothSides">
          支援上傳 2 張照片(身分證正反面),JPG、PNG 格式,單檔不超過 5MB
        </li>
        <li v-else>
          支援上傳 1-2 張照片(身分證正反面),JPG、PNG 格式,單檔不超過 5MB
        </li>
        <li>請確保身分證圖片清晰、光線充足</li>
        <li v-if="props.showRecognize">
          AI 辨識由 Google Gemini 提供,準確率約 95%
        </li>
        <li v-if="props.showRecognize">
          辨識結果僅供參考,請務必核對後再提交
        </li>
      </ul>
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
  .upload-area {
    margin-bottom: 20px;

    :deep(.el-upload-dragger) {
      padding: 40px 20px;
    }

    .upload-content {
      text-align: center;

      .upload-text {
        margin-top: 16px;

        p {
          margin: 8px 0;
          font-size: 14px;
          color: var(--el-text-color-primary);
        }

        .upload-hint {
          font-size: 12px;
          color: var(--el-text-color-secondary);
        }
      }
    }
  }

  .preview-area {
    margin-bottom: 20px;
    padding: 20px;
    border: 1px solid var(--el-border-color);
    border-radius: 4px;
    background: var(--el-fill-color-lighter);

    .preview-title {
      margin-bottom: 16px;
      font-size: 14px;
      font-weight: 600;
      color: var(--el-text-color-primary);
    }

    .preview-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
      gap: 16px;
    }

    .preview-item {
      position: relative;
      border: 1px solid var(--el-border-color);
      border-radius: 4px;
      overflow: hidden;
      background: white;

      .el-image {
        width: 100%;
        height: 200px;
        display: block;
      }

      .preview-label {
        padding: 8px;
        text-align: center;
        font-size: 12px;
        color: var(--el-text-color-secondary);
        background: var(--el-fill-color-light);
      }
    }

    .image-error {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 200px;
      color: var(--el-text-color-secondary);

      p {
        margin-top: 10px;
        font-size: 12px;
      }
    }
  }

  .actions,
  .empty-actions {
    margin-bottom: 20px;
    text-align: center;

    .el-button {
      margin: 0 8px;
    }
  }

  .tips {
    padding: 16px;
    background: var(--el-fill-color-light);
    border-radius: 4px;
    font-size: 13px;
    color: var(--el-text-color-regular);

    p {
      margin: 0 0 8px 0;
      font-weight: 600;
    }

    ul {
      margin: 0;
      padding-left: 20px;

      li {
        margin: 4px 0;
        line-height: 1.6;
      }
    }
  }

  .retry-alert {
    margin-top: 16px;
  }
}
</style>

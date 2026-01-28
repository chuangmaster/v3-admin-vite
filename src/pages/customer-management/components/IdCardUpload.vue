<!--
  身分證上傳元件

  功能:
  - 支援圖片上傳 (拖曳/點擊)
  - 圖片預覽
  - AI 辨識按鈕
  - 辨識結果回填
-->
<script lang="ts" setup>
import type { UploadProps, UploadUserFile } from "element-plus"
import { Check, Picture, Upload } from "@element-plus/icons-vue"
import { ElButton, ElImage, ElLoading, ElMessage, ElUpload } from "element-plus"
import { computed, ref } from "vue"

interface Emits {
  /** 辨識成功 */
  (e: "recognize", result: {
    name: string | null
    idNumber: string | null
    address: string | null
  }): void
}

const emit = defineEmits<Emits>()

/** 上傳的檔案列表 */
const fileList = ref<UploadUserFile[]>([])

/** 辨識中狀態 */
const recognizing = ref(false)

/** 圖片預覽 URL */
const previewUrl = computed(() => {
  if (fileList.value.length > 0 && fileList.value[0].url) {
    return fileList.value[0].url
  }
  return ""
})

/** 是否已上傳圖片 */
const hasImage = computed(() => fileList.value.length > 0)

/**
 * 處理檔案變更
 */
const handleChange: UploadProps["onChange"] = (uploadFile) => {
  // 只保留最新的一個檔案
  fileList.value = [uploadFile]

  // 建立預覽 URL
  if (uploadFile.raw) {
    uploadFile.url = URL.createObjectURL(uploadFile.raw)
  }
}

/**
 * 處理檔案移除
 */
const handleRemove: UploadProps["onRemove"] = () => {
  // 釋放 URL
  if (previewUrl.value) {
    URL.revokeObjectURL(previewUrl.value)
  }
  fileList.value = []
}

/**
 * 上傳前驗證
 */
const beforeUpload: UploadProps["beforeUpload"] = (rawFile) => {
  // 驗證檔案類型
  const validTypes = ["image/jpeg", "image/png", "image/jpg"]
  if (!validTypes.includes(rawFile.type)) {
    ElMessage.error("只能上傳 JPG/PNG 格式的圖片")
    return false
  }

  // 驗證檔案大小 (最大 5MB)
  const maxSize = 5 * 1024 * 1024
  if (rawFile.size > maxSize) {
    ElMessage.error("圖片大小不能超過 5MB")
    return false
  }

  return true
}

/**
 * 處理 AI 辨識
 */
async function handleRecognize() {
  if (!hasImage.value || !fileList.value[0].raw) {
    ElMessage.warning("請先上傳身分證圖片")
    return
  }

  recognizing.value = true
  const loading = ElLoading.service({
    lock: true,
    text: "AI 辨識中,請稍候...",
    background: "rgba(0, 0, 0, 0.7)"
  })

  try {
    // 呼叫辨識 API (傳遞所有照片的原始 File 物件陣列)
    const { customerApi } = await import("../apis/customer")
    const files = fileList.value
      .map(file => file.raw)
      .filter(raw => raw !== undefined) as File[]
    const response = await customerApi.recognizeIdCard(files)

    if (response.success && response.data) {
      const result = response.data

      // 檢查辨識結果
      if (!result.name && !result.idNumber && !result.address) {
        ElMessage.warning("辨識失敗,請確認圖片清晰度或手動輸入")
      } else {
        ElMessage.success("辨識成功")
        emit("recognize", {
          name: result.name,
          idNumber: result.idNumber,
          address: result.address
        })
      }
    } else {
      ElMessage.error(response.message || "AI 辨識失敗,請稍後再試")
    }
  } catch (error) {
    console.error("recognize error:", error)
    ElMessage.error("AI 辨識失敗,請稍後再試")
  } finally {
    recognizing.value = false
    loading.close()
  }
}

/**
 * 清空上傳
 */
function clear() {
  if (previewUrl.value) {
    URL.revokeObjectURL(previewUrl.value)
  }
  fileList.value = []
}

defineExpose({
  clear
})
</script>

<template>
  <div class="id-card-upload">
    <div class="upload-area">
      <ElUpload
        v-model:file-list="fileList"
        :auto-upload="false"
        :limit="1"
        accept="image/jpeg,image/png,image/jpg"
        :before-upload="beforeUpload"
        :on-change="handleChange"
        :on-remove="handleRemove"
        drag
        list-type="picture"
      >
        <div class="upload-content">
          <el-icon :size="50" color="#409eff">
            <Upload />
          </el-icon>
          <div class="upload-text">
            <p>將身分證圖片拖曳到此處</p>
            <p class="upload-hint">
              或點擊選擇檔案
            </p>
          </div>
        </div>
      </ElUpload>
    </div>

    <!-- 圖片預覽 -->
    <div v-if="hasImage" class="preview-area">
      <ElImage
        :src="previewUrl"
        fit="contain"
        style="width: 100%; max-height: 300px"
      >
        <template #error>
          <div class="image-error">
            <el-icon :size="50">
              <Picture />
            </el-icon>
            <p>圖片載入失敗</p>
          </div>
        </template>
      </ElImage>
    </div>

    <!-- 辨識按鈕 -->
    <div v-if="hasImage" class="actions">
      <ElButton
        type="primary"
        :icon="Check"
        :loading="recognizing"
        :disabled="recognizing"
        @click="handleRecognize"
      >
        {{ recognizing ? 'AI 辨識中...' : '開始 AI 辨識' }}
      </ElButton>
      <ElButton @click="clear">
        清空重選
      </ElButton>
    </div>

    <!-- 提示文字 -->
    <div class="tips">
      <p>📸 上傳提示:</p>
      <ul>
        <li>支援 JPG、PNG 格式,大小不超過 5MB</li>
        <li>請確保身分證圖片清晰、光線充足</li>
        <li>AI 辨識由 Google Gemini 提供,準確率約 95%</li>
        <li>辨識結果僅供參考,請務必核對後再提交</li>
      </ul>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.id-card-upload {
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

    .image-error {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 200px;
      color: var(--el-text-color-secondary);

      p {
        margin-top: 10px;
      }
    }
  }

  .actions {
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
}
</style>

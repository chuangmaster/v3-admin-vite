<script setup lang="ts">
/**
 * 附件上傳元件
 * 支援拖拽上傳、檔案預覽、檔案列表管理
 */
import type { UploadFile, UploadUserFile } from "element-plus"
import type { Attachment, AttachmentType } from "../types"
import { Document } from "@element-plus/icons-vue"
import { ElMessage, ElMessageBox } from "element-plus"
import { getAttachmentList, uploadAttachment } from "../apis/attachment"

interface Props {
  /** 服務單 ID */
  serviceOrderId?: string
  /** 附件類型 */
  fileType: AttachmentType
  /** 是否禁用 */
  disabled?: boolean
  /** 最大檔案數量 */
  limit?: number
}

const props = withDefaults(defineProps<Props>(), {
  disabled: false,
  limit: 10
})

const emit = defineEmits<{
  /** 附件變更 */
  change: [attachments: Attachment[]]
}>()

const uploadRef = ref()
const fileList = ref<UploadUserFile[]>([])
const attachments = ref<Attachment[]>([])
const loading = ref(false)

/** 檔案大小限制（10MB） */
const MAX_FILE_SIZE = 10 * 1024 * 1024

/**
 * 載入附件列表
 */
async function loadAttachments() {
  if (!props.serviceOrderId) return

  try {
    loading.value = true
    const response = await getAttachmentList(props.serviceOrderId)
    if (response.success && response.data) {
      attachments.value = response.data
      // 轉換為 UploadUserFile 格式
      fileList.value = response.data.map((attachment, index) => ({
        name: attachment.fileName,
        url: attachment.fileUrl,
        uid: index, // 使用 index 作為 uid
        status: "success" as const,
        // 保存實際的 attachment id
        response: { id: attachment.id }
      }))
      emit("change", attachments.value)
    }
  } catch {
    ElMessage.error("載入附件列表失敗")
  } finally {
    loading.value = false
  }
}

/**
 * 上傳前檢查
 */
function beforeUpload(file: File): boolean {
  // 檢查檔案大小
  if (file.size > MAX_FILE_SIZE) {
    ElMessage.error(`檔案大小不能超過 ${MAX_FILE_SIZE / 1024 / 1024}MB`)
    return false
  }

  // 檢查檔案類型（可根據 fileType 限制）
  const allowedTypes = ["image/jpeg", "image/png", "image/jpg", "application/pdf"]
  if (!allowedTypes.includes(file.type)) {
    ElMessage.error("僅支援 JPG、PNG、PDF 格式")
    return false
  }

  return true
}

/**
 * 自訂上傳處理
 */
async function handleUpload(options: { file: File }) {
  if (!props.serviceOrderId) {
    ElMessage.error("請先儲存服務單後再上傳附件")
    return
  }

  try {
    loading.value = true
    const response = await uploadAttachment(props.serviceOrderId, options.file, props.fileType)
    if (response.success && response.data) {
      attachments.value.push(response.data)
      ElMessage.success("上傳成功")
      emit("change", attachments.value)
      await loadAttachments()
    } else {
      ElMessage.error(response.message || "上傳失敗")
    }
  } catch {
    ElMessage.error("上傳失敗，請稍後再試")
  } finally {
    loading.value = false
  }
}

/**
 * 移除附件
 */
async function handleRemove(file: UploadFile) {
  const responseData = file.response as { id: string } | undefined
  if (!props.serviceOrderId || !responseData?.id) return

  try {
    await ElMessageBox.confirm("確定要刪除此附件嗎？", "提示", {
      confirmButtonText: "確定",
      cancelButtonText: "取消",
      type: "warning"
    })

    loading.value = true
    const attachmentId = responseData.id
    // TODO: 實作刪除 API
    attachments.value = attachments.value.filter(a => a.id !== attachmentId)
    ElMessage.success("刪除成功")
    emit("change", attachments.value)
  } catch (error) {
    if (error !== "cancel") {
      ElMessage.error("刪除失敗，請稍後再試")
    }
  } finally {
    loading.value = false
  }
}

/**
 * 預覽附件
 */
function handlePreview(file: UploadFile) {
  if (file.url) {
    window.open(file.url, "_blank")
  }
}

/**
 * 超出檔案數量限制
 */
function handleExceed(files: File[], uploadFiles: UploadUserFile[]) {
  ElMessage.warning(`最多只能上傳 ${props.limit} 個檔案，當前已有 ${uploadFiles.length} 個`)
}

// 載入附件列表
watch(
  () => props.serviceOrderId,
  () => {
    if (props.serviceOrderId) {
      loadAttachments()
    }
  },
  { immediate: true }
)

defineExpose({
  loadAttachments
})
</script>

<template>
  <div v-loading="loading" class="attachment-uploader">
    <el-upload
      ref="uploadRef"
      v-model:file-list="fileList"
      :disabled="disabled || !serviceOrderId"
      :limit="limit"
      :http-request="handleUpload"
      :before-upload="beforeUpload"
      :on-preview="handlePreview"
      :on-remove="handleRemove"
      :on-exceed="handleExceed"
      drag
      multiple
    >
      <div class="upload-content">
        <el-icon class="upload-icon">
          <Document />
        </el-icon>
        <div class="upload-text">
          將檔案拖曳至此處，或<em>點擊上傳</em>
        </div>
        <div class="upload-tip">
          支援 JPG、PNG、PDF 格式，單個檔案不超過 10MB
        </div>
      </div>
    </el-upload>
  </div>
</template>

<style scoped lang="scss">
.attachment-uploader {
  .upload-content {
    padding: 40px 20px;
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

    .upload-tip {
      font-size: 12px;
      color: var(--el-text-color-secondary);
    }
  }
}

:deep(.el-upload-dragger) {
  padding: 0;
}

:deep(.el-upload-list__item) {
  transition: all 0.3s;

  &:hover {
    background-color: var(--el-fill-color-light);
  }
}
</style>

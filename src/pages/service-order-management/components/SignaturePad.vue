<script setup lang="ts">
/**
 * 觸控簽名板元件
 * 支援觸控螢幕或滑鼠簽名，可清除、儲存簽名圖片
 */
import { Check, Delete } from "@element-plus/icons-vue"
import SignaturePad from "signature_pad"

const emit = defineEmits<{
  /** 簽名完成 */
  signed: [dataUrl: string]
}>()

const canvasRef = ref<HTMLCanvasElement>()
let signaturePad: SignaturePad | null = null

const isEmpty = ref(true)

/**
 * 初始化簽名板
 */
function initSignaturePad() {
  if (!canvasRef.value)
    return

  signaturePad = new SignaturePad(canvasRef.value, {
    backgroundColor: "rgba(0, 0, 0, 0)",
    penColor: "rgb(0, 0, 0)",
    minWidth: 1,
    maxWidth: 3,
    throttle: 16,
    velocityFilterWeight: 0.7
  })

  // 監聽簽名開始事件
  signaturePad.addEventListener("beginStroke", () => {
    isEmpty.value = false
  })

  // 調整畫布大小
  resizeCanvas()
}

/**
 * 調整畫布大小以適應容器
 */
function resizeCanvas() {
  if (!canvasRef.value || !signaturePad)
    return

  const canvas = canvasRef.value

  // 儲存當前簽名資料
  const data = signaturePad.toData()

  // 設定畫布解析度（使用實際顯示尺寸，避免縮放導致簽名變小）
  canvas.width = canvas.offsetWidth
  canvas.height = canvas.offsetHeight

  // 清空簽名板並重新初始化
  signaturePad.clear()

  // 恢復簽名資料
  if (data && data.length > 0) {
    signaturePad.fromData(data)
  }
}

/**
 * 清除簽名
 */
function handleClear() {
  if (!signaturePad)
    return

  signaturePad.clear()
  isEmpty.value = true
}

/**
 * 儲存簽名
 */
function handleSave() {
  if (!signaturePad)
    return

  if (signaturePad.isEmpty()) {
    ElMessage.warning("請先簽名")
    return
  }

  // 獲取簽名圖片（PNG 格式的 Base64）
  const dataUrl = signaturePad.toDataURL("image/png")
  emit("signed", dataUrl)
  ElMessage.success("簽名已儲存")
}

/**
 * 從 Base64 載入簽名
 */
function loadFromDataURL(dataUrl: string) {
  if (!signaturePad)
    return

  signaturePad.fromDataURL(dataUrl).then(() => {
    isEmpty.value = signaturePad?.isEmpty() ?? true
  })
}

onMounted(() => {
  // 使用 nextTick 確保 DOM 完全渲染後再初始化
  nextTick(() => {
    initSignaturePad()
  })

  // 監聽視窗大小變化
  window.addEventListener("resize", resizeCanvas)
})

onBeforeUnmount(() => {
  window.removeEventListener("resize", resizeCanvas)

  // 清理簽名板
  if (signaturePad) {
    signaturePad.off()
    signaturePad = null
  }
})

defineExpose({
  clear: handleClear,
  save: handleSave,
  loadFromDataURL
})
</script>

<template>
  <div class="signature-pad-container">
    <div class="canvas-wrapper">
      <canvas ref="canvasRef" class="signature-canvas" />
      <div v-if="isEmpty" class="placeholder">
        請在此簽名
      </div>
    </div>

    <div class="action-buttons">
      <el-button
        :icon="Delete"
        :disabled="isEmpty"
        @click="handleClear"
      >
        清除
      </el-button>
      <el-button
        type="primary"
        :icon="Check"
        :disabled="isEmpty"
        @click="handleSave"
      >
        儲存簽名
      </el-button>
    </div>

    <el-alert
      type="info"
      :closable="false"
      show-icon
      class="signature-hint"
    >
      <template #title>
        可使用觸控螢幕或滑鼠進行簽名
      </template>
    </el-alert>
  </div>
</template>

<style scoped lang="scss">
.signature-pad-container {
  width: 100%;
}

.canvas-wrapper {
  position: relative;
  width: 100%;
  height: 300px;
  border: 2px dashed var(--el-border-color);
  border-radius: 4px;
  background-color: #ffffff;
  margin-bottom: 16px;
  overflow: hidden;

  .signature-canvas {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    cursor: crosshair;
    touch-action: none;
  }

  .placeholder {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    color: var(--el-text-color-placeholder);
    font-size: 16px;
    pointer-events: none;
    user-select: none;
  }
}

.action-buttons {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
}

.signature-hint {
  font-size: 12px;
}
</style>

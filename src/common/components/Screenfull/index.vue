<script lang="ts" setup>
import screenfull from "screenfull"

interface Props {
  /** 全螢幕的元素，預設為 html */
  element?: string
  /** 開啟全螢幕提示文字 */
  openTips?: string
  /** 關閉全螢幕提示文字 */
  exitTips?: string
  /** 是否僅針對內容區 */
  content?: boolean
}

const { element = "html", openTips = "全螢幕", exitTips = "退出全螢幕", content = false } = defineProps<Props>()

const CONTENT_LARGE = "content-large"

const CONTENT_FULL = "content-full"

const classList = document.body.classList

// #region 全螢幕
const isEnabled = screenfull.isEnabled

const isFullscreen = ref<boolean>(false)

const fullscreenTips = computed(() => (isFullscreen.value ? exitTips : openTips))

const fullscreenSvgName = computed(() => (isFullscreen.value ? "fullscreen-exit" : "fullscreen"))

function handleFullscreenClick() {
  const dom = document.querySelector(element) || undefined
  isEnabled ? screenfull.toggle(dom) : ElMessage.warning("您的瀏覽器不支援此功能")
}

function handleFullscreenChange() {
  isFullscreen.value = screenfull.isFullscreen
  // 退出全螢幕時移除相關的 class
  isFullscreen.value || classList.remove(CONTENT_LARGE, CONTENT_FULL)
}

watchEffect(() => {
  if (isEnabled) {
    // 掛載組件時自動綁定
    screenfull.on("change", handleFullscreenChange)
    // 卸載組件時移除綁定
    onWatcherCleanup(() => {
      screenfull.off("change", handleFullscreenChange)
    })
  }
})
// #endregion

// #region 內容區
const isContentLarge = ref<boolean>(false)

const contentLargeTips = computed(() => (isContentLarge.value ? "內容區復原" : "內容區放大"))

const contentLargeSvgName = computed(() => (isContentLarge.value ? "fullscreen-exit" : "fullscreen"))

function handleContentLargeClick() {
  isContentLarge.value = !isContentLarge.value
  // 內容區放大時，隱藏不必要的元件
  classList.toggle(CONTENT_LARGE, isContentLarge.value)
}

function handleContentFullClick() {
  // 取消內容區放大
  isContentLarge.value && handleContentLargeClick()
  // 內容區全螢幕時，隱藏不必要的元件
  classList.add(CONTENT_FULL)
  // 開啟全螢幕
  handleFullscreenClick()
}
// #endregion
</script>

<template>
  <div>
    <!-- 全螢幕 -->
    <el-tooltip v-if="!content" effect="dark" :content="fullscreenTips" placement="bottom">
      <SvgIcon :name="fullscreenSvgName" @click="handleFullscreenClick" class="svg-icon" />
    </el-tooltip>
    <!-- 內容區 -->
    <el-dropdown v-else :disabled="isFullscreen">
      <SvgIcon :name="contentLargeSvgName" class="svg-icon" />
      <template #dropdown>
        <el-dropdown-menu>
          <!-- 内容区放大 -->
          <el-dropdown-item @click="handleContentLargeClick">
            {{ contentLargeTips }}
          </el-dropdown-item>
          <!-- 内容区全屏 -->
          <el-dropdown-item @click="handleContentFullClick">
            內容區全螢幕
          </el-dropdown-item>
        </el-dropdown-menu>
      </template>
    </el-dropdown>
  </div>
</template>

<style lang="scss" scoped>
.svg-icon {
  font-size: 20px;
  &:focus {
    outline: none;
  }
}
</style>

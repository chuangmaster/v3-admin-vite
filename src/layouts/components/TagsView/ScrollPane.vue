<script lang="ts" setup>
import type { RouterLink } from "vue-router"
import Screenfull from "@@/components/Screenfull/index.vue"
import { useRouteListener } from "@@/composables/useRouteListener"
import { ArrowLeft, ArrowRight } from "@element-plus/icons-vue"
import { useSettingsStore } from "@/pinia/stores/settings"

interface Props {
  tagRefs: InstanceType<typeof RouterLink>[] | null
}

const props = defineProps<Props>()

const route = useRoute()

const settingsStore = useSettingsStore()

const { listenerRouteChange } = useRouteListener()

/** 滾動條元件的引用 */
const scrollbarRef = useTemplateRef("scrollbarRef")

/** 滾動條內容元素的引用 */
const scrollbarContentRef = useTemplateRef("scrollbarContentRef")

/** 當前滾動條距離左側的距離 */
let currentScrollLeft = 0

/** 每次滾動距離 */
const translateDistance = 200

/** 滾動時觸發 */
function scroll({ scrollLeft }: { scrollLeft: number }) {
  currentScrollLeft = scrollLeft
}

/** 滑鼠滾輪滾動時觸發 */
function wheelScroll({ deltaY }: WheelEvent) {
  if (deltaY.toString().startsWith("-")) {
    scrollTo("left")
  } else {
    scrollTo("right")
  }
}

/** 取得可能需要的寬度 */
function getWidth() {
  // 可滾動內容的長度
  const scrollbarContentRefWidth = scrollbarContentRef.value!.clientWidth
  // 滾動可視區寬度
  const scrollbarRefWidth = scrollbarRef.value!.wrapRef!.clientWidth
  // 最後剩餘可滾動的寬度
  const lastDistance = scrollbarContentRefWidth - scrollbarRefWidth - currentScrollLeft

  return { scrollbarContentRefWidth, scrollbarRefWidth, lastDistance }
}

/** 左右滾動 */
function scrollTo(direction: "left" | "right", distance: number = translateDistance) {
  let scrollLeft = 0
  const { scrollbarContentRefWidth, scrollbarRefWidth, lastDistance } = getWidth()
  // 沒有橫向滾動條，直接結束
  if (scrollbarRefWidth > scrollbarContentRefWidth) return
  if (direction === "left") {
    scrollLeft = Math.max(0, currentScrollLeft - distance)
  } else {
    scrollLeft = Math.min(currentScrollLeft + distance, currentScrollLeft + lastDistance)
  }
  scrollbarRef.value!.setScrollLeft(scrollLeft)
}

/** 移動到目標位置 */
function moveTo() {
  const tagRefs = props.tagRefs!
  for (let i = 0; i < tagRefs.length; i++) {
    // @ts-expect-error ignore
    if (route.path === tagRefs[i].$props.to.path) {
      // @ts-expect-error ignore
      const el: HTMLElement = tagRefs[i].$el
      const offsetWidth = el.offsetWidth
      const offsetLeft = el.offsetLeft
      const { scrollbarRefWidth } = getWidth()
      // 當前 tag 在可視區域左側時
      if (offsetLeft < currentScrollLeft) {
        const distance = currentScrollLeft - offsetLeft
        scrollTo("left", distance)
        return
      }
      // 當前 tag 在可視區域右側時
      const width = scrollbarRefWidth + currentScrollLeft - offsetWidth
      if (offsetLeft > width) {
        const distance = offsetLeft - width
        scrollTo("right", distance)
        return
      }
    }
  }
}

// 監聽路由變化，移動到目標位置
listenerRouteChange(() => {
  nextTick(moveTo)
})
</script>

<template>
  <div class="scroll-container">
    <el-tooltip content="向左滾動標籤（超出最大寬度時可點擊）">
      <el-icon class="arrow left" @click="scrollTo('left')">
        <ArrowLeft />
      </el-icon>
    </el-tooltip>
    <el-scrollbar ref="scrollbarRef" @wheel.passive="wheelScroll" @scroll="scroll">
      <div ref="scrollbarContentRef" class="scrollbar-content">
        <slot />
      </div>
    </el-scrollbar>
    <el-tooltip content="向右滾動標籤（超出最大寬度時可點擊）">
      <el-icon class="arrow right" @click="scrollTo('right')">
        <ArrowRight />
      </el-icon>
    </el-tooltip>
    <Screenfull v-if="settingsStore.showScreenfull" :content="true" class="screenfull" />
  </div>
</template>

<style lang="scss" scoped>
.scroll-container {
  height: 100%;
  user-select: none;
  display: flex;
  justify-content: space-between;
  .arrow {
    width: 40px;
    height: 100%;
    font-size: 18px;
    cursor: pointer;
    &.left {
      box-shadow: 5px 0 5px -6px var(--el-border-color-darker);
    }
    &.right {
      box-shadow: -5px 0 5px -6px var(--el-border-color-darker);
    }
  }
  .el-scrollbar {
    flex: 1;
    // 防止换行（超出宽度时，显示滚动条）
    white-space: nowrap;
    .scrollbar-content {
      display: inline-block;
    }
  }
  .screenfull {
    width: 40px;
    display: flex;
    justify-content: center;
    align-items: center;
    cursor: pointer;
  }
}
</style>

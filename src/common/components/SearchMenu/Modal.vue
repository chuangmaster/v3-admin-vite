<script lang="ts" setup>
import type { RouteRecordNameGeneric, RouteRecordRaw } from "vue-router"
import { useDevice } from "@@/composables/useDevice"
import { isExternal } from "@@/utils/validate"
import { cloneDeep, debounce } from "lodash-es"
import { usePermissionStore } from "@/pinia/stores/permission"
import Footer from "./Footer.vue"
import Result from "./Result.vue"

/** 控制 modal 顯隱 */
const modelValue = defineModel<boolean>({ required: true })

const router = useRouter()

const { isMobile } = useDevice()

const inputRef = useTemplateRef("inputRef")

const scrollbarRef = useTemplateRef("scrollbarRef")

const resultRef = useTemplateRef("resultRef")

const keyword = ref<string>("")

const result = shallowRef<RouteRecordRaw[]>([])

const activeRouteName = ref<RouteRecordNameGeneric | undefined>(undefined)

/** 是否按下了上鍵或下鍵（用於解決和 mouseenter 事件的衝突） */
const isPressUpOrDown = ref<boolean>(false)

/** 控制搜尋對話框寬度 */
const modalWidth = computed(() => (isMobile.value ? "80vw" : "40vw"))

/** 樹狀選單 */
const menus = computed(() => cloneDeep(usePermissionStore().routes))

/** 將 title 物件轉換為字串 */
function getTitleString(title: any): string {
  if (!title) return ""
  if (typeof title === "string") return title
  // 如果是物件，優先取對應語言，否則取第一個值
  return Object.values(title)[0] as string || ""
}

/** 搜尋（防抖） */
const handleSearch = debounce(() => {
  const flatMenus = flatTree(menus.value)
  const _keywords = keyword.value.toLocaleLowerCase().trim()
  result.value = flatMenus.filter(menu => keyword.value ? getTitleString(menu.meta?.title).toLocaleLowerCase().includes(_keywords) : false)
  // 預設選中搜尋結果的第一項
  const length = result.value?.length
  activeRouteName.value = length > 0 ? result.value[0].name : undefined
}, 500)

/** 將樹狀選單扁平化為一維陣列，用於選單搜尋 */
function flatTree(arr: RouteRecordRaw[], result: RouteRecordRaw[] = []) {
  arr.forEach((item) => {
    result.push(item)
    item.children && flatTree(item.children, result)
  })
  return result
}

/** 關閉搜尋對話框 */
function handleClose() {
  modelValue.value = false
  // 延時處理防止使用者看到重置資料的操作
  setTimeout(() => {
    keyword.value = ""
    result.value = []
  }, 200)
}

/** 根據索引位置進行滾動 */
function scrollTo(index: number) {
  if (!resultRef.value) return
  const scrollTop = resultRef.value.getScrollTop(index)
  // 手動控制 el-scrollbar 捲軸滾動，設定捲軸到頂部的距離
  scrollbarRef.value?.setScrollTop(scrollTop)
}

/** 鍵盤上鍵 */
function handleUp() {
  isPressUpOrDown.value = true
  const { length } = result.value
  if (length === 0) return
  // 获取该 name 在菜单中第一次出现的位置
  const index = result.value.findIndex(item => item.name === activeRouteName.value)
  // 如果已處在頂部
  if (index === 0) {
    const bottomName = result.value[length - 1].name
    // 如果顶部和底部的 bottomName 相同，且长度大于 1，就再跳一个位置（可解决遇到首尾两个相同 name 导致的上键不能生效的问题）
    if (activeRouteName.value === bottomName && length > 1) {
      activeRouteName.value = result.value[length - 2].name
      scrollTo(length - 2)
    } else {
      // 跳轉到底部
      activeRouteName.value = bottomName
      scrollTo(length - 1)
    }
  } else {
    activeRouteName.value = result.value[index - 1].name
    scrollTo(index - 1)
  }
}

/** 鍵盤下鍵 */
function handleDown() {
  isPressUpOrDown.value = true
  const { length } = result.value
  if (length === 0) return
  // 获取该 name 在菜单中最后一次出现的位置（可解决遇到连续两个相同 name 导致的下键不能生效的问题）
  const index = result.value.map(item => item.name).lastIndexOf(activeRouteName.value)
  // 如果已處在底部
  if (index === length - 1) {
    const topName = result.value[0].name
    // 如果底部和顶部的 topName 相同，且长度大于 1，就再跳一个位置（可解决遇到首尾两个相同 name 导致的下键不能生效的问题）
    if (activeRouteName.value === topName && length > 1) {
      activeRouteName.value = result.value[1].name
      scrollTo(1)
    } else {
      // 跳轉到頂部
      activeRouteName.value = topName
      scrollTo(0)
    }
  } else {
    activeRouteName.value = result.value[index + 1].name
    scrollTo(index + 1)
  }
}

/** 鍵盤回車鍵 */
function handleEnter() {
  const { length } = result.value
  if (length === 0) return
  const name = activeRouteName.value
  const path = result.value.find(item => item.name === name)?.path
  if (path && isExternal(path)) return window.open(path, "_blank", "noopener, noreferrer")
  if (!name) return ElMessage.warning("無法透過搜尋進入該選單，請為對應的路由設定唯一的 Name")
  try {
    router.push({ name })
  } catch {
    return ElMessage.warning("該選單有必填的動態參數，無法透過搜尋進入")
  }
  handleClose()
}

/** 释放上键或下键 */
function handleReleaseUpOrDown() {
  isPressUpOrDown.value = false
}
</script>

<template>
  <el-dialog
    v-model="modelValue"
    :before-close="handleClose"
    :width="modalWidth"
    top="5vh"
    class="search-modal__private"
    append-to-body
    @opened="inputRef?.focus()"
    @closed="inputRef?.blur()"
    @keydown.up="handleUp"
    @keydown.down="handleDown"
    @keydown.enter="handleEnter"
    @keyup.up.down="handleReleaseUpOrDown"
  >
    <el-input ref="inputRef" v-model="keyword" placeholder="搜尋選單" size="large" clearable @input="handleSearch">
      <template #prefix>
        <SvgIcon name="search" class="svg-icon" />
      </template>
    </el-input>
    <el-empty v-if="result.length === 0" description="暫無搜尋結果" :image-size="100" />
    <template v-else>
      <p>搜尋結果</p>
      <el-scrollbar ref="scrollbarRef" max-height="40vh" always>
        <Result
          ref="resultRef"
          v-model="activeRouteName"
          :data="result"
          :is-press-up-or-down="isPressUpOrDown"
          @click="handleEnter"
        />
      </el-scrollbar>
    </template>
    <template #footer>
      <Footer :total="result.length" />
    </template>
  </el-dialog>
</template>

<style lang="scss">
.search-modal__private {
  .svg-icon {
    font-size: 18px;
  }
  .el-dialog__header {
    display: none;
  }
  .el-dialog__footer {
    border-top: 1px solid var(--el-border-color);
    padding-top: var(--el-dialog-padding-primary);
  }
}
</style>

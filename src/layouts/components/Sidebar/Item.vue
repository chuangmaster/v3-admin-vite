<script lang="ts" setup>
import type { RouteRecordRaw } from "vue-router"
import { isExternal } from "@@/utils/validate"
import path from "path-browserify"
import { computed, ref, watch } from "vue"
import { useI18n } from "vue-i18n"
import Link from "./Link.vue"

interface Props {
  item: RouteRecordRaw
  basePath?: string
}

const { item, basePath = "" } = defineProps<Props>()

const { locale } = useI18n()

const renderKey = ref(0)

function getTitle(titleObj: any) {
  if (!titleObj) return ""
  if (typeof titleObj === "string") return titleObj
  // 將 locale (如 "zh-TW") 轉換為對應的 key 格式 (如 "zhTW")
  let key = locale.value
  if (key === "zh-TW") key = "zhTW"
  if (key === "zh-CN") key = "zhCN"
  return titleObj[key] || titleObj.zhCN || titleObj["zh-CN"] || Object.values(titleObj)[0] || ""
}

/** 是否始终显示根菜单 */
const alwaysShowRootMenu = computed(() => item.meta?.alwaysShow)

/** 显示的子菜单 */
const showingChildren = computed(() => item.children?.filter(child => !child.meta?.hidden) ?? [])

/** 显示的子菜单数量 */
const showingChildNumber = computed(() => showingChildren.value.length)

/** 唯一的子菜单项 */
const theOnlyOneChild = computed(() => {
  const number = showingChildNumber.value
  switch (true) {
    case number > 1:
      return null
    case number === 1:
      return showingChildren.value[0]
    default:
      return { ...item, path: "" }
  }
})

/** 解析路径 */
function resolvePath(routePath: string) {
  switch (true) {
    case isExternal(routePath):
      return routePath
    case isExternal(basePath):
      return basePath
    default:
      return path.resolve(basePath, routePath)
  }
}

watch(locale, () => {
  renderKey.value++
})
</script>

<template>
  <template v-if="!alwaysShowRootMenu && theOnlyOneChild && !theOnlyOneChild.children">
    <Link v-if="theOnlyOneChild.meta" :to="resolvePath(theOnlyOneChild.path)">
      <el-menu-item :index="resolvePath(theOnlyOneChild.path)" :key="renderKey">
        <SvgIcon v-if="theOnlyOneChild.meta.svgIcon" :name="theOnlyOneChild.meta.svgIcon" class="svg-icon" />
        <component v-else-if="theOnlyOneChild.meta.elIcon" :is="theOnlyOneChild.meta.elIcon" class="el-icon" />
        <template v-if="theOnlyOneChild.meta.title" #title>
          <span class="title">{{ getTitle(theOnlyOneChild.meta.title) }}</span>
        </template>
      </el-menu-item>
    </Link>
  </template>
  <el-sub-menu v-else :index="resolvePath(item.path)" teleported :key="renderKey">
    <template #title>
      <SvgIcon v-if="item.meta?.svgIcon" :name="item.meta.svgIcon" class="svg-icon" />
      <component v-else-if="item.meta?.elIcon" :is="item.meta.elIcon" class="el-icon" />
      <span v-if="item.meta?.title" class="title">{{ getTitle(item.meta.title) }}</span>
    </template>
    <template v-if="item.children">
      <Item
        v-for="child in showingChildren"
        :key="child.path"
        :item="child"
        :base-path="resolvePath(child.path)"
      />
    </template>
  </el-sub-menu>
</template>

<style lang="scss" scoped>
@import "@@/assets/styles/mixins.scss";

.svg-icon {
  min-width: 1em;
  margin-right: 12px;
  font-size: 18px;
}

.el-icon {
  width: 1em !important;
  margin-right: 12px !important;
  font-size: 18px;
}

.title {
  @extend %ellipsis;
}
</style>

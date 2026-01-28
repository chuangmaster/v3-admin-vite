<script lang="ts" setup>
import type { TabPaneName } from "element-plus"
import { Bell } from "@element-plus/icons-vue"
import { useI18n } from "vue-i18n"
import List from "./List.vue"
import { useNotifyStore } from "./store"

const { t } = useI18n()
const notifyStore = useNotifyStore()

/** 角標目前數量 */
const badgeValue = computed(() => notifyStore.badgeValue)

/** 角標最大值 */
const badgeMax = 99

/** 面板寬度 */
const popoverWidth = 350

/** 目前分頁(標籤) */
const activeName = ref<TabPaneName>("notification")

/** 全部資料 */
const data = computed(() => notifyStore.data)

function handleHistory() {
  const label = t(`components.notify.${activeName.value}`)
  ElMessage.success(`已前往${label}的歷史紀錄`)
}
</script>

<template>
  <div class="notify">
    <el-popover placement="bottom" :width="popoverWidth" trigger="click">
      <template #reference>
        <el-badge :value="badgeValue" :max="badgeMax" :hidden="badgeValue === 0">
          <el-tooltip effect="dark" :content="t('components.notify.notification')" placement="bottom">
            <el-icon :size="20">
              <Bell />
            </el-icon>
          </el-tooltip>
        </el-badge>
      </template>
      <template #default>
        <el-tabs v-model="activeName" stretch>
          <el-tab-pane v-for="(item, index) in data" :key="index" :name="item.name">
            <template #label>
              {{ t(`components.notify.${item.name}`) }}
              <el-badge :value="item.list.length" :max="badgeMax" :type="item.type" />
            </template>
            <el-scrollbar height="400px">
              <List :data="item.list" />
            </el-scrollbar>
          </el-tab-pane>
        </el-tabs>
        <div class="notify-history">
          <el-button link @click="handleHistory">
            查看{{ t(`components.notify.${activeName}`) }}歷史
          </el-button>
        </div>
      </template>
    </el-popover>
  </div>
</template>

<style lang="scss" scoped>
.notify-history {
  text-align: center;
  padding-top: 12px;
  border-top: 1px solid var(--el-border-color);
}
</style>

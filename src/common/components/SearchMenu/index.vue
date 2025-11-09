<script lang="ts" setup>
import { useI18n } from "vue-i18n"
import Modal from "./Modal.vue"

const { t } = useI18n()

/** 控制 modal 顯隱 */
const visible = ref<boolean>(false)

/** 打開 modal */
function handleOpen() {
  visible.value = true
}
</script>

<template>
  <div>
    <el-tooltip effect="dark" :content="t('components.searchMenu.placeholder')" placement="bottom">
      <SvgIcon name="search" @click="handleOpen" class="svg-icon" />
    </el-tooltip>
    <Modal v-model="visible" />
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

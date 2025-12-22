<script setup lang="ts">
/**
 * 商品瑕疵選擇器元件
 * 用於寄賣單的商品瑕疵多選
 */
import { DEFECT_OPTIONS } from "../types"

interface Props {
  /** 選中的瑕疵值 */
  modelValue?: (string | number)[]
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: () => []
})

const emit = defineEmits<{
  /** 更新選中的瑕疵 */
  "update:modelValue": [value: (string | number)[]]
}>()

/** 內部選中值 */
const selectedDefects = computed({
  get: () => props.modelValue,
  set: value => emit("update:modelValue", value)
})
</script>

<template>
  <div class="defects-selector">
    <el-checkbox-group v-model="selectedDefects">
      <el-checkbox
        v-for="option in DEFECT_OPTIONS"
        :key="option.value"
        :label="option.value"
      >
        {{ option.label }}
      </el-checkbox>
    </el-checkbox-group>
  </div>
</template>

<style scoped lang="scss">
.defects-selector {
  :deep(.el-checkbox-group) {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
    gap: 12px;
  }

  :deep(.el-checkbox) {
    margin-right: 0;
  }
}
</style>

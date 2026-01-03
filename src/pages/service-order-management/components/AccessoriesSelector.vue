<script setup lang="ts">
/**
 * 商品配件選擇器元件
 * 用於寄賣單的商品配件多選
 */
import { ACCESSORY_OPTIONS } from "../types"

interface Props {
  /** 選中的配件值 */
  modelValue?: (string | number)[]
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: () => []
})

const emit = defineEmits<{
  /** 更新選中的配件 */
  "update:modelValue": [value: (string | number)[]]
}>()

/** 內部選中值 */
const selectedAccessories = computed({
  get: () => props.modelValue,
  set: value => emit("update:modelValue", value)
})
</script>

<template>
  <div class="accessories-selector">
    <el-checkbox-group v-model="selectedAccessories">
      <el-checkbox
        v-for="option in ACCESSORY_OPTIONS"
        :key="option.value"
        :label="option.value"
      >
        {{ option.label }}
      </el-checkbox>
    </el-checkbox-group>
  </div>
</template>

<style scoped lang="scss">
.accessories-selector {
  :deep(.el-checkbox-group) {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
    gap: 12px;
  }

  :deep(.el-checkbox) {
    margin-right: 0;
  }
}
</style>

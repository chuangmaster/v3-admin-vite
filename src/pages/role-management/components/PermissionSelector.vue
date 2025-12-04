<script setup lang="ts">
/**
 * 權限選擇器元件
 * 使用 el-tree 展示權限樹狀結構
 * 支援父子節點聯動與搜尋過濾
 * @module @/pages/role-management/components/PermissionSelector
 */

import type { PermissionTreeNode } from "../types"

import { nextTick, ref, watch } from "vue"

interface Props {
  /** 已選中的權限 ID */
  modelValue: string[]
  /** 權限樹資料 */
  permissions?: PermissionTreeNode[]
  /** 是否禁用 */
  disabled?: boolean
  /** 是否載入中 */
  loading?: boolean
}

interface Emits {
  (e: "update:modelValue", value: string[]): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const treeRef = ref()
const filterText = ref("")

/**
 * 監聽 modelValue 的變更，更新樹的選中狀態
 */
watch(
  () => props.modelValue,
  async (newVal: string[]) => {
    console.log("[PermissionSelector] modelValue changed:", newVal)
    // 等待 DOM 更新
    await nextTick()
    if (treeRef.value?.setCheckedKeys) {
      console.log("[PermissionSelector] setting checked keys:", newVal)
      // 第二個參數 false 表示不觸發父子節點聯動檢查，避免循環觸發
      treeRef.value.setCheckedKeys(newVal || [], false)
      console.log("[PermissionSelector] checked keys set successfully")
    } else {
      console.warn("[PermissionSelector] treeRef.value is not ready")
    }
  },
  { deep: true, immediate: true }
)

/**
 * 樹狀過濾方法
 */
function filterNode(value: string, data: any) {
  if (!value) return true
  return data.label.toLowerCase().includes(value.toLowerCase())
}

/**
 * 處理過濾文字的變更
 */
function handleFilterInput() {
  if (treeRef.value) {
    treeRef.value.filter(filterText.value)
  }
}

/**
 * 監聽樹節點選擇變更
 */
function handleCheck() {
  if (treeRef.value) {
    // 只獲取選中的葉子節點（true 參數表示只取葉子節點）
    const checkedNodes = treeRef.value.getCheckedNodes(true)
    // 提取葉子節點的 ID
    const permissionIds = checkedNodes.map((node: any) => node.id)
    emit("update:modelValue", permissionIds)
  }
}

defineExpose({ treeRef })
</script>

<template>
  <div class="permission-selector" v-loading="props.loading">
    <div class="search-box">
      <el-input
        v-model="filterText"
        placeholder="搜尋權限..."
        clearable
        @input="handleFilterInput"
      />
    </div>

    <div class="tree-container">
      <el-tree
        ref="treeRef"
        :data="props.permissions || []"
        show-checkbox
        node-key="id"
        :props="{ children: 'children', label: 'label' }"
        :filter-node-method="filterNode"
        :disabled="props.disabled"
        :default-expand-all="true"
        @check="handleCheck"
      />
    </div>
  </div>
</template>

<style scoped lang="scss">
.permission-selector {
  .search-box {
    margin-bottom: 16px;
  }

  .tree-container {
    max-height: 400px;
    overflow-y: auto;
    border: 1px solid #dcdfe6;
    border-radius: 4px;
    padding: 8px;
  }
}
</style>

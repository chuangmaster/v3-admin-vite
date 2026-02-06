<script setup lang="ts">
/**
 * 訂單項目表單元件
 *
 * @module order-management/components/OrderItemsForm
 * @description 提供動態新增/刪除訂單項目功能,含欄位驗證與小計計算
 */
import type { OrderItemFormData } from "@/pages/order-management/types"
import { Delete, Plus } from "@element-plus/icons-vue"
import {
  ElButton,
  ElFormItem,
  ElInput,
  ElInputNumber,
  ElOption,
  ElSelect,
  ElTable,
  ElTableColumn
} from "element-plus"
import { computed } from "vue"
import {
  PRODUCT_SOURCE_LABELS,
  ProductSource
} from "@/pages/order-management/types"

defineOptions({ name: "OrderItemsForm" })

const props = withDefaults(defineProps<Props>(), {
  disabled: false
})

const emit = defineEmits<Emits>()

interface Props {
  /** 訂單項目列表 */
  modelValue: OrderItemFormData[]
  /** 是否禁用 */
  disabled?: boolean
}

interface Emits {
  (e: "update:modelValue", value: OrderItemFormData[]): void
}

/** 商品小計 */
const subtotal = computed(() => {
  return props.modelValue.reduce((sum, item) => {
    return sum + (item.unitPrice || 0) * (item.quantity || 0)
  }, 0)
})

/**
 * 新增空白訂單項目
 */
function addItem() {
  const newItem: OrderItemFormData = {
    tempId: `temp_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    productName: "",
    brandName: "",
    panshiCode: "",
    serialId: "",
    productStyle: "",
    accessories: "",
    productSource: ProductSource.BUYBACK,
    unitPrice: 0,
    quantity: 1
  }
  emit("update:modelValue", [...props.modelValue, newItem])
}

/**
 * 刪除指定訂單項目
 * @param index - 項目索引
 */
function removeItem(index: number) {
  const items = [...props.modelValue]
  items.splice(index, 1)
  emit("update:modelValue", items)
}

/**
 * 更新指定項目欄位
 * @param index - 項目索引
 * @param field - 欄位名稱
 * @param value - 欄位值
 */
function updateItem(index: number, field: keyof OrderItemFormData, value: any) {
  const items = [...props.modelValue]
  items[index] = { ...items[index], [field]: value }
  emit("update:modelValue", items)
}

/**
 * 計算單項小計
 * @param item - 訂單項目
 * @returns 小計金額
 */
function getItemSubtotal(item: OrderItemFormData): number {
  return (item.unitPrice || 0) * (item.quantity || 0)
}

/**
 * 格式化金額顯示
 * @param amount - 金額
 * @returns 格式化後的金額字串
 */
function formatCurrency(amount: number): string {
  return `NT$ ${amount.toLocaleString()}`
}
</script>

<template>
  <div class="order-items-form">
    <div class="items-header">
      <span class="items-title">商品項目</span>
      <ElButton
        type="primary"
        :icon="Plus"
        size="small"
        :disabled="props.disabled"
        @click="addItem"
      >
        新增項目
      </ElButton>
    </div>

    <ElTable
      :data="props.modelValue"
      border
      size="small"
      empty-text="請新增至少一個商品項目"
      class="items-table"
    >
      <ElTableColumn label="商品名稱" min-width="140">
        <template #default="{ row, $index }">
          <ElFormItem :prop="`orderItems.${$index}.productName`" :rules="[{ required: true, message: '必填', trigger: 'blur' }]">
            <ElInput
              :model-value="row.productName"
              :disabled="props.disabled"
              placeholder="商品名稱"
              maxlength="200"
              @update:model-value="(v: string) => updateItem($index, 'productName', v)"
            />
          </ElFormItem>
        </template>
      </ElTableColumn>

      <ElTableColumn label="品牌" min-width="120">
        <template #default="{ row, $index }">
          <ElFormItem :prop="`orderItems.${$index}.brandName`" :rules="[{ required: true, message: '必填', trigger: 'blur' }]">
            <ElInput
              :model-value="row.brandName"
              :disabled="props.disabled"
              placeholder="品牌名稱"
              maxlength="100"
              @update:model-value="(v: string) => updateItem($index, 'brandName', v)"
            />
          </ElFormItem>
        </template>
      </ElTableColumn>

      <ElTableColumn label="磐石編碼" min-width="120">
        <template #default="{ row, $index }">
          <ElFormItem :prop="`orderItems.${$index}.panshiCode`" :rules="[{ required: true, message: '必填', trigger: 'blur' }]">
            <ElInput
              :model-value="row.panshiCode"
              :disabled="props.disabled"
              placeholder="磐石編碼"
              maxlength="50"
              @update:model-value="(v: string) => updateItem($index, 'panshiCode', v)"
            />
          </ElFormItem>
        </template>
      </ElTableColumn>

      <ElTableColumn label="序號 ID" min-width="120">
        <template #default="{ row, $index }">
          <ElFormItem :prop="`orderItems.${$index}.serialId`" :rules="[{ required: true, message: '必填', trigger: 'blur' }]">
            <ElInput
              :model-value="row.serialId"
              :disabled="props.disabled"
              placeholder="序號 ID"
              maxlength="100"
              @update:model-value="(v: string) => updateItem($index, 'serialId', v)"
            />
          </ElFormItem>
        </template>
      </ElTableColumn>

      <ElTableColumn label="商品款式" min-width="120">
        <template #default="{ row, $index }">
          <ElFormItem :prop="`orderItems.${$index}.productStyle`" :rules="[{ required: true, message: '必填', trigger: 'blur' }]">
            <ElInput
              :model-value="row.productStyle"
              :disabled="props.disabled"
              placeholder="商品款式"
              maxlength="100"
              @update:model-value="(v: string) => updateItem($index, 'productStyle', v)"
            />
          </ElFormItem>
        </template>
      </ElTableColumn>

      <ElTableColumn label="配件" min-width="100">
        <template #default="{ row, $index }">
          <ElInput
            :model-value="row.accessories"
            :disabled="props.disabled"
            placeholder="選填"
            maxlength="200"
            @update:model-value="(v: string) => updateItem($index, 'accessories', v)"
          />
        </template>
      </ElTableColumn>

      <ElTableColumn label="商品來源" min-width="110">
        <template #default="{ row, $index }">
          <ElFormItem :prop="`orderItems.${$index}.productSource`" :rules="[{ required: true, message: '必選', trigger: 'change' }]">
            <ElSelect
              :model-value="row.productSource"
              :disabled="props.disabled"
              placeholder="選擇"
              @update:model-value="(v: ProductSource) => updateItem($index, 'productSource', v)"
            >
              <ElOption
                v-for="(label, key) in PRODUCT_SOURCE_LABELS"
                :key="key"
                :label="label"
                :value="key"
              />
            </ElSelect>
          </ElFormItem>
        </template>
      </ElTableColumn>

      <ElTableColumn label="單價" min-width="120">
        <template #default="{ row, $index }">
          <ElFormItem :prop="`orderItems.${$index}.unitPrice`" :rules="[{ required: true, message: '必填', trigger: 'blur' }, { type: 'number', min: 0.01, message: '> 0', trigger: 'blur' }]">
            <ElInputNumber
              :model-value="row.unitPrice"
              :disabled="props.disabled"
              :min="0"
              :precision="0"
              :controls="false"
              placeholder="單價"
              style="width: 100%"
              @update:model-value="(v: number | undefined) => updateItem($index, 'unitPrice', v ?? 0)"
            />
          </ElFormItem>
        </template>
      </ElTableColumn>

      <ElTableColumn label="數量" min-width="90">
        <template #default="{ row, $index }">
          <ElFormItem :prop="`orderItems.${$index}.quantity`" :rules="[{ required: true, message: '必填', trigger: 'blur' }, { type: 'number', min: 1, message: '≥ 1', trigger: 'blur' }]">
            <ElInputNumber
              :model-value="row.quantity"
              :disabled="props.disabled"
              :min="1"
              :precision="0"
              :controls="false"
              placeholder="數量"
              style="width: 100%"
              @update:model-value="(v: number | undefined) => updateItem($index, 'quantity', v ?? 1)"
            />
          </ElFormItem>
        </template>
      </ElTableColumn>

      <ElTableColumn label="小計" min-width="100" align="right">
        <template #default="{ row }">
          <span class="item-subtotal">{{ formatCurrency(getItemSubtotal(row)) }}</span>
        </template>
      </ElTableColumn>

      <ElTableColumn v-if="!props.disabled" label="操作" width="60" align="center" fixed="right">
        <template #default="{ $index }">
          <ElButton
            type="danger"
            :icon="Delete"
            size="small"
            link
            @click="removeItem($index)"
          />
        </template>
      </ElTableColumn>
    </ElTable>

    <div class="items-footer">
      <span class="subtotal-label">商品小計：</span>
      <span class="subtotal-amount">{{ formatCurrency(subtotal) }}</span>
    </div>
  </div>
</template>

<style scoped lang="scss">
.order-items-form {
  margin-bottom: 16px;
}

.items-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.items-title {
  font-weight: 600;
  font-size: 14px;
}

.items-table {
  :deep(.el-form-item) {
    margin-bottom: 0;
  }
}

.items-footer {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  margin-top: 12px;
  padding: 8px 16px;
  background-color: var(--el-fill-color-light);
  border-radius: 4px;
}

.subtotal-label {
  font-weight: 600;
  margin-right: 8px;
}

.subtotal-amount {
  font-weight: 700;
  font-size: 16px;
  color: var(--el-color-primary);
}

.item-subtotal {
  font-weight: 500;
}
</style>

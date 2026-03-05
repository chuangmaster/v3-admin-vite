<script setup lang="ts">
/**
 * 訂單項目表單元件
 *
 * @module order-management/components/OrderItemsForm
 * @description 使用卡片式佈局提供動態新增/刪除訂單項目功能,含欄位驗證與小計計算
 */
import type { OrderItemFormData } from "@/pages/order-management/types"
import { Delete, Plus } from "@element-plus/icons-vue"
import {
  ElAutocomplete,
  ElButton,
  ElCol,
  ElFormItem,
  ElInput,
  ElInputNumber,
  ElOption,
  ElRow,
  ElSelect
} from "element-plus"
import { computed } from "vue"
import { ACCESSORY_OPTIONS, OrderType, PRODUCT_SOURCE_LABELS, ProductSource } from "@/pages/order-management/types"

defineOptions({ name: "OrderItemsForm" })

const props = withDefaults(defineProps<Props>(), {
  disabled: false,
  readonly: false
})

const emit = defineEmits<Emits>()

interface Props {
  /** 訂單項目列表 */
  modelValue: OrderItemFormData[]
  /** 訂單類型（預購時磐石編碼與 Serial ID 為非必填） */
  orderType?: OrderType
  /** 是否禁用所有欄位（終結狀態） */
  disabled?: boolean
  /** 是否禁止新增/刪除項目（編輯模式） */
  readonly?: boolean
}

interface Emits {
  (e: "update:modelValue", value: OrderItemFormData[]): void
}

/** 品牌清單 */
const BRAND_OPTIONS = [
  "Hermès (愛馬仕)",
  "Chanel (香奈兒)",
  "Louis Vuitton (LV)",
  "Celine",
  "Dior (迪奧)",
  "Goyard",
  "Loewe",
  "Balenciaga (巴黎世家)",
  "Bottega Veneta (BV)",
  "Burberry",
  "Fendi",
  "Miu Miu",
  "Chloé",
  "Valentino",
  "Saint Laurent (YSL)",
  "Gucci",
  "Prada",
  "Rolex (勞力士)",
  "Cartier (卡地亞)",
  "Chrome Hearts",
  "Jacquemus",
  "Ami Paris",
  "Thom Browne",
  "Maison Margiela",
  "Van Cleef & Arpels (VCA)",
  "Loro Piana",
  "Golden Goose",
  "Autry",
  "Givenchy",
  "Rimowa",
  "Longchamp",
  "Vivienne Westwood",
  "Polène"
]

/**
 * 品牌自動完成查詢
 */
function queryBrandSearch(queryString: string, cb: (results: Array<{ value: string }>) => void) {
  const results = queryString
    ? BRAND_OPTIONS.filter(brand =>
        brand.toLowerCase().includes(queryString.toLowerCase())
      ).map(brand => ({ value: brand }))
    : BRAND_OPTIONS.map(brand => ({ value: brand }))
  cb(results)
}

/** 是否為預購訂單（預購時磐石編碼與 Serial ID 為非必填） */
const isPreOrder = computed(() => props.orderType === OrderType.PRE_ORDER)

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
    accessories: [],
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
      <span class="items-title"><span class="required-asterisk">*</span>商品項目</span>
      <ElButton
        v-if="!props.readonly"
        type="primary"
        :icon="Plus"
        size="small"
        :disabled="props.disabled"
        @click="addItem"
      >
        新增項目
      </ElButton>
    </div>

    <!-- 空狀態提示 -->
    <div v-if="props.modelValue.length === 0" class="items-empty">
      請新增至少一個商品項目
    </div>

    <!-- 卡片式訂單項目列表 -->
    <div
      v-for="(item, index) in props.modelValue"
      :key="item.tempId || index"
      class="item-card"
    >
      <div class="item-card-header">
        <span class="item-card-index">項目 {{ index + 1 }}</span>
        <div class="item-card-right">
          <span class="item-card-subtotal">小計：{{ formatCurrency(getItemSubtotal(item)) }}</span>
          <ElButton
            v-if="!props.disabled && !props.readonly"
            type="danger"
            :icon="Delete"
            size="small"
            link
            @click="removeItem(index)"
          />
        </div>
      </div>

      <ElRow :gutter="12">
        <!-- 品牌 -->
        <ElCol :xs="24" :sm="12" :md="8">
          <ElFormItem
            label="品牌"
            :prop="`orderItems.${index}.brandName`"
            :rules="[{ required: true, message: '請輸入品牌', trigger: 'blur' }]"
          >
            <ElAutocomplete
              :model-value="item.brandName"
              :fetch-suggestions="queryBrandSearch"
              :disabled="props.disabled"
              placeholder="請輸入或選擇品牌名稱"
              maxlength="100"
              clearable
              :trigger-on-focus="true"
              style="width: 100%;"
              @update:model-value="(v: string | number) => updateItem(index, 'brandName', String(v))"
            />
          </ElFormItem>
        </ElCol>

        <!-- 商品名稱 -->
        <ElCol :xs="24" :sm="12" :md="8">
          <ElFormItem
            label="商品名稱"
            :prop="`orderItems.${index}.productName`"
            :rules="[{ required: true, message: '請輸入商品名稱', trigger: 'blur' }]"
          >
            <ElInput
              :model-value="item.productName"
              :disabled="props.disabled"
              placeholder="商品名稱"
              maxlength="200"
              @update:model-value="(v: string) => updateItem(index, 'productName', v)"
            />
          </ElFormItem>
        </ElCol>

        <!-- 磐石編碼 -->
        <ElCol :xs="24" :sm="12" :md="8">
          <ElFormItem
            :key="`panshiCode-${index}-${isPreOrder}`"
            label="磐石編碼"
            :prop="`orderItems.${index}.panshiCode`"
            :rules="[{ required: !isPreOrder, message: '請輸入磐石編碼', trigger: 'blur' }]"
          >
            <ElInput
              :model-value="item.panshiCode"
              :disabled="props.disabled"
              placeholder="磐石編碼"
              maxlength="50"
              @update:model-value="(v: string) => updateItem(index, 'panshiCode', v)"
            />
          </ElFormItem>
        </ElCol>

        <!-- Serial ID -->
        <ElCol :xs="24" :sm="12" :md="8">
          <ElFormItem
            :key="`serialId-${index}-${isPreOrder}`"
            label="Serial ID"
            :prop="`orderItems.${index}.serialId`"
            :rules="[{ required: !isPreOrder, message: '請輸入Serial ID', trigger: 'blur' }]"
          >
            <ElInput
              :model-value="item.serialId"
              :disabled="props.disabled"
              placeholder="Serial ID"
              maxlength="100"
              @update:model-value="(v: string) => updateItem(index, 'serialId', v)"
            />
          </ElFormItem>
        </ElCol>

        <!-- 商品款式 -->
        <ElCol :xs="24" :sm="12" :md="8">
          <ElFormItem
            label="商品款式"
            :prop="`orderItems.${index}.productStyle`"
            :rules="[{ required: true, message: '請輸入商品款式', trigger: 'blur' }]"
          >
            <ElInput
              :model-value="item.productStyle"
              :disabled="props.disabled"
              placeholder="商品款式"
              maxlength="100"
              @update:model-value="(v: string) => updateItem(index, 'productStyle', v)"
            />
          </ElFormItem>
        </ElCol>

        <!-- 配件 -->
        <ElCol :xs="24" :sm="12" :md="8">
          <ElFormItem label="配件">
            <ElSelect
              :model-value="item.accessories"
              :disabled="props.disabled"
              multiple
              collapse-tags
              collapse-tags-tooltip
              placeholder="請選擇配件"
              style="width: 100%;"
              @update:model-value="(v: string[]) => updateItem(index, 'accessories', v)"
            >
              <ElOption
                v-for="option in ACCESSORY_OPTIONS"
                :key="option.value"
                :label="option.label"
                :value="option.value"
              />
            </ElSelect>
          </ElFormItem>
        </ElCol>

        <!-- 商品來源 -->
        <ElCol :xs="24" :sm="12" :md="8">
          <ElFormItem
            label="商品來源"
            :prop="`orderItems.${index}.productSource`"
            :rules="[{ required: true, message: '請選擇商品來源', trigger: 'change' }]"
          >
            <ElSelect
              :model-value="item.productSource"
              :disabled="props.disabled"
              placeholder="選擇"
              @update:model-value="(v: ProductSource) => updateItem(index, 'productSource', v)"
            >
              <ElOption
                v-for="(label, key) in PRODUCT_SOURCE_LABELS"
                :key="key"
                :label="label"
                :value="key"
              />
            </ElSelect>
          </ElFormItem>
        </ElCol>

        <!-- 單價 -->
        <ElCol :xs="12" :sm="12" :md="8">
          <ElFormItem
            label="單價"
            :prop="`orderItems.${index}.unitPrice`"
            :rules="[{ required: true, message: '請輸入單價', trigger: 'blur' }, { type: 'number', min: 0.01, message: '單價須大於 0', trigger: 'blur' }]"
          >
            <ElInputNumber
              :model-value="item.unitPrice"
              :disabled="props.disabled"
              :min="0"
              :precision="0"
              :controls="false"
              placeholder="單價"
              style="width: 100%"
              @update:model-value="(v: number | undefined) => updateItem(index, 'unitPrice', v ?? 0)"
            />
          </ElFormItem>
        </ElCol>

        <!-- 數量 -->
        <ElCol :xs="12" :sm="12" :md="8">
          <ElFormItem
            label="數量"
            :prop="`orderItems.${index}.quantity`"
            :rules="[{ required: true, message: '請輸入數量', trigger: 'blur' }, { type: 'number', min: 1, message: '數量至少為 1', trigger: 'blur' }]"
          >
            <ElInputNumber
              :model-value="item.quantity"
              :disabled="props.disabled"
              :min="1"
              :precision="0"
              :controls="false"
              placeholder="數量"
              style="width: 100%"
              @update:model-value="(v: number | undefined) => updateItem(index, 'quantity', v ?? 1)"
            />
          </ElFormItem>
        </ElCol>
      </ElRow>
    </div>

    <div class="items-footer">
      <span class="subtotal-label">商品小計：</span>
      <span class="subtotal-amount">{{ formatCurrency(subtotal) }}</span>
    </div>
  </div>
</template>

<style scoped lang="scss">
.order-items-form {
  width: 100%;
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

.required-asterisk {
  color: var(--el-color-danger);
  margin-right: 4px;
}

.items-empty {
  padding: 24px;
  text-align: center;
  color: var(--el-text-color-secondary);
  font-size: 14px;
  background-color: var(--el-fill-color-lighter);
  border: 1px dashed var(--el-border-color);
  border-radius: 4px;
}

.item-card {
  padding: 16px;
  margin-bottom: 12px;
  border: 1px solid var(--el-border-color-light);
  border-radius: 6px;
  background-color: var(--el-fill-color-blank);

  &:hover {
    border-color: var(--el-color-primary-light-5);
  }

  :deep(.el-form-item) {
    margin-bottom: 22px;
  }

  :deep(.el-form-item__label) {
    font-size: 13px;
  }
}

.item-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.item-card-index {
  font-weight: 600;
  font-size: 14px;
  color: var(--el-text-color-primary);
}

.item-card-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.item-card-subtotal {
  font-weight: 600;
  font-size: 14px;
  color: var(--el-color-primary);
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
</style>

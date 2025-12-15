<script setup lang="ts">
/**
 * 商品項目表單元件
 * 用於新增或編輯服務訂單中的商品項目
 */
import type { FormInstance, FormRules } from "element-plus"
import type { ProductItem } from "../types"
import { ACCESSORY_OPTIONS, DEFECT_OPTIONS, ProductCategory, ServiceOrderType } from "../types"

interface Props {
  /** 商品項目資料（編輯模式） */
  modelValue?: ProductItem
  /** 服務單類型（決定顯示哪些欄位） */
  orderType?: ServiceOrderType
}

const props = withDefaults(defineProps<Props>(), {
  orderType: ServiceOrderType.BUYBACK
})

const emit = defineEmits<{
  /** 提交 */
  submit: [item: Partial<ProductItem>]
  /** 取消 */
  cancel: []
}>()

const formRef = ref<FormInstance>()

/** 數量 */
const quantity = ref(1)

/** 是否為寄賣單 */
const isConsignment = computed(() => props.orderType === ServiceOrderType.CONSIGNMENT)

/** 表單資料 */
const formData = reactive<{
  // 收購單欄位
  category: ProductCategory
  name: string
  weight: number | undefined
  purity: string
  unitPrice: number | undefined
  description: string
  // 寄賣單欄位
  brandName: string
  style: string
  internalCode: string
  accessories: (string | number)[]
  defects: (string | number)[]
}>({
  // 收購單欄位
  category: ProductCategory.GOLD_JEWELRY,
  name: "",
  weight: undefined,
  purity: "",
  unitPrice: undefined,
  description: "",
  // 寄賣單欄位
  brandName: "",
  style: "",
  internalCode: "",
  accessories: [],
  defects: []
})

/** 商品類別選項 */
const categoryOptions = [
  { label: "黃金首飾", value: ProductCategory.GOLD_JEWELRY },
  { label: "鉑金首飾", value: ProductCategory.PLATINUM_JEWELRY },
  { label: "K金首飾", value: ProductCategory.K_GOLD_JEWELRY },
  { label: "鑽石", value: ProductCategory.DIAMOND },
  { label: "寶石", value: ProductCategory.GEMSTONE },
  { label: "名錶", value: ProductCategory.LUXURY_WATCH },
  { label: "名牌包", value: ProductCategory.LUXURY_BAG },
  { label: "其他精品", value: ProductCategory.OTHER }
]

/** 表單驗證規則 */
const rules: FormRules = {
  // 收購單欄位驗證
  category: [{ required: true, message: "請選擇商品類別", trigger: "change" }],
  name: [
    { required: true, message: "請輸入商品名稱", trigger: "blur" },
    { min: 1, max: 100, message: "商品名稱長度為 1-100 字元", trigger: "blur" }
  ],
  // 寄賣單欄位驗證
  brandName: [
    { required: true, message: "請輸入品牌名稱", trigger: "blur" },
    { min: 1, max: 100, message: "品牌名稱長度為 1-100 字元", trigger: "blur" }
  ],
  style: [
    { required: true, message: "請輸入款式", trigger: "blur" },
    { min: 1, max: 100, message: "款式長度為 1-100 字元", trigger: "blur" }
  ],
  internalCode: [{ max: 50, message: "內碼長度不超過 50 字元", trigger: "blur" }]
}

/** 總價計算 */
const totalPrice = computed(() => {
  const price = formData.unitPrice || 0
  const qty = quantity.value || 1
  return Math.round(price * qty)
})

/** 是否為金屬類別（需要輸入重量和純度） */
const isMetalCategory = computed(() => {
  return [
    ProductCategory.GOLD_JEWELRY,
    ProductCategory.PLATINUM_JEWELRY,
    ProductCategory.K_GOLD_JEWELRY
  ].includes(formData.category)
})

/**
 * 提交表單
 */
async function handleSubmit() {
  if (!formRef.value) return

  await formRef.value.validate((valid) => {
    if (!valid) return

    const item: Partial<ProductItem> = isConsignment.value
      ? {
          // 寄賣單欄位
          brandName: formData.brandName,
          style: formData.style,
          internalCode: formData.internalCode || undefined,
          accessories: formData.accessories.length > 0 ? formData.accessories.map(String) : undefined,
          defects: formData.defects.length > 0 ? formData.defects.map(String) : undefined
        }
      : {
          // 收購單欄位
          category: formData.category,
          name: formData.name,
          weight: formData.weight,
          purity: formData.purity,
          unitPrice: formData.unitPrice,
          quantity: quantity.value,
          totalPrice: totalPrice.value,
          description: formData.description
        }

    emit("submit", item)
  })
}

/**
 * 取消
 */
function handleCancel() {
  emit("cancel")
}

/**
 * 重置表單
 */
function resetForm() {
  formRef.value?.resetFields()
}

// 監聽編輯資料變化
watch(
  () => props.modelValue,
  (value) => {
    if (value) {
      Object.assign(formData, value)
      if (value.quantity) {
        quantity.value = value.quantity
      }
    }
  },
  { immediate: true }
)

defineExpose({
  resetForm
})
</script>

<template>
  <el-form ref="formRef" :model="formData" :rules="rules" label-width="100px">
    <!-- 收購單欄位 -->
    <div v-if="!isConsignment">
      <el-form-item label="商品類別" prop="category">
        <el-select v-model="formData.category" placeholder="請選擇商品類別">
          <el-option
            v-for="option in categoryOptions"
            :key="option.value"
            :label="option.label"
            :value="option.value"
          />
        </el-select>
      </el-form-item>

      <el-form-item label="商品名稱" prop="name">
        <el-input v-model="formData.name" placeholder="請輸入商品名稱" maxlength="100" show-word-limit />
      </el-form-item>

      <el-form-item v-if="isMetalCategory" label="重量 (g)" prop="weight">
        <el-input-number
          v-model="formData.weight"
          :min="0.01"
          :precision="2"
          :step="0.1"
          placeholder="請輸入重量"
          controls-position="right"
        />
      </el-form-item>

      <el-form-item v-if="isMetalCategory" label="純度" prop="purity">
        <el-input v-model="formData.purity" placeholder="例如：999、750、24K" maxlength="20" />
      </el-form-item>

      <el-form-item label="單價 (元)" prop="unitPrice">
        <el-input-number
          v-model="formData.unitPrice"
          :min="0"
          :precision="0"
          :step="100"
          placeholder="請輸入單價"
          controls-position="right"
        />
      </el-form-item>

      <el-form-item label="數量" prop="quantity">
        <el-input-number
          :model-value="quantity"
          :min="1"
          :precision="0"
          :step="1"
          placeholder="請輸入數量"
          controls-position="right"
          @update:model-value="(val) => (quantity = val ?? 1)"
        />
      </el-form-item>

      <el-form-item label="總價">
        <el-tag type="success" size="large">
          NT$ {{ totalPrice.toLocaleString() }}
        </el-tag>
      </el-form-item>

      <el-form-item label="備註說明" prop="description">
        <el-input
          v-model="formData.description"
          type="textarea"
          :rows="3"
          placeholder="請輸入備註說明"
          maxlength="500"
          show-word-limit
        />
      </el-form-item>
    </div>

    <!-- 寄賣單欄位 -->
    <div v-else>
      <el-form-item label="品牌名稱" prop="brandName">
        <el-input v-model="formData.brandName" placeholder="請輸入品牌名稱" maxlength="100" show-word-limit />
      </el-form-item>

      <el-form-item label="款式" prop="style">
        <el-input v-model="formData.style" placeholder="請輸入款式" maxlength="100" show-word-limit />
      </el-form-item>

      <el-form-item label="內碼" prop="internalCode">
        <el-input v-model="formData.internalCode" placeholder="請輸入內碼（選填）" maxlength="50" show-word-limit />
      </el-form-item>

      <el-form-item label="配件" prop="accessories">
        <el-checkbox-group v-model="formData.accessories">
          <el-checkbox v-for="option in ACCESSORY_OPTIONS" :key="option.value" :value="option.value">
            {{ option.label }}
          </el-checkbox>
        </el-checkbox-group>
      </el-form-item>

      <el-form-item label="瑕疵處" prop="defects">
        <el-checkbox-group v-model="formData.defects">
          <el-checkbox v-for="option in DEFECT_OPTIONS" :key="option.value" :value="option.value">
            {{ option.label }}
          </el-checkbox>
        </el-checkbox-group>
      </el-form-item>
    </div>

    <el-form-item>
      <el-button @click="handleCancel">
        取消
      </el-button>
      <el-button type="primary" @click="handleSubmit">
        確定
      </el-button>
    </el-form-item>
  </el-form>
</template>

<style scoped lang="scss">
:deep(.el-input-number) {
  width: 100%;
}
</style>

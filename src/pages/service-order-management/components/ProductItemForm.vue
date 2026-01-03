<script setup lang="ts">
/**
 * 商品項目表單元件
 * 用於新增或編輯服務訂單中的商品項目
 */
import type { FormInstance, FormRules } from "element-plus"
import type { ProductItem } from "../types"
import { ACCESSORY_OPTIONS, DEFECT_OPTIONS, GRADE_OPTIONS, ServiceOrderType } from "../types"

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

/** 是否為寄賣單 */
const isConsignment = computed(() => props.orderType === ServiceOrderType.CONSIGNMENT)

/** 表單資料 */
const formData = reactive<{
  brandName: string
  style: string
  internalCode: string
  grade: string
  accessories: (string | number)[]
  defects: (string | number)[]
  amount: number | undefined
}>({
  brandName: "",
  style: "",
  internalCode: "",
  grade: "",
  accessories: [],
  defects: [],
  amount: undefined
})

/** 表單驗證規則 */
const rules: FormRules = {
  brandName: [
    { required: true, message: "請輸入品牌名稱", trigger: "blur" },
    { min: 1, max: 100, message: "品牌名稱長度為 1-100 字元", trigger: "blur" }
  ],
  style: [
    { required: true, message: "請輸入款式", trigger: "blur" },
    { min: 1, max: 100, message: "款式長度為 1-100 字元", trigger: "blur" }
  ],
  internalCode: [{ max: 50, message: "內碼長度不超過 50 字元", trigger: "blur" }],
  grade: [
    { required: true, message: "請選擇商品等級", trigger: "change" }
  ],
  amount: [
    { required: true, message: "請輸入金額", trigger: "blur" },
    { type: "number", min: 1, message: "金額必須大於等於 1", trigger: "blur" },
    { type: "number", max: 10000000, message: "金額不能大於 10,000,000", trigger: "blur" }
  ]
}

/**
 * 提交表單
 */
async function handleSubmit() {
  if (!formRef.value) return

  await formRef.value.validate((valid) => {
    if (!valid) return

    const item: Partial<ProductItem> = {
      brandName: formData.brandName,
      style: formData.style,
      internalCode: formData.internalCode || undefined,
      grade: formData.grade || undefined,
      amount: formData.amount,
      // 配件欄位收購單和寄賣單都有
      accessories: formData.accessories.length > 0 ? formData.accessories.map(String) : undefined,
      // 瑡疵欄位只有寄賣單才有
      ...(isConsignment.value && {
        defects: formData.defects.length > 0 ? formData.defects.map(String) : undefined
      })
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
      formData.brandName = value.brandName || ""
      formData.style = value.style || ""
      formData.internalCode = value.internalCode || ""
      formData.grade = value.grade || ""
      formData.accessories = (value.accessories as (string | number)[]) || []
      formData.defects = (value.defects as (string | number)[]) || []
      formData.amount = value.amount || 0
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
    <!-- 共用欄位：品牌名稱、款式、內碼 -->
    <el-form-item label="品牌名稱" prop="brandName">
      <el-input v-model="formData.brandName" placeholder="請輸入品牌名稱" maxlength="100" show-word-limit />
    </el-form-item>

    <el-form-item label="款式" prop="style">
      <el-input v-model="formData.style" placeholder="請輸入款式" maxlength="100" show-word-limit />
    </el-form-item>

    <el-form-item label="內碼" prop="internalCode">
      <el-input v-model="formData.internalCode" placeholder="請輸入內碼（選填）" maxlength="50" show-word-limit />
    </el-form-item>

    <el-form-item label="商品等級" prop="grade">
      <el-select v-model="formData.grade" placeholder="請選擇商品等級">
        <el-option
          v-for="option in GRADE_OPTIONS"
          :key="option.value"
          :label="option.label"
          :value="option.value"
        />
      </el-select>
    </el-form-item>

    <!-- 金額欄位：根據訂單類型顯示不同標籤 -->
    <el-form-item :label="isConsignment ? '實拿金額' : '收購金額'" prop="amount">
      <el-input-number
        v-model="formData.amount"
        :min="0"
        :max="10000000"
        :precision="0"
        :step="1000"
        :controls="false"
        :placeholder="isConsignment ? '請輸入實拿金額' : '請輸入收購金額'"
        style="width: 100%;"
      />
    </el-form-item>

    <!-- 配件欄位：收購單和寄賣單都有 -->
    <el-form-item label="配件" prop="accessories">
      <el-checkbox-group v-model="formData.accessories">
        <el-checkbox v-for="option in ACCESSORY_OPTIONS" :key="option.value" :value="option.value">
          {{ option.label }}
        </el-checkbox>
      </el-checkbox-group>
    </el-form-item>

    <!-- 寄賣單額外欄位：瑕疵處 -->
    <template v-if="isConsignment">
      <el-form-item label="瑕疵處" prop="defects">
        <el-checkbox-group v-model="formData.defects">
          <el-checkbox v-for="option in DEFECT_OPTIONS" :key="option.value" :value="option.value">
            {{ option.label }}
          </el-checkbox>
        </el-checkbox-group>
      </el-form-item>
    </template>

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

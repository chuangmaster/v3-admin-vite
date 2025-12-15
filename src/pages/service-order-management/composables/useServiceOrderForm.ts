/**
 * 服務訂單表單業務邏輯
 */
import type { CreateServiceOrderRequest, Customer, ProductItem } from "../types"
import { createServiceOrder } from "../apis/service-order"
import { RenewalOption, ServiceOrderType } from "../types"

export function useServiceOrderForm() {
  const router = useRouter()
  const loading = ref(false)

  /** 選中的客戶 */
  const selectedCustomer = ref<Customer>()

  /** 商品項目列表 */
  const productItems = ref<ProductItem[]>([])

  /** 簽名圖片 DataURL */
  const signatureDataUrl = ref<string>("")

  /** 表單資料 */
  const formData = reactive<Partial<CreateServiceOrderRequest>>({
    orderType: ServiceOrderType.BUYBACK,
    customerId: "",
    productItems: [],
    totalAmount: 0,
    renewalOption: RenewalOption.NONE,
    renewalMonths: 1,
    interestRate: 0,
    notes: ""
  })

  /** 總金額計算 */
  const totalAmount = computed(() => {
    return productItems.value.reduce((sum, item) => sum + (item.totalPrice || 0), 0)
  })

  /**
   * 設定客戶
   */
  function setCustomer(customer: Customer) {
    selectedCustomer.value = customer
    formData.customerId = customer.id
  }

  /**
   * 新增商品項目
   */
  function addProductItem(item: Partial<ProductItem>) {
    const newItem: ProductItem = {
      id: `temp-${Date.now()}`,
      category: item.category!,
      name: item.name!,
      weight: item.weight,
      purity: item.purity,
      unitPrice: item.unitPrice,
      quantity: item.quantity || 1,
      totalPrice: item.totalPrice || 0,
      description: item.description
    }
    productItems.value.push(newItem)
  }

  /**
   * 編輯商品項目
   */
  function updateProductItem(index: number, item: Partial<ProductItem>) {
    if (productItems.value[index]) {
      Object.assign(productItems.value[index], item)
    }
  }

  /**
   * 刪除商品項目
   */
  function removeProductItem(index: number) {
    productItems.value.splice(index, 1)
  }

  /**
   * 設定簽名
   */
  function setSignature(dataUrl: string) {
    signatureDataUrl.value = dataUrl
  }

  /**
   * 驗證表單
   */
  function validateForm(): { valid: boolean, message?: string } {
    if (!formData.customerId) {
      return { valid: false, message: "請選擇或新增客戶" }
    }

    if (productItems.value.length === 0) {
      return { valid: false, message: "請至少新增一項商品" }
    }

    if (!signatureDataUrl.value) {
      return { valid: false, message: "請完成簽名" }
    }

    return { valid: true }
  }

  /**
   * 提交表單
   */
  async function submitForm() {
    // 驗證表單
    const validation = validateForm()
    if (!validation.valid) {
      ElMessage.warning(validation.message)
      return
    }

    loading.value = true
    try {
      // 準備請求資料
      const requestData: CreateServiceOrderRequest = {
        ...formData as CreateServiceOrderRequest,
        productItems: productItems.value.map(item => ({
          category: item.category,
          name: item.name,
          weight: item.weight,
          purity: item.purity,
          unitPrice: item.unitPrice,
          quantity: item.quantity,
          totalPrice: item.totalPrice,
          description: item.description
        })),
        totalAmount: totalAmount.value
      }

      const response = await createServiceOrder(requestData)

      if (response.success && response.data) {
        ElMessage.success("建立服務訂單成功")

        // 導向訂單詳情頁
        router.push({
          name: "ServiceOrderDetail",
          params: { id: response.data.id }
        })
      } else {
        ElMessage.error(response.message || "建立服務訂單失敗")
      }
    } catch {
      ElMessage.error("建立服務訂單失敗，請稍後再試")
    } finally {
      loading.value = false
    }
  }

  /**
   * 重置表單
   */
  function resetForm() {
    selectedCustomer.value = undefined
    productItems.value = []
    signatureDataUrl.value = ""
    Object.assign(formData, {
      orderType: ServiceOrderType.BUYBACK,
      customerId: "",
      productItems: [],
      totalAmount: 0,
      renewalOption: RenewalOption.NONE,
      renewalMonths: 1,
      interestRate: 0,
      notes: ""
    })
  }

  return {
    loading,
    selectedCustomer,
    productItems,
    signatureDataUrl,
    formData,
    totalAmount,
    setCustomer,
    addProductItem,
    updateProductItem,
    removeProductItem,
    setSignature,
    validateForm,
    submitForm,
    resetForm
  }
}

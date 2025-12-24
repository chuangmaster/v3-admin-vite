/**
 * 服務訂單表單業務邏輯
 */
import type { CreateServiceOrderRequest, Customer, GenerateContractPreviewRequest, ProductItem } from "../types"
import { createServiceOrder } from "../apis/service-order"
import { RenewalOption, ServiceOrderSource, ServiceOrderType } from "../types"

export function useServiceOrderForm() {
  const router = useRouter()
  const loading = ref(false)

  /** 選中的客戶 */
  const selectedCustomer = ref<Customer>()

  /** 商品項目列表 */
  const productItems = ref<ProductItem[]>([])

  /** 簽名圖片 DataURL */
  const signatureDataUrl = ref<string>("")

  /** 身分證正面是否已上傳 */
  const idCardFrontUploaded = ref(false)

  /** 身分證反面是否已上傳 */
  const idCardBackUploaded = ref(false)

  /** 是否已生成合約預覽 */
  const contractPreviewGenerated = ref(false)

  /** 表單資料 */
  const formData = reactive<Partial<CreateServiceOrderRequest>>({
    orderType: ServiceOrderType.BUYBACK,
    orderSource: ServiceOrderSource.OFFLINE,
    customerId: "",
    productItems: [],
    totalAmount: 0,
    renewalOption: RenewalOption.NONE,
    renewalMonths: 1,
    interestRate: 0,
    notes: ""
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
      brandName: item.brandName!,
      style: item.style!,
      internalCode: item.internalCode,
      accessories: item.accessories,
      defects: item.defects,
      amount: item.amount
    }
    productItems.value.push(newItem)
    // 自動加總
    updateTotalAmount()
  }

  /**
   * 編輯商品項目
   */
  function updateProductItem(index: number, item: Partial<ProductItem>) {
    if (productItems.value[index]) {
      Object.assign(productItems.value[index], item)
      // 自動加總
      updateTotalAmount()
    }
  }

  /**
   * 刪除商品項目
   */
  function removeProductItem(index: number) {
    productItems.value.splice(index, 1)
    // 自動加總
    updateTotalAmount()
  }

  /**
   * 自動計算並更新總金額
   */
  function updateTotalAmount() {
    const total = productItems.value.reduce((sum, item) => {
      return sum + (item.amount || 0)
    }, 0)
    formData.totalAmount = total
  }

  /**
   * 設定簽名
   */
  function setSignature(dataUrl: string) {
    signatureDataUrl.value = dataUrl
  }

  /**
   * 設定身分證明文件上傳狀態
   */
  function setIdCardUploaded(status: { front: boolean, back: boolean }) {
    idCardFrontUploaded.value = status.front
    idCardBackUploaded.value = status.back
  }

  /**
   * 設定合約預覽已生成狀態
   */
  function setContractPreviewGenerated(value: boolean) {
    contractPreviewGenerated.value = value
  }

  /**
   * 準備生成合約預覽的資料
   */
  function prepareContractPreviewData(): GenerateContractPreviewRequest | null {
    if (!selectedCustomer.value) {
      return null
    }

    return {
      orderType: formData.orderType!,
      customer: {
        name: selectedCustomer.value.name,
        phoneNumber: selectedCustomer.value.phoneNumber,
        email: selectedCustomer.value.email,
        idCardNumber: selectedCustomer.value.idCardNumber
      },
      productItems: productItems.value.map(item => ({
        brandName: item.brandName!,
        style: item.style!,
        internalCode: item.internalCode,
        accessories: item.accessories,
        defects: item.defects,
        amount: item.amount
      })),
      totalAmount: formData.totalAmount!,
      consignmentStartDate: formData.consignmentStartDate,
      consignmentEndDate: formData.consignmentEndDate
    }
  }

  /**
   * 驗證表單（不包括簽名和合約預覽）
   */
  function validateFormBasic(): { valid: boolean, message?: string } {
    if (!formData.customerId) {
      return { valid: false, message: "請選擇或新增客戶" }
    }

    if (productItems.value.length === 0) {
      return { valid: false, message: "請至少新增一項商品" }
    }

    // 線下流程需要正反面都上傳
    if (formData.orderSource === ServiceOrderSource.OFFLINE) {
      if (!idCardFrontUploaded.value) {
        return { valid: false, message: "請上傳身分證正面影本" }
      }
      if (!idCardBackUploaded.value) {
        return { valid: false, message: "請上傳身分證反面影本" }
      }
    } else {
      // 線上流程只需要正面
      if (!idCardFrontUploaded.value) {
        return { valid: false, message: "身分證明文件為必要附件，請上傳或拍攝身分證照片" }
      }
    }

    return { valid: true }
  }

  /**
   * 驗證表單（完整驗證，包括簽名）
   */
  function validateForm(): { valid: boolean, message?: string } {
    const basicValidation = validateFormBasic()
    if (!basicValidation.valid) {
      return basicValidation
    }

    // 線下流程需要先生成合約預覽
    if (formData.orderSource === ServiceOrderSource.OFFLINE && !contractPreviewGenerated.value) {
      return { valid: false, message: "請先生成合約預覽供客戶確認" }
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
          brandName: item.brandName,
          style: item.style,
          internalCode: item.internalCode,
          accessories: item.accessories,
          defects: item.defects,
          amount: item.amount
        }))
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
    idCardFrontUploaded.value = false
    idCardBackUploaded.value = false
    contractPreviewGenerated.value = false
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
    idCardFrontUploaded,
    idCardBackUploaded,
    contractPreviewGenerated,
    formData,
    setCustomer,
    addProductItem,
    updateProductItem,
    removeProductItem,
    setSignature,
    setIdCardUploaded,
    setContractPreviewGenerated,
    prepareContractPreviewData,
    validateFormBasic,
    validateForm,
    submitForm,
    resetForm
  }
}

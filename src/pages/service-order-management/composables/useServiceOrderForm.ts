/**
 * 服務訂單表單業務邏輯
 */
import type {
  CreateBuybackOrderRequest,
  CreateConsignmentOrderRequest,
  Customer,
  ProductItem
} from "../types"
import { toUTC0ISOString } from "@@/utils/datetime"
import { ElMessage } from "element-plus"
import { createBuybackOrder, createConsignmentOrder } from "../apis/service-order"
import { RenewalOption, ServiceOrderSource, ServiceOrderType } from "../types"
import "element-plus/es/components/message/style/css"

export function useServiceOrderForm() {
  const router = useRouter()
  const loading = ref(false)

  /** 選中的客戶 */
  const selectedCustomer = ref<Customer>()

  /** 商品項目列表 */
  const productItems = ref<ProductItem[]>([])

  /** 簽名圖片 DataURL */
  const signatureDataUrl = ref<string>("")

  /** 身分證正面圖片資訊 */
  const idCardFrontImage = ref<{
    base64: string
    contentType: string
    fileName: string
  }>()

  /** 身分證反面圖片資訊 */
  const idCardBackImage = ref<{
    base64: string
    contentType: string
    fileName: string
  }>()

  /** 身分證正面是否已上傳 */
  const idCardFrontUploaded = ref(false)

  /** 身分證反面是否已上傳 */
  const idCardBackUploaded = ref(false)

  /** 表單資料 */
  const formData = reactive({
    orderType: ServiceOrderType.BUYBACK as string,
    orderSource: ServiceOrderSource.OFFLINE as string,
    customerId: "",
    productItems: [] as ProductItem[],
    totalAmount: 0,
    renewalOption: RenewalOption.NONE as string,
    consignmentStartDate: undefined as string | undefined,
    consignmentEndDate: undefined as string | undefined,
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
      grade: item.grade,
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
   * 設定身分證正面圖片
   */
  function setIdCardFrontImage(base64: string, contentType: string, fileName: string) {
    idCardFrontImage.value = { base64, contentType, fileName }
    idCardFrontUploaded.value = true
  }

  /**
   * 設定身分證反面圖片
   */
  function setIdCardBackImage(base64: string, contentType: string, fileName: string) {
    idCardBackImage.value = { base64, contentType, fileName }
    idCardBackUploaded.value = true
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

    // 身分證明文件驗證（僅收購單需要）
    if (formData.orderType === ServiceOrderType.BUYBACK) {
      if (!idCardFrontUploaded.value) {
        return { valid: false, message: "收購單需要上傳身分證正面影本" }
      }

      // 線下流程需要反面
      if (formData.orderSource === ServiceOrderSource.OFFLINE && !idCardBackUploaded.value) {
        return { valid: false, message: "收購單的線下流程需要上傳身分證反面影本" }
      }
    }

    // 寄賣單日期驗證
    if (formData.orderType === ServiceOrderType.CONSIGNMENT) {
      if (!formData.consignmentStartDate) {
        return { valid: false, message: "請選擇寄賣起始日期" }
      }

      if (!formData.consignmentEndDate) {
        return { valid: false, message: "請選擇寄賣結束日期" }
      }

      if (!formData.renewalOption || formData.renewalOption === RenewalOption.NONE) {
        return { valid: false, message: "請選擇到期處理方式" }
      }

      const startDate = new Date(formData.consignmentStartDate)
      const endDate = new Date(formData.consignmentEndDate)

      // 驗證結束日期必須晚於起始日期
      if (endDate <= startDate) {
        return { valid: false, message: "寄賣結束日期必須晚於起始日期" }
      }

      // 計算日期差異（天數）
      const diffTime = endDate.getTime() - startDate.getTime()
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

      // 驗證期間必須介於 30 天至 180 天之間
      if (diffDays < 30) {
        return { valid: false, message: "寄賣期間至少需要 30 天" }
      }

      if (diffDays > 180) {
        return { valid: false, message: "寄賣期間最多不能超過 180 天" }
      }
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
      let response

      if (formData.orderType === ServiceOrderType.BUYBACK) {
        // 建立收購單
        const requestData: CreateBuybackOrderRequest = {
          orderType: formData.orderType!,
          orderSource: formData.orderSource!,
          customerId: formData.customerId!,
          productItems: productItems.value.map((item, index) => ({
            sequenceNumber: index + 1,
            brandName: item.brandName!,
            styleName: item.style,
            internalCode: item.internalCode,
            grade: item.grade,
            amount: item.amount,
            accessories: item.accessories
          })),
          totalAmount: formData.totalAmount!,
          // 身分證圖片（如果有上傳）
          ...(idCardFrontImage.value && {
            idCardFrontImageBase64: idCardFrontImage.value.base64,
            idCardFrontImageContentType: idCardFrontImage.value.contentType,
            idCardFrontImageFileName: idCardFrontImage.value.fileName
          }),
          ...(idCardBackImage.value && {
            idCardBackImageBase64: idCardBackImage.value.base64,
            idCardBackImageContentType: idCardBackImage.value.contentType,
            idCardBackImageFileName: idCardBackImage.value.fileName
          })
        }
        response = await createBuybackOrder(requestData)
      } else {
        // 建立寄賣單
        const requestData: CreateConsignmentOrderRequest = {
          orderType: formData.orderType!,
          orderSource: formData.orderSource!,
          customerId: formData.customerId!,
          productItems: productItems.value.map((item, index) => ({
            sequenceNumber: index + 1,
            brandName: item.brandName!,
            styleName: item.style,
            internalCode: item.internalCode,
            grade: item.grade,
            amount: item.amount,
            accessories: item.accessories,
            defects: item.defects
          })),
          totalAmount: formData.totalAmount!,
          // 將日期字串轉換為 UTC+0 的 ISO String 格式
          consignmentStartDate: formData.consignmentStartDate
            ? toUTC0ISOString(formData.consignmentStartDate, false)
            : undefined,
          consignmentEndDate: formData.consignmentEndDate
            ? toUTC0ISOString(formData.consignmentEndDate, true)
            : undefined,
          renewalOption: formData.renewalOption,
          remarks: formData.notes
        }
        response = await createConsignmentOrder(requestData)
      }

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
    idCardFrontImage.value = undefined
    idCardBackImage.value = undefined
    idCardFrontUploaded.value = false
    idCardBackUploaded.value = false
    Object.assign(formData, {
      orderType: ServiceOrderType.BUYBACK,
      orderSource: ServiceOrderSource.OFFLINE,
      customerId: "",
      productItems: [],
      totalAmount: 0,
      renewalOption: RenewalOption.NONE,
      consignmentStartDate: undefined,
      consignmentEndDate: undefined,
      notes: ""
    })
  }

  return {
    loading,
    selectedCustomer,
    productItems,
    signatureDataUrl,
    idCardFrontImage,
    idCardBackImage,
    idCardFrontUploaded,
    idCardBackUploaded,
    formData,
    setCustomer,
    addProductItem,
    updateProductItem,
    removeProductItem,
    setSignature,
    setIdCardUploaded,
    setIdCardFrontImage,
    setIdCardBackImage,
    validateForm,
    submitForm,
    resetForm
  }
}

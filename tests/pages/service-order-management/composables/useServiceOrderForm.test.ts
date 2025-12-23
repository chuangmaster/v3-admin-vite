/**
 * useServiceOrderForm 組合式函式單元測試
 */

import type { Customer } from "@/pages/service-order-management/types"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { ServiceOrderType } from "@/pages/service-order-management/types"

// Mock API 函式
const mockCreateServiceOrder = vi.fn()

vi.mock("@/pages/service-order-management/apis/service-order", () => ({
  createServiceOrder: mockCreateServiceOrder
}))

describe("useServiceOrderForm", () => {
  beforeEach(() => {
    vi.resetModules()
    vi.clearAllMocks()
  })

  it("should initialize with default form data", async () => {
    const { useServiceOrderForm } = await import("@/pages/service-order-management/composables/useServiceOrderForm")
    const { formData } = useServiceOrderForm()

    expect(formData.orderType).toBe(ServiceOrderType.BUYBACK)
    expect(formData.productItems).toHaveLength(0)
    expect(formData.totalAmount).toBe(0)
  })

  it("should set customer correctly", async () => {
    const { useServiceOrderForm } = await import("@/pages/service-order-management/composables/useServiceOrderForm")
    const { selectedCustomer, setCustomer } = useServiceOrderForm()

    const mockCustomer: Customer = {
      id: "customer-123",
      name: "王小明",
      phoneNumber: "0912345678",
      email: "wang@example.com",
      idCardNumber: "A123456789",
      createdAt: "2025-12-14T10:00:00Z",
      updatedAt: undefined
    }

    setCustomer(mockCustomer)

    expect(selectedCustomer.value).toEqual(mockCustomer)
  })

  it("should add product item correctly", async () => {
    const { useServiceOrderForm } = await import("@/pages/service-order-management/composables/useServiceOrderForm")
    const { productItems, addProductItem } = useServiceOrderForm()

    const mockProduct = {
      brandName: "CHANEL",
      style: "金項鍊",
      internalCode: "TEST001",
      accessories: ["DUST_BAG", "CERTIFICATE"],
      defects: []
    }

    addProductItem(mockProduct)

    expect(productItems.value).toHaveLength(1)
    expect(productItems.value[0].style).toEqual(mockProduct.style)
  })

  it("should update product item correctly", async () => {
    const { useServiceOrderForm } = await import("@/pages/service-order-management/composables/useServiceOrderForm")
    const { productItems, addProductItem, updateProductItem } = useServiceOrderForm()

    const mockProduct = {
      brandName: "CHANEL",
      style: "金項鍊",
      internalCode: "TEST001",
      accessories: ["DUST_BAG"],
      defects: []
    }

    addProductItem(mockProduct)

    const updatedProduct = {
      style: "金項鍊（已更新）",
      internalCode: "TEST001-UPDATED"
    }

    updateProductItem(0, updatedProduct)

    expect(productItems.value[0].style).toBe("金項鍊（已更新）")
    expect(productItems.value[0].internalCode).toBe("TEST001-UPDATED")
  })

  it("should remove product item correctly", async () => {
    const { useServiceOrderForm } = await import("@/pages/service-order-management/composables/useServiceOrderForm")
    const { productItems, addProductItem, removeProductItem } = useServiceOrderForm()

    addProductItem({ brandName: "CHANEL", style: "金項鍊", internalCode: "TEST001", accessories: [], defects: [] })
    addProductItem({ brandName: "TIFFANY", style: "白金戒指", internalCode: "TEST002", accessories: [], defects: [] })

    expect(productItems.value).toHaveLength(2)

    removeProductItem(0)

    expect(productItems.value).toHaveLength(1)
    expect(productItems.value[0].style).toBe("白金戒指")
  })

  it("should allow manual total amount input", async () => {
    const { useServiceOrderForm } = await import("@/pages/service-order-management/composables/useServiceOrderForm")
    const { formData } = useServiceOrderForm()

    // 手動設定總金額
    formData.totalAmount = 15000

    expect(formData.totalAmount).toBe(15000)
  })

  it("should set signature correctly", async () => {
    const { useServiceOrderForm } = await import("@/pages/service-order-management/composables/useServiceOrderForm")
    const { signatureDataUrl, setSignature } = useServiceOrderForm()

    const signatureDataUrlValue = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUA"

    setSignature(signatureDataUrlValue)

    expect(signatureDataUrl.value).toBe(signatureDataUrlValue)
  })

  it("should submit form successfully", async () => {
    // Mock router
    const mockPush = vi.fn()
    vi.stubGlobal("useRouter", () => ({
      push: mockPush
    }))

    // Mock ElMessage
    vi.stubGlobal("ElMessage", {
      success: vi.fn(),
      error: vi.fn()
    })

    mockCreateServiceOrder.mockResolvedValue({
      success: true,
      code: "SUCCESS",
      message: "建立成功",
      data: {
        id: "new-order-id",
        orderNumber: "BS20251214001"
      }
    })

    const { useServiceOrderForm } = await import("@/pages/service-order-management/composables/useServiceOrderForm")
    const { setCustomer, addProductItem, setSignature, setIdCardUploaded, submitForm } = useServiceOrderForm()

    // 設定客戶
    setCustomer({
      id: "customer-123",
      name: "王小明",
      phoneNumber: "0912345678",
      idCardNumber: "A123456789"
    } as any)

    // 新增商品
    const { ProductCategory } = await import("@/pages/service-order-management/types")
    addProductItem({
      category: ProductCategory.GOLD_JEWELRY,
      name: "金項鍊",
      quantity: 1,
      totalPrice: 6000
    })

    // 設定身分證明文件已上傳（必填）
    setIdCardUploaded(true)

    // 設定簽名（必填）
    setSignature("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUA")

    await submitForm()

    expect(mockCreateServiceOrder).toHaveBeenCalled()
  })
})

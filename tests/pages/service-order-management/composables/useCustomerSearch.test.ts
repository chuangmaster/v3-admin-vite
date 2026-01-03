import type { Customer } from "@/pages/service-order-management/types"
/**
 * useCustomerSearch 組合式函式測試
 */
import { flushPromises } from "@vue/test-utils"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import * as customerApi from "@/pages/service-order-management/apis/customer"
import { useCustomerSearch } from "@/pages/service-order-management/composables/useCustomerSearch"

// Mock API
vi.mock("@/pages/service-order-management/apis/customer")

describe("useCustomerSearch", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it("應該在輸入關鍵字後搜尋客戶", async () => {
    // Arrange
    const mockCustomers: Customer[] = [
      {
        id: "1",
        name: "王小明",
        phoneNumber: "0912345678",
        email: "wang@example.com",
        idCardNumber: "A123456789",
        residentialAddress: "台北市大安區",
        createdAt: "2025-01-01T00:00:00Z"
      }
    ]

    vi.mocked(customerApi.searchCustomers).mockResolvedValue({
      success: true,
      code: "SUCCESS",
      message: "查詢成功",
      data: mockCustomers,
      timestamp: "2025-01-01T00:00:00Z",
      traceId: "test-trace-id"
    })

    // Act
    const { keyword, customers, loading } = useCustomerSearch()
    keyword.value = "王小明"

    // Wait for debounce (500ms) + API call
    await new Promise(resolve => setTimeout(resolve, 600))
    await flushPromises()

    // Assert
    expect(loading.value).toBe(false)
    expect(customers.value).toEqual(mockCustomers)
    expect(customerApi.searchCustomers).toHaveBeenCalledWith({ keyword: "王小明" })
  })

  it("應該在關鍵字少於 2 字元時清空結果", async () => {
    // Arrange
    const { keyword, customers } = useCustomerSearch()

    // Act
    keyword.value = "王"

    // Wait for debounce
    await new Promise(resolve => setTimeout(resolve, 600))
    await flushPromises()

    // Assert
    expect(customers.value).toEqual([])
    expect(customerApi.searchCustomers).not.toHaveBeenCalled()
  })

  it("應該在搜尋失敗時顯示錯誤訊息", async () => {
    // Arrange
    vi.mocked(customerApi.searchCustomers).mockResolvedValue({
      success: false,
      code: "ERROR",
      message: "搜尋失敗",
      data: null,
      timestamp: "2025-01-01T00:00:00Z",
      traceId: "test-trace-id"
    })

    // Act
    const { keyword, customers } = useCustomerSearch()
    keyword.value = "測試"

    // Wait for debounce + API call
    await new Promise(resolve => setTimeout(resolve, 600))
    await flushPromises()

    // Assert
    expect(customers.value).toEqual([])
  })

  it("應該清除搜尋結果", async () => {
    // Arrange
    const { keyword, customers, clearResults } = useCustomerSearch()
    keyword.value = "測試"
    customers.value = [
      {
        id: "1",
        name: "測試客戶",
        phoneNumber: "0912345678",
        email: "test@example.com",
        idCardNumber: "A123456789",
        residentialAddress: "台北市大安區",
        createdAt: "2025-01-01T00:00:00Z"
      }
    ]

    // Act
    clearResults()

    // Assert
    expect(keyword.value).toBe("")
    expect(customers.value).toEqual([])
  })
})

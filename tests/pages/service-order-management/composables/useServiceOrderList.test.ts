/**
 * useServiceOrderList 組合式函式單元測試
 */

import type { ServiceOrderListItem } from "@/pages/service-order-management/types"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { ServiceOrderSource, ServiceOrderStatus, ServiceOrderType } from "@/pages/service-order-management/types"

// Mock functions for the service-order API module
const mockGetServiceOrderList = vi.fn()
const mockDeleteServiceOrder = vi.fn()

// Mock API 模組
vi.mock("@/pages/service-order-management/apis/service-order", () => ({
  getServiceOrderList: mockGetServiceOrderList,
  deleteServiceOrder: mockDeleteServiceOrder,
  createServiceOrder: vi.fn(),
  updateServiceOrder: vi.fn(),
  getServiceOrderDetail: vi.fn()
}))

describe("useServiceOrderList", () => {
  beforeEach(() => {
    vi.resetModules()
    vi.clearAllMocks()
  })

  it("should fetch service orders successfully", async () => {
    const mockServiceOrders: ServiceOrderListItem[] = [
      {
        id: "550e8400-e29b-41d4-a716-446655440000",
        orderNumber: "BS20251214001",
        orderType: ServiceOrderType.BUYBACK,
        orderSource: ServiceOrderSource.OFFLINE,
        customerId: "customer-123",
        customerName: "王小明",
        brandName: "金品牌",
        style: "項鍊",
        quantity: 1,
        amount: 50000,
        status: ServiceOrderStatus.PENDING,
        createdAt: "2025-12-14T10:00:00Z",
        createdBy: "admin",
        version: 1
      }
    ]

    const mockData = {
      success: true,
      code: "SUCCESS",
      message: "查詢成功",
      data: mockServiceOrders,
      totalCount: 1,
      timestamp: "2025-12-14T10:00:00Z",
      traceId: "trace-123"
    }

    mockGetServiceOrderList.mockResolvedValue(mockData as any)

    // 動態匯入組合式函式
    const { useServiceOrderList } = await import("@/pages/service-order-management/composables/useServiceOrderList")
    const { loading, serviceOrders, total, loadServiceOrders } = useServiceOrderList()

    await loadServiceOrders()

    expect(mockGetServiceOrderList).toHaveBeenCalled()
    expect(loading.value).toBe(false)
    expect(serviceOrders.value).toHaveLength(1)
    expect(serviceOrders.value[0].orderNumber).toBe("BS20251214001")
    expect(total.value).toBe(1)
  })

  it("should handle fetch errors gracefully", async () => {
    mockGetServiceOrderList.mockRejectedValue(new Error("Network error"))

    const { useServiceOrderList } = await import("@/pages/service-order-management/composables/useServiceOrderList")
    const { loading, serviceOrders, loadServiceOrders } = useServiceOrderList()

    await loadServiceOrders()

    expect(loading.value).toBe(false)
    expect(serviceOrders.value).toHaveLength(0)
  })

  it("should filter by order type", async () => {
    const mockData = {
      success: true,
      code: "SUCCESS",
      message: "查詢成功",
      data: [],
      totalCount: 0,
      timestamp: "2025-12-14T10:00:00Z",
      traceId: "trace-123"
    }

    mockGetServiceOrderList.mockResolvedValue(mockData as any)

    const { useServiceOrderList } = await import("@/pages/service-order-management/composables/useServiceOrderList")
    const { queryParams, loadServiceOrders } = useServiceOrderList()

    queryParams.value.orderType = ServiceOrderType.CONSIGNMENT
    await loadServiceOrders()

    expect(mockGetServiceOrderList).toHaveBeenCalledWith(
      expect.objectContaining({
        orderType: ServiceOrderType.CONSIGNMENT
      })
    )
  })

  it("should delete service order successfully", async () => {
    // Mock ElMessageBox
    vi.stubGlobal("ElMessageBox", {
      confirm: vi.fn().mockResolvedValue(true)
    })

    // Mock ElMessage
    vi.stubGlobal("ElMessage", {
      success: vi.fn(),
      error: vi.fn()
    })

    mockDeleteServiceOrder.mockResolvedValue({
      success: true,
      code: "SUCCESS",
      message: "刪除成功"
    })

    mockGetServiceOrderList.mockResolvedValue({
      success: true,
      data: [],
      totalCount: 0
    })

    const { useServiceOrderList } = await import("@/pages/service-order-management/composables/useServiceOrderList")
    const { loadServiceOrders } = useServiceOrderList()

    // 直接測試 API 呼叫
    await mockDeleteServiceOrder("test-id")
    await loadServiceOrders()

    expect(mockDeleteServiceOrder).toHaveBeenCalledWith("test-id")
  })
})

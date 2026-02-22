import type { CreateCustomerRequest, UpdateCustomerRequest } from "@/pages/customer-management/types"
/**
 * 客戶管理 API 單元測試
 */
import { beforeEach, describe, expect, it, vi } from "vitest"
import { customerApi } from "@/pages/customer-management/apis/customer"

// Mock axios request
vi.mock("@/http/axios", () => ({
  request: vi.fn()
}))

describe("customerApi", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe("search", () => {
    it("應該能夠搜尋客戶列表", async () => {
      const mockResponse = {
        success: true,
        data: [
          {
            id: "1",
            name: "王小明",
            idNumber: "A123456789",
            phoneNumber: "0912345678",
            email: "test@example.com",
            residentialAddress: "台北市信義區",
            lineId: "test_line",
            createdAt: "2026-01-28T00:00:00Z",
            updatedAt: "2026-01-28T00:00:00Z",
            version: 1
          }
        ],
        totalCount: 1,
        message: null,
        traceId: null,
        code: 200
      }

      const { request } = await import("@/http/axios")
      vi.mocked(request).mockResolvedValue(mockResponse)

      const result = await customerApi.search({
        pageNumber: 1,
        pageSize: 10
      })

      expect(result.success).toBe(true)
      expect(result.data).toHaveLength(1)
      expect(result.data![0].name).toBe("王小明")
    })
  })

  describe("create", () => {
    it("應該能夠新增客戶", async () => {
      const mockRequest: CreateCustomerRequest = {
        name: "王小明",
        idNumber: "A123456789",
        phoneNumber: "0912345678",
        email: "test@example.com",
        residentialAddress: "台北市信義區",
        lineId: "test_line",
        requestSource: "customer-management"
      }

      const mockResponse = {
        success: true,
        data: "1",
        message: "新增成功",
        totalCount: 0,
        traceId: null,
        code: 200
      }

      const { request } = await import("@/http/axios")
      vi.mocked(request).mockResolvedValue(mockResponse)

      const result = await customerApi.create(mockRequest)

      expect(result.success).toBe(true)
      expect(result.data).toBe("1")
    })
  })

  describe("update", () => {
    it("應該能夠更新客戶", async () => {
      const mockRequest: UpdateCustomerRequest = {
        name: "王小明",
        phoneNumber: "0987654321",
        email: "new@example.com",
        residentialAddress: "新北市板橋區",
        lineId: "new_line",
        version: 1
      }

      const mockResponse = {
        success: true,
        data: null,
        message: "更新成功",
        totalCount: 0,
        traceId: null,
        code: 200
      }

      const { request } = await import("@/http/axios")
      vi.mocked(request).mockResolvedValue(mockResponse)

      const result = await customerApi.update("1", mockRequest)

      expect(result.success).toBe(true)
    })

    it("應該處理版本衝突 (409)", async () => {
      const mockRequest: UpdateCustomerRequest = {
        name: "王小明",
        phoneNumber: "0987654321",
        email: "new@example.com",
        residentialAddress: "新北市板橋區",
        version: 1
      }

      const mockResponse = {
        success: false,
        data: null,
        message: "資料版本衝突",
        totalCount: 0,
        traceId: "trace-123",
        code: 409
      }

      const { request } = await import("@/http/axios")
      vi.mocked(request).mockResolvedValue(mockResponse)

      const result = await customerApi.update("1", mockRequest)

      expect(result.success).toBe(false)
      expect(result.code).toBe(409)
    })
  })

  describe("delete", () => {
    it("應該能夠刪除客戶", async () => {
      const mockResponse = {
        success: true,
        data: null,
        message: "刪除成功",
        totalCount: 0,
        traceId: null,
        code: 200
      }

      const { request } = await import("@/http/axios")
      vi.mocked(request).mockResolvedValue(mockResponse)

      const result = await customerApi.delete("1")

      expect(result.success).toBe(true)
    })
  })
})

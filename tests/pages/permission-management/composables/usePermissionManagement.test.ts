/**
 * usePermissionManagement 組合式函式單元測試
 */

import type { Permission } from "@/pages/permission-management/types"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { createMockPermission } from "../test-utils"

// Mock ElMessageBox 和 ElMessage
vi.stubGlobal("ElMessageBox", {
  confirm: vi.fn().mockResolvedValue(true)
})

vi.stubGlobal("ElMessage", {
  error: vi.fn(),
  success: vi.fn(),
  warning: vi.fn()
})

// Mock API 模組
const mockGetPermissions = vi.fn()
const mockDeletePermission = vi.fn()
const mockGetPermissionUsage = vi.fn()

vi.mock("@/pages/permission-management/apis/permission", () => ({
  getPermissions: mockGetPermissions,
  getPermission: vi.fn(),
  createPermission: vi.fn(),
  updatePermission: vi.fn(),
  deletePermission: mockDeletePermission,
  getPermissionUsage: mockGetPermissionUsage
}))

describe("usePermissionManagement", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("should fetch permissions successfully", async () => {
    const { usePermissionManagement } = await import(
      "@/pages/permission-management/composables/usePermissionManagement"
    )

    const mockPermissions: Permission[] = [
      {
        id: "1",
        name: "新增權限",
        code: "permission:create",
        description: "允許建立新的權限",
        isSystem: false,
        version: 1,
        createdAt: "2025-11-19T10:00:00Z",
        updatedAt: "2025-11-19T10:00:00Z"
      }
    ]

    const mockResponse = {
      success: true,
      code: "SUCCESS",
      message: "OK",
      data: {
        items: mockPermissions,
        pageNumber: 1,
        pageSize: 20,
        totalCount: 1,
        totalPages: 1,
        hasPreviousPage: false,
        hasNextPage: false
      },
      timestamp: new Date().toISOString(),
      traceId: "trace-123"
    }

    mockGetPermissions.mockResolvedValue(mockResponse)

    const { permissions, loading, fetchPermissions } = usePermissionManagement()

    expect(loading.value).toBe(false)

    await fetchPermissions()

    expect(loading.value).toBe(false)
    expect(permissions.value).toEqual(mockPermissions)
    expect(mockGetPermissions).toHaveBeenCalled()
  })

  it("should handle search keyword", async () => {
    const { usePermissionManagement } = await import(
      "@/pages/permission-management/composables/usePermissionManagement"
    )

    const mockResponse = {
      success: true,
      code: "SUCCESS",
      message: "OK",
      data: {
        items: [],
        pageNumber: 1,
        pageSize: 20,
        totalCount: 0,
        totalPages: 0,
        hasPreviousPage: false,
        hasNextPage: false
      },
      timestamp: new Date().toISOString(),
      traceId: "trace-123"
    }

    mockGetPermissions.mockResolvedValue(mockResponse)

    const { searchKeyword, fetchPermissions } = usePermissionManagement()

    searchKeyword.value = "test"
    await fetchPermissions()

    expect(mockGetPermissions).toHaveBeenCalledWith(
      expect.objectContaining({
        keyword: "test"
      })
    )
  })

  it("should handle pagination", async () => {
    const { usePermissionManagement } = await import(
      "@/pages/permission-management/composables/usePermissionManagement"
    )

    const mockResponse = {
      success: true,
      code: "SUCCESS",
      message: "OK",
      data: {
        items: [],
        pageNumber: 2,
        pageSize: 20,
        totalCount: 40,
        totalPages: 2,
        hasPreviousPage: true,
        hasNextPage: false
      },
      timestamp: new Date().toISOString(),
      traceId: "trace-123"
    }

    mockGetPermissions.mockResolvedValue(mockResponse)

    const { pagination, fetchPermissions } = usePermissionManagement()

    pagination.value.pageNumber = 2
    await fetchPermissions()

    expect(pagination.value.total).toBe(40)
  })

  it("should delete permission successfully", async () => {
    const { usePermissionManagement } = await import(
      "@/pages/permission-management/composables/usePermissionManagement"
    )

    const mockDeleteResponse = {
      success: true,
      code: "SUCCESS",
      message: "刪除成功",
      data: null,
      timestamp: new Date().toISOString(),
      traceId: "trace-123"
    }

    mockDeletePermission.mockResolvedValue(mockDeleteResponse)

    // Mock initial fetch
    mockGetPermissions.mockResolvedValue({
      success: true,
      code: "SUCCESS",
      message: "OK",
      data: {
        items: [],
        pageNumber: 1,
        pageSize: 20,
        totalCount: 0,
        totalPages: 0,
        hasPreviousPage: false,
        hasNextPage: false
      },
      timestamp: new Date().toISOString(),
      traceId: "trace-123"
    })

    const { handleDelete } = usePermissionManagement()
    const mockPermission = createMockPermission()

    await handleDelete(mockPermission)

    expect(mockDeletePermission).toHaveBeenCalledWith(mockPermission.id)
  })

  it("should handle permission in use error", async () => {
    const { usePermissionManagement } = await import(
      "@/pages/permission-management/composables/usePermissionManagement"
    )

    const mockDeleteResponse = {
      success: false,
      code: "PERMISSION_IN_USE",
      message: "該權限已被 3 個角色使用，無法刪除",
      data: {
        roleCount: 3,
        roles: [
          { id: "role-1", name: "admin" },
          { id: "role-2", name: "editor" },
          { id: "role-3", name: "viewer" }
        ]
      },
      timestamp: new Date().toISOString(),
      traceId: "trace-123"
    }

    mockDeletePermission.mockResolvedValue(mockDeleteResponse)

    const { handleDelete } = usePermissionManagement()
    const mockPermission = createMockPermission()

    await handleDelete(mockPermission)

    expect(mockDeletePermission).toHaveBeenCalledWith(mockPermission.id)
  })
})

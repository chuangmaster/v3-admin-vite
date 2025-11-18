/**
 * useUserManagement 組合式函式單元測試
 */

import type { User, UserListResponse } from "@/pages/user-management/types"
import { beforeEach, describe, expect, it, vi } from "vitest"

// Mock ElMessageBox first, at module level
vi.stubGlobal("ElMessageBox", {
  confirm: vi.fn().mockResolvedValue(true)
})

// Mock functions for the account API module
const mockGetUserList = vi.fn()
const mockDeleteUser = vi.fn()

// Mock API 模組（工廠函式），確保動態匯入時會取得下列 mock 實作
vi.mock("@/pages/user-management/apis/account", () => ({
  getUserList: mockGetUserList,
  deleteUser: mockDeleteUser,
  createUser: vi.fn(),
  updateUser: vi.fn(),
  changePassword: vi.fn()
}))

describe("useUserManagement", () => {
  beforeEach(() => {
    vi.resetModules()
    vi.clearAllMocks()
  })

  it("should fetch users successfully", async () => {
    const mockUsers: User[] = [
      {
        id: "1",
        username: "testuser",
        displayName: "Test User",
        status: "active",
        createdAt: "2025-11-16T00:00:00Z",
        updatedAt: null,
        version: 1
      }
    ]

    const mockData = {
      success: true,
      code: "SUCCESS",
      message: "查詢成功",
      data: {
        items: mockUsers,
        totalCount: 1,
        pageNumber: 1,
        pageSize: 20,
        totalPages: 1
      } as UserListResponse,
      timestamp: "2025-11-16T00:00:00Z",
      traceId: "trace-123"
    }

    mockGetUserList.mockResolvedValue(mockData as any)

    const { useUserManagement } = await import("@/pages/user-management/composables/useUserManagement")
    const { users, pagination, fetchUsers } = useUserManagement()
    await fetchUsers()

    expect(users.value).toHaveLength(1)
    expect(users.value[0].username).toBe("testuser")
    expect(pagination.value.total).toBe(1)
  })

  it("should handle search keyword", async () => {
    const mockData = {
      success: true,
      code: "SUCCESS",
      message: "查詢成功",
      data: {
        items: [],
        totalCount: 0,
        pageNumber: 1,
        pageSize: 20,
        totalPages: 0
      } as UserListResponse,
      timestamp: "2025-11-16T00:00:00Z",
      traceId: "trace-123"
    }

    mockGetUserList.mockResolvedValue(mockData as any)

    const { useUserManagement } = await import("@/pages/user-management/composables/useUserManagement")
    const { searchKeyword, fetchUsers, resetSearch } = useUserManagement()

    searchKeyword.value = "test"
    await fetchUsers()

    expect(mockGetUserList).toHaveBeenCalled()

    resetSearch()
    expect(searchKeyword.value).toBe("")
  })

  it("should handle pagination", async () => {
    const mockData = {
      success: true,
      code: "SUCCESS",
      message: "查詢成功",
      data: {
        items: [],
        totalCount: 100,
        pageNumber: 2,
        pageSize: 20,
        totalPages: 5
      } as UserListResponse,
      timestamp: "2025-11-16T00:00:00Z",
      traceId: "trace-123"
    }

    mockGetUserList.mockResolvedValue(mockData as any)

    const { useUserManagement } = await import("@/pages/user-management/composables/useUserManagement")
    const { pagination, fetchUsers } = useUserManagement()
    pagination.value.pageNumber = 2
    await fetchUsers()

    expect(pagination.value.total).toBe(100)
  })

  it("should handle delete user with CANNOT_DELETE_SELF error", async () => {
    mockDeleteUser.mockResolvedValue({
      success: false,
      code: "CANNOT_DELETE_SELF",
      message: "無法刪除自己的帳號",
      data: null,
      timestamp: "2025-11-16T00:00:00Z",
      traceId: "trace-123"
    } as any)

    mockGetUserList.mockResolvedValue({
      success: true,
      code: "SUCCESS",
      message: "查詢成功",
      data: {
        items: [],
        totalCount: 0,
        pageNumber: 1,
        pageSize: 20,
        totalPages: 0
      },
      timestamp: "2025-11-16T00:00:00Z",
      traceId: "trace-123"
    } as any)

    const mockUser: User = {
      id: "1",
      username: "testuser",
      displayName: "Test User",
      status: "active",
      createdAt: "2025-11-16T00:00:00Z",
      updatedAt: null,
      version: 1
    }

    const { useUserManagement } = await import("@/pages/user-management/composables/useUserManagement")
    const { handleDelete } = useUserManagement()

    await handleDelete(mockUser)

    expect(mockDeleteUser).toHaveBeenCalledWith("1")
  })

  it("should handle delete user with LAST_ACCOUNT_CANNOT_DELETE error", async () => {
    mockDeleteUser.mockResolvedValue({
      success: false,
      code: "LAST_ACCOUNT_CANNOT_DELETE",
      message: "無法刪除最後一個有效帳號",
      data: null,
      timestamp: "2025-11-16T00:00:00Z",
      traceId: "trace-123"
    } as any)

    mockGetUserList.mockResolvedValue({
      success: true,
      code: "SUCCESS",
      message: "查詢成功",
      data: {
        items: [],
        totalCount: 0,
        pageNumber: 1,
        pageSize: 20,
        totalPages: 0
      },
      timestamp: "2025-11-16T00:00:00Z",
      traceId: "trace-123"
    } as any)

    const mockUser: User = {
      id: "1",
      username: "testuser",
      displayName: "Test User",
      status: "active",
      createdAt: "2025-11-16T00:00:00Z",
      updatedAt: null,
      version: 1
    }

    const { useUserManagement } = await import("@/pages/user-management/composables/useUserManagement")
    const { handleDelete } = useUserManagement()

    await handleDelete(mockUser)

    expect(mockDeleteUser).toHaveBeenCalledWith("1")
  })
})

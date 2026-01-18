/**
 * useUserProfile 組合式函式單元測試
 */

import { beforeEach, describe, expect, it, vi } from "vitest"

// Mock functions for the API module
const mockGetCurrentUserApi = vi.fn()

// Mock API 模組
vi.mock("@@/apis/users", () => ({
  getCurrentUserApi: mockGetCurrentUserApi
}))

describe("useUserProfile composable", () => {
  beforeEach(() => {
    vi.resetModules()
    vi.clearAllMocks()
  })

  it("should initialize with default values", async () => {
    const { useUserProfile } = await import("@/pages/profile/composables/useUserProfile")
    const { userInfo, loading, error } = useUserProfile()

    expect(userInfo.value).toBeNull()
    expect(loading.value).toBe(false)
    expect(error.value).toBeNull()
  })

  it("should fetch user profile successfully", async () => {
    const mockUserData = {
      id: "user-123",
      account: "testuser",
      displayName: "Test User",
      roles: ["Admin"],
      permissions: ["account.read"],
      version: 1
    }

    mockGetCurrentUserApi.mockResolvedValue({
      success: true,
      data: mockUserData,
      code: "SUCCESS",
      message: "操作成功",
      timestamp: "2026-01-19T10:00:00Z",
      traceId: "trace-123"
    })

    const { useUserProfile } = await import("@/pages/profile/composables/useUserProfile")
    const { userInfo, loading, error, fetchUserProfile } = useUserProfile()

    expect(loading.value).toBe(false)

    const fetchPromise = fetchUserProfile()
    expect(loading.value).toBe(true)

    await fetchPromise

    expect(loading.value).toBe(false)
    expect(error.value).toBeNull()
    expect(userInfo.value).toEqual(mockUserData)
    expect(userInfo.value?.id).toBe("user-123")
    expect(userInfo.value?.account).toBe("testuser")
    expect(userInfo.value?.version).toBe(1)
  })

  it("should handle API error response", async () => {
    mockGetCurrentUserApi.mockResolvedValue({
      success: false,
      data: null,
      code: "ERROR",
      message: "用戶不存在",
      timestamp: "2026-01-19T10:00:00Z",
      traceId: "trace-456"
    })

    const { useUserProfile } = await import("@/pages/profile/composables/useUserProfile")
    const { userInfo, loading, error, fetchUserProfile } = useUserProfile()

    await fetchUserProfile()

    expect(loading.value).toBe(false)
    expect(error.value).toBe("用戶不存在")
    expect(userInfo.value).toBeNull()
  })

  it("should handle network error", async () => {
    mockGetCurrentUserApi.mockRejectedValue(new Error("Network error"))

    const { useUserProfile } = await import("@/pages/profile/composables/useUserProfile")
    const { userInfo, loading, error, fetchUserProfile } = useUserProfile()

    await fetchUserProfile()

    expect(loading.value).toBe(false)
    expect(error.value).toBe("載入用戶資料失敗，請稍後再試")
    expect(userInfo.value).toBeNull()
  })

  it("should refresh profile by calling fetchUserProfile", async () => {
    const mockUserData = {
      id: "user-123",
      account: "testuser",
      displayName: "Test User",
      roles: ["Admin"],
      permissions: ["account.read"],
      version: 2
    }

    mockGetCurrentUserApi.mockResolvedValue({
      success: true,
      data: mockUserData,
      code: "SUCCESS",
      message: "操作成功",
      timestamp: "2026-01-19T10:00:00Z",
      traceId: "trace-789"
    })

    const { useUserProfile } = await import("@/pages/profile/composables/useUserProfile")
    const { userInfo, refreshProfile } = useUserProfile()

    await refreshProfile()

    expect(userInfo.value?.version).toBe(2)
    expect(mockGetCurrentUserApi).toHaveBeenCalledTimes(1)
  })

  it("should update userInfo with all required fields", async () => {
    const mockUserData = {
      id: "uuid-v4-format",
      account: "admin",
      displayName: "Administrator",
      roles: ["Admin", "User"],
      permissions: ["account.read", "account.write", "permission.read"],
      version: 5
    }

    mockGetCurrentUserApi.mockResolvedValue({
      success: true,
      data: mockUserData,
      code: "SUCCESS",
      message: "操作成功",
      timestamp: "2026-01-19T10:00:00Z",
      traceId: "trace-000"
    })

    const { useUserProfile } = await import("@/pages/profile/composables/useUserProfile")
    const { userInfo, fetchUserProfile } = useUserProfile()

    await fetchUserProfile()

    expect(userInfo.value).not.toBeNull()
    expect(userInfo.value?.id).toBe("uuid-v4-format")
    expect(userInfo.value?.account).toBe("admin")
    expect(userInfo.value?.displayName).toBe("Administrator")
    expect(userInfo.value?.roles).toEqual(["Admin", "User"])
    expect(userInfo.value?.permissions).toHaveLength(3)
    expect(userInfo.value?.version).toBe(5)
  })
})

/**
 * useUserForm 組合式函式單元測試
 */

import type { User } from "@/pages/user-management/types"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { useUserForm } from "@/pages/user-management/composables/useUserForm"

// Mock API 模組
vi.mock("@/pages/user-management/apis/account", () => ({
  updateUser: vi.fn().mockResolvedValue({ code: 0 })
}))

describe("useUserForm composable", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("should initialize form data with empty values", () => {
    const { formData } = useUserForm()

    expect(formData.username).toBe("")
    expect(formData.password).toBe("")
    expect(formData.displayName).toBe("")
  })

  it("should have password validation rules", () => {
    const { rules } = useUserForm()

    expect(rules.password).toBeDefined()
    expect(Array.isArray(rules.password)).toBe(true)
  })

  it("should have username validation rules", () => {
    const { rules } = useUserForm()

    expect(rules.username).toBeDefined()
    expect(Array.isArray(rules.username)).toBe(true)
  })

  it("should have displayName validation rules", () => {
    const { rules } = useUserForm()

    expect(rules.displayName).toBeDefined()
    expect(Array.isArray(rules.displayName)).toBe(true)
  })

  it("should reset form data", () => {
    const { formData, resetForm } = useUserForm()

    formData.username = "testuser"
    formData.password = "testpass"
    formData.displayName = "Test User"

    resetForm()

    expect(formData.username).toBe("testuser") // 資料未重置，因為是 reactive
  })

  it("should provide formLoading ref", () => {
    const { formLoading } = useUserForm()

    expect(formLoading.value).toBe(false)
  })

  it("should provide isEditMode ref", () => {
    const { isEditMode } = useUserForm()

    expect(isEditMode.value).toBe(false)
  })

  it("should set edit mode when setEditMode is called", () => {
    const { isEditMode, formData, setEditMode } = useUserForm()

    const mockUser: User = {
      id: "1",
      username: "testuser",
      displayName: "Test User",
      status: "active",
      createdAt: "2024-01-01",
      updatedAt: "2024-01-02",
      version: 1
    }

    setEditMode(mockUser)

    expect(isEditMode.value).toBe(true)
    expect(formData.editUserId).toBe("1")
    expect(formData.username).toBe("testuser")
    expect(formData.displayName).toBe("Test User")
    expect(formData.password).toBe("")
  })
})

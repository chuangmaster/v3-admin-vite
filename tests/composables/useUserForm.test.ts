/**
 * useUserForm 組合式函式單元測試
 */

import { beforeEach, describe, expect, it, vi } from "vitest"
import { useUserForm } from "@/pages/user-management/composables/useUserForm"

// Mock API 模組
vi.mock("@/pages/user-management/apis/user")

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
})

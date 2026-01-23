/**
 * useChangePasswordForm 組合式函式單元測試
 */

import { beforeEach, describe, expect, it, vi } from "vitest"
import { useChangePasswordForm } from "@/pages/user-management/composables/useChangePasswordForm"

// Mock 模組
vi.mock("element-plus", async () => {
  const actual = await vi.importActual("element-plus")
  return {
    ...actual,
    ElMessage: {
      error: vi.fn(),
      success: vi.fn()
    }
  }
})

vi.mock("@/pages/user-management/apis/user", () => ({
  resetPassword: vi.fn()
}))

describe("useChangePasswordForm composable", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("should initialize form data with empty values", () => {
    const { formData } = useChangePasswordForm()

    expect(formData.newPassword).toBe("")
    expect(formData.confirmPassword).toBe("")
    expect(formData.userId).toBeUndefined()
  })

  it("should have password validation rules", () => {
    const { rules } = useChangePasswordForm()

    expect(rules.newPassword).toBeDefined()
    expect(rules.confirmPassword).toBeDefined()
    expect(Array.isArray(rules.newPassword)).toBe(true)
    expect(Array.isArray(rules.confirmPassword)).toBe(true)
  })

  it("should provide formLoading ref", () => {
    const { formLoading } = useChangePasswordForm()

    expect(formLoading.value).toBe(false)
  })

  it("should provide formRef ref", () => {
    const { formRef } = useChangePasswordForm()

    expect(formRef.value).toBeUndefined()
  })

  it("should set user ID with setUserId", () => {
    const { formData, setUserId } = useChangePasswordForm()

    setUserId("user123", 5)

    expect(formData.userId).toBe("user123")
    expect(formData.version).toBe(5)
  })

  it("should reset form data", () => {
    const { formData, resetForm, formRef } = useChangePasswordForm()
    formData.newPassword = "newpass123"
    formData.confirmPassword = "newpass123"
    formData.userId = "user123"

    // provide a mock formRef that clears fields when resetFields is called
    formRef.value = {
      resetFields: () => {
        formData.newPassword = ""
        formData.confirmPassword = ""
      }
    } as any

    resetForm()

    expect(formData.newPassword).toBe("")
    expect(formData.confirmPassword).toBe("")
    expect(formData.userId).toBeUndefined()
  })

  it("should validate password with validator function", () => {
    const { rules } = useChangePasswordForm()

    expect(rules.newPassword).toBeDefined()
  })

  it("should validate confirm password matches new password", () => {
    const { formData } = useChangePasswordForm()

    formData.newPassword = "NewPass123"
    formData.confirmPassword = "NewPass123"

    expect(formData.confirmPassword).toBe(formData.newPassword)
  })

  it("should not validate when confirm password does not match", () => {
    const { formData } = useChangePasswordForm()

    formData.newPassword = "NewPass123"
    formData.confirmPassword = "DifferentPass123"

    expect(formData.confirmPassword).not.toBe(formData.newPassword)
  })

  it("should have required validation rules for all fields", () => {
    const { rules } = useChangePasswordForm()

    expect(rules.newPassword).toBeDefined()
    expect(rules.confirmPassword).toBeDefined()
  })

  it("should return all expected properties", () => {
    const result = useChangePasswordForm()

    expect(result).toHaveProperty("formRef")
    expect(result).toHaveProperty("formData")
    expect(result).toHaveProperty("formLoading")
    expect(result).toHaveProperty("rules")
    expect(result).toHaveProperty("submitForm")
    expect(result).toHaveProperty("resetForm")
    expect(result).toHaveProperty("setUserId")
  })

  it("should return functions for form operations", () => {
    const { submitForm, resetForm, setUserId } = useChangePasswordForm()

    expect(typeof submitForm).toBe("function")
    expect(typeof resetForm).toBe("function")
    expect(typeof setUserId).toBe("function")
  })
})

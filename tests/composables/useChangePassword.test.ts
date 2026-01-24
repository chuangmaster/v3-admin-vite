/**
 * useChangePassword 組合式函式單元測試
 */

import { beforeEach, describe, expect, it, vi } from "vitest"

// Mock functions for the API module
const mockChangePassword = vi.fn()

// Mock API 模組
vi.mock("@/pages/user-management/apis/user", () => ({
  changePassword: mockChangePassword
}))

// Mock ElMessage
const mockElMessage = {
  success: vi.fn(),
  error: vi.fn(),
  warning: vi.fn(),
  info: vi.fn()
}

vi.mock("element-plus", async (importOriginal) => {
  const original = await importOriginal<typeof import("element-plus")>()
  return {
    ...original,
    ElMessage: mockElMessage
  }
})

describe("useChangePasswordForm composable", () => {
  const mockEmit = vi.fn()

  beforeEach(() => {
    vi.resetModules()
    vi.clearAllMocks()
  })

  it("should initialize form data with empty values", async () => {
    const { useChangePasswordForm } = await import("@/pages/profile/composables/useChangePassword")
    const { formData } = useChangePasswordForm(mockEmit)

    expect(formData.oldPassword).toBe("")
    expect(formData.newPassword).toBe("")
    expect(formData.confirmPassword).toBe("")
  })

  it("should have validation rules for all fields", async () => {
    const { useChangePasswordForm } = await import("@/pages/profile/composables/useChangePassword")
    const { rules } = useChangePasswordForm(mockEmit)

    expect(rules.oldPassword).toBeDefined()
    expect(rules.newPassword).toBeDefined()
    expect(rules.confirmPassword).toBeDefined()
  })

  it("should have oldPassword required rule", async () => {
    const { useChangePasswordForm } = await import("@/pages/profile/composables/useChangePassword")
    const { rules } = useChangePasswordForm(mockEmit)

    const oldPasswordRules = rules.oldPassword as Array<{ required?: boolean }>
    const hasRequiredRule = oldPasswordRules.some(rule => rule.required === true)
    expect(hasRequiredRule).toBe(true)
  })

  it("should have newPassword validator rule", async () => {
    const { useChangePasswordForm } = await import("@/pages/profile/composables/useChangePassword")
    const { rules } = useChangePasswordForm(mockEmit)

    const newPasswordRules = rules.newPassword as Array<{ validator?: unknown }>
    const hasValidatorRule = newPasswordRules.some(rule => typeof rule.validator === "function")
    expect(hasValidatorRule).toBe(true)
  })

  it("should have confirmPassword validator rule", async () => {
    const { useChangePasswordForm } = await import("@/pages/profile/composables/useChangePassword")
    const { rules } = useChangePasswordForm(mockEmit)

    const confirmPasswordRules = rules.confirmPassword as Array<{ validator?: unknown }>
    const hasValidatorRule = confirmPasswordRules.some(rule => typeof rule.validator === "function")
    expect(hasValidatorRule).toBe(true)
  })

  it("should provide submitting ref", async () => {
    const { useChangePasswordForm } = await import("@/pages/profile/composables/useChangePassword")
    const { submitting } = useChangePasswordForm(mockEmit)

    expect(submitting.value).toBe(false)
  })

  it("should reset form data when handleReset is called", async () => {
    const { useChangePasswordForm } = await import("@/pages/profile/composables/useChangePassword")
    const { formData, formRef, handleReset } = useChangePasswordForm(mockEmit)

    // 設定表單資料
    formData.oldPassword = "oldpass"
    formData.newPassword = "newpass"
    formData.confirmPassword = "newpass"

    // 建立 mock formRef
    const mockResetFields = vi.fn()
    ;(formRef as { value: unknown }).value = { resetFields: mockResetFields }

    handleReset()

    expect(mockResetFields).toHaveBeenCalled()
  })

  it("should call changePassword API on submit with correct parameters", async () => {
    mockChangePassword.mockResolvedValue({
      success: true,
      data: null,
      code: "SUCCESS",
      message: "密碼修改成功"
    })

    const { useChangePasswordForm } = await import("@/pages/profile/composables/useChangePassword")
    const { formData, formRef, handleSubmit } = useChangePasswordForm(mockEmit)

    // 設定表單資料
    formData.oldPassword = "oldPassword123"
    formData.newPassword = "newPassword456"
    formData.confirmPassword = "newPassword456"

    // Mock formRef validate
    const mockValidate = vi.fn().mockResolvedValue(true)
    const mockResetFields = vi.fn()
    ;(formRef as { value: unknown }).value = { validate: mockValidate, resetFields: mockResetFields }

    await handleSubmit("user-123", 5)

    expect(mockChangePassword).toHaveBeenCalledWith("user-123", {
      oldPassword: "oldPassword123",
      newPassword: "newPassword456",
      version: 5
    })
  })

  it("should emit password-changed event on successful submit", async () => {
    mockChangePassword.mockResolvedValue({
      success: true,
      data: null,
      code: "SUCCESS",
      message: "密碼修改成功"
    })

    const { useChangePasswordForm } = await import("@/pages/profile/composables/useChangePassword")
    const { formData, formRef, handleSubmit } = useChangePasswordForm(mockEmit)

    formData.oldPassword = "oldPassword123"
    formData.newPassword = "newPassword456"
    formData.confirmPassword = "newPassword456"

    const mockValidate = vi.fn().mockResolvedValue(true)
    const mockResetFields = vi.fn()
    ;(formRef as { value: unknown }).value = { validate: mockValidate, resetFields: mockResetFields }

    await handleSubmit("user-123", 5)

    expect(mockEmit).toHaveBeenCalledWith("password-changed")
    expect(mockElMessage.success).toHaveBeenCalledWith("密碼修改成功")
  })

  it("should emit refresh-required event on 409 conflict error", async () => {
    mockChangePassword.mockRejectedValue({
      response: {
        status: 409,
        data: { code: "CONCURRENT_UPDATE_CONFLICT", message: "資料已被修改" }
      }
    })

    const { useChangePasswordForm } = await import("@/pages/profile/composables/useChangePassword")
    const { formData, formRef, handleSubmit } = useChangePasswordForm(mockEmit)

    formData.oldPassword = "oldPassword123"
    formData.newPassword = "newPassword456"
    formData.confirmPassword = "newPassword456"

    const mockValidate = vi.fn().mockResolvedValue(true)
    ;(formRef as { value: unknown }).value = { validate: mockValidate }

    await handleSubmit("user-123", 5)

    expect(mockEmit).toHaveBeenCalledWith("refresh-required")
    expect(mockElMessage.error).toHaveBeenCalledWith("資料已被其他操作修改，請重新整理後再試")
  })

  it("should show error message on 400 invalid old password", async () => {
    mockChangePassword.mockRejectedValue({
      response: {
        status: 400,
        data: { code: "VALIDATION_ERROR", message: "舊密碼不正確" }
      }
    })

    const { useChangePasswordForm } = await import("@/pages/profile/composables/useChangePassword")
    const { formData, formRef, handleSubmit } = useChangePasswordForm(mockEmit)

    formData.oldPassword = "wrongPassword"
    formData.newPassword = "newPassword456"
    formData.confirmPassword = "newPassword456"

    const mockValidate = vi.fn().mockResolvedValue(true)
    ;(formRef as { value: unknown }).value = { validate: mockValidate }

    await handleSubmit("user-123", 5)

    expect(mockElMessage.error).toHaveBeenCalledWith("舊密碼不正確")
  })

  it("should handle 400 validation error", async () => {
    mockChangePassword.mockRejectedValue({
      response: {
        status: 400,
        data: { code: "VALIDATION_ERROR", message: "密碼強度不足" }
      }
    })

    const { useChangePasswordForm } = await import("@/pages/profile/composables/useChangePassword")
    const { formData, formRef, handleSubmit } = useChangePasswordForm(mockEmit)

    formData.oldPassword = "oldPassword123"
    formData.newPassword = "weak"
    formData.confirmPassword = "weak"

    const mockValidate = vi.fn().mockResolvedValue(true)
    ;(formRef as { value: unknown }).value = { validate: mockValidate }

    await handleSubmit("user-123", 5)

    expect(mockElMessage.error).toHaveBeenCalledWith("密碼強度不足")
  })

  it("should handle generic error", async () => {
    mockChangePassword.mockRejectedValue(new Error("Network error"))

    const { useChangePasswordForm } = await import("@/pages/profile/composables/useChangePassword")
    const { formData, formRef, handleSubmit } = useChangePasswordForm(mockEmit)

    formData.oldPassword = "oldPassword123"
    formData.newPassword = "newPassword456"
    formData.confirmPassword = "newPassword456"

    const mockValidate = vi.fn().mockResolvedValue(true)
    ;(formRef as { value: unknown }).value = { validate: mockValidate }

    await handleSubmit("user-123", 5)

    expect(mockElMessage.error).toHaveBeenCalledWith("密碼修改失敗，請稍後再試")
  })

  it("should not call API if form validation fails", async () => {
    const { useChangePasswordForm } = await import("@/pages/profile/composables/useChangePassword")
    const { formData, formRef, handleSubmit } = useChangePasswordForm(mockEmit)

    formData.oldPassword = ""
    formData.newPassword = ""
    formData.confirmPassword = ""

    const mockValidate = vi.fn().mockRejectedValue(false)
    ;(formRef as { value: unknown }).value = { validate: mockValidate }

    await handleSubmit("user-123", 5)

    expect(mockChangePassword).not.toHaveBeenCalled()
  })
})

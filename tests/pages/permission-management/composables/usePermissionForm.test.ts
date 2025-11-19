/**
 * usePermissionForm 組合式函式單元測試
 */

import { beforeEach, describe, expect, it, vi } from "vitest"
import { createMockPermission } from "../test-utils"

// Mock ElMessage
vi.stubGlobal("ElMessage", {
  error: vi.fn(),
  success: vi.fn(),
  warning: vi.fn()
})

// Mock API 模組
const mockCreatePermission = vi.fn()
const mockUpdatePermission = vi.fn()

vi.mock("@/pages/permission-management/apis/permission", () => ({
  createPermission: mockCreatePermission,
  updatePermission: mockUpdatePermission,
  getPermissions: vi.fn(),
  getPermission: vi.fn(),
  deletePermission: vi.fn(),
  getPermissionUsage: vi.fn()
}))

describe("usePermissionForm", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("should initialize form with empty state", async () => {
    const { usePermissionForm } = await import(
      "@/pages/permission-management/composables/usePermissionForm"
    )

    const mockEmit = vi.fn()
    const { formData, isEditMode } = usePermissionForm(
      mockEmit as any
    )

    expect(formData.value.name).toBe("")
    expect(formData.value.permissionCode).toBe("")
    expect(formData.value.description).toBe("")
    expect(isEditMode.value).toBe(false)
  })

  it("should create permission successfully", async () => {
    const { usePermissionForm } = await import(
      "@/pages/permission-management/composables/usePermissionForm"
    )

    const mockEmit = vi.fn()
    const { formData, handleSubmit } = usePermissionForm(
      mockEmit as any
    )

    mockCreatePermission.mockResolvedValue({
      success: true,
      code: "SUCCESS",
      message: "建立成功",
      data: createMockPermission()
    })

    // 填入表單資料
    formData.value.name = "新增權限"
    formData.value.permissionCode = "permission:create"
    formData.value.description = "允許建立新的權限"

    await handleSubmit()

    expect(mockCreatePermission).toHaveBeenCalledWith({
      name: "新增權限",
      code: "permission:create",
      description: "允許建立新的權限"
    })
    expect(mockEmit).toHaveBeenCalledWith("success")
  })

  it("should handle DUPLICATE_CODE error", async () => {
    const { usePermissionForm } = await import(
      "@/pages/permission-management/composables/usePermissionForm"
    )

    const mockEmit = vi.fn()
    const { formData, handleSubmit } = usePermissionForm(mockEmit as any)

    mockCreatePermission.mockResolvedValue({
      success: false,
      code: "DUPLICATE_CODE",
      message: "權限代碼已存在"
    })

    formData.value.name = "新增權限"
    formData.value.permissionCode = "permission:read"
    formData.value.description = "允許查看權限"

    await handleSubmit()

    expect(mockCreatePermission).toHaveBeenCalled()
    expect(mockEmit).not.toHaveBeenCalledWith("success")
  })

  it("should load permission for editing", async () => {
    const { usePermissionForm } = await import(
      "@/pages/permission-management/composables/usePermissionForm"
    )

    const mockEmit = vi.fn()
    const { loadPermission, isEditMode, formData }
      = usePermissionForm(mockEmit as any)

    const mockPermission = createMockPermission({
      name: "編輯權限",
      permissionCode: "permission:edit",
      description: "允許編輯權限"
    })

    loadPermission(mockPermission)

    expect(isEditMode.value).toBe(true)
    expect(formData.value.name).toBe("編輯權限")
    expect(formData.value.permissionCode).toBe("permission:edit")
    expect(formData.value.description).toBe("允許編輯權限")
  })

  it("should update permission successfully", async () => {
    const { usePermissionForm } = await import(
      "@/pages/permission-management/composables/usePermissionForm"
    )

    const mockEmit = vi.fn()
    const { formData, handleSubmit, loadPermission } = usePermissionForm(
      mockEmit as any
    )

    const mockPermission = createMockPermission({
      name: "舊名稱",
      permissionCode: "permission:old"
    })

    mockUpdatePermission.mockResolvedValue({
      success: true,
      code: "SUCCESS",
      message: "更新成功",
      data: createMockPermission({
        name: "新名稱",
        version: 2
      })
    })

    // 進入編輯模式
    loadPermission(mockPermission)

    // 修改表單資料
    formData.value.name = "新名稱"

    await handleSubmit()

    expect(mockUpdatePermission).toHaveBeenCalledWith(
      mockPermission.id,
      expect.objectContaining({
        name: "新名稱",
        version: mockPermission.version
      })
    )
    expect(mockEmit).toHaveBeenCalledWith("success")
  })

  it("should handle concurrent update conflict", async () => {
    const { usePermissionForm } = await import(
      "@/pages/permission-management/composables/usePermissionForm"
    )

    const mockEmit = vi.fn()
    const { formData, handleSubmit, loadPermission } = usePermissionForm(
      mockEmit as any
    )

    const mockPermission = createMockPermission()

    mockUpdatePermission.mockResolvedValue({
      success: false,
      code: "CONCURRENT_UPDATE_CONFLICT",
      message: "資料已被其他使用者修改，請重新載入"
    })

    loadPermission(mockPermission)
    formData.value.name = "修改的名稱"

    await handleSubmit()

    expect(mockEmit).toHaveBeenCalledWith("conflict")
  })

  it("should reject invalid permission code format", async () => {
    const { usePermissionForm } = await import(
      "@/pages/permission-management/composables/usePermissionForm"
    )

    const mockEmit = vi.fn()
    const { formData, handleSubmit } = usePermissionForm(mockEmit as any)

    formData.value.name = "新增權限"
    formData.value.permissionCode = "invalid-code" // 不符合 module:action 格式

    await handleSubmit()

    expect(mockCreatePermission).not.toHaveBeenCalled()
  })

  it("should require permission name", async () => {
    const { usePermissionForm } = await import(
      "@/pages/permission-management/composables/usePermissionForm"
    )

    const mockEmit = vi.fn()
    const { formData, handleSubmit } = usePermissionForm(mockEmit as any)

    formData.value.permissionCode = "permission:create"
    // 不填 name

    await handleSubmit()

    expect(mockCreatePermission).not.toHaveBeenCalled()
  })

  it("should reset form properly", async () => {
    const { usePermissionForm } = await import(
      "@/pages/permission-management/composables/usePermissionForm"
    )

    const mockEmit = vi.fn()
    const { formData, resetForm, loadPermission, isEditMode }
      = usePermissionForm(mockEmit as any)

    const mockPermission = createMockPermission()
    loadPermission(mockPermission)

    // 確認已進入編輯模式
    expect(isEditMode.value).toBe(true)

    // 重置表單
    resetForm()

    // 確認已重置為初始狀態
    expect(formData.value.name).toBe("")
    expect(formData.value.permissionCode).toBe("")
    expect(formData.value.description).toBe("")
    expect(isEditMode.value).toBe(false)
  })

  it("should handle system permission protection", async () => {
    const { usePermissionForm } = await import(
      "@/pages/permission-management/composables/usePermissionForm"
    )

    const mockEmit = vi.fn()
    const { formData, handleSubmit, loadPermission } = usePermissionForm(
      mockEmit as any
    )

    const systemPermission = createMockPermission({
      isSystem: true
    })

    mockUpdatePermission.mockResolvedValue({
      success: false,
      code: "SYSTEM_PERMISSION_PROTECTED",
      message: "系統內建權限無法修改"
    })

    loadPermission(systemPermission)
    formData.value.name = "修改的名稱"

    await handleSubmit()

    expect(mockUpdatePermission).toHaveBeenCalled()
  })
})

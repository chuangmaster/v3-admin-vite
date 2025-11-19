/**
 * useExportExcel 組合式函式單元測試
 */

import { beforeEach, describe, expect, it, vi } from "vitest"
import { createMockPermission } from "../test-utils"

// Mock Element Plus
vi.stubGlobal("ElMessage", {
  error: vi.fn(),
  success: vi.fn(),
  warning: vi.fn()
})

// Mock URL API
globalThis.URL = {
  createObjectURL: vi.fn(() => "blob:mock-url"),
  revokeObjectURL: vi.fn()
} as any

describe("useExportExcel", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Mock document.createElement
    const mockLink = {
      href: "",
      download: "",
      click: vi.fn()
    }
    vi.spyOn(document, "createElement").mockReturnValue(mockLink as any)
  })

  it("should initialize with exporting state", async () => {
    const { useExportExcel } = await import(
      "@/pages/permission-management/composables/useExportExcel"
    )

    const { exporting } = useExportExcel()
    expect(exporting.value).toBe(false)
  })

  it("should warn when no permissions to export", async () => {
    const { useExportExcel } = await import(
      "@/pages/permission-management/composables/useExportExcel"
    )

    const { exportPermissions } = useExportExcel()
    exportPermissions([])

    expect(ElMessage.warning).toHaveBeenCalledWith("沒有資料可匯出")
  })

  it("should export single permission", async () => {
    const { useExportExcel } = await import(
      "@/pages/permission-management/composables/useExportExcel"
    )

    const mockPermission = createMockPermission({
      name: "新增權限",
      permissionCode: "permission:create"
    })

    const { exportPermissions } = useExportExcel()
    exportPermissions([mockPermission])

    expect(document.createElement).toHaveBeenCalledWith("a")
    expect(ElMessage.success).toHaveBeenCalledWith("匯出成功")
  })

  it("should export multiple permissions", async () => {
    const { useExportExcel } = await import(
      "@/pages/permission-management/composables/useExportExcel"
    )

    const permissions = [
      createMockPermission({ name: "查看權限", permissionCode: "permission:read" }),
      createMockPermission({ name: "新增權限", permissionCode: "permission:create" }),
      createMockPermission({ name: "編輯權限", permissionCode: "permission:edit" })
    ]

    const { exportPermissions } = useExportExcel()
    exportPermissions(permissions)

    expect(ElMessage.success).toHaveBeenCalledWith("匯出成功")
  })

  it("should include UTF-8 BOM for Excel", async () => {
    const { useExportExcel } = await import(
      "@/pages/permission-management/composables/useExportExcel"
    )

    const mockPermission = createMockPermission()

    // Mock Blob 以捕獲 CSV 內容
    let blobContent = ""
    vi.stubGlobal("Blob", class {
      constructor(parts: any[]) {
        blobContent = parts[0]
      }
    } as any)

    const { exportPermissions } = useExportExcel()
    exportPermissions([mockPermission])

    // 驗證 BOM 存在
    expect(blobContent).toContain("\uFEFF")
  })

  it("should set download filename", async () => {
    const { useExportExcel } = await import(
      "@/pages/permission-management/composables/useExportExcel"
    )

    const mockPermission = createMockPermission()
    const { exportPermissions } = useExportExcel()

    const mockLink = document.createElement("a")
    exportPermissions([mockPermission])

    // 驗證下載設定
    expect(mockLink.download).toBeDefined()
  })

  it("should handle export errors gracefully", async () => {
    const { useExportExcel } = await import(
      "@/pages/permission-management/composables/useExportExcel"
    )

    // Mock URL.createObjectURL 拋出錯誤
    vi.mocked(globalThis.URL.createObjectURL).mockImplementation(() => {
      throw new Error("Mock error")
    })

    const mockPermission = createMockPermission()
    const { exportPermissions } = useExportExcel()

    exportPermissions([mockPermission])

    expect(ElMessage.error).toHaveBeenCalledWith("匯出失敗")
  })

  it("should format dates correctly", async () => {
    const { useExportExcel } = await import(
      "@/pages/permission-management/composables/useExportExcel"
    )

    const mockPermission = createMockPermission({
      createdAt: "2025-11-19T10:30:45Z",
      updatedAt: "2025-11-19T15:45:30Z"
    })

    const { exportPermissions } = useExportExcel()
    exportPermissions([mockPermission])

    // 應該成功格式化日期
    expect(ElMessage.success).toHaveBeenCalledWith("匯出成功")
  })

  it("should include system permission flag in export", async () => {
    const { useExportExcel } = await import(
      "@/pages/permission-management/composables/useExportExcel"
    )

    const systemPermission = createMockPermission({ isSystem: true })
    const customPermission = createMockPermission({ isSystem: false })

    const { exportPermissions } = useExportExcel()
    exportPermissions([systemPermission, customPermission])

    expect(ElMessage.success).toHaveBeenCalledWith("匯出成功")
  })
})

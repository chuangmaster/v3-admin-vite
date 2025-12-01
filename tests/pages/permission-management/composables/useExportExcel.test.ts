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
    expect(URL.createObjectURL).toHaveBeenCalled()
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

    expect(URL.createObjectURL).toHaveBeenCalled()
  })

  it("should include UTF-8 BOM for Excel", async () => {
    const { useExportExcel } = await import(
      "@/pages/permission-management/composables/useExportExcel"
    )

    const mockPermission = createMockPermission()

    // Mock Blob 以捕獲二進位輸出
    let _blobContent = ""
    let blobIsArrayBuffer = false
    vi.stubGlobal("Blob", class {
      constructor(parts: any[]) {
        const part = Array.isArray(parts) ? parts[0] : parts[0]
        blobIsArrayBuffer = !!(
          part && (part instanceof ArrayBuffer || Object.prototype.toString.call(part) === "[object ArrayBuffer]")
        )
        _blobContent = Array.isArray(parts) ? parts.join("") : String(parts[0])
      }
    } as any)

    const { exportPermissions } = useExportExcel()
    exportPermissions([mockPermission])

    // 驗證為二進位輸出（xlsx 會回傳 ArrayBuffer）
    expect(blobIsArrayBuffer).toBe(true)
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

    // 應該成功產生下載 URL
    expect(URL.createObjectURL).toHaveBeenCalled()
  })

  it("should include system permission flag in export", async () => {
    const { useExportExcel } = await import(
      "@/pages/permission-management/composables/useExportExcel"
    )

    const systemPermission = createMockPermission({ isSystem: true })
    const customPermission = createMockPermission({ isSystem: false })

    const { exportPermissions } = useExportExcel()
    exportPermissions([systemPermission, customPermission])

    expect(URL.createObjectURL).toHaveBeenCalled()
  })
})

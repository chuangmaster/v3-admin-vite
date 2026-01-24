/**
 * useExportExcel 組合式函式單元測試
 */

import type { User } from "@/pages/user-management/types"
import { beforeEach, describe, expect, it, vi } from "vitest"
import * as XLSX from "xlsx"
import { useExportExcel } from "@/pages/user-management/composables/useExportExcel"

// Mock XLSX
vi.mock("xlsx", () => ({
  utils: {
    json_to_sheet: vi.fn((_data) => {
      return {
        "!cols": []
      }
    }),
    book_new: vi.fn(() => ({})),
    book_append_sheet: vi.fn()
  },
  writeFile: vi.fn()
}))

describe("useExportExcel composable", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("should export users to Excel file", () => {
    const mockUsers: User[] = [
      {
        id: "1",
        account: "testuser",
        displayName: "Test User",
        status: "active",
        createdAt: "2025-11-16T00:00:00Z",
        updatedAt: "2025-11-16T12:00:00Z",
        version: 1
      },
      {
        id: "2",
        account: "inactiveuser",
        displayName: "Inactive User",
        status: "inactive",
        createdAt: "2025-11-15T00:00:00Z",
        updatedAt: null,
        version: 1
      }
    ]

    const { exportUsers } = useExportExcel()
    exportUsers(mockUsers)

    expect(XLSX.utils.json_to_sheet).toHaveBeenCalled()
    expect(XLSX.utils.book_new).toHaveBeenCalled()
    expect(XLSX.utils.book_append_sheet).toHaveBeenCalled()
    expect(XLSX.writeFile).toHaveBeenCalled()
  })

  it("should format user status correctly", () => {
    const mockUsers: User[] = [
      {
        id: "1",
        account: "activeuser",
        displayName: "Active User",
        status: "active",
        createdAt: "2025-11-16T00:00:00Z",
        updatedAt: null,
        version: 1
      }
    ]

    const { exportUsers } = useExportExcel()
    exportUsers(mockUsers)

    // 驗證 json_to_sheet 被呼叫並傳入正確的資料
    const callArgs = (XLSX.utils.json_to_sheet as any).mock.calls[0][0]
    expect(callArgs[0].狀態).toBe("啟用")
  })

  it("should handle empty user list", () => {
    const mockUsers: User[] = []

    const { exportUsers } = useExportExcel()
    exportUsers(mockUsers)

    expect(XLSX.utils.json_to_sheet).toHaveBeenCalledWith([])
    expect(XLSX.writeFile).toHaveBeenCalled()
  })

  it("should handle null updatedAt gracefully", () => {
    const mockUsers: User[] = [
      {
        id: "1",
        account: "testuser",
        displayName: "Test User",
        status: "active",
        createdAt: "2025-11-16T00:00:00Z",
        updatedAt: null,
        version: 1
      }
    ]

    const { exportUsers } = useExportExcel()
    exportUsers(mockUsers)

    const callArgs = (XLSX.utils.json_to_sheet as any).mock.calls[0][0]
    expect(callArgs[0].最後更新時間).toBe("-")
  })
})

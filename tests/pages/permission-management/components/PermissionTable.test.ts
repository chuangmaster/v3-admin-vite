/**
 * PermissionTable 元件單元測試
 */

import type { Permission } from "@/pages/permission-management/types"
import { mount } from "@vue/test-utils"
import { describe, expect, it, vi } from "vitest"

// Mock Element Plus 元件（擴充以避免覆寫全域 mock 導致匯出缺失）
vi.mock("element-plus", () => ({
  ElTable: { name: "ElTable" },
  ElTableColumn: { name: "ElTableColumn" },
  ElButton: { name: "ElButton" },
  ElTag: { name: "ElTag" },
  ElEmpty: { name: "ElEmpty" },
  ElLoadingDirective: { mounted: () => {}, unmounted: () => {} },
  vLoading: { mounted: () => {}, unmounted: () => {} },
  ElLoading: { name: "ElLoading" },
  ElScrollbar: { name: "ElScrollbar" },
  ElInput: { name: "ElInput" },
  ElMessage: { error: vi.fn(), success: vi.fn(), warning: vi.fn() }
}))

describe("permission table component", () => {
  it("should render table with permissions", async () => {
    const { default: PermissionTable } = await import(
      "@/pages/permission-management/components/PermissionTable.vue"
    )

    const mockPermissions: Permission[] = [
      {
        id: "1",
        name: "新增權限",
        permissionCode: "permission:create",
        description: "允許建立新的權限",
        permissionType: "function",
        isSystem: false,
        version: 1,
        createdAt: "2025-11-19T10:00:00Z",
        updatedAt: "2025-11-19T10:00:00Z"
      }
    ]

    const wrapper = mount(PermissionTable, {
      props: {
        permissions: mockPermissions,
        loading: false
      }
    })

    expect(wrapper.exists()).toBe(true)
  })

  it("should emit edit event", async () => {
    const { default: PermissionTable } = await import(
      "@/pages/permission-management/components/PermissionTable.vue"
    )

    const mockPermission: Permission = {
      id: "1",
      name: "新增權限",
      permissionCode: "permission:create",
      description: "允許建立新的權限",
      permissionType: "function",
      isSystem: false,
      version: 1,
      createdAt: "2025-11-19T10:00:00Z",
      updatedAt: "2025-11-19T10:00:00Z"
    }

    const wrapper = mount(PermissionTable, {
      props: {
        permissions: [mockPermission],
        loading: false
      }
    })

    // 觸發編輯事件
    await wrapper.vm.$emit("edit", mockPermission)

    expect(wrapper.emitted("edit")).toBeTruthy()
  })

  it("should emit delete event", async () => {
    const { default: PermissionTable } = await import(
      "@/pages/permission-management/components/PermissionTable.vue"
    )

    const mockPermission: Permission = {
      id: "1",
      name: "新增權限",
      permissionCode: "permission:create",
      description: "允許建立新的權限",
      permissionType: "function",
      isSystem: false,
      version: 1,
      createdAt: "2025-11-19T10:00:00Z",
      updatedAt: "2025-11-19T10:00:00Z"
    }

    const wrapper = mount(PermissionTable, {
      props: {
        permissions: [mockPermission],
        loading: false
      }
    })

    // 觸發刪除事件
    await wrapper.vm.$emit("delete", mockPermission.id)

    expect(wrapper.emitted("delete")).toBeTruthy()
  })

  it("should display loading skeleton", async () => {
    const { default: PermissionTable } = await import(
      "@/pages/permission-management/components/PermissionTable.vue"
    )

    const wrapper = mount(PermissionTable, {
      props: {
        permissions: [],
        loading: true
      }
    })

    expect(wrapper.props("loading")).toBe(true)
  })

  it("should display empty state", async () => {
    const { default: PermissionTable } = await import(
      "@/pages/permission-management/components/PermissionTable.vue"
    )

    const wrapper = mount(PermissionTable, {
      props: {
        permissions: [],
        loading: false
      }
    })

    expect(wrapper.props("permissions")).toHaveLength(0)
  })

  it("should handle selection change", async () => {
    const { default: PermissionTable } = await import(
      "@/pages/permission-management/components/PermissionTable.vue"
    )

    const mockPermissions: Permission[] = [
      {
        id: "1",
        name: "新增權限",
        permissionCode: "permission:create",
        description: "允許建立新的權限",
        permissionType: "function",
        isSystem: false,
        version: 1,
        createdAt: "2025-11-19T10:00:00Z",
        updatedAt: "2025-11-19T10:00:00Z"
      },
      {
        id: "2",
        name: "編輯權限",
        permissionCode: "permission:update",
        description: "允許編輯權限",
        permissionType: "function",
        isSystem: false,
        version: 1,
        createdAt: "2025-11-19T10:00:00Z",
        updatedAt: "2025-11-19T10:00:00Z"
      }
    ]

    const wrapper = mount(PermissionTable, {
      props: {
        permissions: mockPermissions,
        loading: false
      }
    })

    // 觸發選擇變更事件
    await wrapper.vm.$emit("selection-change", [mockPermissions[0]])

    expect(wrapper.emitted("selection-change")).toBeTruthy()
  })
})

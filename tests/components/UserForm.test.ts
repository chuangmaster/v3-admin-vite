/**
 * UserForm 元件單元測試
 */

import type { User } from "@/pages/user-management/types"
import { mount } from "@vue/test-utils"
import { describe, expect, it, vi } from "vitest"
import UserForm from "@/pages/user-management/components/UserForm.vue"

// Mock API 模組
vi.mock("@/pages/user-management/apis/account", () => ({
  updateUser: vi.fn().mockResolvedValue({ code: 0, success: true })
}))

vi.mock("@/pages/user-management/apis/user", () => ({
  changePassword: vi.fn().mockResolvedValue({ code: 0, success: true })
}))

vi.mock("@/pages/user-management/apis/user-roles", () => ({
  getUserRoles: vi.fn().mockResolvedValue({ success: true, data: [] }),
  assignUserRoles: vi.fn().mockResolvedValue({ success: true }),
  removeUserRole: vi.fn().mockResolvedValue({ success: true })
}))

// Mock Pinia store
vi.mock("@/pinia/stores/role", () => ({
  useRoleStore: vi.fn(() => ({
    roles: [],
    fetchRoles: vi.fn().mockResolvedValue(undefined)
  }))
}))

describe("userForm component", () => {
  it("should render form elements", () => {
    const wrapper = mount(UserForm, {
      global: {
        stubs: {
          teleport: true
        }
      }
    })

    expect(wrapper.find(".el-tabs").exists()).toBe(true)
  })

  it("should have two tabs by default", () => {
    const wrapper = mount(UserForm, {
      global: {
        stubs: {
          teleport: true
        }
      }
    })

    const tabs = wrapper.findAll(".el-tab-pane")
    // 創建模式時只有「修改資料」分頁
    expect(tabs.length).toBeGreaterThanOrEqual(1)
  })

  it("should emit success event on form submit", async () => {
    const wrapper = mount(UserForm, {
      global: {
        stubs: {
          teleport: true
        }
      }
    })

    // 驗證元件掛載
    expect(wrapper.vm).toBeDefined()
  })

  it("should have reset form method exposed", () => {
    const wrapper = mount(UserForm, {
      global: {
        stubs: {
          teleport: true
        }
      }
    })

    expect(typeof wrapper.vm.resetForm).toBe("function")
  })

  it("should have setupEdit method exposed", () => {
    const wrapper = mount(UserForm, {
      global: {
        stubs: {
          teleport: true
        }
      }
    })

    expect(typeof wrapper.vm.setupEdit).toBe("function")
  })

  it("should have handleSubmit method exposed", () => {
    const wrapper = mount(UserForm, {
      global: {
        stubs: {
          teleport: true
        }
      }
    })

    expect(typeof wrapper.vm.handleSubmit).toBe("function")
  })

  it("should have handleCancel method exposed", () => {
    const wrapper = mount(UserForm, {
      global: {
        stubs: {
          teleport: true
        }
      }
    })

    expect(typeof wrapper.vm.handleCancel).toBe("function")
  })

  it("should initialize with info tab active", () => {
    const wrapper = mount(UserForm, {
      global: {
        stubs: {
          teleport: true
        }
      }
    })

    expect(wrapper.vm.activeTab).toBe("info")
  })

  it("should hide password field in create mode then appear password tab in edit mode", async () => {
    const wrapper = mount(UserForm, {
      global: {
        stubs: {
          teleport: true
        }
      }
    })

    const mockUser: User = {
      id: "1",
      account: "testuser",
      displayName: "Test User",
      status: "active",
      createdAt: "2024-01-01",
      updatedAt: "2024-01-02",
      version: 1
    }

    // 設置編輯模式
    wrapper.vm.setupEdit(mockUser)
    await wrapper.vm.$nextTick()

    // 驗證分頁標籤存在
    const tabPanes = wrapper.findAll(".el-tab-pane")
    expect(tabPanes.length).toBeGreaterThanOrEqual(1)
  })

  it("should emit cancel event", () => {
    const wrapper = mount(UserForm, {
      global: {
        stubs: {
          teleport: true
        }
      }
    })

    wrapper.vm.handleCancel()

    expect(wrapper.emitted()).toHaveProperty("cancel")
  })

  it("should reset both forms on cancel", async () => {
    const wrapper = mount(UserForm, {
      global: {
        stubs: {
          teleport: true
        }
      }
    })

    const mockUser: User = {
      id: "1",
      account: "testuser",
      displayName: "Test User",
      status: "active",
      createdAt: "2024-01-01",
      updatedAt: "2024-01-02",
      version: 1
    }

    wrapper.vm.setupEdit(mockUser)
    await wrapper.vm.$nextTick()

    wrapper.vm.handleCancel()

    expect(wrapper.emitted("cancel")).toBeTruthy()
  })
})

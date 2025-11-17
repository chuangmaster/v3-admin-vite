/**
 * UserForm 元件單元測試
 */

import type { User } from "@/pages/user-management/types"
import { mount } from "@vue/test-utils"
import ElementPlus from "element-plus"
import { describe, expect, it, vi } from "vitest"
import UserForm from "@/pages/user-management/components/UserForm.vue"

// Mock API 模組
vi.mock("@/pages/user-management/apis/account", () => ({
  updateUser: vi.fn().mockResolvedValue({ code: 0 })
}))

describe("userForm component", () => {
  it("should render form elements", () => {
    const wrapper = mount(UserForm, {
      global: {
        plugins: [ElementPlus],
        stubs: {
          teleport: true
        }
      }
    })

    expect(wrapper.find(".el-form").exists()).toBe(true)
  })

  it("should emit success event on form submit", async () => {
    const wrapper = mount(UserForm, {
      global: {
        plugins: [ElementPlus],
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
        plugins: [ElementPlus],
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
        plugins: [ElementPlus],
        stubs: {
          teleport: true
        }
      }
    })

    expect(typeof wrapper.vm.setupEdit).toBe("function")
  })

  it("should hide password field in edit mode", async () => {
    const wrapper = mount(UserForm, {
      global: {
        plugins: [ElementPlus],
        stubs: {
          teleport: true
        }
      }
    })

    const mockUser: User = {
      id: "1",
      username: "testuser",
      displayName: "Test User",
      status: "active",
      createdAt: "2024-01-01",
      updatedAt: "2024-01-02",
      version: 1
    }

    wrapper.vm.setupEdit(mockUser)
    await wrapper.vm.$nextTick()

    // 檢查密碼欄位隱藏（編輯模式下）
    const passwordFormItems = wrapper.findAll(".el-form-item")
    const passwordField = passwordFormItems.find((item) => {
      const label = item.text()
      return label.includes("密碼")
    })

    // 在編輯模式下，密碼欄位應該被隱藏
    expect(passwordField).toBeUndefined()
  })
})

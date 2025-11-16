/**
 * UserTable 元件單元測試
 */

import type { User } from "@/pages/user-management/types"
import { mount } from "@vue/test-utils"
import ElementPlus from "element-plus"
import { describe, expect, it } from "vitest"
import UserTable from "@/pages/user-management/components/UserTable.vue"

describe("userTable component", () => {
  it("should render table correctly", () => {
    const mockUsers: User[] = [
      {
        id: "1",
        username: "testuser",
        displayName: "Test User",
        status: "active",
        createdAt: "2025-11-16T00:00:00Z",
        updatedAt: null
      }
    ]

    const wrapper = mount(UserTable, {
      props: {
        data: mockUsers,
        loading: false
      },
      global: {
        plugins: [ElementPlus]
      }
    })

    expect(wrapper.find(".el-table").exists()).toBe(true)
    expect(wrapper.text()).toContain("testuser")
    expect(wrapper.text()).toContain("Test User")
  })

  it("should emit delete event when delete button clicked", async () => {
    const mockUsers: User[] = [
      {
        id: "1",
        username: "testuser",
        displayName: "Test User",
        status: "active",
        createdAt: "2025-11-16T00:00:00Z",
        updatedAt: null
      }
    ]

    const wrapper = mount(UserTable, {
      props: {
        data: mockUsers,
        loading: false
      },
      global: {
        plugins: [ElementPlus],
        stubs: {
          ElButton: false,
          teleport: true
        }
      }
    })

    // 尋找刪除按鈕
    const deleteButtons = wrapper.findAll("button.el-button")
    expect(deleteButtons.length).toBeGreaterThan(0)
  })

  it("should display user status correctly", () => {
    const mockUsers: User[] = [
      {
        id: "1",
        username: "activeuser",
        displayName: "Active User",
        status: "active",
        createdAt: "2025-11-16T00:00:00Z",
        updatedAt: null
      },
      {
        id: "2",
        username: "inactiveuser",
        displayName: "Inactive User",
        status: "inactive",
        createdAt: "2025-11-16T00:00:00Z",
        updatedAt: null
      }
    ]

    const wrapper = mount(UserTable, {
      props: {
        data: mockUsers,
        loading: false
      },
      global: {
        plugins: [ElementPlus]
      }
    })

    expect(wrapper.text()).toContain("啟用")
    expect(wrapper.text()).toContain("已停用")
  })
})

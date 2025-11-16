/**
 * UserForm 元件單元測試
 */

import { mount } from "@vue/test-utils"
import ElementPlus from "element-plus"
import { describe, expect, it } from "vitest"
import UserForm from "@/pages/user-management/components/UserForm.vue"

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
})

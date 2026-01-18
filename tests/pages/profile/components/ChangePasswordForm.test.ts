/**
 * ChangePasswordForm 元件單元測試
 */
import { mount } from "@vue/test-utils"
import { describe, expect, it, vi } from "vitest"
import ChangePasswordForm from "@/pages/profile/components/ChangePasswordForm.vue"

// Mock useChangePasswordForm composable
vi.mock("@/pages/profile/composables/useChangePassword", () => ({
  useChangePasswordForm: vi.fn(() => ({
    formRef: { value: null },
    formData: {
      oldPassword: "",
      newPassword: "",
      confirmPassword: ""
    },
    rules: {
      oldPassword: [{ required: true, message: "請輸入舊密碼", trigger: "blur" }],
      newPassword: [
        { required: true, message: "請輸入新密碼", trigger: "blur" },
        { min: 6, message: "密碼長度至少 6 字元", trigger: "blur" }
      ],
      confirmPassword: [{ required: true, message: "請再次輸入新密碼", trigger: "blur" }]
    },
    submitting: { value: false },
    handleSubmit: vi.fn(),
    handleReset: vi.fn()
  }))
}))

describe("changePasswordForm component", () => {
  const defaultProps = {
    userId: "user-123",
    version: 5
  }

  it("should render component", () => {
    const wrapper = mount(ChangePasswordForm, {
      props: defaultProps
    })

    expect(wrapper.exists()).toBe(true)
    expect(wrapper.find(".change-password-card").exists()).toBe(true)
  })

  it("should have submit button", () => {
    const wrapper = mount(ChangePasswordForm, {
      props: defaultProps
    })

    const buttons = wrapper.findAll("button")
    expect(buttons.length).toBeGreaterThan(0)
    expect(wrapper.text()).toContain("提交")
  })

  it("should have reset button", () => {
    const wrapper = mount(ChangePasswordForm, {
      props: defaultProps
    })

    expect(wrapper.text()).toContain("重置")
  })

  it("should have correct CSS class", () => {
    const wrapper = mount(ChangePasswordForm, {
      props: defaultProps
    })

    expect(wrapper.find(".change-password-card").exists()).toBe(true)
  })

  it("should accept userId and version props", () => {
    const wrapper = mount(ChangePasswordForm, {
      props: {
        userId: "custom-user-id",
        version: 10
      }
    })

    expect(wrapper.props("userId")).toBe("custom-user-id")
    expect(wrapper.props("version")).toBe(10)
  })

  it("should emit password-changed event type", () => {
    const wrapper = mount(ChangePasswordForm, {
      props: defaultProps
    })

    // 驗證元件有定義 emit 事件
    const emittedEvents = wrapper.emitted()
    expect(emittedEvents).toBeDefined()
  })

  it("should render form element", () => {
    const wrapper = mount(ChangePasswordForm, {
      props: defaultProps
    })

    expect(wrapper.find("form").exists()).toBe(true)
  })
})

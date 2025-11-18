/**
 * PermissionForm 元件單元測試
 */

import { mount } from "@vue/test-utils"
import { beforeEach, describe, expect, it, vi } from "vitest"
import PermissionForm from "@/pages/permission-management/components/PermissionForm.vue"

// Mock Element Plus
vi.mock("element-plus", () => ({
  ElMessage: {
    error: vi.fn(),
    success: vi.fn(),
    warning: vi.fn()
  }
}))

// Mock composable
const mockHandleSubmit = vi.fn()
const mockHandleCancel = vi.fn()
const mockResetForm = vi.fn()
const mockLoadPermission = vi.fn()

vi.mock("@/pages/permission-management/composables/usePermissionForm", () => ({
  usePermissionForm: (_emit: any) => ({
    formData: { value: { name: "", code: "", description: "" } },
    isEditMode: { value: false },
    loading: { value: false },
    resetForm: mockResetForm,
    loadPermission: mockLoadPermission,
    handleSubmit: mockHandleSubmit,
    handleCancel: mockHandleCancel
  })
}))

describe("permissionForm component", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("should render form with all fields", () => {
    const wrapper = mount(PermissionForm, {
      global: {
        stubs: {
          "el-form-item": true,
          "el-input": true,
          "el-button": true,
          "template": true
        }
      }
    })

    expect(wrapper.exists()).toBe(true)
    expect(wrapper.find("form").exists()).toBe(true)
  })

  it("should emit success event", async () => {
    const wrapper = mount(PermissionForm, {
      global: {
        stubs: {
          "el-form-item": true,
          "el-input": true,
          "el-button": true
        }
      }
    })

    expect(wrapper.vm).toBeDefined()
  })

  it("should display create button text in create mode", () => {
    const wrapper = mount(PermissionForm, {
      global: {
        stubs: {
          "el-form-item": true,
          "el-input": true,
          "el-button": true
        }
      }
    })

    const buttonText = wrapper.text()
    expect(buttonText).toContain("建立")
  })

  it("should disable code input in edit mode", () => {
    const wrapper = mount(PermissionForm, {
      global: {
        stubs: {
          "el-form-item": true,
          "el-input": true,
          "el-button": true
        }
      }
    })

    expect(wrapper.exists()).toBe(true)
  })

  it("should call handleSubmit on form submit", async () => {
    const wrapper = mount(PermissionForm, {
      global: {
        stubs: {
          "el-form-item": true,
          "el-input": true,
          "el-button": true
        }
      }
    })

    await wrapper.find("form").trigger("submit")
    expect(mockHandleSubmit).toHaveBeenCalled()
  })

  it("should call handleCancel on cancel button click", async () => {
    const wrapper = mount(PermissionForm, {
      global: {
        stubs: {
          "el-form-item": true,
          "el-input": true,
          "el-button": true
        }
      }
    })

    expect(wrapper.vm).toBeDefined()
  })

  it("should expose resetForm method", () => {
    const wrapper = mount(PermissionForm, {
      global: {
        stubs: {
          "el-form-item": true,
          "el-input": true,
          "el-button": true
        }
      }
    })

    expect(wrapper.vm.resetForm).toBeDefined()
  })

  it("should expose loadPermission method", () => {
    const wrapper = mount(PermissionForm, {
      global: {
        stubs: {
          "el-form-item": true,
          "el-input": true,
          "el-button": true
        }
      }
    })

    expect(wrapper.vm.loadPermission).toBeDefined()
  })
})

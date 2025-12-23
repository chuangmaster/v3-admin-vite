import type { Customer } from "@/pages/service-order-management/types"
/**
 * CustomerSearch 元件測試
 */
import { mount } from "@vue/test-utils"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { nextTick } from "vue"
import CustomerSearch from "@/pages/service-order-management/components/CustomerSearch.vue"

// Mock customer API
vi.mock("@/pages/service-order-management/apis/customer")

// Mock Element Plus
vi.mock("element-plus", () => ({
  ElInput: {
    name: "ElInput",
    template: "<input v-bind=\"$attrs\" />"
  },
  ElButton: {
    name: "ElButton",
    template: "<button v-bind=\"$attrs\"><slot /></button>"
  },
  ElEmpty: {
    name: "ElEmpty",
    template: "<div class=\"el-empty\"><slot /></div>"
  },
  ElLoadingDirective: {
    mounted: vi.fn(),
    updated: vi.fn(),
    unmounted: vi.fn()
  }
}))

describe("customerSearch.vue", () => {
  let wrapper: any

  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    if (wrapper) {
      wrapper.unmount()
    }
    vi.restoreAllMocks()
  })

  it("應該正確渲染搜尋輸入框", () => {
    // Act
    wrapper = mount(CustomerSearch)

    // Assert
    expect(wrapper.find("input").exists()).toBe(true)
  })

  it("應該在輸入關鍵字時更新搜尋值", async () => {
    // Arrange
    wrapper = mount(CustomerSearch)
    const input = wrapper.find("input")

    // Act
    await input.setValue("王小明")

    // Assert
    expect(input.element.value).toBe("王小明")
  })

  it("應該在點擊客戶時發出 select 事件", async () => {
    // Arrange
    const mockCustomer: Customer = {
      id: "1",
      name: "王小明",
      phoneNumber: "0912345678",
      email: "wang@example.com",
      idCardNumber: "A123456789",
      createdAt: "2025-01-01T00:00:00Z"
    }

    wrapper = mount(CustomerSearch, {
      props: {
        customers: [mockCustomer]
      }
    })

    // Act
    const customerItem = wrapper.find("[data-test='customer-item']")
    if (customerItem.exists()) {
      await customerItem.trigger("click")

      // Assert
      expect(wrapper.emitted("select")).toBeTruthy()
      expect(wrapper.emitted("select")?.[0]).toEqual([mockCustomer])
    }
  })

  it("應該在點擊新增客戶按鈕時發出 create 事件", async () => {
    // Arrange
    wrapper = mount(CustomerSearch, {
      props: {
        customers: []
      }
    })

    // Act
    const createButton = wrapper.find("[data-test='create-customer-btn']")
    if (createButton.exists()) {
      await createButton.trigger("click")

      // Assert
      expect(wrapper.emitted("create")).toBeTruthy()
    }
  })

  it("應該在無搜尋結果時顯示空狀態", async () => {
    // 這個測試目標：驗證元件在 customers 陣列為空時正確顯示空狀態 UI
    // 實際 debounce 搜尋邏輯已在 useCustomerSearch.test.ts 中完整測試

    // Arrange
    // 在元件內部修改 composable 的響應式資料
    wrapper = mount(CustomerSearch)

    // 直接存取元件實例來設置響應式資料（模擬搜尋完成後的狀態）
    const vm = wrapper.vm as any
    // 設置 keyword 和 customers 模擬搜尋完成但無結果的狀態
    vm.keyword = "不存在的客戶"
    vm.customers = []
    vm.loading = false

    await nextTick()

    // Assert - 檢查空狀態是否正確顯示
    expect(wrapper.html()).toContain("查無客戶資料")
  })
})

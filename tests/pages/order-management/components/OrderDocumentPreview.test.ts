/**
 * OrderDocumentPreview 元件單元測試
 */

import type { OrderDocumentData } from "@/pages/order-management/types"
import { mount } from "@vue/test-utils"
import { describe, expect, it, vi } from "vitest"
import { OrderType, PaymentMethod } from "@/pages/order-management/types"

// Mock fonts CSS
vi.mock("@/common/assets/fonts/fonts.css", () => ({}))

// Mock BrandBanner 元件
vi.mock("@/pages/order-management/components/BrandBanner.vue", () => ({
  default: { name: "BrandBanner", template: "<div class=\"brand-banner\">REAL YOU</div>" }
}))

// Mock @element-plus/icons-vue（包含 ElDialog 內部所需的 Close icon）
vi.mock("@element-plus/icons-vue", () => ({
  Printer: { name: "Printer", template: "<span />" },
  Close: { name: "Close", template: "<span />" }
}))

function createMockData(overrides?: Partial<OrderDocumentData>): OrderDocumentData {
  return {
    orderNumber: "RYO20260218001",
    orderDate: "2026-02-18T10:00:00Z",
    orderType: OrderType.PRE_ORDER,
    customerName: "測試客戶",
    customerPhone: "0912-345-678",
    customerLineId: "test_line",
    orderItems: [
      {
        id: "item-001",
        brandName: "CHANEL",
        productName: "Classic Flap Bag",
        productStyle: "Black Lambskin",
        accessories: null,
        quantity: 1,
        unitPrice: 250000
      }
    ],
    paymentRecords: [
      {
        id: "pay-001",
        paymentDate: "2026-02-18T11:00:00Z",
        paymentAmount: 125000,
        paymentMethod: PaymentMethod.BANK_TRANSFER,
        bankAccountLastFive: "12345"
      }
    ],
    totalAmount: 250000,
    paidAmount: 125000,
    ...overrides
  }
}

async function mountComponent(props: { visible: boolean, data: OrderDocumentData | null }) {
  const { default: OrderDocumentPreview } = await import(
    "@/pages/order-management/components/OrderDocumentPreview.vue"
  )

  return mount(OrderDocumentPreview, {
    props
  })
}

describe("orderDocumentPreview", () => {
  it("應正確渲染訂購人資訊", async () => {
    const data = createMockData()
    const wrapper = await mountComponent({ visible: true, data })

    expect(wrapper.text()).toContain("測試客戶")
    expect(wrapper.text()).toContain("0912-345-678")
    expect(wrapper.text()).toContain("test_line")
    expect(wrapper.text()).toContain("12345")
    expect(wrapper.text()).toContain("RYO20260218001")
  })

  it("預購訂單不應顯示配件欄位", async () => {
    const data = createMockData({
      orderType: OrderType.PRE_ORDER,
      orderItems: [
        {
          id: "item-001",
          brandName: "CHANEL",
          productName: "Classic Flap Bag",
          productStyle: "Black",
          accessories: null,
          quantity: 1,
          unitPrice: 250000
        }
      ]
    })

    const wrapper = await mountComponent({ visible: true, data })
    expect(wrapper.text()).not.toContain("配件")
  })

  it("現貨訂單應顯示配件欄位", async () => {
    const data = createMockData({
      orderType: OrderType.SPOT_PURCHASE,
      orderItems: [
        {
          id: "item-002",
          brandName: "LOUIS VUITTON",
          productName: "Neverfull MM",
          productStyle: "Monogram Canvas",
          accessories: ["box", "dustBag"],
          quantity: 1,
          unitPrice: 180000
        }
      ]
    })

    const wrapper = await mountComponent({ visible: true, data })
    expect(wrapper.text()).toContain("配件")
    expect(wrapper.text()).toContain("盒子")
    expect(wrapper.text()).toContain("防塵袋")
  })

  it("line ID 為空時顯示「-」", async () => {
    const data = createMockData({
      customerLineId: null
    })

    const wrapper = await mountComponent({ visible: true, data })
    const items = wrapper.findAll(".el-descriptions-item")
    const lineIdItem = items.find(item => item.attributes("data-label") === "Line ID")

    expect(lineIdItem?.text()).toContain("-")
  })

  it("點擊列印按鈕應觸發 print 事件", async () => {
    const data = createMockData()
    const wrapper = await mountComponent({ visible: true, data })

    // 全域 mock 的 ElDialog 不渲染 footer slot，直接透過 component instance 驗證 emit
    ;(wrapper.vm as unknown as { handlePrint: () => void }).handlePrint()
    expect(wrapper.emitted("print")).toBeTruthy()
  })

  it("無付款紀錄時顯示「尚無付款紀錄」", async () => {
    const data = createMockData({ paymentRecords: [] })
    const wrapper = await mountComponent({ visible: true, data })

    expect(wrapper.text()).toContain("尚無付款紀錄")
  })

  it("應顯示定金須知內容", async () => {
    const data = createMockData()
    const wrapper = await mountComponent({ visible: true, data })

    expect(wrapper.text()).toContain("商品預購定金須知")
    expect(wrapper.text()).toContain("REALYOU")
  })

  it("應正確顯示金額摘要", async () => {
    const data = createMockData({
      totalAmount: 300000,
      paidAmount: 150000
    })
    const wrapper = await mountComponent({ visible: true, data })

    expect(wrapper.text()).toContain("NT$ 300,000")
    expect(wrapper.text()).toContain("NT$ 150,000")
  })
})

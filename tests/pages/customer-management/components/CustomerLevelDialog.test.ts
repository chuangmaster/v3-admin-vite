import { shallowMount } from "@vue/test-utils"
import dayjs from "dayjs"
import { describe, expect, it, vi } from "vitest"
import { defineComponent, h, nextTick } from "vue"

import CustomerLevelDialog from "@/pages/customer-management/components/CustomerLevelDialog.vue"

interface DateShortcut {
  text: string
  value: unknown
}

const ElDatePickerStub = defineComponent({
  name: "ElDatePicker",
  props: {
    modelValue: {
      type: null,
      default: null
    },
    shortcuts: {
      type: Array,
      default: undefined
    }
  },
  emits: ["update:modelValue"],
  setup(props, { emit }) {
    const shortcuts = (props.shortcuts ?? []) as unknown as DateShortcut[]

    return () =>
      h(
        "div",
        { class: "el-date-picker-stub" },
        shortcuts.map(shortcut =>
          h(
            "button",
            {
              "type": "button",
              "data-shortcut": shortcut.text,
              "onClick": () => {
                let value: unknown = shortcut.value
                if (typeof shortcut.value === "function") {
                  value = (shortcut.value as () => unknown)()
                }
                emit("update:modelValue", value)
              }
            },
            shortcut.text
          )
        )
      )
  }
})

describe("customer level dialog - date shortcuts", () => {
  it("should correctly compute endDate shortcuts based on startDate", async () => {
    // Mock 全域 ElMessage
    ;(globalThis as any).ElMessage = {
      success: vi.fn(),
      error: vi.fn(),
      warning: vi.fn(),
      info: vi.fn()
    }

    const wrapper = shallowMount(CustomerLevelDialog, {
      props: {
        modelValue: true,
        mode: "create",
        customerId: "customer-1",
        loading: false
      },
      global: {
        stubs: {
          ElDialog: {
            template: "<div v-if='modelValue'><slot /><slot name='footer' /></div>",
            props: ["modelValue"]
          },
          ElForm: { template: "<form><slot /></form>" },
          ElFormItem: { template: "<div><slot /></div>" },
          ElSelect: { template: "<div><slot /></div>" },
          ElOption: { template: "<div />" },
          ElButton: { template: "<button><slot /></button>" },
          ElAlert: { template: "<div><slot /></div>" },
          ElTag: { template: "<span><slot /></span>" },
          ElDatePicker: ElDatePickerStub
        }
      }
    })

    await nextTick()

    // 測試組件內部 dateShortcuts 計算邏輯
    const component = wrapper.vm as any
    expect(component.dateShortcuts).toBeDefined()
    expect(Array.isArray(component.dateShortcuts)).toBe(true)
    expect(component.dateShortcuts.length).toBeGreaterThan(0)

    // 設定開始日期
    const startDate = new Date(2026, 1, 1) // 2026-02-01
    component.form.startDate = startDate
    await nextTick()

    // 獲取"一年"快捷方式並測試其計算邏輯
    const oneYearShortcut = component.dateShortcuts.find((s: any) => s.text === "一年")
    expect(oneYearShortcut).toBeDefined()

    // 執行快捷方式的函數
    const computedEndDate = typeof oneYearShortcut.value === "function"
      ? oneYearShortcut.value()
      : oneYearShortcut.value

    // 驗證計算結果
    const expectedEnd = dayjs(startDate).add(1, "year").subtract(1, "day").toDate()
    expect(dayjs(computedEndDate).isSame(expectedEnd, "day")).toBe(true)
  })
})

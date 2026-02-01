import { mount } from "@vue/test-utils"
import dayjs from "dayjs"
import { describe, expect, it } from "vitest"
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
  it("clicking shortcut sets endDate based on startDate", async () => {
    const wrapper = mount(CustomerLevelDialog, {
      props: {
        modelValue: true,
        mode: "create",
        customerId: "customer-1",
        loading: false
      },
      global: {
        stubs: {
          ElDialog: { template: "<div><slot /><slot name=\"footer\" /></div>" },
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

    const datePickers = wrapper.findAllComponents({ name: "ElDatePicker" })
    expect(datePickers).toHaveLength(2)

    const startDate = new Date(2026, 1, 1) // 2026-02-01 (local)
    datePickers[0].vm.$emit("update:modelValue", startDate)
    await nextTick()

    const shortcutBtn = datePickers[1].find("button[data-shortcut=\"一年\"]")
    await shortcutBtn.trigger("click")
    await nextTick()

    const endValue = datePickers[1].props("modelValue") as Date
    const expectedEnd = dayjs(startDate).add(1, "year").subtract(1, "day").toDate()

    expect(dayjs(endValue).isSame(expectedEnd, "day")).toBe(true)
  })
})

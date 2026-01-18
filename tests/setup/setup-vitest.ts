import { createPinia, setActivePinia } from "pinia"
import { vi } from "vitest"
import { h } from "vue"

// 在測試環境啟動一個全域的 Pinia 實例，避免呼叫 getActivePinia() 時找不到
setActivePinia(createPinia())

// Mock element-plus 常見匯出（元件與指令）
vi.mock("element-plus", () => {
  const ElMessage = Object.assign(vi.fn(), {
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
    info: vi.fn()
  })

  // helper to create simple wrapper components that render slots and a class name
  const makeWrapper = (className: string) => (props: any, { slots }: any) => h("div", { class: className }, slots.default ? slots.default({ row: {} }) : null)
  const makeInput = (className = "el-input") => (props: any) => h("input", { class: className, value: props.modelValue })
  const makeFormWithMethods = (className = "el-form") => {
    return {
      name: "MockElForm",
      setup(_: any, { slots, expose }: any) {
        expose({ resetFields: () => {}, validate: () => Promise.resolve(true) })
        return () => h("form", { class: className }, slots.default ? slots.default() : null)
      }
    }
  }

  return {
    // 基本元件（以簡單可搜尋的 DOM class 呈現，以利 test-utils 查找）
    ElTable: makeWrapper("el-table"),
    ElTableColumn: makeWrapper("el-table-column"),
    ElButton: (props: any, { slots }: any) => h("button", { class: "el-button" }, slots.default ? slots.default() : null),
    ElTag: makeWrapper("el-tag"),
    ElEmpty: makeWrapper("el-empty"),
    ElInput: makeInput("el-input"),
    ElForm: makeFormWithMethods("el-form"),
    ElFormItem: makeWrapper("el-form-item"),
    ElSelect: makeWrapper("el-select"),
    ElOption: makeWrapper("el-option"),
    ElSwitch: makeWrapper("el-switch"),
    ElPagination: makeWrapper("el-pagination"),
    ElDialog: makeWrapper("el-dialog"),
    ElCard: makeWrapper("el-card"),
    ElIcon: makeWrapper("el-icon"),
    ElTooltip: makeWrapper("el-tooltip"),
    ElPopover: makeWrapper("el-popover"),
    ElTabs: makeWrapper("el-tabs"),
    ElTabPane: makeWrapper("el-tab-pane"),
    ElDescriptions: makeWrapper("el-descriptions"),
    ElDescriptionsItem: (props: any, { slots }: any) => h("div", { "class": "el-descriptions-item", "data-label": props.label }, slots.default ? slots.default() : null),
    ElRow: makeWrapper("el-row"),
    ElCol: makeWrapper("el-col"),

    // loading / directives
    ElLoading: { name: "ElLoading" },
    ElLoadingDirective: { mounted: () => {}, unmounted: () => {} },
    vLoading: { mounted: () => {}, unmounted: () => {} },
    ElScrollbar: { name: "ElScrollbar" },

    // 全域提示與對話框（支援函式呼叫與 method spy）
    ElMessage,
    ElMessageBox: {
      confirm: vi.fn().mockResolvedValue(true),
      alert: vi.fn().mockResolvedValue(true),
      prompt: vi.fn().mockResolvedValue(true)
    },

    ElBadge: { name: "ElBadge" },

    // 提供預設安裝函式，避免測試中安裝 plugin 時出錯
    default: {
      install: (_app: any) => {
        const comps: Record<string, any> = {
          ElTable: { name: "ElTable" },
          ElTableColumn: { name: "ElTableColumn" },
          ElButton: { name: "ElButton" },
          ElTag: { name: "ElTag" },
          ElEmpty: { name: "ElEmpty" },
          ElInput: { name: "ElInput" },
          ElForm: { name: "ElForm" },
          ElFormItem: { name: "ElFormItem" },
          ElSelect: { name: "ElSelect" },
          ElOption: { name: "ElOption" },
          ElSwitch: { name: "ElSwitch" },
          ElPagination: { name: "ElPagination" },
          ElDialog: { name: "ElDialog" },
          ElCard: { name: "ElCard" },
          ElIcon: { name: "ElIcon" },
          ElTooltip: { name: "ElTooltip" },
          ElPopover: { name: "ElPopover" },
          ElTabs: { name: "ElTabs" },
          ElTabPane: { name: "ElTabPane" },
          ElBadge: { name: "ElBadge" },
          ElDescriptions: { name: "ElDescriptions" },
          ElDescriptionsItem: { name: "ElDescriptionsItem" },
          ElRow: { name: "ElRow" },
          ElCol: { name: "ElCol" }
        }
        Object.entries(comps).forEach(([k, v]) => {
          try {
            _app.component(k, v)
          } catch {
            // ignore in tests
          }
        })
        try {
          _app.directive("loading", { mounted: () => {}, unmounted: () => {} })
        } catch {
          // ignore
        }
      }
    }
  }
})

// Mock vue-i18n 的 useI18n 與提供 install，避免需要真正註冊 plugin
vi.mock("vue-i18n", async () => {
  const actual = await vi.importActual<any>("vue-i18n").catch(() => ({}))
  return {
    ...actual,
    useI18n: () => ({ t: (k: string) => k }),
    // 提供 default install 以支援 app.use(…) 的呼叫
    default: {
      install: (_app: any) => {
        try {
          // noop
        } catch {
          // ignore
        }
      }
    }
  }
})

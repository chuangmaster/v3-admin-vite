import i18n from "@/i18n"

/** 项目标题 */
const VITE_APP_TITLE = import.meta.env.VITE_APP_TITLE ?? "V3 Admin Vite"

/** 动态标题 */
const dynamicTitle = ref<string>("")

/** 當前路由的標題資料 */
const currentTitleData = ref<string | Record<string, string> | undefined>()

/** 根據指定的 locale 取得路由標題 */
function getRouteTitleWithLocale(
  title: string | Record<string, string> | undefined,
  locale: string
): string {
  if (!title) return ""
  if (typeof title === "string") return title

  // 將 locale (如 "zh-TW") 轉換為對應的 key 格式 (如 "zhTW")
  let key = locale
  if (key === "zh-TW") key = "zhTW"
  if (key === "zh-CN") key = "zhCN"

  return (
    title[key]
    || title.zhTW
    || title.zhCN
    || title["zh-CN"]
    || Object.values(title)[0]
    || ""
  )
}

/** 设置标题 */
function setTitle(title?: string | Record<string, string>) {
  currentTitleData.value = title
}

// 使用 watchEffect 自動追蹤依賴並更新標題
watchEffect(() => {
  // 讀取當前語言(建立響應式依賴)
  const locale = (i18n.global.locale as any).value
  // 讀取當前標題資料(建立響應式依賴)
  const titleData = currentTitleData.value

  // 重新計算標題 - 直接傳遞 locale 確保響應式追蹤
  if (titleData) {
    const titleString = getRouteTitleWithLocale(titleData, locale)
    dynamicTitle.value = titleString
      ? `${VITE_APP_TITLE} | ${titleString}`
      : VITE_APP_TITLE
  } else {
    dynamicTitle.value = VITE_APP_TITLE
  }
})

// 监听标题变化並更新 document.title
watch(dynamicTitle, (value, oldValue) => {
  if (document && value !== oldValue) {
    document.title = value
  }
})

/** 标题 Composable */
export function useTitle() {
  return { setTitle }
}

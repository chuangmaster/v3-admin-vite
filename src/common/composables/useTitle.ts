/** 项目标题 */
const VITE_APP_TITLE = import.meta.env.VITE_APP_TITLE ?? "V3 Admin Vite"

/** 动态标题 */
const dynamicTitle = ref<string>("")

/** 设置标题 */
function setTitle(title?: string | Record<string, string>) {
  let titleString: string | undefined
  if (typeof title === "string") {
    titleString = title
  } else if (title && typeof title === "object") {
    titleString = Object.values(title)[0] as string
  }
  dynamicTitle.value = titleString ? `${VITE_APP_TITLE} | ${titleString}` : VITE_APP_TITLE
}

// 监听标题变化
watch(dynamicTitle, (value, oldValue) => {
  if (document && value !== oldValue) {
    document.title = value
  }
})

/** 标题 Composable */
export function useTitle() {
  return { setTitle }
}

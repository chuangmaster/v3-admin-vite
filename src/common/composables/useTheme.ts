import { getActiveThemeName, setActiveThemeName } from "@@/utils/cache/local-storage"
import { setCssVar } from "@@/utils/css"

const DEFAULT_THEME_NAME = "normal"

type DefaultThemeName = typeof DEFAULT_THEME_NAME

/** 註冊的主題名稱，其中 DefaultThemeName 是必填的 */
export type ThemeName = DefaultThemeName | "dark" | "dark-blue"

interface ThemeList {
  title: string
  name: ThemeName
}

/** 主題列表 */
const themeList: ThemeList[] = [
  {
    title: "預設",
    name: DEFAULT_THEME_NAME
  },
  {
    title: "深色",
    name: "dark"
  },
  {
    title: "深藍",
    name: "dark-blue"
  }
]

/** 正在套用的主題名稱 */
const activeThemeName = ref<ThemeName>(getActiveThemeName() || DEFAULT_THEME_NAME)

/** 設定主題 */
function setTheme({ clientX, clientY }: MouseEvent, value: ThemeName) {
  const maxRadius = Math.hypot(
    Math.max(clientX, window.innerWidth - clientX),
    Math.max(clientY, window.innerHeight - clientY)
  )
  setCssVar("--v3-theme-x", `${clientX}px`)
  setCssVar("--v3-theme-y", `${clientY}px`)
  setCssVar("--v3-theme-r", `${maxRadius}px`)
  const handler = () => {
    activeThemeName.value = value
  }
  document.startViewTransition ? document.startViewTransition(handler) : handler()
}

/** 在 html 根元素上挂载 class */
function addHtmlClass(value: ThemeName) {
  document.documentElement.classList.add(value)
}

/** 在 html 根元素上移除其他主題的 class */
function removeHtmlClass(value: ThemeName) {
  const otherThemeNameList = themeList.map(item => item.name).filter(name => name !== value)
  document.documentElement.classList.remove(...otherThemeNameList)
}

/** 初始化 */
function initTheme() {
  // 使用 watchEffect 收集副作用
  watchEffect(() => {
    const value = activeThemeName.value
    removeHtmlClass(value)
    addHtmlClass(value)
    setActiveThemeName(value)
  })
}

/** 主題 Composable */
export function useTheme() {
  return { themeList, activeThemeName, initTheme, setTheme }
}

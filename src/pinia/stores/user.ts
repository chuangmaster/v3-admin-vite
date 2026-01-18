import { getCurrentUserApi } from "@@/apis/users"
import { setToken as _setToken, getToken, removeToken } from "@@/utils/cache/cookies"
import { pinia } from "@/pinia"
import { resetRouter } from "@/router"
import { routerConfig } from "@/router/config"
import { useSettingsStore } from "./settings"
import { useTagsViewStore } from "./tags-view"

export const useUserStore = defineStore("user", () => {
  const token = ref<string>(getToken() || "")

  const roles = ref<string[]>([])
  const permissions = ref<string[]>([])

  /** 用戶 ID（來自 API） */
  const userId = ref<string>("")
  /** 用戶帳號（登入名稱） */
  const account = ref<string>("")
  /** 用戶顯示名稱 */
  const displayName = ref<string>("")
  /** 資料版本號（用於併發控制） */
  const version = ref<number>(0)

  const tagsViewStore = useTagsViewStore()

  const settingsStore = useSettingsStore()

  // 设置 Token
  const setToken = (value: string) => {
    _setToken(value)
    token.value = value
  }

  // 獲取用戶詳情
  const getInfo = async () => {
    const { data } = await getCurrentUserApi()
    userId.value = data?.id || ""
    account.value = data?.account || ""
    displayName.value = data?.displayName || ""
    version.value = data?.version ?? 0
    // 驗證返回的 roles 是否為一個非空陣列（保留用於向後兼容）
    roles.value = data?.roles ?? []
    // 驗證返回的 permissions 是否為一個非空陣列，否則塞入一個沒有任何作用的默認權限，防止路由守衛邏輯進入無限循環
    permissions.value = (data?.permissions?.length ?? 0) > 0 ? data!.permissions : routerConfig.defaultPermissions
  }

  // 模拟角色变化
  const changeRoles = (role: string) => {
    const newToken = `token-${role}`
    token.value = newToken
    _setToken(newToken)
    // 用刷新页面代替重新登录
    location.reload()
  }

  // 登出
  const logout = () => {
    removeToken()
    token.value = ""
    roles.value = []
    permissions.value = []
    resetRouter()
    resetTagsView()
  }

  // 重置 Token
  const resetToken = () => {
    removeToken()
    token.value = ""
    roles.value = []
    permissions.value = []
  }

  // 重置 Visited Views 和 Cached Views
  const resetTagsView = () => {
    if (!settingsStore.cacheTagsView) {
      tagsViewStore.delAllVisitedViews()
      tagsViewStore.delAllCachedViews()
    }
  }

  return { token, roles, permissions, userId, account, displayName, version, setToken, getInfo, changeRoles, logout, resetToken }
})

/**
 * @description 在 SPA 应用中可用于在 pinia 实例被激活前使用 store
 * @description 在 SSR 应用中可用于在 setup 外使用 store
 */
export function useUserStoreOutside() {
  return useUserStore(pinia)
}

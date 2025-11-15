import type { AxiosInstance, AxiosRequestConfig } from "axios"
import {
  API_CODE_I18N_KEY_MAP,
  RELOGIN_API_CODES,
  SUCCESS_API_CODES
} from "@@/constants/api-code"
import { getToken } from "@@/utils/cache/cookies"
import axios from "axios"
import { get, merge } from "lodash-es"
import i18n from "@/i18n"
import { useUserStore } from "@/pinia/stores/user"

/** 登出並強制重新整理頁面（會重新導向到登入頁） */
function logout() {
  useUserStore().logout()
  location.reload()
}

/** 建立請求實例 */
function createInstance() {
  // 建立一個 axios 實例命名為 instance
  const instance = axios.create()
  // 請求攔截器
  instance.interceptors.request.use(
    // 發送之前
    config => config,
    // 發送失敗
    error => Promise.reject(error)
  )
  // 響應攔截器（可根據具體業務作出相應的調整）
  instance.interceptors.response.use(
    (response) => {
      // 使用全局 i18n 實例
      const t = i18n.global.t
      // apiData 是 api 回傳的資料
      const apiData = response.data
      // 二進制資料則直接回傳
      const responseType = response.config.responseType
      if (responseType === "blob" || responseType === "arraybuffer") return apiData
      // 這個 code 是和後端約定的業務 code
      const code = apiData.code
      // 如果沒有 code，代表這不是專案後端開發的 api
      if (code === undefined) {
        ElMessage.error(t("api.invalidInterface"))
        return Promise.reject(new Error(t("api.invalidInterface")))
      }

      // 判斷是否為成功狀態
      if (SUCCESS_API_CODES.has(code)) {
        return apiData
      }

      // 判斷是否需要重新登入
      if (RELOGIN_API_CODES.has(code)) {
        const i18nKey = API_CODE_I18N_KEY_MAP[code]
        const errorMessage = i18nKey ? t(i18nKey) : (apiData.message || t("api.unauthorized"))
        ElMessage.error(errorMessage)
        return logout()
      }

      // 其他業務錯誤
      const i18nKey = API_CODE_I18N_KEY_MAP[code]
      const errorMessage = i18nKey ? t(i18nKey) : (apiData.message || "Error")
      ElMessage.error(errorMessage)
      return Promise.reject(new Error(errorMessage))
    },
    (error) => {
      const status = get(error, "response.status")
      const message = get(error, "response.data.message")

      error.message = message || `HTTP ${status}`

      if (status === 401) {
        logout()
      }

      ElMessage.error(error.message)
      return Promise.reject(error)
    }
  )
  return instance
}

/** 建立請求方法 */
function createRequest(instance: AxiosInstance) {
  return <T>(config: AxiosRequestConfig): Promise<T> => {
    const token = getToken()
    // 預設配置
    const defaultConfig: AxiosRequestConfig = {
      // 介面位址
      baseURL: import.meta.env.VITE_BASE_URL,
      // 請求標頭
      headers: {
        // 攜帶 Token
        "Authorization": token ? `Bearer ${token}` : undefined,
        "Content-Type": "application/json"
      },
      // 請求主體
      data: {},
      // 請求逾時
      timeout: 5000,
      // 跨域請求時是否攜帶 Cookies
      withCredentials: false
    }
    // 將預設配置 defaultConfig 和傳入的自訂配置 config 進行合併成為 mergeConfig
    const mergeConfig = merge(defaultConfig, config)
    return instance(mergeConfig)
  }
}

/** 用於請求的實例 */
const instance = createInstance()

/** 用於請求的方法 */
export const request = createRequest(instance)

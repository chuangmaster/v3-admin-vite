import { createI18n } from "vue-i18n"
import en from "./locales/en"
import zhCN from "./locales/zh-CN"
import zhTW from "./locales/zh-TW"

export type MessageSchema = typeof zhTW

const messages = {
  "zh-TW": zhTW,
  "zh-CN": zhCN,
  en
}

// 從 localStorage 中獲取語言設定，預設為繁體中文
function getLanguageFromStorage(): string {
  const stored = localStorage.getItem("app-language")
  return stored || "zh-TW"
}

const options = {
  legacy: false,
  locale: getLanguageFromStorage(),
  fallbackLocale: "zh-TW",
  messages,
  globalInjection: true
}

const i18n = createI18n(options)

export default i18n

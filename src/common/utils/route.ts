import i18n from "@/i18n"

/**
 * 將路由 title 物件轉換為當前語言對應的字串
 * @param title - 路由 title 物件或字串 (如 { zhCN: "首页", zhTW: "首頁", en: "Dashboard" } 或 "首页")
 * @returns 當前語言對應的標題字串
 */
export function getRouteTitle(title: string | Record<string, string> | undefined): string {
  if (!title) return ""
  if (typeof title === "string") return title

  // 使用 i18n.global.locale.value 來取得當前語言（可在組件外部使用）
  const locale = (i18n.global.locale as any).value || i18n.global.locale

  // 將 locale (如 "zh-TW") 轉換為對應的 key 格式 (如 "zhTW")
  let key = locale
  if (key === "zh-TW") key = "zhTW"
  if (key === "zh-CN") key = "zhCN"

  return title[key] || title.zhCN || title["zh-CN"] || Object.values(title)[0] || ""
}

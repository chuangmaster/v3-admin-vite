import dayjs from "dayjs"
import timezone from "dayjs/plugin/timezone"
import utc from "dayjs/plugin/utc"

// 啟用 dayjs 時區插件
dayjs.extend(utc)
dayjs.extend(timezone)

const INVALID_DATE = "N/A"

/**
 * 格式化日期時間
 * @param datetime - 日期時間（ISO 8601 字串、時間戳或 Date 物件）
 * @param template - 格式模板
 * @returns 格式化後的日期時間字串（使用瀏覽器本地時區）
 */
export function formatDateTime(datetime?: string | number | Date | null, template: string = "YYYY-MM-DD HH:mm:ss") {
  if (!datetime) return INVALID_DATE

  // dayjs 會自動將 ISO 8601 字串轉換為本地時區
  const day = dayjs(datetime)
  return day.isValid() ? day.format(template) : INVALID_DATE
}

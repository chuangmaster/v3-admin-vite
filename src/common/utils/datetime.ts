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

/**
 * 將日期字串轉換為 UTC+0 的 ISO String
 * @param dateString - 日期字串（YYYY-MM-DD 格式）
 * @param endOfDay - 是否為當天結束時間（23:59:59），預設為開始時間（00:00:00）
 * @returns UTC+0 的 ISO String 格式
 */
export function toUTC0ISOString(dateString: string, endOfDay: boolean = false): string {
  const time = endOfDay ? "23:59:59" : "00:00:00"
  // 使用 dayjs 解析日期並設定為 UTC+0
  return dayjs.utc(`${dateString} ${time}`, "YYYY-MM-DD HH:mm:ss").toISOString()
}

/**
 * 將日期格式化為 YYYY-MM-DD（本地時區）
 * @param date - 日期（Date、ISO 字串或時間戳）
 * @returns YYYY-MM-DD
 */
export function formatDateOnly(date: string | number | Date): string {
  return dayjs(date).format("YYYY-MM-DD")
}

/**
 * 取得「今天往前 N 天」的日期區間（YYYY-MM-DD）
 * @param daysBack - 往前天數
 * @returns [startDate, endDate]
 */
export function getRecentDateRange(daysBack: number): [string, string] {
  const end = dayjs()
  const start = end.subtract(daysBack, "day")
  return [start.format("YYYY-MM-DD"), end.format("YYYY-MM-DD")]
}
